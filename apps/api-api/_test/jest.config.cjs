const config = require("../../../jest.config.base.cjs")(
  __dirname + "/tsconfig.json",
  undefined,
  true
)

const COMPILED = !!process.env.TEST_COMPILED

const moduleNameMapper = {
  ["^@/(.*)$"]: COMPILED
    ? "<rootDir>/../dist/$1"
    : "<rootDir>/../_src/$1",

  ...Object.entries(config.moduleNameMapper).reduce((prev, [key, value]) => {
    prev[key] = (COMPILED
      ? value.replace("/../_src/$1", "/../dist/$1")
      : value).replace("<rootDir>", "<rootDir>/..")
      .replace("<rootDir>/../../dist", "<rootDir>/../dist")
      .replace("<rootDir>/../../_src", "<rootDir>/../_src")
    return prev
  }, {}),
  // ["^../apps/api/(.*)$"]: COMPILED
  //   ? "<rootDir>/../dist/$1"
  //   : "<rootDir>/../_src/$1",
  ["^@effect-ts-app/boilerplate-api-api/(.*)$"]: COMPILED
    ? "<rootDir>/../dist/$1"
    : "<rootDir>/../_src/$1",
  ["^@effect-ts-app/boilerplate-api-api$"]: COMPILED
    ? "<rootDir>/../dist"
    : "<rootDir>/../_src"
}
// console.log(JSON.stringify({ moduleNameMapper, original: config.moduleNameMapper }, undefined, 2))

module.exports = {
  ...config,
  moduleNameMapper
}
