/// <reference types="vitest" />
import { defineConfig } from "vite"
import makeConfig from "../../vite.config.test"

const base = makeConfig(__dirname)
export default defineConfig(
  { ...base, test: { ...base.test, setupFiles: "./_test/setup.ts" } }
)
