import "server-only";

/**
 * Caminho B do login admin: OAuth Google com allowlist de email (single-tenant).
 * Reutiliza o app Google do projeto (AUTH_GOOGLE_ID/SECRET). Mantém o admin
 * separado do NextAuth do cliente — aqui o resultado é apenas validar o email
 * e setar o cookie de sessão admin assinado (nas rotas).
 */

import {
  Google,
  generateState,
  generateCodeVerifier,
  decodeIdToken,
} from "arctic";

export const GOOGLE_SCOPES = ["openid", "email", "profile"];

export function googleConfigured(): boolean {
  return !!(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET);
}

export function createGoogle(redirectURI: string): Google {
  const id = process.env.AUTH_GOOGLE_ID;
  const secret = process.env.AUTH_GOOGLE_SECRET;
  if (!id || !secret) {
    throw new Error("AUTH_GOOGLE_ID/AUTH_GOOGLE_SECRET ausentes");
  }
  return new Google(id, secret, redirectURI);
}

/** Email autorizado a acessar o admin? Vazio na allowlist = nega todos. */
export function isAllowedAdminEmail(email: string): boolean {
  const list = (process.env.ADMIN_ALLOWLIST_EMAILS ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  if (list.length === 0) return false;
  return list.includes(email.trim().toLowerCase());
}

export { generateState, generateCodeVerifier, decodeIdToken };
