import { test, expect } from "@playwright/test";
import { loginAsUser } from "./support/auth";

/**
 * Prova que loginAsUser autentica: /checkout tem proteção server-side (auth()
 * redireciona deslogado pra /entrar). Logado, NÃO deve redirecionar.
 */
test("loginAsUser autentica — /checkout não redireciona pra /entrar", async ({
  context,
  page,
}) => {
  await loginAsUser(context);
  await page.goto("/checkout");
  await expect(page).not.toHaveURL(/\/entrar/);
});
