"use client";

/**
 * NumberField — Input numérico com stepper horizontal [−] valor [+].
 * ─────────────────────────────────────────────────────────────────────
 * Substitui as setinhas nativas (feias) do <input type="number"> por um
 * controle segmentado no padrão do design (borda única, foco bordô, hover
 * bordô nos botões). Funciona controlado (`value` + `onValueChange`) ou
 * não-controlado (`defaultValue` + `name`, para submissão via FormData).
 */

import * as React from "react";
import { Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/shadcn-utils/utils";

interface NumberFieldProps
  extends Omit<
    React.ComponentProps<"input">,
    "type" | "value" | "defaultValue" | "onChange"
  > {
  /** Valor controlado (string). Use com `onValueChange`. */
  value?: string | number;
  /** Valor inicial não-controlado. */
  defaultValue?: string | number;
  /** Callback de mudança (digitação ou stepper). */
  onValueChange?: (value: string) => void;
  step?: number;
  min?: number;
  max?: number;
}

function decimalsOf(step: number): number {
  const s = String(step);
  const dot = s.indexOf(".");
  return dot === -1 ? 0 : s.length - dot - 1;
}

export function NumberField({
  value: controlledValue,
  defaultValue,
  onValueChange,
  step = 1,
  min,
  max,
  className,
  disabled,
  ...props
}: NumberFieldProps) {
  const isControlled = controlledValue !== undefined;
  const [internal, setInternal] = React.useState<string>(
    defaultValue != null ? String(defaultValue) : "",
  );
  const value = isControlled ? String(controlledValue ?? "") : internal;

  const commit = (next: string) => {
    if (!isControlled) setInternal(next);
    onValueChange?.(next);
  };

  const stepBy = (dir: 1 | -1) => {
    const current = Number(value);
    const base = Number.isFinite(current) ? current : 0;
    let next = base + dir * step;
    if (min != null) next = Math.max(min, next);
    if (max != null) next = Math.min(max, next);
    const d = decimalsOf(step);
    commit(d > 0 ? next.toFixed(d) : String(next));
  };

  const numeric = Number(value);
  const atMax = max != null && Number.isFinite(numeric) && numeric >= max;
  const atMin = min != null && Number.isFinite(numeric) && numeric <= min;

  return (
    <div
      data-slot="number-field"
      className={cn(
        "flex h-11 items-stretch overflow-hidden rounded-token-sm border border-border-subtle bg-surface-base transition-colors focus-within:border-brand-wine",
        disabled && "opacity-50",
        className,
      )}
    >
      <Button
        type="button"
        variant="ghost"
        size="icon"
        tabIndex={-1}
        aria-label="Diminuir"
        disabled={disabled || atMin}
        onClick={() => stepBy(-1)}
        className="h-full w-10 shrink-0 rounded-none border-r border-border-subtle text-ink-soft hover:bg-brand-wine hover:text-brand-pink disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-ink-soft"
      >
        <Minus className="size-4" />
      </Button>

      <input
        type="number"
        inputMode="decimal"
        step={step}
        min={min}
        max={max}
        value={value}
        onChange={(e) => commit(e.target.value)}
        disabled={disabled}
        className="min-w-0 flex-1 bg-transparent px-2 text-center text-sm text-ink-strong tabular-nums outline-none placeholder:text-ink-muted disabled:cursor-not-allowed"
        {...props}
      />

      <Button
        type="button"
        variant="ghost"
        size="icon"
        tabIndex={-1}
        aria-label="Aumentar"
        disabled={disabled || atMax}
        onClick={() => stepBy(1)}
        className="h-full w-10 shrink-0 rounded-none border-l border-border-subtle text-ink-soft hover:bg-brand-wine hover:text-brand-pink disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-ink-soft"
      >
        <Plus className="size-4" />
      </Button>
    </div>
  );
}
