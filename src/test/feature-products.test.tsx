/**
 * Testes — FeatureProducts
 * Foco: heading, limite slice(0,4), link da coleção, fallback vazio.
 * ProductCard é stub identificável (não re-testamos o card aqui).
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import type { ReactNode, AnchorHTMLAttributes } from "react";

vi.mock("@/components/product-card", () => ({
  ProductCard: ({ product }: { product: { id: string; name: string } }) => (
    <article data-testid={`card-${product.id}`} data-product-card>
      {product.name}
    </article>
  ),
}));

vi.mock("gsap/ScrollTrigger", () => ({
  ScrollTrigger: { create: vi.fn(), update: vi.fn(), refresh: vi.fn() },
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

import FeatureProducts from "@/components/feature-products";

function makeProducts(n: number) {
  return Array.from({ length: n }, (_, i) => ({
    id: `p${i + 1}`,
    name: `Produto ${i + 1}`,
  }));
}

describe("FeatureProducts", () => {
  it("renderiza o heading 'Destaques' e eyebrow 'Seleção da semana'", () => {
    render(<FeatureProducts products={makeProducts(4) as never} />);
    expect(
      screen.getByRole("heading", { name: /destaques/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/seleção da semana/i)).toBeInTheDocument();
  });

  it("renderiza link 'Ver toda a coleção' apontando para /allProducts", () => {
    render(<FeatureProducts products={makeProducts(4) as never} />);
    expect(
      screen.getByRole("link", { name: /ver toda a coleção/i }),
    ).toHaveAttribute("href", "/allProducts");
  });

  it("renderiza no máximo 4 produtos (slice 0..4)", () => {
    render(<FeatureProducts products={makeProducts(10) as never} />);
    expect(screen.getByTestId("card-p1")).toBeInTheDocument();
    expect(screen.getByTestId("card-p4")).toBeInTheDocument();
    expect(screen.queryByTestId("card-p5")).not.toBeInTheDocument();
    expect(screen.queryByTestId("card-p10")).not.toBeInTheDocument();
  });

  it("renderiza menos que 4 quando o array é menor", () => {
    render(<FeatureProducts products={makeProducts(2) as never} />);
    expect(screen.getByTestId("card-p1")).toBeInTheDocument();
    expect(screen.getByTestId("card-p2")).toBeInTheDocument();
    expect(screen.queryByTestId("card-p3")).not.toBeInTheDocument();
  });

  it("retorna null quando o array está vazio (sem heading)", () => {
    const { container } = render(<FeatureProducts products={[] as never} />);
    expect(container.firstChild).toBeNull();
  });
});
