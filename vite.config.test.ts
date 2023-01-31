/// <reference types="vitest" />
import { effectPlugin } from "@effect-app/compiler/vitePlugin2"
import makeConfig from "./vite.config.base"
import AutoImport from "unplugin-auto-import/vite"

export default function makeTestConfig(dirName?: string, useDist = process.env.TEST_USE_DIST === "true") {
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
    plugins: [effectPlugin({ tsconfig: "tsconfig.test.json" }), autoImport],
    test: {...b.test, 
      include: ["./_test/**/*.test.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"],
      exclude: []
    },
    //watchExclude: ["**/node_modules/**"],
    //forceRerunTriggers: ['**/package.json/**', '**/vitest.config.*/**', '**/vite.config.*/**', '**/dist/**']
  }
  //console.log("cfg", cfg)
  return cfg
}
