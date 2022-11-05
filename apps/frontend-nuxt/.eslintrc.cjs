const makeBase = require("../../.eslintrc.base")

const base = makeBase(__dirname)
module.exports = {
  ...base,
  "parser": "vue-eslint-parser",
  extends: ["plugin:vue/vue3-recommended", ...base.extends]
  // plugins: base.plugins.concat(["formatjs"]),
  // rules: {
  //   ...base.rules,
  //   "formatjs/enforce-placeholders": "error",
  // },
}
