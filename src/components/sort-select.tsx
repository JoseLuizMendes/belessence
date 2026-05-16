"use client";

/**
 * SortSelect — Belessence
 * ─────────────────────────────────────────────────────────────────────
 * Dropdown de ordenação client-side que atualiza searchParam `sort`
 * sem usar form submit (mantém os outros params intactos).
 */

import { useRouter, useSearchParams, usePathname } from "next/navigation";

export interface SortOption {
  label: string;
  value: string;
}

interface SortSelectProps {
  options: SortOption[];
  defaultValue: string;
}

export function SortSelect({ options, defaultValue }: SortSelectProps) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const handleChange = (value: string) => {
    const newParams = new URLSearchParams(params.toString());
    if (value && value !== "best-seller") {
      newParams.set("sort", value);
    } else {
      newParams.delete("sort");
    }
    const qs = newParams.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  };

  return (
    <div className="flex items-center gap-2">
      <label
        htmlFor="sort"
        className="text-[10px] font-medium tracking-[0.18em] uppercase text-ink-soft whitespace-nowrap"
      >
        Ordenar por
      </label>
      <select
        id="sort"
        defaultValue={defaultValue}
        onChange={(e) => handleChange(e.target.value)}
        className="h-9 px-3 pr-8 text-xs bg-surface-panel border border-border-subtle rounded-full text-ink-strong outline-none focus:border-brand-wine transition-colors cursor-pointer appearance-none bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2210%22 height=%2210%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22%23999%22 stroke-width=%222%22><polyline points=%226 9 12 15 18 9%22/></svg>')] bg-no-repeat bg-[right_10px_center]"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
