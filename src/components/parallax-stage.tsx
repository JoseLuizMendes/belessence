"use client";

/**
 * ParallaxStage — Belessence
 * ─────────────────────────────────────────────────────────────────────
 * Painel (creme arredondado) que sobe sobre o conteúdo de trás com
 * sensação de profundidade: aplica um parallax scrub ao elemento `behindId`
 * (por padrão o hero, #inicio), que "fica para trás" mais devagar enquanto
 * este painel rola por cima.
 *
 * Restrição: o alvo de trás pode conter <Image> do Next; um parallax suave
 * (yPercent pequeno) na FAIXA em que ele já está saindo da viewport evita o
 * bug de "sumiço de imagem" sob Lenis. Reduced-motion → sem parallax.
 */

import { useRef, type ReactNode } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { prefersReducedMotion } from "@/lib/gsap-utils";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

interface ParallaxStageProps {
  children: ReactNode;
  id?: string;
  className?: string;
  /** id do elemento de trás que recebe o parallax (default "inicio" = hero). */
  behindId?: string;
  /** Intensidade do parallax (yPercent do elemento de trás). */
  amount?: number;
}

export function ParallaxStage({
  children,
  id,
  className,
  behindId = "inicio",
  amount = 12,
}: ParallaxStageProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (prefersReducedMotion()) return;
      const panel = panelRef.current;
      const behind = document.getElementById(behindId);
      if (!panel || !behind) return;

      // Trigger no próprio hero, começando no topo absoluto (start "top top"):
      // garante yPercent 0 no repouso (sem resíduo) e o hero "recua" mais devagar
      // conforme sai da viewport, enquanto o painel sobe por cima.
      gsap.to(behind, {
        yPercent: amount,
        ease: "none",
        scrollTrigger: {
          trigger: behind,
          start: "top top",
          end: "bottom top",
          scrub: true,
        },
      });
    },
    { scope: panelRef, dependencies: [behindId, amount] },
  );

  return (
    <div id={id} ref={panelRef} className={className}>
      {children}
    </div>
  );
}

export default ParallaxStage;
