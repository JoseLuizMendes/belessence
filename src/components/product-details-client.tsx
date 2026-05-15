"use client";

/**
 * ProductDetailsClient — Belessence (estilo Stitch / PDP)
 * ─────────────────────────────────────────────────────────────────────
 * Layout PDP do Stitch:
 *  - Galeria à esquerda: 1 imagem grande + 3 thumbnails embaixo
 *  - Info à direita: nome serif italic, preço bordô, descrição,
 *    seletor de quantidade, botão "Adicionar à Bag" pill bordô
 *  - Tabs: Descrição | Ritual de Uso | Ingredientes
 */

import { useRef, useState } from "react";
import { useGSAP } from "@gsap/react";
import { useCart } from "@/components/cart";
import { WishlistButton } from "@/components/wishlist-button";
import { ProductReviews } from "@/components/product-reviews";
import { fadeInUp } from "@/lib/gsap-utils";
import { Button } from "@/components/ui/button";
import { Minus, Plus, ShoppingBag } from "lucide-react";
import { formatPrice } from "@/api/utils";
import Image from "next/image";
import type { Product } from "@/lib/products-db";

interface ProductDetailsClientProps {
  product: Product;
}

type TabKey = "descricao" | "ritual" | "ingredientes" | "avaliacoes";

const TABS: { key: TabKey; label: string }[] = [
  { key: "descricao", label: "Descrição" },
  { key: "ritual", label: "Ritual de Uso" },
  { key: "ingredientes", label: "Ingredientes" },
  { key: "avaliacoes", label: "Avaliações" },
];

