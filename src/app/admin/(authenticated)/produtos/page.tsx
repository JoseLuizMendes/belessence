/**
 * /admin/produtos — Lista de produtos
 * ─────────────────────────────────────────────────────────────────────
 * Desktop: tabela densa via DataTable (shadcn Table + estética admin).
 * Mobile:  cards verticais com a mesma informação resumida.
 * Coluna "Estado" usa ProductStatus + aviso quando promo expirada precisa
 * de cleanup manual.
 */

import { prisma } from "@/lib/shared/infrastructure/prisma-client";
import Link from "next/link";
import Image from "next/image";
import { formatPrice } from "@/shadcn-utils/utils";
import { Button } from "@/components/ui/button";
import { TableBody, TableCell } from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Plus, Pencil, Package, AlertTriangle } from "lucide-react";
import { productImageSrc } from "@/lib/product-image";
import {
  getEffectivePromotion,
  isPromotionStale,
} from "@/lib/product-status";
import type { ProductStatus } from "@prisma/client";

import { PageHeader } from "@/components/admin/page-header";
import { EmptyState } from "@/components/admin/empty-state";
import { StatusPill, type StatusTone } from "@/components/admin/status-pill";
import {
  DataTable,
  DataTableHeader,
  DataTableRow,
} from "@/components/admin/data-table";

const STATUS_INFO: Record<
  ProductStatus,
  { label: string; tone: StatusTone }
