/**
 * Testes — GET /api/cep/[cep]
 * Mocka @/lib/shipping (getShippingFromCEP já tem teste próprio).
 * Foco: contrato HTTP + parsing de ?subtotal + status mapping por mensagem.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/shipping", () => ({
  getShippingFromCEP: vi.fn(),
}));

import { GET } from "@/app/api/cep/[cep]/route";
import { getShippingFromCEP } from "@/lib/shipping";

function makeReq(url: string): NextRequest {
  return new NextRequest(url);
}

function callGet(cep: string, url = "http://localhost/api/cep/" + cep) {
  return GET(makeReq(url), { params: Promise.resolve({ cep }) });
}

const happyResult = {
  cep: "01310-100",
  street: "Avenida Paulista",
  neighborhood: "Bela Vista",
  city: "São Paulo",
  state: "SP",
  shippingCost: 14.9,
  isFreeShippingEligible: false,
};

describe("GET /api/cep/[cep]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("retorna 200 + payload do shipping no caminho feliz", async () => {
    vi.mocked(getShippingFromCEP).mockResolvedValueOnce(happyResult);
    const res = await callGet("01310100");
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(happyResult);
    expect(getShippingFromCEP).toHaveBeenCalledWith("01310100", 0);
  });

  it("passa subtotal da query para o domínio", async () => {
    vi.mocked(getShippingFromCEP).mockResolvedValueOnce(happyResult);
    await callGet(
      "01310100",
      "http://localhost/api/cep/01310100?subtotal=199.90",
    );
    expect(getShippingFromCEP).toHaveBeenCalledWith("01310100", 199.9);
  });

  it("rejeita subtotal negativo com 400", async () => {
    const res = await callGet(
      "01310100",
      "http://localhost/api/cep/01310100?subtotal=-10",
    );
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "Subtotal inválido" });
    expect(getShippingFromCEP).not.toHaveBeenCalled();
  });

  it("rejeita subtotal não-numérico com 400", async () => {
    const res = await callGet(
      "01310100",
      "http://localhost/api/cep/01310100?subtotal=abc",
    );
    expect(res.status).toBe(400);
  });

  it("mapeia 'CEP inválido' para 400", async () => {
    vi.mocked(getShippingFromCEP).mockRejectedValueOnce(
      new Error("CEP inválido (deve ter 8 dígitos)"),
    );
    const res = await callGet("123");
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toMatch(/CEP inválido/);
  });

  it("mapeia 'não encontrado' para 404", async () => {
    vi.mocked(getShippingFromCEP).mockRejectedValueOnce(
      new Error("CEP não encontrado"),
    );
    const res = await callGet("00000000");
    expect(res.status).toBe(404);
  });

  it("mapeia erro desconhecido para 500", async () => {
    vi.mocked(getShippingFromCEP).mockRejectedValueOnce(
      new Error("ViaCEP timeout"),
    );
    const res = await callGet("01310100");
    expect(res.status).toBe(500);
  });
});
