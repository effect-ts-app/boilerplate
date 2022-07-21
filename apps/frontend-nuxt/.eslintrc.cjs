const makeBase = require("../../.eslintrc.base")
const base = makeBase(__dirname, false)

module.exports = {
  ...base,
  rules: {
    ...base.rules,
    "@typescript-eslint/no-empty-interface": "off"
  }
}
