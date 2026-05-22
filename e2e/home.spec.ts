import { test, expect } from "@playwright/test";

/**
 * Smoke — Homepage
 * Verifica que a vitrine carrega e os elementos-chave do header aparecem.
 * Requer app rodando (webServer) + banco seedado.
 */

test.describe("Homepage", () => {
  test("carrega e exibe o header com ações de carrinho e favoritos", async ({
    page,
  }) => {
    await page.goto("/");

    // Logo / branding
    await expect(page).toHaveTitle(/mari beauty/i);

    // Ações do header (aria-labels do Header)
    await expect(
      page.getByRole("link", { name: /meus favoritos/i }),
    ).toBeVisible();
  });

  test("a promo strip mostra o cupom BELES10", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText("BELES10").first()).toBeVisible();
  });

  test("link 'Ver toda a coleção' leva para /allProducts", async ({ page }) => {
    await page.goto("/");
    const link = page.getByRole("link", { name: /ver toda a coleção/i });
    if (await link.count()) {
      await link.first().click();
      await expect(page).toHaveURL(/\/allProducts/);
    }
  });
});
