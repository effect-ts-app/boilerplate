const config = require("../../jest.config.base.cjs")(
  __dirname + "/tsconfig.json",
  undefined,
  true
)

const COMPILED = !!process.env.TEST_COMPILED

module.exports = {
  ...config,
  moduleNameMapper: {
    ...config.moduleNameMapper,
    ["^@effect-ts-app/boilerplate-api/(.*)$"]: COMPILED ? "<rootDir>/dist/$1" : "<rootDir>/_src/$1",
    ["^@effect-ts-app/boilerplate-api$"]: COMPILED ? "<rootDir>/dist" : "<rootDir>/_src"
  }
}
