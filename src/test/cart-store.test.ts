/**
 * Testes do Cart Store (Zustand)
 * TDD: Testes escritos antes/junto da implementação.
 */

import { describe, it, expect, beforeEach } from "vitest";
import { useCartStore } from "@/lib/cart-store";

const mockProduct = {
  id: "1",
  slug: "midnight-velvet",
  name: "Midnight Velvet",
  shortDescription: "Fragrância misteriosa",
  price: 189.9,
  image: "/assets/Perf1.jpg",
};

describe("useCartStore", () => {
  beforeEach(() => {
    useCartStore.setState({ items: [], cartCount: 0, cartTotal: 0, isOpen: false });
  });

  it("começa com carrinho vazio", () => {
    const { items, cartCount, cartTotal } = useCartStore.getState();
    expect(items).toHaveLength(0);
    expect(cartCount).toBe(0);
    expect(cartTotal).toBe(0);
  });

  it("adiciona item ao carrinho", () => {
    useCartStore.getState().addItem(mockProduct);
    const { items, cartCount, cartTotal } = useCartStore.getState();
    expect(items).toHaveLength(1);
    expect(cartCount).toBe(1);
    expect(cartTotal).toBe(189.9);
  });

  it("incrementa quantidade ao adicionar item existente", () => {
    useCartStore.getState().addItem(mockProduct);
    useCartStore.getState().addItem(mockProduct);
    const { items, cartCount } = useCartStore.getState();
    expect(items).toHaveLength(1);
    expect(items[0].quantity).toBe(2);
    expect(cartCount).toBe(2);
  });

  it("remove item do carrinho", () => {
    useCartStore.getState().addItem(mockProduct);
    useCartStore.getState().removeItem("1");
    expect(useCartStore.getState().items).toHaveLength(0);
  });

  it("atualiza quantidade do item", () => {
    useCartStore.getState().addItem(mockProduct);
    useCartStore.getState().updateQuantity("1", 5);
    expect(useCartStore.getState().items[0].quantity).toBe(5);
    expect(useCartStore.getState().cartCount).toBe(5);
  });

  it("remove item quando quantidade vai para 0", () => {
    useCartStore.getState().addItem(mockProduct);
    useCartStore.getState().updateQuantity("1", 0);
    expect(useCartStore.getState().items).toHaveLength(0);
  });

  it("limpa o carrinho", () => {
    useCartStore.getState().addItem(mockProduct);
    useCartStore.getState().clearCart();
    expect(useCartStore.getState().items).toHaveLength(0);
    expect(useCartStore.getState().cartTotal).toBe(0);
  });

  it("abre e fecha o carrinho", () => {
    useCartStore.getState().openCart();
    expect(useCartStore.getState().isOpen).toBe(true);
    useCartStore.getState().closeCart();
    expect(useCartStore.getState().isOpen).toBe(false);
  });

  it("calcula total corretamente com múltiplos itens", () => {
    const product2 = { ...mockProduct, id: "2", slug: "golden-essence", price: 249.9 };
    useCartStore.getState().addItem(mockProduct);
    useCartStore.getState().addItem(product2);
    expect(useCartStore.getState().cartTotal).toBeCloseTo(189.9 + 249.9);
  });
});
