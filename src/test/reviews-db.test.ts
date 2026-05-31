/**
 * Testes — reviews-db (getFeaturedReviews)
 * Foco: cláusula WHERE (aprovado + nota alta + com texto), mapeamento do
 * shape achatado (nome/slug do produto) e descarte de textos vazios.
 * Prisma é mockado globalmente em src/test/setup.ts.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { prisma } from "@/lib/shared/infrastructure/prisma-client";
import { getFeaturedReviews } from "@/lib/reviews-db";

describe("getFeaturedReviews", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("consulta apenas reviews aprovadas, com texto e nota >= 4", async () => {
    vi.mocked(prisma.review.findMany).mockResolvedValueOnce([] as never);

    await getFeaturedReviews(8);

    const arg = vi.mocked(prisma.review.findMany).mock.calls[0][0];
    expect(arg).toMatchObject({
      where: { approved: true, rating: { gte: 4 }, text: { not: null } },
      orderBy: { createdAt: "desc" },
      take: 8,
    });
  });

  it("achata o produto e descarta textos vazios", async () => {
    vi.mocked(prisma.review.findMany).mockResolvedValueOnce([
      {
        id: "r1",
        authorName: "Ana",
        rating: 5,
        text: "Amei o perfume!",
        product: { name: "Essência do Amanhecer", slug: "essencia-amanhecer" },
      },
      {
        id: "r2",
        authorName: "Bia",
        rating: 4,
        text: "   ",
        product: { name: "Âmbar Noturno", slug: "ambar-noturno" },
      },
    ] as never);

    const result = await getFeaturedReviews();

    expect(result).toEqual([
      {
        id: "r1",
        authorName: "Ana",
        rating: 5,
        text: "Amei o perfume!",
        productName: "Essência do Amanhecer",
        productSlug: "essencia-amanhecer",
      },
    ]);
  });

  it("usa limit padrão de 12 quando não informado", async () => {
    vi.mocked(prisma.review.findMany).mockResolvedValueOnce([] as never);

    await getFeaturedReviews();

    expect(vi.mocked(prisma.review.findMany).mock.calls[0][0]).toMatchObject({
      take: 12,
    });
  });
});
