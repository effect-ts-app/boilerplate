const makeBase = require("../../.eslintrc.vue")

module.exports = {
  root: true,
  ...makeBase(__dirname),
  overrides: [
    {
      files: ["pages/**/*.vue"],
      rules: {
        "vue/multi-word-component-names": "off",
      },
    },
  ],
}
