/**
 * Testes — Wishlist Store (Zustand + persist)
 * Espelha o padrão de cart-store.test.ts.
 */

import { describe, it, expect, beforeEach } from "vitest";
import { useWishlistStore } from "@/lib/wishlist-store";

describe("useWishlistStore", () => {
  beforeEach(() => {
    useWishlistStore.setState({ items: [], count: 0 });
  });

  it("começa vazia", () => {
    const { items, count } = useWishlistStore.getState();
    expect(items).toEqual([]);
    expect(count).toBe(0);
  });

  it("toggle adiciona produto inexistente", () => {
    useWishlistStore.getState().toggle("p1");
    const { items, count } = useWishlistStore.getState();
    expect(items).toEqual(["p1"]);
    expect(count).toBe(1);
  });

  it("toggle remove produto existente (idempotência inversa)", () => {
    useWishlistStore.getState().toggle("p1");
    useWishlistStore.getState().toggle("p1");
    const { items, count } = useWishlistStore.getState();
    expect(items).toEqual([]);
    expect(count).toBe(0);
  });

  it("has retorna true/false corretamente", () => {
    useWishlistStore.getState().toggle("p1");
    expect(useWishlistStore.getState().has("p1")).toBe(true);
    expect(useWishlistStore.getState().has("p2")).toBe(false);
  });

  it("remove tira o item específico", () => {
    useWishlistStore.getState().toggle("p1");
    useWishlistStore.getState().toggle("p2");
    useWishlistStore.getState().remove("p1");
    expect(useWishlistStore.getState().items).toEqual(["p2"]);
    expect(useWishlistStore.getState().count).toBe(1);
  });

  it("remove em id inexistente é no-op", () => {
    useWishlistStore.getState().toggle("p1");
    useWishlistStore.getState().remove("xx");
    expect(useWishlistStore.getState().items).toEqual(["p1"]);
  });

  it("clear esvazia a lista", () => {
    useWishlistStore.getState().toggle("p1");
    useWishlistStore.getState().toggle("p2");
    useWishlistStore.getState().clear();
    const { items, count } = useWishlistStore.getState();
    expect(items).toEqual([]);
    expect(count).toBe(0);
  });

  it("count reflete sempre o tamanho de items", () => {
    useWishlistStore.getState().toggle("p1");
    useWishlistStore.getState().toggle("p2");
    useWishlistStore.getState().toggle("p3");
    expect(useWishlistStore.getState().count).toBe(3);
    useWishlistStore.getState().toggle("p2");
    expect(useWishlistStore.getState().count).toBe(2);
  });
});
