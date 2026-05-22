/**
 * Testes — products-db (camada de catálogo via Prisma)
 * Prisma mockado em setup.ts. Foco na lógica que vive AQUI (não no Prisma):
 *  - serializeProduct: Decimal → number (invariante Server→Client do Next 16)
 *  - sortInStockFirst: esgotados vão para o fim
 *  - getAllProducts: aplica WHERE público (esconde DISCONTINUED) + reorder
 *  - getProductBySlug: null quando não existe
 *  - getSalesProducts: mapeia PROMO_CONFIG por índice + priceNum
 *
 * Nota: filtros SQL (where/orderBy) são responsabilidade do Prisma — aqui
 * validamos os argumentos passados e a transformação do resultado.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  sortInStockFirst,
  getAllProducts,
  getProductBySlug,
  getSalesProducts,
} from "@/lib/products-db";
import { prisma } from "@/lib/prisma";

/** Linha "crua" como o Prisma devolveria (Decimal como objeto com toString). */
function rawRow(over: Partial<Record<string, unknown>> = {}) {
  const decimal = (n: number) => ({ toString: () => String(n) });
  return {
    id: "p1",
    slug: "midnight",
    name: "Midnight",
    shortDescription: "x",
    description: "y",
    price: decimal(189.9),
    originalPrice: decimal(229.9),
    badge: null,
    badgeVariant: null,
    rating: decimal(4.5),
    reviews: 10,
    images: ["a.jpg"],
    features: [],
    collection: "night",
    category: "perfume",
    totalSold: 100,
    seasonalSold: 30,
    stock: 5,
    status: "NORMAL",
    isLimitedEdition: false,
    markedAsNewUntil: null,
    promotionStartsAt: null,
    promotionEndsAt: null,
    createdAt: new Date("2026-01-01"),
    updatedAt: new Date("2026-01-01"),
    ...over,
  };
}

describe("sortInStockFirst (puro)", () => {
  it("move itens com stock 0 para o fim, preservando ordem interna", () => {
    const rows = [
      { id: "a", stock: 0 },
      { id: "b", stock: 3 },
      { id: "c", stock: 0 },
      { id: "d", stock: 1 },
    ];
    expect(sortInStockFirst(rows).map((r) => r.id)).toEqual([
      "b",
      "d",
      "a",
      "c",
    ]);
  });

  it("lista sem esgotados mantém ordem", () => {
    const rows = [{ id: "a", stock: 2 }, { id: "b", stock: 1 }];
    expect(sortInStockFirst(rows).map((r) => r.id)).toEqual(["a", "b"]);
  });
});

describe("getAllProducts", () => {
  beforeEach(() => vi.clearAllMocks());

  it("serializa Decimal (price/originalPrice/rating) para number", async () => {
    vi.mocked(prisma.product.findMany).mockResolvedValueOnce([
      rawRow(),
    ] as never);

    const [p] = await getAllProducts();
    expect(typeof p.price).toBe("number");
    expect(p.price).toBe(189.9);
    expect(p.originalPrice).toBe(229.9);
    expect(typeof p.rating).toBe("number");
    expect(p.rating).toBe(4.5);
  });

  it("originalPrice null permanece null (não vira 0)", async () => {
    vi.mocked(prisma.product.findMany).mockResolvedValueOnce([
      rawRow({ originalPrice: null }),
    ] as never);
    const [p] = await getAllProducts();
    expect(p.originalPrice).toBeNull();
  });

  it("aplica WHERE público (esconde DISCONTINUED) e ordena por createdAt desc", async () => {
    vi.mocked(prisma.product.findMany).mockResolvedValueOnce([] as never);
    await getAllProducts();
    expect(prisma.product.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { status: { not: "DISCONTINUED" } },
        orderBy: { createdAt: "desc" },
      }),
    );
  });

  it("reordena esgotados para o fim", async () => {
    vi.mocked(prisma.product.findMany).mockResolvedValueOnce([
      rawRow({ id: "out", stock: 0 }),
      rawRow({ id: "in", stock: 4 }),
    ] as never);
    const result = await getAllProducts();
    expect(result.map((p) => p.id)).toEqual(["in", "out"]);
  });
});

describe("getProductBySlug", () => {
  beforeEach(() => vi.clearAllMocks());

  it("retorna null quando não existe", async () => {
    vi.mocked(prisma.product.findUnique).mockResolvedValueOnce(null as never);
    expect(await getProductBySlug("nao-existe")).toBeNull();
  });

  it("serializa o produto quando existe", async () => {
    vi.mocked(prisma.product.findUnique).mockResolvedValueOnce(
      rawRow({ slug: "achei" }) as never,
    );
    const p = await getProductBySlug("achei");
    expect(p?.slug).toBe("achei");
    expect(typeof p?.price).toBe("number");
  });
});

describe("getSalesProducts", () => {
  beforeEach(() => vi.clearAllMocks());

  it("mapeia PROMO_CONFIG por índice e define priceNum", async () => {
    vi.mocked(prisma.product.findMany).mockResolvedValueOnce([
      rawRow({ id: "s1", stock: 5, price: { toString: () => "100" } }),
      rawRow({ id: "s2", stock: 5, price: { toString: () => "200" } }),
    ] as never);

    const sales = await getSalesProducts();
    expect(sales[0].iconName).toBe("Timer"); // PROMO_CONFIG[0]
    expect(sales[1].iconName).toBe("Sparkles"); // PROMO_CONFIG[1]
    expect(sales[0].priceNum).toBe(100);
    expect(sales[0].promoTitle).toMatch(/oferta da madrugada/i);
  });

  it("consulta apenas PROMOTION com janela ativa", async () => {
    vi.mocked(prisma.product.findMany).mockResolvedValueOnce([] as never);
    await getSalesProducts();
    const arg = vi.mocked(prisma.product.findMany).mock.calls[0][0] as {
      where: { status: string };
      take: number;
    };
    expect(arg.where.status).toBe("PROMOTION");
    expect(arg.take).toBe(3);
  });
});
