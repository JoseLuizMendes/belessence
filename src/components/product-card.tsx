"use client";

/**
 * ProductCard — Belessence
 * ─────────────────────────────────────────────────────────────────────
 * Card de produto compartilhado por:
 *  - feature-products.tsx (Destaques)
 *  - products-grid.tsx (PLP)
 *  - favoritos-client.tsx (Favoritos)
 *  - product/[slug] (Você Também Vai Amar)
 *
 * Prioridade visual de badges (do mais forte ao mais fraco):
 *   1. Esgotado (stock=0) — overlay de compra
 *   2. Em breve (status=COMING_SOON) — overlay de compra
 *   3. Promoção (status=PROMOTION + janela ativa)
 *   4. Edição limitada (flag)
 *   5. Lançamento (auto via createdAt OU markedAsNewUntil)
 *
 * Esgotado vence o overlay de compra, mas o badge de "Promoção" continua
 * visível para a usuária entender que o produto volta a comprar com desconto
 * quando o estoque for reposto dentro da janela.
 */

import Link from "next/link";
import Image from "next/image";
import { ShoppingBag, Ban, Clock } from "lucide-react";
import { formatPrice } from "@/shadcn-utils/utils";
import { useCart } from "./cart";
import { WishlistButton } from "./wishlist-button";
import { useRequireAuth } from "@/lib/hooks/use-require-auth";
import { productImageSrc } from "@/lib/product-image";
import {
  getEffectivePromotion,
  isEffectivelyNew,
} from "@/lib/product-status";
import type { Product } from "@/lib/products-db";
import type { ProductStatus } from "@prisma/client";

type BadgeVariant = "default" | "secondary" | "destructive" | "outline";

function toBadgeVariant(value: string | null | undefined): BadgeVariant | undefined {
  if (
    value === "default" ||
    value === "secondary" ||
    value === "destructive" ||
    value === "outline"
  ) {
    return value;
  }
  return undefined;
}

export interface ProductCardProps {
  product: Pick<
    Product,
    | "id"
    | "slug"
    | "name"
    | "shortDescription"
    | "price"
    | "originalPrice"
    | "badge"
    | "badgeVariant"
    | "images"
  > & {
    /** Opcional: quando ausente, assume em estoque. */
    stock?: number;
    /** Opcional: quando ausente, assume NORMAL. */
    status?: ProductStatus;
    isLimitedEdition?: boolean;
    markedAsNewUntil?: Date | null;
    promotionStartsAt?: Date | null;
    promotionEndsAt?: Date | null;
    createdAt?: Date;
  };
  /** Repasse para Image: prioritize na LCP. */
  priority?: boolean;
  /** Repasse para Image: sizes responsivos. */
  sizes?: string;
  /** Define o atributo data-* para hooks de animação (default: data-product-card). */
  animateAttr?: "data-product-card" | "data-animate-card";
}

