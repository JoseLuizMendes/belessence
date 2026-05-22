/**
 * Testes — Footer
 * Foco: estrutura de links das colunas, copyright dinâmico, redes sociais.
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import type { ReactNode, AnchorHTMLAttributes } from "react";

vi.mock("@/components/mari-logo", () => ({
  MariLogo: () => <span data-testid="mari-logo" />,
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

import Footer from "@/components/footer";

describe("Footer", () => {
  it("renderiza os 3 títulos de coluna", () => {
    render(<Footer />);
    expect(
      screen.getByRole("heading", { name: /^produtos$/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /^atendimento$/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /^empresa$/i }),
    ).toBeInTheDocument();
  });

  it("link 'Fragrâncias Femininas' aponta para /allProducts?genero=feminino", () => {
    render(<Footer />);
    expect(
      screen.getByRole("link", { name: /fragrâncias femininas/i }),
    ).toHaveAttribute("href", "/allProducts?genero=feminino");
  });

  it("link 'Edições Limitadas' aponta para /allProducts?tag=lancamento", () => {
    render(<Footer />);
    expect(
      screen.getByRole("link", { name: /edições limitadas/i }),
    ).toHaveAttribute("href", "/allProducts?tag=lancamento");
  });

  it("link 'Central de Ajuda' aponta para /ajuda", () => {
    render(<Footer />);
    expect(screen.getByRole("link", { name: /central de ajuda/i }))
      .toHaveAttribute("href", "/ajuda");
  });

  it("link 'Contato' aponta para /contato", () => {
    render(<Footer />);
    expect(screen.getByRole("link", { name: /^contato$/i })).toHaveAttribute(
      "href",
      "/contato",
    );
  });

  it("link 'Sobre Nós' aponta para /sobre", () => {
    render(<Footer />);
    expect(screen.getByRole("link", { name: /sobre nós/i })).toHaveAttribute(
      "href",
      "/sobre",
    );
  });

  it("renderiza ícones sociais com aria-label (Facebook, Youtube)", () => {
    render(<Footer />);
    // "Instagram" aparece 2x (social + link da coluna Empresa) — use getAll
    expect(screen.getAllByRole("link", { name: /^instagram$/i }).length)
      .toBeGreaterThanOrEqual(1);
    expect(
      screen.getByRole("link", { name: /^facebook$/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /^youtube$/i }),
    ).toBeInTheDocument();
  });

  it("copyright tem o ano corrente", () => {
    render(<Footer />);
    const year = new Date().getFullYear().toString();
    expect(
      screen.getByText(new RegExp(`© ${year} Mari Beauty`)),
    ).toBeInTheDocument();
  });

  it("logo Mari Beauty aparece no rodapé", () => {
    render(<Footer />);
    expect(screen.getByTestId("mari-logo")).toBeInTheDocument();
  });
});
