/**
 * orders-repository — adapter Prisma do bounded context Orders.
 *
 * Único arquivo do contexto que conhece o Prisma. Application e domain
 * dependem do shape deste objeto, não do client diretamente (DIP).
 */
import "server-only";
import { prisma } from "@/lib/shared/infrastructure/prisma-client";
import type { OrderStatus } from "../../domain/order-types";

export interface ApplyPaymentConfirmationInput {
  orderId: string;
  paymentId: string;
  mpStatus: string;
  paymentMethod: string;
  source: "checkout" | "webhook";
}

export const ordersRepository = {
  findById(id: string) {
    return prisma.order.findUnique({
      where: { id },
      include: {
        items: true,
        events: { orderBy: { createdAt: "asc" } },
      },
    });
  },

  findByEmail(email: string) {
    return prisma.order.findMany({
      where: { customerEmail: email.toLowerCase() },
      orderBy: { createdAt: "desc" },
      include: {
        items: true,
        events: { orderBy: { createdAt: "asc" } },
      },
    });
  },

  /**
   * Idempotência: chamado antes de `applyPaymentConfirmation`. Se retornar
   * truthy, o pagamento já foi processado e a confirmação é no-op.
   * Retorna o OrderEvent encontrado (útil para debug/log) ou null.
   */
  findEventForPayment(orderId: string, paymentId: string) {
    return prisma.orderEvent.findFirst({
      where: {
        orderId,
        metadata: { path: ["paymentId"], equals: paymentId },
      },
    });
  },

  /**
   * Aplica a regra de negócio: PAYMENT_CONFIRMED → PREPARING numa única
   * transação atômica. Persiste dois OrderEvents (com `auto: true` no
   * segundo para marcar transição derivada).
   */
  applyPaymentConfirmation(input: ApplyPaymentConfirmationInput) {
    return prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id: input.orderId },
        data: {
          status: "PAYMENT_CONFIRMED",
          mpPaymentId: input.paymentId,
          mpStatus: input.mpStatus,
          paymentMethod: input.paymentMethod,
        },
      });
      await tx.orderEvent.create({
        data: {
          orderId: input.orderId,
          status: "PAYMENT_CONFIRMED",
          metadata: {
            paymentId: input.paymentId,
            source: input.source,
          },
        },
      });
      await tx.order.update({
        where: { id: input.orderId },
        data: { status: "PREPARING" },
      });
      await tx.orderEvent.create({
        data: {
          orderId: input.orderId,
          status: "PREPARING",
          metadata: {
            paymentId: input.paymentId,
            source: input.source,
            auto: true,
          },
        },
      });
    });
  },
};

// Reexporta tipo do retorno para uso no application/.
export type OrderWithRelations = NonNullable<
  Awaited<ReturnType<typeof ordersRepository.findById>>
>;
export type { OrderStatus };
