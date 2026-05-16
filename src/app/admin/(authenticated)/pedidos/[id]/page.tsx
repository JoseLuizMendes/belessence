/**
 * /admin/pedidos/[id] — Detalhe do pedido com mudança de status
 */

import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { notFound } from "next/navigation";
import { formatPrice } from "@/api/utils";
import { ArrowLeft } from "lucide-react";
import { OrderStatusForm } from "@/components/admin/order-status-form";
import { updateOrderStatus } from "../actions";
import { productImageSrc } from "@/lib/product-image";

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  PENDING: { label: "Aguardando", color: "bg-yellow-100 text-yellow-800" },
  PAYMENT_CONFIRMED: {
    label: "Confirmado",
    color: "bg-emerald-100 text-emerald-800",
  },
  PREPARING: { label: "Preparando", color: "bg-blue-100 text-blue-800" },
  SHIPPED: { label: "Enviado", color: "bg-indigo-100 text-indigo-800" },
  DELIVERED: { label: "Entregue", color: "bg-green-100 text-green-800" },
  CANCELLED: { label: "Cancelado", color: "bg-red-100 text-red-800" },
};

interface PageProps {
  params: Promise<{ id: string }>;
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

export default async function AdminOrderDetailPage({ params }: PageProps) {
  const { id } = await params;

  const order = await prisma.order.findUnique({
    where: { id },
    include: { items: true },
  });

  if (!order) notFound();

  const status = STATUS_LABELS[order.status] ?? STATUS_LABELS.PENDING;
  const updateStatus = updateOrderStatus.bind(null, id);

  return (
    <div>
      <Link
        href="/admin/pedidos"
        className="inline-flex items-center gap-2 text-xs tracking-[0.18em] uppercase text-ink-soft hover:text-brand-wine mb-6"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Voltar para pedidos
      </Link>

      <header className="mb-8">
        <p className="text-[11px] font-medium tracking-[0.32em] uppercase text-brand-wine mb-2">
          Pedido
        </p>
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="font-playfair italic text-3xl sm:text-4xl text-ink-strong">
            #{order.id.slice(0, 8).toUpperCase()}
          </h1>
          <span
            className={`px-2 py-1 rounded-full text-[10px] font-medium uppercase tracking-[0.14em] ${status.color}`}
          >
            {status.label}
          </span>
        </div>
        <p className="text-sm text-ink-soft mt-1">
          Criado em {formatDate(order.createdAt)}
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-8">
        {/* COLUNA PRINCIPAL */}
        <div className="space-y-6">
          {/* CLIENTE */}
          <section className="bg-surface-panel rounded-token-md p-6">
            <h2 className="font-playfair italic text-xl text-ink-strong mb-2">
              Cliente
            </h2>
            <div className="h-px w-12 bg-brand-wine/60 mb-4" />
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div>
                <dt className="text-[10px] tracking-[0.18em] uppercase text-ink-muted mb-0.5">
                  Nome
                </dt>
                <dd className="text-ink-strong">{order.customerName}</dd>
              </div>
              <div>
                <dt className="text-[10px] tracking-[0.18em] uppercase text-ink-muted mb-0.5">
                  Email
                </dt>
                <dd className="text-ink-strong">{order.customerEmail}</dd>
              </div>
              <div>
                <dt className="text-[10px] tracking-[0.18em] uppercase text-ink-muted mb-0.5">
                  Telefone
                </dt>
                <dd className="text-ink-strong">{order.customerPhone}</dd>
              </div>
              <div>
                <dt className="text-[10px] tracking-[0.18em] uppercase text-ink-muted mb-0.5">
                  CPF
                </dt>
                <dd className="text-ink-strong">{order.customerCpf}</dd>
              </div>
            </dl>
          </section>

          {/* ENDEREÇO */}
          <section className="bg-surface-panel rounded-token-md p-6">
            <h2 className="font-playfair italic text-xl text-ink-strong mb-2">
              Endereço de entrega
            </h2>
            <div className="h-px w-12 bg-brand-wine/60 mb-4" />
            <p className="text-sm text-ink-strong leading-relaxed">
              {order.addressStreet}, {order.addressNumber}
              {order.addressComplement && ` — ${order.addressComplement}`}
              <br />
              {order.addressNeighborhood}
              <br />
              {order.addressCity} — {order.addressState}
              <br />
              CEP {order.addressCep}
            </p>
          </section>

          {/* ITENS */}
          <section className="bg-surface-panel rounded-token-md p-6">
            <h2 className="font-playfair italic text-xl text-ink-strong mb-2">
              Itens ({order.items.length})
            </h2>
            <div className="h-px w-12 bg-brand-wine/60 mb-4" />
            <div className="space-y-3">
              {order.items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-4 py-3 border-b border-border-subtle last:border-b-0"
                >
                  <div className="w-14 h-14 rounded-token-sm overflow-hidden bg-surface-base flex-shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={productImageSrc(item.imageUrl)}
                      alt={item.productName}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-ink-strong truncate">
                      {item.productName}
                    </p>
                    <p className="text-xs text-ink-muted">
                      {item.quantity} × {formatPrice(Number(item.price))}
                    </p>
                  </div>
                  <p className="text-sm font-medium text-brand-wine tabular-nums">
                    {formatPrice(Number(item.price) * item.quantity)}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* PAGAMENTO */}
          <section className="bg-surface-panel rounded-token-md p-6">
            <h2 className="font-playfair italic text-xl text-ink-strong mb-2">
              Pagamento
            </h2>
            <div className="h-px w-12 bg-brand-wine/60 mb-4" />
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div>
                <dt className="text-[10px] tracking-[0.18em] uppercase text-ink-muted mb-0.5">
                  Método
                </dt>
                <dd className="text-ink-strong">
                  {order.paymentMethod ?? "—"}
                </dd>
              </div>
              <div>
                <dt className="text-[10px] tracking-[0.18em] uppercase text-ink-muted mb-0.5">
                  ID Pagamento
                </dt>
                <dd className="text-ink-strong font-mono text-xs">
                  {order.mpPaymentId ?? "—"}
                </dd>
              </div>
              <div>
                <dt className="text-[10px] tracking-[0.18em] uppercase text-ink-muted mb-0.5">
                  Status do pagamento
                </dt>
                <dd className="text-ink-strong">{order.mpStatus ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-[10px] tracking-[0.18em] uppercase text-ink-muted mb-0.5">
                  Cupom aplicado
                </dt>
                <dd className="text-ink-strong">{order.couponCode ?? "—"}</dd>
              </div>
            </dl>
          </section>
        </div>

        {/* SIDEBAR */}
        <aside className="space-y-6">
          {/* RESUMO */}
          <div className="bg-surface-panel rounded-token-md p-6">
            <h3 className="font-playfair italic text-lg text-ink-strong mb-4">
              Resumo
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-ink-soft">Subtotal</span>
                <span className="text-ink-strong tabular-nums">
                  {formatPrice(Number(order.subtotal))}
                </span>
              </div>
              {Number(order.discount) > 0 && (
                <div className="flex justify-between">
                  <span className="text-ink-soft">Desconto</span>
                  <span className="text-emerald-600 tabular-nums">
                    −{formatPrice(Number(order.discount))}
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-ink-soft">Frete</span>
                <span className="text-ink-strong tabular-nums">
                  {formatPrice(Number(order.shippingCost))}
                </span>
              </div>
              <div className="h-px bg-border-subtle my-3" />
              <div className="flex justify-between text-base font-medium">
                <span className="text-ink-strong">Total</span>
                <span className="text-brand-wine tabular-nums">
                  {formatPrice(Number(order.total))}
                </span>
              </div>
            </div>
          </div>

          {/* MUDAR STATUS */}
          <OrderStatusForm
            currentStatus={order.status}
            currentTrackingCode={order.trackingCode}
            action={updateStatus}
          />
        </aside>
      </div>
    </div>
  );
}
