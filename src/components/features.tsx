"use client";

/**
 * Features — Belessence (estilo Stitch / "Ritual Completo")
 * ─────────────────────────────────────────────────────────────────────
 * Estrutura inspirada no design Stitch:
 *  - Hero secundário com 2 imagens lado a lado (ritual)
 *  - Eyebrow + título serif
 *  - 3 cards icônicos: Curadoria, Maison, Service
 */

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { Sparkles, Heart, Truck } from "lucide-react";
import Image from "next/image";
import { staggerIn } from "@/lib/gsap-utils";

const FEATURES = [
  {
    icon: Sparkles,
    eyebrow: "Atelier",
    title: "Curadoria Especializada",
    body: "Seleção criteriosa de fragrâncias premium e exclusivas",
  },
  {
    icon: Heart,
    eyebrow: "Maison",
    title: "Experiência Personalizada",
    body: "Encontre o perfume perfeito para sua personalidade",
  },
  {
    icon: Truck,
    eyebrow: "Service",
    title: "Entrega Premium",
    body: "Embalagem cuidadosa e entrega rápida e segura",
  },
];

export default function Features() {
  const sectionRef = useRef<HTMLElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const ritualRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (!gridRef.current) return;
      const cards = gridRef.current.querySelectorAll("[data-animate-feature]");
      if (cards.length > 0) {
        staggerIn(cards, { y: 24, duration: 0.6, stagger: 0.14 });
      }
      if (ritualRef.current) {
        const imgs = ritualRef.current.querySelectorAll("[data-ritual-img]");
        if (imgs.length > 0) {
          staggerIn(imgs, { y: 32, duration: 0.8, stagger: 0.18 });
        }
      }
    },
    { scope: sectionRef },
  );

  return (
    <section
      ref={sectionRef}
      className="py-14 sm:py-20 md:py-24 bg-brand-pink"
    >
      <div className="container-belessence">
        {/* Heading */}
        <div className="text-center mb-12 sm:mb-16">
          <p className="text-[11px] font-medium tracking-[0.32em] uppercase text-brand-wine mb-4">
            Ritual Mari Beauty
          </p>
          <h2 className="font-playfair italic text-[clamp(2rem,4.5vw,3.4rem)] leading-tight tracking-[-0.02em] text-ink-strong">
            Ritual Completo
          </h2>
          <div className="mx-auto mt-5 h-px w-12 bg-brand-wine/60" />
        </div>

        {/* Imagens lado a lado — ritual visual (Stitch assets) */}
        <div
          ref={ritualRef}
          className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-5 mb-12 sm:mb-16 max-w-5xl mx-auto"
        >
          <div
            data-ritual-img
            className="relative aspect-[4/3] overflow-hidden rounded-token-sm bg-surface-section"
          >
            <Image
              src="/assets/stitch/ritual-completo.jpg"
              alt="Ritual de aplicação Mari Beauty"
              fill
              className="object-cover transition-transform duration-700 hover:scale-105"
              sizes="(max-width: 640px) 100vw, 50vw"
            />
          </div>
          <div
            data-ritual-img
            className="relative aspect-[4/3] overflow-hidden rounded-token-sm bg-surface-section"
          >
            <Image
              src="/assets/stitch/hero-essencia-natural.jpg"
              alt="Essência Natural Mari Beauty"
              fill
              className="object-cover transition-transform duration-700 hover:scale-105"
              sizes="(max-width: 640px) 100vw, 50vw"
            />
          </div>
        </div>

        {/* 3 cards Ritual Completo */}
        <div
          ref={gridRef}
          className="grid grid-cols-1 md:grid-cols-3 gap-8 sm:gap-10"
        >
          {FEATURES.map((f) => {
            const Icon = f.icon;
            return (
              <div
                key={f.title}
                data-animate-feature
                className="text-center group"
              >
                <div className="w-14 h-14 rounded-full bg-brand-wine/10 flex items-center justify-center mx-auto mb-5 transition-all duration-500 group-hover:bg-brand-wine group-hover:scale-110">
                  <Icon
                    className="h-6 w-6 text-brand-wine transition-colors group-hover:text-brand-pink"
                    strokeWidth={1.4}
                  />
                </div>
                <p className="text-[10px] font-medium tracking-[0.28em] uppercase text-brand-wine/70 mb-3">
                  {f.eyebrow}
                </p>
                <h3 className="font-playfair text-lg sm:text-xl italic font-medium mb-2 text-ink-strong">
                  {f.title}
                </h3>
                <p className="text-sm leading-relaxed text-ink-soft max-w-[260px] mx-auto font-light">
                  {f.body}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
