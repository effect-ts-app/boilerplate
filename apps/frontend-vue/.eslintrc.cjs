const makeBase = require("../../.eslintrc.base")

const base = makeBase(__dirname, false)

/* eslint-env node */
require("@rushstack/eslint-patch/modern-module-resolution")

module.exports = {
  ...base,
  rules: {
    ...base.rules,
    "@typescript-eslint/no-empty-interface": "off"
  },
  "root": true,
  "extends": [
    "plugin:vue/vue3-essential",
    "eslint:recommended",
    "@vue/eslint-config-typescript/recommended",
    "plugin:@typescript-eslint/eslint-recommended",
    "plugin:@typescript-eslint/recommended",
    // enableTS ? "plugin:@typescript-eslint/recommended-requiring-type-checking" : null,
    // "plugin:jest/recommended",
    // "plugin:prettier/recommended", // Enables eslint-plugin-prettier and displays prettier errors as ESLint errors. Make sure this is always the last configuration in the extends array.
    "plugin:@phaphoso/dprint/recommended"
  ]
}
