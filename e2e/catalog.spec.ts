import { test, expect } from "@playwright/test";

/**
 * E2E — Catálogo (/allProducts)
 * Cobre a PLP: listagem, busca por query, e ordenação via SortSelect
 * (exercita o Radix Select no browser real — não testável em jsdom).
 * Requer seed (produtos midnight-velvet, golden-essence, etc.).
 */

test.describe("Catálogo /allProducts", () => {
  test("lista produtos com links para a página de detalhe", async ({ page }) => {
    await page.goto("/allProducts");
    const cards = page.getByRole("link", { name: /ver detalhes|avise-me|saiba mais/i });
    // Há produtos no seed → ao menos um card
    await expect(cards.first()).toBeVisible();
    // Algum link aponta para /product/<slug>
    const productLink = page
      .locator('a[href^="/product/"]')
      .first();
    await expect(productLink).toBeVisible();
  });

  test("busca por ?q=midnight filtra para Midnight Velvet", async ({ page }) => {
    await page.goto("/allProducts?q=midnight");
    await expect(page.getByText(/midnight velvet/i).first()).toBeVisible();
  });

  test("ordenação via SortSelect atualiza o param `sort` na URL", async ({
    page,
  }) => {
    await page.goto("/allProducts");
    // Abre o Radix Select "Ordenar por"
    await page.getByRole("combobox").click();
    // Escolhe "Maior preço" → handleChange faz router.push(?sort=price-desc)
    await page.getByRole("option", { name: /maior preço/i }).click();
    await expect(page).toHaveURL(/sort=price-desc/);
  });
});
