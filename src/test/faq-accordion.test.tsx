/**
 * Testes — FAQAccordion (shadcn Accordion / Radix)
 * Foco: renderiza items, primeiro item está aberto por default.
 * Interação de toggle é coberta pelo E2E (Radix em jsdom é frágil).
 */

import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { FAQAccordion } from "@/components/faq-accordion";

const items = [
  { question: "Como funciona a devolução?", answer: "Você tem 7 dias corridos." },
  { question: "Vocês entregam em todo Brasil?", answer: "Sim, em todos os estados." },
  { question: "Posso parcelar?", answer: "Sim, em até 6x sem juros." },
];

describe("FAQAccordion", () => {
  it("renderiza todas as perguntas como triggers de accordion", () => {
    render(<FAQAccordion items={items} />);
    expect(
      screen.getByRole("button", { name: /como funciona a devolução/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", {
        name: /vocês entregam em todo brasil/i,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /posso parcelar/i }),
    ).toBeInTheDocument();
  });

  it("o primeiro item está com data-state='open' (defaultValue='item-0')", () => {
    render(<FAQAccordion items={items} />);
    const first = screen.getByRole("button", {
      name: /como funciona a devolução/i,
    });
    expect(first).toHaveAttribute("data-state", "open");
    // Conteúdo da primeira pergunta visível
    expect(screen.getByText(/7 dias corridos/i)).toBeInTheDocument();
  });

  it("renderiza accordion vazio sem itens", () => {
    const { container } = render(<FAQAccordion items={[]} />);
    // Container do Accordion ainda existe, mas sem perguntas
    expect(container.querySelectorAll("button").length).toBe(0);
  });
});
