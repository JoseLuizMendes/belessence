"use client";

/**
 * useCountUp — contador animado disparado por ScrollTrigger.
 *
 * Uso:
 *   const { ref, value } = useCountUp({ to: 1234, format: formatPrice });
 *   return <span ref={ref}>{value}</span>;
 *
 * Comportamento:
 *  - Anima 0 → `to` quando o ref entra no viewport (once: true)
 *  - prefers-reduced-motion: renderiza o valor final direto, sem animação
 *  - Reage a mudanças em `to` (re-anima do valor atual para o novo `to`)
 */

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

interface UseCountUpOptions {
  to: number;
  duration?: number;
  /** Ease GSAP (default: "power2.out"). */
  ease?: string;
  /** Formata o valor exibido. Default: arredonda para int. */
  format?: (n: number) => string;
  /** Dispara imediatamente sem aguardar scroll. */
  immediate?: boolean;
}

export function useCountUp({
  to,
  duration = 1.4,
  ease = "power2.out",
  format = (n) => Math.round(n).toString(),
  immediate = false,
}: UseCountUpOptions) {
  const ref = useRef<HTMLSpanElement | null>(null);
  const [display, setDisplay] = useState<string>(format(0));
  const currentRef = useRef<number>(0);
  const lastToRef = useRef<number>(to);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      currentRef.current = to;
      setDisplay(format(to));
      return;
    }

    const proxy = { value: currentRef.current };
    const target = to;
    lastToRef.current = to;

    const tween = gsap.to(proxy, {
      value: target,
      duration,
      ease,
      paused: !immediate,
      onUpdate: () => {
        currentRef.current = proxy.value;
        setDisplay(format(proxy.value));
      },
    });

    if (immediate) {
      // já roda
      return () => {
        tween.kill();
      };
    }

    const el = ref.current;
    if (!el) {
      tween.play();
      return () => tween.kill();
    }

    const st = ScrollTrigger.create({
      trigger: el,
      start: "top 90%",
      once: true,
      onEnter: () => tween.play(),
    });

    return () => {
      st.kill();
      tween.kill();
    };
    // Intencional: format/ease/duration são estáveis na prática; reanima quando `to` muda.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [to, immediate]);

  return { ref, value: display };
}
