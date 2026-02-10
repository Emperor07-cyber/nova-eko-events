module.exports = {
  env: {
    node: true,   // ✅ Enable Node.js globals
    es2021: true, // ✅ Modern JS
  },
  extends: ["eslint:recommended"],
  parserOptions: {
    ecmaVersion: "latest",
  },
  rules: {},
};
