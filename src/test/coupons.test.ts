/**
 * Testes — validateCoupon (src/lib/coupons.ts)
 * Prisma mockado globalmente em src/test/setup.ts.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { validateCoupon } from "@/lib/coupons";
import { prisma } from "@/lib/shared/infrastructure/prisma-client";

type CouponShape = {
  code: string;
  active: boolean;
  expiresAt: Date | null;
  maxUses: number | null;
  usedCount: number;
  minOrder: number | null;
  type: "PERCENTAGE" | "FIXED";
  value: number;
};

function makeCoupon(overrides: Partial<CouponShape> = {}): CouponShape {
  return {
    code: "PROMO10",
    active: true,
    expiresAt: null,
    maxUses: null,
    usedCount: 0,
    minOrder: null,
    type: "PERCENTAGE",
    value: 10,
    ...overrides,
  };
}

describe("validateCoupon", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejeita código vazio", async () => {
    const r = await validateCoupon("", 100);
    expect(r).toEqual({ valid: false, discount: 0, message: "Código vazio" });
    expect(prisma.coupon.findUnique).not.toHaveBeenCalled();
  });

  it("rejeita código só com espaços", async () => {
    const r = await validateCoupon("   ", 100);
    expect(r.valid).toBe(false);
    expect(r.message).toBe("Código vazio");
  });

  it("rejeita subtotal <= 0", async () => {
    const r = await validateCoupon("PROMO10", 0);
    expect(r).toEqual({ valid: false, discount: 0, message: "Subtotal inválido" });
  });

  it("rejeita quando cupom não existe no banco", async () => {
    vi.mocked(prisma.coupon.findUnique).mockResolvedValueOnce(null as never);
    const r = await validateCoupon("INEXISTENTE", 100);
    expect(r.valid).toBe(false);
    expect(r.message).toBe("Cupom não encontrado");
  });

  it("rejeita cupom inativo", async () => {
    vi.mocked(prisma.coupon.findUnique).mockResolvedValueOnce(
      makeCoupon({ active: false }) as never,
    );
    const r = await validateCoupon("PROMO10", 100);
    expect(r.valid).toBe(false);
    expect(r.message).toBe("Cupom inativo");
  });

  it("rejeita cupom expirado", async () => {
    vi.mocked(prisma.coupon.findUnique).mockResolvedValueOnce(
      makeCoupon({ expiresAt: new Date("2020-01-01") }) as never,
    );
    const r = await validateCoupon("PROMO10", 100);
    expect(r.valid).toBe(false);
    expect(r.message).toBe("Cupom expirado");
  });

  it("rejeita cupom esgotado (usedCount >= maxUses)", async () => {
    vi.mocked(prisma.coupon.findUnique).mockResolvedValueOnce(
      makeCoupon({ maxUses: 5, usedCount: 5 }) as never,
    );
    const r = await validateCoupon("PROMO10", 100);
    expect(r.valid).toBe(false);
    expect(r.message).toBe("Cupom esgotado");
  });

  it("rejeita pedido abaixo do mínimo", async () => {
    vi.mocked(prisma.coupon.findUnique).mockResolvedValueOnce(
      makeCoupon({ minOrder: 200 }) as never,
    );
    const r = await validateCoupon("PROMO10", 100);
    expect(r.valid).toBe(false);
    expect(r.message).toMatch(/Pedido mínimo de R\$ 200,00/);
  });

  it("calcula PERCENTAGE: 10% sobre R$ 100 = R$ 10", async () => {
    vi.mocked(prisma.coupon.findUnique).mockResolvedValueOnce(
      makeCoupon({ type: "PERCENTAGE", value: 10 }) as never,
    );
    const r = await validateCoupon("PROMO10", 100);
    expect(r.valid).toBe(true);
    expect(r.discount).toBe(10);
    expect(r.type).toBe("PERCENTAGE");
  });

  it("calcula FIXED: R$50 sobre R$80 = R$50", async () => {
    vi.mocked(prisma.coupon.findUnique).mockResolvedValueOnce(
      makeCoupon({ type: "FIXED", value: 50 }) as never,
    );
    const r = await validateCoupon("FIX50", 80);
    expect(r.valid).toBe(true);
    expect(r.discount).toBe(50);
  });

  it("limita desconto ao subtotal (FIXED 200 sobre R$100 → 100)", async () => {
    vi.mocked(prisma.coupon.findUnique).mockResolvedValueOnce(
      makeCoupon({ type: "FIXED", value: 200 }) as never,
    );
    const r = await validateCoupon("MEGA", 100);
    expect(r.valid).toBe(true);
    expect(r.discount).toBe(100);
  });

  it("arredonda para 2 casas decimais (15% sobre 33.33)", async () => {
    vi.mocked(prisma.coupon.findUnique).mockResolvedValueOnce(
      makeCoupon({ type: "PERCENTAGE", value: 15 }) as never,
    );
    const r = await validateCoupon("PROMO15", 33.33);
    // 33.33 * 15 / 100 = 4.9995 → 5.00
    expect(r.discount).toBe(5);
  });

  it("normaliza o código (trim + uppercase) antes de buscar", async () => {
    vi.mocked(prisma.coupon.findUnique).mockResolvedValueOnce(
      makeCoupon({ code: "PROMO10" }) as never,
    );
    await validateCoupon("  promo10 ", 100);
    expect(prisma.coupon.findUnique).toHaveBeenCalledWith({
      where: { code: "PROMO10" },
    });
  });
});
