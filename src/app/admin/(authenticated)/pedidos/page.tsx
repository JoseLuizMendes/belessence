/**
 * /admin/pedidos — Lista de pedidos com filtro por status
 */

import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { formatPrice } from "@/api/utils";
import type { OrderStatus } from "@prisma/client";

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  PENDING: { label: "Aguardando", color: "bg-yellow-100 text-yellow-800" },
  PAYMENT_CONFIRMED: { label: "Confirmado", color: "bg-emerald-100 text-emerald-800" },
  PREPARING: { label: "Preparando", color: "bg-blue-100 text-blue-800" },
  SHIPPED: { label: "Enviado", color: "bg-indigo-100 text-indigo-800" },
  DELIVERED: { label: "Entregue", color: "bg-green-100 text-green-800" },
  CANCELLED: { label: "Cancelado", color: "bg-red-100 text-red-800" },
};

const VALID_STATUSES: OrderStatus[] = [
  "PENDING",
  "PAYMENT_CONFIRMED",
  "PREPARING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
];

interface PageProps {
  searchParams: Promise<{ status?: string }>;
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export default async function AdminOrdersPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const statusFilter = sp.status as OrderStatus | undefined;

  const orders = await prisma.order.findMany({
    where:
      statusFilter && VALID_STATUSES.includes(statusFilter)
        ? { status: statusFilter }
        : {},
    orderBy: { createdAt: "desc" },
    include: { items: true },
  });

  return (
    <div>
      <header className="mb-8">
        <p className="text-[11px] font-medium tracking-[0.32em] uppercase text-brand-wine mb-2">
          Operação
        </p>
        <h1 className="font-playfair italic text-3xl sm:text-4xl text-ink-strong">
          Pedidos
        </h1>
        <p className="text-sm text-ink-soft mt-1">
          {orders.length} {orders.length === 1 ? "pedido" : "pedidos"}
          {statusFilter && ` com status ${STATUS_LABELS[statusFilter]?.label}`}
        </p>
      </header>

      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-2 mb-8">
        <Link
          href="/admin/pedidos"
          className={`px-4 py-2 rounded-full text-[10px] font-medium tracking-[0.18em] uppercase transition-all ${
            !statusFilter
              ? "bg-brand-wine text-brand-pink"
              : "bg-surface-panel text-ink-soft border border-border-subtle hover:border-brand-wine"
          }`}
        >
          Todos
        </Link>
        {VALID_STATUSES.map((status) => {
          const info = STATUS_LABELS[status];
          const isActive = statusFilter === status;
          return (
            <Link
              key={status}
              href={`/admin/pedidos?status=${status}`}
              className={`px-4 py-2 rounded-full text-[10px] font-medium tracking-[0.18em] uppercase transition-all ${
                isActive
                  ? "bg-brand-wine text-brand-pink"
                  : "bg-surface-panel text-ink-soft border border-border-subtle hover:border-brand-wine"
              }`}
            >
              {info.label}
            </Link>
          );
        })}
      </div>

      {orders.length === 0 ? (
        <div className="bg-surface-panel rounded-token-md p-12 text-center">
          <p className="text-sm text-ink-soft italic">
            Nenhum pedido nesse filtro.
          </p>
        </div>
      ) : (
        <div className="bg-surface-panel rounded-token-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-surface-section">
                <tr>
                  <th className="text-left py-3 px-5 text-[10px] tracking-[0.18em] uppercase font-medium text-ink-soft">
                    Pedido
                  </th>
                  <th className="text-left py-3 px-5 text-[10px] tracking-[0.18em] uppercase font-medium text-ink-soft">
                    Cliente
                  </th>
                  <th className="text-left py-3 px-5 text-[10px] tracking-[0.18em] uppercase font-medium text-ink-soft">
                    Data
                  </th>
                  <th className="text-left py-3 px-5 text-[10px] tracking-[0.18em] uppercase font-medium text-ink-soft">
                    Status
                  </th>
                  <th className="text-right py-3 px-5 text-[10px] tracking-[0.18em] uppercase font-medium text-ink-soft">
                    Itens
                  </th>
                  <th className="text-right py-3 px-5 text-[10px] tracking-[0.18em] uppercase font-medium text-ink-soft">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => {
                  const status = STATUS_LABELS[o.status] ?? STATUS_LABELS.PENDING;
                  const totalItems = o.items.reduce(
                    (acc, i) => acc + i.quantity,
                    0,
                  );
                  return (
                    <tr key={o.id} className="border-t border-border-subtle">
                      <td className="py-4 px-5">
                        <Link
                          href={`/admin/pedidos/${o.id}`}
                          className="text-xs font-medium tracking-[0.18em] uppercase text-brand-wine hover:underline"
                        >
                          #{o.id.slice(0, 8).toUpperCase()}
                        </Link>
                      </td>
                      <td className="py-4 px-5">
                        <p className="text-sm text-ink-strong">{o.customerName}</p>
                        <p className="text-xs text-ink-muted">{o.customerEmail}</p>
                      </td>
                      <td className="py-4 px-5 text-xs text-ink-soft">
                        {formatDate(o.createdAt)}
                      </td>
                      <td className="py-4 px-5">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-[0.14em] ${status.color}`}
                        >
                          {status.label}
                        </span>
                      </td>
                      <td className="py-4 px-5 text-right text-sm text-ink-soft tabular-nums">
                        {totalItems}
                      </td>
                      <td className="py-4 px-5 text-right text-sm font-medium text-brand-wine">
                        {formatPrice(Number(o.total))}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
