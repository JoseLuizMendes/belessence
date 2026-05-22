/**
 * Testes — ProductsGrid
 * Foco: renderização de N cards com `animateAttr="data-animate-card"`
 * (distingue do attr default do ProductCard). Lista vazia → grid vazio.
 *
 * ProductCard é stub identificável; não re-testamos o card aqui.
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("@/components/product-card", () => ({
  ProductCard: ({
    product,
    animateAttr,
  }: {
    product: { id: string; name: string };
    animateAttr?: string;
  }) => (
    <article
      data-testid={`card-${product.id}`}
      data-animate-attr={animateAttr}
    >
      {product.name}
    </article>
  ),
}));

import ProductsGrid from "@/components/products-grid";

const makeProducts = (n: number) =>
  Array.from({ length: n }, (_, i) => ({
    id: `p${i + 1}`,
    name: `Produto ${i + 1}`,
  }));

describe("ProductsGrid", () => {
  it("renderiza todos os produtos como cards", () => {
    render(<ProductsGrid products={makeProducts(6) as never} />);
    expect(screen.getAllByTestId(/^card-/)).toHaveLength(6);
    expect(screen.getByTestId("card-p1")).toBeInTheDocument();
    expect(screen.getByTestId("card-p6")).toBeInTheDocument();
  });

  it("passa animateAttr='data-animate-card' para os cards (distinto do default)", () => {
    render(<ProductsGrid products={makeProducts(2) as never} />);
    const card1 = screen.getByTestId("card-p1");
    expect(card1).toHaveAttribute("data-animate-attr", "data-animate-card");
  });

  it("lista vazia: renderiza o grid sem cards", () => {
    const { container } = render(<ProductsGrid products={[] as never} />);
    // O grid div é renderizado mesmo vazio (não retorna null)
    expect(container.firstChild).not.toBeNull();
    expect(screen.queryAllByTestId(/^card-/)).toHaveLength(0);
  });
});
