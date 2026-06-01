import { test, expect } from "@playwright/test";

/**
 * E2E — Coleção (/collections/[slug])
 * Renderiza a página de uma coleção. Usa um slug presente na vitrine
 * (CollectionsProducts: essencia-noturna / elegancia-diurna / edicao-limitada).
 */

test.describe("Coleção /collections/[slug]", () => {
  test("renderiza a página da coleção sem erro", async ({ page }) => {
    const res = await page.goto("/collections/essencia-noturna");
    expect(res?.status()).toBeLessThan(400);
    // Algum conteúdo de produto/heading deve aparecer.
    // (locator "main, body" antes causava strict mode violation por resolver 2 elementos.)
    await expect(page.getByRole("main")).toBeVisible();
  });
});
