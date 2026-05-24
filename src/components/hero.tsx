"use client";

/**
 * Hero — Belessence
 * ─────────────────────────────────────────────────────────────────────
 * Layout (de cima para baixo, inspirado em lógica O'Boticário):
 *
 *   [1] Promo strip       — fundo escuro, frete grátis + cupom copyable
 *   [2] Section context   — breadcrumb + heading + pills de categoria
 *   [3] Carousel          — max-w-[1440px] mx-auto, h = clamp(240px, 41.67vw, 600px)
 *                           imagens full-bleed dentro do box, cross-fade CSS
 *                           overlay gradiente + copy por slide + GSAP scroll exit
 *
 * Técnica de altura:
 *   41.67vw = 1/2.4 × 100vw → manten relação 1440:600 (= 12:5) para vp ≤ 1440px
 *   clamp(240px, ..., 600px) → nunca acima de 600px (natural da arte) nem abaixo de 240px
 *
 * GSAP:
 *   - Copy entry: stagger y+opacity per slide change
 *   - Scroll exit: carouselRef sobe + fade via ScrollTrigger scrub
 *   - prefers-reduced-motion: respeitado
 */

import {
  useRef,
  useEffect,
  useLayoutEffect,
  useState,
  useCallback,
} from "react";
import Image from "next/image";
import Link from "next/link";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Button } from "./ui/button";
import { Typewriter } from "./ui/typewriter";
import {
  ChevronLeft,
  ChevronRight,
  Gift,
  Copy,
  Check,
  ChevronRight as Chevron,
} from "lucide-react";

gsap.registerPlugin(ScrollTrigger);

// ── Tipos ─────────────────────────────────────────────────────────────────────

interface Slide {
  src: string;
  overlay: string;
  eyebrow: string;
  eyebrowColor: string;
  title: string;
  titleColor: string;
  subtitle: string;
  subtitleColor: string;
  cta: string;
  ctaBg: string;
  ctaText: string;
}

interface CategoryPill {
  label: string;
  href: string;
}

// ── Dados ─────────────────────────────────────────────────────────────────────

const SLIDES: Slide[] = [
  {
    src: "/assets/hero1.png",
    overlay: "overlay-hero-teal",
    eyebrow: "Novo Lançamento",
    eyebrowColor: "#D4FFFF",
    title: "Essência do Amanhecer",
    titleColor: "#ffffff",
    subtitle: "Notas frescas de bergamota e cedro branco",
    subtitleColor: "#ffffff",
    cta: "Descobrir Agora",
    ctaBg: "#0d3333",
    ctaText: "#e8f5f5",
  },
  {
    src: "/assets/hero2.png",
    overlay: "overlay-hero-dark",
    eyebrow: "Coleção Exclusiva",
    eyebrowColor: "#e87070",
    title: "Âmbar Noturno",
    titleColor: "#ffffff",
    subtitle: "A intensidade do âmbar com fundo de baunilha",
    subtitleColor: "rgba(255,255,255,0.72)",
    cta: "Ver Coleção",
    ctaBg: "#e87070",
    ctaText: "#1a0000",
  },
  {
    src: "/assets/hero3.png",
    overlay: "overlay-hero-gold",
    eyebrow: "Edição Limitada",
    eyebrowColor: "#c4a45a",
    title: "Silagem Prolongada",
    titleColor: "#ffffff",
    subtitle: "Alta fixação — permanece por até 12 horas",
    subtitleColor: "rgba(255,255,255,0.72)",
    cta: "Garantir o Meu",
    ctaBg: "#c4a45a",
    ctaText: "#0a0600",
  },
  {
    src: "/assets/hero4.png",
    overlay: "overlay-hero-amber",
    eyebrow: "Best Seller",
    eyebrowColor: "#d4843a",
    title: "Coração de Rosa",
    titleColor: "#ffffff",
    subtitle: "Floral sofisticado com acorde de rosa turca",
    subtitleColor: "rgba(255,255,255,0.72)",
    cta: "Explorar",
    ctaBg: "#d4843a",
    ctaText: "#1a0800",
  },
  {
    src: "/assets/hero5.png",
    overlay: "overlay-hero-mystic",
    eyebrow: "Tendência 2026",
    eyebrowColor: "#5ec4c4",
    title: "Acorde Boisé",
    titleColor: "#ffffff",
    subtitle: "Madeiras raras e musgo branco em harmonia",
    subtitleColor: "rgba(255,255,255,0.72)",
    cta: "Conhecer",
    ctaBg: "#5ec4c4",
    ctaText: "#04161c",
  },
  {
    src: "/assets/hero6.png",
    overlay: "overlay-hero-orange",
    eyebrow: "Mari Beauty",
    eyebrowColor: "#7a2e00",
    title: "Accord Ultime",
    titleColor: "#1a0800",
    subtitle: "A fragrância mais icônica da Maison",
    subtitleColor: "#3d1500",
    cta: "Descobrir",
    ctaBg: "#1a0800",
    ctaText: "#fdf0e8",
  },
];

