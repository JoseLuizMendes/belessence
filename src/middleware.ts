/**
 * Middleware — Belessence
 * ─────────────────────────────────────────────────────────────────────
 * Protege:
 *  - Páginas /admin/* (redirect para /admin/login se não autenticado)
 *  - APIs /api/admin/* (retorna 401 JSON se não autenticado)
 *
 * Autenticação = cookie `admin_session` contendo um JWT assinado, validado
 * por `verifyAdminSession` (assinatura + expiração + versão). O cookie NÃO é
 * mais o `ADMIN_SECRET` em texto puro.
 *
 * Rotas públicas (pré-login): a página /admin/login e o fluxo OAuth do Google.
 */

import { NextRequest, NextResponse } from "next/server";
import { ADMIN_COOKIE, verifyAdminSession } from "@/lib/auth/presentation/admin-auth";

const PUBLIC_ADMIN_PATHS = new Set<string>([
  "/admin/login",
  "/api/admin/oauth/google",
  "/api/admin/oauth/google/callback",
]);

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (PUBLIC_ADMIN_PATHS.has(pathname)) return NextResponse.next();

  const isAdminApi = pathname.startsWith("/api/admin");
  const isAdminPage = pathname.startsWith("/admin");
  if (!isAdminApi && !isAdminPage) return NextResponse.next();

  const token = req.cookies.get(ADMIN_COOKIE)?.value;
  const isAuthed = await verifyAdminSession(token);

  if (isAuthed) return NextResponse.next();

  if (isAdminApi) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const loginUrl = new URL("/admin/login", req.url);
  loginUrl.searchParams.set("redirect", pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
