/// <reference types="vitest" />

import { defineConfig } from "vite"
import makeConfig from "../../../vite.config.base"

const base = makeConfig(__dirname)
export default defineConfig({ ...base, test: { ...base.test, setupFiles: "_src/setup.ts" } })
