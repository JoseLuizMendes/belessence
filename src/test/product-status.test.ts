/**
 * Testes — src/lib/product-status.ts
 * Funções puras: sem mocks. Datas explícitas para determinismo.
 */

import { describe, it, expect } from "vitest";
import {
  applyStatusTransition,
  getEffectivePromotion,
  isEffectivelyNew,
  isPromotionStale,
  StatusTransitionError,
  type StatusTransitionInput,
} from "@/lib/products/domain/product-status";

const baseInput: StatusTransitionInput = {
  currentStatus: "NORMAL",
  currentPrice: 200,
  currentOriginalPrice: null,
  nextStatus: "NORMAL",
  promoPrice: null,
  promotionStartsAt: null,
  promotionEndsAt: null,
  formPrice: 200,
  formOriginalPrice: null,
};

describe("applyStatusTransition — NORMAL → PROMOTION", () => {
  it("rejeita sem promoPrice", () => {
    expect(() =>
      applyStatusTransition({
        ...baseInput,
        nextStatus: "PROMOTION",
        promoPrice: null,
        promotionEndsAt: new Date("2099-01-01"),
      }),
    ).toThrow(StatusTransitionError);
  });

  it("rejeita promoPrice <= 0", () => {
    expect(() =>
      applyStatusTransition({
        ...baseInput,
        nextStatus: "PROMOTION",
        promoPrice: 0,
        promotionEndsAt: new Date("2099-01-01"),
      }),
    ).toThrow(/Preço promocional obrigatório/);
  });

  it("rejeita promoPrice >= formPrice", () => {
    expect(() =>
      applyStatusTransition({
        ...baseInput,
        nextStatus: "PROMOTION",
        promoPrice: 200,
        formPrice: 200,
        promotionEndsAt: new Date("2099-01-01"),
      }),
    ).toThrow(/menor que o preço atual/);
  });

  it("rejeita sem promotionEndsAt", () => {
    expect(() =>
      applyStatusTransition({
        ...baseInput,
        nextStatus: "PROMOTION",
        promoPrice: 150,
        promotionEndsAt: null,
      }),
    ).toThrow(/Data de término/);
  });

  it("rejeita endsAt <= startsAt", () => {
    expect(() =>
      applyStatusTransition({
        ...baseInput,
        nextStatus: "PROMOTION",
        promoPrice: 150,
        promotionStartsAt: new Date("2099-12-01"),
        promotionEndsAt: new Date("2099-11-01"),
      }),
    ).toThrow(/Término precisa ser depois/);
  });

  it("transição válida salva originalPrice = formPrice", () => {
    const endsAt = new Date("2099-12-01");
    const r = applyStatusTransition({
      ...baseInput,
      nextStatus: "PROMOTION",
      promoPrice: 150,
      formPrice: 200,
      promotionEndsAt: endsAt,
    });
    expect(r.status).toBe("PROMOTION");
    expect(r.price).toBe(150);
    expect(r.originalPrice).toBe(200);
    expect(r.promotionEndsAt).toEqual(endsAt);
    expect(r.promotionStartsAt).toBeInstanceOf(Date);
  });
});

describe("applyStatusTransition — PROMOTION → outros", () => {
  it("PROMOTION → NORMAL restaura price = currentOriginalPrice", () => {
    const r = applyStatusTransition({
      ...baseInput,
      currentStatus: "PROMOTION",
      currentPrice: 150,
      currentOriginalPrice: 200,
      nextStatus: "NORMAL",
      formPrice: 150,
    });
    expect(r.status).toBe("NORMAL");
    expect(r.price).toBe(200);
    expect(r.originalPrice).toBeNull();
    expect(r.promotionStartsAt).toBeNull();
    expect(r.promotionEndsAt).toBeNull();
  });

  it("PROMOTION → NORMAL sem originalPrice usa formPrice", () => {
    const r = applyStatusTransition({
      ...baseInput,
      currentStatus: "PROMOTION",
      currentOriginalPrice: null,
      nextStatus: "NORMAL",
      formPrice: 180,
    });
    expect(r.price).toBe(180);
  });
});

describe("applyStatusTransition — edição de PROMOTION", () => {
  it("rejeita promoPrice >= originalPrice na edição", () => {
    expect(() =>
      applyStatusTransition({
        ...baseInput,
        currentStatus: "PROMOTION",
        currentPrice: 150,
        currentOriginalPrice: 200,
        nextStatus: "PROMOTION",
        promoPrice: 250,
        formOriginalPrice: 200,
        formPrice: 150,
      }),
    ).toThrow(/menor que o preço original/);
  });

  it("edição válida atualiza valores", () => {
    const endsAt = new Date("2099-12-31");
    const r = applyStatusTransition({
      ...baseInput,
      currentStatus: "PROMOTION",
      currentPrice: 150,
      currentOriginalPrice: 200,
      nextStatus: "PROMOTION",
      promoPrice: 120,
      formOriginalPrice: 200,
      formPrice: 150,
      promotionEndsAt: endsAt,
    });
    expect(r.price).toBe(120);
    expect(r.originalPrice).toBe(200);
    expect(r.promotionEndsAt).toEqual(endsAt);
  });
});

