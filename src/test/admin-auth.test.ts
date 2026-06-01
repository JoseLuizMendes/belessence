/**
 * Testes — admin-auth (jose JWT)
 * Cobre: verificação de token + edge cases (token vazio, malformado).
 *
 * NOTA: testes que envolvem SignJWT no jose 6.x via Vitest+jsdom têm um
 * problema conhecido com TextEncoder/Uint8Array (FlattenedSign).
 * Cobertura completa de assinatura fica via E2E real (admin login flow).
 * Aqui focamos em verifyAdminSession (mais simples + Edge-safe).
 */

import { describe, it, expect, beforeAll } from "vitest";
import {
  verifyAdminSession,
  adminCookieOptions,
  TOKEN_VERSION,
} from "@/lib/auth/presentation/admin-auth";

beforeAll(() => {
  process.env.ADMIN_SECRET ??= "test-secret-supercalifragilistic-32chars";
});

describe("admin-auth", () => {
  it("verifyAdminSession retorna false pra token vazio/null/undefined", async () => {
    expect(await verifyAdminSession(undefined)).toBe(false);
    expect(await verifyAdminSession(null)).toBe(false);
    expect(await verifyAdminSession("")).toBe(false);
  });

  it("verifyAdminSession rejeita garbage e tokens malformados", async () => {
    expect(await verifyAdminSession("not-a-jwt")).toBe(false);
    expect(
      await verifyAdminSession("eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJoYWNrIn0.x"),
    ).toBe(false);
    expect(await verifyAdminSession("a.b.c")).toBe(false);
  });

  it("adminCookieOptions retorna httpOnly + sameSite=lax + path=/", () => {
    const opts = adminCookieOptions();
    expect(opts.httpOnly).toBe(true);
    expect(opts.sameSite).toBe("lax");
    expect(opts.path).toBe("/");
    expect(opts.maxAge).toBeGreaterThan(0);
  });

  it("TOKEN_VERSION é número positivo (controla invalidation em massa)", () => {
    expect(typeof TOKEN_VERSION).toBe("number");
    expect(TOKEN_VERSION).toBeGreaterThan(0);
  });

  it("adminCookieOptions secure depende de NODE_ENV", () => {
    // Em test, NODE_ENV !== "production" → secure: false
    const opts = adminCookieOptions();
    expect(opts.secure).toBe(process.env.NODE_ENV === "production");
  });
});
