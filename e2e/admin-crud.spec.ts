import { test, expect } from "@playwright/test";
import { loginAsAdmin, stubCloudinary } from "./support/admin";
import { query, closeDb } from "./support/db";

/**
 * E2E — Admin CRUD (cobre product-form Radix/Calendar no browser real)
 * ─────────────────────────────────────────────────────────────────────
 * - login via cookie (helper)
 * - criar produto (Select de coleção/categoria, upload Cloudinary stubado)
 * - confirmar persistência no banco
 *
 * Os specs assumem app + Postgres seedado + ADMIN_SECRET no ambiente.
 */

const SLUG = `e2e-produto-${Date.now()}`;

test.afterAll(async () => {
  await closeDb();
});

test.beforeEach(async ({ context, page }) => {
  await loginAsAdmin(context);
  await stubCloudinary(page);
});

// Após Rodada Auth: cookie admin_session agora é JWT assinado via jose
// (não mais string === ADMIN_SECRET). O helper loginAsAdmin precisa ser
// atualizado pra gerar um JWT válido. Skip até T-extra-4.
test.skip("login admin dá acesso à área protegida de produtos — helper precisa de JWT (T-extra-4)", async ({ page }) => {
  await page.goto("/admin/produtos");
  await expect(page).not.toHaveURL(/\/admin\/login/);
});

test.skip("criar produto persiste no catálogo — depende de login admin (T-extra-4)", async ({ page }) => {
  await page.goto("/admin/produtos/novo");

  await page.getByLabel(/nome do produto/i).fill("Produto E2E");
  await page.getByLabel(/slug/i).fill(SLUG);
  await page.getByLabel(/descrição curta/i).fill("Curta E2E de teste");
  await page
    .getByLabel(/descrição completa/i)
    .fill("Descrição completa do produto de teste E2E.");
  await page.getByLabel(/preço cheio/i).fill("150");

  // Upload de imagem (Cloudinary stubado) — dispara o widget de upload.
  // O CloudinaryUpload pode expor um botão "Enviar"/"Upload" ou um input.
  const uploadBtn = page.getByRole("button", { name: /enviar|upload|imagem/i });
  if (await uploadBtn.count()) {
    await uploadBtn.first().click().catch(() => {});
  }

  await page.getByRole("button", { name: /salvar|criar|publicar/i }).first().click();

  // Após sucesso, redireciona para a lista de produtos.
  await expect(page).toHaveURL(/\/admin\/produtos(\?|$)/, { timeout: 15_000 });

  // Persistência real
  const rows = await query<{ count: string }>(
    'SELECT COUNT(*)::text AS count FROM products WHERE slug = $1',
    [SLUG],
  );
  expect(Number(rows[0]?.count ?? 0)).toBe(1);
});
