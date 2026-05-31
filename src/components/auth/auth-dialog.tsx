"use client";

/**
 * AuthDialog — modal de bloqueio de ações.
 * ─────────────────────────────────────────────────────────────────────
 * Montado uma vez no layout raiz. Abre via `useAuthGate.openGate(action)`
 * quando um visitante deslogado tenta uma ação protegida. Após o login,
 * fecha e executa a ação pendente (`runPending`).
 */

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuthGate } from "@/lib/auth/presentation/auth-gate-store";
import { AuthForm } from "./auth-form";

export function AuthDialog() {
  const open = useAuthGate((s) => s.open);
  const cancel = useAuthGate((s) => s.cancel);
  const closeKeepPending = useAuthGate((s) => s.closeKeepPending);

  // Fecha o modal mantendo a ação pendente — o AuthDataSync a executa depois
  // de hidratar carrinho/favoritos, evitando corrida com a hidratação.
  const handleSuccess = () => {
    closeKeepPending();
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) cancel();
      }}
    >
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="font-playfair italic text-2xl text-ink-strong">
            Entre para continuar
          </DialogTitle>
          <DialogDescription className="text-sm text-ink-soft">
            Faça login ou crie sua conta para favoritar, adicionar ao carrinho
            e finalizar a compra.
          </DialogDescription>
        </DialogHeader>
        <AuthForm onSuccess={handleSuccess} />
      </DialogContent>
    </Dialog>
  );
}
