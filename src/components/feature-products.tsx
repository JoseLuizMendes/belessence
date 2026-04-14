"use client";

/**
 * FeatureProducts — Belessence Product Showcase Carousel
 * Regra de negócio: O'Boticário showcase gondola
 *   - Desconto % calculado de originalPrice vs price
 *   - Parcelas (3x para todos — sem juros, luxo acessível)
 *   - Badge/cupom com estilo pill
 *   - Rating com estrelas + contagem de avaliações
 *   - Preço original (riscado) + preço promocional
 *   - Botão de adicionar ao carrinho + botão de favoritos
 * Estética: L'Oréal/Byredo — surface clara, cards minimalistas
 * Zero style={} com valores hardcoded
 */

import { useRef, useCallback, useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ShoppingBag, Star, Heart, ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
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

/** Calcula desconto % arredondado */
function calcDiscount(price: number, originalPrice: number | null): number | null {
  if (!originalPrice || originalPrice <= price) return null;
  return Math.round(((originalPrice - price) / originalPrice) * 100);
}

/** Calcula parcelas — 3x sem juros para toda a linha Belessence */
function calcInstallments(price: number): { n: number; value: string } {
  const n = price >= 150 ? 3 : 2;
  return { n, value: formatPrice(price / n) };
}

/** Renderiza estrelas (svg simples, sem lib extra) */
function StarRating({ rating, reviews }: { rating: number; reviews: number }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-3 w-3 ${
              star <= Math.round(rating)
                ? "fill-current text-brand-gold"
                : "fill-transparent text-ink-muted"
            }`}
            strokeWidth={1.5}
          />
        ))}
      </div>
      {reviews > 0 && (
        <span className="text-[11px] text-ink-muted">
          {reviews.toLocaleString("pt-BR")} avaliações
        </span>
      )}
    </div>
  );
}

interface FeatureProductsProps {
  products: Product[];
}

export default function FeatureProducts({ products }: FeatureProductsProps) {
  const { addToCart } = useCart();
  const sectionRef   = useRef<HTMLElement>(null);
  const headingRef   = useRef<HTMLDivElement>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: false,
    align: "start",
    dragFree: false,
  });

  // ── Sincronizar índice para controles ────────────────────────────────────
  useEffect(() => {
    if (!emblaApi) return;
    const onSelect = () => setSelectedIndex(emblaApi.selectedScrollSnap());
    emblaApi.on("select", onSelect);
    return () => { emblaApi.off("select", onSelect); };
  }, [emblaApi]);

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

  // ── Heading scroll reveal ────────────────────────────────────────────────
  useGSAP(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced || !headingRef.current) return;
    gsap.from(headingRef.current, {
      opacity: 0, y: 24, duration: 0.85, ease: "power4.out",
      scrollTrigger: { trigger: headingRef.current, start: "top 85%" },
    });
  }, { scope: sectionRef });

  return (
    <section
      ref={sectionRef}
      className="py-20 md:py-28 bg-surface-section overflow-hidden"
    >
      {/* ── Cabeçalho: título + "Veja mais" + controles ──────────────────── */}
      <div
        ref={headingRef}
        className="container-belessence mb-10 md:mb-14 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"
      >
        <div>
          <p className="eyebrow mb-3 text-brand-gold">Seleção da Semana</p>
          <h2 className="display-title text-ink-strong text-[clamp(1.75rem,4vw,3rem)]">
            Destaques
          </h2>
          <div className="mt-4 h-px w-12 divider-gold" />
        </div>

        <div className="flex items-center gap-4">
          {/* "Veja mais" — O'Boticário pattern */}
          <Link
            href="/allProducts"
            className="flex items-center gap-1.5 text-sm font-medium tracking-[0.06em] text-ink-soft transition-colors hover:text-brand-gold"
          >
            Veja Mais
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>

          {/* Navegação */}
          <div className="flex gap-2">
            <button
              onClick={scrollPrev}
              aria-label="Produto anterior"
              className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-ink-muted/30 text-ink-soft transition-all hover:border-brand-gold hover:text-brand-gold disabled:opacity-30"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={scrollNext}
              aria-label="Próximo produto"
              className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-ink-muted/30 text-ink-soft transition-all hover:border-brand-gold hover:text-brand-gold"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ── Trilho Embla ─────────────────────────────────────────────────── */}
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex gap-4 pl-[max(1rem,calc((100vw-var(--container-belessence,1200px))/2))] pr-4 md:gap-6">
          {products.map((product) => {
            const price         = Number(product.price);
            const originalPrice = product.originalPrice ? Number(product.originalPrice) : null;
            const discount      = calcDiscount(price, originalPrice);
            const installments  = calcInstallments(price);

            return (
              <article
                key={product.id}
                className="group flex flex-col shrink-0 rounded-token-sm bg-surface-base overflow-hidden shadow-card transition-shadow duration-300 hover:shadow-card-hover"
                style={{ flex: "0 0 min(76vw, 280px)" }}
              >
                {/* ── Imagem ─────────────────────────────────────────── */}
                <Link
                  href={`/product/${product.slug}`}
                  className="relative block overflow-hidden"
                  style={{ aspectRatio: "3/4" }}
                >
                  <Image
                    src={product.images[0]}
                    alt={product.name}
                    fill
                    className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
                    sizes="(max-width: 768px) 76vw, 280px"
                  />

                  {/* Overlay hover sutil */}
                  <div className="absolute inset-0 bg-ink-overlay-soft opacity-0 transition-opacity duration-400 group-hover:opacity-100" />

                  {/* Desconto % badge — O'Boticário pattern */}
                  {discount && (
                    <div className="absolute top-3 left-3 rounded-token-xs bg-red-600 px-2 py-1 text-[10px] font-semibold tracking-wider text-white">
                      -{discount}%
                    </div>
                  )}

                  {/* Favoritos — O'Boticário pattern (wishlist) */}
                  <button
                    aria-label={`Adicionar ${product.name} aos favoritos`}
                    className="absolute top-3 right-3 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-surface-base/80 backdrop-blur-sm text-ink-soft transition-all hover:text-red-500"
                    onClick={(e) => { e.preventDefault(); /* futura wishlist */ }}
                  >
                    <Heart className="h-4 w-4" strokeWidth={1.5} />
                  </button>

                  {/* Add to cart — aparece no hover, O'Boticário pattern */}
                  <div className="absolute bottom-0 inset-x-0 translate-y-2 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
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
                      className="flex w-full cursor-pointer items-center justify-center gap-2 bg-brand-gold py-3 text-xs font-medium tracking-[0.10em] uppercase text-ink-strong transition-colors hover:bg-brand-gold-light"
                    >
                      <ShoppingBag className="h-3.5 w-3.5" strokeWidth={1.5} />
                      Adicionar ao Carrinho
                    </button>
                  </div>
                </Link>

                {/* ── Info do produto ─────────────────────────────────── */}
                <div className="flex flex-col gap-2 p-4">

                  {/* Badge/cupom — O'Boticário label pill */}
                  {product.badge && (
                    <span className="inline-flex w-fit items-center rounded-full bg-brand-gold/15 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.10em] text-brand-gold">
                      {product.badge}
                    </span>
                  )}

                  {/* Rating */}
                  <StarRating
                    rating={Number(product.rating)}
                    reviews={product.reviews}
                  />

                  {/* Nome do produto */}
                  <Link href={`/product/${product.slug}`}>
                    <h3 className="font-playfair text-[1rem] font-normal leading-snug tracking-[-0.01em] text-ink-strong transition-opacity hover:opacity-70 line-clamp-2">
                      {product.name}
                    </h3>
                  </Link>

                  {/* Descrição curta */}
                  <p className="text-xs font-light leading-relaxed text-ink-soft line-clamp-2">
                    {product.shortDescription}
                  </p>

                  {/* Bloco de preço — O'Boticário pattern */}
                  <div className="mt-1 flex flex-col gap-0.5">
                    {/* Preço original riscado */}
                    {originalPrice && (
                      <span className="text-xs text-ink-muted line-through">
                        {formatPrice(originalPrice)}
                      </span>
                    )}
                    {/* Preço atual */}
                    <span className="price-display text-xl font-semibold text-ink-strong">
                      {formatPrice(price)}
                    </span>
                    {/* Parcelas */}
                    <span className="text-xs text-ink-soft">
                      em até {installments.n}x de {installments.value} sem juros
                    </span>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>

      {/* ── Dots de progresso ─────────────────────────────────────────────── */}
      <div className="container-belessence mt-8 flex justify-center gap-2">
        {products.map((_, i) => (
          <button
            key={i}
            aria-label={`Ir para produto ${i + 1}`}
            onClick={() => emblaApi?.scrollTo(i)}
            className={`h-px cursor-pointer transition-all duration-300 focus-visible:outline-none ${
              i === selectedIndex
                ? "w-6 bg-brand-gold"
                : "w-3 bg-ink-muted/30 hover:bg-ink-muted/60"
            }`}
          />
        ))}
      </div>
    </section>
  );
}
