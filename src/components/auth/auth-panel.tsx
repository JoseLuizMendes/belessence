"use client";

/**
 * AuthPanel — card de autenticação para as páginas /entrar e /cadastro.
 * Lê `callbackUrl` da query e redireciona após login. Se já autenticado,
 * sai da página de auth automaticamente.
 */

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { AuthForm } from "./auth-form";

export function AuthPanel({ mode: initialMode }: { mode: "login" | "register" }) {
  const router = useRouter();
  const params = useSearchParams();
  const { status } = useSession();
  const callbackUrl = params.get("callbackUrl") || "/";
  const [currentMode, setCurrentMode] = useState(initialMode);

  useEffect(() => {
    if (status === "authenticated") {
      router.replace(callbackUrl);
    }
  }, [status, callbackUrl, router]);

  return (
    <div className="mx-auto w-full max-w-sm rounded-token-md bg-surface-panel p-8 shadow-card">
      <div className="mb-6 text-center">
        <p className="mb-2 text-[11px] font-medium tracking-[0.32em] uppercase text-brand-wine text-center">
          {currentMode === "login" ? "Bem-vinda de volta" : "Junte-se a nós!"}
        </p>
        <h1 className="font-playfair italic text-3xl text-ink-strong">
          {currentMode === "login" ? "Entrar" : "Cadastro"}
        </h1>
      </div>
      <AuthForm
        initialMode={currentMode}
        onModeChange={setCurrentMode}
        onSuccess={() => router.replace(callbackUrl)}
      />
    </div>
  );
}
