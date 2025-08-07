module.exports = {
  root: true,
  env: {
    node: true,
    browser: true,
  },
  ignorePatterns: [".eslintrc.js", "tailwind.config.js", "next.config.js"],
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    // "prettier",
    "plugin:prettier/recommended",
    "next/core-web-vitals",
  ],
  parser: "@typescript-eslint/parser",
  parserOptions: {
    project: ["./tsconfig.json"],
    tsconfigRootDir: __dirname,
    sourceType: "module",
    babelOptions: {
      presets: [require.resolve("next/babel")],
    },
  },
  plugins: ["@typescript-eslint/eslint-plugin"],
  rules: {
    // Add any additional rules or overrides specific to your project
    "prettier/prettier": ["error", { endOfLine: "auto" }],
    "@typescript-eslint/no-unused-vars": "error",
    "@typescript-eslint/no-empty-interface": "off",
  },
};
