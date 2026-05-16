/**
 * Singleton do Prisma Client — padrão Next.js para evitar múltiplas instâncias em dev.
 * Ref: https://www.prisma.io/docs/guides/nextjs
 */

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL não definido no ambiente");
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    // Apenas erros — sem `query` (evita poluir console e expor SQL).
    // Em dev, o Next.js encaminha logs do servidor para o browser console.
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
