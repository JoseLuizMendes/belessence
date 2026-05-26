"use client";

/**
 * LenisProvider — Smooth scroll global via Lenis + integração com GSAP ScrollTrigger
 *
 * Integração oficial: Lenis → requestAnimationFrame → gsap.ticker
 * prefers-reduced-motion: Lenis desativado, scroll nativo mantido.
 *
 * Ref: https://lenis.darkroom.engineering
 */

import { useEffect, ReactNode } from "react";
import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

interface LenisProviderProps {
  children: ReactNode;
}

export function LenisProvider({ children }: LenisProviderProps) {
  useEffect(() => {
    // Respeitar prefers-reduced-motion
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) return;

    // Smooth scroll mais suave/curto: reduz a velocidade de pico do scroll,
    // dando tempo do Next/Image rasterizar (evita o "sumiço" da imagem em
    // flicks rápidos). duration menor = assenta antes; multipliers menores =
    // menos distância por gesto = menor velocidade.
    const lenis = new Lenis({
      duration: 0.9,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      wheelMultiplier: 0.8,
      touchMultiplier: 1.5,
    });

    // Integrar Lenis ao GSAP ticker (padrão oficial).
    // Mantemos referência ao callback para poder remover no cleanup.
    const onScroll = () => ScrollTrigger.update();
    lenis.on("scroll", onScroll);

    const tickerCallback = (time: number) => {
      lenis.raf(time * 1000);
    };
    gsap.ticker.add(tickerCallback);
    gsap.ticker.lagSmoothing(0);

    return () => {
      lenis.off("scroll", onScroll);
      gsap.ticker.remove(tickerCallback);
      lenis.destroy();
    };
  }, []);

  return <>{children}</>;
}
