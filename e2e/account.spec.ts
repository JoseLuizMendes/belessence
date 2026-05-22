import { test, expect } from "@playwright/test";

/**
 * E2E — Meus Pedidos (/meus-pedidos)
 * Sem auth: form de email → lista pedidos do email (?email=).
 */

test.describe("Meus Pedidos", () => {
  test("sem email mostra o formulário de busca", async ({ page }) => {
    await page.goto("/meus-pedidos");
    await expect(page.getByPlaceholder(/voce@email\.com/i)).toBeVisible();
  });

  test("buscar por email navega com ?email= na URL", async ({ page }) => {
    await page.goto("/meus-pedidos");
    await page.getByPlaceholder(/voce@email\.com/i).fill("ninguem@belessence.test");
    await page.getByRole("button", { name: /buscar|ver pedidos|consultar/i })
      .first()
      .click();
    await expect(page).toHaveURL(/email=/);
  });
});
