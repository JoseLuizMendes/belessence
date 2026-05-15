/**
 * Payment Provider — Belessence
 * ─────────────────────────────────────────────────────────────────────
 * Camada de abstração sobre o gateway de pagamento.
 *
 * 🚧 IMPLEMENTAÇÃO MOCK 🚧
 * Atualmente simula uma confirmação imediata de pagamento.
 * Toda chamada retorna { status: 'approved' } com paymentId único.
 *
 * Para integrar Mercado Pago real:
 *  1. Adicionar env vars: MP_ACCESS_TOKEN, MP_WEBHOOK_SECRET
 *  2. Trocar `createPayment` por chamada real à API do MP (ver SDK mercadopago)
 *  3. Criar route handler /api/webhooks/mp/route.ts para receber notificações
 *     e atualizar o `order.status` quando o pagamento for confirmado
 *  4. Por enquanto, mantemos PAYMENT_CONFIRMED imediato no checkout
 *
 * O schema `Order` já tem os campos `mpPaymentId`, `mpStatus` e `paymentMethod`
 * preparados para receber a integração real sem migrations.
 */

import { randomUUID } from "crypto";

export type PaymentMethod = "pix" | "credit_card" | "boleto";
export type PaymentStatus = "approved" | "pending" | "rejected";

export interface CreatePaymentInput {
  orderId: string;
  amount: number;          // total em R$
  customerName: string;
  customerEmail: string;
  customerCpf: string;
}

export interface PaymentResult {
  paymentId: string;        // MP_<uuid> no mock; id real do MP em produção
  status: PaymentStatus;
  paymentMethod: PaymentMethod;
  createdAt: Date;
}

const PAYMENT_METHODS: PaymentMethod[] = ["pix", "credit_card", "boleto"];

/**
 * Cria um pagamento no provider.
 *
 * 🚧 MOCK: sempre retorna `approved` com método aleatório.
 * Em produção: chama API do Mercado Pago e retorna o resultado real (que pode
 * ser `pending` para boleto/pix, etc — o webhook confirma depois).
 */
export async function createPayment(
  input: CreatePaymentInput,
): Promise<PaymentResult> {
  // Hook futuro: o `input` (orderId, amount, etc) será enviado ao Mercado Pago.
  // No mock atual apenas registramos para debug em dev.
  if (process.env.NODE_ENV === "development") {
    console.debug("[mock-payment] createPayment", input);
  }

  // Simula latência de chamada externa (50-150ms)
  await new Promise((resolve) =>
    setTimeout(resolve, 50 + Math.random() * 100),
  );

  return {
    paymentId: `MOCK_${randomUUID()}`,
    status: "approved",
    paymentMethod:
      PAYMENT_METHODS[Math.floor(Math.random() * PAYMENT_METHODS.length)],
    createdAt: new Date(),
  };
}

/**
 * Indica se o módulo está em modo mock.
 * Útil para mostrar avisos na UI (ex.: badge "Modo Demo" no checkout).
 */
export function isMockPayment(): boolean {
  return !process.env.MP_ACCESS_TOKEN;
}
