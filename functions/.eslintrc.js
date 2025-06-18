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
  plugins: ["@typescript-eslint", "import", "require-jsdoc"],
  rules: {
    "quotes": ["error", "double"],
    "import/no-unresolved": 0,
    "indent": ["error", 2],
    "max-len": ["error", {"code": 80}],
    "require-jsdoc": [
      "warn",
      {
        require: {
          FunctionDeclaration: true,
          MethodDefinition: true,
          ClassDeclaration: true,
          ArrowFunctionExpression: false, 
          FunctionExpression: true,
        },
      },
    ],
    "valid-jsdoc": [
      "warn",
      {
        prefer: {
          return: "returns",
        },
        requireReturn: false, 
        requireParamDescription: false, 
        requireReturnDescription: false, 
      },
    ],
    "object-curly-spacing": ["error", "never"],
    "operator-linebreak": ["error", "before"],
    "@typescript-eslint/no-unused-vars": [
      "warn",
      {argsIgnorePattern: "^_"},
    ],
    "@typescript-eslint/no-explicit-any": "warn", 
  },
  settings: {
    "import/resolver": {
      node: {
        extensions: [".js", ".jsx", ".ts", ".tsx"],
      },
    },
  },
};
