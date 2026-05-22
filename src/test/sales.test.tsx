/**
 * Testes — Sales (carousel de promoções)
 * Foco: nome/preço/link do produto, ícone correto, fallback vazio.
 * Embla carousel não é interagido — só conferimos render inicial.
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import type { ReactNode, AnchorHTMLAttributes, ImgHTMLAttributes } from "react";

// Embla espera plugins com shape complexo. Em vez de tentar mockar Autoplay
// corretamente, neutralizamos o Carousel shadcn inteiro como passthrough:
// renderiza children, ignora plugins/opts.
vi.mock("@/components/ui/carousel", () => ({
  Carousel: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  CarouselContent: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  CarouselItem: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  CarouselPrevious: () => <button type="button">prev</button>,
  CarouselNext: () => <button type="button">next</button>,
}));

vi.mock("embla-carousel-autoplay", () => ({
  default: () => () => ({ name: "autoplay" }),
}));

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

import Sales from "@/components/sales";

const makeSale = (overrides = {}) => ({
  id: "p1",
  slug: "midnight-velvet",
  name: "Midnight Velvet",
  shortDescription: "Misteriosa",
  priceNum: 200,
  images: ["a.jpg"],
  iconName: "Timer",
  promoTitle: "Black Friday",
  promoText: "Oferta especial",
  promoGradient: "from-pink-500 to-purple-500",
  ...overrides,
});

describe("Sales", () => {
  it("renderiza nome, descrição e promoTitle do sale", () => {
    render(<Sales products={[makeSale()] as never} />);
    expect(screen.getByText("Midnight Velvet")).toBeInTheDocument();
    expect(screen.getByText("Misteriosa")).toBeInTheDocument();
    expect(screen.getByText("Black Friday")).toBeInTheDocument();
    expect(screen.getByText("Oferta especial")).toBeInTheDocument();
  });

  it("calcula e exibe preço com 20% off (R$ 160,00 sobre R$ 200,00)", () => {
    render(<Sales products={[makeSale({ priceNum: 200 })] as never} />);
    // Preço cheio riscado
    expect(screen.getByText(/R\$ 200,00/)).toBeInTheDocument();
    // Preço com 20% off
    expect(screen.getByText(/R\$ 160,00/)).toBeInTheDocument();
    expect(screen.getByText(/20% OFF/i)).toBeInTheDocument();
  });

  it("link 'Eu quero!' aponta para /product/[slug]", () => {
    render(<Sales products={[makeSale()] as never} />);
    expect(
      screen.getByRole("link", { name: /eu quero/i }),
    ).toHaveAttribute("href", "/product/midnight-velvet");
  });

  it("renderiza vários sales no carousel", () => {
    render(
      <Sales
        products={
          [
            makeSale({ id: "a", slug: "a", name: "A" }),
            makeSale({ id: "b", slug: "b", name: "B" }),
          ] as never
        }
      />,
    );
    expect(screen.getByText("A")).toBeInTheDocument();
    expect(screen.getByText("B")).toBeInTheDocument();
  });

  it("retorna null quando o array está vazio", () => {
    const { container } = render(<Sales products={[] as never} />);
    expect(container.firstChild).toBeNull();
  });

  it("botão 'Ver mais' (mobile) está presente para scrollIntoView", () => {
    render(<Sales products={[makeSale()] as never} />);
    expect(
      screen.getByRole("button", { name: /ver destaques/i }),
    ).toBeInTheDocument();
  });
});
