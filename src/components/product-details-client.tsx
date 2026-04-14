"use client";

/**
 * ProductDetailsClient — Parte interativa da página de produto.
 * Recebe dados do Server Component como props (sem fetch no cliente).
 * Gerencia: galeria de imagens, seletor de quantidade, addToCart, animações GSAP.
 */

import { useRef, useState } from "react";
import { useGSAP } from "@gsap/react";
import { useCart } from "@/components/cart";
import { fadeInUp } from "@/lib/gsap-utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Minus, Plus, Star } from "lucide-react";
import { formatPrice } from "@/api/utils";
import Image from "next/image";
import type { Product } from "@/lib/products-db";

interface ProductDetailsClientProps {
  product: Product;
}

export default function ProductDetailsClient({ product }: ProductDetailsClientProps) {
  const { addToCart } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);

  const pageRef     = useRef<HTMLDivElement>(null);
  const imageRef    = useRef<HTMLDivElement>(null);
  const titleRef    = useRef<HTMLHeadingElement>(null);
  const ratingRef   = useRef<HTMLDivElement>(null);
  const descRef     = useRef<HTMLParagraphElement>(null);

  useGSAP(() => {
    if (imageRef.current)  fadeInUp(imageRef.current,  { y: 20, duration: 0.5 });
    if (titleRef.current)  fadeInUp(titleRef.current,  { y: 20, duration: 0.5, delay: 0.1 });
    if (ratingRef.current) fadeInUp(ratingRef.current, { y: 20, duration: 0.5, delay: 0.2 });
    if (descRef.current)   fadeInUp(descRef.current,   { y: 20, duration: 0.5, delay: 0.3 });
  }, { scope: pageRef });

  const handleAddToCart = () => {
    for (let i = 0; i < quantity; i++) {
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
      });
    }
  };

  const priceNum = Number(product.price);
  const originalPriceNum = product.originalPrice ? Number(product.originalPrice) : undefined;
  const ratingNum = Number(product.rating);

  return (
    <div ref={pageRef} className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12">
      {/* Galeria */}
      <div className="space-y-4">
        <div
          ref={imageRef}
          className="aspect-square bg-muted rounded-xl overflow-hidden relative gradient-card flex items-center justify-center"
        >
          <Image
            src={product.images[selectedImage] ?? product.images[0]}
            alt={product.name}
            fill
            className="object-cover"
            priority
          />
          {product.badge && (
            <Badge
              className="absolute top-4 left-4 z-10"
              variant={(product.badgeVariant as "default" | "secondary" | "destructive" | "outline") ?? "default"}
            >
              {product.badge}
            </Badge>
          )}
        </div>

        {product.images.length > 1 && (
          <div className="grid grid-cols-4 gap-2 sm:gap-4">
            {product.images.map((img: string, i: number) => (
              <button
                key={i}
                className={`aspect-square rounded-lg border-2 bg-muted/50 overflow-hidden relative ${
                  selectedImage === i ? "border-primary" : "border-transparent"
                }`}
                onClick={() => setSelectedImage(i)}
                aria-label={`Imagem ${i + 1}`}
              >
                <Image src={img} alt={`${product.name} ${i + 1}`} fill className="object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Informações */}
      <div className="space-y-8">
        <div>
          <h1 ref={titleRef} className="text-3xl sm:text-4xl md:text-5xl font-playfair font-bold text-primary mb-4">
            {product.name}
          </h1>

          <div ref={ratingRef} className="flex flex-wrap items-center gap-3 sm:gap-4 mb-6">
            <div className="flex">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`h-5 w-5 ${i < ratingNum ? "fill-secondary text-secondary" : "text-muted"}`}
                />
              ))}
            </div>
            <span className="text-muted-foreground">({product.reviews} avaliações)</span>
          </div>

          <p ref={descRef} className="text-base sm:text-lg text-muted-foreground leading-relaxed">
            {product.description}
          </p>
        </div>

        <div className="space-y-6 pt-6 border-t">
          <div className="flex flex-wrap items-end gap-3 sm:gap-4">
            <span className="text-4xl font-bold text-primary">{formatPrice(priceNum)}</span>
            {originalPriceNum && (
              <span className="text-xl text-muted-foreground line-through mb-1">
                {formatPrice(originalPriceNum)}
              </span>
            )}
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
            <div className="flex items-center border rounded-md">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                disabled={quantity <= 1}
                aria-label="Diminuir quantidade"
              >
                <Minus className="h-4 w-4" />
              </Button>
              <span className="w-12 text-center font-medium">{quantity}</span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setQuantity(quantity + 1)}
                aria-label="Aumentar quantidade"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <Button
              size="lg"
              className="w-full sm:flex-1 text-base sm:text-lg h-12"
              onClick={handleAddToCart}
            >
              Adicionar ao Carrinho
            </Button>
          </div>
        </div>

        <div className="space-y-4 pt-8">
          <h3 className="font-playfair text-xl font-semibold">Características</h3>
          <ul className="grid grid-cols-1 gap-2">
            {product.features.map((feature: string, i: number) => (
              <li key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className="w-2 h-2 rounded-full bg-secondary shrink-0" />
                {feature}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
