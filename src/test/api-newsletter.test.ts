/**
 * Testes — POST /api/newsletter
 * Foco: idempotência (email duplicado → 200 com alreadySubscribed), reativação
 * de inscrito inativo, normalização (lowercase + trim).
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "@/app/api/newsletter/route";
import { prisma } from "@/lib/prisma";

function makeReq(body: unknown): NextRequest {
  return new NextRequest("http://localhost/api/newsletter", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
  });
}

describe("POST /api/newsletter", () => {
  beforeEach(() => {
    // resetAllMocks limpa também a fila de mockResolvedValueOnce — necessário
    // porque alguns testes (Zod inválido) não consomem o mock empilhado.
    vi.resetAllMocks();
  });

  it("retorna 400 para email malformado", async () => {
    const res = await POST(makeReq({ email: "abc" }));
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "Email inválido" });
    expect(prisma.newsletterSubscriber.findUnique).not.toHaveBeenCalled();
  });

  it("inscreve email novo (caminho feliz)", async () => {
    vi.mocked(prisma.newsletterSubscriber.findUnique).mockResolvedValueOnce(
      null as never,
    );
    vi.mocked(prisma.newsletterSubscriber.create).mockResolvedValueOnce(
      {} as never,
    );
    const res = await POST(makeReq({ email: "lead@example.com" }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.alreadySubscribed).toBe(false);
    expect(prisma.newsletterSubscriber.create).toHaveBeenCalledWith({
      data: { email: "lead@example.com" },
    });
  });

  it("normaliza email para lowercase antes de buscar", async () => {
    // Nota: o handler também faz .trim(), mas Zod email() já rejeita strings
    // com espaços nas extremidades antes do trim rodar. Aqui validamos só lowercase.
    vi.mocked(prisma.newsletterSubscriber.findUnique).mockResolvedValueOnce(
      null as never,
    );
    vi.mocked(prisma.newsletterSubscriber.create).mockResolvedValueOnce(
      {} as never,
    );
    await POST(makeReq({ email: "Lead@Example.COM" }));
    expect(prisma.newsletterSubscriber.findUnique).toHaveBeenCalledWith({
      where: { email: "lead@example.com" },
    });
    expect(prisma.newsletterSubscriber.create).toHaveBeenCalledWith({
      data: { email: "lead@example.com" },
    });
  });

  it("é idempotente: email já ativo retorna alreadySubscribed: true", async () => {
    vi.mocked(prisma.newsletterSubscriber.findUnique).mockResolvedValueOnce({
      email: "lead@example.com",
      active: true,
    } as never);
    const res = await POST(makeReq({ email: "lead@example.com" }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.alreadySubscribed).toBe(true);
    expect(prisma.newsletterSubscriber.create).not.toHaveBeenCalled();
    expect(prisma.newsletterSubscriber.update).not.toHaveBeenCalled();
  });

  it("reativa inscrito inativo", async () => {
    vi.mocked(prisma.newsletterSubscriber.findUnique).mockResolvedValueOnce({
      email: "lead@example.com",
      active: false,
    } as never);
    vi.mocked(prisma.newsletterSubscriber.update).mockResolvedValueOnce(
      {} as never,
    );
    const res = await POST(makeReq({ email: "lead@example.com" }));
    expect(res.status).toBe(200);
    expect(prisma.newsletterSubscriber.update).toHaveBeenCalledWith({
      where: { email: "lead@example.com" },
      data: { active: true },
    });
    expect(prisma.newsletterSubscriber.create).not.toHaveBeenCalled();
  });

  it("retorna 500 quando Prisma falha", async () => {
    vi.mocked(prisma.newsletterSubscriber.findUnique).mockRejectedValueOnce(
      new Error("DB down"),
    );
    const res = await POST(makeReq({ email: "lead@example.com" }));
    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.error).toBe("Erro interno ao processar inscrição");
  });
});
