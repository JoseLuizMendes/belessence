/**
 * Wishlist Store — Zustand (cache do servidor)
 * ─────────────────────────────────────────────────────────────────────
 * Os favoritos são privados por usuário e vivem no banco (tabela
 * wishlist_items). Esta store é apenas um cache client para UI instantânea:
 *  - `hydrate(ids)` é chamado após o login (AuthDataSync) com os IDs do banco.
 *  - `reset()` é chamado no logout — nada de dados de um usuário sobra para
 *    o próximo (sem persistência em localStorage).
 *  - Mutações fazem update otimista e sincronizam via Server Action, com
 *    rollback em caso de falha.
 *
 * Uso: import { useWishlistStore } from '@/lib/wishlist/presentation/wishlist-store'
 */

import { create } from "zustand";
import { toast } from "sonner";
import {
  toggleWishlistAction,
  removeWishlistAction,
  clearWishlistAction,
} from "@/lib/wishlist/presentation/wishlist-actions";

interface WishlistState {
  /** IDs dos produtos favoritados (cache do servidor). */
  items: string[];
  /** Total de itens (helper). */
  count: number;

  /** Adiciona/remove um produto (otimista + servidor). */
  toggle: (productId: string) => void;
  /** Verifica se um produto está na lista. */
  has: (productId: string) => boolean;
  /** Remove um produto específico (otimista + servidor). */
  remove: (productId: string) => void;
  /** Limpa toda a lista (otimista + servidor). */
  clear: () => void;

  /** Popula a store com os favoritos do usuário (pós-login). */
  hydrate: (ids: string[]) => void;
  /** Zera a store (logout) — não deixa resíduo entre usuários. */
  reset: () => void;
}

export const useWishlistStore = create<WishlistState>((set, get) => ({
  items: [],
  count: 0,

  toggle: (productId) => {
    const prev = get().items;
    const exists = prev.includes(productId);
    const next = exists
      ? prev.filter((id) => id !== productId)
      : [...prev, productId];
    set({ items: next, count: next.length });

    toggleWishlistAction(productId)
      .then((res) => {
        if (!res.ok) {
          set({ items: prev, count: prev.length });
          toast.error("Não foi possível atualizar os favoritos");
        }
      })
      .catch(() => {
        set({ items: prev, count: prev.length });
        toast.error("Não foi possível atualizar os favoritos");
      });
  },

  has: (productId) => get().items.includes(productId),

  remove: (productId) => {
    const prev = get().items;
    const next = prev.filter((id) => id !== productId);
    set({ items: next, count: next.length });

    removeWishlistAction(productId)
      .then((res) => {
        if (!res.ok) {
          set({ items: prev, count: prev.length });
          toast.error("Não foi possível remover dos favoritos");
        }
      })
      .catch(() => {
        set({ items: prev, count: prev.length });
        toast.error("Não foi possível remover dos favoritos");
      });
  },

  clear: () => {
    const prev = get().items;
    set({ items: [], count: 0 });

    clearWishlistAction()
      .then((res) => {
        if (!res.ok) {
          set({ items: prev, count: prev.length });
          toast.error("Não foi possível limpar os favoritos");
        }
      })
      .catch(() => {
        set({ items: prev, count: prev.length });
        toast.error("Não foi possível limpar os favoritos");
      });
  },

  hydrate: (ids) => set({ items: ids, count: ids.length }),
  reset: () => set({ items: [], count: 0 }),
}));
