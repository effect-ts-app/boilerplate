const { pathsToModuleNameMapper } = require("ts-jest")
const path = require("path")
const fs = require("fs")

const ts = require("typescript")

module.exports = (tsconfigPath, mapSrcTo = "/dist", requiresTs = false) => { 
  const cfg = ts.readConfigFile(tsconfigPath, (fn) => fs.readFileSync(fn, "utf-8"))
  const basePath = path.dirname(tsconfigPath); // equal to "getDirectoryPath" from ts, at least in our case.
  const parsedConfig = ts.parseJsonConfigFileContent(cfg.config, ts.sys, basePath);

  const COMPILED = !!process.env.TEST_COMPILED

  const yayPaths = {
    "@effect-ts-app/boilerplate-client/*": [
      "../../packages/client/_src/*"
    ],
    "@effect-ts-app/boilerplate-types/*": [
      "../../packages/types/_src/*"
    ],
    "@effect-ts-app/boilerplate-prelude/*": [
      "../../packages/prelude/_src/*"
    ],
    "@effect-ts-app/boilerplate-prelude": [
      "../../packages/prelude/_src"
    ]
  }

  const modules = parsedConfig.options?.paths ? pathsToModuleNameMapper({ ...yayPaths, ...parsedConfig.options.paths }, {
    prefix: "<rootDir>/",
  }) : undefined

  const moduleNameMapper = modules && (COMPILED ?  Object.entries(
    modules
  ).reduce((prev, [key, value]) => {
    // if (!key.startsWith("^@/")) {
    //   return prev
    // }
    // "/src"
    prev[key] = value.endsWith("/$1") ? value.replace("/src/", "/").replace("/_src/", "/").replace("/$1", mapSrcTo + "/$1") : (value.replace("/src", "").replace("/_src", "") + mapSrcTo)
    return prev
  }, {}) : Object.entries(modules).reduce((prev, [key, value]) => {
    if (!key.startsWith("^@/")) {
      return prev
    }
    prev[key] = value
    return prev
  }, {}))

  //console.log(JSON.stringify(moduleNameMapper, undefined, 2))

  return {
    cacheDirectory: "./.jest-cache",
    globals: {
      "ts-jest": {
        useESM: true,
        diagnostics: false,
        tsconfig: {
          noEmit: true,
        },
      },
    },
    extensionsToTreatAsEsm: [".ts"],
    moduleNameMapper,
    preset: COMPILED || !requiresTs ? undefined : 'ts-jest/presets/default-esm',
    moduleFileExtensions: COMPILED ? [ 'js', 'jsx', 'json', 'node', 'mjs' ] : ['js', 'jsx', 'ts', 'tsx', 'mts', 'json', 'node' ],
    setupFiles: [__dirname + "/jest.polyfill"],
    testRegex: COMPILED ? "(/__tests__/.*|/dist/.*(\\.|/)(test|spec))\\.(jsx?|mjs)$" : "(/__tests__/.*|/_src/.*(\\.|/)(test|spec))\\.tsx?$",
    modulePathIgnorePatterns: ["<rootDir>/_test/"],
    transform: COMPILED ? {
      "\\.m?[jt]sx?$": "@swc/jest",    // The esbuild transformer makes changes not come up immediately in wallaby
    } : requiresTs ? {
      
    } : {
      "\\.m?[jt]sx?$": "@swc/jest",    // The esbuild transformer makes changes not come up immediately in wallaby
    },
    watchPathIgnorePatterns: [".tsbuildinfo", ".jest-cache", "dist"],
  }
}