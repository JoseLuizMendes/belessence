/**
 * Testes — CheckoutClient
 * ─────────────────────────────────────────────────────────────────────
 * O orquestrador do fluxo de compra no client. Foco em:
 *   - Estado vazio (carrinho sem itens)
 *   - Aplicar cupom (success/erro) e remover
 *   - Autofill de CEP ao completar 8 dígitos
 *   - Submit do pedido: caminho feliz → router.push + clearCart
 *   - Submit com erro da API → toast.error, sem navegação
 *
 * O form completo é validado por Zod — usamos UFs/dados válidos quando
 * testamos submit. Mascaras (CPF/telefone/CEP) são detalhe de UI; cobertas
 * indiretamente pelo fluxo de submit.
 */

import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode, AnchorHTMLAttributes, ImgHTMLAttributes } from "react";

const {
  state,
  updateQuantity,
  removeFromCart,
  clearCart,
  setIsCartOpen,
  routerPush,
  toastSuccess,
  toastError,
} = vi.hoisted(() => ({
  state: {
    items: [] as Array<{
      id: string;
      slug: string;
      name: string;
      shortDescription: string;
      price: number;
      quantity: number;
      image: string;
    }>,
    cartTotal: 0,
    isCartOpen: false,
  },
  updateQuantity: vi.fn(),
  removeFromCart: vi.fn(),
  clearCart: vi.fn(),
  setIsCartOpen: vi.fn(),
  routerPush: vi.fn(),
  toastSuccess: vi.fn(),
  toastError: vi.fn(),
}));

vi.mock("@/components/cart", () => ({
  useCart: () => ({
    items: state.items,
    cartTotal: state.cartTotal,
    isCartOpen: state.isCartOpen,
    setIsCartOpen,
    updateQuantity,
    removeFromCart,
    clearCart,
  }),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: routerPush,
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn(),
  }),
}));

vi.mock("sonner", () => ({
  toast: { success: toastSuccess, error: toastError },
}));

vi.mock("next/image", () => ({
  default: (props: ImgHTMLAttributes<HTMLImageElement> & {
    fill?: boolean;
    priority?: boolean;
  }) => {
    const { fill: _fill, priority: _priority, ...rest } = props;
    void _fill;
    void _priority;
    // eslint-disable-next-line @next/next/no-img-element
    return <img {...rest} alt={rest.alt ?? ""} />;
  },
}));

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...rest
  }: AnchorHTMLAttributes<HTMLAnchorElement> & { children: ReactNode }) => (
    <a href={typeof href === "string" ? href : "#"} {...rest}>
      {children}
    </a>
  ),
}));

import CheckoutClient from "@/components/checkout-client";

function setCart(items: typeof state.items) {
  state.items = items;
  state.cartTotal = items.reduce((acc, i) => acc + i.price * i.quantity, 0);
}

async function fillByLabel(label: RegExp, value: string) {
  const user = userEvent.setup();
  const input = screen.getByLabelText(label);
  await user.clear(input);
  await user.type(input, value);
}

const sampleItem = {
  id: "uuid-1",
  slug: "midnight-velvet",
  name: "Midnight Velvet",
  shortDescription: "Misteriosa",
  price: 100,
  quantity: 2,
  image: "img.jpg",
};

describe("CheckoutClient — estado vazio", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setCart([]);
  });

  it("mostra 'Bolsa vazia' com CTA para continuar comprando", () => {
    render(<CheckoutClient />);
    expect(screen.getByText(/^bolsa vazia$/i)).toBeInTheDocument();
    const cta = screen.getByRole("link", { name: /continuar comprando/i });
    expect(cta).toHaveAttribute("href", "/allProducts");
  });
});

describe("CheckoutClient — cupom", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setCart([sampleItem]);
    vi.spyOn(globalThis, "fetch");
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("botão 'Aplicar' está disabled enquanto o input de cupom está vazio", async () => {
    const user = userEvent.setup();
    render(<CheckoutClient />);
    const aplicar = screen.getByRole("button", { name: /^aplicar$/i });
    expect(aplicar).toBeDisabled();

    // Após digitar algo, habilita
    await user.type(screen.getByPlaceholderText(/BELES10/i), "PROMO");
    expect(aplicar).not.toBeDisabled();
  });

  it("aplica cupom válido (toast.success + desconto visível)", async () => {
    vi.mocked(globalThis.fetch).mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          valid: true,
          discount: 20,
          code: "PROMO20",
          message: "Cupom aplicado!",
        }),
        { status: 200 },
      ),
    );

    const user = userEvent.setup();
    render(<CheckoutClient />);
    await user.type(screen.getByPlaceholderText(/BELES10/i), "promo20");
    await user.click(screen.getByRole("button", { name: /^aplicar$/i }));

    await waitFor(() => expect(toastSuccess).toHaveBeenCalled());

    // Body do fetch: code normalizado em uppercase + subtotal
    const call = vi.mocked(globalThis.fetch).mock.calls.find(
      (c) => c[0] === "/api/coupon/validate",
    );
    expect(call).toBeDefined();
    const body = JSON.parse((call![1] as RequestInit).body as string);
    expect(body).toEqual({ code: "PROMO20", orderSubtotal: 200 });
  });

  it("cupom inválido: toast.error e não aplica", async () => {
    vi.mocked(globalThis.fetch).mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          valid: false,
          discount: 0,
          message: "Cupom expirado",
        }),
        { status: 400 },
      ),
    );

    const user = userEvent.setup();
    render(<CheckoutClient />);
    await user.type(screen.getByPlaceholderText(/BELES10/i), "VELHO");
    await user.click(screen.getByRole("button", { name: /^aplicar$/i }));

    await waitFor(() => expect(toastError).toHaveBeenCalled());
    expect(toastError).toHaveBeenCalledWith("Cupom expirado");
    expect(toastSuccess).not.toHaveBeenCalled();
  });

});

