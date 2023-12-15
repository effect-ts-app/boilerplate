const makeBase = require("../../.eslintrc.packages.base.cjs")
const base = makeBase(__dirname, true, "tsconfig.json")
module.exports = {
  root: true,
  ...base,
}
