const makeBase = require("./.eslintrc.base.cjs")

const base = makeBase(__dirname, undefined, "tsconfig.all2.json")
module.exports = {
  root: true,
  ...base,
  plugins: base.plugins.concat(["formatjs"]),
  rules: {
    ...base.rules,
    "codegen/codegen": ["error", { presets: require("@effect-app/eslint-codegen-model") }]
  }
}
