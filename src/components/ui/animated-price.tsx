"use client";

/**
 * AnimatedPrice — número monetário animado via useCountUp.
 *
 * Uso:
 *   <AnimatedPrice value={1234.5} />
 */

import { useCountUp } from "@/lib/hooks/use-count-up";
import { formatPrice } from "@/shadcn-utils/utils";

interface AnimatedPriceProps {
  value: number;
  className?: string;
  /** Duração da animação. Default 1.4s. */
  duration?: number;
  /** Inicia ao montar (sem aguardar scroll). */
  immediate?: boolean;
}

export function AnimatedPrice({
  value,
  className,
  duration = 1.4,
  immediate = false,
}: AnimatedPriceProps) {
  const { ref, value: display } = useCountUp({
    to: value,
    duration,
    immediate,
    format: (n) => formatPrice(n),
  });

  return (
    <span ref={ref} className={className} suppressHydrationWarning>
      {display}
    </span>
  );
}

export default AnimatedPrice;
