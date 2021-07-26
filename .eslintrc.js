module.exports = {
  root: true,
  env: {
    node: true,
    mongo: true,
  },
  extends: [
    // base
    "eslint:recommended",
    "airbnb-base",

    "plugin:prettier/recommended",

    "plugin:promise/recommended",

    "plugin:eslint-comments/recommended",
  ],
  parserOptions: {
    sourceType: "module",
    ecmaVersion: 2020,
  },
  rules: {
    "no-console": "off", // i will eventually add a logger
    "no-plusplus": "off", // i have no need for this rule
    "no-restricted-syntax": "off", // forces you to use forEach instead of forloops, so if you want to return anything yea gl on that
    "promise/no-nesting": "off", // makes sense but its litteraly only 2 lines that are being warned
    "promise/always-return": "off", // dumb as shit, forces you to ALWAYS return something in .then
  },
};
