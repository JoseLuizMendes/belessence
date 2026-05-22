/**
 * Testes — payment-provider (mock atual do Mercado Pago)
 * Foco: contrato de createPayment e detecção de modo mock.
 */

import { describe, it, expect, afterEach, vi } from "vitest";
import { createPayment, isMockPayment } from "@/lib/payment-provider";

const input = {
  orderId: "ord-1",
  amount: 199.9,
  customerName: "Maria",
  customerEmail: "maria@example.com",
  customerCpf: "39053344705",
};

describe("createPayment (mock)", () => {
  it("retorna status 'approved' com paymentId prefixado e método válido", async () => {
    const r = await createPayment(input);
    expect(r.status).toBe("approved");
    expect(r.paymentId).toMatch(/^MOCK_/);
    expect(["pix", "credit_card", "boleto"]).toContain(r.paymentMethod);
    expect(r.createdAt).toBeInstanceOf(Date);
  });

  it("gera paymentId único a cada chamada", async () => {
    const a = await createPayment(input);
    const b = await createPayment(input);
    expect(a.paymentId).not.toBe(b.paymentId);
  });
});

describe("isMockPayment", () => {
  const original = process.env.MP_ACCESS_TOKEN;

  afterEach(() => {
    if (original === undefined) delete process.env.MP_ACCESS_TOKEN;
    else process.env.MP_ACCESS_TOKEN = original;
    vi.unstubAllEnvs();
  });

  it("é true quando MP_ACCESS_TOKEN está ausente", () => {
    delete process.env.MP_ACCESS_TOKEN;
    expect(isMockPayment()).toBe(true);
  });

  it("é false quando MP_ACCESS_TOKEN está definido", () => {
    process.env.MP_ACCESS_TOKEN = "token-real";
    expect(isMockPayment()).toBe(false);
  });
});
