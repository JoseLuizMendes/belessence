/**
 * Testes — POST /api/checkout
 * ─────────────────────────────────────────────────────────────────────
 * Foco: orquestração HTTP. Libs de domínio são mockadas (têm suítes próprias):
 *   - @/lib/coupons       → validateCoupon
 *   - @/lib/shipping      → getShippingCostByState
 *   - @/lib/payment-provider → createPayment
 *   - @/lib/prisma        → globalmente em setup.ts
 *
 * Casos cobertos:
 *   - Validação Zod (400)
 *   - Produto inexistente (400)
 *   - Estoque insuficiente (400)
 *   - Cupom inválido (400 com mensagem do domínio)
 *   - Caminho feliz sem cupom (subtotal calculado server-side)
 *   - Caminho feliz com cupom (desconto aplicado)
 *   - Pagamento aprovado → status PAYMENT_CONFIRMED
 *   - Pagamento pendente → status PENDING
 *   - Erro inesperado → 500
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/coupons/infrastructure/persistence/coupons-repository", () => ({ validateCoupon: vi.fn() }));
vi.mock("@/lib/shipping/infrastructure/external/shipping", () => ({ getShippingCostByState: vi.fn() }));
vi.mock("@/lib/payment-provider", () => ({ createPayment: vi.fn() }));

import { POST } from "@/app/api/checkout/route";
import { prisma } from "@/lib/shared/infrastructure/prisma-client";
import { validateCoupon } from "@/lib/coupons/infrastructure/persistence/coupons-repository";
import { getShippingCostByState } from "@/lib/shipping/infrastructure/external/shipping";
import { createPayment } from "@/lib/payment-provider";

// ─── Fixtures ────────────────────────────────────────────────────────────────

const customer = {
  name: "Maria Silva",
  email: "maria@example.com",
  phone: "(11) 98765-4321",
  cpf: "390.533.447-05",
};

const address = {
  cep: "01310-100",
  street: "Avenida Paulista",
  number: "1000",
  neighborhood: "Bela Vista",
  city: "São Paulo",
  state: "SP",
};

const productA = {
  id: "prod-a",
  slug: "perfume-a",
  name: "Perfume A",
  price: 100,
  stock: 10,
  images: ["https://cdn/a.jpg"],
  category: "EDP",
};

const productB = {
  id: "prod-b",
  slug: "perfume-b",
  name: "Perfume B",
  price: 250,
  stock: 5,
  images: ["https://cdn/b.jpg"],
  category: "Parfum",
};

function makeReq(body: unknown): NextRequest {
  return new NextRequest("http://localhost/api/checkout", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
  });
}

function happyPaymentMock() {
  vi.mocked(createPayment).mockResolvedValueOnce({
    paymentId: "MP-123",
    status: "approved",
    paymentMethod: "pix",
    // createdAt pode existir; o handler não usa
  } as never);
}

function happyOrderTxMock(orderId = "ord-1") {
  // $transaction recebe um callback(tx). Mockamos tx.* para registrar e retornar
  // um Order válido.
  vi.mocked(prisma.$transaction).mockImplementationOnce((async (
    cb: (tx: unknown) => unknown,
  ) => {
    const tx = {
      order: {
        create: vi.fn().mockResolvedValue({ id: orderId, items: [] }),
      },
      product: {
        update: vi.fn().mockResolvedValue({}),
      },
      coupon: {
        update: vi.fn().mockResolvedValue({}),
      },
    };
    return cb(tx);
  }) as never);
}

// ─── Suites ──────────────────────────────────────────────────────────────────

describe("POST /api/checkout", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("retorna 400 quando payload é inválido (Zod)", async () => {
    const res = await POST(
      makeReq({ customer: { name: "x" }, address, items: [] }),
    );
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe("Dados inválidos");
    expect(prisma.product.findMany).not.toHaveBeenCalled();
  });

  it("retorna 400 quando carrinho é vazio", async () => {
    const res = await POST(makeReq({ customer, address, items: [] }));
    expect(res.status).toBe(400);
  });

  it("retorna 400 quando um produto não existe no banco", async () => {
    vi.mocked(prisma.product.findMany).mockResolvedValueOnce([
      productA,
    ] as never);
    const res = await POST(
      makeReq({
        customer,
        address,
        items: [
          { productId: "prod-a", quantity: 1 },
          { productId: "prod-fantasma", quantity: 1 },
        ],
      }),
    );
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toMatch(/produtos não foram encontrados/);
  });

  it("retorna 400 quando estoque é insuficiente", async () => {
    vi.mocked(prisma.product.findMany).mockResolvedValueOnce([
      { ...productA, stock: 2 },
    ] as never);
    const res = await POST(
      makeReq({
        customer,
        address,
        items: [{ productId: "prod-a", quantity: 5 }],
      }),
    );
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toMatch(/Estoque insuficiente para "Perfume A"/);
    expect(json.error).toMatch(/disponível: 2/);
  });

  it("retorna 400 quando cupom é inválido (propaga mensagem do domínio)", async () => {
    vi.mocked(prisma.product.findMany).mockResolvedValueOnce([
      productA,
    ] as never);
    vi.mocked(validateCoupon).mockResolvedValueOnce({
      valid: false,
      discount: 0,
      message: "Cupom expirado",
    });
    const res = await POST(
      makeReq({
        customer,
        address,
        items: [{ productId: "prod-a", quantity: 1 }],
        couponCode: "VELHO",
      }),
    );
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe("Cupom expirado");
  });

  it("caminho feliz sem cupom: calcula subtotal e total server-side", async () => {
    vi.mocked(prisma.product.findMany).mockResolvedValueOnce([
      productA,
      productB,
    ] as never);
    vi.mocked(getShippingCostByState).mockReturnValueOnce(14.9);
    happyOrderTxMock("ord-1");
    happyPaymentMock();

    const res = await POST(
      makeReq({
        customer,
        address,
        items: [
          { productId: "prod-a", quantity: 2 }, // 2 * 100 = 200
          { productId: "prod-b", quantity: 1 }, // 1 * 250 = 250
        ],
      }),
    );

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.orderId).toBe("ord-1");
    expect(json.status).toBe("PAYMENT_CONFIRMED");
    expect(json.paymentMethod).toBe("pix");

    // Subtotal = 450. Sem cupom → discount=0. Frete passado = 450.
    expect(getShippingCostByState).toHaveBeenCalledWith("SP", 450);

    // Pagamento foi chamado com o total final (subtotal + frete = 464.9)
    expect(createPayment).toHaveBeenCalledWith(
      expect.objectContaining({
        orderId: "ord-1",
        amount: 464.9,
        customerEmail: "maria@example.com",
      }),
    );

    // Order atualizado com paymentId após confirmação
    expect(prisma.order.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "ord-1" },
        data: expect.objectContaining({
          status: "PAYMENT_CONFIRMED",
          mpPaymentId: "MP-123",
          mpStatus: "approved",
          paymentMethod: "pix",
        }),
      }),
    );
  });

  it("caminho feliz com cupom: aplica desconto antes do frete", async () => {
    vi.mocked(prisma.product.findMany).mockResolvedValueOnce([
      productA,
    ] as never);
    vi.mocked(validateCoupon).mockResolvedValueOnce({
      valid: true,
      discount: 20,
      code: "PROMO20",
      type: "FIXED",
      value: 20,
    });
    vi.mocked(getShippingCostByState).mockReturnValueOnce(14.9);
    happyOrderTxMock("ord-2");
    happyPaymentMock();

    const res = await POST(
      makeReq({
        customer,
        address,
        items: [{ productId: "prod-a", quantity: 1 }], // subtotal = 100
        couponCode: "promo20",
      }),
    );

    expect(res.status).toBe(200);
    // subtotal=100, discount=20, subtotalAfterDiscount=80, frete=14.9, total=94.9
    expect(getShippingCostByState).toHaveBeenCalledWith("SP", 80);
    expect(createPayment).toHaveBeenCalledWith(
      expect.objectContaining({ amount: 94.9 }),
    );
    expect(validateCoupon).toHaveBeenCalledWith("promo20", 100);
  });

  it("preço sempre vem do banco — ignora qualquer preço enviado pelo client", async () => {
    // Mesmo que o client envie quantity=1 num produto de 100, o subtotal é 100.
    // Aqui simulamos cliente "honesto" mas validamos que findMany foi usado
    // como fonte autoritativa de preço.
    vi.mocked(prisma.product.findMany).mockResolvedValueOnce([
      { ...productA, price: 999 }, // banco diz 999
    ] as never);
    vi.mocked(getShippingCostByState).mockReturnValueOnce(0);
    happyOrderTxMock();
    happyPaymentMock();

    await POST(
      makeReq({
        customer,
        address,
        items: [{ productId: "prod-a", quantity: 1 }],
      }),
    );

    // O total enviado ao payment provider usa o preço do banco (999), não do client
    expect(createPayment).toHaveBeenCalledWith(
      expect.objectContaining({ amount: 999 }),
    );
  });

  it("quando pagamento volta pending, status final fica PENDING", async () => {
    vi.mocked(prisma.product.findMany).mockResolvedValueOnce([
      productA,
    ] as never);
    vi.mocked(getShippingCostByState).mockReturnValueOnce(14.9);
    happyOrderTxMock("ord-3");
    vi.mocked(createPayment).mockResolvedValueOnce({
      paymentId: "MP-999",
      status: "pending",
      paymentMethod: "boleto",
    } as never);

    const res = await POST(
      makeReq({
        customer,
        address,
        items: [{ productId: "prod-a", quantity: 1 }],
      }),
    );
    const json = await res.json();
    expect(json.status).toBe("PENDING");

    expect(prisma.order.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: "PENDING",
          mpStatus: "pending",
        }),
      }),
    );
  });

  it("retorna 500 quando algo inesperado lança", async () => {
    vi.mocked(prisma.product.findMany).mockRejectedValueOnce(
      new Error("connection refused"),
    );
    const res = await POST(
      makeReq({
        customer,
        address,
        items: [{ productId: "prod-a", quantity: 1 }],
      }),
    );
    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.error).toBe("connection refused");
  });

  it("erro não-Error cai na mensagem genérica (500)", async () => {
    // Rejeita com algo que NÃO é instanceof Error → ramo de fallback.
    vi.mocked(prisma.product.findMany).mockRejectedValueOnce(
      "falha crua" as never,
    );
    const res = await POST(
      makeReq({
        customer,
        address,
        items: [{ productId: "prod-a", quantity: 1 }],
      }),
    );
    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.error).toBe("Erro interno ao processar pedido");
  });
});