describe("CheckoutClient — CEP autofill", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setCart([sampleItem]);
    vi.spyOn(globalThis, "fetch");
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("ao completar 8 dígitos no CEP, chama /api/cep/...", async () => {
    vi.mocked(globalThis.fetch).mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          cep: "01310-100",
          street: "Avenida Paulista",
          neighborhood: "Bela Vista",
          city: "São Paulo",
          state: "SP",
          shippingCost: 14.9,
          isFreeShippingEligible: false,
        }),
        { status: 200 },
      ),
    );

    render(<CheckoutClient />);
    await fillByLabel(/cep/i, "01310100");

    await waitFor(() => {
      const call = vi.mocked(globalThis.fetch).mock.calls.find((c) =>
        String(c[0]).startsWith("/api/cep/01310100"),
      );
      expect(call).toBeDefined();
    });
  });

  it("frete grátis: toast.success específico", async () => {
    vi.mocked(globalThis.fetch).mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          cep: "01310-100",
          street: "Av Paulista",
          neighborhood: "BV",
          city: "SP",
          state: "SP",
          shippingCost: 0,
          isFreeShippingEligible: true,
        }),
        { status: 200 },
      ),
    );

    render(<CheckoutClient />);
    await fillByLabel(/cep/i, "01310100");

    await waitFor(() => expect(toastSuccess).toHaveBeenCalled());
    expect(toastSuccess).toHaveBeenCalledWith(
      expect.stringMatching(/frete grátis/i),
    );
  });

  it("CEP retorna erro: toast.error", async () => {
    vi.mocked(globalThis.fetch).mockResolvedValueOnce(
      new Response(JSON.stringify({ error: "CEP não encontrado" }), {
        status: 404,
      }),
    );

    render(<CheckoutClient />);
    await fillByLabel(/cep/i, "00000000");

    await waitFor(() => expect(toastError).toHaveBeenCalled());
    expect(toastError).toHaveBeenCalledWith("CEP não encontrado");
  });
});

describe("CheckoutClient — submit", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setCart([sampleItem]);
    vi.spyOn(globalThis, "fetch");
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  async function fillFormCompleto() {
    await fillByLabel(/nome completo/i, "Maria Silva");
    await fillByLabel(/^e-mail$/i, "maria@example.com");
    await fillByLabel(/^telefone$/i, "11987654321");
    await fillByLabel(/cpf/i, "39053344705"); // CPF válido (já testado em validations)

    // CEP precisa ser mockado primeiro para autofill
    vi.mocked(globalThis.fetch).mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          cep: "01310-100",
          street: "Avenida Paulista",
          neighborhood: "Bela Vista",
          city: "São Paulo",
          state: "SP",
          shippingCost: 14.9,
          isFreeShippingEligible: false,
        }),
        { status: 200 },
      ),
    );
    await fillByLabel(/cep/i, "01310100");

    // Aguarda autofill preencher os campos via setValue
    await waitFor(() => {
      expect((screen.getByLabelText(/^logradouro$/i) as HTMLInputElement).value)
        .toMatch(/paulista/i);
    });

    await fillByLabel(/número/i, "1000");
  }

  it("caminho feliz: POST /api/checkout → clearCart + router.push", async () => {
    render(<CheckoutClient />);
    await fillFormCompleto();

    // Mock do POST /api/checkout
    vi.mocked(globalThis.fetch).mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          orderId: "ord-abc",
          status: "PAYMENT_CONFIRMED",
          paymentMethod: "pix",
        }),
        { status: 200 },
      ),
    );

    await userEvent.setup().click(
      screen.getByRole("button", { name: /finalizar|concluir|pagar/i }),
    );

    await waitFor(() => expect(routerPush).toHaveBeenCalled());
    expect(routerPush).toHaveBeenCalledWith("/sucesso/ord-abc");
    expect(clearCart).toHaveBeenCalledOnce();
    expect(toastSuccess).toHaveBeenCalledWith(
      "Pedido confirmado!",
      expect.objectContaining({ description: expect.any(String) }),
    );

    // Body do POST: items vêm do cart (id + quantity), nunca preço
    const checkoutCall = vi.mocked(globalThis.fetch).mock.calls.find(
      (c) => c[0] === "/api/checkout",
    );
    expect(checkoutCall).toBeDefined();
    const body = JSON.parse((checkoutCall![1] as RequestInit).body as string);
    expect(body.items).toEqual([{ productId: "uuid-1", quantity: 2 }]);
    expect(body.customer.email).toBe("maria@example.com");
  });

  it("API retorna !ok: toast.error e NÃO navega", async () => {
    render(<CheckoutClient />);
    await fillFormCompleto();

    vi.mocked(globalThis.fetch).mockResolvedValueOnce(
      new Response(
        JSON.stringify({ error: "Estoque insuficiente para \"Midnight Velvet\"" }),
        { status: 400 },
      ),
    );

    await userEvent.setup().click(
      screen.getByRole("button", { name: /finalizar|concluir|pagar/i }),
    );

    await waitFor(() => expect(toastError).toHaveBeenCalled());
    expect(toastError).toHaveBeenCalledWith(
      expect.stringMatching(/estoque insuficiente/i),
    );
    expect(routerPush).not.toHaveBeenCalled();
    expect(clearCart).not.toHaveBeenCalled();
  });
});
