"use client";

/**
 * SortSelect — Belessence
 * ─────────────────────────────────────────────────────────────────────
 * Dropdown de ordenação client-side com shadcn Select que atualiza
 * o searchParam `sort` (mantém os outros params intactos).
 */

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
      <Label
        htmlFor="sort"
        className="text-[10px] font-medium tracking-[0.18em] uppercase text-ink-soft whitespace-nowrap"
      >
        Ordenar por
      </Label>
      <Select defaultValue={defaultValue} onValueChange={handleChange}>
        <SelectTrigger
          id="sort"
          className="h-9 w-[180px] text-xs bg-surface-panel border-border-subtle rounded-full text-ink-strong focus-visible:border-brand-wine focus:ring-0"
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
