/**
 * Wishlist Store — Zustand + persist middleware
 * ─────────────────────────────────────────────────────────────────────
 * Lista de favoritos do usuário. Persiste no localStorage (key: belessence-wishlist).
 * Sem sincronização com banco (não há auth) — funciona por dispositivo.
 *
 * Uso: import { useWishlistStore } from '@/lib/wishlist-store'
 */

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

interface WishlistState {
  /** IDs dos produtos favoritados */
  items: string[];

  /** Total de itens (helper) */
  count: number;

  /** Adiciona/remove um produto da lista */
  toggle: (productId: string) => void;

  /** Verifica se um produto está na lista */
  has: (productId: string) => boolean;

  /** Remove um produto específico */
  remove: (productId: string) => void;

  /** Limpa toda a lista */
  clear: () => void;
}

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set, get) => ({
      items: [],
      count: 0,

      toggle: (productId) => {
        const items = get().items;
        const exists = items.includes(productId);
        const newItems = exists
          ? items.filter((id) => id !== productId)
          : [...items, productId];
        set({ items: newItems, count: newItems.length });
      },

      has: (productId) => get().items.includes(productId),

      remove: (productId) => {
        const newItems = get().items.filter((id) => id !== productId);
        set({ items: newItems, count: newItems.length });
      },

      clear: () => set({ items: [], count: 0 }),
    }),
    {
      name: "belessence-wishlist",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        items: state.items,
        count: state.count,
      }),
    },
  ),
);
