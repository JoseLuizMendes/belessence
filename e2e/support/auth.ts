/**
 * Helper de login de USUÁRIO comum para E2E.
 * ─────────────────────────────────────────────────────────────────────
 * Forja o cookie de sessão Auth.js v5 (JWT) via `encode` do `next-auth/jwt`,
 * evitando passar pela tela de login. O `sub` casa com o usuário semeado
 * (`e2e-user`) — o callback `session` do app expõe `session.user.id = token.sub`.
 *
 * Import de pacote (`next-auth/jwt`) de propósito: o Playwright não resolve o
 * alias `@/` (por isso `db.ts` usa `pg` puro).
 */
import type { BrowserContext } from "@playwright/test";
import { encode } from "next-auth/jwt";

export const TEST_USER = {
  id: "e2e-user",
  email: "e2e@belessence.dev",
  name: "Cliente E2E",
};

export async function loginAsUser(
  context: BrowserContext,
  baseURL = process.env.E2E_BASE_URL ?? "http://localhost:3000",
): Promise<void> {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error("AUTH_SECRET não definido — necessário para loginAsUser");
  }

  const { protocol, hostname } = new URL(baseURL);
  // Auth.js v5: nome do cookie de sessão (http vs https). O `salt` do encode
  // DEVE ser igual ao nome do cookie.
  const cookieName =
    protocol === "https:"
      ? "__Secure-authjs.session-token"
      : "authjs.session-token";

  const token = await encode({
    token: { sub: TEST_USER.id, email: TEST_USER.email, name: TEST_USER.name },
    secret,
    salt: cookieName,
  });

  await context.addCookies([
    {
      name: cookieName,
      value: token,
      domain: hostname,
      path: "/",
      httpOnly: true,
      sameSite: "Lax",
      secure: protocol === "https:",
    },
  ]);
}
