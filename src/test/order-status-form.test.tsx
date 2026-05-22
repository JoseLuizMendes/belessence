/**
 * Testes — OrderStatusForm (admin)
 * Foco: 6 opções de status, asterisco condicional em tracking quando SHIPPED,
 * submit chama Server Action com FormData, toasts de sucesso/erro.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const { toastSuccess, toastError } = vi.hoisted(() => ({
  toastSuccess: vi.fn(),
  toastError: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: { success: toastSuccess, error: toastError },
}));

import { OrderStatusForm } from "@/components/admin/order-status-form";

describe("OrderStatusForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renderiza as 6 opções de status", () => {
    render(
      <OrderStatusForm
        currentStatus="PENDING"
        currentTrackingCode={null}
        action={vi.fn()}
      />,
    );
    const labels = [
      /aguardando pagamento/i,
      /pagamento confirmado/i,
      /em preparação/i,
      /^enviado$/i,
      /^entregue$/i,
      /^cancelado$/i,
    ];
    for (const l of labels) {
      expect(screen.getByRole("option", { name: l })).toBeInTheDocument();
    }
  });

  it("seleciona o currentStatus como valor inicial", () => {
    render(
      <OrderStatusForm
        currentStatus="SHIPPED"
        currentTrackingCode="BR123"
        action={vi.fn()}
      />,
    );
    const select = screen.getByRole("combobox") as HTMLSelectElement;
    expect(select.value).toBe("SHIPPED");
  });

  it("preenche o trackingCode inicial quando fornecido", () => {
    render(
      <OrderStatusForm
        currentStatus="SHIPPED"
        currentTrackingCode="BR123ABC"
        action={vi.fn()}
      />,
    );
    expect(
      (screen.getByPlaceholderText(/BR123456789XX/i) as HTMLInputElement).value,
    ).toBe("BR123ABC");
  });

  it("trackingCode vira obrigatório (required) quando status = SHIPPED", () => {
    render(
      <OrderStatusForm
        currentStatus="SHIPPED"
        currentTrackingCode={null}
        action={vi.fn()}
      />,
    );
    expect(
      screen.getByPlaceholderText(/BR123456789XX/i),
    ).toBeRequired();
    expect(
      screen.getByText(/obrigatório quando o status é enviado/i),
    ).toBeInTheDocument();
  });

  it("trackingCode é opcional quando status != SHIPPED", () => {
    render(
      <OrderStatusForm
        currentStatus="PREPARING"
        currentTrackingCode={null}
        action={vi.fn()}
      />,
    );
    expect(
      screen.getByPlaceholderText(/BR123456789XX/i),
    ).not.toBeRequired();
    expect(
      screen.getByText(/opcional — preencha quando despachar/i),
    ).toBeInTheDocument();
  });

  it("mudar status para SHIPPED no select torna tracking obrigatório", async () => {
    const user = userEvent.setup();
    render(
      <OrderStatusForm
        currentStatus="PREPARING"
        currentTrackingCode={null}
        action={vi.fn()}
      />,
    );
    const select = screen.getByRole("combobox");
    await user.selectOptions(select, "SHIPPED");
    expect(
      screen.getByPlaceholderText(/BR123456789XX/i),
    ).toBeRequired();
  });

  it("submit chama action(FormData) e toast.success", async () => {
    const user = userEvent.setup();
    const action = vi.fn().mockResolvedValue(undefined);
    render(
      <OrderStatusForm
        currentStatus="PREPARING"
        currentTrackingCode={null}
        action={action}
      />,
    );
    await user.click(screen.getByRole("button", { name: /atualizar pedido/i }));

    await waitFor(() => expect(action).toHaveBeenCalledOnce());
    // FormData não pode ser comparado por igualdade — checamos a instância
    expect(action.mock.calls[0][0]).toBeInstanceOf(FormData);
    expect(toastSuccess).toHaveBeenCalledWith("Status atualizado");
  });

  it("toast.error com mensagem quando action lança Error", async () => {
    const user = userEvent.setup();
    const action = vi
      .fn()
      .mockRejectedValue(new Error("Pedido já entregue"));
    render(
      <OrderStatusForm
        currentStatus="PREPARING"
        currentTrackingCode={null}
        action={action}
      />,
    );
    await user.click(screen.getByRole("button", { name: /atualizar pedido/i }));

    await waitFor(() => expect(toastError).toHaveBeenCalled());
    expect(toastError).toHaveBeenCalledWith("Pedido já entregue");
  });

  it("toast.error genérico quando action lança não-Error", async () => {
    const user = userEvent.setup();
    const action = vi.fn().mockRejectedValue("string crua");
    render(
      <OrderStatusForm
        currentStatus="PREPARING"
        currentTrackingCode={null}
        action={action}
      />,
    );
    await user.click(screen.getByRole("button", { name: /atualizar pedido/i }));

    await waitFor(() => expect(toastError).toHaveBeenCalled());
    expect(toastError).toHaveBeenCalledWith("Erro ao atualizar status");
  });
});
