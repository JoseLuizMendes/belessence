/**
 * Destrava o login admin (zera o rate limit / lockout).
 * Garantia de recuperação pelo suporte de TI.
 *
 * Uso:
 *   node scripts/admin-unlock.mjs           # zera TODAS as tentativas
 *   node scripts/admin-unlock.mjs <ip>      # zera só a chave (IP) informada
 */

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import "dotenv/config";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

const key = process.argv[2];

if (key) {
  await prisma.adminLoginAttempt.deleteMany({ where: { key } });
  console.log(`Tentativas zeradas para a chave: ${key}`);
} else {
  const result = await prisma.adminLoginAttempt.deleteMany({});
  console.log(`Todas as tentativas de login admin foram zeradas (${result.count}).`);
}

await prisma.$disconnect();
process.exit(0);
