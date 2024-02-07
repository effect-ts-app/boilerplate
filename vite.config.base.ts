/// <reference types="vitest" />
import { effectPlugin } from "@effect-app/compiler/vitePlugin2"
import fs from "fs"
import path from "path"
import type { UserConfig } from "vite"

export default function makeConfig(
  dirName?: string,
  useDist = process.env.TEST_USE_DIST === "true",
  useTransform = true
): UserConfig {
  const d = dirName ? dirName + "/" : ""
  return {
    plugins: useDist
      ? []
      : useTransform
      ? [effectPlugin({ tsconfig: dirName ? d + "tsconfig.json" : undefined })]
      : [],
    test: {
      include: useDist ? ["./dist/**/*.test.js"] : ["./_src/**/*.test.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"],
      exclude: ["./_test/**/*"],
      reporters: "verbose",
      globals: true,
      deps: useDist ? { inline: [new RegExp(dirName + "/dist")] } : undefined
    },
    resolve: dirName
      ? {
        alias: {
          [JSON.parse(fs.readFileSync(dirName + "/package.json", "utf-8")).name]: path.join(
            dirName,
            useDist ? "/dist" : "/_src"
          )
        }
      }
      : undefined
  }
}
