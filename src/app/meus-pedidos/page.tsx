/**
 * /meus-pedidos — Server Component
 * ─────────────────────────────────────────────────────────────────────
 * Histórico de pedidos por email (sem auth — apenas consulta).
 *
 * Fluxo:
 *  - Sem `?email=` → mostra form para o usuário digitar o email
 *  - Com `?email=` → lista os pedidos desse email
 *
 * Cada pedido vira um card com nº, status, items thumbnail, total e link
 * para /sucesso/[id].
 */

import Header from "@/components/header";
import Footer from "@/components/footer";
import { prisma } from "@/lib/shared/infrastructure/prisma-client";
import { formatPrice } from "@/shadcn-utils/utils";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { ArrowRight, Package, Search, ShoppingBag } from "lucide-react";
import { productImageSrc } from "@/lib/product-image";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Meus pedidos",
  description: "Consulte o histórico dos seus pedidos Mari Beauty.",
};

interface PageProps {
  searchParams: Promise<{ email?: string }>;
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  PENDING: { label: "Aguardando pagamento", color: "bg-yellow-100 text-yellow-800" },
  PAYMENT_CONFIRMED: { label: "Pagamento confirmado", color: "bg-emerald-100 text-emerald-800" },
  PREPARING: { label: "Em separação", color: "bg-blue-100 text-blue-800" },
  SHIPPED: { label: "Enviado", color: "bg-indigo-100 text-indigo-800" },
  DELIVERED: { label: "Entregue", color: "bg-green-100 text-green-800" },
  CANCELLED: { label: "Cancelado", color: "bg-red-100 text-red-800" },
};

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export default async function MeusPedidosPage({ searchParams }: PageProps) {
  const { email } = await searchParams;

  const orders = email
    ? await prisma.order.findMany({
        where: { customerEmail: email.toLowerCase() },
        orderBy: { createdAt: "desc" },
        include: { items: true },
      })
    : [];

  return (
    <div className="min-h-screen bg-brand-pink flex flex-col">
      <Header />

      <main className="flex-1 pt-24 sm:pt-28 pb-16 sm:pb-24">
        <div className="container-belessence max-w-4xl">
          {/* Header */}
          <div className="text-center mb-12 sm:mb-14">
            <p className="text-[11px] font-medium tracking-[0.32em] uppercase text-brand-wine mb-4">
              Mari Beauty
            </p>
            <h1 className="font-playfair italic text-[clamp(2.4rem,5vw,3.8rem)] leading-tight tracking-[-0.02em] text-ink-strong mb-4">
              Meus pedidos
            </h1>
            <p className="text-sm sm:text-base text-ink-soft font-light max-w-md mx-auto">
              {email
                ? `Pedidos vinculados a ${email}`
                : "Digite o e-mail usado na compra para ver seu histórico."}
            </p>
            <div className="mx-auto mt-6 h-px w-12 bg-brand-wine/60" />
          </div>

          {/* Form de busca por email */}
          <form
            method="get"
            action="/meus-pedidos"
            className="max-w-md mx-auto mb-12 flex gap-3"
          >
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-muted" />
              <Input
                type="email"
                name="email"
                defaultValue={email ?? ""}
                placeholder="voce@email.com"
                required
                className="h-12 pl-10 bg-surface-panel border-border-subtle rounded-token-sm focus-visible:border-brand-wine focus-visible:ring-0"
              />
            </div>
            <Button
              type="submit"
              className="loreal-btn-pill h-12 px-6 bg-brand-wine text-brand-pink text-[11px] font-medium tracking-[0.18em] uppercase hover:bg-brand-wine/90"
            >
              Buscar
            </Button>
          </form>

          {/* Resultado */}
          {!email ? null : orders.length === 0 ? (
            <Empty className="bg-surface-panel rounded-token-md py-12">
              <EmptyHeader>
                <EmptyMedia
                  variant="icon"
                  className="size-16 rounded-full bg-surface-section"
                >
                  <ShoppingBag className="size-7 text-brand-wine/60" strokeWidth={1.2} />
                </EmptyMedia>
                <EmptyTitle className="text-base text-ink-strong font-medium">
                  Nenhum pedido encontrado
                </EmptyTitle>
                <EmptyDescription className="text-sm text-ink-soft">
                  Não encontramos pedidos para este e-mail.
                </EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                <Link href="/allProducts">
                  <Button className="loreal-btn-pill h-11 px-6 bg-brand-wine text-brand-pink text-[11px] font-medium tracking-[0.18em] uppercase hover:bg-brand-wine/90">
                    Explorar coleção
                    <ArrowRight className="ml-2 h-3.5 w-3.5" />
                  </Button>
                </Link>
              </EmptyContent>
            </Empty>
          ) : (
            <ul className="space-y-5">
              {orders.map((order) => {
                const shortId = order.id.slice(0, 8).toUpperCase();
                const statusInfo =
                  STATUS_LABELS[order.status] ?? STATUS_LABELS.PENDING;
                const totalItems = order.items.reduce(
                  (acc, i) => acc + i.quantity,
                  0,
                );

                return (
                  <li key={order.id}>
                    <Link
                      href={`/sucesso/${order.id}`}
                      className="block bg-surface-panel rounded-token-md p-6 transition-all hover:shadow-card-hover"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
                        {/* Thumbnails */}
                        <div className="flex -space-x-2">
                          {order.items.slice(0, 3).map((item) => (
                            <div
                              key={item.id}
                              className="relative w-14 h-14 rounded-full border-2 border-surface-panel overflow-hidden bg-surface-section"
                            >
                              {item.imageUrl && (
                                <Image
                                  src={productImageSrc(item.imageUrl)}
                                  alt={item.productName}
                                  fill
                                  className="object-cover"
                                  sizes="56px"
                                />
                              )}
                            </div>
                          ))}
                          {order.items.length > 3 && (
                            <div className="relative w-14 h-14 rounded-full border-2 border-surface-panel bg-brand-wine flex items-center justify-center">
                              <span className="text-xs font-medium text-brand-pink">
                                +{order.items.length - 3}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-1.5 flex-wrap">
                            <span className="flex items-center gap-1.5 text-xs font-medium tracking-[0.18em] uppercase text-ink-strong">
                              <Package className="h-3 w-3" />#{shortId}
                            </span>
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[10px] font-medium tracking-[0.14em] uppercase ${statusInfo.color}`}
                            >
                              {statusInfo.label}
                            </span>
                          </div>
                          <p className="text-xs text-ink-muted">
                            {formatDate(order.createdAt)} ·{" "}
                            {totalItems} {totalItems === 1 ? "item" : "itens"}
                          </p>
                        </div>

                        {/* Total + chevron */}
                        <div className="flex items-center gap-3 text-right">
                          <div>
                            <p className="text-[10px] font-medium tracking-[0.18em] uppercase text-ink-muted">
                              Total
                            </p>
                            <p className="font-playfair italic text-xl text-brand-wine">
                              {formatPrice(Number(order.total))}
                            </p>
                          </div>
                          <ArrowRight className="h-4 w-4 text-ink-muted" />
                        </div>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
