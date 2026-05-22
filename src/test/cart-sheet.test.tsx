/**
 * Testes — CartSheet
 * ─────────────────────────────────────────────────────────────────────
 * Foco: comportamento do carrinho aberto (itens vazios vs com itens),
 * controles de quantidade ±, remover, total, CTA finalizar e fechamento.
 *
 * Mocks:
 *  - ./cart (useCart) — controla state e captura chamadas
 *  - next/image, next/link — stubs jsdom-friendly
 *
 * O Radix Sheet usa portal — o `<SheetContent>` só monta quando `open=true`.
 * Por isso passamos `isCartOpen: true` no mock.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode, AnchorHTMLAttributes, ImgHTMLAttributes } from "react";

const { state, removeFromCart, updateQuantity, setIsCartOpen } = vi.hoisted(
  () => ({
    state: {
      items: [] as Array<{
        id: string;
        name: string;
        shortDescription: string;
        price: number;
        quantity: number;
        image: string;
      }>,
      cartTotal: 0,
      isCartOpen: true,
    },
    removeFromCart: vi.fn(),
    updateQuantity: vi.fn(),
    setIsCartOpen: vi.fn(),
  }),
);

vi.mock("@/components/cart", () => ({
  useCart: () => ({
    items: state.items,
    cartTotal: state.cartTotal,
    isCartOpen: state.isCartOpen,
    setIsCartOpen,
    removeFromCart,
    updateQuantity,
  }),
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

import { CartSheet } from "@/components/cart-sheet";

function setItems(
  items: typeof state.items,
  cartTotal = items.reduce((acc, i) => acc + i.price * i.quantity, 0),
) {
  state.items = items;
  state.cartTotal = cartTotal;
}

describe("CartSheet", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setItems([]);
    state.isCartOpen = true;
  });

  it("mostra estado vazio quando não há itens", () => {
    render(
      <CartSheet>
        <button type="button">Trigger</button>
      </CartSheet>,
    );
    expect(screen.getByText(/seu carrinho está vazio/i)).toBeInTheDocument();
    expect(screen.getByText(/nenhum produto selecionado/i)).toBeInTheDocument();
  });

  it("lista produtos do carrinho com nome, preço e quantidade", () => {
    setItems([
      {
        id: "p1",
        name: "Midnight Velvet",
        shortDescription: "Misteriosa",
        price: 189.9,
        quantity: 2,
        image: "/img.jpg",
      },
    ]);

    render(
      <CartSheet>
        <button type="button">Trigger</button>
      </CartSheet>,
    );
    expect(screen.getByText("Midnight Velvet")).toBeInTheDocument();
    expect(screen.getByText(/R\$\s?189,90/)).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText(/1 item selecionado/i)).toBeInTheDocument();
  });

  it("descrição pluraliza com 2+ itens", () => {
    setItems([
      { id: "p1", name: "A", shortDescription: "", price: 10, quantity: 1, image: "" },
      { id: "p2", name: "B", shortDescription: "", price: 20, quantity: 1, image: "" },
    ]);
    render(
      <CartSheet>
        <button type="button">Trigger</button>
      </CartSheet>,
    );
    expect(screen.getByText(/2 itens selecionados/i)).toBeInTheDocument();
  });

  it("clicar em + chama updateQuantity(id, qty + 1)", async () => {
    const user = userEvent.setup();
    setItems([
      {
        id: "p1",
        name: "Item",
        shortDescription: "",
        price: 100,
        quantity: 3,
        image: "",
      },
    ]);
    render(
      <CartSheet>
        <button type="button">Trigger</button>
      </CartSheet>,
    );
    // O Sheet renderiza vários botões; pegamos os ± pelo svg/icon dentro.
    // Padrão shadcn: botão "icon" sem texto — usamos getAllByRole + posição.
    const buttons = screen.getAllByRole("button");
    // Layout: ... [Trigger], [-], [+], [trash], [Finalizar Compra]
    // Filtramos pelos sem texto (size=icon) na linha do item.
    const iconButtons = buttons.filter((b) => b.textContent?.trim() === "");
    expect(iconButtons.length).toBeGreaterThanOrEqual(3);
    // ordem: minus, plus, trash
    await user.click(iconButtons[1]); // plus
    expect(updateQuantity).toHaveBeenCalledWith("p1", 4);
  });

  it("clicar em - chama updateQuantity(id, qty - 1)", async () => {
    const user = userEvent.setup();
    setItems([
      {
        id: "p1",
        name: "Item",
        shortDescription: "",
        price: 100,
        quantity: 3,
        image: "",
      },
    ]);
    render(
      <CartSheet>
        <button type="button">Trigger</button>
      </CartSheet>,
    );
    const iconButtons = screen
      .getAllByRole("button")
      .filter((b) => b.textContent?.trim() === "");
    await user.click(iconButtons[0]); // minus
    expect(updateQuantity).toHaveBeenCalledWith("p1", 2);
  });

  it("clicar no ícone de lixeira chama removeFromCart(id)", async () => {
    const user = userEvent.setup();
    setItems([
      {
        id: "p1",
        name: "Item",
        shortDescription: "",
        price: 100,
        quantity: 1,
        image: "",
      },
    ]);
    render(
      <CartSheet>
        <button type="button">Trigger</button>
      </CartSheet>,
    );
    const iconButtons = screen
      .getAllByRole("button")
      .filter((b) => b.textContent?.trim() === "");
    await user.click(iconButtons[2]); // trash
    expect(removeFromCart).toHaveBeenCalledWith("p1");
  });

  it("mostra total formatado em BRL", () => {
    setItems(
      [
        {
          id: "p1",
          name: "A",
          shortDescription: "",
          price: 50,
          quantity: 2,
          image: "",
        },
        {
          id: "p2",
          name: "B",
          shortDescription: "",
          price: 30,
          quantity: 1,
          image: "",
        },
      ],
      130,
    );
    render(
      <CartSheet>
        <button type="button">Trigger</button>
      </CartSheet>,
    );
    expect(screen.getByText(/R\$\s?130,00/)).toBeInTheDocument();
  });

  it("link 'Finalizar Compra' aponta para /checkout e fecha o sheet ao clicar", async () => {
    const user = userEvent.setup();
    setItems([
      {
        id: "p1",
        name: "A",
        shortDescription: "",
        price: 50,
        quantity: 1,
        image: "",
      },
    ]);
    render(
      <CartSheet>
        <button type="button">Trigger</button>
      </CartSheet>,
    );
    const finalize = screen.getByRole("link", { name: /finalizar compra/i });
    expect(finalize).toHaveAttribute("href", "/checkout");

    await user.click(finalize);
    expect(setIsCartOpen).toHaveBeenCalledWith(false);
  });
});
