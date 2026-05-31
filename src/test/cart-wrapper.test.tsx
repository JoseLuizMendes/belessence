/**
 * Testes — cart.tsx (camada de compatibilidade sobre o Zustand store)
 * Foco: useCart mapeia o store para a API legada (addToCart, removeFromCart,
 * updateQuantity, setIsCartOpen). Usa o store REAL (sem mock).
 */

import { describe, it, expect, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { CartProvider, useCart } from "@/components/cart";
import { useCartStore } from "@/lib/cart/presentation/cart-store";

const product = {
  id: "p1",
  slug: "x",
  name: "Produto X",
  shortDescription: "desc",
  price: 100,
  image: "/x.jpg",
};

describe("cart.tsx — useCart", () => {
  beforeEach(() => {
    useCartStore.setState({ items: [], cartCount: 0, cartTotal: 0, isOpen: false });
  });

  it("CartProvider renderiza children (no-op provider)", () => {
    const { result } = renderHook(() => useCart(), {
      wrapper: ({ children }) => <CartProvider>{children}</CartProvider>,
    });
    expect(result.current.items).toEqual([]);
    expect(result.current.cartCount).toBe(0);
  });

  it("addToCart adiciona item e abre o carrinho", () => {
    const { result } = renderHook(() => useCart());
    act(() => result.current.addToCart(product));
    expect(result.current.items).toHaveLength(1);
    expect(result.current.cartCount).toBe(1);
    expect(result.current.cartTotal).toBe(100);
    expect(result.current.isCartOpen).toBe(true);
  });

  it("updateQuantity e removeFromCart refletem no store", () => {
    const { result } = renderHook(() => useCart());
    act(() => result.current.addToCart(product));
    act(() => result.current.updateQuantity("p1", 4));
    expect(result.current.items[0].quantity).toBe(4);
    act(() => result.current.removeFromCart("p1"));
    expect(result.current.items).toHaveLength(0);
  });

  it("setIsCartOpen(true/false) controla a gaveta", () => {
    const { result } = renderHook(() => useCart());
    act(() => result.current.setIsCartOpen(true));
    expect(result.current.isCartOpen).toBe(true);
    act(() => result.current.setIsCartOpen(false));
    expect(result.current.isCartOpen).toBe(false);
  });

  it("clearCart esvazia o carrinho", () => {
    const { result } = renderHook(() => useCart());
    act(() => result.current.addToCart(product));
    act(() => result.current.clearCart());
    expect(result.current.items).toHaveLength(0);
    expect(result.current.cartTotal).toBe(0);
  });
});
