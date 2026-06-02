import { describe, it, expect, beforeEach, vi } from "vitest";

vi.mock("@/lib/shared/infrastructure/prisma-client", () => ({
  prisma: {
    order: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
    },
    orderEvent: {
      findFirst: vi.fn(),
      create: vi.fn(),
    },
    $transaction: vi.fn(async (cb: (tx: unknown) => unknown) => cb({
      order: { update: vi.fn() },
      orderEvent: { create: vi.fn() },
    })),
  },
}));

import { ordersRepository } from "@/lib/orders/infrastructure/persistence/orders-repository";
import { prisma } from "@/lib/shared/infrastructure/prisma-client";

describe("ordersRepository", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("findById", () => {
    it("inclui items e events ordenados", async () => {
      vi.mocked(prisma.order.findUnique).mockResolvedValue(null);

      await ordersRepository.findById("order-1");

      expect(prisma.order.findUnique).toHaveBeenCalledWith({
        where: { id: "order-1" },
        include: {
          items: true,
          events: { orderBy: { createdAt: "asc" } },
        },
      });
    });
  });

  describe("findByEmail", () => {
    it("normaliza email para lowercase e ordena por createdAt desc", async () => {
      vi.mocked(prisma.order.findMany).mockResolvedValue([]);

      await ordersRepository.findByEmail("Maria@Example.com");

      expect(prisma.order.findMany).toHaveBeenCalledWith({
        where: { customerEmail: "maria@example.com" },
        orderBy: { createdAt: "desc" },
        include: {
          items: true,
          events: { orderBy: { createdAt: "asc" } },
        },
      });
    });
  });

  describe("findEventForPayment", () => {
    it("filtra por orderId e metadata.paymentId", async () => {
      vi.mocked(prisma.orderEvent.findFirst).mockResolvedValue(null);

      await ordersRepository.findEventForPayment("order-1", "MP_123");

      expect(prisma.orderEvent.findFirst).toHaveBeenCalledWith({
        where: {
          orderId: "order-1",
          metadata: { path: ["paymentId"], equals: "MP_123" },
        },
      });
    });
  });

  describe("applyPaymentConfirmation", () => {
    it("executa 2 updates e 2 creates dentro de $transaction", async () => {
      const txUpdate = vi.fn();
      const txCreate = vi.fn();
      vi.mocked(prisma.$transaction).mockImplementation(async (cb) =>
        (cb as (tx: unknown) => unknown)({
          order: { update: txUpdate },
          orderEvent: { create: txCreate },
        }),
      );

      await ordersRepository.applyPaymentConfirmation({
        orderId: "order-1",
        paymentId: "MP_123",
        mpStatus: "approved",
        paymentMethod: "pix",
        source: "checkout",
      });

      expect(prisma.$transaction).toHaveBeenCalledTimes(1);
      expect(txUpdate).toHaveBeenCalledTimes(2);
      expect(txCreate).toHaveBeenCalledTimes(2);

      // Primeiro update: status=PAYMENT_CONFIRMED + dados de pagamento
      expect(txUpdate).toHaveBeenNthCalledWith(1, {
        where: { id: "order-1" },
        data: {
          status: "PAYMENT_CONFIRMED",
          mpPaymentId: "MP_123",
          mpStatus: "approved",
          paymentMethod: "pix",
        },
      });

      // Segundo update: status=PREPARING (transição automática)
      expect(txUpdate).toHaveBeenNthCalledWith(2, {
        where: { id: "order-1" },
        data: { status: "PREPARING" },
      });

      // Eventos: PAYMENT_CONFIRMED e PREPARING (com auto:true no segundo)
      expect(txCreate).toHaveBeenNthCalledWith(1, {
        data: {
          orderId: "order-1",
          status: "PAYMENT_CONFIRMED",
          metadata: { paymentId: "MP_123", source: "checkout" },
        },
      });
      expect(txCreate).toHaveBeenNthCalledWith(2, {
        data: {
          orderId: "order-1",
          status: "PREPARING",
          metadata: { paymentId: "MP_123", source: "checkout", auto: true },
        },
      });
    });
  });
});
