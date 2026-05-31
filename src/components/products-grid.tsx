"use client";

/**
 * ProductsGrid — Belessence
 * ─────────────────────────────────────────────────────────────────────
 * Grid 3 colunas usando <ProductCard> compartilhado.
 */

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { staggerIn } from "@/lib/motion/presentation/gsap-helpers";
import { ProductCard } from "@/components/product-card";
import type { Product } from "@/lib/products-db";

interface ProductsGridProps {
  products: Product[];
}

export default function ProductsGrid({ products }: ProductsGridProps) {
  const gridRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (!gridRef.current) return;
      const cards = gridRef.current.querySelectorAll("[data-animate-card]");
      if (cards.length > 0) {
        staggerIn(cards, { y: 24, duration: 0.55, stagger: 0.08, delay: 0.1 });
      }
    },
    { scope: gridRef },
  );

  return (
    <div
      ref={gridRef}
      className="grid grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8"
    >
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          animateAttr="data-animate-card"
        />
      ))}
    </div>
  );
}
