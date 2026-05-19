/**
 * Testes — POST /api/contact
 * Prisma já mockado em setup.ts. Foco: Zod + persistência + status.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "@/app/api/contact/route";
import { prisma } from "@/lib/prisma";

function makeReq(body: unknown): NextRequest {
  return new NextRequest("http://localhost/api/contact", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
  });
}

const validBody = {
  name: "Ana Silva",
  email: "ana@example.com",
  subject: "Dúvida",
  message: "Gostaria de saber mais sobre o produto X.",
};

describe("POST /api/contact", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("retorna 201 + persiste mensagem no caminho feliz", async () => {
    vi.mocked(prisma.contactMessage.create).mockResolvedValueOnce({} as never);
    const res = await POST(makeReq(validBody));
    expect(res.status).toBe(201);
    expect(await res.json()).toEqual({ ok: true });
    expect(prisma.contactMessage.create).toHaveBeenCalledWith({
      data: validBody,
    });
  });

  it("rejeita nome curto com 400", async () => {
    const res = await POST(makeReq({ ...validBody, name: "A" }));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe("Dados inválidos");
    expect(json.details.name).toBeDefined();
    expect(prisma.contactMessage.create).not.toHaveBeenCalled();
  });

  it("rejeita email malformado", async () => {
    const res = await POST(makeReq({ ...validBody, email: "abc" }));
    expect(res.status).toBe(400);
  });

  it("rejeita assunto com menos de 3 caracteres", async () => {
    const res = await POST(makeReq({ ...validBody, subject: "ab" }));
    expect(res.status).toBe(400);
  });

  it("rejeita mensagem com menos de 10 caracteres", async () => {
    const res = await POST(makeReq({ ...validBody, message: "curto" }));
    expect(res.status).toBe(400);
  });

  it("retorna 500 quando Prisma falha", async () => {
    vi.mocked(prisma.contactMessage.create).mockRejectedValueOnce(
      new Error("DB down"),
    );
    const res = await POST(makeReq(validBody));
    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.error).toBe("Erro ao enviar mensagem");
  });
});
