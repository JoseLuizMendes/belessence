/**
 * GET /api/admin/oauth/google/callback — conclui o login Google do admin.
 * Rota pública (liberada no middleware). Valida state/PKCE, troca o code,
 * confere o email na allowlist e, se ok, seta o cookie de sessão admin
 * assinado. Caso contrário, volta para /admin/login com erro.
 */

import { NextRequest, NextResponse } from "next/server";
import {
  ADMIN_COOKIE,
  createAdminSessionToken,
  adminCookieOptions,
} from "@/lib/auth/presentation/admin-auth";
import {
  createGoogle,
  decodeIdToken,
  isAllowedAdminEmail,
} from "@/lib/auth/infrastructure/external/admin-google";

const TEMP_COOKIES = [
  "admin_oauth_state",
  "admin_oauth_verifier",
  "admin_oauth_redirect",
];

function clearTemp(res: NextResponse) {
  for (const name of TEMP_COOKIES) res.cookies.delete(name);
}

function safeRedirect(raw: string | undefined): string {
  if (raw && raw.startsWith("/") && !raw.startsWith("//")) return raw;
  return "/admin";
}

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const state = req.nextUrl.searchParams.get("state");
  const storedState = req.cookies.get("admin_oauth_state")?.value;
  const verifier = req.cookies.get("admin_oauth_verifier")?.value;
  const redirectTo = safeRedirect(req.cookies.get("admin_oauth_redirect")?.value);

  const fail = (error: string) => {
    const res = NextResponse.redirect(
      new URL(`/admin/login?error=${error}`, req.url),
    );
    clearTemp(res);
    return res;
  };

  if (!code || !state || !storedState || state !== storedState || !verifier) {
    return fail("oauth");
  }

  try {
    const redirectURI = new URL(
      "/api/admin/oauth/google/callback",
      req.url,
    ).toString();
    const tokens = await createGoogle(redirectURI).validateAuthorizationCode(
      code,
      verifier,
    );
    const claims = decodeIdToken(tokens.idToken()) as {
      email?: string;
      email_verified?: boolean;
    };

    if (
      !claims.email ||
      claims.email_verified === false ||
      !isAllowedAdminEmail(claims.email)
    ) {
      return fail("denied");
    }

    const res = NextResponse.redirect(new URL(redirectTo, req.url));
    clearTemp(res);
    res.cookies.set({
      name: ADMIN_COOKIE,
      value: await createAdminSessionToken(),
      ...adminCookieOptions(),
    });
    return res;
  } catch {
    return fail("oauth");
  }
}
