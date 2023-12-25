const makeBase = require("../.eslintrc.base.cjs")

module.exports = {
  root: true,
  ...makeBase(__dirname, true),
}
