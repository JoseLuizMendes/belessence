"use client";

/**
 * CollectionsProducts — Belessence
 * Visual: cards portrait editoriais com overlay, eyebrow, tipografia display — referência Byredo/MFK
 * Regra: zero style={} hardcoded — gradientes e cores via classes CSS
 */

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { scrollReveal } from "@/lib/gsap-utils";

// accentClass referencia classes definidas em globals.css (.bg-accent-*)
const COLLECTIONS = [
  {
    slug:        "essencia-noturna",
    name:        "Lumière Creme Mãos",
    subtitle:    "Ritual de Cuidado",
    description: "Toque sedoso e fragrância envolvente para mãos sempre delicadas",
    count:       "R$ 289,90",
    image:       "/assets/stitch/related-creme-maos.jpg",
    accentClass: "bg-accent-deep",
  },
  {
    slug:        "elegancia-diurna",
    name:        "Água de Beleza Divina",
    subtitle:    "Frescor & Luminosidade",
    description: "Composição leve que perfuma e revigora a pele em camadas",
    count:       "R$ 289,90",
    image:       "/assets/stitch/related-agua-beleza.jpg",
    accentClass: "bg-accent-mid",
  },
  {
    slug:        "edicao-limitada",
    name:        "Kit Descoberta",
    subtitle:    "Trilogia Olfativa",
    description: "Três fragrâncias autorais para encontrar sua assinatura",
    count:       "R$ 289,90",
    image:       "/assets/stitch/related-kit-descoberta.jpg",
    accentClass: "bg-accent-light",
  },
];

export default function CollectionsProducts() {
  const sectionRef = useRef<HTMLElement>(null);
  const headingRef = useRef<HTMLDivElement>(null);
  const gridRef    = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    // Só o heading anima (texto). Os cards contêm <Image>: qualquer reveal que
    // os esconda/transforme faz a imagem "sumir" no scroll rápido sob Lenis.
    if (headingRef.current) {
      scrollReveal(headingRef.current, { trigger: headingRef.current, y: 24 });
    }
  }, { scope: sectionRef });

  return (
    <section ref={sectionRef} className="py-20 md:py-28 lg:py-36">
      <div className="container-belessence">

        {/* Heading */}
        <div ref={headingRef} className="mb-14 text-center md:mb-20">
          <p className="eyebrow mb-5 text-brand-gold">Universo Mari Beauty</p>
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
                  className="object-cover gpu-layer"
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
