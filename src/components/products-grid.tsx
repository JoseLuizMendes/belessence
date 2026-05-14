"use client";

/**
 * ProductsGrid — Belessence (estilo Stitch / Coleção PLP)
 * ─────────────────────────────────────────────────────────────────────
 * Grid limpo 3 colunas com cards brancos minimalistas.
 * - Imagem aspect 3/4 com bg cream
 * - Nome em serif italic
 * - Preço em bordô destacado
 * - Add to bag flutuante no hover
 */

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { ShoppingBag } from "lucide-react";
import { staggerIn } from "@/lib/gsap-utils";
import { useCart } from "@/components/cart";
import Link from "next/link";
import { formatPrice } from "@/api/utils";
import Image from "next/image";
import type { Product } from "@/lib/products-db";

interface ProductsGridProps {
  products: Product[];
}

type BadgeVariant = "default" | "secondary" | "destructive" | "outline";

function toBadgeVariant(value: string | null): BadgeVariant | undefined {
  if (value === "default" || value === "secondary" || value === "destructive" || value === "outline") {
    return value;
  }
  return undefined;
}

export default function ProductsGrid({ products }: ProductsGridProps) {
  const { addToCart } = useCart();
  const gridRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    if (!gridRef.current) return;
    const cards = gridRef.current.querySelectorAll("[data-animate-card]");
    if (cards.length > 0) {
      staggerIn(cards, { y: 24, duration: 0.55, stagger: 0.08, delay: 0.1 });
    }
  }, { scope: gridRef });

  return (
    <div
      ref={gridRef}
      className="grid grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8"
    >
      {products.map((product) => {
        const price = Number(product.price);
        const originalPrice = product.originalPrice ? Number(product.originalPrice) : null;

        return (
          <article
            key={product.id}
            data-animate-card
            className="group flex flex-col bg-surface-panel rounded-token-sm overflow-hidden transition-all duration-500 hover:shadow-card-hover"
          >
            {/* Imagem */}
            <Link
              href={`/product/${product.slug}`}
              className="relative block overflow-hidden aspect-[3/4] bg-surface-section"
            >
              <Image
                src={product.images[0]}
                alt={product.name}
                fill
                className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                sizes="(max-width: 768px) 50vw, 33vw"
              />

              {/* Badge top-left */}
              {product.badge && (
                <span className="absolute top-3 left-3 inline-flex items-center rounded-full bg-brand-wine px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.16em] text-brand-pink">
                  {product.badge}
                </span>
              )}

              {/* Add to bag — flutuante no hover */}
              <button
                aria-label={`Adicionar ${product.name} ao carrinho`}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  addToCart({
                    id: product.id,
                    slug: product.slug,
                    name: product.name,
                    shortDescription: product.shortDescription,
                    price,
                    originalPrice: originalPrice ?? undefined,
                    badge: product.badge ?? undefined,
                    badgeVariant: toBadgeVariant(product.badgeVariant),
                    image: product.images[0],
                  });
                }}
                className="absolute bottom-3 right-3 flex h-10 w-10 items-center justify-center rounded-full bg-brand-wine text-brand-pink shadow-card opacity-0 translate-y-2 transition-all duration-300 group-hover:opacity-100 group-hover:translate-y-0 hover:bg-ink-strong"
              >
                <ShoppingBag className="h-4 w-4" strokeWidth={1.5} />
              </button>
            </Link>

            {/* Info */}
            <div className="p-4 sm:p-5 text-center">
              <Link href={`/product/${product.slug}`}>
                <h3 className="font-playfair italic text-base sm:text-lg leading-snug text-ink-strong transition-opacity hover:opacity-70 line-clamp-2 mb-2">
                  {product.name}
                </h3>
              </Link>

              <div className="flex items-center justify-center gap-2 mb-3">
                {originalPrice && (
                  <span className="text-xs text-ink-muted line-through">
                    {formatPrice(originalPrice)}
                  </span>
                )}
                <span className="price-display text-base sm:text-lg font-semibold text-brand-wine">
                  {formatPrice(price)}
                </span>
              </div>

              <Link
                href={`/product/${product.slug}`}
                className="inline-flex items-center gap-1.5 text-[10px] font-medium tracking-[0.24em] uppercase text-ink-soft transition-colors hover:text-brand-wine"
              >
                Ver detalhes
              </Link>
            </div>
          </article>
        );
      })}
    </div>
  );
}