> = {
  NORMAL: { label: "Normal", tone: "neutral" },
  PROMOTION: { label: "Promoção", tone: "alert" },
  COMING_SOON: { label: "Em breve", tone: "progress" },
  DISCONTINUED: { label: "Descontinuado", tone: "muted" },
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
  const countLabel = `${products.length} ${products.length === 1 ? "produto" : "produtos"} no catálogo`;

  return (
    <div>
      <PageHeader
        eyebrow="Catálogo"
        title="Produtos"
        description={countLabel}
        action={
          <Link href="/admin/produtos/novo">
            <Button className="loreal-btn-pill h-11 px-6 btn-wine text-[11px] font-medium tracking-[0.18em] uppercase">
              <Plus className="mr-2 h-4 w-4" />
              Novo produto
            </Button>
          </Link>
        }
      />

      {products.length === 0 ? (
        <EmptyState
          icon={<Package strokeWidth={1.2} />}
          title="Nenhum produto cadastrado"
          description="Comece criando seu primeiro produto. O cadastro inclui galeria, coleção, preço e status."
          action={
            <Link href="/admin/produtos/novo">
              <Button className="loreal-btn-pill h-11 px-6 btn-wine text-[11px] font-medium tracking-[0.18em] uppercase">
                Criar primeiro produto
              </Button>
            </Link>
          }
        />
      ) : (
        <>
          {/* Mobile: cards (< md) */}
          <ul className="md:hidden flex flex-col gap-3">
            {products.map((p) => {
              const statusInfo = STATUS_INFO[p.status];
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
                <li
                  key={p.id}
                  className="bg-admin-panel border border-admin rounded-token-md p-4 flex gap-3 shadow-petal-1"
                >
                  <div className="relative w-16 h-16 rounded-token-sm overflow-hidden bg-admin-panel-soft flex-shrink-0">
                    {p.images[0] && (
                      <Image
                        src={productImageSrc(p.images[0])}
                        alt={p.name}
                        fill
                        className="object-cover"
                        sizes="64px"
                      />
                    )}
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col gap-1.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-ink-strong line-clamp-1">
                          {p.name}
                        </p>
                        <p className="text-[11px] text-ink-muted capitalize">
                          {p.collection}
                        </p>
                      </div>
                      <TooltipProvider delayDuration={200}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Link
                              href={`/admin/produtos/${p.id}/editar`}
                              aria-label={`Editar ${p.name}`}
                              className="inline-flex items-center justify-center h-8 w-8 rounded-full text-brand-wine border border-brand-wine/20 hover:bg-brand-wine hover:text-brand-pink transition-colors flex-shrink-0 focus-ring"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Link>
                          </TooltipTrigger>
                          <TooltipContent>Editar produto</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5">
                      <StatusPill tone={statusInfo.tone}>
                        {statusInfo.label}
                      </StatusPill>
                      {p.isLimitedEdition && (
                        <span className="text-[10px] text-ink-muted">
                          Ed. limitada
                        </span>
                      )}
                      {promoStale && (
                        <span className="inline-flex items-center gap-1 text-[10px] text-amber-700 font-medium">
                          <AlertTriangle className="h-3 w-3" />
                          promo expirou
                        </span>
                      )}
                    </div>

                    <div className="flex items-end justify-between gap-2 mt-0.5">
                      <div className="flex flex-col">
                        <span className="font-data text-sm font-medium text-brand-wine">
                          {formatPrice(Number(p.price))}
                        </span>
                        {effectivePromo && (
                          <span className="text-[10px] text-ink-muted line-through font-data">
                            {formatPrice(effectivePromo.originalPrice)}
                            {promoEndsRel && (
                              <span className="ml-1 text-amber-700 font-medium no-underline">
                                · termina em {promoEndsRel}
                              </span>
                            )}
                          </span>
                        )}
                      </div>
                      <div className="text-right text-[11px] text-ink-soft font-data">
                        <p>
                          Estoque:{" "}
                          <span
                            className={`font-medium ${
                              p.stock < 5
                                ? "text-destructive"
                                : p.stock < 20
                                  ? "text-amber-600"
                                  : "text-ink-strong"
                            }`}
                          >
                            {p.stock}
                          </span>
                        </p>
                        <p>Vendidos: {p.totalSold}</p>
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>

          {/* Desktop/tablet: tabela (md+) */}
          <DataTable>
            <DataTableHeader
              columns={[
                { key: "produto", label: "Produto" },
                { key: "estado", label: "Estado" },
                { key: "colecao", label: "Coleção" },
                { key: "preco", label: "Preço", align: "right" },
                { key: "estoque", label: "Estoque", align: "right" },
                { key: "vendidos", label: "Vendidos", align: "right" },
                { key: "acoes", label: "Ações", align: "right" },
              ]}
            />
            <TableBody>
              {products.map((p) => {
                const statusInfo = STATUS_INFO[p.status];
                const effectivePromo = getEffectivePromotion(
                  {
                    status: p.status,
                    originalPrice:
                      p.originalPrice != null
                        ? Number(p.originalPrice)
                        : null,
                    promotionStartsAt: p.promotionStartsAt,
                    promotionEndsAt: p.promotionEndsAt,
                  },
                  now,
                );
                const promoStale = isPromotionStale(p, now);
                const promoEndsRel = relativeEnd(p.promotionEndsAt, now);

                return (
                  <DataTableRow key={p.id}>
                    <TableCell className="py-4 px-5">
                      <div className="flex items-center gap-3">
                        <div className="relative w-12 h-12 rounded-token-sm overflow-hidden bg-admin-panel-soft flex-shrink-0">
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
                    </TableCell>
                    <TableCell className="py-4 px-5">
                      <div className="flex flex-col items-start gap-1.5">
                        <StatusPill tone={statusInfo.tone}>
                          {statusInfo.label}
                        </StatusPill>
                        {promoStale && (
                          <span className="inline-flex items-center gap-1 text-[10px] text-amber-700 font-medium">
                            <AlertTriangle className="h-3 w-3" />
                            promo expirou, revisar
                          </span>
                        )}
                        {p.isLimitedEdition && (
                          <span className="text-[10px] text-ink-muted">
                            Ed. limitada
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="py-4 px-5 text-sm text-ink-soft capitalize">
                      {p.collection}
                    </TableCell>
                    <TableCell className="py-4 px-5 text-right">
                      <div className="flex flex-col items-end">
                        <span className="font-data text-sm font-medium text-brand-wine">
                          {formatPrice(Number(p.price))}
                        </span>
                        {effectivePromo && (
                          <>
                            <span className="font-data text-[10px] text-ink-muted line-through">
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
                    </TableCell>
                    <TableCell className="py-4 px-5 text-right">
                      <span
                        className={`font-data text-sm font-medium ${
                          p.stock < 5
                            ? "text-destructive"
                            : p.stock < 20
                              ? "text-amber-600"
                              : "text-ink-strong"
                        }`}
                      >
                        {p.stock}
                      </span>
                    </TableCell>
                    <TableCell className="py-4 px-5 text-right font-data text-sm text-ink-soft">
                      {p.totalSold}
                    </TableCell>
                    <TableCell className="py-4 px-5 text-right">
                      <Button
                        asChild
                        variant="outline"
                        size="sm"
                        className="rounded-full text-[10px] tracking-[0.18em] uppercase text-brand-wine border-brand-wine/25 hover:bg-brand-wine hover:text-brand-pink hover:border-brand-wine"
                      >
                        <Link href={`/admin/produtos/${p.id}/editar`}>
                          <Pencil className="h-3 w-3" />
                          Editar
                        </Link>
                      </Button>
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

