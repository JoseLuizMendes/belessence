/**
 * Testes — schemas Zod (src/lib/validations.ts)
 * Schemas puros, sem mocks.
 */

import { describe, it, expect } from "vitest";
import {
  checkoutCustomerSchema,
  checkoutAddressSchema,
  checkoutSchema,
  reviewSchema,
  couponValidateSchema,
  orderStatusSchema,
} from "@/lib/shared/domain/zod-schemas";

const validCustomer = {
  name: "Maria Silva",
  email: "maria@example.com",
  phone: "(11) 98765-4321",
  // CPF válido conhecido (gerador público)
  cpf: "390.533.447-05",
};

const validAddress = {
  cep: "01310-100",
  street: "Avenida Paulista",
  number: "1000",
  neighborhood: "Bela Vista",
  city: "São Paulo",
  state: "SP",
};

describe("checkoutCustomerSchema", () => {
  it("aceita payload válido", () => {
    expect(checkoutCustomerSchema.safeParse(validCustomer).success).toBe(true);
  });

  it("rejeita nome com menos de 3 caracteres", () => {
    const r = checkoutCustomerSchema.safeParse({ ...validCustomer, name: "Jo" });
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(r.error.issues[0].message).toMatch(/pelo menos 3/);
    }
  });

  it("rejeita email malformado", () => {
    expect(
      checkoutCustomerSchema.safeParse({ ...validCustomer, email: "abc" })
        .success,
    ).toBe(false);
  });

  it("aceita telefone fixo (11) 9999-9999", () => {
    expect(
      checkoutCustomerSchema.safeParse({
        ...validCustomer,
        phone: "(11) 9999-9999",
      }).success,
    ).toBe(true);
  });

  it("rejeita telefone com letras", () => {
    expect(
      checkoutCustomerSchema.safeParse({ ...validCustomer, phone: "abcdefghij" })
        .success,
    ).toBe(false);
  });

  it("rejeita CPF com 11 dígitos repetidos", () => {
    const r = checkoutCustomerSchema.safeParse({
      ...validCustomer,
      cpf: "111.111.111-11",
    });
    expect(r.success).toBe(false);
  });

  it("rejeita CPF com dígitos verificadores incorretos", () => {
    const r = checkoutCustomerSchema.safeParse({
      ...validCustomer,
      cpf: "123.456.789-00",
    });
    expect(r.success).toBe(false);
  });
});

describe("checkoutAddressSchema", () => {
  it("aceita CEP com hífen", () => {
    expect(
      checkoutAddressSchema.safeParse({ ...validAddress, cep: "01310-100" })
        .success,
    ).toBe(true);
  });

  it("aceita CEP sem hífen", () => {
    expect(
      checkoutAddressSchema.safeParse({ ...validAddress, cep: "01310100" })
        .success,
    ).toBe(true);
  });

  it("rejeita CEP malformado", () => {
    expect(
      checkoutAddressSchema.safeParse({ ...validAddress, cep: "0131-0100" })
        .success,
    ).toBe(false);
  });

  it("rejeita UF com mais de 2 letras", () => {
    expect(
      checkoutAddressSchema.safeParse({ ...validAddress, state: "SAO" })
        .success,
    ).toBe(false);
  });

  it("aceita complement vazio (campo opcional)", () => {
    const r = checkoutAddressSchema.safeParse(validAddress);
    expect(r.success).toBe(true);
  });
});

describe("checkoutSchema (composto)", () => {
  it("aceita payload completo válido", () => {
    expect(
      checkoutSchema.safeParse({
        customer: validCustomer,
        address: validAddress,
        couponCode: "PROMO10",
      }).success,
    ).toBe(true);
  });

  it("aceita sem couponCode (opcional)", () => {
    expect(
      checkoutSchema.safeParse({
        customer: validCustomer,
        address: validAddress,
      }).success,
    ).toBe(true);
  });
});

describe("reviewSchema", () => {
  const validReview = {
    productId: "11111111-1111-1111-1111-111111111111",
    authorName: "Ana",
    authorEmail: "ana@example.com",
    rating: 5,
  };

  it("aceita review válido sem texto", () => {
    expect(reviewSchema.safeParse(validReview).success).toBe(true);
  });

  it("rejeita rating 0", () => {
    expect(
      reviewSchema.safeParse({ ...validReview, rating: 0 }).success,
    ).toBe(false);
  });

  it("rejeita rating 6", () => {
    expect(
      reviewSchema.safeParse({ ...validReview, rating: 6 }).success,
    ).toBe(false);
  });

  it("rejeita texto com mais de 250 caracteres", () => {
    expect(
      reviewSchema.safeParse({ ...validReview, text: "a".repeat(251) }).success,
    ).toBe(false);
  });

  it("rejeita productId que não é UUID", () => {
    expect(
      reviewSchema.safeParse({ ...validReview, productId: "abc" }).success,
    ).toBe(false);
  });
});

describe("couponValidateSchema", () => {
  it("normaliza code para uppercase", () => {
    const r = couponValidateSchema.safeParse({
      code: "promo10",
      orderSubtotal: 100,
    });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.code).toBe("PROMO10");
  });

  it("rejeita orderSubtotal 0", () => {
    expect(
      couponValidateSchema.safeParse({ code: "X", orderSubtotal: 0 }).success,
    ).toBe(false);
  });

  it("rejeita orderSubtotal negativo", () => {
    expect(
      couponValidateSchema.safeParse({ code: "X", orderSubtotal: -10 }).success,
    ).toBe(false);
  });

  it("rejeita code vazio", () => {
    expect(
      couponValidateSchema.safeParse({ code: "", orderSubtotal: 100 }).success,
    ).toBe(false);
  });
});

describe("orderStatusSchema", () => {
  it("aceita SHIPPED com trackingCode", () => {
    expect(
      orderStatusSchema.safeParse({
        status: "SHIPPED",
        trackingCode: "BR123456789",
      }).success,
    ).toBe(true);
  });

  it("rejeita SHIPPED sem trackingCode", () => {
    const r = orderStatusSchema.safeParse({ status: "SHIPPED" });
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(r.error.issues[0].path).toEqual(["trackingCode"]);
    }
  });

  it("aceita DELIVERED sem trackingCode", () => {
    expect(
      orderStatusSchema.safeParse({ status: "DELIVERED" }).success,
    ).toBe(true);
  });

  it("rejeita status fora do enum", () => {
    expect(
      orderStatusSchema.safeParse({ status: "UNKNOWN" }).success,
    ).toBe(false);
  });
});
