/**
 * /sucesso/[id] — Server Component (estilo Stitch)
 * ─────────────────────────────────────────────────────────────────────
 * Página de confirmação de pedido. Acessível diretamente via URL após o
 * checkout finalizar (ou compartilhada). Sem auth — quem tem o ID vê.
 *
 * Mostra:
 *  - Eyebrow + título italic
 *  - Número do pedido (ID curto, primeiros 8 chars)
 *  - Badge de status verde "Pagamento confirmado"
 *  - Lista de items (com imagem/nome/qty/preço)
 *  - Resumo (subtotal, desconto, frete, total)
 *  - Endereço de entrega formatado
 *  - CTA "Acompanhar pedidos" → /meus-pedidos?email=
 *  - CTA "Continuar comprando" → /allProducts
 */

import Header from "@/components/header";
import Footer from "@/components/footer";
import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/api/utils";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  CheckCircle2,
  Package,
  MapPin,
  ArrowRight,
  Mail,
  Truck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Typewriter } from "@/components/ui/typewriter";
import { AnimatedPrice } from "@/components/ui/animated-price";
import { productImageSrc } from "@/lib/product-image";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pedido confirmado",
  description: "Seu pedido Mari Beauty foi confirmado com sucesso.",
};

interface PageProps {
  params: Promise<{ id: string }>;
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  PENDING: { label: "Aguardando pagamento", color: "bg-yellow-100 text-yellow-800" },
  PAYMENT_CONFIRMED: { label: "Pagamento confirmado", color: "bg-emerald-100 text-emerald-800" },
  PREPARING: { label: "Em separação", color: "bg-blue-100 text-blue-800" },
  SHIPPED: { label: "Enviado", color: "bg-indigo-100 text-indigo-800" },
  DELIVERED: { label: "Entregue", color: "bg-green-100 text-green-800" },
  CANCELLED: { label: "Cancelado", color: "bg-red-100 text-red-800" },
};

const PAYMENT_LABELS: Record<string, string> = {
  pix: "PIX",
  credit_card: "Cartão de Crédito",
  boleto: "Boleto Bancário",
};

