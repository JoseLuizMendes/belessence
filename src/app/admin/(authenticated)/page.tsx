/**
 * /admin — Dashboard
 * ─────────────────────────────────────────────────────────────────────
 * Métricas: pedidos do dia/mês, receita, produtos em estoque baixo,
 * últimos 10 pedidos.
 */

import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { formatPrice } from "@/api/utils";
import {
  AlertTriangle,
  ArrowRight,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { AnimatedNumber } from "@/components/ui/animated-number";
import { AnimatedPrice } from "@/components/ui/animated-price";

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  PENDING: { label: "Aguardando", color: "bg-yellow-100 text-yellow-800" },
  PAYMENT_CONFIRMED: { label: "Confirmado", color: "bg-emerald-100 text-emerald-800" },
  PREPARING: { label: "Preparando", color: "bg-blue-100 text-blue-800" },
  SHIPPED: { label: "Enviado", color: "bg-indigo-100 text-indigo-800" },
  DELIVERED: { label: "Entregue", color: "bg-green-100 text-green-800" },
  CANCELLED: { label: "Cancelado", color: "bg-red-100 text-red-800" },
};

export default async function AdminDashboard() {
  const now = new Date();

  const today = new Date(now);
  today.setHours(0, 0, 0, 0);

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const monthStart = new Date(today);
  monthStart.setDate(1);

  // Mês anterior, até o mesmo ponto decorrido (month-to-date comparável)
  const prevMonthStart = new Date(monthStart);
  prevMonthStart.setMonth(prevMonthStart.getMonth() - 1);
  const prevMonthCutoff = new Date(
    prevMonthStart.getTime() + (now.getTime() - monthStart.getTime()),
  );

  const [
    ordersToday,
    ordersYesterday,
    ordersMonth,
    ordersPrevMonth,
    totalRevenue,
    lowStockProducts,
    recentOrders,
    totalProducts,
    pendingMessages,
  ] = await Promise.all([
    prisma.order.count({ where: { createdAt: { gte: today } } }),
    prisma.order.count({ where: { createdAt: { gte: yesterday, lt: today } } }),
    prisma.order.count({ where: { createdAt: { gte: monthStart } } }),
    prisma.order.count({
      where: { createdAt: { gte: prevMonthStart, lt: prevMonthCutoff } },
    }),
    prisma.order.aggregate({
      where: {
        status: { in: ["PAYMENT_CONFIRMED", "PREPARING", "SHIPPED", "DELIVERED"] },
      },
      _sum: { total: true },
    }),
    prisma.product.findMany({
      where: { stock: { lt: 20 } },
      orderBy: { stock: "asc" },
      take: 5,
    }),
    prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
      include: { items: true },
    }),
    prisma.product.count(),
    prisma.contactMessage.count({ where: { replied: false } }),
  ]);

  const revenue = Number(totalRevenue._sum.total ?? 0);
  const ordersTodayDelta = pctDelta(ordersToday, ordersYesterday);
  const ordersMonthDelta = pctDelta(ordersMonth, ordersPrevMonth);

  return (
    <div>
      <header className="mb-8">
        <p className="text-[11px] font-medium tracking-[0.32em] uppercase text-brand-wine mb-2">
          Painel
        </p>
        <h1 className="font-playfair text-3xl sm:text-4xl text-ink-strong">
          Dashboard
        </h1>
      </header>

      {/* Cards de métricas — flat + hairline (Vercel), delta real (Stripe) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        <Card
          label="Pedidos hoje"
          value={ordersToday}
          delta={{ pct: ordersTodayDelta, period: "vs ontem" }}
        />
        <Card
          label="Pedidos do mês"
          value={ordersMonth}
          delta={{ pct: ordersMonthDelta, period: "vs mês passado" }}
        />
        <Card label="Produtos cadastrados" value={totalProducts} />
        <Card label="Mensagens novas" value={pendingMessages} />
      </div>

      {/* Receita destacada */}
      <div className="mb-10 bg-brand-wine text-brand-pink rounded-token-md p-6 sm:p-8">
        <p className="text-[10px] font-medium tracking-[0.32em] uppercase text-brand-pink/70 mb-2">
          Receita total confirmada
        </p>
        <AnimatedPrice
          value={revenue}
          immediate
          className="font-data text-4xl sm:text-5xl block"
        />
        <p className="text-xs text-brand-pink/60 mt-2">
          Considera pedidos com status confirmado, em preparação, enviados ou entregues
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pedidos recentes */}
        <section className="lg:col-span-2 bg-surface-panel rounded-token-md p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-playfair text-xl text-ink-strong">
              Pedidos recentes
            </h2>
            <Link
              href="/admin/pedidos"
              className="text-[11px] tracking-[0.18em] uppercase text-brand-wine hover:underline"
            >
              Ver todos
            </Link>
          </div>

          {recentOrders.length === 0 ? (
            <p className="text-sm text-ink-muted italic text-center py-8">
              Ainda não há pedidos.
            </p>
          ) : (
            <ul className="space-y-3">
              {recentOrders.map((order) => {
                const status =
                  STATUS_LABELS[order.status] ?? STATUS_LABELS.PENDING;
                return (
                  <li key={order.id}>
                    <Link
                      href={`/admin/pedidos/${order.id}`}
                      className="flex items-center justify-between gap-4 p-3 -mx-3 rounded-token-sm hover:bg-surface-section transition-colors"
                    >
                      <div className="min-w-0">
                        <p className="text-xs font-medium tracking-[0.18em] uppercase text-ink-strong">
                          #{order.id.slice(0, 8).toUpperCase()}
                        </p>
                        <p className="text-xs text-ink-muted truncate">
                          {order.customerName} · {order.customerEmail}
                        </p>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-[0.14em] flex-shrink-0 ${status.color}`}
                      >
                        {status.label}
                      </span>
                      <span className="text-sm font-medium text-brand-wine flex-shrink-0 w-24 text-right">
                        {formatPrice(Number(order.total))}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {/* Estoque baixo */}
        <section className="bg-surface-panel rounded-token-md p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-playfair text-xl text-ink-strong">
              Estoque baixo
            </h2>
            <AlertTriangle className="h-4 w-4 text-amber-600" />
          </div>

          {lowStockProducts.length === 0 ? (
            <p className="text-sm text-ink-muted italic text-center py-8">
              Tudo abastecido!
            </p>
          ) : (
            <ul className="space-y-3">
              {lowStockProducts.map((p) => (
                <li key={p.id}>
                  <Link
                    href={`/admin/produtos/${p.id}/editar`}
                    className="flex items-center justify-between gap-3 p-2 -mx-2 rounded-token-sm hover:bg-surface-section transition-colors"
                  >
                    <span className="text-sm text-ink-strong truncate font-medium">
                      {p.name}
                    </span>
                    <span
                      className={`text-xs font-bold tabular-nums ${
                        p.stock < 5
                          ? "text-destructive"
                          : p.stock < 10
                            ? "text-amber-600"
                            : "text-ink-soft"
                      }`}
                    >
                      {p.stock}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}

          <Link
            href="/admin/produtos"
            className="mt-4 inline-flex items-center gap-1.5 text-[11px] tracking-[0.18em] uppercase text-brand-wine hover:underline"
          >
            Gerenciar produtos
            <ArrowRight className="h-3 w-3" />
          </Link>
        </section>
      </div>
    </div>
  );
}

/** Variação percentual honesta entre período atual e anterior. */
function pctDelta(current: number, previous: number): number {
  if (previous === 0) return current === 0 ? 0 : 100;
  return Math.round(((current - previous) / previous) * 100);
}

interface CardProps {
  label: string;
  value: number;
  delta?: { pct: number; period: string };
}

function Card({ label, value, delta }: CardProps) {
  const up = delta ? delta.pct >= 0 : true;
  const DeltaIcon = up ? ArrowUpRight : ArrowDownRight;
  const deltaColor = up ? "text-positive" : "text-negative";

  return (
    <div className="bg-surface-panel border border-subtle rounded-token-sm p-5">
      <p className="text-[10px] font-medium tracking-[0.24em] uppercase text-ink-muted mb-3">
        {label}
      </p>
      <AnimatedNumber
        value={value}
        immediate
        className="font-data text-3xl sm:text-4xl text-ink-strong block leading-none"
      />
      {delta && (
        <p className="mt-3 flex items-center gap-1 text-xs">
          <DeltaIcon className={`h-3.5 w-3.5 ${deltaColor}`} strokeWidth={2} />
          <span className={`font-data ${deltaColor}`}>
            {Math.abs(delta.pct)}%
          </span>
          <span className="text-ink-muted ml-1">{delta.period}</span>
        </p>
      )}
    </div>
  );
}
