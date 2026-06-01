import "dotenv/config";
import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright — Belessence E2E
 * ─────────────────────────────────────────────────────────────────────
 * Fluxos ponta-a-ponta da vitrine pública e do admin.
 *
 * Pré-requisitos para rodar localmente:
 *   1. Postgres acessível via DATABASE_URL (.env)
 *   2. Banco migrado + seedado:  pnpm prisma migrate deploy && pnpm prisma db seed
 *   3. ADMIN_SECRET definido no ambiente (usado pelo login admin)
 *
 * O `webServer` abaixo sobe o app automaticamente (reaproveita um já rodando).
 * Em CI, prefira `pnpm build && pnpm start` para testar o bundle de produção.
 */

const PORT = Number(process.env.E2E_PORT ?? 3000);
const BASE_URL = process.env.E2E_BASE_URL ?? `http://localhost:${PORT}`;

export default defineConfig({
  testDir: "./e2e",
  // Cada spec roda isolado; paralelismo por arquivo.
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "list",

  timeout: 30_000,
  expect: { timeout: 5_000 },

  use: {
    baseURL: BASE_URL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    locale: "pt-BR",
  },

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "mobile",
      use: { ...devices["Pixel 7"] },
    },
  ],

  // Sobe o app se nenhum estiver rodando no BASE_URL.
  webServer: {
    command: process.env.CI ? "pnpm build && pnpm start" : "pnpm dev",
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
