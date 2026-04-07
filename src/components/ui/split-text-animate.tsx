"use client";

/**
 * SplitTextAnimate — substituto zero-dependência do GSAP SplitText Club
 * Divide o texto em <span> por palavra ou caractere.
 * GSAP anima cada span com gsap.from() — elementos sempre visíveis no DOM.
 * prefers-reduced-motion: animação desabilitada.
 */

import { useRef, useMemo } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

interface SplitTextAnimateProps {
  text: string;
  /** "chars" | "words" — default: "chars" */
  type?: "chars" | "words";
  className?: string;
  /** Classe aplicada a cada span fragmento */
  charClassName?: string;
  delay?: number;
  duration?: number;
  stagger?: number;
  ease?: string;
  yPercent?: number;
  /** Se true, anima em scroll. Se false, anima na montagem. */
  scrollTrigger?: boolean;
}

export default function SplitTextAnimate({
  text,
  type = "chars",
  className,
  charClassName,
  delay = 0,
  duration = 0.75,
  stagger = 0.025,
  ease = "power4.out",
  yPercent = 110,
  scrollTrigger = false,
}: SplitTextAnimateProps) {
  const containerRef = useRef<HTMLSpanElement>(null);

  // Memoize fragments para evitar re-splits desnecessários
  const fragments = useMemo(() => {
    if (type === "words") {
      return text.split(" ").map((word, i) => ({ key: i, value: word, suffix: "\u00A0" }));
    }
    // chars: mantém espaços como nbsp
    return text.split("").map((char, i) => ({
      key: i,
      value: char === " " ? "\u00A0" : char,
      suffix: "",
    }));
  }, [text, type]);

  useGSAP(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced || !containerRef.current) return;

    const spans = containerRef.current.querySelectorAll<HTMLSpanElement>("[data-frag]");
    if (!spans.length) return;

    const fromVars: gsap.TweenVars = {
      opacity: 0,
      yPercent,
      duration,
      stagger,
      ease,
      delay,
    };

    if (scrollTrigger) {
      fromVars.scrollTrigger = {
        trigger: containerRef.current,
        start: "top 85%",
      };
    }

    gsap.from(spans, fromVars);
  }, { scope: containerRef });

  return (
    <span ref={containerRef} className={className} aria-label={text}>
      {fragments.map(({ key, value, suffix }) => (
        /* overflow:hidden cria o "curtain" efeito máscara por char */
        <span
          key={key}
          style={{
            display: "inline-block",
            overflow: "hidden",
            verticalAlign: "baseline",
            /* Folga evita corte em serifas/acento (ex.: "G" de Fragrancias) */
            paddingBlock: "0.08em",
            marginBlock: "-0.08em",
            paddingInline: "0.02em",
            marginInline: "-0.02em",
          }}
          aria-hidden="true"
        >
          <span data-frag className={charClassName} style={{ display: "inline-block" }}>
            {value}
          </span>
          {suffix}
        </span>
      ))}
    </span>
  );
}
