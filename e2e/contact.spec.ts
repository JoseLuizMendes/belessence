import { test, expect } from "@playwright/test";
import { query, closeDb } from "./support/db";

/**
 * E2E — Contato (/contato)
 * Submete o form e valida que a mensagem foi persistida em contact_messages.
 */

const EMAIL = `contato+${Date.now()}@belessence.test`;

test.afterAll(async () => {
  await closeDb();
});

test("envia mensagem de contato e persiste no banco", async ({ page }) => {
  await page.goto("/contato");

  await page.getByLabel(/^nome$/i).fill("Visitante E2E");
  await page.getByLabel(/^email$/i).fill(EMAIL);
  await page.getByLabel(/^assunto$/i).fill("Dúvida sobre entrega");
  await page
    .getByLabel(/^mensagem$/i)
    .fill("Gostaria de saber o prazo de entrega para minha região.");

  await page.getByRole("button", { name: /enviar mensagem/i }).click();

  // Toast de sucesso
  await expect(page.getByText(/mensagem enviada/i)).toBeVisible();

  // Persistência real
  const rows = await query<{ count: string }>(
    'SELECT COUNT(*)::text AS count FROM contact_messages WHERE email = $1',
    [EMAIL],
  );
  expect(Number(rows[0]?.count ?? 0)).toBe(1);
});
