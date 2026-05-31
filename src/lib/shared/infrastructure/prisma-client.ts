/**
 * Singleton do Prisma Client — padrão Next.js para evitar múltiplas instâncias em dev.
 * Ref: https://www.prisma.io/docs/guides/nextjs
 */

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { Pool, type PoolConfig } from "pg";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL não definido no ambiente");
}

/**
 * Converte o sslmode da querystring em config `ssl` explícita do `pg`.
 *
 * O `pg-connection-string` emite um warning de depreciação quando vê
 * `sslmode=prefer|require|verify-ca` na URL (na v3 esses modos passam a
 * seguir a semântica do libpq, mais fraca). Hoje eles são tratados como
 * `verify-full`; replicamos esse comportamento aqui passando `ssl`
 * diretamente ao Pool e removendo o `sslmode` da string, eliminando o
 * warning sem mudar a segurança da conexão.
 */
function poolConfigFromUrl(rawUrl: string): PoolConfig {
  try {
    const url = new URL(rawUrl);
    const sslmode = url.searchParams.get("sslmode");
    if (!sslmode) return { connectionString: rawUrl };

    url.searchParams.delete("sslmode");

    if (sslmode === "disable") {
      return { connectionString: url.toString(), ssl: false };
    }
    // prefer/require/verify-ca/verify-full → valida cadeia + hostname (verify-full).
    return {
      connectionString: url.toString(),
      ssl: { rejectUnauthorized: true },
    };
  } catch {
    return { connectionString: rawUrl };
  }
}

const pool = new Pool(poolConfigFromUrl(connectionString));
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
