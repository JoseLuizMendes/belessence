/**
 * Auth do admin — token de sessão assinado (Edge-safe).
 * ─────────────────────────────────────────────────────────────────────
 * O cookie `admin_session` deixa de ser o `ADMIN_SECRET` em texto puro e
 * passa a ser um JWT assinado (HS256) com `ADMIN_SECRET` como chave. Assim:
 *  - o cookie não é mais o segredo;
 *  - tem expiração (`exp`) real;
 *  - pode ser revogado em massa via `TOKEN_VERSION`.
 *
 * IMPORTANTE: este módulo é importado pelo middleware (Edge runtime), então
 * **só pode depender de `jose`** — nada de bcrypt/otplib/prisma/arctic aqui.
 */

import { SignJWT, jwtVerify } from "jose";

export const ADMIN_COOKIE = "admin_session";

/** Bump este número para invalidar todas as sessões admin existentes. */
export const TOKEN_VERSION = 1;

/** Duração da sessão admin. Curta de propósito (reduz janela de cookie roubado). */
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 12; // 12h

function getSigningKey(): Uint8Array {
  const secret = process.env.ADMIN_SECRET;
  if (!secret) {
    throw new Error("ADMIN_SECRET não definido no ambiente");
  }
  return new TextEncoder().encode(secret);
}

/** Assina o token de sessão admin. Use ao setar o cookie no login. */
export async function createAdminSessionToken(): Promise<string> {
  return new SignJWT({ v: TOKEN_VERSION })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject("admin")
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE_SECONDS}s`)
    .sign(getSigningKey());
}

/**
 * Verifica o token do cookie: assinatura + expiração + versão.
 * Retorna `false` para qualquer token ausente/inválido/expirado.
 */
export async function verifyAdminSession(
  token: string | undefined | null,
): Promise<boolean> {
  if (!token) return false;
  try {
    const { payload } = await jwtVerify(token, getSigningKey());
    return payload.sub === "admin" && payload.v === TOKEN_VERSION;
  } catch {
    return false;
  }
}

/** Opções padrão do cookie de sessão admin. */
export function adminCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  };
}
