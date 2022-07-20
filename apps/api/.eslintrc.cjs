const makeBase = require("../../.eslintrc.base")
const base = makeBase(__dirname)
module.exports = {
  ...base,
  plugins: base.plugins.concat(["formatjs"]),
  rules: {
    ...base.rules,
    "formatjs/enforce-placeholders": "error",
  },
}