export function ProductCard({
  product,
  priority = false,
  sizes = "(max-width: 768px) 50vw, 33vw",
  animateAttr = "data-product-card",
}: ProductCardProps) {
  const { addToCart } = useCart();
  const requireAuth = useRequireAuth();

  const price = Number(product.price);
  const status: ProductStatus = product.status ?? "NORMAL";

  // Promo "efetiva" considera a janela startsAt/endsAt; pode retornar null mesmo
  // se status=PROMOTION (admin não fez cleanup, mas janela expirou).
  const effectivePromo = getEffectivePromotion({
    status,
    originalPrice: product.originalPrice != null ? Number(product.originalPrice) : null,
    promotionStartsAt: product.promotionStartsAt ?? null,
    promotionEndsAt: product.promotionEndsAt ?? null,
  });

  // Só riscamos preço se a promo está EFETIVAMENTE ativa.
  const displayOriginalPrice = effectivePromo ? effectivePromo.originalPrice : null;

  const isOutOfStock = typeof product.stock === "number" && product.stock <= 0;
  const isComingSoon = status === "COMING_SOON";
  const isDiscontinued = status === "DISCONTINUED";

  // Botão de compra só fica disponível se: tem estoque, não é COMING_SOON e não é DISCONTINUED.
  const purchasable = !isOutOfStock && !isComingSoon && !isDiscontinued;

  // Lançamento auto/manual — só faz sentido se temos createdAt (Product completo).
  const showNewBadge =
    !effectivePromo &&
    !isComingSoon &&
    product.createdAt != null &&
    isEffectivelyNew({
      createdAt: product.createdAt,
      markedAsNewUntil: product.markedAsNewUntil ?? null,
    });

  const animProps = { [animateAttr]: true } as Record<string, boolean>;

  return (
    <article
      {...animProps}
      className="group flex flex-col bg-surface-panel rounded-token-xl overflow-hidden transition-all duration-500 hover:-translate-y-1 hover:shadow-card-hover"
    >
      {/* Imagem + overlays */}
      <Link
        href={`/product/${product.slug}`}
        className="relative block overflow-hidden aspect-[3/4] bg-surface-section"
        aria-label={`${product.name}${isOutOfStock ? " — esgotado" : isComingSoon ? " — em breve" : ""}`}
      >
        <Image
          src={productImageSrc(product.images[0])}
          alt={product.name}
          fill
          priority={priority}
          sizes={sizes}
          className={[
            "object-cover transition-transform duration-700 ease-out group-hover:scale-105",
            isOutOfStock || isDiscontinued ? "opacity-70 grayscale-[0.2]" : "",
          ].join(" ")}
        />

        {/* Stack de badges no topo-esquerda */}
        <div className="absolute top-3 left-3 flex flex-col items-start gap-1.5">
          {isOutOfStock && (
            <span className="inline-flex items-center rounded-full bg-ink-strong px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.16em] text-brand-pink shadow-card">
              Esgotado
            </span>
          )}
          {isDiscontinued && !isOutOfStock && (
            <span className="inline-flex items-center rounded-full bg-ink-muted px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.16em] text-surface-base shadow-card">
              Fora de linha
            </span>
          )}
          {isComingSoon && (
            <span className="inline-flex items-center rounded-full bg-blue-700 px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.16em] text-white shadow-card">
              Em breve
            </span>
          )}
          {effectivePromo && (
            <span className="inline-flex items-center rounded-full bg-brand-wine px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.16em] text-brand-pink animate-pulse-slow">
              Promoção
            </span>
          )}
          {product.isLimitedEdition && (
            <span className="inline-flex items-center rounded-full bg-amber-600 px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.16em] text-white">
              Ed. limitada
            </span>
          )}
          {showNewBadge && (
            <span className="inline-flex items-center rounded-full bg-emerald-600 px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.16em] text-white">
              Lançamento
            </span>
          )}
        </div>

        {/* Wishlist — sempre disponível, mesmo em esgotado/coming-soon */}
        <div className="absolute top-3 right-3">
          <WishlistButton productId={product.id} productName={product.name} />
        </div>

        {/* Botão de compra (ou ícone de bloqueio) */}
        {purchasable ? (
          <button
            type="button"
            aria-label={`Adicionar ${product.name} ao carrinho`}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              requireAuth(() =>
                addToCart({
                  id: product.id,
                  slug: product.slug,
                  name: product.name,
                  shortDescription: product.shortDescription,
                  price,
                  originalPrice: displayOriginalPrice ?? undefined,
                  badge: product.badge ?? undefined,
                  badgeVariant: toBadgeVariant(product.badgeVariant),
                  image: product.images[0],
                }),
              );
            }}
            className="absolute bottom-3 right-3 flex h-10 w-10 items-center justify-center rounded-full bg-brand-wine text-brand-pink shadow-card opacity-0 scale-90 transition-all duration-300 group-hover:opacity-100 group-hover:scale-100 hover:bg-ink-strong focus-visible:opacity-100 focus-visible:scale-100"
          >
            <ShoppingBag className="h-4 w-4" strokeWidth={1.5} />
          </button>
        ) : (
          <span
            aria-disabled
            title={
              isOutOfStock
                ? "Produto esgotado"
                : isComingSoon
                  ? "Em breve"
                  : "Fora de linha"
            }
            className="absolute bottom-3 right-3 flex h-10 w-10 items-center justify-center rounded-full bg-ink-soft/80 text-brand-pink shadow-card opacity-0 scale-90 transition-all duration-300 group-hover:opacity-100 group-hover:scale-100 pointer-events-none"
          >
            {isComingSoon ? (
              <Clock className="h-4 w-4" strokeWidth={1.5} />
            ) : (
              <Ban className="h-4 w-4" strokeWidth={1.5} />
            )}
          </span>
        )}
      </Link>

      {/* Info */}
      <div className="p-4 sm:p-5 text-center">
        <Link href={`/product/${product.slug}`}>
          <h3 className="font-playfair italic text-base sm:text-lg leading-snug text-ink-strong transition-opacity hover:opacity-70 line-clamp-2 mb-2">
            {product.name}
          </h3>
        </Link>

        <div className="flex items-center justify-center gap-2 mb-3">
          {displayOriginalPrice != null && (
            <span className="text-xs text-ink-muted line-through">
              {formatPrice(displayOriginalPrice)}
            </span>
          )}
          <span
            className={[
              "price-display text-base sm:text-lg font-semibold",
              isOutOfStock || isDiscontinued
                ? "text-ink-muted"
                : "text-brand-wine",
            ].join(" ")}
          >
            {formatPrice(price)}
          </span>
        </div>

        <Link
          href={`/product/${product.slug}`}
          className="inline-flex items-center gap-1.5 text-[10px] font-medium tracking-[0.24em] uppercase text-ink-soft transition-colors hover:text-brand-wine"
        >
          {isOutOfStock ? "Avise-me" : isComingSoon ? "Saiba mais" : "Ver detalhes"}
        </Link>
      </div>
    </article>
  );
}

export default ProductCard;