describe("applyStatusTransition — outras transições", () => {
  it("NORMAL → COMING_SOON mantém preços do form e limpa datas", () => {
    const r = applyStatusTransition({
      ...baseInput,
      nextStatus: "COMING_SOON",
      formPrice: 250,
      formOriginalPrice: null,
    });
    expect(r.status).toBe("COMING_SOON");
    expect(r.price).toBe(250);
    expect(r.originalPrice).toBeNull();
    expect(r.promotionStartsAt).toBeNull();
    expect(r.promotionEndsAt).toBeNull();
  });

  it("NORMAL → DISCONTINUED preserva form prices", () => {
    const r = applyStatusTransition({
      ...baseInput,
      nextStatus: "DISCONTINUED",
      formPrice: 199.9,
    });
    expect(r.status).toBe("DISCONTINUED");
    expect(r.price).toBe(199.9);
  });
});

// ─── getEffectivePromotion ───────────────────────────────────────────────────

describe("getEffectivePromotion", () => {
  const now = new Date("2026-05-19T12:00:00Z");

  it("retorna null quando status != PROMOTION", () => {
    expect(
      getEffectivePromotion(
        {
          status: "NORMAL",
          originalPrice: 200,
          promotionStartsAt: null,
          promotionEndsAt: null,
        },
        now,
      ),
    ).toBeNull();
  });

  it("retorna null quando startsAt está no futuro", () => {
    expect(
      getEffectivePromotion(
        {
          status: "PROMOTION",
          originalPrice: 200,
          promotionStartsAt: new Date("2026-06-01"),
          promotionEndsAt: new Date("2026-07-01"),
        },
        now,
      ),
    ).toBeNull();
  });

  it("retorna null quando endsAt já passou", () => {
    expect(
      getEffectivePromotion(
        {
          status: "PROMOTION",
          originalPrice: 200,
          promotionStartsAt: new Date("2026-01-01"),
          promotionEndsAt: new Date("2026-04-01"),
        },
        now,
      ),
    ).toBeNull();
  });

  it("retorna {originalPrice, endsAt} dentro da janela", () => {
    const endsAt = new Date("2026-12-01");
    const r = getEffectivePromotion(
      {
        status: "PROMOTION",
        originalPrice: 200,
        promotionStartsAt: new Date("2026-01-01"),
        promotionEndsAt: endsAt,
      },
      now,
    );
    expect(r).toEqual({ originalPrice: 200, endsAt });
  });
});

// ─── isEffectivelyNew ────────────────────────────────────────────────────────

describe("isEffectivelyNew", () => {
  const now = new Date("2026-05-19T12:00:00Z");

  it("markedAsNewUntil no futuro → true (override manda)", () => {
    expect(
      isEffectivelyNew(
        {
          createdAt: new Date("2020-01-01"),
          markedAsNewUntil: new Date("2099-12-31"),
        },
        now,
      ),
    ).toBe(true);
  });

  it("markedAsNewUntil no passado → false (override manda)", () => {
    expect(
      isEffectivelyNew(
        {
          createdAt: now,
          markedAsNewUntil: new Date("2020-01-01"),
        },
        now,
      ),
    ).toBe(false);
  });

  it("sem override, createdAt há 15 dias → true", () => {
    const createdAt = new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000);
    expect(isEffectivelyNew({ createdAt, markedAsNewUntil: null }, now)).toBe(
      true,
    );
  });

  it("sem override, createdAt há 60 dias → false", () => {
    const createdAt = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
    expect(isEffectivelyNew({ createdAt, markedAsNewUntil: null }, now)).toBe(
      false,
    );
  });
});

// ─── isPromotionStale ────────────────────────────────────────────────────────

describe("isPromotionStale", () => {
  const now = new Date("2026-05-19T12:00:00Z");

  it("status PROMOTION + endsAt passado → true", () => {
    expect(
      isPromotionStale(
        { status: "PROMOTION", promotionEndsAt: new Date("2026-01-01") },
        now,
      ),
    ).toBe(true);
  });

  it("status PROMOTION sem endsAt → false", () => {
    expect(
      isPromotionStale({ status: "PROMOTION", promotionEndsAt: null }, now),
    ).toBe(false);
  });

  it("status NORMAL → false", () => {
    expect(
      isPromotionStale(
        { status: "NORMAL", promotionEndsAt: new Date("2020-01-01") },
        now,
      ),
    ).toBe(false);
  });
});
