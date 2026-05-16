/**
 * Lib de Cupons — Belessence
 * ─────────────────────────────────────────────────────────────────────
 * Valida e calcula desconto de cupons cadastrados no banco.
 * Usado pelo /api/coupon/validate e /api/checkout (server-only).
 */

import { prisma } from "./prisma";

export interface CouponValidationResult {
  valid: boolean;
  discount: number;        // valor em R$ a descontar (0 se inválido)
  message?: string;        // mensagem de erro/info
  code?: string;           // código normalizado em uppercase
  type?: "PERCENTAGE" | "FIXED";
  value?: number;          // valor original do cupom (% ou R$)
}

/**
 * Valida um código de cupom contra um subtotal.
 * Aplica regras:
 *  - Cupom existe e está ativo
 *  - Não expirou
 *  - Não atingiu maxUses
 *  - Subtotal >= minOrder (se houver)
 *
 * Retorna o desconto calculado em R$ — limitado ao subtotal (não permite total negativo).
 */
export async function validateCoupon(
  rawCode: string,
  subtotal: number,
): Promise<CouponValidationResult> {
  const code = rawCode.trim().toUpperCase();

  if (!code) {
    return { valid: false, discount: 0, message: "Código vazio" };
  }

  if (subtotal <= 0) {
    return { valid: false, discount: 0, message: "Subtotal inválido" };
  }

  const coupon = await prisma.coupon.findUnique({ where: { code } });

  if (!coupon) {
    return { valid: false, discount: 0, message: "Cupom não encontrado" };
  }

  if (!coupon.active) {
    return { valid: false, discount: 0, message: "Cupom inativo" };
  }

  if (coupon.expiresAt && coupon.expiresAt < new Date()) {
    return { valid: false, discount: 0, message: "Cupom expirado" };
  }

  if (coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses) {
    return { valid: false, discount: 0, message: "Cupom esgotado" };
  }

  const minOrder = coupon.minOrder ? Number(coupon.minOrder) : 0;
  if (minOrder > 0 && subtotal < minOrder) {
    return {
      valid: false,
      discount: 0,
      message: `Pedido mínimo de R$ ${minOrder.toFixed(2).replace(".", ",")}`,
    };
  }

  const couponValue = Number(coupon.value);

  // Calcula desconto
  let discount = 0;
  if (coupon.type === "PERCENTAGE") {
    discount = (subtotal * couponValue) / 100;
  } else if (coupon.type === "FIXED") {
    discount = couponValue;
  }

  // Nunca permite desconto maior que o subtotal
  discount = Math.min(discount, subtotal);
  // Arredonda para 2 casas
  discount = Math.round(discount * 100) / 100;

  return {
    valid: true,
    discount,
    code: coupon.code,
    type: coupon.type,
    value: couponValue,
    message: `Desconto aplicado: ${formatDiscount(coupon.type, couponValue)}`,
  };
}

function formatDiscount(type: "PERCENTAGE" | "FIXED", value: number): string {
  return type === "PERCENTAGE"
    ? `${value}% OFF`
    : `R$ ${value.toFixed(2).replace(".", ",")} OFF`;
}
