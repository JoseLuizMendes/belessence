/**
 * Testes — wishlist-repository (Prisma adapter)
 * Mocka Prisma; verifica que os métodos disparam as queries certas.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";

import { prisma } from "@/lib/shared/infrastructure/prisma-client";
import {
  getWishlistProductIds,
  toggleWishlist,
  removeWishlistItem,
  clearWishlist,
} from "@/lib/wishlist/infrastructure/persistence/wishlist-repository";

// O setup global já mocka prisma.* — aqui só configuramos os modelos
// usados pelo wishlist (não há mock dedicado no setup pra wishlistItem).
// Adicionamos os mocks via cast — o setup.ts mock global cobre os models
// principais; pra wishlistItem, fazemos override local.
const wishlistItem = {
  findMany: vi.fn(),
  findUnique: vi.fn(),
  delete: vi.fn(),
  create: vi.fn(),
  deleteMany: vi.fn(),
};
// @ts-expect-error — injeta o submodel mockado no prisma mockado
prisma.wishlistItem = wishlistItem;

describe("wishlist-repository", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("getWishlistProductIds retorna lista de productIds do usuário", async () => {
    wishlistItem.findMany.mockResolvedValueOnce([
      { productId: "p-1" },
      { productId: "p-2" },
    ]);
    const ids = await getWishlistProductIds("u-1");
    expect(ids).toEqual(["p-1", "p-2"]);
    expect(wishlistItem.findMany).toHaveBeenCalledWith({
      where: { userId: "u-1" },
      select: { productId: true },
    });
  });

  it("toggleWishlist deleta + retorna false quando já existia", async () => {
    wishlistItem.findUnique.mockResolvedValueOnce({ id: "w-1" });
    wishlistItem.delete.mockResolvedValueOnce({});
    const result = await toggleWishlist("u-1", "p-1");
    expect(result).toBe(false);
    expect(wishlistItem.delete).toHaveBeenCalledWith({ where: { id: "w-1" } });
    expect(wishlistItem.create).not.toHaveBeenCalled();
  });

  it("toggleWishlist cria + retorna true quando não existia", async () => {
    wishlistItem.findUnique.mockResolvedValueOnce(null);
    wishlistItem.create.mockResolvedValueOnce({ id: "w-new" });
    const result = await toggleWishlist("u-1", "p-1");
    expect(result).toBe(true);
    expect(wishlistItem.create).toHaveBeenCalledWith({
      data: { userId: "u-1", productId: "p-1" },
    });
  });

  it("removeWishlistItem dispara deleteMany por user+product", async () => {
    await removeWishlistItem("u-1", "p-1");
    expect(wishlistItem.deleteMany).toHaveBeenCalledWith({
      where: { userId: "u-1", productId: "p-1" },
    });
  });

  it("clearWishlist dispara deleteMany do usuário", async () => {
    await clearWishlist("u-1");
    expect(wishlistItem.deleteMany).toHaveBeenCalledWith({
      where: { userId: "u-1" },
    });
  });
});
