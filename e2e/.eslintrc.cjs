const makeBase = require("../.eslintrc.base")

module.exports = {
  root: true,
  ...makeBase(__dirname, true),
}
