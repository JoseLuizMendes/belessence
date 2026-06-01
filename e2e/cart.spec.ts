import { test, expect } from "@playwright/test";

/**
 * Smoke — Carrinho (client-side Zustand + persist)
 * Adiciona um produto e confirma que a gaveta do carrinho abre com o item.
 * Requer ao menos 1 produto comprável (em estoque, status NORMAL) no seed.
 */

test.describe("Carrinho", () => {
  // Spec original assumia cart sem auth. Após Rodada Auth (ERR-2026-0006), cart
  // é privado por usuário e exige login. Testar o fluxo completo requer login
  // programático (cookie Auth.js JWT) — registrado como T-extra-4 (helper
  // loginAsUser em e2e/support/) pra próxima rodada. Por ora, skip com nota.
  test.skip("adicionar produto abre a gaveta e mostra o item — requer login programático (T-extra-4)", async ({ page }) => {
    await page.goto("/allProducts");
    const addButton = page.getByRole("button", { name: /adicionar .* ao carrinho/i }).first();
    if (!(await addButton.count())) {
      test.skip(true, "Nenhum produto comprável no seed");
      return;
    }
    await addButton.click();
    await expect(page.getByText(/seu carrinho/i)).toBeVisible();
  });

  test("/checkout deslogado redireciona para /entrar (sucessor de 'bolsa vazia')", async ({ page }) => {
    // Após a Rodada Auth, /checkout tem proteção server-side via auth() e redireciona
    // para /entrar?callbackUrl=/checkout quando deslogado. O empty state "Bolsa vazia"
    // só renderiza para usuário autenticado COM carrinho vazio (cenário coberto via
    // login programático em outro spec — não aqui).
    await page.goto("/checkout");
    await expect(page).toHaveURL(/\/entrar(\?|$)/);
  });
});
