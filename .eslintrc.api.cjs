const makeBase = require("./.eslintrc.base.cjs")
const base = makeBase(__dirname, undefined, "tsconfig.api.json")
module.exports = {
  root: true,
  ...base,
  plugins: base.plugins.concat(["formatjs"]),
}
