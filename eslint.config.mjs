// Root ESLint flat config
export default [
  {
    ignores: [
      "**/node_modules/**",
      "**/.next/**",
      "**/dist/**",
      "**/build/**"
    ],
  },
  {
    files: ["apps/**/{src,pages,components,lib,features,shared}/**/*.{ts,tsx}", "apps/**/*.ts"],
    languageOptions: {
      parser: await import("@typescript-eslint/parser").then(m => m.default || m),
      parserOptions: {
        sourceType: "module",
        ecmaVersion: "latest",
      },
    },
    plugins: {
      "@typescript-eslint": (await import("@typescript-eslint/eslint-plugin")).default,
    },
    rules: {
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": "off",
    },
  },
  // Feature boundary rules: prevent cross-feature deep imports
  {
    files: ["apps/frontend/features/**/*.{ts,tsx}"],
    languageOptions: {
      parser: await import("@typescript-eslint/parser").then(m => m.default || m),
      parserOptions: {
        sourceType: "module",
        ecmaVersion: "latest",
      },
    },
    plugins: {
      "@typescript-eslint": (await import("@typescript-eslint/eslint-plugin")).default,
    },
    rules: {
      "no-restricted-imports": ["warn", {
        patterns: [
          {
            group: ["../../../features/*/api/*", "../../../features/*/model/*", "../../../features/*/ui/*", "../../../features/*/hooks/*"],
            message: "Import from the feature's public API (index.ts barrel) instead of deep-importing internal modules."
          },
          {
            group: ["../../*/api/*", "../../*/model/*", "../../*/ui/*", "../../*/hooks/*"],
            message: "Import from the feature's public API (index.ts barrel) instead of deep-importing internal modules."
          }
        ]
      }],
    },
  },
  // Shared layer must not import from features
  {
    files: ["apps/frontend/shared/**/*.{ts,tsx}"],
    languageOptions: {
      parser: await import("@typescript-eslint/parser").then(m => m.default || m),
      parserOptions: {
        sourceType: "module",
        ecmaVersion: "latest",
      },
    },
    plugins: {
      "@typescript-eslint": (await import("@typescript-eslint/eslint-plugin")).default,
    },
    rules: {
      "no-restricted-imports": ["error", {
        patterns: [
          {
            group: ["../../features/*", "../../features/**"],
            message: "The shared layer must not import from feature modules. Move shared code to shared/ instead."
          }
        ]
      }],
    },
  },
];
