/**
 * MetricCard — KPI tile do dashboard.
 * Bordas hairline aquecidas (border-admin) + sombra petal sutil.
 * Delta opcional (vs ontem / vs mês anterior) com seta e cor.
 * Hint final é uma linha pequena, ex.: "atualizado agora".
 */

import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { cn } from "@/shadcn-utils/utils";
import { AnimatedNumber } from "@/components/ui/animated-number";

interface MetricCardProps {
  label: string;
  /** Número (anima) ou string (render direto, ex.: "—" ou "12%"). */
  value: number | string;
  delta?: { pct: number; period: string };
  hint?: string;
  className?: string;
}

export function MetricCard({
  label,
  value,
  delta,
  hint,
  className,
}: MetricCardProps) {
  const up = delta ? delta.pct >= 0 : true;
  const DeltaIcon = up ? ArrowUpRight : ArrowDownRight;
  const deltaColor = up ? "text-positive" : "text-negative";

  return (
    <div
      className={cn(
        "bg-admin-panel border border-admin rounded-token-md p-5 shadow-petal-1",
        "transition-shadow duration-200 hover:shadow-petal-2",
        className,
      )}
    >
      <p className="text-[10px] font-medium tracking-[0.28em] uppercase text-ink-muted mb-3">
        {label}
      </p>
      {typeof value === "number" ? (
        <AnimatedNumber
          value={value}
          immediate
          className="font-data text-3xl sm:text-4xl text-ink-strong block leading-none"
        />
      ) : (
        <span className="font-data text-3xl sm:text-4xl text-ink-strong block leading-none">
          {value}
        </span>
      )}
      {delta && (
        <p className="mt-4 flex items-center gap-1 text-xs">
          <DeltaIcon className={`h-3.5 w-3.5 ${deltaColor}`} strokeWidth={2} />
          <span className={`font-data ${deltaColor}`}>
            {Math.abs(delta.pct)}%
          </span>
          <span className="text-ink-muted ml-1">{delta.period}</span>
        </p>
      )}
      {hint && !delta && (
        <p className="mt-4 text-xs text-ink-muted">{hint}</p>
      )}
    </div>
  );
}
