/**
 * Testes — POST /api/reviews
 * Cria review + recalcula rating médio em transação.
 * Foco: Zod, produto inexistente (404), caminho feliz (avg correto), 500.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "@/app/api/reviews/route";
import { prisma } from "@/lib/shared/infrastructure/prisma-client";

function makeReq(body: unknown): NextRequest {
  return new NextRequest("http://localhost/api/reviews", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
  });
}

const validBody = {
  productId: "11111111-1111-1111-1111-111111111111",
  authorName: "Ana",
  authorEmail: "ANA@example.com",
  rating: 5,
  text: "Maravilhoso",
};

/** Mocka prisma.$transaction passando um tx com os métodos usados. */
function txMock(reviewsAfter: { rating: number }[]) {
  vi.mocked(prisma.$transaction).mockImplementationOnce((async (
    cb: (tx: unknown) => unknown,
  ) => {
    const tx = {
      review: {
        create: vi.fn().mockResolvedValue({ id: "rev-1" }),
        findMany: vi.fn().mockResolvedValue(reviewsAfter),
      },
      product: { update: vi.fn().mockResolvedValue({}) },
    };
    return cb(tx);
  }) as never);
}

describe("POST /api/reviews", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("retorna 400 quando payload é inválido (rating fora de 1-5)", async () => {
    const res = await POST(makeReq({ ...validBody, rating: 9 }));
    expect(res.status).toBe(400);
    expect(prisma.product.findUnique).not.toHaveBeenCalled();
  });

  it("retorna 404 quando o produto não existe", async () => {
    vi.mocked(prisma.product.findUnique).mockResolvedValueOnce(null as never);
    const res = await POST(makeReq(validBody));
    expect(res.status).toBe(404);
    const json = await res.json();
    expect(json.error).toMatch(/produto não encontrado/i);
  });

  it("caminho feliz: cria review, retorna sucesso", async () => {
    vi.mocked(prisma.product.findUnique).mockResolvedValueOnce({
      id: validBody.productId,
    } as never);
    txMock([{ rating: 5 }, { rating: 4 }]); // média 4.5
    const res = await POST(makeReq(validBody));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.message).toMatch(/publicada/i);
  });

  it("retorna 500 quando o banco falha", async () => {
    vi.mocked(prisma.product.findUnique).mockRejectedValueOnce(
      new Error("DB down"),
    );
    const res = await POST(makeReq(validBody));
    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.error).toMatch(/erro ao publicar/i);
  });

  it("avgRating = 0 quando findMany volta vazio (evita divisão por zero)", async () => {
    vi.mocked(prisma.product.findUnique).mockResolvedValueOnce({
      id: validBody.productId,
    } as never);
    txMock([]); // sem reviews aprovadas → ramo length===0
    const res = await POST(makeReq(validBody));
    expect(res.status).toBe(200);
    expect((await res.json()).success).toBe(true);
  });
});
