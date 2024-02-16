/// <reference types="vitest" />
import { defineConfig } from "vite"
import makeConfig from "../vite.config.base"

const cfg = makeConfig(__dirname)
// console.log("cfg", cfg)
export default defineConfig(cfg)
