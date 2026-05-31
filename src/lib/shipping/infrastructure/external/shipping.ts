/**
 * Lib de Cálculo de Frete — Belessence
 * ─────────────────────────────────────────────────────────────────────
 * Integra com ViaCEP (https://viacep.com.br) para autopreenchimento
 * de endereço e calcula custo de frete por região do Brasil.
 *
 * Server-side (pode ser chamado de route handlers e server components).
 *
 * Política de frete:
 *  - Frete grátis se subtotal >= R$ 199
 *  - Sudeste (SP/RJ/MG/ES):       R$ 14,90
 *  - Sul (PR/SC/RS):              R$ 19,90
 *  - Centro-Oeste (GO/DF/MT/MS):  R$ 24,90
 *  - Nordeste (BA/PE/CE/...):     R$ 29,90
 *  - Norte (AM/PA/...):           R$ 34,90
 */

const FREE_SHIPPING_THRESHOLD = 199;

const SHIPPING_TABLE: Record<string, number> = {
  // Sudeste
  SP: 14.9,
  RJ: 14.9,
  MG: 14.9,
  ES: 14.9,
  // Sul
  PR: 19.9,
  SC: 19.9,
  RS: 19.9,
  // Centro-Oeste
  GO: 24.9,
  DF: 24.9,
  MT: 24.9,
  MS: 24.9,
  // Nordeste
  BA: 29.9,
  PE: 29.9,
  CE: 29.9,
  MA: 29.9,
  RN: 29.9,
  PB: 29.9,
  AL: 29.9,
  SE: 29.9,
  PI: 29.9,
  // Norte
  AM: 34.9,
  PA: 34.9,
  AC: 34.9,
  RR: 34.9,
  RO: 34.9,
  AP: 34.9,
  TO: 34.9,
};

const DEFAULT_SHIPPING = 24.9; // fallback caso UF desconhecida

export interface CepLookupResult {
  cep: string;
  street: string;
  neighborhood: string;
  city: string;
  state: string;
  shippingCost: number;
  isFreeShippingEligible: boolean; // true se aplicar frete grátis pela política
}

interface ViaCepResponse {
  cep?: string;
  logradouro?: string;
  bairro?: string;
  localidade?: string;
  uf?: string;
  erro?: boolean | "true";
}

/** Calcula custo do frete baseado na UF e subtotal */
export function calculateShippingCost(uf: string, subtotal: number): number {
  if (subtotal >= FREE_SHIPPING_THRESHOLD) return 0;
  const ufUpper = uf.toUpperCase();
  return SHIPPING_TABLE[ufUpper] ?? DEFAULT_SHIPPING;
}

/**
 * Busca CEP no ViaCEP e calcula frete.
 * Aceita CEP com ou sem hífen.
 */
export async function getShippingFromCEP(
  rawCep: string,
  subtotal: number = 0,
): Promise<CepLookupResult> {
  const cep = rawCep.replace(/\D/g, "");

  if (cep.length !== 8) {
    throw new Error("CEP inválido (deve ter 8 dígitos)");
  }

  // ViaCEP é público e gratuito
  const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`, {
    next: { revalidate: 60 * 60 * 24 }, // cache 24h
  });

  if (!response.ok) {
    throw new Error(`Erro ao consultar ViaCEP: ${response.status}`);
  }

  const data: ViaCepResponse = await response.json();

  if (data.erro) {
    throw new Error("CEP não encontrado");
  }

  const state = (data.uf ?? "").toUpperCase();
  const shippingCost = calculateShippingCost(state, subtotal);

  return {
    cep: data.cep ?? cep,
    street: data.logradouro ?? "",
    neighborhood: data.bairro ?? "",
    city: data.localidade ?? "",
    state,
    shippingCost,
    isFreeShippingEligible: subtotal >= FREE_SHIPPING_THRESHOLD,
  };
}

/** Retorna apenas o custo do frete sem buscar endereço (já tem a UF) */
export function getShippingCostByState(state: string, subtotal: number): number {
  return calculateShippingCost(state, subtotal);
}

export { FREE_SHIPPING_THRESHOLD };
