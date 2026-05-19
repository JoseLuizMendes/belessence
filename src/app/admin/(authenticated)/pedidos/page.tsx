/**
 * /admin/pedidos — Lista de pedidos com filtro por status
 */

import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { formatPrice } from "@/api/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { OrderStatusFilter } from "@/components/admin/order-status-filter";
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
      <OrderStatusFilter
        activeStatus={statusFilter}
        statuses={VALID_STATUSES.map((value) => ({
          value,
          label: STATUS_LABELS[value]?.label ?? value,
        }))}
      />

      {orders.length === 0 ? (
        <div className="bg-surface-panel rounded-token-md p-12 text-center">
          <p className="text-sm text-ink-soft italic">
            Nenhum pedido nesse filtro.
          </p>
        </div>
      ) : (
        <>
          {/* Mobile: cards (< md) */}
          <ul className="md:hidden flex flex-col gap-3">
            {orders.map((o) => {
              const status = STATUS_LABELS[o.status] ?? STATUS_LABELS.PENDING;
              const totalItems = o.items.reduce(
                (acc, i) => acc + i.quantity,
                0,
              );
              return (
                <li key={o.id} className="bg-surface-panel rounded-token-md p-4">
                  <Link
                    href={`/admin/pedidos/${o.id}`}
                    className="flex flex-col gap-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-xs font-medium tracking-[0.18em] uppercase text-brand-wine">
                        #{o.id.slice(0, 8).toUpperCase()}
                      </span>
                      <Badge
                        className={`text-[10px] uppercase tracking-[0.14em] ${status.color}`}
                      >
                        {status.label}
                      </Badge>
                    </div>

                    <div className="min-w-0">
                      <p className="text-sm text-ink-strong truncate">
                        {o.customerName}
                      </p>
                      <p className="text-xs text-ink-muted truncate">
                        {o.customerEmail}
                      </p>
                    </div>

                    <div className="flex items-end justify-between gap-2 pt-1 border-t border-border-subtle/60 mt-1">
                      <span className="text-[11px] text-ink-soft">
                        {formatDate(o.createdAt)}
                      </span>
                      <div className="text-right">
                        <span className="text-[11px] text-ink-soft tabular-nums mr-2">
                          {totalItems} {totalItems === 1 ? "item" : "itens"}
                        </span>
                        <span className="text-sm font-medium text-brand-wine tabular-nums">
                          {formatPrice(Number(o.total))}
                        </span>
                      </div>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>

          {/* Desktop/tablet: tabela (md+) */}
          <div className="hidden md:block bg-surface-panel rounded-token-md overflow-hidden">
            <Table>
              <TableHeader className="bg-surface-section">
                <TableRow className="hover:bg-transparent border-b border-border-subtle">
                  <TableHead className="py-3 px-5 text-[10px] tracking-[0.18em] uppercase font-medium text-ink-soft">
                    Pedido
                  </TableHead>
                  <TableHead className="py-3 px-5 text-[10px] tracking-[0.18em] uppercase font-medium text-ink-soft">
                    Cliente
                  </TableHead>
                  <TableHead className="py-3 px-5 text-[10px] tracking-[0.18em] uppercase font-medium text-ink-soft">
                    Data
                  </TableHead>
                  <TableHead className="py-3 px-5 text-[10px] tracking-[0.18em] uppercase font-medium text-ink-soft">
                    Status
                  </TableHead>
                  <TableHead className="py-3 px-5 text-right text-[10px] tracking-[0.18em] uppercase font-medium text-ink-soft">
                    Itens
                  </TableHead>
                  <TableHead className="py-3 px-5 text-right text-[10px] tracking-[0.18em] uppercase font-medium text-ink-soft">
                    Total
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((o) => {
                  const status =
                    STATUS_LABELS[o.status] ?? STATUS_LABELS.PENDING;
                  const totalItems = o.items.reduce(
                    (acc, i) => acc + i.quantity,
                    0,
                  );
                  return (
                    <TableRow
                      key={o.id}
                      className="border-b border-border-subtle hover:bg-surface-section/50"
                    >
                      <TableCell className="py-4 px-5">
                        <Link
                          href={`/admin/pedidos/${o.id}`}
                          className="text-xs font-medium tracking-[0.18em] uppercase text-brand-wine hover:underline"
                        >
                          #{o.id.slice(0, 8).toUpperCase()}
                        </Link>
                      </TableCell>
                      <TableCell className="py-4 px-5">
                        <p className="text-sm text-ink-strong">
                          {o.customerName}
                        </p>
                        <p className="text-xs text-ink-muted">
                          {o.customerEmail}
                        </p>
                      </TableCell>
                      <TableCell className="py-4 px-5 text-xs text-ink-soft">
                        {formatDate(o.createdAt)}
                      </TableCell>
                      <TableCell className="py-4 px-5">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-[0.14em] ${status.color}`}
                        >
                          {status.label}
                        </span>
                      </TableCell>
                      <TableCell className="py-4 px-5 text-right text-sm text-ink-soft tabular-nums">
                        {totalItems}
                      </TableCell>
                      <TableCell className="py-4 px-5 text-right text-sm font-medium text-brand-wine">
                        {formatPrice(Number(o.total))}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </>
      )}
    </div>
  );
}
