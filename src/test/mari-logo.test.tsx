/**
 * Testes — MariLogo (SVG estático)
 */

import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MariLogo } from "@/components/mari-logo";

describe("MariLogo", () => {
  it("renderiza como role='img' com aria-label default 'Mari Beauty'", () => {
    render(<MariLogo />);
    expect(screen.getByRole("img", { name: /mari beauty/i })).toBeInTheDocument();
  });

  it("aceita title customizado via prop", () => {
    render(<MariLogo title="Belessence" />);
    expect(screen.getByRole("img", { name: /belessence/i })).toBeInTheDocument();
  });

  it("aplica className quando fornecido", () => {
    const { container } = render(<MariLogo className="h-8 text-brand-wine" />);
    const svg = container.querySelector("svg");
    expect(svg).toHaveClass("h-8");
    expect(svg).toHaveClass("text-brand-wine");
  });

  it("usa fill='currentColor' (herda cor do texto pai)", () => {
    const { container } = render(<MariLogo />);
    expect(container.querySelector("svg")).toHaveAttribute(
      "fill",
      "currentColor",
    );
  });
});
