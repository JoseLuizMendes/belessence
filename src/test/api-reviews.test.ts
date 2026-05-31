/**
 * Testes — GET /api/reviews/[productId]
 * Foco: filtro approved + ordenação desc + limite 50.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "@/app/api/reviews/[productId]/route";
import { prisma } from "@/lib/shared/infrastructure/prisma-client";

function callGet(productId: string) {
  return GET(
    new NextRequest("http://localhost/api/reviews/" + productId),
    { params: Promise.resolve({ productId }) },
  );
}

describe("GET /api/reviews/[productId]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("retorna lista de reviews aprovadas, ordenadas desc, limite 50", async () => {
    const reviews = [
      { id: "r1", productId: "p1", rating: 5, text: "ótimo" },
      { id: "r2", productId: "p1", rating: 4, text: "bom" },
    ];
    vi.mocked(prisma.review.findMany).mockResolvedValueOnce(reviews as never);
    const res = await callGet("p1");
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(reviews);

    expect(prisma.review.findMany).toHaveBeenCalledWith({
      where: { productId: "p1", approved: true },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
  });

  it("retorna [] quando produto não tem reviews", async () => {
    vi.mocked(prisma.review.findMany).mockResolvedValueOnce([] as never);
    const res = await callGet("p-sem-reviews");
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual([]);
  });

  it("retorna 500 quando Prisma falha", async () => {
    vi.mocked(prisma.review.findMany).mockRejectedValueOnce(
      new Error("DB down"),
    );
    const res = await callGet("p1");
    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.error).toBe("Erro ao buscar avaliações");
  });
});
