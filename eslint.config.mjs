import { defineConfig, globalIgnores } from 'eslint/config';
import tsEslint from "typescript-eslint";
import tsEslintPlugin from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';
import eslintConfigPrettier from "eslint-config-prettier/flat";

export default defineConfig([
  globalIgnores( ["**/node_modules", "**/.next", "grist-plugin-api.d.ts"] ),
  nextVitals,
  nextTs,
  eslintConfigPrettier,
  tsEslint.configs.recommended,
  {
    plugins: {
      "@typescript-eslint": tsEslintPlugin,
    },

    languageOptions: {
      parser: tsParser,
    },

    rules: {
      curly: ["error", "all"],
      "react/no-unescaped-entities": "off",

      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          varsIgnorePattern: "^_",
          argsIgnorePattern: "^_",
          ignoreRestSiblings: true,
        },
      ],
      "@typescript-eslint/no-explicit-any": "off", // FIXME: could be enabled at some point?
    },
  },
]);
