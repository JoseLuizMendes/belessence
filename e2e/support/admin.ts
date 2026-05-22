/**
 * Helpers de admin para E2E.
 * ─────────────────────────────────────────────────────────────────────
 * - loginAsAdmin: injeta o cookie `admin_session` (= ADMIN_SECRET) direto no
 *   contexto, evitando passar pela tela de login em todo teste.
 * - stubCloudinary: intercepta a assinatura + o upload para não bater no
 *   Cloudinary real durante o CRUD de produto.
 */

import type { BrowserContext, Page } from "@playwright/test";

export async function loginAsAdmin(
  context: BrowserContext,
  baseURL = process.env.E2E_BASE_URL ?? "http://localhost:3000",
): Promise<void> {
  const secret = process.env.ADMIN_SECRET;
  if (!secret) {
    throw new Error("ADMIN_SECRET não definido — necessário para E2E admin");
  }
  const { hostname } = new URL(baseURL);
  await context.addCookies([
    {
      name: "admin_session",
      value: secret,
      domain: hostname,
      path: "/",
      httpOnly: true,
      sameSite: "Lax",
    },
  ]);
}

export async function stubCloudinary(page: Page): Promise<void> {
  // Assinatura gerada pelo nosso endpoint
  await page.route("**/api/admin/cloudinary/sign", (route) =>
    route.fulfill({
      json: {
        signature: "stub-signature",
        timestamp: 1,
        apiKey: "stub-key",
        cloudName: "demo",
        folder: "belessence/products",
      },
    }),
  );
  // Upload direto ao Cloudinary → devolve uma URL falsa válida
  await page.route("https://api.cloudinary.com/**", (route) =>
    route.fulfill({
      json: {
        secure_url:
          "https://res.cloudinary.com/demo/image/upload/v1/stub.jpg",
        public_id: "belessence/products/stub",
      },
    }),
  );
}
