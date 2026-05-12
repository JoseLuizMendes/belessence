"use client";

/**
 * CollectionsProducts — Belessence
 * Visual: cards portrait editoriais com overlay, eyebrow, tipografia display — referência Byredo/MFK
 * Regra: zero style={} hardcoded — gradientes e cores via classes CSS
 */

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

gsap.registerPlugin(ScrollTrigger);

// accentClass referencia classes definidas em globals.css (.bg-accent-*)
const COLLECTIONS = [
  {
    slug:        "essencia-noturna",
    name:        "Essência Noturna",
    subtitle:    "Intenso & Sedutor",
    description: "Fragrâncias profundas para momentos que ficam na memória",
    count:       "12 fragrâncias",
    image:       "/assets/Perf5.jpg",
    accentClass: "bg-accent-deep",
  },
  {
    slug:        "elegancia-diurna",
    name:        "Elegância Diurna",
    subtitle:    "Sofisticado & Leve",
    description: "Perfumes que acompanham cada momento do seu dia com refinamento",
    count:       "8 fragrâncias",
    image:       "/assets/Perf4.jpg",
    accentClass: "bg-accent-mid",
  },
  {
    slug:        "edicao-limitada",
    name:        "Edição Limitada",
    subtitle:    "Exclusivo & Raro",
    description: "Criações únicas em quantidades cuidadosamente limitadas",
    count:       "5 fragrâncias",
    image:       "/assets/Perf6.jpg",
    accentClass: "bg-accent-light",
  },
];

export default function CollectionsProducts() {
  const sectionRef = useRef<HTMLElement>(null);
  const headingRef = useRef<HTMLDivElement>(null);
  const gridRef    = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;

    if (headingRef.current) {
      gsap.from(headingRef.current, {
        opacity: 0, y: 30, duration: 0.9, ease: "power4.out",
        scrollTrigger: { trigger: headingRef.current, start: "top 85%" },
      });
    }

    if (gridRef.current) {
      const cards = gridRef.current.querySelectorAll("[data-card]");
      if (cards.length) {
        gsap.from(cards, {
          opacity: 0, y: 50, duration: 0.9, stagger: 0.15, ease: "power4.out",
          scrollTrigger: { trigger: gridRef.current, start: "top 80%" },
        });
      }
    }
  }, { scope: sectionRef });

  return (
    <section ref={sectionRef} className="bg-surface-base py-20 md:py-28 lg:py-36">
      <div className="container-belessence">

        {/* Heading */}
        <div ref={headingRef} className="mb-14 text-center md:mb-20">
          <p className="eyebrow mb-5 text-brand-gold">Universo Belessence</p>
          <h2 className="display-title text-ink-strong text-[clamp(2rem,5vw,3.5rem)]">
            Coleções Exclusivas
          </h2>
          <div className="mx-auto mt-6 h-px w-12 divider-gold" />
        </div>

        {/* Grid */}
        <div ref={gridRef} className="grid grid-cols-1 gap-4 md:grid-cols-3 md:gap-6">
          {COLLECTIONS.map((col) => (
            <Link
              key={col.slug}
              href={`/collections/${col.slug}`}
              data-card
              className="group relative block overflow-hidden rounded-token-xs"
            >
              <div className="relative aspect-product overflow-hidden">
                <Image
                  src={col.image}
                  alt={col.name}
                  fill
                  className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                  sizes="(max-width: 768px) 100vw, 33vw"
                />

                {/* Overlay — usa classe definida em globals.css */}
                <div className="absolute inset-0 gradient-image-overlay transition-opacity duration-500" />

                {/* Linha de acento por coleção — sem style={} */}
                <div className={`absolute bottom-0 left-0 right-0 h-px opacity-60 ${col.accentClass}`} />

                {/* Conteúdo */}
                <div className="absolute inset-0 flex flex-col justify-end p-6 sm:p-7">
                  <p className="eyebrow mb-3 text-brand-gold-light opacity-80">
                    {col.subtitle}
                  </p>

                  <h3 className="mb-2 font-playfair font-normal leading-tight tracking-[-0.01em] text-surface-contrast text-[clamp(1.25rem,2.5vw,1.75rem)]">
                    {col.name}
                  </h3>

                  <p className="mb-4 line-clamp-2 text-sm font-light leading-relaxed text-dark-warm">
                    {col.description}
                  </p>

                  <div className="flex items-center justify-between">
                    <span className="text-[11px] tracking-[0.12em] uppercase text-dark-soft">
                      {col.count}
                    </span>
                    <span className="flex items-center gap-1.5 text-xs font-medium tracking-[0.08em] uppercase text-brand-gold-light transition-all duration-300 group-hover:gap-2.5">
                      Explorar
                      <ArrowRight className="h-3 w-3" />
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
