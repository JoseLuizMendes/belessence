/**
 * GET /api/admin/oauth/google — inicia o login Google do admin.
 * Rota pública (pré-login; liberada no middleware). Gera state + PKCE em
 * cookies httpOnly temporários e redireciona ao Google.
 */

import { NextRequest, NextResponse } from "next/server";
import {
  createGoogle,
  generateState,
  generateCodeVerifier,
  googleConfigured,
  GOOGLE_SCOPES,
} from "@/lib/auth/infrastructure/external/admin-google";

function safeRedirect(raw: string | null): string {
  if (raw && raw.startsWith("/") && !raw.startsWith("//")) return raw;
  return "/admin";
}

export async function GET(req: NextRequest) {
  if (!googleConfigured()) {
    return NextResponse.redirect(new URL("/admin/login?error=oauth", req.url));
  }

  const state = generateState();
  const codeVerifier = generateCodeVerifier();
  const redirectURI = new URL(
    "/api/admin/oauth/google/callback",
    req.url,
  ).toString();

  const url = createGoogle(redirectURI).createAuthorizationURL(
    state,
    codeVerifier,
    GOOGLE_SCOPES,
  );

  const res = NextResponse.redirect(url);
  const opts = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: 600, // 10 min para concluir o fluxo
  };
  res.cookies.set("admin_oauth_state", state, opts);
  res.cookies.set("admin_oauth_verifier", codeVerifier, opts);
  res.cookies.set(
    "admin_oauth_redirect",
    safeRedirect(req.nextUrl.searchParams.get("redirect")),
    opts,
  );
  return res;
}
