/// <reference types="vitest" />
import defineTestConfig from "../../vite.config.test"

export default defineTestConfig(
  __dirname,
  (base, useDist, useFullDist) => ({
    ...base,
    test: { ...base.test, setupFiles: useFullDist ? "./_test/dist/setup.js" : "./_test/setup.ts" }
  })
)
