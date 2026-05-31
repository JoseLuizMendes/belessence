/**
 * /admin/pedidos — Lista de pedidos com filtro por status
 */

import { prisma } from "@/lib/shared/infrastructure/prisma-client";
import Link from "next/link";
import { formatPrice } from "@/shadcn-utils/utils";
import { TableBody, TableCell } from "@/components/ui/table";
import { ShoppingBag } from "lucide-react";
import { OrderStatusFilter } from "@/components/admin/order-status-filter";
import { PageHeader } from "@/components/admin/page-header";
import { EmptyState } from "@/components/admin/empty-state";
import { StatusPill, type StatusTone } from "@/components/admin/status-pill";
import {
  DataTable,
  DataTableHeader,
  DataTableRow,
} from "@/components/admin/data-table";
import type { OrderStatus } from "@prisma/client";

const STATUS_INFO: Record<string, { label: string; tone: StatusTone }> = {
  PENDING: { label: "Aguardando", tone: "pending" },
  PAYMENT_CONFIRMED: { label: "Confirmado", tone: "active" },
  PREPARING: { label: "Preparando", tone: "progress" },
  SHIPPED: { label: "Enviado", tone: "shipped" },
  DELIVERED: { label: "Entregue", tone: "done" },
  CANCELLED: { label: "Cancelado", tone: "danger" },
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

  const description = statusFilter
    ? `${orders.length} ${orders.length === 1 ? "pedido" : "pedidos"} com status ${STATUS_INFO[statusFilter]?.label}`
    : `${orders.length} ${orders.length === 1 ? "pedido" : "pedidos"} no histórico`;

  return (
    <div>
      <PageHeader
        eyebrow="Operação"
        title="Pedidos"
        description={description}
      />

      <div className="mb-8">
        <OrderStatusFilter
          activeStatus={statusFilter}
          statuses={VALID_STATUSES.map((value) => ({
            value,
            label: STATUS_INFO[value]?.label ?? value,
          }))}
        />
      </div>

      {orders.length === 0 ? (
        <EmptyState
          icon={<ShoppingBag strokeWidth={1.2} />}
          title={statusFilter ? "Nenhum pedido nesse filtro" : "Nenhum pedido por aqui"}
          description={
            statusFilter
              ? "Tente outro status ou volte para a lista completa."
              : "Quando os pedidos começarem a chegar, eles aparecem aqui."
          }
          action={
            statusFilter && (
              <Link
                href="/admin/pedidos"
                className="inline-flex items-center gap-2 text-[11px] tracking-[0.18em] uppercase text-brand-wine hover:underline"
              >
                Ver todos
              </Link>
            )
          }
        />
      ) : (
        <>
          {/* Mobile: cards (< md) */}
          <ul className="md:hidden flex flex-col gap-3">
            {orders.map((o) => {
              const info = STATUS_INFO[o.status] ?? STATUS_INFO.PENDING;
              const totalItems = o.items.reduce(
                (acc, i) => acc + i.quantity,
                0,
              );
              return (
                <li
                  key={o.id}
                  className="bg-admin-panel border border-admin rounded-token-md shadow-petal-1"
                >
                  <Link
                    href={`/admin/pedidos/${o.id}`}
                    className="flex flex-col gap-2 p-4 focus-ring rounded-token-md"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-[11px] font-medium tracking-[0.22em] uppercase text-brand-wine">
                        #{o.id.slice(0, 8).toUpperCase()}
                      </span>
                      <StatusPill tone={info.tone}>{info.label}</StatusPill>
                    </div>

                    <div className="min-w-0">
                      <p className="text-sm text-ink-strong truncate">
                        {o.customerName}
                      </p>
                      <p className="text-xs text-ink-muted truncate">
                        {o.customerEmail}
                      </p>
                    </div>

                    <div className="flex items-end justify-between gap-2 pt-2 border-t border-admin-soft mt-1">
                      <span className="text-[11px] text-ink-muted">
                        {formatDate(o.createdAt)}
                      </span>
                      <div className="text-right">
                        <span className="text-[11px] text-ink-muted font-data mr-2">
                          {totalItems} {totalItems === 1 ? "item" : "itens"}
                        </span>
                        <span className="font-data text-sm font-medium text-brand-wine">
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
          <DataTable>
            <DataTableHeader
              columns={[
                { key: "pedido", label: "Pedido" },
                { key: "cliente", label: "Cliente" },
                { key: "data", label: "Data" },
                { key: "status", label: "Status" },
                { key: "itens", label: "Itens", align: "right" },
                { key: "total", label: "Total", align: "right" },
              ]}
            />
            <TableBody>
              {orders.map((o) => {
                const info = STATUS_INFO[o.status] ?? STATUS_INFO.PENDING;
                const totalItems = o.items.reduce(
                  (acc, i) => acc + i.quantity,
                  0,
                );
                return (
                  <DataTableRow key={o.id}>
                    <TableCell className="py-4 px-5">
                      <Link
                        href={`/admin/pedidos/${o.id}`}
                        className="text-[11px] font-medium tracking-[0.22em] uppercase text-brand-wine hover:underline focus-ring rounded-sm"
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
                    <TableCell className="py-4 px-5 text-xs text-ink-muted font-data">
                      {formatDate(o.createdAt)}
                    </TableCell>
                    <TableCell className="py-4 px-5">
                      <StatusPill tone={info.tone}>{info.label}</StatusPill>
                    </TableCell>
                    <TableCell className="py-4 px-5 text-right font-data text-sm text-ink-soft">
                      {totalItems}
                    </TableCell>
                    <TableCell className="py-4 px-5 text-right font-data text-sm font-medium text-brand-wine">
                      {formatPrice(Number(o.total))}
                    </TableCell>
                  </DataTableRow>
                );
              })}
            </TableBody>
          </DataTable>
        </>
      )}
    </div>
  );
}
