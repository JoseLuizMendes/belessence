/**
 * Testes — Cart Server Actions
 * Cobre: deslogado é no-op; logado delega ao repository.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";

// setup.ts global mocka cart-actions inteiro pra outros testes. Aqui queremos
// exercitar a implementação REAL, então desfazemos esse mock e mockamos só
// as dependências (auth + repository).
vi.unmock("@/lib/cart/presentation/cart-actions");

vi.mock("@/lib/auth/infrastructure/external/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("@/lib/cart/infrastructure/persistence/cart-repository", () => ({
  getCart: vi.fn(),
  addToCart: vi.fn(),
  setCartQuantity: vi.fn(),
  removeFromCart: vi.fn(),
  clearCart: vi.fn(),
}));

import { auth } from "@/lib/auth/infrastructure/external/auth";
import * as repo from "@/lib/cart/infrastructure/persistence/cart-repository";
import {
  getCartAction,
  addToCartAction,
  setCartQuantityAction,
  removeFromCartAction,
  clearCartAction,
} from "@/lib/cart/presentation/cart-actions";

// `auth` (NextAuth v5) tem assinatura sobrecarregada; tipamos o mock como uma
// função simples que devolve a sessão (ou null), para o vi.mocked não inferir o
// overload de middleware. Cast via unknown (sem `any`).
const authMock = vi.mocked(
  auth as unknown as () => Promise<{ user: { id: string } } | null>,
);
const repoMock = vi.mocked(repo);

describe("Cart Server Actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("quando deslogado (auth retorna null)", () => {
    beforeEach(() => authMock.mockResolvedValue(null));

    it("getCartAction retorna []", async () => {
      expect(await getCartAction()).toEqual([]);
      expect(repoMock.getCart).not.toHaveBeenCalled();
    });
    it("addToCartAction retorna { ok: false }", async () => {
      expect(await addToCartAction("p-1")).toEqual({ ok: false });
      expect(repoMock.addToCart).not.toHaveBeenCalled();
    });
    it("setCartQuantityAction retorna { ok: false }", async () => {
      expect(await setCartQuantityAction("p-1", 5)).toEqual({ ok: false });
    });
    it("removeFromCartAction retorna { ok: false }", async () => {
      expect(await removeFromCartAction("p-1")).toEqual({ ok: false });
    });
    it("clearCartAction retorna { ok: false }", async () => {
      expect(await clearCartAction()).toEqual({ ok: false });
    });
  });

  describe("quando logado (auth retorna user.id)", () => {
    beforeEach(() =>
      authMock.mockResolvedValue({ user: { id: "u-42" } }),
    );

    it("getCartAction delega para getCart(userId)", async () => {
      repoMock.getCart.mockResolvedValueOnce([
        { productId: "p-1", quantity: 2 },
      ] as unknown as Awaited<ReturnType<typeof repo.getCart>>);
      const items = await getCartAction();
      expect(repoMock.getCart).toHaveBeenCalledWith("u-42");
      expect(items).toHaveLength(1);
    });
    it("addToCartAction delega para addToCart(userId, productId, quantity)", async () => {
      await expect(addToCartAction("p-1", 3)).resolves.toEqual({ ok: true });
      expect(repoMock.addToCart).toHaveBeenCalledWith("u-42", "p-1", 3);
    });
    it("addToCartAction usa quantity=1 por default", async () => {
      await addToCartAction("p-2");
      expect(repoMock.addToCart).toHaveBeenCalledWith("u-42", "p-2", 1);
    });
    it("setCartQuantityAction delega", async () => {
      await setCartQuantityAction("p-1", 7);
      expect(repoMock.setCartQuantity).toHaveBeenCalledWith("u-42", "p-1", 7);
    });
    it("removeFromCartAction delega", async () => {
      await removeFromCartAction("p-1");
      expect(repoMock.removeFromCart).toHaveBeenCalledWith("u-42", "p-1");
    });
    it("clearCartAction delega", async () => {
      await clearCartAction();
      expect(repoMock.clearCart).toHaveBeenCalledWith("u-42");
    });
  });
});
