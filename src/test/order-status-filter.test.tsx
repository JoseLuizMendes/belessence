/**
 * Testes — OrderStatusFilter (admin)
 * Foco: pills com label, navegação ao clicar (router.push com query).
 * ToggleGroup do shadcn (Radix) — interações via userEvent.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const { routerPush } = vi.hoisted(() => ({ routerPush: vi.fn() }));

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

import { OrderStatusFilter } from "@/components/admin/order-status-filter";

const statuses = [
  { value: "PENDING" as const, label: "Pendente" },
  { value: "SHIPPED" as const, label: "Enviado" },
  { value: "DELIVERED" as const, label: "Entregue" },
];

describe("OrderStatusFilter", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renderiza 'Todos' + uma pill por status", () => {
    render(
      <OrderStatusFilter activeStatus={undefined} statuses={statuses} />,
    );
    expect(
      screen.getByRole("radio", { name: /^todos$/i }),
    ).toBeInTheDocument();
    for (const { label } of statuses) {
      expect(
        screen.getByRole("radio", { name: new RegExp(`^${label}$`, "i") }),
      ).toBeInTheDocument();
    }
  });

  it("quando activeStatus é undefined, 'Todos' está com aria-checked='true'", () => {
    render(
      <OrderStatusFilter activeStatus={undefined} statuses={statuses} />,
    );
    expect(
      screen.getByRole("radio", { name: /^todos$/i }),
    ).toHaveAttribute("aria-checked", "true");
  });

  it("quando activeStatus='SHIPPED', a pill 'Enviado' está marcada", () => {
    render(
      <OrderStatusFilter activeStatus="SHIPPED" statuses={statuses} />,
    );
    expect(
      screen.getByRole("radio", { name: /^enviado$/i }),
    ).toHaveAttribute("aria-checked", "true");
  });

  it("clicar em uma pill chama router.push com ?status=<value>", async () => {
    const user = userEvent.setup();
    render(
      <OrderStatusFilter activeStatus={undefined} statuses={statuses} />,
    );
    await user.click(screen.getByRole("radio", { name: /^enviado$/i }));
    expect(routerPush).toHaveBeenCalledWith("/admin/pedidos?status=SHIPPED");
  });

  it("clicar em 'Todos' navega para /admin/pedidos sem query", async () => {
    const user = userEvent.setup();
    render(
      <OrderStatusFilter activeStatus="SHIPPED" statuses={statuses} />,
    );
    await user.click(screen.getByRole("radio", { name: /^todos$/i }));
    expect(routerPush).toHaveBeenCalledWith("/admin/pedidos");
  });
});
