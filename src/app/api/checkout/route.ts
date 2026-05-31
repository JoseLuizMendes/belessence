/**
 * /api/checkout — POST
 * ─────────────────────────────────────────────────────────────────────
 * Cria um Order persistido no banco a partir dos dados do form + cart.
 *
 * Fluxo:
 *  1. Valida payload com checkoutSchema (Zod)
 *  2. Busca produtos via Prisma (revalida preços — NUNCA confia no client)
 *  3. Calcula subtotal, aplica cupom (se houver), calcula frete via UF
 *  4. Chama payment-provider (mock por enquanto) → recebe paymentId/status
 *  5. Cria Order + OrderItems em transação atômica
 *  6. Atualiza stock dos produtos + usedCount do cupom
 *  7. Retorna { orderId } para o client redirecionar pra /sucesso/[id]
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/shared/infrastructure/prisma-client";
import { checkoutSchema } from "@/lib/shared/domain/zod-schemas";
import { validateCoupon } from "@/lib/coupons";
import { getShippingCostByState } from "@/lib/shipping";
import { createPayment } from "@/lib/payment-provider";
import { z } from "zod";

// ─── Schema do body ──────────────────────────────────────────────────────────

const cartItemSchema = z.object({
  productId: z.string(),
  quantity: z.number().int().positive(),
});

const checkoutBodySchema = z.object({
  customer: checkoutSchema.shape.customer,
  address: checkoutSchema.shape.address,
  items: z.array(cartItemSchema).min(1, "Carrinho vazio"),
  couponCode: z.string().optional(),
});

// ─── Handler ─────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = checkoutBodySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Dados inválidos",
          issues: parsed.error.flatten(),
        },
        { status: 400 },
      );
    }

    const { customer, address, items, couponCode } = parsed.data;
    const productIds = items.map((i) => i.productId);

    // ── 1. Busca produtos no banco (revalida preços e estoque) ──────────────
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
    });

    if (products.length !== productIds.length) {
      return NextResponse.json(
        { error: "Um ou mais produtos não foram encontrados" },
        { status: 400 },
      );
    }

    // Cria mapa para lookup rápido + valida estoque
    const productMap = new Map(products.map((p) => [p.id, p]));
    for (const item of items) {
      const p = productMap.get(item.productId);
      if (!p) continue;
      if (p.stock < item.quantity) {
        return NextResponse.json(
          {
            error: `Estoque insuficiente para "${p.name}" (disponível: ${p.stock})`,
          },
          { status: 400 },
        );
      }
    }

    // ── 2. Calcula subtotal server-side ─────────────────────────────────────
    const subtotal = items.reduce((acc, item) => {
      const product = productMap.get(item.productId);
      if (!product) return acc;
      return acc + Number(product.price) * item.quantity;
    }, 0);

    // ── 3. Aplica cupom (se houver) ─────────────────────────────────────────
    let discount = 0;
    let appliedCouponCode: string | null = null;
    if (couponCode && couponCode.trim()) {
      const result = await validateCoupon(couponCode, subtotal);
      if (result.valid) {
        discount = result.discount;
        appliedCouponCode = result.code ?? null;
      } else {
        return NextResponse.json(
          { error: result.message ?? "Cupom inválido" },
          { status: 400 },
        );
      }
    }

    // ── 4. Calcula frete pela UF ────────────────────────────────────────────
    const subtotalAfterDiscount = subtotal - discount;
    const shippingCost = getShippingCostByState(
      address.state,
      subtotalAfterDiscount,
    );

    const total = subtotalAfterDiscount + shippingCost;

    // ── 5. Cria Order + OrderItems + atualiza stock/cupom em transação ──────
    const order = await prisma.$transaction(async (tx) => {
      // Cria o pedido (sem itens primeiro pra ter o ID)
      const newOrder = await tx.order.create({
        data: {
          status: "PENDING", // será atualizado para PAYMENT_CONFIRMED após o pagamento
          customerName: customer.name,
          customerEmail: customer.email,
          customerPhone: customer.phone,
          customerCpf: customer.cpf,
          addressCep: address.cep,
          addressStreet: address.street,
          addressNumber: address.number,
          addressComplement: address.complement ?? null,
          addressNeighborhood: address.neighborhood,
          addressCity: address.city,
          addressState: address.state,
          subtotal,
          shippingCost,
          discount,
          total,
          couponCode: appliedCouponCode,
          items: {
            create: items.map((item) => {
              const product = productMap.get(item.productId)!;
              return {
                productId: product.id,
                productName: product.name,
                productSlug: product.slug,
                category: product.category,
                imageUrl: product.images[0] ?? "",
                price: product.price,
                quantity: item.quantity,
              };
            }),
          },
        },
        include: { items: true },
      });

      // Decrementa stock e incrementa totalSold de cada produto
      for (const item of items) {
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stock: { decrement: item.quantity },
            totalSold: { increment: item.quantity },
            seasonalSold: { increment: item.quantity },
          },
        });
      }

      // Incrementa uso do cupom
      if (appliedCouponCode) {
        await tx.coupon.update({
          where: { code: appliedCouponCode },
          data: { usedCount: { increment: 1 } },
        });
      }

      return newOrder;
    });

    // ── 6. Chama payment provider (MOCK — em produção é Mercado Pago) ───────
    const payment = await createPayment({
      orderId: order.id,
      amount: total,
      customerName: customer.name,
      customerEmail: customer.email,
      customerCpf: customer.cpf,
    });

    // ── 7. Atualiza Order com dados do pagamento ────────────────────────────
    // Como o mock retorna `approved` imediatamente, marcamos como PAYMENT_CONFIRMED.
    // Em produção, isso aconteceria via webhook do MP, e aqui só salvaríamos o paymentId.
    const finalStatus =
      payment.status === "approved" ? "PAYMENT_CONFIRMED" : "PENDING";

    await prisma.order.update({
      where: { id: order.id },
      data: {
        status: finalStatus,
        mpPaymentId: payment.paymentId,
        mpStatus: payment.status,
        paymentMethod: payment.paymentMethod,
      },
    });

    return NextResponse.json({
      orderId: order.id,
      status: finalStatus,
      paymentMethod: payment.paymentMethod,
    });
  } catch (error) {
    console.error("[/api/checkout] Erro:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Erro interno ao processar pedido",
      },
      { status: 500 },
    );
  }
}
