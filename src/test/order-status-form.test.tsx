/**
 * Testes — OrderStatusForm (admin)
 * Foco: 6 opções de status, asterisco condicional em tracking quando SHIPPED,
 * submit chama Server Action com FormData, toasts de sucesso/erro.
 *
 * Padrão Radix Select (shadcn):
 *  - Trigger é <button role="combobox">, NÃO <select> nativo
 *  - Options renderizam em portal só quando dropdown abre
 *  - Form usa <input type="hidden" name="status"> pra carregar value no FormData
 *  - userEvent precisa de pointerEventsCheck: 0 porque Radix usa pointer-events: none
 *    no body durante portal aberto (impede clicks no jsdom sem o bypass)
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent, { PointerEventsCheckLevel } from "@testing-library/user-event";

const { toastSuccess, toastError } = vi.hoisted(() => ({
  toastSuccess: vi.fn(),
  toastError: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: { success: toastSuccess, error: toastError },
}));

import { OrderStatusForm } from "@/components/admin/order-status-form";

/** Setup userEvent que tolera pointer-events: none do Radix Select em jsdom. */
const setupUser = () =>
  userEvent.setup({
    pointerEventsCheck: PointerEventsCheckLevel.Never,
  });

describe("OrderStatusForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renderiza as 6 opções de status ao abrir o select", async () => {
    const user = setupUser();
    render(
      <OrderStatusForm
        currentStatus="PENDING"
        currentTrackingCode={null}
        action={vi.fn()}
      />,
    );
    // Abre o dropdown — Radix Select só monta options no portal após click no trigger
    await user.click(screen.getByRole("combobox"));

    const labels = [
      /aguardando pagamento/i,
      /pagamento confirmado/i,
      /em preparação/i,
      /^enviado$/i,
      /^entregue$/i,
      /^cancelado$/i,
    ];
    for (const l of labels) {
      expect(await screen.findByRole("option", { name: l })).toBeInTheDocument();
    }
  });

  it("seleciona o currentStatus como valor inicial (trigger mostra a label correspondente)", () => {
    render(
      <OrderStatusForm
        currentStatus="SHIPPED"
        currentTrackingCode="BR123"
        action={vi.fn()}
      />,
    );
    // Radix expõe a label do option selecionado no texto do trigger via SelectValue
    expect(screen.getByRole("combobox")).toHaveTextContent(/enviado/i);
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
    // Component renderiza "Opcional; preencha quando despachar."
    expect(
      screen.getByText(/opcional; preencha quando despachar/i),
    ).toBeInTheDocument();
  });

  it("mudar status para SHIPPED via select torna tracking obrigatório", async () => {
    const user = setupUser();
    render(
      <OrderStatusForm
        currentStatus="PREPARING"
        currentTrackingCode={null}
        action={vi.fn()}
      />,
    );
    // Abre o select e clica em "Enviado"
    await user.click(screen.getByRole("combobox"));
    await user.click(await screen.findByRole("option", { name: /^enviado$/i }));

    // Após selecionar, o estado interno muda e tracking vira required
    await waitFor(() =>
      expect(screen.getByPlaceholderText(/BR123456789XX/i)).toBeRequired(),
    );
  });

  it("submit chama action(FormData) e toast.success", async () => {
    const user = setupUser();
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
    const user = setupUser();
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
    const user = setupUser();
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
