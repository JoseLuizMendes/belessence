/**
 * /admin — Dashboard
 * ─────────────────────────────────────────────────────────────────────
 * Cards de métrica (KPIs) + receita destacada (committed panel) +
 * pedidos recentes + estoque baixo. Tudo em RSC com leitura do Prisma.
 */

import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { formatPrice } from "@/api/utils";
import { AlertTriangle, ArrowRight } from "lucide-react";
import { AnimatedPrice } from "@/components/ui/animated-price";
import { PageHeader } from "@/components/admin/page-header";
import { MetricCard } from "@/components/admin/metric-card";
import { CommittedPanel } from "@/components/admin/committed-panel";
import { StatusPill, type StatusTone } from "@/components/admin/status-pill";

const STATUS_MAP: Record<string, { label: string; tone: StatusTone }> = {
  PENDING: { label: "Aguardando", tone: "pending" },
  PAYMENT_CONFIRMED: { label: "Confirmado", tone: "active" },
  PREPARING: { label: "Preparando", tone: "progress" },
  SHIPPED: { label: "Enviado", tone: "shipped" },
  DELIVERED: { label: "Entregue", tone: "done" },
  CANCELLED: { label: "Cancelado", tone: "danger" },
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
      <PageHeader
        eyebrow="Painel"
        title="Dashboard"
        description="Visão consolidada da loja, atualizada a cada requisição."
      />

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <MetricCard
          label="Pedidos hoje"
          value={ordersToday}
          delta={{ pct: ordersTodayDelta, period: "vs ontem" }}
        />
        <MetricCard
          label="Pedidos do mês"
          value={ordersMonth}
          delta={{ pct: ordersMonthDelta, period: "vs mês passado" }}
        />
        <MetricCard label="Produtos cadastrados" value={totalProducts} />
        <MetricCard
          label="Mensagens novas"
          value={pendingMessages}
          hint={pendingMessages > 0 ? "Responder a clientes" : "Tudo em dia"}
        />
      </div>

      {/* Receita — committed moment da página */}
      <CommittedPanel
        eyebrow="Receita total confirmada"
        footnote="Considera pedidos confirmados, em preparação, enviados ou entregues."
        className="mb-10"
      >
        <AnimatedPrice
          value={revenue}
          immediate
          className="font-data text-4xl sm:text-5xl block"
        />
      </CommittedPanel>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pedidos recentes */}
        <section className="lg:col-span-2 bg-admin-panel border border-admin rounded-token-md p-6 shadow-petal-1">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-serif text-xl text-ink-strong">
              Pedidos recentes
            </h2>
            <Link
              href="/admin/pedidos"
              className="inline-flex items-center gap-1.5 text-[11px] tracking-[0.18em] uppercase text-brand-wine hover:gap-2 transition-all focus-ring rounded-sm"
            >
              Ver todos
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          {recentOrders.length === 0 ? (
            <p className="text-sm text-ink-muted italic text-center py-10">
              Ainda não há pedidos.
            </p>
          ) : (
            <ul className="-mx-3 [&>li+li]:border-t [&>li+li]:border-admin-soft">
              {recentOrders.map((order) => {
                const status =
                  STATUS_MAP[order.status] ?? STATUS_MAP.PENDING;
                return (
                  <li key={order.id}>
                    <Link
                      href={`/admin/pedidos/${order.id}`}
                      className="flex items-center justify-between gap-4 px-3 py-3 rounded-token-sm hover:bg-admin-row transition-colors focus-ring"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-[11px] font-medium tracking-[0.18em] uppercase text-ink-strong">
                          #{order.id.slice(0, 8).toUpperCase()}
                        </p>
                        <p className="text-xs text-ink-muted truncate mt-0.5">
                          {order.customerName} · {order.customerEmail}
                        </p>
                      </div>
                      <StatusPill tone={status.tone}>{status.label}</StatusPill>
                      <span className="font-data text-sm text-brand-wine flex-shrink-0 w-24 text-right">
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
        <section className="bg-admin-panel border border-admin rounded-token-md p-6 shadow-petal-1">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-serif text-xl text-ink-strong">
              Estoque baixo
            </h2>
            <AlertTriangle
              className="h-4 w-4 text-amber-600"
              strokeWidth={1.6}
            />
          </div>

          {lowStockProducts.length === 0 ? (
            <p className="text-sm text-ink-muted italic text-center py-10">
              Tudo abastecido.
            </p>
          ) : (
            <ul className="-mx-2 [&>li+li]:border-t [&>li+li]:border-admin-soft">
              {lowStockProducts.map((p) => (
                <li key={p.id}>
                  <Link
                    href={`/admin/produtos/${p.id}/editar`}
                    className="flex items-center justify-between gap-3 px-2 py-3 rounded-token-sm hover:bg-admin-row transition-colors focus-ring"
                  >
                    <span className="text-sm text-ink-strong truncate font-medium">
                      {p.name}
                    </span>
                    <span
                      className={`font-data text-xs font-semibold ${
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
            className="mt-5 inline-flex items-center gap-1.5 text-[11px] tracking-[0.18em] uppercase text-brand-wine hover:gap-2 transition-all focus-ring rounded-sm"
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
