/**
 * Testes — products-db filtros (getFilteredProducts / countFilteredProducts)
 * Foco: SORT_MAP → orderBy, buildProductWhere (collection/category/genero/
 * search/min-maxPrice), WHERE público (esconde DISCONTINUED), stock reorder,
 * serialização. Prisma mockado.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  getFilteredProducts,
  countFilteredProducts,
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

/** Extrai o argumento do findMany da última chamada. */
function lastFindManyArg() {
  const calls = vi.mocked(prisma.product.findMany).mock.calls;
  return calls[calls.length - 1][0] as {
    where: { AND: Array<Record<string, unknown>> };
    orderBy: Record<string, "asc" | "desc">;
    take?: number;
  };
}

describe("getFilteredProducts — ordenação", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(prisma.product.findMany).mockResolvedValue([] as never);
  });

  it("default 'best-seller' ordena por totalSold desc", async () => {
    await getFilteredProducts();
    expect(lastFindManyArg().orderBy).toEqual({ totalSold: "desc" });
  });

  it("'price-asc' ordena por price asc", async () => {
    await getFilteredProducts({ sort: "price-asc" });
    expect(lastFindManyArg().orderBy).toEqual({ price: "asc" });
  });

  it("'newest' ordena por createdAt desc", async () => {
    await getFilteredProducts({ sort: "newest" });
    expect(lastFindManyArg().orderBy).toEqual({ createdAt: "desc" });
  });

  it("'name-asc' ordena por name asc", async () => {
    await getFilteredProducts({ sort: "name-asc" });
    expect(lastFindManyArg().orderBy).toEqual({ name: "asc" });
  });

  it("aplica `take` quando limit é informado", async () => {
    await getFilteredProducts({ limit: 12 });
    expect(lastFindManyArg().take).toBe(12);
  });
});

describe("getFilteredProducts — WHERE", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(prisma.product.findMany).mockResolvedValue([] as never);
  });

  it("sempre exclui DISCONTINUED", async () => {
    await getFilteredProducts();
    const and = lastFindManyArg().where.AND;
    expect(and).toContainEqual({ status: { not: "DISCONTINUED" } });
  });

  it("filtra por collection", async () => {
    await getFilteredProducts({ collection: "night" });
    expect(lastFindManyArg().where.AND).toContainEqual({ collection: "night" });
  });

  it("category e genero (alias) mapeiam para category insensitive", async () => {
    await getFilteredProducts({ genero: "feminino" });
    expect(lastFindManyArg().where.AND).toContainEqual({
      category: { equals: "feminino", mode: "insensitive" },
    });
  });

  it("busca textual gera OR em 4 campos", async () => {
    await getFilteredProducts({ search: "velvet" });
    const orClause = lastFindManyArg().where.AND.find((c) => "OR" in c) as {
      OR: Array<Record<string, unknown>>;
    };
    expect(orClause.OR).toHaveLength(4);
    expect(orClause.OR[0]).toEqual({
      name: { contains: "velvet", mode: "insensitive" },
    });
  });

  it("minPrice/maxPrice adicionam faixas", async () => {
    await getFilteredProducts({ minPrice: 100, maxPrice: 300 });
    const and = lastFindManyArg().where.AND;
    expect(and).toContainEqual({ price: { gte: 100 } });
    expect(and).toContainEqual({ price: { lte: 300 } });
  });

  it("search só com espaços é ignorado", async () => {
    await getFilteredProducts({ search: "   " });
    const hasOr = lastFindManyArg().where.AND.some((c) => "OR" in c);
    expect(hasOr).toBe(false);
  });
});

describe("getFilteredProducts — transformação do resultado", () => {
  beforeEach(() => vi.clearAllMocks());

  it("serializa Decimal e reordena esgotados para o fim", async () => {
    vi.mocked(prisma.product.findMany).mockResolvedValueOnce([
      rawRow({ id: "out", stock: 0 }),
      rawRow({ id: "in", stock: 3 }),
    ] as never);
    const result = await getFilteredProducts();
    expect(result.map((p) => p.id)).toEqual(["in", "out"]);
    expect(typeof result[0].price).toBe("number");
  });
});

describe("countFilteredProducts", () => {
  beforeEach(() => vi.clearAllMocks());

  it("retorna o count do Prisma com o mesmo WHERE", async () => {
    vi.mocked(prisma.product.count).mockResolvedValueOnce(7 as never);
    const total = await countFilteredProducts({ collection: "day" });
    expect(total).toBe(7);
    const arg = vi.mocked(prisma.product.count).mock.calls[0][0] as {
      where: { AND: Array<Record<string, unknown>> };
    };
    expect(arg.where.AND).toContainEqual({ collection: "day" });
  });
});
