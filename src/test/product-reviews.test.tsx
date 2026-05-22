/**
 * Testes — ProductReviews
 * Foco: carregamento inicial, lista vazia/preenchida, estrelas interativas,
 * submit com rating=0, submit válido, propagação de erro da API.
 */

import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

const { toastSuccess, toastError } = vi.hoisted(() => ({
  toastSuccess: vi.fn(),
  toastError: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: { success: toastSuccess, error: toastError },
}));

import { ProductReviews } from "@/components/product-reviews";

function fillField(label: RegExp, value: string) {
  fireEvent.change(screen.getByLabelText(label), { target: { value } });
}

function submit() {
  fireEvent.click(screen.getByRole("button", { name: /publicar avaliação/i }));
}

describe("ProductReviews", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(globalThis, "fetch");
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("mostra loading inicial e depois lista vazia", async () => {
    vi.mocked(globalThis.fetch).mockResolvedValueOnce(
      new Response(JSON.stringify([]), { status: 200 }),
    );
    render(<ProductReviews productId="11111111-1111-1111-1111-111111111111" />);

    await waitFor(() => {
      expect(
        screen.getByText(/ainda não há avaliações/i),
      ).toBeInTheDocument();
    });
    expect(globalThis.fetch).toHaveBeenCalledWith("/api/reviews/11111111-1111-1111-1111-111111111111");
  });

  it("renderiza reviews retornadas com nome, rating e texto", async () => {
    vi.mocked(globalThis.fetch).mockResolvedValueOnce(
      new Response(
        JSON.stringify([
          {
            id: "r1",
            authorName: "Ana",
            rating: 5,
            text: "Adorei o cheiro!",
            createdAt: "2026-05-01T10:00:00Z",
          },
          {
            id: "r2",
            authorName: "Beatriz",
            rating: 3,
            text: null,
            createdAt: "2026-05-02T10:00:00Z",
          },
        ]),
        { status: 200 },
      ),
    );
    render(<ProductReviews productId="11111111-1111-1111-1111-111111111111" />);

    await waitFor(() => {
      expect(screen.getByText("Ana")).toBeInTheDocument();
    });
    expect(screen.getByText("Beatriz")).toBeInTheDocument();
    expect(screen.getByText(/adorei o cheiro/i)).toBeInTheDocument();
  });

  it("renderiza 5 botões de estrela com aria-label numérico", async () => {
    vi.mocked(globalThis.fetch).mockResolvedValueOnce(
      new Response(JSON.stringify([]), { status: 200 }),
    );
    render(<ProductReviews productId="11111111-1111-1111-1111-111111111111" />);

    for (let i = 1; i <= 5; i++) {
      expect(
        screen.getByRole("button", { name: new RegExp(`^${i} estrelas$`) }),
      ).toBeInTheDocument();
    }
  });

  it("submeter sem selecionar estrelas barra no Zod (mensagem visível, sem POST)", async () => {
    vi.mocked(globalThis.fetch).mockResolvedValueOnce(
      new Response(JSON.stringify([]), { status: 200 }),
    );
    render(<ProductReviews productId="11111111-1111-1111-1111-111111111111" />);

    await waitFor(() =>
      expect(screen.getByText(/ainda não há avaliações/i)).toBeInTheDocument(),
    );

    fillField(/seu nome/i, "Maria");
    fillField(/seu e-mail/i, "maria@example.com");
    submit();

    // Zod schema: rating.min(1) — mensagem default contém "1" no texto.
    // Esperamos qualquer mensagem de erro renderizada no slot de rating.
    await waitFor(() => {
      // O elemento mostra errors.rating.message via <p class="...destructive">
      const errs = screen.getAllByText(/greater than|maior|menor|1/i);
      expect(errs.length).toBeGreaterThan(0);
    });

    // POST nunca foi chamado — só o GET inicial
    expect(globalThis.fetch).toHaveBeenCalledTimes(1);
    expect(toastSuccess).not.toHaveBeenCalled();
  });

  it("caminho feliz: rating selecionado + dados válidos → POST e reload", async () => {
    // GET inicial → []
    vi.mocked(globalThis.fetch).mockResolvedValueOnce(
      new Response(JSON.stringify([]), { status: 200 }),
    );
    // POST review → ok
    vi.mocked(globalThis.fetch).mockResolvedValueOnce(
      new Response(JSON.stringify({ message: "Avaliação publicada!" }), {
        status: 201,
      }),
    );
    // GET após reload → contém a nova review
    vi.mocked(globalThis.fetch).mockResolvedValueOnce(
      new Response(
        JSON.stringify([
          {
            id: "r1",
            authorName: "Maria",
            rating: 5,
            text: "Top!",
            createdAt: "2026-05-19T12:00:00Z",
          },
        ]),
        { status: 200 },
      ),
    );

    render(<ProductReviews productId="11111111-1111-1111-1111-111111111111" />);

    await waitFor(() =>
      expect(screen.getByText(/ainda não há avaliações/i)).toBeInTheDocument(),
    );

    fireEvent.click(screen.getByRole("button", { name: /^5 estrelas$/ }));
    fillField(/seu nome/i, "Maria");
    fillField(/seu e-mail/i, "maria@example.com");
    fillField(/sua opinião/i, "Top!");

    submit();

    await waitFor(() => expect(toastSuccess).toHaveBeenCalled());
    expect(toastSuccess).toHaveBeenCalledWith("Avaliação publicada!");

    // O POST foi feito com payload correto
    const postCall = vi.mocked(globalThis.fetch).mock.calls.find(
      (c) => c[0] === "/api/reviews",
    );
    expect(postCall).toBeDefined();
    const body = JSON.parse((postCall![1] as RequestInit).body as string);
    expect(body).toEqual({
      productId: "11111111-1111-1111-1111-111111111111",
      rating: 5,
      authorName: "Maria",
      authorEmail: "maria@example.com",
      text: "Top!",
    });

    // Reload aconteceu (3 chamadas: GET inicial, POST, GET após)
    expect(globalThis.fetch).toHaveBeenCalledTimes(3);
  });

  it("API retorna !ok: toast.error com mensagem do servidor", async () => {
    vi.mocked(globalThis.fetch).mockResolvedValueOnce(
      new Response(JSON.stringify([]), { status: 200 }),
    );
    vi.mocked(globalThis.fetch).mockResolvedValueOnce(
      new Response(JSON.stringify({ error: "Email já avaliou esse produto" }), {
        status: 409,
      }),
    );

    render(<ProductReviews productId="11111111-1111-1111-1111-111111111111" />);
    await waitFor(() =>
      expect(screen.getByText(/ainda não há avaliações/i)).toBeInTheDocument(),
    );

    fireEvent.click(screen.getByRole("button", { name: /^4 estrelas$/ }));
    fillField(/seu nome/i, "Maria");
    fillField(/seu e-mail/i, "maria@example.com");
    submit();

    await waitFor(() => expect(toastError).toHaveBeenCalled());
    expect(toastError).toHaveBeenCalledWith("Email já avaliou esse produto");
    expect(toastSuccess).not.toHaveBeenCalled();
  });

  it("GET inicial falha: cai em lista vazia (não trava UI)", async () => {
    vi.mocked(globalThis.fetch).mockRejectedValueOnce(new Error("Net"));

    render(<ProductReviews productId="11111111-1111-1111-1111-111111111111" />);
    await waitFor(() =>
      expect(screen.getByText(/ainda não há avaliações/i)).toBeInTheDocument(),
    );
  });
});
