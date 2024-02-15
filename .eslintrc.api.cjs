const makeBase = require("./.eslintrc.base.cjs")

const base = makeBase(__dirname, true, "tsconfig.api.json")
module.exports = {
  root: true,
  ...base,
  plugins: base.plugins.concat(["formatjs"]),
  rules: {
    ...base.rules,
    "codegen/codegen": ["error", { presets: require("@effect-app/eslint-codegen-model") }],
    "@typescript-eslint/no-empty-interface": "off"
  }
}
