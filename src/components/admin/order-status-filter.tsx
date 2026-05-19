"use client";

/**
 * OrderStatusFilter — pílulas de filtro de status com shadcn ToggleGroup.
 * ─────────────────────────────────────────────────────────────────────
 * Recebe o status ativo (do searchParams server-side) e navega ao mudar.
 * value="" representa "Todos" (sem filtro).
 */

import { useRouter } from "next/navigation";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import type { OrderStatus } from "@prisma/client";

interface OrderStatusFilterProps {
  activeStatus: OrderStatus | undefined;
  statuses: ReadonlyArray<{ value: OrderStatus; label: string }>;
}

export function OrderStatusFilter({
  activeStatus,
  statuses,
}: OrderStatusFilterProps) {
  const router = useRouter();

  const handleChange = (value: string) => {
    // ToggleGroup single permite "desselecionar" → trata como "Todos"
    if (!value || value === "all") {
      router.push("/admin/pedidos");
      return;
    }
    router.push(`/admin/pedidos?status=${value}`);
  };

  const current = activeStatus ?? "all";

  return (
    <ToggleGroup
      type="single"
      value={current}
      onValueChange={handleChange}
      spacing={8}
      className="flex flex-wrap mb-8"
    >
      <ToggleGroupItem
        value="all"
        className="rounded-full px-4 py-2 h-auto text-[10px] font-medium tracking-[0.18em] uppercase border border-border-subtle bg-surface-panel text-ink-soft data-[state=on]:bg-brand-wine data-[state=on]:text-brand-pink data-[state=on]:border-brand-wine hover:border-brand-wine"
      >
        Todos
      </ToggleGroupItem>
      {statuses.map(({ value, label }) => (
        <ToggleGroupItem
          key={value}
          value={value}
          className="rounded-full px-4 py-2 h-auto text-[10px] font-medium tracking-[0.18em] uppercase border border-border-subtle bg-surface-panel text-ink-soft data-[state=on]:bg-brand-wine data-[state=on]:text-brand-pink data-[state=on]:border-brand-wine hover:border-brand-wine"
        >
          {label}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}
