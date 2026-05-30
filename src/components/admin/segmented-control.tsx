"use client";

/**
 * SegmentedControl — pill toggle com indicador deslizante (DNA boty).
 * Substitui select/tabs para filtros de poucas opções (≤ 5).
 * Sincroniza com a URL via nuqs/searchParams quando passado um `onChange`
 * que faça router.replace; o componente em si só gerencia o índice ativo.
 *
 * Sem framer-motion: usamos transform/transition CSS no indicador.
 */

import { useEffect, useRef, useState } from "react";
import { cn } from "@/shadcn-utils/utils";

interface SegmentOption<T extends string> {
  value: T;
  label: string;
  count?: number;
}

interface SegmentedControlProps<T extends string> {
  options: SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
  ariaLabel?: string;
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  className,
  ariaLabel,
}: SegmentedControlProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [indicator, setIndicator] = useState<{ left: number; width: number } | null>(null);

  useEffect(() => {
    const node = containerRef.current?.querySelector<HTMLButtonElement>(
      `[data-value="${CSS.escape(value)}"]`,
    );
    if (!node || !containerRef.current) return;
    const containerRect = containerRef.current.getBoundingClientRect();
    const nodeRect = node.getBoundingClientRect();
    setIndicator({
      left: nodeRect.left - containerRect.left,
      width: nodeRect.width,
    });
  }, [value, options]);

  return (
    <div
      ref={containerRef}
      role="tablist"
      aria-label={ariaLabel}
      className={cn(
        "relative inline-flex items-center p-1 rounded-full",
        "bg-admin-panel-soft border border-admin-soft",
        className,
      )}
    >
      {indicator && (
        <span
          aria-hidden="true"
          className="absolute top-1 bottom-1 rounded-full bg-brand-wine shadow-[0_4px_12px_-4px_rgba(46,11,18,0.35)]"
          style={{
            transform: `translateX(${indicator.left}px)`,
            width: indicator.width,
            transition: "transform 220ms cubic-bezier(0.22, 1, 0.36, 1), width 220ms cubic-bezier(0.22, 1, 0.36, 1)",
          }}
        />
      )}
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            role="tab"
            aria-selected={active}
            data-value={opt.value}
            onClick={() => onChange(opt.value)}
            className={cn(
              "relative z-10 px-4 py-1.5 rounded-full whitespace-nowrap",
              "text-[11px] font-medium tracking-[0.14em] uppercase",
              "transition-colors duration-200 focus-ring",
              active
                ? "text-brand-pink"
                : "text-ink-soft hover:text-ink-strong",
            )}
          >
            {opt.label}
            {opt.count !== undefined && (
              <span
                className={cn(
                  "ml-1.5 text-[10px] font-data",
                  active ? "text-brand-pink/70" : "text-ink-muted",
                )}
              >
                {opt.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
