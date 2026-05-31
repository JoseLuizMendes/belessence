import "server-only";

/**
 * Caminho A do login admin: senha (bcrypt) + TOTP (otplib) + lockout (Prisma).
 * Node-only — NÃO importar no middleware (Edge). O middleware só usa
 * `verifyAdminSession` de `admin-auth.ts`.
 */

import bcrypt from "bcryptjs";
import { verifySync } from "otplib";
import { prisma } from "@/lib/shared/infrastructure/prisma-client";

const MAX_ATTEMPTS = 5;
const LOCK_MINUTES = 15;

// Tolera ±30s de diferença de relógio entre o servidor e o app autenticador.
const TOTP_EPOCH_TOLERANCE_SECONDS = 30;

/** Compara a senha com o hash bcrypt em `ADMIN_PASSWORD_HASH`. */
export async function verifyAdminPassword(password: string): Promise<boolean> {
  const hash = process.env.ADMIN_PASSWORD_HASH;
  if (!hash) return false;
  try {
    return await bcrypt.compare(password, hash);
  } catch {
    return false;
  }
}

/** Indica se o 2FA TOTP já foi configurado (`ADMIN_TOTP_SECRET`). */
export function isTotpConfigured(): boolean {
  return !!process.env.ADMIN_TOTP_SECRET;
}

/**
 * Verifica o código TOTP. Se o 2FA ainda não foi configurado, retorna `true`
 * (permite o primeiro acesso antes do setup do autenticador).
 */
export function verifyAdminTotp(code: string): boolean {
  const secret = process.env.ADMIN_TOTP_SECRET;
  if (!secret) return true;
  try {
    const result = verifySync({
      secret,
      token: code.replace(/\s/g, ""),
      epochTolerance: TOTP_EPOCH_TOLERANCE_SECONDS,
    });
    return result.valid;
  } catch {
    return false;
  }
}

export interface RateLimitState {
  locked: boolean;
  lockedUntil: Date | null;
}

/** Checa se a chave (IP) está bloqueada no momento. */
export async function checkLoginRateLimit(key: string): Promise<RateLimitState> {
  const row = await prisma.adminLoginAttempt.findUnique({ where: { key } });
  if (row?.lockedUntil && row.lockedUntil > new Date()) {
    return { locked: true, lockedUntil: row.lockedUntil };
  }
  return { locked: false, lockedUntil: null };
}

/** Registra uma falha; ao atingir o limite, bloqueia por LOCK_MINUTES. */
export async function recordLoginFailure(key: string): Promise<void> {
  const now = new Date();
  const row = await prisma.adminLoginAttempt.findUnique({ where: { key } });

  let attempts: number;
  if (!row) attempts = 1;
  else if (row.lockedUntil && row.lockedUntil <= now)
    attempts = 1; // bloqueio anterior expirou — recomeça a contagem
  else attempts = row.attempts + 1;

  const lockedUntil =
    attempts >= MAX_ATTEMPTS
      ? new Date(now.getTime() + LOCK_MINUTES * 60 * 1000)
      : null;

  await prisma.adminLoginAttempt.upsert({
    where: { key },
    update: { attempts, lockedUntil },
    create: { key, attempts, lockedUntil },
  });
}

/** Zera as tentativas da chave (após sucesso, ou via script de unlock). */
export async function clearLoginAttempts(key: string): Promise<void> {
  await prisma.adminLoginAttempt.deleteMany({ where: { key } });
}
