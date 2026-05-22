/**
 * Testes — ProductDetailsDialog (quick view modal)
 * Foco: null product → null, abre dialog via trigger, addToCart no botão,
 * mostra preço/descrição/rating, fecha após adicionar.
 *
 * Radix Dialog — abre via userEvent.click no trigger; conteúdo no portal.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const { addToCartMock } = vi.hoisted(() => ({
  addToCartMock: vi.fn(),
}));

vi.mock("@/components/cart", () => ({
  useCart: () => ({ addToCart: addToCartMock }),
}));

import { ProductDetailsDialog } from "@/components/product-details-dialog";

const baseProduct = {
  id: "p1",
  slug: "midnight-velvet",
  name: "Midnight Velvet",
  shortDescription: "Fragrância misteriosa",
  description: "Uma jornada olfativa rica em notas amadeiradas.",
  price: 189.9,
  originalPrice: 249.9,
  badge: "Bestseller",
  badgeVariant: "default" as const,
  rating: 4,
  reviews: 87,
  image: "/img.jpg",
};

function openDialog(user: ReturnType<typeof userEvent.setup>) {
  return user.click(screen.getByRole("button", { name: /ver detalhes/i }));
}

describe("ProductDetailsDialog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("retorna null quando product = null (sem trigger no DOM)", () => {
    const { container } = render(<ProductDetailsDialog product={null} />);
    expect(container.firstChild).toBeNull();
  });

  it("renderiza o trigger com label customizável", () => {
    render(
      <ProductDetailsDialog product={baseProduct as never} triggerLabel="Quick view" />,
    );
    expect(
      screen.getByRole("button", { name: /quick view/i }),
    ).toBeInTheDocument();
  });

  it("trigger default é 'Ver detalhes'", () => {
    render(<ProductDetailsDialog product={baseProduct as never} />);
    expect(
      screen.getByRole("button", { name: /ver detalhes/i }),
    ).toBeInTheDocument();
  });

  it("abrir dialog mostra nome, descrição e preço do produto", async () => {
    const user = userEvent.setup();
    render(<ProductDetailsDialog product={baseProduct as never} />);
    await openDialog(user);

    expect(await screen.findByText("Midnight Velvet")).toBeInTheDocument();
    expect(
      screen.getByText(/jornada olfativa rica em notas amadeiradas/i),
    ).toBeInTheDocument();
    expect(screen.getByText("189.9")).toBeInTheDocument();
    expect(screen.getByText("249.9")).toBeInTheDocument(); // riscado
  });

  it("mostra badge quando produto tem badge", async () => {
    const user = userEvent.setup();
    render(<ProductDetailsDialog product={baseProduct as never} />);
    await openDialog(user);
    expect(await screen.findByText("Bestseller")).toBeInTheDocument();
  });

  it("mostra rating numérico no texto 'N avaliações'", async () => {
    const user = userEvent.setup();
    render(<ProductDetailsDialog product={baseProduct as never} />);
    await openDialog(user);
    expect(await screen.findByText(/\(87 avaliações\)/i)).toBeInTheDocument();
  });

  it("clicar em 'Adicionar ao Carrinho' chama addToCart com o produto", async () => {
    const user = userEvent.setup();
    render(<ProductDetailsDialog product={baseProduct as never} />);
    await openDialog(user);
    await user.click(
      await screen.findByRole("button", { name: /adicionar ao carrinho/i }),
    );
    expect(addToCartMock).toHaveBeenCalledOnce();
    expect(addToCartMock).toHaveBeenCalledWith(
      expect.objectContaining({ id: "p1", name: "Midnight Velvet" }),
    );
  });

  it("usa shortDescription como fallback quando description é ausente", async () => {
    const user = userEvent.setup();
    const minimal = { ...baseProduct, description: undefined };
    render(<ProductDetailsDialog product={minimal as never} />);
    await openDialog(user);
    expect(await screen.findByText(/fragrância misteriosa/i)).toBeInTheDocument();
  });
});
