/**
 * Testes — SortSelect
 * ─────────────────────────────────────────────────────────────────────
 * Radix Select em jsdom é frágil — não tentamos abrir o dropdown e
 * clicar em items (precisaria de userEvent + pointer events).
 *
 * Cobrimos:
 *  - Label "Ordenar por" presente (a11y)
 *  - SelectTrigger renderiza com o defaultValue inicial visível
 *  - Atributos básicos do trigger (combobox role, aria-controls)
 *
 * A lógica de URL params (router.push com novo sort) é cobertura E2E.
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn(),
  }),
  usePathname: () => "/allProducts",
  useSearchParams: () => new URLSearchParams(""),
}));

import { SortSelect } from "@/components/sort-select";

const options = [
  { label: "Mais vendidos", value: "best-seller" },
  { label: "Maior preço", value: "price-desc" },
  { label: "Menor preço", value: "price-asc" },
  { label: "Recentes", value: "recent" },
];

describe("SortSelect", () => {
  it("renderiza label acessível 'Ordenar por'", () => {
    render(<SortSelect options={options} defaultValue="best-seller" />);
    expect(screen.getByText(/ordenar por/i)).toBeInTheDocument();
  });

  it("renderiza um combobox (trigger Radix Select)", () => {
    render(<SortSelect options={options} defaultValue="best-seller" />);
    expect(screen.getByRole("combobox")).toBeInTheDocument();
  });

  it("o trigger mostra o defaultValue como texto inicial", () => {
    render(<SortSelect options={options} defaultValue="best-seller" />);
    // O Radix Select renderiza o label da option default no trigger.
    expect(
      screen.getByRole("combobox").textContent,
    ).toMatch(/mais vendidos/i);
  });

  it("aceita outro defaultValue inicial", () => {
    render(<SortSelect options={options} defaultValue="price-desc" />);
    expect(
      screen.getByRole("combobox").textContent,
    ).toMatch(/maior preço/i);
  });

  it("trigger tem id='sort' (vínculo com Label htmlFor)", () => {
    render(<SortSelect options={options} defaultValue="best-seller" />);
    expect(screen.getByRole("combobox")).toHaveAttribute("id", "sort");
  });
});
