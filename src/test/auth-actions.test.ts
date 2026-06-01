/**
 * Testes — registerUser Server Action
 * Cobre validação Zod + checagem de email existente + criação com bcrypt.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";

vi.mock("bcryptjs", () => ({
  default: {
    hash: vi.fn().mockResolvedValue("hashed-pw"),
  },
}));

import { prisma } from "@/lib/shared/infrastructure/prisma-client";
import { registerUser } from "@/lib/auth/presentation/auth-actions";

const userFindUnique = prisma.user.findUnique as ReturnType<typeof vi.fn>;
const userCreate = prisma.user.create as ReturnType<typeof vi.fn>;

describe("registerUser", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("retorna erro Zod quando input inválido", async () => {
    const res = await registerUser({ name: "", email: "x", password: "1" });
    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.error).toBeTruthy();
    }
  });

  it("retorna erro 'Já existe' quando email duplicado", async () => {
    userFindUnique.mockResolvedValueOnce({ id: "u-1", email: "a@b.com" });
    const res = await registerUser({
      name: "Alice",
      email: "a@b.com",
      password: "senha-forte-123",
    });
    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.error).toMatch(/já existe/i);
    }
    expect(userCreate).not.toHaveBeenCalled();
  });

  it("cria conta com hash bcrypt quando input válido + email livre", async () => {
    userFindUnique.mockResolvedValueOnce(null);
    userCreate.mockResolvedValueOnce({ id: "u-new" });
    const res = await registerUser({
      name: "Bob",
      email: "b@b.com",
      password: "senha-forte-123",
    });
    expect(res.ok).toBe(true);
    expect(userCreate).toHaveBeenCalledWith({
      data: { name: "Bob", email: "b@b.com", passwordHash: "hashed-pw" },
    });
  });
});
