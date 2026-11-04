import js from "@eslint/js";
import { defineConfig } from "eslint/config";
import globals from "globals";

export default defineConfig([
  {
    files: ["**/*.js"],
    plugins: { js },
    extends: ["js/recommended"],
    languageOptions: {
      globals: globals.browser,
    },
    rules: {
      "no-console": "warn",
    },
  },
  {
    files: ["test/**/*.js"],
    rules: {
      "no-unused-vars": "off",
    },
  },
]);
