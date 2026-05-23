/**
 * Belessence Cart Store — Zustand (cache do servidor)
 * ─────────────────────────────────────────────────────────────────────
 * O carrinho é privado por usuário e vive no banco (tabela cart_items).
 * Esta store é cache client para UI instantânea:
 *  - `hydrate(items)` é chamado após o login (AuthDataSync) com o carrinho
 *    do banco (preços relidos do servidor).
 *  - `reset()` é chamado no logout — sem persistência em localStorage, nada
 *    de um usuário sobra para o próximo.
 *  - Mutações fazem update otimista e sincronizam via Server Action, com
 *    rollback em caso de falha.
 *
 * Seleção para checkout parcial (`selectedIds`): o cliente pode escolher
 * quais itens finalizar (mínimo 1, máximo todos). Os não selecionados
 * permanecem no carrinho após a compra. É estado de UI — não persiste.
 *
 * Uso: import { useCartStore } from '@/lib/cart-store'
 */

import { create } from "zustand";
import { toast } from "sonner";
import {
  addToCartAction,
  setCartQuantityAction,
  removeFromCartAction,
  clearCartAction,
} from "@/lib/cart-actions";

// ─── TIPOS ───────────────────────────────────────────────────────────────────

export interface CartProduct {
  id: string;
  slug: string;
  name: string;
  shortDescription: string;
  description?: string;
  price: number;
  originalPrice?: number;
  badge?: string;
  badgeVariant?: 'default' | 'secondary' | 'destructive' | 'outline';
  rating?: number;
  reviews?: number;
  image: string;
}

export interface CartItem extends CartProduct {
  quantity: number;
}

interface CartState {
  items: CartItem[];
  isOpen: boolean;
  /** IDs dos itens marcados para o checkout (default: todos). */
  selectedIds: string[];

  // Computed
  cartCount: number;
  cartTotal: number;

  // Actions
  addItem: (product: CartProduct) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;

  // Seleção (checkout parcial)
  toggleSelected: (productId: string) => void;
  setAllSelected: (selected: boolean) => void;
  /** Remove os itens comprados (do store e do servidor) e re-seleciona o resto. */
  removeOrdered: (productIds: string[]) => void;

  // Sincronização com o servidor
  hydrate: (items: CartItem[]) => void;
  reset: () => void;
}

// ─── HELPERS ─────────────────────────────────────────────────────────────────

function computeCount(items: CartItem[]): number {
  return items.reduce((acc, item) => acc + item.quantity, 0);
}

function computeTotal(items: CartItem[]): number {
  return items.reduce((acc, item) => acc + item.price * item.quantity, 0);
}

function snapshot(state: CartState) {
  return {
    items: state.items,
    cartCount: state.cartCount,
    cartTotal: state.cartTotal,
    selectedIds: state.selectedIds,
  };
}

// ─── STORE ───────────────────────────────────────────────────────────────────

export const useCartStore = create<CartState>()((set, get) => ({
  items: [],
  isOpen: false,
  selectedIds: [],
  cartCount: 0,
  cartTotal: 0,

  addItem: (product) => {
    const prev = snapshot(get());
    const existing = prev.items.find((i) => i.id === product.id);

    const newItems: CartItem[] = existing
      ? prev.items.map((i) =>
          i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i,
        )
      : [...prev.items, { ...product, quantity: 1 }];

    // Item novo entra já selecionado para o checkout.
    const newSelected = prev.selectedIds.includes(product.id)
      ? prev.selectedIds
      : [...prev.selectedIds, product.id];

    set({
      items: newItems,
      selectedIds: newSelected,
      cartCount: computeCount(newItems),
      cartTotal: computeTotal(newItems),
      isOpen: true,
    });

    addToCartAction(product.id, 1)
      .then((res) => {
        if (!res.ok) {
          set(prev);
          toast.error("Não foi possível adicionar ao carrinho");
        }
      })
      .catch(() => {
        set(prev);
        toast.error("Não foi possível adicionar ao carrinho");
      });
  },

  removeItem: (productId) => {
    const prev = snapshot(get());
    const newItems = prev.items.filter((i) => i.id !== productId);
    set({
      items: newItems,
      selectedIds: prev.selectedIds.filter((id) => id !== productId),
      cartCount: computeCount(newItems),
      cartTotal: computeTotal(newItems),
    });

    removeFromCartAction(productId)
      .then((res) => {
        if (!res.ok) {
          set(prev);
          toast.error("Não foi possível remover do carrinho");
        }
      })
      .catch(() => {
        set(prev);
        toast.error("Não foi possível remover do carrinho");
      });
  },

  updateQuantity: (productId, quantity) => {
    if (quantity <= 0) {
      get().removeItem(productId);
      return;
    }
    const prev = snapshot(get());
    const newItems = prev.items.map((i) =>
      i.id === productId ? { ...i, quantity } : i,
    );
    set({
      items: newItems,
      cartCount: computeCount(newItems),
      cartTotal: computeTotal(newItems),
    });

    setCartQuantityAction(productId, quantity)
      .then((res) => {
        if (!res.ok) {
          set(prev);
          toast.error("Não foi possível atualizar o carrinho");
        }
      })
      .catch(() => {
        set(prev);
        toast.error("Não foi possível atualizar o carrinho");
      });
  },

  clearCart: () => {
    const prev = snapshot(get());
    set({ items: [], selectedIds: [], cartCount: 0, cartTotal: 0 });

    clearCartAction()
      .then((res) => {
        if (!res.ok) {
          set(prev);
          toast.error("Não foi possível limpar o carrinho");
        }
      })
      .catch(() => {
        set(prev);
        toast.error("Não foi possível limpar o carrinho");
      });
  },

  openCart: () => set({ isOpen: true }),
  closeCart: () => set({ isOpen: false }),
  toggleCart: () => set((state) => ({ isOpen: !state.isOpen })),

  toggleSelected: (productId) => {
    const selected = get().selectedIds;
    const next = selected.includes(productId)
      ? selected.filter((id) => id !== productId)
      : [...selected, productId];
    set({ selectedIds: next });
  },

  setAllSelected: (selected) => {
    set({ selectedIds: selected ? get().items.map((i) => i.id) : [] });
  },

  removeOrdered: (productIds) => {
    const prev = snapshot(get());
    const ordered = new Set(productIds);
    const newItems = prev.items.filter((i) => !ordered.has(i.id));
    set({
      items: newItems,
      // Re-seleciona o que sobrou (carrinho volta "pronto para finalizar").
      selectedIds: newItems.map((i) => i.id),
      cartCount: computeCount(newItems),
      cartTotal: computeTotal(newItems),
    });

    Promise.all(productIds.map((id) => removeFromCartAction(id)))
      .then((results) => {
        if (results.some((r) => !r.ok)) {
          set(prev);
          toast.error("Não foi possível atualizar o carrinho após a compra");
        }
      })
      .catch(() => {
        set(prev);
      });
  },

  hydrate: (items) =>
    set({
      items,
      selectedIds: items.map((i) => i.id),
      cartCount: computeCount(items),
      cartTotal: computeTotal(items),
    }),

  reset: () =>
    set({ items: [], selectedIds: [], cartCount: 0, cartTotal: 0, isOpen: false }),
}));
