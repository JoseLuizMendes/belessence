"use server";

/**
 * Server Actions de autenticação. `registerUser` cria uma conta de
 * credenciais (email + senha) com hash bcrypt. Importável tanto pela
 * página /cadastro quanto pelo AuthDialog client.
 */

import bcrypt from "bcryptjs";
import { prisma } from "@/lib/shared/infrastructure/prisma-client";
import { registerSchema } from "@/lib/shared/domain/zod-schemas";

export type RegisterResult = { ok: true } | { ok: false; error: string };

export async function registerUser(input: unknown): Promise<RegisterResult> {
  const parsed = registerSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Dados inválidos",
    };
  }

  const { name, email, password } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { ok: false, error: "Já existe uma conta com este email" };
  }

  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.user.create({ data: { name, email, passwordHash } });

  return { ok: true };
}
