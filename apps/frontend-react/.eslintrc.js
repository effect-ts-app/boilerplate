const makeBase = require("../../.eslintrc.base")

const base = makeBase(__dirname)

module.exports = {
  ...base,

  extends: [
    ...base.extends.filter(x => x !== "plugin:prettier/recommended" && x !== "plugin:@phaphoso/dprint/recommended"),
    "plugin:@next/next/recommended",
    "plugin:react/recommended",
    "plugin:react-hooks/recommended",
    //"plugin:prettier/recommended" // Enables eslint-plugin-prettier and displays prettier errors as ESLint errors. Make sure this is always the last configuration in the extends array.
    "plugin:@phaphoso/dprint/recommended"
  ],
  plugins: base.plugins.concat(["formatjs"]),
  settings: {
    ...base.settings,
    react: {
      version: "detect", // Tells eslint-plugin-react to automatically detect the version of React to use
    },
  },
  rules: {
    ...base.rules,
    "formatjs/enforce-id": [
      "error",
      {
        "idInterpolationPattern": "[sha512:contenthash:base64:6]"
      }
    ],
    "no-restricted-imports": [
      "error",
      {
        paths: base.rules["no-restricted-imports"][1].paths.concat([
          {
            name: "@mui/material",
            importNames: ["styled"],
            message: "Please use ze import from '@/styles/theme'",
          },
        ]),
      },
    ],
    "react/prop-types": "off",
    "react/display-name": "off",

    ...base.parserOptions.enableTS ? {"@typescript-eslint/no-floating-promises": "warn" } : {}
  },
}
