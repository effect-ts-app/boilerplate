const makeBase = require("./.eslintrc.base")
module.exports = (...args) => {
  const base = makeBase(...args)
  return {...base, 
    plugins: base.plugins.concat(["formatjs"]),
  rules: {
    ...base.rules,
    'codegen/codegen': ['error', { presets: require('@effect-app/eslint-codegen-model') }],
    "@typescript-eslint/no-empty-interface": "off"
  },}
}