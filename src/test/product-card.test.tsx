/**
 * Testes — ProductCard
 * ─────────────────────────────────────────────────────────────────────
 * Mocka:
 *  - ./cart (useCart) para inspecionar addToCart
 *  - ./wishlist-button (stub leve para evitar Zustand + Sonner)
 *  - next/image e next/link (jsdom-friendly)
 *
 * Cobre: renderização base, link de slug, addToCart payload, esgotado,
 * em breve, promoção efetiva (badge + preço riscado), lançamento, limitada.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode, AnchorHTMLAttributes, ImgHTMLAttributes } from "react";

const { addToCartMock } = vi.hoisted(() => ({
  addToCartMock: vi.fn(),
}));

vi.mock("@/components/cart", () => ({
  useCart: () => ({ addToCart: addToCartMock }),
}));

vi.mock("@/components/wishlist-button", () => ({
  WishlistButton: ({ productName }: { productName: string }) => (
    <button type="button" aria-label={`Favoritar ${productName}`} />
  ),
}));

vi.mock("next/image", () => ({
  default: (props: ImgHTMLAttributes<HTMLImageElement> & {
    fill?: boolean;
    priority?: boolean;
  }) => {
    // Filtra props do Next que não fazem sentido em <img> nativo.
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

import { ProductCard, type ProductCardProps } from "@/components/product-card";

const baseProduct: ProductCardProps["product"] = {
  id: "p1",
  slug: "midnight-velvet",
  name: "Midnight Velvet",
  shortDescription: "Fragrância misteriosa",
  price: 189.9,
  originalPrice: null,
  badge: null,
  badgeVariant: null,
  images: ["midnight-velvet.jpg"],
};

describe("ProductCard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renderiza nome, preço formatado em BRL e link para o produto", () => {
    render(<ProductCard product={baseProduct} />);
    expect(screen.getByText("Midnight Velvet")).toBeInTheDocument();
    expect(screen.getByText(/R\$\s?189,90/)).toBeInTheDocument();

    // Pelo menos um link aponta para o slug
    const links = screen.getAllByRole("link");
    expect(links.some((a) => a.getAttribute("href") === "/product/midnight-velvet")).toBe(true);
  });

  it("estado padrão (NORMAL, com estoque): exibe CTA 'Ver detalhes' e botão de compra", () => {
    render(<ProductCard product={{ ...baseProduct, stock: 5 }} />);
    expect(screen.getByText(/ver detalhes/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /adicionar midnight velvet ao carrinho/i }),
    ).toBeInTheDocument();
  });

  it("addToCart é chamado com payload correto ao clicar no botão de compra", async () => {
    const user = userEvent.setup();
    render(<ProductCard product={{ ...baseProduct, stock: 5 }} />);
    await user.click(
      screen.getByRole("button", { name: /adicionar midnight velvet ao carrinho/i }),
    );
    expect(addToCartMock).toHaveBeenCalledTimes(1);
    expect(addToCartMock).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "p1",
        slug: "midnight-velvet",
        name: "Midnight Velvet",
        price: 189.9,
        image: "midnight-velvet.jpg",
      }),
    );
  });

  it("esgotado (stock=0): mostra badge 'Esgotado', CTA 'Avise-me' e nenhum botão de compra", () => {
    render(<ProductCard product={{ ...baseProduct, stock: 0 }} />);
    expect(screen.getByText(/^esgotado$/i)).toBeInTheDocument();
    expect(screen.getByText(/avise-me/i)).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /adicionar .* ao carrinho/i }),
    ).not.toBeInTheDocument();
  });

  it("em breve (COMING_SOON): mostra badge 'Em breve', CTA 'Saiba mais' e nenhum botão de compra", () => {
    render(
      <ProductCard
        product={{ ...baseProduct, stock: 10, status: "COMING_SOON" } as never}
      />,
    );
    expect(screen.getByText(/^em breve$/i)).toBeInTheDocument();
    expect(screen.getByText(/saiba mais/i)).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /adicionar .* ao carrinho/i }),
    ).not.toBeInTheDocument();
  });

  it("descontinuado (DISCONTINUED): mostra badge 'Fora de linha' e bloqueia compra", () => {
    render(
      <ProductCard
        product={{ ...baseProduct, stock: 5, status: "DISCONTINUED" } as never}
      />,
    );
    expect(screen.getByText(/fora de linha/i)).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /adicionar .* ao carrinho/i }),
    ).not.toBeInTheDocument();
  });

  it("promoção ativa: exibe badge 'Promoção' e preço original riscado", () => {
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    render(
      <ProductCard
        product={
          {
            ...baseProduct,
            price: 149.9,
            originalPrice: 199.9,
            status: "PROMOTION",
            promotionStartsAt: yesterday,
            promotionEndsAt: tomorrow,
            stock: 5,
          } as never
        }
      />,
    );

    expect(screen.getByText(/^promoção$/i)).toBeInTheDocument();
    expect(screen.getByText(/R\$\s?199,90/)).toBeInTheDocument(); // riscado
    expect(screen.getByText(/R\$\s?149,90/)).toBeInTheDocument(); // atual
  });

  it("promoção expirada (endsAt no passado): NÃO mostra badge nem riscado", () => {
    const past = new Date("2020-01-01");
    render(
      <ProductCard
        product={
          {
            ...baseProduct,
            price: 149.9,
            originalPrice: 199.9,
            status: "PROMOTION",
            promotionStartsAt: new Date("2019-01-01"),
            promotionEndsAt: past,
            stock: 5,
          } as never
        }
      />,
    );
    expect(screen.queryByText(/^promoção$/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/R\$\s?199,90/)).not.toBeInTheDocument();
  });

  it("lançamento recente (createdAt < 30d, sem promo): mostra badge 'Lançamento'", () => {
    const recent = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000);
    render(
      <ProductCard
        product={{ ...baseProduct, stock: 5, createdAt: recent } as never}
      />,
    );
    expect(screen.getByText(/^lançamento$/i)).toBeInTheDocument();
  });

  it("edição limitada: mostra badge 'Ed. limitada'", () => {
    render(
      <ProductCard
        product={{ ...baseProduct, stock: 5, isLimitedEdition: true } as never}
      />,
    );
    expect(screen.getByText(/ed\. limitada/i)).toBeInTheDocument();
  });

  it("aria-label do link inclui 'esgotado' quando aplicável", () => {
    render(<ProductCard product={{ ...baseProduct, stock: 0 }} />);
    const link = screen.getAllByRole("link").find((a) =>
      (a.getAttribute("aria-label") ?? "").match(/esgotado/i),
    );
    expect(link).toBeDefined();
  });
});
