/**
 * /admin/produtos — Lista de produtos
 * ─────────────────────────────────────────────────────────────────────
 * Coluna "Estado" mostra o ProductStatus com cor + aviso quando há promo
 * expirada que ainda precisa de cleanup manual.
 */

import { prisma } from "@/lib/prisma";
import Link from "next/link";
import Image from "next/image";
import { formatPrice } from "@/api/utils";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Package, AlertTriangle } from "lucide-react";
import { productImageSrc } from "@/lib/product-image";
import {
  getEffectivePromotion,
  isPromotionStale,
} from "@/lib/product-status";
import type { ProductStatus } from "@prisma/client";

const STATUS_BADGE: Record<
  ProductStatus,
  { label: string; classes: string }
> = {
  NORMAL: { label: "Normal", classes: "bg-surface-section text-ink-soft" },
  PROMOTION: { label: "Promoção", classes: "bg-amber-100 text-amber-800" },
  COMING_SOON: { label: "Em breve", classes: "bg-blue-100 text-blue-800" },
  DISCONTINUED: { label: "Descontinuado", classes: "bg-ink-soft/15 text-ink-soft" },
};

function relativeEnd(date: Date | null, now: Date): string | null {
  if (!date) return null;
  const ms = date.getTime() - now.getTime();
  if (ms < 0) return "expirou";
  const days = Math.floor(ms / (1000 * 60 * 60 * 24));
  if (days >= 1) return `${days}d`;
  const hours = Math.floor(ms / (1000 * 60 * 60));
  return `${hours}h`;
}

export default async function AdminProductsPage() {
  const products = await prisma.product.findMany({
    orderBy: { createdAt: "desc" },
  });

  const now = new Date();

  return (
    <div>
      <header className="flex items-end justify-between mb-8 gap-4 flex-wrap">
        <div>
          <p className="text-[11px] font-medium tracking-[0.32em] uppercase text-brand-wine mb-2">
            Catálogo
          </p>
          <h1 className="font-playfair italic text-3xl sm:text-4xl text-ink-strong">
            Produtos
          </h1>
          <p className="text-sm text-ink-soft mt-1">
            {products.length}{" "}
            {products.length === 1 ? "produto" : "produtos"} no catálogo
          </p>
        </div>
        <Link href="/admin/produtos/novo">
          <Button className="loreal-btn-pill h-11 px-6 bg-brand-wine text-brand-pink text-[11px] font-medium tracking-[0.18em] uppercase hover:bg-brand-wine/90">
            <Plus className="mr-2 h-4 w-4" />
            Novo produto
          </Button>
        </Link>
      </header>

      {products.length === 0 ? (
        <div className="bg-surface-panel rounded-token-md p-12 text-center">
          <Package
            className="h-12 w-12 text-ink-muted mx-auto mb-4"
            strokeWidth={1.2}
          />
          <p className="text-base text-ink-strong font-medium mb-2">
            Nenhum produto cadastrado
          </p>
          <p className="text-sm text-ink-soft mb-6">
            Comece criando seu primeiro produto.
          </p>
          <Link href="/admin/produtos/novo">
            <Button className="loreal-btn-pill h-11 px-6 bg-brand-wine text-brand-pink text-[11px] font-medium tracking-[0.18em] uppercase">
              Criar primeiro produto
            </Button>
          </Link>
        </div>
      ) : (
        <div className="bg-surface-panel rounded-token-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-surface-section">
                <tr>
                  <th className="text-left py-3 px-5 text-[10px] tracking-[0.18em] uppercase font-medium text-ink-soft">
                    Produto
                  </th>
                  <th className="text-left py-3 px-5 text-[10px] tracking-[0.18em] uppercase font-medium text-ink-soft">
                    Estado
                  </th>
                  <th className="text-left py-3 px-5 text-[10px] tracking-[0.18em] uppercase font-medium text-ink-soft">
                    Coleção
                  </th>
                  <th className="text-right py-3 px-5 text-[10px] tracking-[0.18em] uppercase font-medium text-ink-soft">
                    Preço
                  </th>
                  <th className="text-right py-3 px-5 text-[10px] tracking-[0.18em] uppercase font-medium text-ink-soft">
                    Estoque
                  </th>
                  <th className="text-right py-3 px-5 text-[10px] tracking-[0.18em] uppercase font-medium text-ink-soft">
                    Vendidos
                  </th>
                  <th className="text-right py-3 px-5 text-[10px] tracking-[0.18em] uppercase font-medium text-ink-soft">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => {
                  const statusInfo = STATUS_BADGE[p.status];
                  const effectivePromo = getEffectivePromotion(
                    {
                      status: p.status,
                      originalPrice:
                        p.originalPrice != null ? Number(p.originalPrice) : null,
                      promotionStartsAt: p.promotionStartsAt,
                      promotionEndsAt: p.promotionEndsAt,
                    },
                    now,
                  );
                  const promoStale = isPromotionStale(p, now);
                  const promoEndsRel = relativeEnd(p.promotionEndsAt, now);

                  return (
                    <tr
                      key={p.id}
                      className="border-t border-border-subtle hover:bg-surface-section/50 transition-colors"
                    >
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-3">
                          <div className="relative w-12 h-12 rounded-token-sm overflow-hidden bg-surface-section flex-shrink-0">
                            {p.images[0] && (
                              <Image
                                src={productImageSrc(p.images[0])}
                                alt={p.name}
                                fill
                                className="object-cover"
                                sizes="48px"
                              />
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-ink-strong line-clamp-1">
                              {p.name}
                            </p>
                            <p className="text-xs text-ink-muted">{p.slug}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-5">
                        <div className="flex flex-col items-start gap-1">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-[0.14em] ${statusInfo.classes}`}
                          >
                            {statusInfo.label}
                          </span>
                          {promoStale && (
                            <span className="inline-flex items-center gap-1 text-[10px] text-amber-700 font-medium">
                              <AlertTriangle className="h-3 w-3" />
                              promo expirou — revisar
                            </span>
                          )}
                          {p.isLimitedEdition && (
                            <span className="text-[10px] text-ink-muted">
                              Ed. limitada
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-5 text-sm text-ink-soft capitalize">
                        {p.collection}
                      </td>
                      <td className="py-4 px-5 text-right">
                        <div className="flex flex-col items-end">
                          <span className="text-sm font-medium text-brand-wine">
                            {formatPrice(Number(p.price))}
                          </span>
                          {effectivePromo && (
                            <>
                              <span className="text-[10px] text-ink-muted line-through">
                                {formatPrice(effectivePromo.originalPrice)}
                              </span>
                              {promoEndsRel && (
                                <span className="text-[10px] text-amber-700 font-medium">
                                  termina em {promoEndsRel}
                                </span>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-5 text-right">
                        <span
                          className={`text-sm font-medium tabular-nums ${
                            p.stock < 5
                              ? "text-destructive"
                              : p.stock < 20
                                ? "text-amber-600"
                                : "text-ink-strong"
                          }`}
                        >
                          {p.stock}
                        </span>
                      </td>
                      <td className="py-4 px-5 text-right text-sm text-ink-soft tabular-nums">
                        {p.totalSold}
                      </td>
                      <td className="py-4 px-5 text-right">
                        <Link
                          href={`/admin/produtos/${p.id}/editar`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[10px] tracking-[0.18em] uppercase text-brand-wine border border-brand-wine/20 rounded-full hover:bg-brand-wine hover:text-brand-pink transition-colors"
                        >
                          <Pencil className="h-3 w-3" />
                          Editar
                        </Link>
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
