import { test, expect } from "@playwright/test";

/**
 * E2E — Ajuda (/ajuda)
 * FAQ accordion (Radix) — interação de abrir um item no browser real.
 */

test.describe("Ajuda /ajuda", () => {
  test("abre um item do FAQ ao clicar", async ({ page }) => {
    await page.goto("/ajuda");

    // Pega um trigger específico por ID (não pelo seu data-state, que muda
    // após o click — o locator dinâmico re-evaluaria pra próximo "closed").
    const allTriggers = page.locator('[data-slot="accordion-trigger"]');
    const triggerCount = await allTriggers.count();
    if (triggerCount === 0) {
      test.skip(true, "Sem itens de FAQ na página");
      return;
    }
    // Pega o primeiro item COLAPSADO + captura seu id estável
    const firstClosed = page.locator('[data-slot="accordion-trigger"][data-state="closed"]').first();
    const closedCount = await firstClosed.count();
    if (closedCount === 0) {
      test.skip(true, "Todos os FAQs já abertos por defaultValue");
      return;
    }
    const targetId = await firstClosed.getAttribute("id");
    await firstClosed.click();
    // Refere pelo id capturado — locator estável independente do state.
    const target = page.locator(`#${targetId}`);
    await expect(target).toHaveAttribute("data-state", "open");
  });
});
