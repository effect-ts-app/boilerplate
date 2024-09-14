const makeBase = require("../.eslintrc.base.cjs")
const base = makeBase(__dirname, false, "tsconfig.json")
module.exports = {
  root: true,
  ...makeBase(__dirname),
  rules: {
    ...base.rules,
    "codegen/codegen": ["error", { presets: require("@effect-app/eslint-codegen-model") }]
  }
}
