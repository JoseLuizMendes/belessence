import { describe, it, expect } from "vitest";
import { canTransition, type OrderStatus } from "@/lib/orders/domain/order-types";

describe("canTransition (máquina de estado de Order)", () => {
  it("permite PENDING → PAYMENT_CONFIRMED", () => {
    expect(canTransition("PENDING", "PAYMENT_CONFIRMED")).toBe(true);
  });

  it("permite PAYMENT_CONFIRMED → PREPARING", () => {
    expect(canTransition("PAYMENT_CONFIRMED", "PREPARING")).toBe(true);
  });

  it("permite PREPARING → SHIPPED", () => {
    expect(canTransition("PREPARING", "SHIPPED")).toBe(true);
  });

  it("permite SHIPPED → DELIVERED", () => {
    expect(canTransition("SHIPPED", "DELIVERED")).toBe(true);
  });

  it("permite PENDING → CANCELLED", () => {
    expect(canTransition("PENDING", "CANCELLED")).toBe(true);
  });

  it("permite PAYMENT_CONFIRMED → CANCELLED", () => {
    expect(canTransition("PAYMENT_CONFIRMED", "CANCELLED")).toBe(true);
  });

  it("permite PREPARING → CANCELLED", () => {
    expect(canTransition("PREPARING", "CANCELLED")).toBe(true);
  });

  it("bloqueia SHIPPED → CANCELLED (já saiu da casa)", () => {
    expect(canTransition("SHIPPED", "CANCELLED")).toBe(false);
  });

  it("bloqueia DELIVERED → qualquer", () => {
    const targets: OrderStatus[] = [
      "PENDING",
      "PAYMENT_CONFIRMED",
      "PREPARING",
      "SHIPPED",
      "CANCELLED",
    ];
    for (const to of targets) {
      expect(canTransition("DELIVERED", to)).toBe(false);
    }
  });

  it("bloqueia CANCELLED → qualquer", () => {
    const targets: OrderStatus[] = [
      "PENDING",
      "PAYMENT_CONFIRMED",
      "PREPARING",
      "SHIPPED",
      "DELIVERED",
    ];
    for (const to of targets) {
      expect(canTransition("CANCELLED", to)).toBe(false);
    }
  });

  it("bloqueia pular etapas (PENDING → PREPARING direto)", () => {
    expect(canTransition("PENDING", "PREPARING")).toBe(false);
  });
});
