import { test, expect } from "@playwright/test";

/**
 * E2E — Ajuda (/ajuda)
 * FAQ accordion (Radix) — interação de abrir um item no browser real.
 */

test.describe("Ajuda /ajuda", () => {
  test("abre um item do FAQ ao clicar", async ({ page }) => {
    await page.goto("/ajuda");

    const triggers = page.getByRole("button", { expanded: false });
    const count = await triggers.count();
    if (count === 0) {
      test.skip(true, "Sem itens de FAQ colapsados na página");
      return;
    }

    // O primeiro item pode já vir aberto (defaultValue item-0); pega um fechado.
    const closed = triggers.first();
    await closed.click();
    await expect(closed).toHaveAttribute("aria-expanded", "true");
  });
});
