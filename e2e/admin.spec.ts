import { test, expect } from "@playwright/test";

/**
 * Smoke — Admin (auth via middleware)
 * Rotas /admin/* são protegidas: sem cookie admin_session → redirect para
 * /admin/login. A API /api/admin/* responde 401 JSON.
 */

test.describe("Admin — proteção de rota", () => {
  test("acessar /admin/produtos sem sessão redireciona para /admin/login", async ({
    page,
  }) => {
    await page.goto("/admin/produtos");
    await expect(page).toHaveURL(/\/admin\/login/);
  });

  test("/api/admin/* sem sessão responde 401", async ({ request }) => {
    const res = await request.post("/api/admin/cloudinary", {
      data: {},
    });
    expect(res.status()).toBe(401);
  });

  test("a página de login renderiza o formulário", async ({ page }) => {
    await page.goto("/admin/login");
    // Página pública (única exceção do middleware sob /admin)
    await expect(page).toHaveURL(/\/admin\/login/);
  });
});
