"use client";

/**
 * FeatureProducts — Belessence (estilo Stitch / "Destaques")
 * ─────────────────────────────────────────────────────────────────────
 * Grid limpo de 4 produtos com cards minimalistas (sem carousel, sem rating).
 * Estética Stitch: bg cream, cards brancos, hover sutil, preço destacado.
 */

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ShoppingBag, ArrowRight } from "lucide-react";
import { useCart } from "./cart";
import type { Product } from "@/lib/products-db";
import Link from "next/link";
import { formatPrice } from "@/api/utils";
import Image from "next/image";

gsap.registerPlugin(ScrollTrigger);

type BadgeVariant = "default" | "secondary" | "destructive" | "outline";

function toBadgeVariant(value: string | null): BadgeVariant | undefined {
  if (value === "default" || value === "secondary" || value === "destructive" || value === "outline") {
    return value;
  }
  return undefined;
}

interface FeatureProductsProps {
  products: Product[];
}

export default function FeatureProducts({ products }: FeatureProductsProps) {
  const { addToCart } = useCart();
  const sectionRef = useRef<HTMLElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  // ── Animação de entrada ────────────────────────────────────────────────────
  useGSAP(
    () => {
      const reduced = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;
      if (reduced || !gridRef.current) return;

      const cards = gridRef.current.querySelectorAll("[data-product-card]");
      if (cards.length > 0) {
        gsap.from(cards, {
          opacity: 0,
          y: 30,
          duration: 0.7,
          stagger: 0.12,
          ease: "power3.out",
          scrollTrigger: {
            trigger: gridRef.current,
            start: "top 85%",
          },
        });
      }
    },
    { scope: sectionRef },
  );

  // Limita a 4 produtos para o grid limpo do Stitch
  const displayProducts = products.slice(0, 4);

  if (displayProducts.length === 0) return null;

  return (
    <section
      ref={sectionRef}
      className="py-16 sm:py-24 md:py-28 bg-surface-base"
    >
      <div className="container-belessence">
        {/* Heading */}
        <div className="text-center mb-12 sm:mb-16">
          <p className="text-[11px] font-medium tracking-[0.32em] uppercase text-brand-wine mb-4">
            Seleção da semana
          </p>
          <h2 className="font-playfair italic text-[clamp(2rem,4.5vw,3.4rem)] leading-tight tracking-[-0.02em] text-ink-strong">
            Destaques
          </h2>
          <div className="mx-auto mt-5 h-px w-12 bg-brand-wine/60" />
        </div>

        {/* Grid 4 produtos */}
        <div
          ref={gridRef}
          className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6"
        >
          {displayProducts.map((product) => {
            const price = Number(product.price);
            const originalPrice = product.originalPrice
              ? Number(product.originalPrice)
              : null;

            return (
              <article
                key={product.id}
                data-product-card
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
                    sizes="(max-width: 768px) 50vw, 280px"
                  />

                  {/* Add to cart — flutuante no hover */}
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

                  <div className="flex items-center justify-center gap-2">
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
                    className="inline-flex items-center gap-1.5 mt-3 text-[10px] font-medium tracking-[0.24em] uppercase text-ink-soft transition-colors hover:text-brand-wine"
                  >
                    Ver detalhes
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              </article>
            );
          })}
        </div>

        {/* CTA "Ver mais" */}
        <div className="text-center mt-12 sm:mt-16">
          <Link
            href="/allProducts"
            className="inline-flex items-center gap-2 text-xs font-medium tracking-[0.24em] uppercase text-brand-wine border-b border-brand-wine/40 pb-1 hover:border-brand-wine transition-colors"
          >
            Ver toda a coleção
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </div>
    </section>
  );
}
