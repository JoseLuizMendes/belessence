"use client";

import { useRef, useCallback, useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "./ui/button";

// Perf6 excluído
const SLIDES = [
  {
    src: "/assets-removebg/Perf1-removebg.svg",
    eyebrow: "Novo Lançamento",
    title: "Essência do\nAmanhecer",
    subtitle: "Notas frescas de bergamota e cedro branco",
    cta: "Descobrir Agora",
  },
  {
    src: "/assets-removebg/Perf2-removebg.png",
    eyebrow: "Coleção Exclusiva",
    title: "Âmbar\nNoturno",
    subtitle: "A intensidade do âmbar com fundo de baunilha",
    cta: "Ver Coleção",
  },
  {
    src: "/assets-removebg/Perf3-removebg.png",
    eyebrow: "Edição Limitada",
    title: "Silagem\nProlongada",
    subtitle: "Alta fixação — permanece por até 12 horas",
    cta: "Garantir o Meu",
  },
  {
    src: "/assets-removebg/Perf4-removebg.png",
    eyebrow: "Best Seller",
    title: "Coração\nde Rosa",
    subtitle: "Floral sofisticado com acorde de rosa turca",
    cta: "Explorar",
  },
  {
    src: "/assets-removebg/Perf5-removebg.png",
    eyebrow: "Tendência 2026",
    title: "Acorde\nBoisé",
    subtitle: "Madeiras raras e musgo branco em harmonia",
    cta: "Conhecer",
  },
  {
    src: "/assets-removebg/Perf7-removebg.png",
    eyebrow: "Maison Belessence",
    title: "Accord\nUltime",
    subtitle: "A fragrância mais icônica da Maison",
    cta: "Descobrir",
  },
];

export default function Hero() {
  const [selectedIndex, setSelectedIndex] = useState(0);

  const [emblaRef, emblaApi] = useEmblaCarousel(
    { loop: true, duration: 40 },
    [Autoplay({ delay: 5000, stopOnInteraction: true, stopOnMouseEnter: true })],
  );

  useEffect(() => {
    if (!emblaApi) return;
    const onSelect = () => setSelectedIndex(emblaApi.selectedScrollSnap());
    emblaApi.on("select", onSelect);
    return () => { emblaApi.off("select", onSelect); };
  }, [emblaApi]);

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

  return (
    /* h-[90vh] explícito — única forma de h-full funcionar nos filhos */
    <section className="relative w-full h-[90vh] overflow-hidden bg-hero-radial">

      {/* Grain texture — exceção aceita: data URI */}
      <div
        className="absolute inset-0 z-0 opacity-[0.028] pointer-events-none"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E\")",
        }}
      />

      {/* Fade inferior */}
      <div className="absolute inset-0 z-0 bg-fade-bottom-soft pointer-events-none" />

      {/* Embla viewport — h-full herda os 90vh do section */}
      <div ref={emblaRef} className="h-full overflow-hidden">
        <div className="flex h-full">
          {SLIDES.map((slide, i) => (
            <div
              key={i}
              className="relative h-full shrink-0"
              style={{ flex: "0 0 100%" }}
            >
              {/* Perfume PNG — direita, padding-bottom para "sentar" na base */}
              <div className="absolute right-0 inset-y-0 w-[52%] md:w-[48%] pb-8">
                <Image
                  src={slide.src}
                  alt={slide.title.replace("\n", " ")}
                  fill
                  priority={i === 0}
                  className="object-contain object-bottom"
                  sizes="(max-width: 768px) 52vw, 48vw"
                />
              </div>

              {/* Linha vertical editorial */}
              <div className="absolute left-10 top-1/2 z-10 hidden -translate-y-1/2 flex-col items-center gap-4 lg:flex md:left-16">
                <div className="h-24 w-px bg-line-gold-fade-in" />
                <div className="h-1.5 w-1.5 rounded-full dot-gold" />
                <div className="h-24 w-px bg-line-gold-fade-out" />
              </div>

              {/* Copy — metade esquerda */}
              <div className="absolute inset-0 z-10 flex items-center">
                <div className="container-belessence w-full">
                  <div className="w-1/2 md:w-[48%] pr-4">

                    <p className="eyebrow mb-5 text-brand-gold-light">
                      {slide.eyebrow}
                    </p>

                    <div className="mb-7 h-px w-14 divider-gold-strong" />

                    <h1 className="display-title mb-5 text-surface-contrast text-[clamp(2rem,5vw,4.5rem)] whitespace-pre-line">
                      {slide.title}
                    </h1>

                    <p className="mb-9 max-w-xs text-sm font-light leading-relaxed text-dark-warm">
                      {slide.subtitle}
                    </p>

                    <Link href="/allProducts">
                      <Button
                        size="lg"
                        className="group border-none bg-brand-gold px-8 py-3 text-sm font-medium tracking-[0.08em] uppercase text-ink-strong hover:bg-brand-gold-light"
                      >
                        {slide.cta}
                        <ChevronRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>

              {/* Contador */}
              <div className="absolute bottom-20 right-8 z-10 hidden md:flex">
                <span className="eyebrow text-[10px] text-dark-soft tabular-nums">
                  {String(i + 1).padStart(2, "0")} / {String(SLIDES.length).padStart(2, "0")}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Chevrons */}
      <button
        onClick={scrollPrev}
        aria-label="Slide anterior"
        className="absolute left-4 top-1/2 z-20 -translate-y-1/2 flex h-11 w-11 cursor-pointer items-center justify-center rounded-full bg-white/10 backdrop-blur-sm border border-white/10 text-white transition-all hover:bg-white/20 md:left-8"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>
      <button
        onClick={scrollNext}
        aria-label="Próximo slide"
        className="absolute right-4 top-1/2 z-20 -translate-y-1/2 flex h-11 w-11 cursor-pointer items-center justify-center rounded-full bg-white/10 backdrop-blur-sm border border-white/10 text-white transition-all hover:bg-white/20 md:right-8"
      >
        <ChevronRight className="h-5 w-5" />
      </button>

      {/* Dots */}
      <div className="absolute bottom-7 left-1/2 z-20 -translate-x-1/2 flex gap-2">
        {SLIDES.map((_, i) => (
          <button
            key={i}
            aria-label={`Ir para slide ${i + 1}`}
            onClick={() => emblaApi?.scrollTo(i)}
            className={`h-px cursor-pointer transition-all duration-300 focus-visible:outline-none ${
              i === selectedIndex ? "w-8 bg-brand-gold" : "w-4 bg-white/30 hover:bg-white/50"
            }`}
          />
        ))}
      </div>
    </section>
  );
}
