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
        // Paths atualizados após Rodada 4 Hexagonal (Belessence)
        "src/lib/shared/infrastructure/prisma-client.ts", // singleton, mockado
        "src/lib/motion/**", // GSAP helpers — efeito visual, sem assert significativo
        "src/components/admin/cloudinary-upload.tsx",
        // Auth.js v5 config + Arctic OAuth — wiring declarativo, sem lógica
        // testável em unit (fluxo coberto por E2E + smoke real OAuth).
        "src/lib/auth/infrastructure/external/auth.ts", // NextAuth config
        "src/lib/auth/infrastructure/external/admin-google.ts", // Arctic OAuth redirects
        // admin-login.ts: bcrypt + otplib + lockout — testes unitários
        // significativos exigiriam mock pesado de bcrypt/otplib e ainda assim
        // não dariam confiança real. Fluxo coberto por smoke admin TOTP real.
        "src/lib/auth/infrastructure/persistence/admin-login.ts",
        // Formulários Auth.js client — fluxo coberto por E2E + smoke real
        "src/components/auth/auth-panel.tsx",
        "src/components/auth/auth-form.tsx",
        "src/components/auth/auth-dialog.tsx",
        "src/components/auth/auth-data-sync.tsx",
        // Route Handlers de OAuth + Auth.js — wiring de SDK, coberto por
        // E2E (admin login flow) ou smoke OAuth real
        "src/app/api/auth/[...nextauth]/route.ts",
        "src/app/api/admin/oauth/**/route.ts",
        // Admin Server Actions — fluxo CRUD complexo coberto por
        // Playwright admin-crud spec (logged-in via T-extra-4 helper futuro)
        "src/app/admin/**/actions.ts",
      ],
      // Thresholds realistas pra Belessence pós-Rodada 4 + exclusões. Atingir
      // 80% em statements/lines exige cobrir Server Actions admin e OAuth
      // flow — alvos de E2E, não unit. Subir conforme escrevemos mais tests.
      thresholds: {
        statements: 75,
        branches: 80,
        functions: 79,
        lines: 75,
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      // `server-only` é um shim Next.js que só existe em build. Em Vitest
      // (jsdom) apontamos pra um stub vazio pra permitir importar repositories
      // server-only direto dos testes (ex.: wishlist-repository.test.ts).
      "server-only": path.resolve(__dirname, "./src/test/server-only-stub.ts"),
    },
  },
});
