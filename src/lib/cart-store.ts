/**
 * Belessence Cart Store — Zustand + persist middleware
 * Substitui o antigo useState + Context em src/components/cart.tsx
 *
 * Uso: import { useCartStore } from '@/lib/cart-store'
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

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
}

// ─── HELPERS ─────────────────────────────────────────────────────────────────

function computeCount(items: CartItem[]): number {
  return items.reduce((acc, item) => acc + item.quantity, 0);
}

function computeTotal(items: CartItem[]): number {
  return items.reduce((acc, item) => acc + item.price * item.quantity, 0);
}

// ─── STORE ───────────────────────────────────────────────────────────────────

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,
      cartCount: 0,
      cartTotal: 0,

      addItem: (product) => {
        const items = get().items;
        const existing = items.find((i) => i.id === product.id);

        const newItems: CartItem[] = existing
          ? items.map((i) =>
              i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i
            )
          : [...items, { ...product, quantity: 1 }];

        set({
          items: newItems,
          cartCount: computeCount(newItems),
          cartTotal: computeTotal(newItems),
          isOpen: true,
        });
      },

      removeItem: (productId) => {
        const newItems = get().items.filter((i) => i.id !== productId);
        set({
          items: newItems,
          cartCount: computeCount(newItems),
          cartTotal: computeTotal(newItems),
        });
      },

      updateQuantity: (productId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(productId);
          return;
        }
        const newItems = get().items.map((i) =>
          i.id === productId ? { ...i, quantity } : i
        );
        set({
          items: newItems,
          cartCount: computeCount(newItems),
          cartTotal: computeTotal(newItems),
        });
      },

      clearCart: () => {
        set({ items: [], cartCount: 0, cartTotal: 0 });
      },

      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),
      toggleCart: () => set((state) => ({ isOpen: !state.isOpen })),
    }),
    {
      name: 'belessence-cart',
      storage: createJSONStorage(() => localStorage),
      // Não persistir estado de UI (isOpen sempre começa fechado)
      partialize: (state) => ({
        items: state.items,
        cartCount: state.cartCount,
        cartTotal: state.cartTotal,
      }),
    }
  )
);
