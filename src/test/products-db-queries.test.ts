/**
 * Testes — products-db queries restantes
 * getProductsByCollection / getFeaturedProducts / getBestsellers.
 * Mesma lógica de serialização + reorder + overfetch que as demais.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  getProductsByCollection,
  getFeaturedProducts,
  getBestsellers,
} from "@/lib/products-db";
import { prisma } from "@/lib/prisma";

function rawRow(over: Record<string, unknown> = {}) {
  const decimal = (n: number) => ({ toString: () => String(n) });
  return {
    id: "p1",
    slug: "x",
    name: "X",
    shortDescription: "",
    description: "",
    price: decimal(100),
    originalPrice: null,
    badge: null,
    badgeVariant: null,
    rating: decimal(4),
    reviews: 0,
    images: [],
    features: [],
    collection: "night",
    category: "perfume",
    totalSold: 0,
    seasonalSold: 0,
    stock: 5,
    status: "NORMAL",
    isLimitedEdition: false,
    markedAsNewUntil: null,
    promotionStartsAt: null,
    promotionEndsAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...over,
  };
}

describe("getProductsByCollection", () => {
  beforeEach(() => vi.clearAllMocks());

  it("filtra por collection + WHERE público e ordena por totalSold desc", async () => {
    vi.mocked(prisma.product.findMany).mockResolvedValueOnce([
      rawRow(),
    ] as never);
    await getProductsByCollection("night");
    expect(prisma.product.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { collection: "night", status: { not: "DISCONTINUED" } },
        orderBy: { totalSold: "desc" },
      }),
    );
  });

  it("serializa e reordena esgotados para o fim", async () => {
    vi.mocked(prisma.product.findMany).mockResolvedValueOnce([
      rawRow({ id: "out", stock: 0 }),
      rawRow({ id: "in", stock: 2 }),
    ] as never);
    const r = await getProductsByCollection("night");
    expect(r.map((p) => p.id)).toEqual(["in", "out"]);
    expect(typeof r[0].price).toBe("number");
  });
});

describe("getFeaturedProducts", () => {
  beforeEach(() => vi.clearAllMocks());

  it("faz overfetch (take = limit*2) e corta no limit", async () => {
    const rows = Array.from({ length: 12 }, (_, i) =>
      rawRow({ id: `p${i}`, stock: 5 }),
    );
    vi.mocked(prisma.product.findMany).mockResolvedValueOnce(rows as never);
    const r = await getFeaturedProducts(6);
    expect(r).toHaveLength(6);
    const arg = vi.mocked(prisma.product.findMany).mock.calls[0][0] as {
      take: number;
    };
    expect(arg.take).toBe(12);
  });

  it("usa limit default 6 quando não informado", async () => {
    vi.mocked(prisma.product.findMany).mockResolvedValueOnce([] as never);
    await getFeaturedProducts();
    const arg = vi.mocked(prisma.product.findMany).mock.calls[0][0] as {
      take: number;
    };
    expect(arg.take).toBe(12);
  });
});

describe("getBestsellers", () => {
  beforeEach(() => vi.clearAllMocks());

  it("ordena por totalSold desc, overfetch e corta no limit", async () => {
    const rows = Array.from({ length: 10 }, (_, i) =>
      rawRow({ id: `p${i}`, stock: 5 }),
    );
    vi.mocked(prisma.product.findMany).mockResolvedValueOnce(rows as never);
    const r = await getBestsellers(5);
    expect(r).toHaveLength(5);
    expect(prisma.product.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ orderBy: { totalSold: "desc" }, take: 10 }),
    );
  });
});
