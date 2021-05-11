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

    // typescript, prettier
    "plugin:prettier/recommended",

    // everything else

    "plugin:promise/recommended",

    "plugin:eslint-comments/recommended",
  ],
  parserOptions: {
    sourceType: "module",
  },
  rules: {
    "no-console": "off",
    "no-plusplus": "off",
    "no-restricted-syntax": "off",
    "promise/no-nesting": "off",
    "promise/always-return": "off",
  },
};
