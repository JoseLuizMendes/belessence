import { describe, it, expect, beforeEach, vi } from "vitest";

vi.mock("@/lib/orders/infrastructure/persistence/orders-repository", () => ({
  ordersRepository: {
    findEventForPayment: vi.fn(),
    applyPaymentConfirmation: vi.fn(),
  },
}));

import { confirmPayment } from "@/lib/orders/application/confirm-payment";
import { ordersRepository } from "@/lib/orders/infrastructure/persistence/orders-repository";

describe("confirmPayment (use case)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("aplica confirmação quando paymentId é novo (alreadyProcessed=false)", async () => {
    vi.mocked(ordersRepository.findEventForPayment).mockResolvedValue(null);
    vi.mocked(ordersRepository.applyPaymentConfirmation).mockResolvedValue(undefined as unknown as void);

    const result = await confirmPayment({
      orderId: "order-1",
      paymentId: "MP_NEW",
      mpStatus: "approved",
      paymentMethod: "pix",
    });

    expect(ordersRepository.findEventForPayment).toHaveBeenCalledWith("order-1", "MP_NEW");
    expect(ordersRepository.applyPaymentConfirmation).toHaveBeenCalledWith({
      orderId: "order-1",
      paymentId: "MP_NEW",
      mpStatus: "approved",
      paymentMethod: "pix",
      source: "checkout",
    });
    expect(result).toEqual({ status: "PREPARING", alreadyProcessed: false });
  });

  it("é no-op quando paymentId já foi processado (alreadyProcessed=true)", async () => {
    vi.mocked(ordersRepository.findEventForPayment).mockResolvedValue({
      id: "evt-1",
      orderId: "order-1",
      status: "PAYMENT_CONFIRMED",
      createdAt: new Date(),
      metadata: { paymentId: "MP_NEW" },
    } as never);

    const result = await confirmPayment({
      orderId: "order-1",
      paymentId: "MP_NEW",
      mpStatus: "approved",
      paymentMethod: "pix",
    });

    expect(ordersRepository.applyPaymentConfirmation).not.toHaveBeenCalled();
    expect(result).toEqual({ status: "PREPARING", alreadyProcessed: true });
  });

  it("usa source='webhook' quando fornecido", async () => {
    vi.mocked(ordersRepository.findEventForPayment).mockResolvedValue(null);
    vi.mocked(ordersRepository.applyPaymentConfirmation).mockResolvedValue(undefined as unknown as void);

    await confirmPayment({
      orderId: "order-1",
      paymentId: "MP_HOOK",
      mpStatus: "approved",
      paymentMethod: "credit_card",
      source: "webhook",
    });

    expect(ordersRepository.applyPaymentConfirmation).toHaveBeenCalledWith(
      expect.objectContaining({ source: "webhook" }),
    );
  });
});
