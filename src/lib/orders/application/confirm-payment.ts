/**
 * confirmPayment — use case.
 *
 * Regra de negócio: gateway aprovou o pagamento → o pedido transita por
 * PAYMENT_CONFIRMED e, automaticamente, para PREPARING (em separação).
 * Ambas as transições ficam registradas como OrderEvent.
 *
 * Idempotente por `paymentId`: chamada repetida (webhook retransmitindo)
 * é no-op e retorna `alreadyProcessed: true`.
 */
import "server-only";
import { ordersRepository } from "../infrastructure/persistence/orders-repository";
import type { OrderStatus } from "../domain/order-types";

export interface ConfirmPaymentInput {
  orderId: string;
  paymentId: string;
  mpStatus: string;
  paymentMethod: string;
  source?: "checkout" | "webhook";
}

export interface ConfirmPaymentResult {
  status: OrderStatus;
  alreadyProcessed: boolean;
}

export async function confirmPayment(
  input: ConfirmPaymentInput,
): Promise<ConfirmPaymentResult> {
  const existing = await ordersRepository.findEventForPayment(
    input.orderId,
    input.paymentId,
  );
  if (existing) {
    return { status: "PREPARING", alreadyProcessed: true };
  }

  await ordersRepository.applyPaymentConfirmation({
    orderId: input.orderId,
    paymentId: input.paymentId,
    mpStatus: input.mpStatus,
    paymentMethod: input.paymentMethod,
    source: input.source ?? "checkout",
  });

  return { status: "PREPARING", alreadyProcessed: false };
}
