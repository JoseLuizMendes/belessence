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
  ShoppingBag,
  TrendingUp,
  Package,
  AlertTriangle,
  ArrowRight,
} from "lucide-react";

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  PENDING: { label: "Aguardando", color: "bg-yellow-100 text-yellow-800" },
  PAYMENT_CONFIRMED: { label: "Confirmado", color: "bg-emerald-100 text-emerald-800" },
  PREPARING: { label: "Preparando", color: "bg-blue-100 text-blue-800" },
  SHIPPED: { label: "Enviado", color: "bg-indigo-100 text-indigo-800" },
  DELIVERED: { label: "Entregue", color: "bg-green-100 text-green-800" },
  CANCELLED: { label: "Cancelado", color: "bg-red-100 text-red-800" },
};

export default async function AdminDashboard() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const monthStart = new Date(today);
  monthStart.setDate(1);

  const [
    ordersToday,
    ordersMonth,
    totalRevenue,
    lowStockProducts,
    recentOrders,
    totalProducts,
    pendingMessages,
  ] = await Promise.all([
    prisma.order.count({ where: { createdAt: { gte: today } } }),
    prisma.order.count({ where: { createdAt: { gte: monthStart } } }),
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

  return (
    <div>
      <header className="mb-8">
        <p className="text-[11px] font-medium tracking-[0.32em] uppercase text-brand-wine mb-2">
          Painel
        </p>
        <h1 className="font-playfair italic text-3xl sm:text-4xl text-ink-strong">
          Dashboard
        </h1>
      </header>

      {/* Cards de métricas */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        <Card
          icon={ShoppingBag}
          label="Pedidos hoje"
          value={ordersToday}
          accent="bg-emerald-50 text-emerald-700"
        />
        <Card
          icon={TrendingUp}
          label="Pedidos do mês"
          value={ordersMonth}
          accent="bg-blue-50 text-blue-700"
        />
        <Card
          icon={Package}
          label="Produtos cadastrados"
          value={totalProducts}
          accent="bg-purple-50 text-purple-700"
        />
        <Card
          icon={AlertTriangle}
          label="Mensagens novas"
          value={pendingMessages}
          accent="bg-amber-50 text-amber-700"
        />
      </div>

      {/* Receita destacada */}
      <div className="mb-10 bg-brand-wine text-brand-pink rounded-token-md p-6 sm:p-8">
        <p className="text-[10px] font-medium tracking-[0.32em] uppercase text-brand-pink/70 mb-2">
          Receita total confirmada
        </p>
        <p className="font-playfair italic text-4xl sm:text-5xl">
          {formatPrice(revenue)}
        </p>
        <p className="text-xs text-brand-pink/60 mt-2">
          Considera pedidos com status confirmado, em preparação, enviados ou entregues
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pedidos recentes */}
        <section className="lg:col-span-2 bg-surface-panel rounded-token-md p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-playfair italic text-xl text-ink-strong">
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
            <h2 className="font-playfair italic text-xl text-ink-strong">
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

interface CardProps {
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  label: string;
  value: number;
  accent: string;
}

function Card({ icon: Icon, label, value, accent }: CardProps) {
  return (
    <div className="bg-surface-panel rounded-token-md p-5">
      <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-3 ${accent}`}>
        <Icon className="h-4 w-4" strokeWidth={1.5} />
      </div>
      <p className="text-[10px] font-medium tracking-[0.24em] uppercase text-ink-muted mb-1">
        {label}
      </p>
      <p className="font-playfair italic text-3xl text-ink-strong tabular-nums">
        {value}
      </p>
    </div>
  );
}
