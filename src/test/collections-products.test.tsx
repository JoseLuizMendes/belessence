/**
 * Testes — CollectionsProducts (3 coleções hardcoded)
 * Foco: heading, 3 cards linkados, dados específicos de cada coleção.
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import type { ReactNode, AnchorHTMLAttributes, ImgHTMLAttributes } from "react";

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

import CollectionsProducts from "@/components/collections-products";

describe("CollectionsProducts", () => {
  it("renderiza heading 'Coleções Exclusivas' e eyebrow", () => {
    render(<CollectionsProducts />);
    expect(
      screen.getByRole("heading", { name: /coleções exclusivas/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/universo mari beauty/i)).toBeInTheDocument();
  });

  it("renderiza 3 cards de coleção com hrefs /collections/<slug>", () => {
    render(<CollectionsProducts />);
    const expected = [
      { name: /lumière creme mãos/i, href: "/collections/essencia-noturna" },
      { name: /água de beleza divina/i, href: "/collections/elegancia-diurna" },
      { name: /kit descoberta/i, href: "/collections/edicao-limitada" },
    ];
    for (const { name, href } of expected) {
      // Cada nome aparece dentro de um <Link> — pega o link mais próximo
      const heading = screen.getByRole("heading", { name });
      const link = heading.closest("a");
      expect(link).toHaveAttribute("href", href);
    }
  });

  it("renderiza subtítulos editoriais de cada coleção", () => {
    render(<CollectionsProducts />);
    expect(screen.getByText(/ritual de cuidado/i)).toBeInTheDocument();
    expect(screen.getByText(/frescor & luminosidade/i)).toBeInTheDocument();
    expect(screen.getByText(/trilogia olfativa/i)).toBeInTheDocument();
  });

  it("renderiza CTA 'Explorar' em todos os cards", () => {
    render(<CollectionsProducts />);
    expect(screen.getAllByText(/^explorar$/i)).toHaveLength(3);
  });

  it("renderiza preço uniforme em todos os cards (R$ 289,90)", () => {
    render(<CollectionsProducts />);
    expect(screen.getAllByText(/R\$\s?289,90/)).toHaveLength(3);
  });
});
