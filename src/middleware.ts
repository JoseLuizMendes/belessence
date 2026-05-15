/**
 * Middleware — Belessence
 * ─────────────────────────────────────────────────────────────────────
 * Protege rotas /admin/* exigindo cookie `admin_session` válido.
 * Se inválido → redireciona para /admin/login.
 *
 * Login page (/admin/login) é excluída da proteção.
 */

import { NextRequest, NextResponse } from "next/server";

const ADMIN_COOKIE = "admin_session";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Apenas rotas /admin (exceto login) precisam de auth
  if (!pathname.startsWith("/admin")) return NextResponse.next();
  if (pathname === "/admin/login") return NextResponse.next();

  const cookie = req.cookies.get(ADMIN_COOKIE);
  const expected = process.env.ADMIN_SECRET;

  if (!cookie || !expected || cookie.value !== expected) {
    const loginUrl = new URL("/admin/login", req.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
