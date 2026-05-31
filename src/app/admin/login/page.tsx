/**
 * /admin/login — Server Component
 * ─────────────────────────────────────────────────────────────────────
 * Dois caminhos de login (single-tenant):
 *  A) Senha (hash bcrypt) + código TOTP (app autenticador) — com lockout.
 *  B) "Entrar com Google" — OAuth com allowlist de email.
 * Ambos terminam setando o cookie de sessão assinado (`admin_session`).
 */

import { redirect } from "next/navigation";
import { cookies, headers } from "next/headers";
import { ChevronLeftIcon, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AdminLoginForm } from "@/components/admin/admin-login-form";
import Link from "next/link";
import {
  ADMIN_COOKIE,
  createAdminSessionToken,
  adminCookieOptions,
} from "@/lib/auth/presentation/admin-auth";
import {
  verifyAdminPassword,
  verifyAdminTotp,
  isTotpConfigured,
  checkLoginRateLimit,
  recordLoginFailure,
  clearLoginAttempts,
} from "@/lib/auth/infrastructure/persistence/admin-login";

function clientIp(forwardedFor: string | null): string {
  return (forwardedFor ?? "").split(",")[0]?.trim() || "unknown";
}

async function login(formData: FormData) {
  "use server";
  const password = String(formData.get("password") ?? "");
  const code = String(formData.get("code") ?? "");
  const redirectTo = String(formData.get("redirect") ?? "/admin");
  const back = (error: string) =>
    redirect(
      `/admin/login?error=${error}&redirect=${encodeURIComponent(redirectTo)}`,
    );

  const hdrs = await headers();
  const ip = clientIp(hdrs.get("x-forwarded-for"));

  const rate = await checkLoginRateLimit(ip);
  if (rate.locked) back("locked");

  const okPassword = await verifyAdminPassword(password);
  const okTotp = verifyAdminTotp(code);
  if (!okPassword || !okTotp) {
    await recordLoginFailure(ip);
    back("invalid");
  }

  await clearLoginAttempts(ip);

  const cookieStore = await cookies();
  cookieStore.set({
    name: ADMIN_COOKIE,
    value: await createAdminSessionToken(),
    ...adminCookieOptions(),
  });

  redirect(redirectTo || "/admin");
}

interface PageProps {
  searchParams: Promise<{ error?: string; redirect?: string }>;
}

const ERROR_MESSAGES: Record<string, string> = {
  invalid: "Credenciais inválidas.",
  locked: "Muitas tentativas. Aguarde alguns minutos e tente novamente.",
  denied: "Esta conta Google não tem acesso ao painel.",
  oauth: "Falha ao entrar com o Google. Tente novamente.",
};

export default async function AdminLoginPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const errorMessage = sp.error ? ERROR_MESSAGES[sp.error] : undefined;
  const redirectTo = sp.redirect ?? "/admin";
  const totpOn = isTotpConfigured();

  return (
    <div className="min-h-screen bg-admin-canvas flex flex-col items-center justify-center p-6 relative">
      {/* Acento decorativo: gradiente vinho na base, sutilíssimo */}
      <div
        aria-hidden="true"
        className="absolute inset-x-0 bottom-0 h-2/5 pointer-events-none"
        style={{
          background:
            "radial-gradient(80% 60% at 50% 100%, rgba(71,19,28,0.10) 0%, transparent 70%)",
        }}
      />

      <Link
        href="/"
        className="absolute top-6 left-6 text-[11px] tracking-[0.24em] uppercase text-ink-soft hover:text-brand-wine transition-colors flex items-center gap-2 focus-ring rounded-sm"
      >
        <ChevronLeftIcon className="h-5 w-5" />
        Voltar à loja
      </Link>

      <div className="relative w-full max-w-md bg-admin-panel border border-admin rounded-token-md p-8 sm:p-10 shadow-petal-3 animate-admin-rise">
        <div className="text-center mb-8">
          <div className="w-14 h-14 mx-auto mb-5 rounded-full bg-brand-wine/10 flex items-center justify-center">
            <Lock className="h-6 w-6 text-brand-wine" strokeWidth={1.5} />
          </div>
          <p className="admin-eyebrow mb-3">Mari Beauty</p>
          <h1 className="font-serif text-3xl text-ink-strong mb-2 leading-tight">
            Painel Admin
          </h1>
          <p className="text-sm text-ink-soft">Acesso restrito.</p>
        </div>

        {errorMessage && (
          <p className="mb-5 rounded-token-sm bg-destructive/10 border border-destructive/20 px-4 py-3 text-xs text-destructive text-center">
            {errorMessage}
          </p>
        )}

        <AdminLoginForm action={login} redirectTo={redirectTo} totpOn={totpOn} />

        {!totpOn && (
          <p className="mt-4 text-[11px] leading-relaxed text-ink-muted text-center">
            2FA não configurado, o login está usando apenas a senha. Rode{" "}
            <code className="font-data">scripts/admin-setup.mjs</code> para
            ativar o autenticador.
          </p>
        )}

        <div className="my-6 flex items-center gap-3">
          <span className="h-px flex-1 bg-admin-border" />
          <span className="text-[10px] tracking-[0.22em] uppercase text-ink-muted">
            ou
          </span>
          <span className="h-px flex-1 bg-admin-border" />
        </div>

        <Button
          asChild
          variant="outline"
          className="w-full h-12 text-[12px] font-medium tracking-[0.18em] uppercase border-admin hover:bg-admin-row hover:border-brand-wine/40"
        >
          <a
            href={`/api/admin/oauth/google?redirect=${encodeURIComponent(redirectTo)}`}
          >
            Entrar com Google
          </a>
        </Button>
      </div>
    </div>
  );
}
