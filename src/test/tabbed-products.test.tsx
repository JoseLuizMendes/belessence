/**
 * Testes — TabbedProducts
 * Foco: filtragem em memória de 2 níveis (coleção/lista curada → gênero).
 * ProductCard é mockado para isolar a lógica (sem cart/auth/Zustand).
 * GSAP é mockado globalmente em src/test/setup.ts.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { Product } from "@/lib/products/infrastructure/persistence/products-repository";

vi.mock("@/components/product-card", () => ({
  ProductCard: ({ product }: { product: { name: string } }) => (
    <div data-testid="product-card">{product.name}</div>
  ),
}));

import TabbedProducts from "@/components/tabbed-products";

function makeProduct(over: Partial<Product> & { id: string; name: string }): Product {
  return {
    slug: over.id,
    shortDescription: "",
    description: "",
    price: 100,
    originalPrice: null,
    badge: null,
    badgeVariant: null,
    rating: 5,
    reviews: 0,
    images: ["x.jpg"],
    features: [],
    collection: "perfumes",
    category: "perfume",
    gender: "FEMININO",
    totalSold: 0,
    seasonalSold: 0,
    stock: 10,
    status: "NORMAL",
    isLimitedEdition: false,
    markedAsNewUntil: null,
    promotionStartsAt: null,
    promotionEndsAt: null,
    createdAt: new Date("2020-01-01"),
    updatedAt: new Date("2020-01-01"),
    ...over,
  };
}

const POOL: Product[] = [
  makeProduct({ id: "p1", name: "Perfume Fem Novo", collection: "perfumes", gender: "FEMININO", totalSold: 100, createdAt: new Date() }),
  makeProduct({ id: "p2", name: "Perfume Masc", collection: "perfumes", gender: "MASCULINO", totalSold: 50 }),
  makeProduct({ id: "p3", name: "Corpo Promo", collection: "corpo", gender: "UNISSEX", totalSold: 10, status: "PROMOTION", price: 80, originalPrice: 120, promotionEndsAt: new Date(Date.now() + 86400000) }),
  makeProduct({ id: "p4", name: "Corpo Fem", collection: "corpo", gender: "FEMININO", totalSold: 200 }),
];

function cardNames(): string[] {
  return screen.getAllByTestId("product-card").map((el) => el.textContent ?? "");
}

describe("TabbedProducts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("mostra todos os produtos na aba inicial (Destaques)", () => {
    render(<TabbedProducts products={POOL} />);
    expect(cardNames()).toHaveLength(4);
  });

  it("renderiza pílulas curadas relevantes + coleções derivadas", () => {
    render(<TabbedProducts products={POOL} />);
    expect(screen.getByRole("button", { name: "Destaques" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Mais vendidos" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Lançamentos" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Promoções" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Perfumes" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Corpo" })).toBeInTheDocument();
  });

  it("filtra por coleção e exibe a sub-fileira de gênero", async () => {
    const user = userEvent.setup();
    render(<TabbedProducts products={POOL} />);

    await user.click(screen.getByRole("button", { name: "Perfumes" }));

    expect(cardNames().sort()).toEqual(["Perfume Fem Novo", "Perfume Masc"]);

    const genderGroup = screen.getByRole("group", { name: /refinar por g/i });
    expect(within(genderGroup).getByRole("button", { name: "Feminino" })).toBeInTheDocument();
    expect(within(genderGroup).getByRole("button", { name: "Masculino" })).toBeInTheDocument();
  });

  it("refina por gênero dentro da coleção", async () => {
    const user = userEvent.setup();
    render(<TabbedProducts products={POOL} />);

    await user.click(screen.getByRole("button", { name: "Perfumes" }));
    const genderGroup = screen.getByRole("group", { name: /refinar por g/i });
    await user.click(within(genderGroup).getByRole("button", { name: "Masculino" }));

    expect(cardNames()).toEqual(["Perfume Masc"]);
  });

  it("aba Promoções mostra só produtos em promoção ativa", async () => {
    const user = userEvent.setup();
    render(<TabbedProducts products={POOL} />);

    await user.click(screen.getByRole("button", { name: "Promoções" }));

    expect(cardNames()).toEqual(["Corpo Promo"]);
  });
});
