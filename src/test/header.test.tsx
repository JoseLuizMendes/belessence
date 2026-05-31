/**
 * Testes — Header
 * Foco: badge de cart/wishlist com base no count, busca → router.push.
 *
 * Mocks:
 *  - ./cart (useCart) — controla cartCount
 *  - @/lib/wishlist-store — controla count
 *  - next/navigation.useRouter — captura push
 *  - ./cart-sheet — stub (já testado)
 *  - useHasMounted → true
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode, AnchorHTMLAttributes } from "react";

const { state, routerPush } = vi.hoisted(() => ({
  state: { cartCount: 0, wishlistCount: 0 },
  routerPush: vi.fn(),
}));

vi.mock("@/components/cart", () => ({
  useCart: () => ({ cartCount: state.cartCount }),
}));

vi.mock("@/lib/wishlist/presentation/wishlist-store", () => ({
  useWishlistStore: (selector: (s: unknown) => unknown) =>
    selector({ count: state.wishlistCount }),
}));

vi.mock("@/lib/hooks/use-has-mounted", () => ({
  useHasMounted: () => true,
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: routerPush,
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn(),
  }),
}));

// CartSheet renderiza children como trigger — stub mantém comportamento mínimo
vi.mock("@/components/cart-sheet", () => ({
  CartSheet: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

vi.mock("@/components/mari-logo", () => ({
  MariLogo: () => <span data-testid="mari-logo" />,
}));

vi.mock("gsap/ScrollTrigger", () => ({
  ScrollTrigger: { create: vi.fn(), update: vi.fn() },
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

import Header from "@/components/header";

describe("Header", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    state.cartCount = 0;
    state.wishlistCount = 0;
  });

  it("link 'Meus favoritos' aponta para /favoritos", () => {
    render(<Header />);
    expect(
      screen.getByRole("link", { name: /meus favoritos/i }),
    ).toHaveAttribute("href", "/favoritos");
  });

  it("não mostra badge de wishlist quando count = 0", () => {
    render(<Header />);
    // Não há nenhum '0' visível como badge
    expect(screen.queryByText("0")).not.toBeInTheDocument();
  });

  it("mostra badge de wishlist com o count quando > 0", () => {
    state.wishlistCount = 3;
    render(<Header />);
    expect(screen.getByText("3")).toBeInTheDocument();
  });

  it("mostra badge de carrinho com o cartCount quando > 0", () => {
    state.cartCount = 5;
    render(<Header />);
    expect(screen.getByText("5")).toBeInTheDocument();
  });

  it("ambos os badges aparecem quando ambos > 0", () => {
    state.cartCount = 2;
    state.wishlistCount = 4;
    render(<Header />);
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText("4")).toBeInTheDocument();
  });

  it("busca: submit com termo → router.push('/allProducts?q=...')", async () => {
    const user = userEvent.setup();
    render(<Header />);
    const input = screen.getAllByLabelText(/buscar produtos/i)[0];
    await user.type(input, "midnight velvet{Enter}");
    expect(routerPush).toHaveBeenCalledWith(
      "/allProducts?q=midnight%20velvet",
    );
  });

  it("busca com termo vazio não chama router.push", async () => {
    const user = userEvent.setup();
    render(<Header />);
    const input = screen.getAllByLabelText(/buscar produtos/i)[0];
    await user.click(input);
    await user.keyboard("{Enter}");
    expect(routerPush).not.toHaveBeenCalled();
  });

  it("busca com termo só com espaços não chama router.push", async () => {
    const user = userEvent.setup();
    render(<Header />);
    const input = screen.getAllByLabelText(/buscar produtos/i)[0];
    await user.type(input, "   {Enter}");
    expect(routerPush).not.toHaveBeenCalled();
  });

  it("busca: termo é trim'ado antes do encode", async () => {
    const user = userEvent.setup();
    render(<Header />);
    const input = screen.getAllByLabelText(/buscar produtos/i)[0];
    await user.type(input, "  perfume  {Enter}");
    expect(routerPush).toHaveBeenCalledWith("/allProducts?q=perfume");
  });
});
