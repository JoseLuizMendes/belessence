/**
 * Testes — Newsletter
 * Foco: validação, 3 caminhos de resposta (ok/alreadySubscribed/erro).
 * GSAP/Lenis já mockados em src/test/setup.ts; precisamos mockar
 * gsap/ScrollTrigger por causa do `gsap.registerPlugin`.
 */

import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const { toastSuccess, toastError, toastInfo } = vi.hoisted(() => ({
  toastSuccess: vi.fn(),
  toastError: vi.fn(),
  toastInfo: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: { success: toastSuccess, error: toastError, info: toastInfo },
}));

// gsap/ScrollTrigger não está coberto pelo mock global de "gsap" — precisamos
// stubá-lo aqui para o `gsap.registerPlugin(ScrollTrigger)` no topo do módulo.
vi.mock("gsap/ScrollTrigger", () => ({
  ScrollTrigger: { create: vi.fn(), update: vi.fn() },
}));

// next/image em jsdom pode reclamar de formatos de URL; trocamos por <img>.
vi.mock("next/image", () => ({
  default: (props: Record<string, unknown>) => {
    // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
    return <img {...(props as object)} />;
  },
}));

import Newsletter from "@/components/newsletter";

type User = ReturnType<typeof userEvent.setup>;

function submit(user: User) {
  return user.click(screen.getByRole("button", { name: /inscrever/i }));
}

async function fillEmail(user: User, value: string) {
  await user.type(screen.getByLabelText(/e-mail para newsletter/i), value);
}

describe("Newsletter", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(globalThis, "fetch");
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renderiza CTA + input de email + botão Inscrever", () => {
    render(<Newsletter />);
    expect(
      screen.getByLabelText(/e-mail para newsletter/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /inscrever/i }),
    ).toBeInTheDocument();
  });

  it("rejeita email vazio sem chamar a API", async () => {
    const user = userEvent.setup();
    render(<Newsletter />);
    await submit(user);
    await waitFor(() => {
      expect(screen.getByText(/e-mail obrigatório/i)).toBeInTheDocument();
    });
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it("rejeita email malformado", async () => {
    const user = userEvent.setup();
    render(<Newsletter />);
    await fillEmail(user, "naoeumemail");
    await submit(user);
    await waitFor(() => {
      expect(screen.getByText(/informe um e-mail válido/i)).toBeInTheDocument();
    });
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it("caminho feliz: inscrição nova → toast success", async () => {
    const user = userEvent.setup();
    vi.mocked(globalThis.fetch).mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          success: true,
          alreadySubscribed: false,
          message: "Inscrição confirmada!",
        }),
        { status: 200 },
      ),
    );
    render(<Newsletter />);
    await fillEmail(user, "lead@example.com");
    await submit(user);

    await waitFor(() => expect(toastSuccess).toHaveBeenCalled());
    expect(globalThis.fetch).toHaveBeenCalledWith(
      "/api/newsletter",
      expect.objectContaining({ method: "POST" }),
    );
    expect(toastInfo).not.toHaveBeenCalled();
  });

  it("já inscrito: toast info (não success)", async () => {
    const user = userEvent.setup();
    vi.mocked(globalThis.fetch).mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          success: true,
          alreadySubscribed: true,
          message: "Você já está inscrita!",
        }),
        { status: 200 },
      ),
    );
    render(<Newsletter />);
    await fillEmail(user, "lead@example.com");
    await submit(user);

    await waitFor(() => expect(toastInfo).toHaveBeenCalled());
    expect(toastInfo).toHaveBeenCalledWith("Você já está inscrita!");
    expect(toastSuccess).not.toHaveBeenCalled();
  });

  it("erro da API: toast error com mensagem do servidor", async () => {
    const user = userEvent.setup();
    vi.mocked(globalThis.fetch).mockResolvedValueOnce(
      new Response(JSON.stringify({ error: "Email inválido" }), {
        status: 400,
      }),
    );
    render(<Newsletter />);
    await fillEmail(user, "lead@example.com");
    await submit(user);

    await waitFor(() => expect(toastError).toHaveBeenCalled());
    expect(toastError).toHaveBeenCalledWith("Email inválido");
  });

  it("fetch lança: toast error genérico", async () => {
    const user = userEvent.setup();
    vi.mocked(globalThis.fetch).mockRejectedValueOnce(new Error("Network"));
    render(<Newsletter />);
    await fillEmail(user, "lead@example.com");
    await submit(user);

    await waitFor(() => expect(toastError).toHaveBeenCalled());
    expect(toastError).toHaveBeenCalledWith(
      "Erro ao inscrever",
      expect.objectContaining({
        description: expect.stringMatching(/tente novamente/i),
      }),
    );
  });
});
