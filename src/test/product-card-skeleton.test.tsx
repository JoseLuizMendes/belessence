/**
 * Testes — ProductCardSkeleton & ProductGridSkeleton
 * Componentes triviais — validamos estrutura e quantidade.
 */

import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import {
  ProductCardSkeleton,
  ProductGridSkeleton,
} from "@/components/product-card-skeleton";

describe("ProductCardSkeleton", () => {
  it("renderiza um <article> com placeholders Skeleton", () => {
    const { container } = render(<ProductCardSkeleton />);
    expect(container.querySelector("article")).toBeInTheDocument();
    // 4 Skeletons: imagem + título + preço + CTA
    expect(container.querySelectorAll('[data-slot="skeleton"]').length).toBe(4);
  });
});

describe("ProductGridSkeleton", () => {
  it("renderiza 8 skeletons por default", () => {
    const { container } = render(<ProductGridSkeleton />);
    expect(container.querySelectorAll("article").length).toBe(8);
  });

  it("respeita o prop `count`", () => {
    const { container } = render(<ProductGridSkeleton count={3} />);
    expect(container.querySelectorAll("article").length).toBe(3);
  });

  it("count=0 renderiza grid vazio", () => {
    const { container } = render(<ProductGridSkeleton count={0} />);
    expect(container.querySelectorAll("article").length).toBe(0);
  });
});
