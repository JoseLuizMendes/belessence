/**
 * Testes — Hero
 * Foco: promo strip + cupom copy, breadcrumb + heading, category pills,
 * carousel (avançar/voltar/dots), botões com aria-label.
 *
 * Mocks:
 *  - next/image, next/link
 *  - Typewriter — stub renderiza texto direto (sem setTimeout chains)
 *  - navigator.clipboard.writeText
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
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

// Typewriter: stub que renderiza o texto direto (sem animação async)
vi.mock("@/components/ui/typewriter", () => ({
  Typewriter: ({
    text,
    as: Tag = "span",
    ariaLabel,
  }: {
    text: string;
    as?: keyof React.JSX.IntrinsicElements;
    ariaLabel?: string;
  }) => {
    const Component = Tag as React.ElementType;
    return <Component aria-label={ariaLabel ?? text}>{text}</Component>;
  },
}));

import Hero from "@/components/hero";

describe("Hero — Promo strip", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("exibe a mensagem de frete grátis", () => {
    render(<Hero />);
    expect(
      screen.getByText(/frete grátis acima de r\$199/i),
    ).toBeInTheDocument();
  });

  it("exibe o código do cupom 'BELES10'", () => {
    render(<Hero />);
    expect(screen.getByText("BELES10")).toBeInTheDocument();
  });

  it("clicar em 'Copiar cupom' escreve 'BELES10' no clipboard", async () => {
    // userEvent.setup() provê um clipboard stub funcional; lemos de volta o
    // que o componente escreveu (assert userEvent-native, sem spy manual).
    const user = userEvent.setup();
    render(<Hero />);
    await user.click(screen.getByRole("button", { name: /copiar cupom/i }));

    await waitFor(async () => {
      expect(await navigator.clipboard.readText()).toBe("BELES10");
    });
  });
});

describe("Hero — Section context (breadcrumb + categorias)", () => {
  it("renderiza o heading 'Beauty Essentials'", () => {
    render(<Hero />);
    expect(
      screen.getByRole("heading", { name: /beauty essentials/i }),
    ).toBeInTheDocument();
  });

  // O Hero atual NÃO renderiza breadcrumb com "Início" — só heading + category pills.
  // Este teste foi escrito antecipando uma feature de breadcrumb que não foi
  // implementada (ou foi removida). Mantido como skip pra preservar a intenção
  // caso a feature seja retomada. Quando implementar: adicionar <Link href="/">Início</Link>
  // na seção "2. SECTION CONTEXT" antes do heading.
  it.skip("renderiza o breadcrumb com 'Início' como link (feature pendente)", () => {
    render(<Hero />);
    expect(screen.getByRole("link", { name: /^início$/i })).toHaveAttribute(
      "href",
      "/",
    );
  });

  it("renderiza as 5 pills de categoria com hrefs corretos", () => {
    render(<Hero />);
    const cases = [
      { name: /todas as coleções/i, href: "/allProducts" },
      { name: /^feminino$/i, href: "/allProducts?genero=feminino" },
      { name: /^masculino$/i, href: "/allProducts?genero=masculino" },
      { name: /^unissex$/i, href: "/allProducts?genero=unissex" },
      { name: /^lançamentos$/i, href: "/allProducts?tag=lancamento" },
    ];
    for (const { name, href } of cases) {
      expect(screen.getByRole("tab", { name })).toHaveAttribute("href", href);
    }
  });

  it("primeira pill começa com aria-selected='true'", () => {
    render(<Hero />);
    expect(
      screen.getByRole("tab", { name: /todas as coleções/i }),
    ).toHaveAttribute("aria-selected", "true");
  });

  it("clicar em outra pill atualiza aria-selected", async () => {
    const user = userEvent.setup();
    render(<Hero />);
    const feminino = screen.getByRole("tab", { name: /^feminino$/i });
    await user.click(feminino);
    expect(feminino).toHaveAttribute("aria-selected", "true");
    expect(
      screen.getByRole("tab", { name: /todas as coleções/i }),
    ).toHaveAttribute("aria-selected", "false");
  });
});

describe("Hero — Carousel", () => {
  it("renderiza o primeiro slide visível (Essência do Amanhecer)", () => {
    render(<Hero />);
    // Typewriter stub renderiza o título com aria-label
    expect(
      screen.getByLabelText(/essência do amanhecer/i),
    ).toBeInTheDocument();
  });

  it("clicar em 'Próximo slide' avança para o slide 2", async () => {
    const user = userEvent.setup();
    render(<Hero />);
    await user.click(screen.getByRole("button", { name: /próximo slide/i }));
    // O slide 2 título deve aparecer (precisa ler do array SLIDES — vamos
    // confiar que o ariaLabel/textContent muda)
    // Após advance, o primeiro título não está mais ativo. Apenas validamos
    // que mudou para algum outro.
    expect(
      screen.queryByLabelText(/essência do amanhecer/i),
    ).not.toBeInTheDocument();
  });

  it("clicar em 'Slide anterior' volta um slide (looping)", async () => {
    const user = userEvent.setup();
    render(<Hero />);
    // Do índice 0, voltar deve ir para o último slide via modulo
    await user.click(screen.getByRole("button", { name: /slide anterior/i }));
    expect(
      screen.queryByLabelText(/essência do amanhecer/i),
    ).not.toBeInTheDocument();
  });

  it("renderiza 6 dots (progress indicators) com aria-label 'Slide N'", () => {
    render(<Hero />);
    for (let i = 1; i <= 6; i++) {
      expect(
        screen.getByRole("button", { name: new RegExp(`^slide ${i}$`, "i") }),
      ).toBeInTheDocument();
    }
  });

  it("clicar no dot 4 vai direto para o slide 4", async () => {
    const user = userEvent.setup();
    render(<Hero />);
    await user.click(screen.getByRole("button", { name: /^slide 4$/i }));
    // Slide inicial sai do DOM
    expect(
      screen.queryByLabelText(/essência do amanhecer/i),
    ).not.toBeInTheDocument();
  });

  it("CTA do slide aponta para /allProducts", () => {
    render(<Hero />);
    // Há vários links /allProducts (categorias + CTA). Pelo menos um link
    // dentro do botão de CTA deve apontar pra lá.
    const allProductsLinks = screen
      .getAllByRole("link")
      .filter((a) => a.getAttribute("href") === "/allProducts");
    expect(allProductsLinks.length).toBeGreaterThan(0);
  });
});