export default async function SucessoPage({ params }: PageProps) {
  const { id } = await params;

  const order = await prisma.order.findUnique({
    where: { id },
    include: { items: true },
  });

  if (!order) notFound();

  const shortId = order.id.slice(0, 8).toUpperCase();
  const statusInfo = STATUS_LABELS[order.status] ?? STATUS_LABELS.PENDING;
  const paymentLabel = order.paymentMethod
    ? PAYMENT_LABELS[order.paymentMethod] ?? order.paymentMethod
    : "—";

  return (
    <div className="min-h-screen bg-brand-pink flex flex-col">
      <Header />

      <main className="flex-1 pt-24 sm:pt-28 pb-16 sm:pb-24">
        <div className="container-belessence max-w-4xl">
          {/* Ícone de sucesso + título */}
          <div className="text-center mb-12">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-emerald-100 flex items-center justify-center">
              <CheckCircle2
                className="h-10 w-10 text-emerald-600"
                strokeWidth={1.5}
              />
            </div>

            <p className="text-[11px] font-medium tracking-[0.32em] uppercase text-brand-wine mb-4">
              Mari Beauty
            </p>

            <Typewriter
              as="h1"
              text="Pedido confirmado"
              speed={55}
              immediate
              className="font-playfair italic text-[clamp(2.4rem,5vw,3.8rem)] leading-[1.04] tracking-[-0.02em] text-ink-strong mb-4 block"
            />

            <p className="text-sm sm:text-base text-ink-soft font-light max-w-md mx-auto mb-6">
              Recebemos seu pedido com sucesso. Em breve enviaremos as
              atualizações por e-mail.
            </p>

            <div className="inline-flex flex-wrap items-center justify-center gap-3 sm:gap-5">
              <span className="text-xs font-medium tracking-[0.24em] uppercase text-ink-strong">
                Pedido #{shortId}
              </span>
              <span className="text-ink-muted">·</span>
              <span
                className={`px-3 py-1 rounded-full text-[10px] font-medium tracking-[0.18em] uppercase ${statusInfo.color}`}
              >
                {statusInfo.label}
              </span>
            </div>

            <div className="mx-auto mt-6 h-px w-12 bg-brand-wine/60" />
          </div>

          {/* Cards principais */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6 lg:gap-8 mb-10">
            {/* ESQUERDA — Items + Endereço */}
            <div className="space-y-6">
              {/* Items */}
              <section className="bg-surface-panel rounded-token-md p-6 sm:p-8">
                <div className="flex items-center gap-2 mb-2">
                  <Package className="h-4 w-4 text-brand-wine" />
                  <h2 className="font-playfair italic text-xl text-ink-strong">
                    Itens do pedido
                  </h2>
                </div>
                <div className="h-px w-12 bg-brand-wine/60 mb-6" />

                <ul className="space-y-5">
                  {order.items.map((item) => (
                    <li key={item.id} className="flex items-start gap-4">
                      <div className="relative w-20 h-20 flex-shrink-0 rounded-token-sm overflow-hidden bg-surface-section">
                        {item.imageUrl && (
                          <Image
                            src={productImageSrc(item.imageUrl)}
                            alt={item.productName}
                            fill
                            className="object-cover"
                            sizes="80px"
                          />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <Link
                          href={`/product/${item.productSlug}`}
                          className="font-playfair italic text-base leading-tight text-ink-strong hover:underline line-clamp-2"
                        >
                          {item.productName}
                        </Link>
                        <p className="text-xs text-ink-soft mt-1 capitalize">
                          {item.category}
                        </p>
                        <p className="text-xs text-ink-muted mt-1">
                          Qtd: {item.quantity}
                        </p>
                      </div>

                      <div className="text-right">
                        <p className="text-sm font-medium text-brand-wine">
                          {formatPrice(Number(item.price) * item.quantity)}
                        </p>
                        <p className="text-xs text-ink-muted mt-1">
                          {formatPrice(Number(item.price))} cada
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              </section>

              {/* Endereço */}
              <section className="bg-surface-panel rounded-token-md p-6 sm:p-8">
                <div className="flex items-center gap-2 mb-2">
                  <MapPin className="h-4 w-4 text-brand-wine" />
                  <h2 className="font-playfair italic text-xl text-ink-strong">
                    Endereço de entrega
                  </h2>
                </div>
                <div className="h-px w-12 bg-brand-wine/60 mb-6" />

                <address className="text-sm not-italic text-ink-soft leading-relaxed font-light">
                  <strong className="text-ink-strong">
                    {order.customerName}
                  </strong>
                  <br />
                  {order.addressStreet}, {order.addressNumber}
                  {order.addressComplement && ` — ${order.addressComplement}`}
                  <br />
                  {order.addressNeighborhood} — {order.addressCity}/
                  {order.addressState}
                  <br />
                  CEP: {order.addressCep}
                  <br />
                  <span className="inline-flex items-center gap-1.5 mt-3 text-xs">
                    <Mail className="h-3 w-3" /> {order.customerEmail}
                  </span>
                </address>
              </section>

              {/* Tracking (se SHIPPED) */}
              {order.status === "SHIPPED" && order.trackingCode && (
                <section className="bg-surface-panel rounded-token-md p-6 sm:p-8">
                  <div className="flex items-center gap-2 mb-2">
                    <Truck className="h-4 w-4 text-brand-wine" />
                    <h2 className="font-playfair italic text-xl text-ink-strong">
                      Rastreamento
                    </h2>
                  </div>
                  <div className="h-px w-12 bg-brand-wine/60 mb-6" />
                  <p className="font-mono text-sm text-ink-strong">
                    {order.trackingCode}
                  </p>
                </section>
              )}
            </div>

            {/* DIREITA — Resumo */}
            <aside className="lg:sticky lg:top-24 lg:self-start">
              <div className="bg-brand-wine text-brand-pink rounded-token-md p-6 sm:p-8">
                <h2 className="font-playfair italic text-xl mb-2">Resumo</h2>
                <div className="h-px w-12 bg-brand-pink/40 mb-6" />

                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-brand-pink/80">Subtotal</span>
                    <span>{formatPrice(Number(order.subtotal))}</span>
                  </div>

                  {Number(order.discount) > 0 && (
                    <div className="flex justify-between">
                      <span className="text-brand-pink/80">
                        Desconto {order.couponCode && `(${order.couponCode})`}
                      </span>
                      <span className="text-emerald-300">
                        − {formatPrice(Number(order.discount))}
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between">
                    <span className="text-brand-pink/80">Frete</span>
                    <span>
                      {Number(order.shippingCost) === 0
                        ? "Grátis"
                        : formatPrice(Number(order.shippingCost))}
                    </span>
                  </div>

                  <div className="flex justify-between pt-3 border-t border-brand-pink/15">
                    <span className="text-[10px] font-medium tracking-[0.24em] uppercase text-brand-pink/80">
                      Total
                    </span>
                    <AnimatedPrice
                      value={Number(order.total)}
                      immediate
                      className="font-playfair italic text-2xl"
                    />
                  </div>

                  <div className="flex justify-between pt-3 border-t border-brand-pink/15">
                    <span className="text-[10px] font-medium tracking-[0.24em] uppercase text-brand-pink/80">
                      Pagamento
                    </span>
                    <span className="text-xs">{paymentLabel}</span>
                  </div>
                </div>
              </div>

              {/* CTAs */}
              <div className="mt-4 space-y-3">
                <Button
                  asChild
                  className="loreal-btn-pill w-full h-12 bg-surface-panel border border-brand-wine/30 text-brand-wine text-[12px] font-medium tracking-[0.18em] uppercase hover:bg-brand-wine hover:text-brand-pink"
                >
                  <Link
                    href={`/meus-pedidos?email=${encodeURIComponent(order.customerEmail)}`}
                  >
                    Acompanhar pedidos
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>

                <Button
                  asChild
                  variant="ghost"
                  className="loreal-btn-pill w-full h-12 text-[12px] font-medium tracking-[0.18em] uppercase text-ink-soft hover:bg-surface-panel"
                >
                  <Link href="/allProducts">Continuar comprando</Link>
                </Button>
              </div>
            </aside>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
