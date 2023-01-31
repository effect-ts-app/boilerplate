/// <reference types="vitest" />
import path from "path"
import fs from "fs"
import { effectPlugin } from "@effect-app/compiler/vitePlugin2"
import { UserConfig } from "vite"

export default function makeConfig(dirName?: string, useDist = process.env.TEST_USE_DIST === "true"): UserConfig {

  return {
    plugins: useDist ? [] : [effectPlugin({})],
    test: {
      include: useDist ? ["./dist/**/*.test.js"] : ["./_src/**/*.test.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"],
      exclude: ["./_test/**/*"],
      reporters: "verbose",
      globals: true,
      deps: useDist ? { inline: [new RegExp(dirName + "/dist")], } : undefined,
    },
    resolve: dirName
      ? {
        alias: {
          [JSON.parse(fs.readFileSync(dirName + "/package.json", "utf-8")).name]: path.resolve(dirName, useDist ? "/dist" : "/_src")
        } }
      : undefined,
  }
}
