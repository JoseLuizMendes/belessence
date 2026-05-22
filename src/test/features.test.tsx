/**
 * Testes — Features (section estática "Ritual Completo")
 * Foco: heading editorial, 3 cards icônicos (eyebrow + título + body).
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import type { ImgHTMLAttributes } from "react";

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

import Features from "@/components/features";

describe("Features", () => {
  it("renderiza heading 'Ritual Completo' e eyebrow", () => {
    render(<Features />);
    expect(
      screen.getByRole("heading", { name: /ritual completo/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/ritual mari beauty/i)).toBeInTheDocument();
  });

  it("renderiza os 3 cards com seus eyebrows: Atelier, Maison, Service", () => {
    render(<Features />);
    expect(screen.getByText(/^atelier$/i)).toBeInTheDocument();
    expect(screen.getByText(/^maison$/i)).toBeInTheDocument();
    expect(screen.getByText(/^service$/i)).toBeInTheDocument();
  });

  it("renderiza os títulos dos 3 cards", () => {
    render(<Features />);
    expect(
      screen.getByRole("heading", { name: /curadoria especializada/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /experiência personalizada/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /entrega premium/i }),
    ).toBeInTheDocument();
  });

  it("renderiza os bodies descritivos dos cards", () => {
    render(<Features />);
    expect(
      screen.getByText(/seleção criteriosa de fragrâncias premium/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/encontre o perfume perfeito/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/embalagem cuidadosa e entrega rápida/i),
    ).toBeInTheDocument();
  });
});
