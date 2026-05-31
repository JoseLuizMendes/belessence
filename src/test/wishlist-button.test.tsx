/**
 * Testes — WishlistButton
 * ─────────────────────────────────────────────────────────────────────
 * Mocka:
 *  - @/lib/wishlist-store (store inteira) — usuário escolheu mock total
 *  - sonner — não queremos toast real no jsdom
 *  - @/lib/hooks/use-has-mounted — força true pra pular gating de hidratação
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// vi.hoisted é avaliado antes dos vi.mock — única forma segura de compartilhar
// referências entre factory de mock e o teste. `state` é mutável para que
// cada teste possa configurar `items` sem re-criar o mock.
const { toggleMock, toastSuccess, state } = vi.hoisted(() => ({
  toggleMock: vi.fn(),
  toastSuccess: vi.fn(),
  state: { items: [] as string[] },
}));

vi.mock("@/lib/wishlist/presentation/wishlist-store", () => ({
  useWishlistStore: (selector: (s: unknown) => unknown) =>
    selector({ items: state.items, toggle: toggleMock }),
}));

vi.mock("sonner", () => ({
  toast: { success: toastSuccess },
}));

vi.mock("@/lib/hooks/use-has-mounted", () => ({
  useHasMounted: () => true,
}));

import { WishlistButton } from "@/components/wishlist-button";

function mockStoreItems(items: string[]) {
  state.items = items;
}

describe("WishlistButton", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockStoreItems([]);
  });

  it("renderiza com label 'Adicionar aos favoritos' quando não favoritado", () => {
    render(<WishlistButton productId="p1" productName="Perfume X" />);
    expect(
      screen.getByRole("button", { name: /adicionar aos favoritos/i }),
    ).toBeInTheDocument();
  });

  it("renderiza com aria-pressed=false quando não favoritado", () => {
    render(<WishlistButton productId="p1" productName="Perfume X" />);
    expect(screen.getByRole("button")).toHaveAttribute("aria-pressed", "false");
  });

  it("renderiza com label 'Remover dos favoritos' quando favoritado", () => {
    mockStoreItems(["p1"]);
    render(<WishlistButton productId="p1" productName="Perfume X" />);
    expect(
      screen.getByRole("button", { name: /remover dos favoritos/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button")).toHaveAttribute("aria-pressed", "true");
  });

  it("chama toggle(productId) ao clicar", async () => {
    const user = userEvent.setup();
    render(<WishlistButton productId="p1" productName="Perfume X" />);
    await user.click(screen.getByRole("button"));
    expect(toggleMock).toHaveBeenCalledWith("p1");
  });

  it("mostra toast 'Adicionado' ao favoritar produto inexistente", async () => {
    const user = userEvent.setup();
    render(<WishlistButton productId="p1" productName="Perfume X" />);
    await user.click(screen.getByRole("button"));
    expect(toastSuccess).toHaveBeenCalledWith(
      expect.stringMatching(/adicionado aos favoritos/i),
      expect.objectContaining({ description: "Perfume X" }),
    );
  });

  it("mostra toast 'Removido' ao desfavoritar produto existente", async () => {
    const user = userEvent.setup();
    mockStoreItems(["p1"]);
    render(<WishlistButton productId="p1" productName="Perfume X" />);
    await user.click(screen.getByRole("button"));
    expect(toastSuccess).toHaveBeenCalledWith(
      expect.stringMatching(/removido dos favoritos/i),
      expect.objectContaining({ description: "Perfume X" }),
    );
  });

  it("não propaga o click (preventDefault + stopPropagation) — útil em card clicável", async () => {
    const user = userEvent.setup();
    const parentClick = vi.fn();
    render(
      <a href="/destino" onClick={parentClick}>
        <WishlistButton productId="p1" productName="Perfume X" />
      </a>,
    );
    await user.click(screen.getByRole("button"));
    expect(parentClick).not.toHaveBeenCalled();
  });
});
