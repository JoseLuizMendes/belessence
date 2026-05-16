"use client";

/**
 * Typewriter — texto digitado caractere por caractere.
 *
 * - Dispara via IntersectionObserver (uma vez)
 * - prefers-reduced-motion: renderiza o texto completo imediatamente
 * - Suporta cursor piscante opcional
 *
 * Uso:
 *   <Typewriter text="Pedido confirmado" speed={45} cursor />
 */

import { useEffect, useRef, useState } from "react";

interface TypewriterProps {
  text: string;
  /** Atraso antes de iniciar (ms). Default 0. */
  delay?: number;
  /** ms por caractere. Default 35. */
  speed?: number;
  /** Mostra cursor piscante após terminar. */
  cursor?: boolean;
  /** Dispara assim que montar, sem aguardar viewport. */
  immediate?: boolean;
  className?: string;
  /** Estilo inline repassado à tag raiz (ex.: cor por slide do carrossel). */
  style?: React.CSSProperties;
  /** Aria-label opcional; se ausente, usa o texto completo. */
  ariaLabel?: string;
  /** Tag a renderizar (default span). */
  as?: keyof React.JSX.IntrinsicElements;
}

export function Typewriter({
  text,
  delay = 0,
  speed = 35,
  cursor = false,
  immediate = false,
  className,
  style,
  ariaLabel,
  as: Tag = "span",
}: TypewriterProps) {
  const ref = useRef<HTMLElement | null>(null);
  const [displayed, setDisplayed] = useState<string>("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      setDisplayed(text);
      setDone(true);
      return;
    }

    const timers: ReturnType<typeof setTimeout>[] = [];
    let cancelled = false;

    const start = () => {
      if (cancelled) return;
      // garante reset em caso de re-mount com texto novo
      setDisplayed("");
      setDone(false);

      const startTimer = setTimeout(() => {
        for (let i = 0; i < text.length; i++) {
          const t = setTimeout(() => {
            if (cancelled) return;
            setDisplayed(text.slice(0, i + 1));
            if (i === text.length - 1) setDone(true);
          }, i * speed);
          timers.push(t);
        }
      }, delay);
      timers.push(startTimer);
    };

    if (immediate || !ref.current) {
      start();
      return () => {
        cancelled = true;
        timers.forEach(clearTimeout);
      };
    }

    const obs = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            start();
            obs.disconnect();
            break;
          }
        }
      },
      { threshold: 0.1 },
    );
    obs.observe(ref.current);

    return () => {
      cancelled = true;
      obs.disconnect();
      timers.forEach(clearTimeout);
    };
  }, [text, speed, delay, immediate]);

  const TagComponent = Tag as React.ElementType;

  return (
    <TagComponent
      ref={ref}
      className={className}
      style={style}
      aria-label={ariaLabel ?? text}
    >
      <span aria-hidden="true">
        {displayed}
        {cursor && (
          <span
            className={[
              "inline-block w-[1px] h-[0.9em] align-baseline ml-0.5 bg-current",
              done ? "animate-pulse" : "",
            ].join(" ")}
          />
        )}
      </span>
      {/* Texto completo escondido para leitores de tela e SEO */}
      <span className="sr-only">{text}</span>
    </TagComponent>
  );
}

export default Typewriter;
