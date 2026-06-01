/**
 * Acesso ao Postgres de teste para asserções E2E (regra crítica em banco
 * real). Usa `pg` direto com DATABASE_URL — sem depender do alias `@/lib`.
 *
 * Identificadores camelCase precisam de aspas no SQL ("usedCount", etc.).
 */

import { Pool } from "pg";

let pool: Pool | null = null;

function getPool(): Pool {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error("DATABASE_URL não definido — necessário para E2E");
    }
    pool = new Pool({ connectionString });
  }
  return pool;
}

export async function query<T = Record<string, unknown>>(
  sql: string,
  params?: unknown[],
): Promise<T[]> {
  const res = await getPool().query(sql, params);
  return res.rows as T[];
}

/** Estoque atual de um produto pelo slug. */
export async function getStockBySlug(slug: string): Promise<number> {
  const rows = await query<{ stock: number }>(
    'SELECT stock FROM products WHERE slug = $1',
    [slug],
  );
  return rows[0]?.stock ?? -1;
}

/** usedCount de um cupom pelo código. */
export async function getCouponUsedCount(code: string): Promise<number> {
  const rows = await query<{ usedCount: number }>(
    'SELECT "usedCount" FROM coupons WHERE code = $1',
    [code],
  );
  return rows[0]?.usedCount ?? -1;
}

/** Conta pedidos por email do cliente. */
export async function countOrdersByEmail(email: string): Promise<number> {
  const rows = await query<{ count: string }>(
    'SELECT COUNT(*)::text AS count FROM orders WHERE "customerEmail" = $1',
    [email],
  );
  return Number(rows[0]?.count ?? 0);
}

/** Status atual de um pedido por id. */
export async function getOrderStatus(orderId: string): Promise<string | null> {
  const rows = await query<{ status: string }>(
    'SELECT status FROM orders WHERE id = $1',
    [orderId],
  );
  return rows[0]?.status ?? null;
}

/** Shape mínimo de um OrderEvent retornado pelas asserções E2E. */
export interface OrderEventRow {
  id: string;
  status: string;
  createdAt: Date;
  metadata: Record<string, unknown> | null;
}

/** Lista os eventos de um pedido em ordem cronológica ascendente. */
export async function getOrderEvents(orderId: string): Promise<OrderEventRow[]> {
  const rows = await query<{
    id: string;
    status: string;
    createdAt: Date;
    metadata: Record<string, unknown> | null;
  }>(
    'SELECT id, status, "createdAt", metadata FROM order_events WHERE "orderId" = $1 ORDER BY "createdAt" ASC',
    [orderId],
  );
  return rows;
}

export async function closeDb(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
  }
}
