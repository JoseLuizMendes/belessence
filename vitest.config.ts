import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
    coverage: {
      provider: "v8",
      reporter: ["text", "text-summary", "json-summary", "html"],
      include: ["src/**/*.{ts,tsx}"],
      exclude: [
        "src/test/**",
        "src/**/*.d.ts",
        // Código gerado (Prisma client)
        "src/generated/**",
        // Primitivos shadcn/Radix — código de terceiros, exercitados via uso
        "src/components/ui/**",
        // RSC sem lógica unitária — domínio de E2E (Playwright)
        "src/app/**/{layout,page,loading,error,not-found,template}.tsx",
        "src/middleware.ts",
        // Wiring de provider / SVG estático
        "src/components/providers/**",
        // Singleton Prisma (mockado nos testes) e wrappers de SDK externo
        "src/lib/prisma.ts",
        "src/components/admin/cloudinary-upload.tsx",
        // Helpers de animação GSAP (efeito visual, sem assert significativo)
        "src/lib/gsap-utils.ts",
      ],
      // Thresholds — abaixo dos números atuais (~93/86/83) para dar folga,
      // mas altos o bastante para falhar o CI em regressão real de cobertura.
      // Teto de unit: o restante (corpos de animação GSAP, branches Radix
      // Select/Calendar) só é exercitado no browser real → coberto por E2E.
      // Subir conforme a cobertura cresce; nunca baixar sem justificativa.
      thresholds: {
        statements: 90,
        branches: 84,
        functions: 82,
        lines: 90,
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
