import { test, expect } from "@playwright/test";

/**
 * Smoke — Busca
 * O campo de busca do header (desktop) redireciona para
 * /allProducts?q=<termo> ao submeter.
 */

test.describe("Busca", () => {
  test("submeter um termo redireciona para /allProducts?q=", async ({
    page,
    isMobile,
  }) => {
    // No desktop, o campo está sempre visível no header (hidden md:flex).
    // No mobile, ele está dentro do Sheet menu — comportamento diferente que
    // exige abrir o menu primeiro. Cobertura mobile fica num spec dedicado
    // se/quando precisar. Aqui pulamos pra não falsamente falhar.
    test.skip(isMobile, "Busca via header é desktop-only (mobile usa menu Sheet)");

    await page.goto("/");

    const search = page.getByLabel(/buscar produtos/i).first();
    await search.fill("velvet");
    await search.press("Enter");

    await expect(page).toHaveURL(/\/allProducts\?q=velvet/i);
  });
});
