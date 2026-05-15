/**
 * /admin/login — Server Component
 * ─────────────────────────────────────────────────────────────────────
 * Form de login com senha. Server action valida e seta cookie de sessão.
 */

import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const ADMIN_COOKIE = "admin_session";

async function login(formData: FormData) {
  "use server";
  const password = String(formData.get("password") ?? "");
  const redirectTo = String(formData.get("redirect") ?? "/admin");

  if (password !== process.env.ADMIN_PASSWORD) {
    redirect(`/admin/login?error=invalid&redirect=${encodeURIComponent(redirectTo)}`);
  }

  const cookieStore = await cookies();
  cookieStore.set({
    name: ADMIN_COOKIE,
    value: process.env.ADMIN_SECRET ?? "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 7 dias
    path: "/",
  });

  redirect(redirectTo || "/admin");
}

interface PageProps {
  searchParams: Promise<{ error?: string; redirect?: string }>;
}

export default async function AdminLoginPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const hasError = sp.error === "invalid";
  const redirectTo = sp.redirect ?? "/admin";

  return (
    <div className="min-h-screen bg-brand-pink flex flex-col items-center justify-center p-6">
      <Link
        href="/"
        className="absolute top-6 left-6 text-xs tracking-[0.24em] uppercase text-ink-soft hover:text-brand-wine transition-colors"
      >
        ← Voltar à loja
      </Link>

      <div className="w-full max-w-md bg-surface-panel rounded-token-md p-8 sm:p-10 shadow-card">
        <div className="text-center mb-8">
          <div className="w-14 h-14 mx-auto mb-5 rounded-full bg-brand-wine/10 flex items-center justify-center">
            <Lock className="h-6 w-6 text-brand-wine" strokeWidth={1.5} />
          </div>
          <p className="text-[11px] font-medium tracking-[0.32em] uppercase text-brand-wine mb-3">
            Mari Beauty
          </p>
          <h1 className="font-playfair italic text-3xl text-ink-strong mb-2">
            Painel Admin
          </h1>
          <p className="text-sm text-ink-soft font-light">
            Digite a senha para acessar.
          </p>
        </div>

        <form action={login} className="space-y-5">
          <input type="hidden" name="redirect" value={redirectTo} />

          <div>
            <label
              htmlFor="password"
              className="block text-[10px] font-medium tracking-[0.24em] uppercase text-ink-soft mb-2"
            >
              Senha
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoFocus
              autoComplete="current-password"
              className={`h-12 w-full px-4 text-sm bg-surface-base border rounded-token-sm outline-none transition-colors focus:border-brand-wine ${
                hasError ? "border-destructive" : "border-border-subtle"
              }`}
            />
            {hasError && (
              <p className="mt-2 text-xs text-destructive">Senha incorreta.</p>
            )}
          </div>

          <Button
            type="submit"
            className="loreal-btn-pill w-full h-12 bg-brand-wine text-brand-pink text-[12px] font-medium tracking-[0.18em] uppercase hover:bg-brand-wine/90"
          >
            Entrar
          </Button>
        </form>
      </div>
    </div>
  );
}
