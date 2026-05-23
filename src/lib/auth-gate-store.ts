/**
 * Auth Gate Store — Zustand (client-only)
 * ─────────────────────────────────────────────────────────────────────
 * Controla o modal de login que bloqueia ações que exigem autenticação
 * (curtir, adicionar ao carrinho, comprar). Quando um visitante deslogado
 * dispara uma ação protegida, guardamos a ação em `pendingAction` e abrimos
 * o modal.
 *
 * Após o login, a ação pendente NÃO roda no fechamento do modal: ela é
 * executada pelo AuthDataSync (`consumePending`) depois que o carrinho/
 * favoritos do usuário são hidratados do servidor — assim a hidratação não
 * sobrescreve a ação recém-feita (ex.: o "curtir" que disparou o login).
 */

import { create } from "zustand";

interface AuthGateState {
  open: boolean;
  pendingAction: (() => void) | null;
  /** Abre o modal, opcionalmente guardando uma ação para rodar após login. */
  openGate: (action?: () => void) => void;
  /** Fecha o modal mantendo a ação pendente (após login com sucesso). */
  closeKeepPending: () => void;
  /** Cancela: fecha e descarta a ação pendente (dismiss manual). */
  cancel: () => void;
  /** Executa e limpa a ação pendente (chamado pós-hidratação). */
  consumePending: () => void;
}

export const useAuthGate = create<AuthGateState>((set, get) => ({
  open: false,
  pendingAction: null,
  openGate: (action) => set({ open: true, pendingAction: action ?? null }),
  closeKeepPending: () => set({ open: false }),
  cancel: () => set({ open: false, pendingAction: null }),
  consumePending: () => {
    const action = get().pendingAction;
    if (!action) return;
    set({ pendingAction: null });
    action();
  },
}));
