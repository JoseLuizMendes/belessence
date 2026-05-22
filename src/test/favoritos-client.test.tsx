/**
 * Testes — FavoritosClient
 * ─────────────────────────────────────────────────────────────────────
 * Foco: empty state, fetch por IDs, render de cards, limite soft 24,
 * clear all (com confirm).
 *
 * Mocks:
 *  - @/lib/wishlist-store — state mutável
 *  - @/lib/hooks/use-has-mounted — true (pula loading inicial)
 *  - @/components/product-card — stub identificável por slug
 *  - sonner, next/link
 *  - globalThis.fetch + globalThis.confirm
 */

import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { render, screen, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode, AnchorHTMLAttributes } from "react";

const { state, clearMock, toastSuccess, toastError } = vi.hoisted(() => ({
  state: { items: [] as string[], mounted: true },
  clearMock: vi.fn(),
  toastSuccess: vi.fn(),
  toastError: vi.fn(),
}));

vi.mock("@/lib/wishlist-store", () => ({
  useWishlistStore: (selector: (s: unknown) => unknown) =>
    selector({ items: state.items, clear: clearMock }),
}));

vi.mock("@/lib/hooks/use-has-mounted", () => ({
  useHasMounted: () => state.mounted,
}));

vi.mock("sonner", () => ({
  toast: { success: toastSuccess, error: toastError },
}));

vi.mock("@/components/product-card", () => ({
  ProductCard: ({ product }: { product: { id: string; name: string } }) => (
    <div data-testid={`card-${product.id}`}>{product.name}</div>
  ),
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

import { FavoritosClient } from "@/components/favoritos-client";

function makeProducts(n: number) {
  return Array.from({ length: n }, (_, i) => ({
    id: `p${i + 1}`,
    name: `Produto ${i + 1}`,
  }));
}

describe("FavoritosClient", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    state.items = [];
    state.mounted = true;
    vi.spyOn(globalThis, "fetch");
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("antes de montar (SSR/hidratação) mostra apenas o loader", () => {
    state.mounted = false;
    const { container } = render(<FavoritosClient />);
    // Loader (Loader2 com animate-spin) presente; sem heading/CTA ainda.
    expect(container.querySelector(".animate-spin")).toBeInTheDocument();
    expect(screen.queryByText(/meus favoritos/i)).not.toBeInTheDocument();
  });

  it("estado vazio: mostra mensagem e CTA para coleção", () => {
    render(<FavoritosClient />);
    expect(screen.getByText(/sua lista de desejos ainda está vazia/i))
      .toBeInTheDocument();
    expect(screen.getByText(/nenhum favorito ainda/i)).toBeInTheDocument();
    const cta = screen.getByRole("link", { name: /explorar coleção/i });
    expect(cta).toHaveAttribute("href", "/allProducts");
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it("com IDs: chama /api/products?ids= e renderiza cards", async () => {
    state.items = ["p1", "p2"];
    vi.mocked(globalThis.fetch).mockResolvedValueOnce(
      new Response(JSON.stringify(makeProducts(2)), { status: 200 }),
    );

    render(<FavoritosClient />);

    await waitFor(() => {
      expect(screen.getByTestId("card-p1")).toBeInTheDocument();
    });
    expect(screen.getByTestId("card-p2")).toBeInTheDocument();
    expect(globalThis.fetch).toHaveBeenCalledWith("/api/products?ids=p1,p2");

    // Texto pluralizado: "2 fragrâncias salvas"
    expect(screen.getByText(/2 fragrâncias salvas/i)).toBeInTheDocument();
  });

  it("singular: '1 fragrância salva' quando há apenas 1 favorito", async () => {
    state.items = ["p1"];
    vi.mocked(globalThis.fetch).mockResolvedValueOnce(
      new Response(JSON.stringify(makeProducts(1)), { status: 200 }),
    );

    render(<FavoritosClient />);
    await waitFor(() => {
      expect(screen.getByText(/1 fragrância salva/i)).toBeInTheDocument();
    });
  });

  it("toast.error quando fetch lança", async () => {
    state.items = ["p1"];
    vi.mocked(globalThis.fetch).mockRejectedValueOnce(new Error("Net"));

    render(<FavoritosClient />);
    await waitFor(() => expect(toastError).toHaveBeenCalled());
    expect(toastError).toHaveBeenCalledWith("Erro ao carregar favoritos");
  });

  it("limite soft de 24: mostra botão 'Mostrar todos' quando >24", async () => {
    const ids = Array.from({ length: 30 }, (_, i) => `p${i + 1}`);
    state.items = ids;
    vi.mocked(globalThis.fetch).mockResolvedValueOnce(
      new Response(JSON.stringify(makeProducts(30)), { status: 200 }),
    );

    render(<FavoritosClient />);
    await waitFor(() => {
      expect(screen.getByTestId("card-p1")).toBeInTheDocument();
    });

    // Apenas 24 renderizados inicialmente
    expect(screen.queryByTestId("card-p25")).not.toBeInTheDocument();
    expect(screen.getByText(/mostrando 24 de 30/i)).toBeInTheDocument();

    // Clicar em "Mostrar todos (30)" expande
    await userEvent.setup().click(
      screen.getByRole("button", { name: /mostrar todos \(30\)/i }),
    );
    expect(screen.getByTestId("card-p25")).toBeInTheDocument();
    expect(screen.getByTestId("card-p30")).toBeInTheDocument();
  });

  it("'Limpar tudo' confirma e chama clear() + toast success", async () => {
    state.items = ["p1"];
    vi.mocked(globalThis.fetch).mockResolvedValueOnce(
      new Response(JSON.stringify(makeProducts(1)), { status: 200 }),
    );
    // Simula usuário confirmando o `confirm()`
    vi.spyOn(globalThis, "confirm").mockReturnValueOnce(true);

    render(<FavoritosClient />);
    await waitFor(() => expect(screen.getByTestId("card-p1")).toBeInTheDocument());

    await userEvent.setup().click(
      screen.getByRole("button", { name: /limpar tudo/i }),
    );
    expect(clearMock).toHaveBeenCalledOnce();
    expect(toastSuccess).toHaveBeenCalledWith("Lista de favoritos limpa");
  });

  it("'Limpar tudo' cancelado não chama clear()", async () => {
    state.items = ["p1"];
    vi.mocked(globalThis.fetch).mockResolvedValueOnce(
      new Response(JSON.stringify(makeProducts(1)), { status: 200 }),
    );
    vi.spyOn(globalThis, "confirm").mockReturnValueOnce(false);

    render(<FavoritosClient />);
    await waitFor(() => expect(screen.getByTestId("card-p1")).toBeInTheDocument());

    await userEvent.setup().click(
      screen.getByRole("button", { name: /limpar tudo/i }),
    );
    expect(clearMock).not.toHaveBeenCalled();
    expect(toastSuccess).not.toHaveBeenCalled();
  });

  it("filtra cards retornados pela API removendo os que não estão mais nos favoritos", async () => {
    state.items = ["p1", "p2"];
    // API retorna 3 produtos, mas o usuário só tem 2 nos favoritos
    vi.mocked(globalThis.fetch).mockResolvedValueOnce(
      new Response(JSON.stringify(makeProducts(3)), { status: 200 }),
    );

    render(<FavoritosClient />);
    await waitFor(() => expect(screen.getByTestId("card-p1")).toBeInTheDocument());

    expect(screen.getByTestId("card-p2")).toBeInTheDocument();
    expect(screen.queryByTestId("card-p3")).not.toBeInTheDocument();
  });

  // act() para suprimir warning de state update fora do act() do useEffect
  void act;
});
