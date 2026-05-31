import "client-only";

/**
 * useRequireAuth — guarda ações que exigem login.
 *
 * Retorna `requireAuth(action)`: se o usuário está autenticado, executa a
 * ação imediatamente; caso contrário abre o modal de login (auth gate)
 * guardando a ação para rodá-la automaticamente após o login.
 */

import { useCallback } from "react";
import { useSession } from "next-auth/react";
import { useAuthGate } from "@/lib/auth/presentation/auth-gate-store";

export function useRequireAuth() {
  const { status } = useSession();
  const openGate = useAuthGate((s) => s.openGate);

  return useCallback(
    (action: () => void) => {
      if (status === "authenticated") {
        action();
      } else {
        openGate(action);
      }
    },
    [status, openGate],
  );
}
