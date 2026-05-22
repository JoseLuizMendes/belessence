import { test, expect } from "@playwright/test";

/**
 * Smoke — Busca
 * O campo de busca do header (desktop) redireciona para
 * /allProducts?q=<termo> ao submeter.
 */

test.describe("Busca", () => {
  test("submeter um termo redireciona para /allProducts?q=", async ({
    page,
  }) => {
    await page.goto("/");

    const search = page.getByLabel(/buscar produtos/i).first();
    await search.fill("velvet");
    await search.press("Enter");

    await expect(page).toHaveURL(/\/allProducts\?q=velvet/i);
  });
});
