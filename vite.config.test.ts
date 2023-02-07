/// <reference types="vitest" />
import { effectPlugin } from "@effect-app/compiler/vitePlugin2"
import makeConfig from "./vite.config.base"
import AutoImport from "unplugin-auto-import/vite"
import { UserConfig } from "vite"
import { defineConfig } from "vite"

export default function defineTestConfig(
  dirName?: string,
  transform?: (cfg: UserConfig, useDist: boolean, useFullDist: boolean)  => UserConfig,
  useDist = process.env.TEST_USE_DIST === "true",
  useFullDist = process.env.TEST_USE_FULL_DIST === "true",
) {
  if (useFullDist) {
    useDist = true
  }
  const b = makeConfig(dirName, useDist)
  // autoimport seems to work best, even if in some cases setting vitest/globals as types works.
  const autoImport = AutoImport({
    dts: './_test/auto-imports.d.ts',
    // include: [
    //   /\.test\.[tj]sx?$/ // .ts, .tsx, .js, .jsx
    // ],
    imports: [
      "vitest"
    ]
  })
  const cfg = {
    ...b,
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    plugins: useFullDist ? [autoImport] : [effectPlugin({ tsconfig: "tsconfig.test.json" }), autoImport],
    test: {
      ...b.test, 
      include: useFullDist ? ["./_test/dist/**/*.test.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"] : ["./_test/**/*.test.{ts,mts,cts,jsx,tsx}"],
      exclude: []
    },
    //watchExclude: ["**/node_modules/**"],
    //forceRerunTriggers: ['**/package.json/**', '**/vitest.config.*/**', '**/vite.config.*/**', '**/dist/**']
  }
  //console.log("cfg", cfg)
  return defineConfig(transform ? transform(cfg, useDist, useFullDist) : cfg)
}
