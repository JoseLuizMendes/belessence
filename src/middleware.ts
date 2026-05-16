/**
 * Middleware — Belessence
 * ─────────────────────────────────────────────────────────────────────
 * Protege:
 *  - Páginas /admin/* (redirect para /admin/login se não autenticado)
 *  - APIs /api/admin/* (retorna 401 JSON se não autenticado)
 *
 * Login page (/admin/login) é excluída da proteção.
 */

import { NextRequest, NextResponse } from "next/server";

const ADMIN_COOKIE = "admin_session";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // /admin/login é público
  if (pathname === "/admin/login") return NextResponse.next();

  const isAdminApi = pathname.startsWith("/api/admin");
  const isAdminPage = pathname.startsWith("/admin");
  if (!isAdminApi && !isAdminPage) return NextResponse.next();

  const cookie = req.cookies.get(ADMIN_COOKIE);
  const expected = process.env.ADMIN_SECRET;
  const isAuthed = !!(cookie && expected && cookie.value === expected);

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
