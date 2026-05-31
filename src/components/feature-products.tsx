"use client";

/**
 * FeatureProducts — Belessence (estilo Stitch / "Destaques")
 * ─────────────────────────────────────────────────────────────────────
 * Grid limpo de 4 produtos. Usa <ProductCard> compartilhado.
 */

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { ProductCard } from "./product-card";
import type { Product } from "@/lib/products/infrastructure/persistence/products-repository";
import { blurReveal } from "@/lib/motion/presentation/gsap-helpers";

interface FeatureProductsProps {
  products: Product[];
}

export default function FeatureProducts({ products }: FeatureProductsProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (titleRef.current) {
        blurReveal(titleRef.current, { trigger: headerRef.current });
      }
      // Cards de produto contêm <Image> e ficam estáticos (sem reveal que os
      // esconda) para não "sumir" no scroll rápido sob Lenis. Só o título anima.
    },
    { scope: sectionRef },
  );

  const displayProducts = products.slice(0, 4);
  if (displayProducts.length === 0) return null;

  return (
    <section
      ref={sectionRef}
      className="py-16 sm:py-24 md:py-28 bg-surface-base"
    >
      <div className="container-belessence">
        <div ref={headerRef} className="text-center mb-12 sm:mb-16">
          <p className="text-[11px] font-medium tracking-[0.32em] uppercase text-brand-wine mb-4">
            Seleção da semana
          </p>
          <div className="overflow-hidden pb-[0.12em]">
            <h2
              ref={titleRef}
              className="font-playfair text-[clamp(2rem,4.5vw,3.4rem)] leading-tight tracking-[-0.01em] text-ink-strong"
            >
              Destaques
            </h2>
          </div>
          <div className="mx-auto mt-5 h-px w-12 bg-brand-wine/60" />
        </div>

        <div
          ref={gridRef}
          className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6"
        >
          {displayProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              sizes="(max-width: 768px) 50vw, 280px"
            />
          ))}
        </div>

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
