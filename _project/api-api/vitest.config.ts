/// <reference types="vitest" />
import { defineConfig } from "vite"
import makeConfig from "../../vite.config.test"

export default defineConfig(makeConfig(__dirname))
