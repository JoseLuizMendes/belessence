/**
 * Testes — POST /api/coupon/validate
 * Mocka @/lib/coupons (já tem suite própria em coupons.test.ts).
 * Foco: wrapper HTTP, status codes, propagação do resultado.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/coupons", () => ({
  validateCoupon: vi.fn(),
}));

import { POST } from "@/app/api/coupon/validate/route";
import { validateCoupon } from "@/lib/coupons";

function makeReq(body: unknown): NextRequest {
  return new NextRequest("http://localhost/api/coupon/validate", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
  });
}

describe("POST /api/coupon/validate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("retorna 400 quando payload é inválido", async () => {
    const res = await POST(makeReq({ code: "", orderSubtotal: 100 }));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.valid).toBe(false);
    expect(json.message).toBe("Dados inválidos");
    expect(validateCoupon).not.toHaveBeenCalled();
  });

  it("retorna 400 quando orderSubtotal não é positivo", async () => {
    const res = await POST(makeReq({ code: "PROMO10", orderSubtotal: 0 }));
    expect(res.status).toBe(400);
  });

  it("retorna 200 quando cupom é válido", async () => {
    vi.mocked(validateCoupon).mockResolvedValueOnce({
      valid: true,
      discount: 10,
      code: "PROMO10",
      type: "PERCENTAGE",
      value: 10,
      message: "Desconto aplicado: 10% OFF",
    });
    const res = await POST(makeReq({ code: "PROMO10", orderSubtotal: 100 }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.valid).toBe(true);
    expect(json.discount).toBe(10);
    expect(validateCoupon).toHaveBeenCalledWith("PROMO10", 100);
  });

  it("retorna 400 quando cupom é inválido pelo domínio", async () => {
    vi.mocked(validateCoupon).mockResolvedValueOnce({
      valid: false,
      discount: 0,
      message: "Cupom expirado",
    });
    const res = await POST(makeReq({ code: "VELHO", orderSubtotal: 100 }));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.valid).toBe(false);
    expect(json.message).toBe("Cupom expirado");
  });

  it("retorna 500 quando validateCoupon lança", async () => {
    vi.mocked(validateCoupon).mockRejectedValueOnce(new Error("DB down"));
    const res = await POST(makeReq({ code: "X", orderSubtotal: 100 }));
    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.valid).toBe(false);
    expect(json.message).toBe("Erro interno ao validar cupom");
  });

  it("normaliza code (uppercase) ao chamar validateCoupon", async () => {
    vi.mocked(validateCoupon).mockResolvedValueOnce({
      valid: true,
      discount: 5,
      code: "PROMO5",
      type: "FIXED",
      value: 5,
    });
    await POST(makeReq({ code: "promo5", orderSubtotal: 50 }));
    // couponValidateSchema aplica .toUpperCase() — o handler deve passar "PROMO5"
    expect(validateCoupon).toHaveBeenCalledWith("PROMO5", 50);
  });
});