const CATEGORIES: CategoryPill[] = [
  { label: "Todas as Coleções", href: "/allProducts" },
  { label: "Feminino", href: "/allProducts?genero=feminino" },
  { label: "Masculino", href: "/allProducts?genero=masculino" },
  { label: "Unissex", href: "/allProducts?genero=unissex" },
  { label: "Lançamentos", href: "/allProducts?tag=lancamento" },
];

const COUPON = "BELES10";
const INTERVAL = 5200;

// ── Componente ────────────────────────────────────────────────────────────────

export default function Hero() {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const carouselRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const copyRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeCategory, setActiveCategory] = useState(0);
  const [headerOffset, setHeaderOffset] = useState(0);

  // ── Mede altura real do header fixed e aplica como padding-top ──────────────
  useLayoutEffect(() => {
    const measure = () => {
      const header = document.querySelector("header");
      if (header) setHeaderOffset(header.getBoundingClientRect().height);
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  const advance = useCallback((dir: 1 | -1 = 1) => {
    setActive((i) => (i + dir + SLIDES.length) % SLIDES.length);
  }, []);

  // ── Auto-advance ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (paused) return;
    timerRef.current = setInterval(() => advance(), INTERVAL);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [advance, paused]);

  // ── Copy cupom ──────────────────────────────────────────────────────────────
  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(COUPON).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    });
  }, []);

  // ── Animação de entrada por slide ───────────────────────────────────────────
  useGSAP(
    () => {
      const reduced = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;
      if (reduced || !copyRef.current) return;
      gsap.fromTo(
        Array.from(copyRef.current.children),
        { opacity: 0, y: 24 },
        {
          opacity: 1,
          y: 0,
          duration: 0.72,
          stagger: 0.1,
          ease: "power3.out",
          delay: 0.06,
        },
      );
    },
    { scope: carouselRef, dependencies: [active] },
  );

  // ── Scroll exit (carrossel sobe ao scrollar) ────────────────────────────────
  useGSAP(
    () => {
      const reduced = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;
      if (reduced || !contentRef.current || !carouselRef.current) return;
      gsap
        .timeline({
          scrollTrigger: {
            trigger: carouselRef.current,
            start: "top top+=80",
            end: "+=50%",
            scrub: 1.2,
          },
        })
        .to(contentRef.current, { y: -56, opacity: 0, ease: "none" }, 0);
    },
    { scope: wrapperRef, dependencies: [] },
  );

  const slide = SLIDES[active];

  return (
    <div
      ref={wrapperRef}
      className="w-full"
      style={{ paddingTop: headerOffset || undefined }}
    >
      {/* ══ 1. PROMO STRIP ═══════════════════════════════════════════════════ */}
      <div className="w-full bg-brand-wine text-surface-base py-2 px-4">
        <div className="max-w-[1440px] mx-auto flex flex-col sm:flex-row items-center justify-center gap-y-1 sm:gap-x-5">
          <div className="flex items-center gap-2.5">
            <Gift className="h-3 w-3 shrink-0 opacity-70 hidden sm:inline text-accent" />
            <span className="text-accent text-[10px] sm:text-[11px] font-light tracking-[0.16em] uppercase whitespace-nowrap">
              Frete grátis acima de R$199
            </span>
            <span className="opacity-40 text-[10px] sm:text-[11px] text-accent">·</span>
            <Button
              type="button"
              variant="ghost"
              onClick={handleCopy}
              aria-label="Copiar cupom"
              className="h-auto p-0 gap-1.5 text-accent text-[10px] sm:text-[11px] font-medium tracking-[0.22em] uppercase hover:bg-transparent hover:opacity-75"
            >
              <span>{COUPON}</span>
              {copied ? (
                <Check className="size-3" />
              ) : (
                <Copy className="size-3 opacity-55" />
              )}
            </Button>
          </div>
          <span className="hidden sm:inline opacity-40 text-[10px] sm:text-[11px] text-accent">·</span>
          <span className="text-accent text-[9.5px] sm:text-[10.5px] font-light tracking-[0.16em] uppercase opacity-55 whitespace-nowrap">
            Válido até 30/04/26
          </span>
        </div>
      </div>

      {/* ══ 2. SECTION CONTEXT ═══════════════════════════════════════════════ */}
      <div className="w-full bg-brand-pink">
        <div className="max-w-[1440px] mx-auto px-5 sm:px-8 py-5 sm:py-4 flex flex-col gap-4 sm:gap-3 sm:flex-row sm:items-center sm:justify-between">
          {/* Breadcrumb + heading */}
          <div className="flex flex-col gap-1.5">
            {/* Breadcrumb */}
            <nav
              aria-label="breadcrumb"
              className="flex items-center gap-1 text-[10px] tracking-widest uppercase text-foreground/35"
            >
              <Link
                href="/"
                className="hover:text-foreground/60 transition-colors"
              >
                Início
              </Link>
              <Chevron className="h-2.5 w-2.5" />
              <span className="text-foreground/55">Coleções em Destaque</span>
            </nav>
            {/* Heading */}
            <div className="flex items-baseline gap-3">
              <h2 className="text-[15px] sm:text-base font-semibold tracking-[0.18em] sm:tracking-widest uppercase text-foreground">
                Beauty Essentials
              </h2>
              <span className="text-[11px] text-foreground/40 font-light hidden sm:inline">
                Curadoria premium para cada ritual
              </span>
            </div>
          </div>

          {/* Category pills — wrap com fade no edge direito (mobile scroll hint) */}
          <div className="relative -mx-5 sm:mx-0">
            <div
              role="tablist"
              aria-label="Filtrar por categoria"
              className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none px-5 sm:px-0"
            >
              {CATEGORIES.map((cat, i) => (
                <Link
                  key={cat.label}
                  href={cat.href}
                  role="tab"
                  aria-selected={i === activeCategory}
                  onClick={() => setActiveCategory(i)}
                  className={[
                    "shrink-0 px-3.5 py-1.5 rounded-full text-[11px] font-medium tracking-[0.04em] transition-all duration-200 whitespace-nowrap",
                    i === activeCategory
                      ? "bg-foreground text-background"
                      : "border border-border text-foreground/60 hover:border-foreground/40 hover:text-foreground/80",
                  ].join(" ")}
                >
                  {cat.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ══ 3. CAROUSEL ══════════════════════════════════════════════════════ */}
      <div className="w-full bg-brand-pink">
        <div
          ref={carouselRef}
          className="relative max-w-[1440px] mx-auto hero-banner-height overflow-hidden"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          aria-label="Carrossel de coleções"
        >
          {/* Slides empilhados — cross-fade CSS ────────────────────────────── */}
          {SLIDES.map((s, i) => (
            <div
              key={s.src}
              aria-hidden={i !== active}
              className="absolute inset-0 transition-opacity duration-880ms ease-in-out"
              style={{
                opacity: i === active ? 1 : 0,
                zIndex: i === active ? 1 : 0,
              }}
            >
              <Image
                src={s.src}
                alt=""
                fill
                priority={i === 0}
                className="object-cover object-center"
                sizes="(max-width: 1440px) 100vw, 1440px"
                quality={90}
              />
              <div className={`absolute inset-0 ${s.overlay}`} />
            </div>
          ))}

          {/* Copy — scroll exit target ───────────────────────────────────── */}
          <div
            ref={contentRef}
            className="absolute inset-0 z-10 flex items-center"
          >
            <div
              ref={copyRef}
              className="w-full max-w-[560px] px-8 md:px-14 lg:px-20 space-y-3.5"
            >
              {/* Eyebrow */}
              <p
                className="text-[10px] uppercase font-semibold tracking-[0.26em]"
                style={{ color: slide.eyebrowColor }}
              >
                {slide.eyebrow}
              </p>

              {/* Título — re-monta a cada troca de slide (key={active}) */}
              <Typewriter
                key={`hero-title-${active}`}
                as="h1"
                text={slide.title}
                speed={45}
                delay={150}
                immediate
                className="text-[clamp(1.7rem,4.4vw,3.5rem)] leading-[1.06] tracking-[-0.025em] font-bold block"
                style={{ color: slide.titleColor }}
                ariaLabel={slide.title}
              />

              {/* Divisor */}
              <div
                className="w-9 h-px"
                style={{ background: slide.eyebrowColor }}
              />

              {/* Subtítulo */}
              <p
                className="text-[clamp(0.75rem,1.1vw,0.875rem)] font-light leading-relaxed max-w-[280px]"
                style={{ color: slide.subtitleColor }}
              >
                {slide.subtitle}
              </p>

              {/* CTA */}
              <div className="pt-0.5">
                <Link href="/allProducts">
                  <Button
                    size="sm"
                    className="border-none px-8 py-2.5 text-[11px] font-medium tracking-[0.14em] uppercase transition-opacity hover:opacity-80"
                    style={{ background: slide.ctaBg, color: slide.ctaText }}
                  >
                    {slide.cta}
                  </Button>
                </Link>
              </div>
            </div>
          </div>

          {/* Chevrons ────────────────────────────────────────────────────── */}
          <button
            onClick={() => {
              advance(-1);
              setPaused(true);
            }}
            aria-label="Slide anterior"
            className="absolute left-3 md:left-5 top-1/2 z-20 -translate-y-1/2 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border border-white/20 bg-black/25 text-white/65 backdrop-blur-sm transition-all hover:border-white/45 hover:text-white"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => {
              advance(1);
              setPaused(true);
            }}
            aria-label="Próximo slide"
            className="absolute right-3 md:right-5 top-1/2 z-20 -translate-y-1/2 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border border-white/20 bg-black/25 text-white/65 backdrop-blur-sm transition-all hover:border-white/45 hover:text-white"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </button>

          {/* Progress indicators ─────────────────────────────────────────── */}
          <div className="absolute bottom-4 left-8 md:left-14 lg:left-20 z-20 flex items-center gap-2.5">
            {SLIDES.map((_, i) => (
              <button
                key={i}
                aria-label={`Slide ${i + 1}`}
                onClick={() => {
                  setActive(i);
                  setPaused(true);
                }}
                className="relative h-[2px] cursor-pointer overflow-hidden rounded-full transition-all duration-300 focus-visible:outline-none"
                style={{ width: i === active ? 30 : 14 }}
              >
                <span className="absolute inset-0 bg-white/20" />
                {i === active && (
                  <span
                    className="absolute inset-y-0 left-0"
                    style={{
                      background: slide.eyebrowColor,
                      animation: `progress-fill ${INTERVAL}ms linear forwards`,
                      animationPlayState: paused ? "paused" : "running",
                    }}
                  />
                )}
                {i !== active && (
                  <span
                    className={`absolute inset-0 ${i < active ? "bg-white/45" : "bg-white/18"}`}
                  />
                )}
              </button>
            ))}
          </div>

        </div>
      </div>
    </div>
  );
}
