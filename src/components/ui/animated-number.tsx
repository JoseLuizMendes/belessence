"use client";

/**
 * AnimatedNumber — inteiro animado via useCountUp.
 * Para métricas (pedidos, clientes, estoque baixo, etc.).
 */

import { useCountUp } from "@/lib/hooks/use-count-up";

interface AnimatedNumberProps {
  value: number;
  className?: string;
  duration?: number;
  immediate?: boolean;
  /** Prefixo (ex.: "+"). */
  prefix?: string;
  /** Sufixo (ex.: "%"). */
  suffix?: string;
}

export function AnimatedNumber({
  value,
  className,
  duration = 1.4,
  immediate = false,
  prefix = "",
  suffix = "",
}: AnimatedNumberProps) {
  const { ref, value: display } = useCountUp({
    to: value,
    duration,
    immediate,
    format: (n) => `${prefix}${Math.round(n).toLocaleString("pt-BR")}${suffix}`,
  });

  return (
    <span ref={ref} className={className} suppressHydrationWarning>
      {display}
    </span>
  );
}

export default AnimatedNumber;
