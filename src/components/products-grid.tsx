"use client";

/**
 * ProductsGrid — Grid interativo de produtos com GSAP + cart
 * Componente Client usado nas páginas /allProducts e /collections/[slug]
 */

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { staggerIn, cardHoverIn, cardHoverOut } from "@/lib/gsap-utils";
import { Star } from "lucide-react";
import { useCart } from "@/components/cart";
import Link from "next/link";
import { formatPrice } from "@/api/utils";
import Image from "next/image";
import type { Product } from "@prisma/client";

interface ProductsGridProps {
  products: Product[];
}

export default function ProductsGrid({ products }: ProductsGridProps) {
  const { addToCart } = useCart();
  const gridRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    if (!gridRef.current) return;
    const cards = gridRef.current.querySelectorAll("[data-animate-card]");
    if (cards.length > 0) {
      staggerIn(cards, { y: 24, duration: 0.5, stagger: 0.07, delay: 0.1 });
    }
  }, { scope: gridRef });

  return (
    <div
      ref={gridRef}
      className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8"
    >
      {products.map((product) => (
        <div
          key={product.id}
          data-animate-card
          className="h-full"
          onMouseEnter={(e) => cardHoverIn(e.currentTarget)}
          onMouseLeave={(e) => cardHoverOut(e.currentTarget)}
        >
          <Card className="overflow-hidden h-full flex flex-col cursor-pointer shadow-sm transition-shadow duration-300 hover:shadow-xl">
            <div className="relative h-52 sm:h-64 gradient-card shrink-0 overflow-hidden">
              <Image
                src={product.images[0]}
                alt={product.name}
                fill
                className="object-cover"
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              />
              {product.badge && (
                <Badge
                  className="absolute top-4 left-4 z-10"
                  variant={(product.badgeVariant as "default" | "secondary" | "destructive" | "outline") ?? "default"}
                >
                  {product.badge}
                </Badge>
              )}
              <div className="absolute inset-0 bg-black/20 hover:bg-black/10 transition-colors" />
              <div className="absolute inset-0 flex items-center justify-center opacity-100 md:opacity-0 md:hover:opacity-100 transition-opacity">
                <div className="flex gap-2">
                  <Link href={`/product/${product.slug}`}>
                    <Button size="sm" className="bg-white/90 text-primary hover:bg-white">
                      Ver Detalhes
                    </Button>
                  </Link>
                  <Button
                    size="sm"
                    variant="outline"
                    className="bg-white/90 text-primary border-primary hover:bg-primary hover:text-white"
                    onClick={() =>
                      addToCart({
                        id: product.id,
                        slug: product.slug,
                        name: product.name,
                        shortDescription: product.shortDescription,
                        price: Number(product.price),
                        originalPrice: product.originalPrice ? Number(product.originalPrice) : undefined,
                        badge: product.badge ?? undefined,
                        badgeVariant: (product.badgeVariant as "default" | "secondary" | "destructive" | "outline") ?? undefined,
                        image: product.images[0],
                      })
                    }
                  >
                    Adicionar
                  </Button>
                </div>
              </div>
            </div>

            <CardHeader className="flex-1 flex flex-col">
              <CardTitle className="font-playfair">{product.name}</CardTitle>
              <CardDescription className="text-sm line-clamp-2">
                {product.shortDescription}
              </CardDescription>
              <div className="flex items-center gap-2 mt-auto pt-4">
                <span className="text-xl font-bold text-primary">
                  {formatPrice(Number(product.price))}
                </span>
                {product.originalPrice && (
                  <span className="text-sm text-muted-foreground line-through">
                    {formatPrice(Number(product.originalPrice))}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 mt-2">
                <div className="flex">
                  {[...Array(Math.floor(Number(product.rating)))].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-secondary text-secondary" />
                  ))}
                </div>
                <span className="text-sm text-muted-foreground">({product.reviews})</span>
              </div>
            </CardHeader>
          </Card>
        </div>
      ))}
    </div>
  );
}
