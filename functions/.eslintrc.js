
module.exports = {
  root: true,
  env: {
    es6: true,
    node: true,
  },
  extends: [
    "eslint:recommended",
    "plugin:import/errors",
    "plugin:import/warnings",
    "plugin:import/typescript",
    "google",
    "plugin:@typescript-eslint/recommended",
  ],
  parser: "@typescript-eslint/parser",
  parserOptions: {
    project: ["tsconfig.json", "tsconfig.dev.json"],
    sourceType: "module",
    ecmaVersion: 2022,
  },
  ignorePatterns: [
    "/lib/**/*", // Ignore built files.
    "/coverage/**/*", // Ignore coverage reports
  ],
  // Removed "eslint-plugin-require-jsdoc" from plugins
  plugins: ["@typescript-eslint", "import"],
  rules: {
    "quotes": ["error", "double"],
    "import/no-unresolved": 0,
    "indent": ["error", 2],
    "max-len": ["error", {"code": 80}],
    "object-curly-spacing": ["error", "never"],
    "operator-linebreak": ["error", "before"],
    "@typescript-eslint/no-unused-vars": [
      "warn",
      {argsIgnorePattern: "^_"},
    ],
    "@typescript-eslint/no-explicit-any": "warn",
    // "require-jsdoc": "off", // Rule itself is also removed
    // "valid-jsdoc": "off" // Rule itself is also removed
  },
  settings: {
    "import/resolver": {
      node: {extensions: [".js", ".jsx", ".ts", ".tsx"]},
    },
  },
};
