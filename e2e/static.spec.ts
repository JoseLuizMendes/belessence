import { test, expect } from "@playwright/test";

/**
 * E2E — Páginas estáticas/institucionais (smoke)
 */

const PAGES = ["/sobre", "/ajuda", "/contato"];

for (const path of PAGES) {
  test(`${path} carrega sem erro de servidor`, async ({ page }) => {
    const res = await page.goto(path);
    expect(res?.status()).toBeLessThan(400);
    await expect(page.locator("body")).toBeVisible();
  });
}
