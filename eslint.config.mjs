import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Artefatos de teste/cobertura — não lintar
    "coverage/**",
    "playwright-report/**",
    "test-results/**",
    // Scratch de agentes/tooling (skills, scripts auxiliares) — fora do app
    ".agents/**",
    ".claude/**",
  ]),
]);

export default eslintConfig;
