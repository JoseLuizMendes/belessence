/**
 * Singleton do Prisma Client — padrão Next.js para evitar múltiplas instâncias em dev.
 * Ref: https://www.prisma.io/docs/guides/nextjs
 */

import { PrismaPg } from "@prisma/adapter-pg";
import * as PrismaClientModule from "@prisma/client";
import { Pool } from "pg";

type PrismaClientLike = any;

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClientLike };

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL não definido no ambiente");
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);

const PrismaClient = (PrismaClientModule as unknown as { PrismaClient?: new (options?: unknown) => PrismaClientLike })
  .PrismaClient;

if (!PrismaClient) {
  throw new Error("PrismaClient não disponível em @prisma/client. Execute 'prisma generate' no ambiente de build.");
}

export const prisma: PrismaClientLike =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log: ["query"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
