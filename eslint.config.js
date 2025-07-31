import eslint from "@eslint/js";
import importPlugin from "eslint-plugin-import";
import prettier from "eslint-plugin-prettier";
import tseslint from "typescript-eslint";
import reactHooks from "eslint-plugin-react-hooks";

export default [
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    ignores: ["public/**", ".react-router/**", "scripts/**", "build/**", "dist/**"],
  },
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      parser: tseslint.parser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
      },
    },
    plugins: {
      "@typescript-eslint": tseslint.plugin,
      prettier: prettier,
      import: importPlugin,
      "react-hooks": reactHooks,
    },
    settings: {
      "import/resolver": {
        typescript: true
      },
      "import/internal-regex": "^@(lib|services|components|hooks|types|pages|contexts|data|routes)/",
      "import/external-regex": "^(?!@(lib|services|components|hooks|types|pages|contexts|data|routes)/)"
    },
    rules: {
      // React Hooks
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",

      // Import rules
      "import/order": [
        "error",
        {
          groups: ["builtin", "external", "internal", "parent", "sibling", "index"],
          "newlines-between": "always",
          alphabetize: {
            order: "asc",
            caseInsensitive: true,
          },
        }
      ],

      // Prettier rules
      "padding-line-between-statements": [
        "error",
        {
          blankLine: "always",
          prev: "*",
          next: "return",
        },
        {
          blankLine: "always",
          prev: "*",
          next: "throw",
        },
        {
          blankLine: "always",
          prev: "multiline-block-like",
          next: "*",
        },
      ],
      curly: ["error", "all"],
      "prettier/prettier": "error",
      "@typescript-eslint/consistent-type-imports": [
        "error",
        {
          prefer: "type-imports",
          disallowTypeAnnotations: false,
          fixStyle: "separate-type-imports",
        },
      ],
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
];
