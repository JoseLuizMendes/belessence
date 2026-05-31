/**
 * Testes — calculateShippingCost + getShippingFromCEP (src/lib/shipping.ts)
 */

import { describe, it, expect, vi, afterEach } from "vitest";
import {
  calculateShippingCost,
  getShippingCostByState,
  getShippingFromCEP,
  FREE_SHIPPING_THRESHOLD,
} from "@/lib/shipping/infrastructure/external/shipping";

describe("calculateShippingCost — política por UF", () => {
  it("frete grátis quando subtotal >= FREE_SHIPPING_THRESHOLD", () => {
    expect(calculateShippingCost("SP", FREE_SHIPPING_THRESHOLD)).toBe(0);
    expect(calculateShippingCost("AM", FREE_SHIPPING_THRESHOLD + 1)).toBe(0);
  });

  it("Sudeste (SP/RJ/MG/ES) → R$ 14,90", () => {
    for (const uf of ["SP", "RJ", "MG", "ES"]) {
      expect(calculateShippingCost(uf, 50)).toBe(14.9);
    }
  });

  it("Sul (PR/SC/RS) → R$ 19,90", () => {
    for (const uf of ["PR", "SC", "RS"]) {
      expect(calculateShippingCost(uf, 50)).toBe(19.9);
    }
  });

  it("Centro-Oeste (GO/DF/MT/MS) → R$ 24,90", () => {
    for (const uf of ["GO", "DF", "MT", "MS"]) {
      expect(calculateShippingCost(uf, 50)).toBe(24.9);
    }
  });

  it("Nordeste (BA/PE/CE/...) → R$ 29,90", () => {
    for (const uf of ["BA", "PE", "CE", "MA", "RN", "PB", "AL", "SE", "PI"]) {
      expect(calculateShippingCost(uf, 50)).toBe(29.9);
    }
  });

  it("Norte (AM/PA/...) → R$ 34,90", () => {
    for (const uf of ["AM", "PA", "AC", "RR", "RO", "AP", "TO"]) {
      expect(calculateShippingCost(uf, 50)).toBe(34.9);
    }
  });

  it("UF desconhecida cai no DEFAULT (R$ 24,90)", () => {
    expect(calculateShippingCost("XX", 50)).toBe(24.9);
    expect(calculateShippingCost("", 50)).toBe(24.9);
  });

  it("normaliza UF em lowercase", () => {
    expect(calculateShippingCost("sp", 50)).toBe(14.9);
    expect(calculateShippingCost("rs", 50)).toBe(19.9);
  });
});

describe("getShippingCostByState — wrapper", () => {
  it("delega para calculateShippingCost", () => {
    expect(getShippingCostByState("SP", 50)).toBe(14.9);
    expect(getShippingCostByState("SP", FREE_SHIPPING_THRESHOLD)).toBe(0);
  });
});

describe("getShippingFromCEP — integração ViaCEP", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("rejeita CEP com menos de 8 dígitos", async () => {
    await expect(getShippingFromCEP("1234567", 0)).rejects.toThrow(
      /CEP inválido/,
    );
  });

  it("lança erro quando ViaCEP responde 500", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response("erro", { status: 500 }),
    );
    await expect(getShippingFromCEP("01310100", 0)).rejects.toThrow(
      /Erro ao consultar ViaCEP: 500/,
    );
  });

  it("lança erro quando ViaCEP retorna { erro: true }", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      Response.json({ erro: true }),
    );
    await expect(getShippingFromCEP("00000000", 0)).rejects.toThrow(
      /CEP não encontrado/,
    );
  });

  it("retorna endereço + custo de frete no caminho feliz", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      Response.json({
        cep: "01310-100",
        logradouro: "Avenida Paulista",
        bairro: "Bela Vista",
        localidade: "São Paulo",
        uf: "SP",
      }),
    );
    const r = await getShippingFromCEP("01310100", 50);
    expect(r.state).toBe("SP");
    expect(r.shippingCost).toBe(14.9);
    expect(r.city).toBe("São Paulo");
    expect(r.isFreeShippingEligible).toBe(false);
  });

  it("marca isFreeShippingEligible quando subtotal cruza o threshold", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      Response.json({
        cep: "01310-100",
        logradouro: "Avenida Paulista",
        bairro: "Bela Vista",
        localidade: "São Paulo",
        uf: "SP",
      }),
    );
    const r = await getShippingFromCEP("01310100", FREE_SHIPPING_THRESHOLD);
    expect(r.shippingCost).toBe(0);
    expect(r.isFreeShippingEligible).toBe(true);
  });

  it("aceita CEP com hífen", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      Response.json({
        cep: "01310-100",
        uf: "SP",
        logradouro: "",
        bairro: "",
        localidade: "",
      }),
    );
    const r = await getShippingFromCEP("01310-100", 50);
    expect(r.state).toBe("SP");
    expect(globalThis.fetch).toHaveBeenCalledWith(
      "https://viacep.com.br/ws/01310100/json/",
      expect.any(Object),
    );
  });
});
