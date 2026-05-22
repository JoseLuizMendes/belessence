import { test, expect } from "@playwright/test";

/**
 * Smoke — Carrinho (client-side Zustand + persist)
 * Adiciona um produto e confirma que a gaveta do carrinho abre com o item.
 * Requer ao menos 1 produto comprável (em estoque, status NORMAL) no seed.
 */

test.describe("Carrinho", () => {
  test("adicionar produto abre a gaveta e mostra o item", async ({ page }) => {
    await page.goto("/allProducts");

    // O ProductCard expõe um botão "Adicionar <nome> ao carrinho".
    const addButton = page
      .getByRole("button", { name: /adicionar .* ao carrinho/i })
      .first();

    // Se não houver produtos compráveis no seed, encerra sem falhar.
    if (!(await addButton.count())) {
      test.skip(true, "Nenhum produto comprável no seed");
      return;
    }

    await addButton.click();

    // CartSheet abre (addItem seta isOpen=true). Título "Seu Carrinho".
    await expect(page.getByText(/seu carrinho/i)).toBeVisible();

    // CTA de finalizar deve apontar para /checkout
    const finalizar = page.getByRole("link", { name: /finalizar compra/i });
    await expect(finalizar).toBeVisible();
    await expect(finalizar).toHaveAttribute("href", "/checkout");
  });

  test("checkout vazio mostra estado 'Bolsa vazia'", async ({ page }) => {
    // Sem itens no localStorage, /checkout renderiza o empty state.
    await page.goto("/checkout");
    await expect(page.getByText(/bolsa vazia/i)).toBeVisible();
  });
});
