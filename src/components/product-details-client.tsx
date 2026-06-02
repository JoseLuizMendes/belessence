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

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { useCart } from "@/components/cart";
import { useRequireAuth } from "@/lib/hooks/use-require-auth";
import { WishlistButton } from "@/components/wishlist-button";
import { ProductReviews } from "@/components/product-reviews";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { fadeInUp } from "@/lib/motion/presentation/gsap-helpers";
import { Button } from "@/components/ui/button";
import { Minus, Plus, ShoppingBag } from "lucide-react";
import { formatPrice } from "@/shadcn-utils/utils";
import Image from "next/image";
import type { Product } from "@/lib/products/infrastructure/persistence/products-repository";
import { productImageSrc } from "@/lib/products/infrastructure/external/product-image";
import { getEffectivePromotion, isEffectivelyNew } from "@/lib/products/domain/product-status";

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
  const requireAuth = useRequireAuth();
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [activeTab, setActiveTab] = useState<TabKey>("descricao");

  const pageRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const priceRef = useRef<HTMLDivElement>(null);
  const descRef = useRef<HTMLParagraphElement>(null);

  // Refs do segmented-tabs (pill deslizante + transição de altura + slide)
  const pillRef = useRef<HTMLSpanElement>(null);
  const triggerRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const contentWrapperRef = useRef<HTMLDivElement>(null);
  const contentInnerRef = useRef<HTMLDivElement>(null);
  const previousHeightRef = useRef<number | null>(null);
  const pillInitializedRef = useRef(false);
  const slideDirectionRef = useRef<1 | -1>(1);

  /**
   * Captura a altura atual ANTES da troca de aba, para que o useGSAP de
   * altura possa interpolar de old → new sem causar salto visual.
   */
  const handleTabChange = (newKey: string) => {
    const oldIndex = TABS.findIndex((t) => t.key === activeTab);
    const newIndex = TABS.findIndex((t) => t.key === newKey);
    slideDirectionRef.current = newIndex > oldIndex ? 1 : -1;

    if (contentWrapperRef.current) {
      previousHeightRef.current = contentWrapperRef.current.offsetHeight;
    }
    setActiveTab(newKey as TabKey);
  };

  useGSAP(() => {
    if (imageRef.current) fadeInUp(imageRef.current, { y: 24, duration: 0.7 });
    if (titleRef.current) fadeInUp(titleRef.current, { y: 24, duration: 0.7, delay: 0.12 });
    if (priceRef.current) fadeInUp(priceRef.current, { y: 24, duration: 0.7, delay: 0.22 });
    if (descRef.current) fadeInUp(descRef.current, { y: 24, duration: 0.7, delay: 0.32 });
  }, { scope: pageRef });

  /**
   * Pill deslizante: posiciona/dimensiona o `<span>` bordô atrás da tab
   * ativa. Primeira execução usa `set` (sem animação) para evitar flicker
   * inicial; trocas subsequentes usam `to` com easing exponencial.
   */
  useGSAP(() => {
    if (!pillRef.current) return;
    const activeIndex = TABS.findIndex((t) => t.key === activeTab);
    const activeBtn = triggerRefs.current[activeIndex];
    if (!activeBtn) return;

    const target = { 
      x: activeBtn.offsetLeft, 
      y: activeBtn.offsetTop,
      width: activeBtn.offsetWidth,
      height: activeBtn.offsetHeight
    };

    if (!pillInitializedRef.current) {
      gsap.set(pillRef.current, { ...target, opacity: 1 });
      pillInitializedRef.current = true;
    } else {
      gsap.to(pillRef.current, { ...target, duration: 0.55, ease: "expo.out" });
    }
  }, { dependencies: [activeTab], scope: pageRef });

  /**
   * Slide lateral + altura suave do conteúdo:
   * 1. Altura interpola old→new com expo.out (sem salto).
   * 2. Conteúdo interno desliza na direção da tab escolhida.
   *    Se clicou pra direita, conteúdo antigo sai pela esquerda e novo
   *    entra pela direita (e vice-versa).
   */
  useGSAP(() => {
    if (!contentWrapperRef.current || !contentInnerRef.current) return;

    const wrapper = contentWrapperRef.current;
    const inner = contentInnerRef.current;
    const dir = slideDirectionRef.current;

    // Slide lateral do conteúdo
    gsap.fromTo(
      inner,
      { x: dir * 40, opacity: 0 },
      {
        x: 0,
        opacity: 1,
        duration: 0.45,
        ease: "expo.out",
      },
    );

    // Altura suave (apenas em trocas, não no render inicial)
    if (previousHeightRef.current !== null) {
      const fromHeight = previousHeightRef.current;
      const toHeight = inner.offsetHeight;
      const delta = Math.abs(toHeight - fromHeight);

      /**
       * Duração adaptativa: deltas grandes (ex.: ir para AVALIAÇÕES com
       * form completo) animam mais rápido para evitar a sensação de
       * "loading reveal". Deltas pequenos ganham mais tempo para reforçar
       * a suavidade.
       */
      const duration = delta < 200 ? 0.5 : delta < 500 ? 0.42 : 0.35;

      gsap.fromTo(
        wrapper,
        { height: fromHeight },
        {
          height: toHeight,
          duration,
          ease: "expo.out",
          onComplete: () => {
            gsap.set(wrapper, { height: "auto" });
          },
        },
      );

      previousHeightRef.current = null;
    }
  }, { dependencies: [activeTab], scope: pageRef });

  /**
   * Recalcula a posição do pill no resize da janela (offsets dos triggers
   * mudam com flex layout responsivo). `gsap.set` sem animação para evitar
   * "deriva" durante o arrastar.
   */
  useEffect(() => {
    if (typeof window === "undefined") return;
    const handler = () => {
      const activeIndex = TABS.findIndex((t) => t.key === activeTab);
      const activeBtn = triggerRefs.current[activeIndex];
      if (activeBtn && pillRef.current) {
        gsap.set(pillRef.current, {
          x: activeBtn.offsetLeft,
          width: activeBtn.offsetWidth,
        });
      }
    };
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, [activeTab]);

  const handleAddToCart = () => {
    requireAuth(() => {
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
    });
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
    /**
     * `min-h-[480px]` reserva espaço para o form de avaliação ANTES do
     * fetch async das reviews completar. Sem isso, a altura cresceria
     * em duas fases visíveis (forma → forma+reviews), criando aquela
     * sensação de "carrega o título primeiro depois o resto".
     */
    avaliacoes: (
      <div className="min-h-[480px]">
        <ProductReviews productId={product.id} />
      </div>
    ),
  };

  return (
    <div ref={pageRef} className="space-y-7">
      {/* Layout principal: galeria + info */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16">
        {/* Galeria */}
        <div className="space-y-4">
          <div
            ref={imageRef}
            className="relative aspect-square overflow-hidden rounded-token-sm bg-surface-section"
          >
            <Image
              src={productImageSrc(product.images[selectedImage] ?? product.images[0])}
              alt={product.name}
              fill
              priority
              className={[
                "object-cover",
                product.stock === 0 ? "opacity-70 grayscale-[0.15]" : "",
              ].join(" ")}
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
            {/* Badges PDP — esgotado tem prioridade, demais combinam */}
            <div className="absolute top-4 left-4 flex flex-col gap-1.5 items-start">
              {product.stock === 0 && (
                <span className="inline-flex items-center rounded-full bg-ink-strong px-3 py-1 text-[10px] font-medium uppercase tracking-[0.18em] text-brand-pink shadow-card">
                  Esgotado
                </span>
              )}
              {product.status === "DISCONTINUED" && (
                <span className="inline-flex items-center rounded-full bg-ink-muted px-3 py-1 text-[10px] font-medium uppercase tracking-[0.18em] text-surface-base">
                  Fora de linha
                </span>
              )}
              {product.status === "COMING_SOON" && (
                <span className="inline-flex items-center rounded-full bg-blue-700 px-3 py-1 text-[10px] font-medium uppercase tracking-[0.18em] text-white">
                  Em breve
                </span>
              )}
              {getEffectivePromotion(product) && (
                <span className="inline-flex items-center rounded-full bg-brand-wine px-3 py-1 text-[10px] font-medium uppercase tracking-[0.18em] text-brand-pink animate-pulse-slow">
                  Promoção
                </span>
              )}
              {product.isLimitedEdition && (
                <span className="inline-flex items-center rounded-full bg-amber-600 px-3 py-1 text-[10px] font-medium uppercase tracking-[0.18em] text-white">
                  Edição limitada
                </span>
              )}
              {isEffectivelyNew(product) && product.status !== "PROMOTION" && (
                <span className="inline-flex items-center rounded-full bg-emerald-600 px-3 py-1 text-[10px] font-medium uppercase tracking-[0.18em] text-white">
                  Lançamento
                </span>
              )}
            </div>
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
                  <Image src={productImageSrc(img)} alt={`${product.name} ${i + 1}`} fill className="object-cover" />
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

          {/* Quantidade + CTA + Wishlist */}
          <div className="pt-4 flex flex-col sm:flex-row sm:items-stretch gap-3">
            {/* Linha 1 em mobile: quantity + wishlist (lado a lado) */}
            <div className="flex items-stretch gap-3">
              <div className="flex items-center border border-border-subtle rounded-full bg-surface-panel shrink-0">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={quantity <= 1}
                  aria-label="Diminuir quantidade"
                  className="h-12 w-11 rounded-l-full rounded-r-none text-ink-soft hover:bg-transparent hover:text-brand-wine disabled:opacity-30"
                >
                  <Minus className="size-4" />
                </Button>
                <span className="w-10 text-center text-sm font-medium text-ink-strong tabular-nums">{quantity}</span>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setQuantity(quantity + 1)}
                  aria-label="Aumentar quantidade"
                  className="h-12 w-11 rounded-r-full rounded-l-none text-ink-soft hover:bg-transparent hover:text-brand-wine"
                >
                  <Plus className="size-4" />
                </Button>
              </div>

              {/* Wishlist em mobile fica aqui (à direita do quantity) */}
              <WishlistButton
                productId={product.id}
                productName={product.name}
                variant="pdp"
                className="sm:hidden ml-auto"
              />
            </div>

            {/* Botão Adicionar — full width mobile, flex-1 desktop */}
            <Button
              size="lg"
              onClick={handleAddToCart}
              className="loreal-btn-pill w-full sm:flex-1 h-12 bg-brand-wine text-brand-pink text-[12px] font-medium tracking-[0.18em] uppercase hover:bg-brand-wine/90 group"
            >
              <ShoppingBag className="mr-2 h-4 w-4" strokeWidth={1.5} />
              Adicionar à Bag
            </Button>

            {/* Wishlist desktop — fica no fim da linha */}
            <WishlistButton
              productId={product.id}
              productName={product.name}
              variant="pdp"
              className="hidden sm:flex"
            />
          </div>
        </div>
      </div>

      {/* Tabs: Descrição / Ritual / Ingredientes / Avaliações
          ────────────────────────────────────────────────────────
          - Tabs flutuam limpas sem container (bg/border/shadow removidos).
          - Pill sólida vinho desliza com GSAP expo.out.
          - Conteúdo slide lateral + altura interpolada suavemente. */}
      <div>
        <Tabs
          value={activeTab}
          onValueChange={handleTabChange}
          className="w-full"
        >
          {/* ── TabsList ────────────────────────────────────────────
              - flex-nowrap + overflow-x-auto: em mobile, tabs ficam
                numa linha só e rolam horizontalmente em vez de quebrar
                (que fazia AVALIAÇÕES ficar w-full sozinha numa segunda
                linha por causa do flex-1 herdado do shadcn).
              - mx-auto + w-fit: centraliza quando cabe; em mobile expande
                até max-w-full e rola.
              - scrollbar oculta visualmente (mantém funcional).
              - Cada trigger tem o MESMO border sempre (subtle bordô) —
                o que muda é o pill bordô absoluto e a cor do texto. */}
          <TabsList
            className="relative mx-auto mb-6 flex h-auto w-fit max-w-full flex-nowrap items-center gap-2 overflow-x-auto overflow-y-visible rounded-none border-0 bg-transparent p-0 shadow-none [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {/* Pill deslizante (GSAP anima x + width entre triggers) */}
            <span
              ref={pillRef}
              aria-hidden
              className="pointer-events-none absolute top-0 left-0 rounded-full bg-brand-wine opacity-0 shadow-[0_4px_14px_-4px_rgba(71,19,28,0.35)] will-change-transform"
            />

            {TABS.map((tab, i) => (
              <TabsTrigger
                key={tab.key}
                ref={(el) => {
                  triggerRefs.current[i] = el;
                }}
                value={tab.key}
                className="relative z-10 h-auto !flex-none shrink-0 rounded-full border border-brand-wine/15 bg-transparent px-4 py-2.5 text-[10.5px] font-medium tracking-[0.2em] uppercase whitespace-nowrap shadow-none transition-colors duration-300 hover:border-brand-wine/30 focus-visible:outline-none focus-visible:ring-0 sm:px-5 sm:text-[11px] data-[state=active]:bg-transparent data-[state=active]:shadow-none"
              >
                <span
                  className={
                    activeTab === tab.key
                      ? "text-brand-pink transition-colors duration-300"
                      : "text-ink-strong transition-colors duration-300"
                  }
                >
                  {tab.label}
                </span>
              </TabsTrigger>
            ))}
          </TabsList>

          {/* Wrapper de altura animada + slide lateral */}
          <div ref={contentWrapperRef} className="overflow-hidden">
            <div ref={contentInnerRef}>
              {TABS.map((tab) => (
                <TabsContent
                  key={tab.key} 
                  value={tab.key}
                  className="max-w-2xl pt-2 pb-6 text-left"
                >
                  {tabContent[tab.key]}
                </TabsContent>
              ))}
            </div>
          </div>
        </Tabs>
      </div>
    </div>
  );
}
