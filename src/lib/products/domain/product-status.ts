/**
 * Helpers de transição de status do produto.
 * ─────────────────────────────────────────────────────────────────────
 * Centraliza as regras de mutação para que `createProduct` /
 * `updateProduct` apliquem a semântica correta de preço/promoção sem
 * duplicar lógica.
 *
 * Convenção do preço durante PROMOTION:
 *   - `price`         = preço promocional (o que a usuária paga)
 *   - `originalPrice` = preço cheio anterior (usado para riscar)
 *
 * Quando volta para NORMAL, restauramos `price = originalPrice` e zeramos
 * `originalPrice` e as datas da promo.
 */

import type { ProductStatus } from "@prisma/client";

export interface StatusTransitionInput {
  /** Estado atual do produto (banco) — para detectar saída de PROMOTION. */
  currentStatus: ProductStatus;
  /** Preço cheio atual no banco. */
  currentPrice: number;
  /** OriginalPrice atual no banco (provavelmente null se NORMAL). */
  currentOriginalPrice: number | null;
  /** Estado-alvo enviado pelo form. */
  nextStatus: ProductStatus;
  /** Apenas relevante se nextStatus=PROMOTION. */
  promoPrice?: number | null;
  promotionStartsAt?: Date | null;
  promotionEndsAt?: Date | null;
  /** Preço que o admin digitou no form. Usado quando NÃO está mexendo na promo. */
  formPrice: number;
  /** OriginalPrice que o admin digitou no form (campo opcional). */
  formOriginalPrice: number | null;
}

export interface StatusTransitionResult {
  status: ProductStatus;
  price: number;
  originalPrice: number | null;
  promotionStartsAt: Date | null;
  promotionEndsAt: Date | null;
}

export class StatusTransitionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "StatusTransitionError";
  }
}

/**
 * Computa o payload a salvar no banco aplicando a transição correta.
 *
 * Casos:
 *   * NORMAL → PROMOTION  → exige promoPrice e promotionEndsAt; salva originalPrice = formPrice
 *   * PROMOTION → NORMAL  → restaura price = currentOriginalPrice (se houver)
 *   * PROMOTION → PROMOTION (edição) → permite ajustar promoPrice/janela
 *   * Demais transições (COMING_SOON, DISCONTINUED) → mantém preços do form
 */
export function applyStatusTransition(
  input: StatusTransitionInput,
): StatusTransitionResult {
  const { currentStatus, nextStatus } = input;

  const enteringPromo = nextStatus === "PROMOTION" && currentStatus !== "PROMOTION";
  const leavingPromo = currentStatus === "PROMOTION" && nextStatus !== "PROMOTION";
  const stayingInPromo = currentStatus === "PROMOTION" && nextStatus === "PROMOTION";

  if (enteringPromo) {
    if (
      input.promoPrice == null ||
      !Number.isFinite(input.promoPrice) ||
      input.promoPrice <= 0
    ) {
      throw new StatusTransitionError(
        "Preço promocional obrigatório ao entrar em PROMOTION",
      );
    }
    if (input.promoPrice >= input.formPrice) {
      throw new StatusTransitionError(
        "Preço promocional precisa ser menor que o preço atual",
      );
    }
    if (!input.promotionEndsAt) {
      throw new StatusTransitionError(
        "Data de término da promoção é obrigatória",
      );
    }
    if (
      input.promotionStartsAt &&
      input.promotionEndsAt <= input.promotionStartsAt
    ) {
      throw new StatusTransitionError(
        "Término precisa ser depois do início da promoção",
      );
    }

    return {
      status: "PROMOTION",
      price: input.promoPrice,
      originalPrice: input.formPrice,
      promotionStartsAt: input.promotionStartsAt ?? new Date(),
      promotionEndsAt: input.promotionEndsAt,
    };
  }

  if (stayingInPromo) {
    // Permitir ajustar valores sem refazer toda a lógica. Se o admin mudou
    // promoPrice e/ou as datas, refletir; caso contrário, manter o que veio do form.
    const newPromoPrice = input.promoPrice ?? input.formPrice;
    const newOriginal = input.formOriginalPrice ?? input.currentOriginalPrice;

    if (newOriginal != null && newPromoPrice >= newOriginal) {
      throw new StatusTransitionError(
        "Preço promocional precisa ser menor que o preço original",
      );
    }

    return {
      status: "PROMOTION",
      price: newPromoPrice,
      originalPrice: newOriginal,
      promotionStartsAt: input.promotionStartsAt ?? null,
      promotionEndsAt: input.promotionEndsAt ?? null,
    };
  }

  if (leavingPromo) {
    // Restaurar preço cheio (currentOriginalPrice tem o preço de antes da promo).
    const restoredPrice = input.currentOriginalPrice ?? input.formPrice;
    return {
      status: nextStatus,
      price: restoredPrice,
      originalPrice: null,
      promotionStartsAt: null,
      promotionEndsAt: null,
    };
  }

  // Demais transições (NORMAL ↔ COMING_SOON ↔ DISCONTINUED): mantém o que veio do form.
  return {
    status: nextStatus,
    price: input.formPrice,
    originalPrice: input.formOriginalPrice ?? null,
    promotionStartsAt: null,
    promotionEndsAt: null,
  };
}

// ─── HELPERS DE LEITURA ──────────────────────────────────────────────────────

export interface EffectivePromotion {
  /** Preço cheio mostrado riscado. */
  originalPrice: number;
  /** Quando a promo termina. */
  endsAt: Date | null;
}

/**
 * Retorna o estado efetivo da promoção considerando a janela e a hora atual.
 * Retorna null se: não está em PROMOTION, ainda não começou, ou já expirou.
 *
 * O banco pode ainda dizer status=PROMOTION mesmo após a janela; a UI deve
 * usar `getEffectivePromotion` em vez de checar `status` diretamente.
 */
export function getEffectivePromotion(p: {
  status: ProductStatus;
  originalPrice: number | null;
  promotionStartsAt: Date | null;
  promotionEndsAt: Date | null;
}, now: Date = new Date()): EffectivePromotion | null {
  if (p.status !== "PROMOTION") return null;
  if (p.originalPrice == null) return null;
  if (p.promotionStartsAt && p.promotionStartsAt > now) return null;
  if (p.promotionEndsAt && p.promotionEndsAt < now) return null;
  return {
    originalPrice: p.originalPrice,
    endsAt: p.promotionEndsAt,
  };
}

/** Janela do "Novo" automático: 30 dias após criação. */
const NEW_AUTO_DAYS = 30;

/**
 * Decide se o badge "Lançamento" deve aparecer.
 * - Se `markedAsNewUntil` está preenchido, ele manda (override manual).
 * - Senão, deriva de `createdAt` (NEW_AUTO_DAYS).
 */
export function isEffectivelyNew(p: {
  createdAt: Date;
  markedAsNewUntil: Date | null;
}, now: Date = new Date()): boolean {
  if (p.markedAsNewUntil) return p.markedAsNewUntil > now;
  const ageDays = (now.getTime() - p.createdAt.getTime()) / (1000 * 60 * 60 * 24);
  return ageDays <= NEW_AUTO_DAYS;
}

/**
 * Promo expirada que o banco ainda não limpou (status=PROMOTION mas janela passou).
 * Sinalizado na UI do admin com aviso "⚠ promo expirou — revisar".
 */
export function isPromotionStale(p: {
  status: ProductStatus;
  promotionEndsAt: Date | null;
}, now: Date = new Date()): boolean {
  return (
    p.status === "PROMOTION" &&
    p.promotionEndsAt != null &&
    p.promotionEndsAt < now
  );
}
