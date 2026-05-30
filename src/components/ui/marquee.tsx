/**
 * Marquee — Belessence
 * ─────────────────────────────────────────────────────────────────────
 * Trilho de rolagem contínua e sem emenda. O conteúdo é duplicado e o
 * deslocamento de -50% (em globals.css) fecha o loop. Pausa no hover e
 * fica estático em prefers-reduced-motion. CSS puro — sem JS/estado.
 *
 * Uso:
 *   <Marquee durationSeconds={48} gapClassName="gap-5">
 *     {items.map(...)}
 *   </Marquee>
 */

import type { CSSProperties, ReactNode } from "react";
import { cn } from "@/shadcn-utils/utils";

export interface MarqueeProps {
  children: ReactNode;
  /** Velocidade: duração de um ciclo completo (s). Maior = mais lento. */
  durationSeconds?: number;
  /** Classe de espaçamento entre itens (ex.: "gap-6"). */
  gapClassName?: string;
  className?: string;
}

export function Marquee({
  children,
  durationSeconds = 42,
  gapClassName = "gap-6",
  className,
}: MarqueeProps) {
  const trackStyle = {
    "--marquee-duration": `${durationSeconds}s`,
  } as CSSProperties;

  return (
    <div
      className={cn("marquee-track relative w-full overflow-hidden", className)}
      style={trackStyle}
    >
      {/* Trilho único com 2 cópias; translateX(-50%) = largura de 1 cópia. */}
      <div className={cn("flex w-max animate-marquee-x", gapClassName)}>
        <div className={cn("flex w-max shrink-0", gapClassName)}>{children}</div>
        <div className={cn("flex w-max shrink-0", gapClassName)} aria-hidden>
          {children}
        </div>
      </div>
    </div>
  );
}

export default Marquee;
