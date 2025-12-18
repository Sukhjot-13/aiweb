import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";

const eslintConfig = defineConfig([
  ...nextVitals,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  {
    // Custom architectural rules for the AI Web Automation Platform
    rules: {
      // Prevent deep imports (enforce proper module boundaries)
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["**/../../*"],
              message:
                "Deep imports are forbidden. Use absolute imports or reorganize code.",
            },
            {
              group: ["*/providers/*"],
              message:
                "Controllers cannot import providers directly. Use repositories or services.",
            },
          ],
        },
      ],

      // Enforce consistent code practices
      "no-console": ["warn", { allow: ["warn", "error", "info"] }],
      "prefer-const": "error",
      "no-var": "error",

      // Prevent common mistakes
      "no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
        },
      ],

      // Next.js specific overrides
      "@next/next/no-html-link-for-pages": "off",
    },
  },
]);

export default eslintConfig;
