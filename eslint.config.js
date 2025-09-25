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
    files: ["apps/**/{src,pages,components,lib}/**/*.{ts,tsx}", "apps/**/*.ts"],
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
];
