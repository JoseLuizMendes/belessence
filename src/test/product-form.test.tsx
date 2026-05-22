/**
 * Testes — ProductForm (admin)
 * ─────────────────────────────────────────────────────────────────────
 * Componente grande com Radix Select/Calendar/AlertDialog/Switch. Cobrimos
 * o que é robusto em jsdom:
 *   - Render dos campos básicos com defaultValues
 *   - Validação client: sem imagem → toast.error (sem chamar action)
 *   - Submit válido → action(FormData) + toast.success
 *   - Erro da action → toast.error
 *   - Delete via AlertDialog → deleteAction
 *
 * CloudinaryUpload é mockado: expõe um botão "add-image" que injeta uma
 * imagem via onChange + um input hidden com o inputName.
 *
 * A lógica de transição de PROMOTION (Radix Select) é coberta no nível de
 * domínio por product-status.test.ts — não reproduzimos aqui.
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

// CloudinaryUpload mock: botão para simular upload + hidden input(s) com o
// inputName, refletindo `value`.
vi.mock("@/components/admin/cloudinary-upload", () => ({
  CloudinaryUpload: ({
    value,
    onChange,
    inputName,
  }: {
    value: string[];
    onChange: (next: string[]) => void;
    inputName: string;
  }) => (
    <div>
      <button
        type="button"
        onClick={() => onChange([...value, "https://cdn/img.jpg"])}
      >
        add-image
      </button>
      {value.map((url, i) => (
        <input key={i} type="hidden" name={inputName} value={url} readOnly />
      ))}
    </div>
  ),
}));

import { ProductForm } from "@/components/admin/product-form";

const defaults = {
  name: "Midnight Velvet",
  slug: "midnight-velvet",
  shortDescription: "Misteriosa",
  description: "Notas amadeiradas profundas.",
  price: 189.9,
  originalPrice: null,
  badge: null,
  badgeVariant: null,
  collection: "day",
  category: "perfume",
  stock: 10,
  images: [],
  features: ["Long-lasting"],
  status: "NORMAL" as const,
  isLimitedEdition: false,
  markedAsNewUntil: null,
  promotionStartsAt: null,
  promotionEndsAt: null,
};

function submitForm(user: ReturnType<typeof userEvent.setup>) {
  return user.click(
    screen.getByRole("button", { name: /salvar|atualizar|criar/i }),
  );
}

describe("ProductForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renderiza campos básicos com defaultValues", () => {
    render(<ProductForm defaultValues={defaults} action={vi.fn()} />);
    expect(
      (screen.getByLabelText(/nome do produto/i) as HTMLInputElement).value,
    ).toBe("Midnight Velvet");
    expect(
      (screen.getByLabelText(/slug/i) as HTMLInputElement).value,
    ).toBe("midnight-velvet");
    expect(
      (screen.getByLabelText(/descrição completa/i) as HTMLTextAreaElement)
        .value,
    ).toMatch(/notas amadeiradas/i);
  });

  it("bloqueia submit sem imagens (toast.error, action não chamada)", async () => {
    const user = userEvent.setup();
    const action = vi.fn().mockResolvedValue(undefined);
    render(<ProductForm defaultValues={defaults} action={action} />);

    await submitForm(user);

    await waitFor(() => expect(toastError).toHaveBeenCalled());
    expect(toastError).toHaveBeenCalledWith(
      expect.stringMatching(/adicione pelo menos uma imagem/i),
    );
    expect(action).not.toHaveBeenCalled();
  });

  it("submit válido (com imagem) chama action(FormData) e toast.success", async () => {
    const user = userEvent.setup();
    const action = vi.fn().mockResolvedValue(undefined);
    render(<ProductForm defaultValues={defaults} action={action} />);

    // Simula upload de uma imagem
    await user.click(screen.getByRole("button", { name: /add-image/i }));

    await submitForm(user);

    await waitFor(() => expect(action).toHaveBeenCalledOnce());
    expect(action.mock.calls[0][0]).toBeInstanceOf(FormData);
    expect(toastSuccess).toHaveBeenCalledWith("Produto salvo com sucesso!");
  });

  it("erro na action exibe toast.error com a mensagem", async () => {
    const user = userEvent.setup();
    const action = vi.fn().mockRejectedValue(new Error("Slug já existe"));
    render(<ProductForm defaultValues={defaults} action={action} />);

    await user.click(screen.getByRole("button", { name: /add-image/i }));
    await submitForm(user);

    await waitFor(() => expect(toastError).toHaveBeenCalled());
    expect(toastError).toHaveBeenCalledWith("Slug já existe");
    expect(toastSuccess).not.toHaveBeenCalled();
  });

  it("FormData inclui o nome e o slug digitados", async () => {
    const user = userEvent.setup();
    const action = vi.fn().mockResolvedValue(undefined);
    render(<ProductForm defaultValues={defaults} action={action} />);

    await user.click(screen.getByRole("button", { name: /add-image/i }));
    await submitForm(user);

    await waitFor(() => expect(action).toHaveBeenCalledOnce());
    const fd = action.mock.calls[0][0] as FormData;
    expect(fd.get("name")).toBe("Midnight Velvet");
    expect(fd.get("slug")).toBe("midnight-velvet");
    expect(fd.getAll("images")).toContain("https://cdn/img.jpg");
  });

  it("mostra botão 'Deletar produto' apenas quando deleteAction é fornecida", () => {
    const { rerender } = render(
      <ProductForm defaultValues={defaults} action={vi.fn()} />,
    );
    expect(
      screen.queryByRole("button", { name: /deletar produto/i }),
    ).not.toBeInTheDocument();

    rerender(
      <ProductForm
        defaultValues={defaults}
        action={vi.fn()}
        deleteAction={vi.fn()}
      />,
    );
    expect(
      screen.getByRole("button", { name: /deletar produto/i }),
    ).toBeInTheDocument();
  });

  it("confirmar exclusão no AlertDialog chama deleteAction", async () => {
    const user = userEvent.setup();
    const deleteAction = vi.fn().mockResolvedValue(undefined);
    render(
      <ProductForm
        defaultValues={defaults}
        action={vi.fn()}
        deleteAction={deleteAction}
      />,
    );

    // Abre o AlertDialog
    await user.click(
      screen.getByRole("button", { name: /deletar produto/i }),
    );
    // Confirma (botão de ação dentro do dialog)
    const confirm = await screen.findByRole("button", {
      name: /^deletar$|confirmar|sim/i,
    });
    await user.click(confirm);

    await waitFor(() => expect(deleteAction).toHaveBeenCalledOnce());
  });
});
