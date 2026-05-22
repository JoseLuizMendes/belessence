/**
 * Testes — ProductDetailsClient (PDP)
 * Foco: galeria (thumb selection), seletor de quantidade, addToCart com qty,
 * tabs (Descrição/Ritual/Ingredientes/Avaliações).
 *
 * Mocks:
 *  - useCart (captura addToCart)
 *  - WishlistButton, ProductReviews — stubs leves
 *  - next/image — img
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ImgHTMLAttributes } from "react";

const { addToCartMock } = vi.hoisted(() => ({
  addToCartMock: vi.fn(),
}));

vi.mock("@/components/cart", () => ({
  useCart: () => ({ addToCart: addToCartMock }),
}));

vi.mock("@/components/wishlist-button", () => ({
  WishlistButton: () => <span data-testid="wishlist-stub" />,
}));

vi.mock("@/components/product-reviews", () => ({
  ProductReviews: ({ productId }: { productId: string }) => (
    <div data-testid="reviews-stub">reviews-{productId}</div>
  ),
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

import ProductDetailsClient from "@/components/product-details-client";

const baseProduct = {
  id: "uuid-1",
  slug: "midnight-velvet",
  name: "Midnight Velvet",
  shortDescription: "Fragrância misteriosa",
  description: "Uma jornada olfativa cheia de notas sensuais.",
  price: 189.9,
  originalPrice: null,
  badge: null,
  badgeVariant: null,
  rating: 0,
  reviews: 0,
  images: ["a.jpg", "b.jpg", "c.jpg"],
  features: ["Notas amadeiradas", "Long-lasting", "Vegano"],
  collection: "Noir",
  category: "EDP",
  totalSold: 0,
  seasonalSold: 0,
  stock: 10,
  status: "NORMAL" as const,
  isLimitedEdition: false,
  markedAsNewUntil: null,
  promotionStartsAt: null,
  promotionEndsAt: null,
  createdAt: new Date("2020-01-01"),
  updatedAt: new Date("2020-01-01"),
};

describe("ProductDetailsClient", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renderiza nome, preço e descrição curta", () => {
    render(<ProductDetailsClient product={baseProduct as never} />);
    expect(
      screen.getByRole("heading", { name: /midnight velvet/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/R\$\s?189,90/)).toBeInTheDocument();
    expect(screen.getByText(/fragrância misteriosa/i)).toBeInTheDocument();
  });

  it("renderiza preço original riscado quando há promoção efetiva", () => {
    const now = new Date();
    const past = new Date(now.getTime() - 24 * 3600 * 1000);
    const future = new Date(now.getTime() + 24 * 3600 * 1000);
    render(
      <ProductDetailsClient
        product={
          {
            ...baseProduct,
            price: 149.9,
            originalPrice: 199.9,
            status: "PROMOTION",
            promotionStartsAt: past,
            promotionEndsAt: future,
          } as never
        }
      />,
    );
    expect(screen.getByText(/R\$\s?149,90/)).toBeInTheDocument();
    expect(screen.getByText(/R\$\s?199,90/)).toBeInTheDocument();
    expect(screen.getByText(/^promoção$/i)).toBeInTheDocument();
  });

  it("mostra badge 'Esgotado' quando stock = 0", () => {
    render(
      <ProductDetailsClient product={{ ...baseProduct, stock: 0 } as never} />,
    );
    expect(screen.getByText(/^esgotado$/i)).toBeInTheDocument();
  });

  it("quantidade inicial é 1 e botão de diminuir está desabilitado", () => {
    render(<ProductDetailsClient product={baseProduct as never} />);
    expect(screen.getByText("1")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /diminuir quantidade/i }),
    ).toBeDisabled();
  });

  it("clicar em + aumenta a quantidade exibida", async () => {
    const user = userEvent.setup();
    render(<ProductDetailsClient product={baseProduct as never} />);
    await user.click(screen.getByRole("button", { name: /aumentar quantidade/i }));
    await user.click(screen.getByRole("button", { name: /aumentar quantidade/i }));
    expect(screen.getByText("3")).toBeInTheDocument();
  });

  it("clicar em - depois de subir reduz a quantidade", async () => {
    const user = userEvent.setup();
    render(<ProductDetailsClient product={baseProduct as never} />);
    await user.click(screen.getByRole("button", { name: /aumentar quantidade/i }));
    await user.click(screen.getByRole("button", { name: /aumentar quantidade/i }));
    await user.click(screen.getByRole("button", { name: /diminuir quantidade/i }));
    expect(screen.getByText("2")).toBeInTheDocument();
  });

  it("'Adicionar à Bag' chama addToCart N vezes (1 por unidade)", async () => {
    const user = userEvent.setup();
    render(<ProductDetailsClient product={baseProduct as never} />);
    await user.click(screen.getByRole("button", { name: /aumentar quantidade/i }));
    await user.click(screen.getByRole("button", { name: /aumentar quantidade/i }));
    await user.click(screen.getByRole("button", { name: /adicionar à bag/i }));

    // qty=3 → 3 chamadas com mesmo payload
    expect(addToCartMock).toHaveBeenCalledTimes(3);
    expect(addToCartMock).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "uuid-1",
        slug: "midnight-velvet",
        name: "Midnight Velvet",
        price: 189.9,
        image: "a.jpg",
      }),
    );
  });

  it("renderiza tabs e mostra conteúdo de 'Descrição' por default", () => {
    render(<ProductDetailsClient product={baseProduct as never} />);
    expect(
      screen.getByRole("tab", { name: /^descrição$/i }),
    ).toHaveAttribute("data-state", "active");
    expect(
      screen.getByText(/jornada olfativa cheia de notas sensuais/i),
    ).toBeInTheDocument();
  });

  it("renderiza os 4 tabs com labels esperados", () => {
    render(<ProductDetailsClient product={baseProduct as never} />);
    // Radix Tabs em jsdom não responde bem a fireEvent.click sem userEvent.
    // Validamos a existência dos triggers — a troca de tab é coberta pelo E2E.
    for (const label of [/descrição/i, /ritual de uso/i, /ingredientes/i, /avaliações/i]) {
      expect(screen.getByRole("tab", { name: label })).toBeInTheDocument();
    }
  });

  it("thumbnails: clicar troca a imagem principal (aria-label 'Imagem N')", async () => {
    const user = userEvent.setup();
    render(<ProductDetailsClient product={baseProduct as never} />);
    // Renderiza 3 thumbs (slice 0..4)
    expect(
      screen.getByRole("button", { name: /^imagem 1$/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /^imagem 3$/i }),
    ).toBeInTheDocument();

    // Imagem principal antes do clique: src contém a primeira imagem
    const mainBefore = screen.getAllByRole("img")[0];
    expect(mainBefore.getAttribute("src")).toMatch(/a\.jpg/);

    await user.click(screen.getByRole("button", { name: /^imagem 3$/i }));
    const mainAfter = screen.getAllByRole("img")[0];
    expect(mainAfter.getAttribute("src")).toMatch(/c\.jpg/);
  });
});