export default function ProductDetailsClient({ product }: ProductDetailsClientProps) {
  const { addToCart } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [activeTab, setActiveTab] = useState<TabKey>("descricao");

  const pageRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const priceRef = useRef<HTMLDivElement>(null);
  const descRef = useRef<HTMLParagraphElement>(null);

  useGSAP(() => {
    if (imageRef.current) fadeInUp(imageRef.current, { y: 24, duration: 0.7 });
    if (titleRef.current) fadeInUp(titleRef.current, { y: 24, duration: 0.7, delay: 0.12 });
    if (priceRef.current) fadeInUp(priceRef.current, { y: 24, duration: 0.7, delay: 0.22 });
    if (descRef.current) fadeInUp(descRef.current, { y: 24, duration: 0.7, delay: 0.32 });
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

  // Conteúdo de cada tab
  const tabContent: Record<TabKey, React.ReactNode> = {
    descricao: (
      <p className="text-sm sm:text-base leading-relaxed text-ink-soft font-light">
        {product.description}
      </p>
    ),
    ritual: (
      <div className="space-y-3 text-sm sm:text-base text-ink-soft font-light">
        <p>Aplique levemente nos pontos de pulsação — pulso, atrás das orelhas e na base do pescoço.</p>
        <p>Evite friccionar a fragrância na pele para preservar suas notas originais.</p>
        <p>Reaplique ao longo do dia para manter a intensidade do aroma.</p>
      </div>
    ),
    ingredientes: (
      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {product.features.map((feature: string, i: number) => (
          <li key={i} className="flex items-start gap-2.5 text-sm text-ink-soft font-light">
            <span className="mt-2 w-1.5 h-1.5 rounded-full bg-brand-wine shrink-0" />
            {feature}
          </li>
        ))}
      </ul>
    ),
    avaliacoes: <ProductReviews productId={product.id} />,
  };

  return (
    <div ref={pageRef} className="space-y-16">
      {/* Layout principal: galeria + info */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16">
        {/* Galeria */}
        <div className="space-y-4">
          <div
            ref={imageRef}
            className="relative aspect-square overflow-hidden rounded-token-sm bg-surface-section"
          >
            <Image
              src={product.images[selectedImage] ?? product.images[0]}
              alt={product.name}
              fill
              priority
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
            {product.badge && (
              <span className="absolute top-4 left-4 inline-flex items-center rounded-full bg-brand-wine px-3 py-1 text-[10px] font-medium uppercase tracking-[0.18em] text-brand-pink">
                {product.badge}
              </span>
            )}
          </div>

          {/* Thumbnails */}
          {product.images.length > 1 && (
            <div className="grid grid-cols-4 gap-2 sm:gap-3">
              {product.images.slice(0, 4).map((img: string, i: number) => (
                <button
                  key={i}
                  onClick={() => setSelectedImage(i)}
                  aria-label={`Imagem ${i + 1}`}
                  className={[
                    "relative aspect-square overflow-hidden rounded-token-sm bg-surface-section transition-all duration-300",
                    selectedImage === i
                      ? "ring-2 ring-brand-wine ring-offset-2 ring-offset-brand-pink"
                      : "opacity-70 hover:opacity-100",
                  ].join(" ")}
                >
                  <Image src={img} alt={`${product.name} ${i + 1}`} fill className="object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Informações */}
        <div className="flex flex-col gap-6">
          {/* Eyebrow */}
          <p className="text-[11px] font-medium tracking-[0.32em] uppercase text-brand-wine">
            Mari Beauty
          </p>

          {/* Nome */}
          <h1
            ref={titleRef}
            className="font-playfair italic text-[clamp(2rem,5vw,3.6rem)] leading-[1.04] tracking-[-0.02em] text-ink-strong"
          >
            {product.name}
          </h1>

          {/* Preço */}
          <div ref={priceRef} className="flex items-end gap-3">
            <span className="price-display text-3xl sm:text-4xl font-semibold text-brand-wine">
              {formatPrice(priceNum)}
            </span>
            {originalPriceNum && (
              <span className="text-base text-ink-muted line-through mb-1">
                {formatPrice(originalPriceNum)}
              </span>
            )}
          </div>

          {/* Divider */}
          <div className="h-px w-12 bg-brand-wine/60" />

          {/* Descrição curta */}
          <p ref={descRef} className="text-sm sm:text-base text-ink-soft leading-relaxed font-light max-w-md">
            {product.shortDescription}
          </p>

          {/* Detalhes (lista) */}
          {product.features.length > 0 && (
            <div className="space-y-2 pt-2">
              <p className="text-[10px] font-medium tracking-[0.24em] uppercase text-brand-wine/70 mb-3">
                O Ritual
              </p>
              <ul className="space-y-2">
                {product.features.slice(0, 3).map((f, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm text-ink-soft font-light">
                    <span className="mt-2 w-1.5 h-1.5 rounded-full bg-brand-wine shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Quantidade + CTA */}
          <div className="flex flex-col sm:flex-row items-stretch gap-3 pt-4">
            <div className="flex items-center border border-border-subtle rounded-full bg-surface-panel">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                disabled={quantity <= 1}
                aria-label="Diminuir quantidade"
                className="flex h-12 w-12 items-center justify-center rounded-l-full text-ink-soft hover:text-brand-wine disabled:opacity-30 transition-colors"
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="w-12 text-center text-sm font-medium text-ink-strong">{quantity}</span>
              <button
                onClick={() => setQuantity(quantity + 1)}
                aria-label="Aumentar quantidade"
                className="flex h-12 w-12 items-center justify-center rounded-r-full text-ink-soft hover:text-brand-wine transition-colors"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>

            <Button
              size="lg"
              onClick={handleAddToCart}
              className="loreal-btn-pill flex-1 h-12 bg-brand-wine text-brand-pink text-[12px] font-medium tracking-[0.18em] uppercase hover:bg-brand-wine/90 group"
            >
              <ShoppingBag className="mr-2 h-4 w-4" strokeWidth={1.5} />
              Adicionar à Bag
            </Button>

            {/* Wishlist */}
            <WishlistButton
              productId={product.id}
              productName={product.name}
              variant="pdp"
            />
          </div>
        </div>
      </div>

      {/* Tabs: Descrição / Ritual / Ingredientes */}
      <div className="border-t border-border-subtle pt-12">
        {/* Tab triggers */}
        <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-12 mb-10">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={[
                "relative pb-2 text-[11px] font-medium tracking-[0.24em] uppercase transition-colors",
                activeTab === tab.key
                  ? "text-brand-wine"
                  : "text-ink-muted hover:text-ink-soft",
              ].join(" ")}
            >
              {tab.label}
              {activeTab === tab.key && (
                <span className="absolute -bottom-px left-0 right-0 h-px bg-brand-wine" />
              )}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="max-w-2xl mx-auto text-center">{tabContent[activeTab]}</div>
      </div>
    </div>
  );
}
