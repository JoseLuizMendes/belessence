/**
 * StatusPill — pílula de status compartilhada (pedidos, produtos, cupons).
 * Tom: bg tintado + texto da mesma família, sem borda colorida. Mantém
 * a paleta sóbria do admin; cor é informação, não decoração.
 *
 * Tones disponíveis correspondem às categorias semânticas do projeto:
 *  - neutral   → estado inerte/normal
 *  - pending   → aguardando ação (amarelo suave)
 *  - active    → confirmado / no fluxo (verde)
 *  - progress  → em movimento (azul)
 *  - shipped   → enviado (índigo)
 *  - done      → finalizado (verde forte)
 *  - alert     → atenção (âmbar)
 *  - danger    → erro / cancelado (vinho-vermelho)
 *  - muted     → secundário/descontinuado
 */

import { cn } from "@/shadcn-utils/utils";

type StatusTone =
  | "neutral"
  | "pending"
  | "active"
  | "progress"
  | "shipped"
  | "done"
  | "alert"
  | "danger"
  | "muted";

const TONE_CLASSES: Record<StatusTone, string> = {
  neutral: "bg-admin-panel-soft text-ink-soft",
  pending: "bg-yellow-100/70 text-yellow-900",
  active: "bg-emerald-100/70 text-emerald-900",
  progress: "bg-blue-100/70 text-blue-900",
  shipped: "bg-indigo-100/70 text-indigo-900",
  done: "bg-green-100/70 text-green-900",
  alert: "bg-amber-100/70 text-amber-900",
  danger: "bg-red-100/70 text-red-900",
  muted: "bg-ink-soft/10 text-ink-soft",
};

interface StatusPillProps {
  tone?: StatusTone;
  children: React.ReactNode;
  className?: string;
}

export function StatusPill({
  tone = "neutral",
  children,
  className,
}: StatusPillProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full",
        "text-[10px] font-medium tracking-[0.14em] uppercase whitespace-nowrap",
        TONE_CLASSES[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

export type { StatusTone };
