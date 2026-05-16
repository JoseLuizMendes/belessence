"use client";

/**
 * FeatureProducts — Belessence (estilo Stitch / "Destaques")
 * ─────────────────────────────────────────────────────────────────────
 * Grid limpo de 4 produtos. Usa <ProductCard> compartilhado.
 */

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { ProductCard } from "./product-card";
import type { Product } from "@/lib/products-db";

gsap.registerPlugin(ScrollTrigger);

interface FeatureProductsProps {
  products: Product[];
}

export default function FeatureProducts({ products }: FeatureProductsProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  // ── Animação de entrada idempotente ─────────────────────────────────────────
  useGSAP(
    () => {
      const reduced = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;
      if (reduced || !gridRef.current) return;

      const cards = gridRef.current.querySelectorAll("[data-product-card]");
      if (cards.length > 0) {
        // fromTo + immediateRender:false + once:true = nunca deixa cards
        // permanentemente invisíveis se o ScrollTrigger não disparar.
        gsap.fromTo(
          cards,
          { opacity: 0, y: 30 },
          {
            opacity: 1,
            y: 0,
            duration: 0.7,
            stagger: 0.12,
            ease: "power3.out",
            immediateRender: false,
            scrollTrigger: {
              trigger: gridRef.current,
              start: "top 90%",
              once: true,
              toggleActions: "play none none none",
            },
          },
        );
        ScrollTrigger.refresh();
      }
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
        <div className="text-center mb-12 sm:mb-16">
          <p className="text-[11px] font-medium tracking-[0.32em] uppercase text-brand-wine mb-4">
            Seleção da semana
          </p>
          <h2 className="font-playfair italic text-[clamp(2rem,4.5vw,3.4rem)] leading-tight tracking-[-0.02em] text-ink-strong">
            Destaques
          </h2>
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
