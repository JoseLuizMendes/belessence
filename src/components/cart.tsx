"use client";

/**
 * cart.tsx — Camada de compatibilidade
 * Re-exporta o store Zustand com API compatível com os componentes existentes.
 * Substitui o Context API anterior.
 */

import { ReactNode } from "react";
import { useCartStore, CartProduct } from "@/lib/cart-store";

export type { CartProduct as Product, CartItem } from "@/lib/cart-store";

// ─── PROVIDER (não-op — Zustand não precisa de Provider) ─────────────────────

export function CartProvider({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

// ─── HOOK COMPATÍVEL ─────────────────────────────────────────────────────────

export function useCart() {
  const store = useCartStore();

  const selectedItems = store.items.filter((i) =>
    store.selectedIds.includes(i.id),
  );
  const selectedCount = selectedItems.reduce((acc, i) => acc + i.quantity, 0);
  const selectedTotal = selectedItems.reduce(
    (acc, i) => acc + i.price * i.quantity,
    0,
  );

  return {
    items: store.items,
    cartCount: store.cartCount,
    cartTotal: store.cartTotal,
    isCartOpen: store.isOpen,
    setIsCartOpen: (open: boolean) => (open ? store.openCart() : store.closeCart()),

    addToCart: (product: CartProduct) => store.addItem(product),
    removeFromCart: (productId: string) => store.removeItem(productId),
    updateQuantity: (productId: string, quantity: number) =>
      store.updateQuantity(productId, quantity),
    clearCart: () => store.clearCart(),

    // Seleção para checkout parcial
    selectedIds: store.selectedIds,
    selectedItems,
    selectedCount,
    selectedTotal,
    isSelected: (productId: string) => store.selectedIds.includes(productId),
    toggleSelected: (productId: string) => store.toggleSelected(productId),
    setAllSelected: (selected: boolean) => store.setAllSelected(selected),
    removeOrdered: (productIds: string[]) => store.removeOrdered(productIds),
  };
}
