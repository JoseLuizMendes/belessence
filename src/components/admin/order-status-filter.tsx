"use client";

/**
 * OrderStatusFilter — fila de pílulas para filtrar pedidos por status.
 * Mobile: scroll horizontal sem barra; desktop: wrap natural.
 * "all" representa "Todos" (sem filtro).
 */

import { useRouter } from "next/navigation";
import { cn } from "@/api/utils";
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

  const handleClick = (value: OrderStatus | "all") => {
    if (value === "all") {
      router.push("/admin/pedidos");
      return;
    }
    router.push(`/admin/pedidos?status=${value}`);
  };

  const items: { value: OrderStatus | "all"; label: string }[] = [
    { value: "all", label: "Todos" },
    ...statuses,
  ];

  const current = activeStatus ?? "all";

  return (
    <div
      role="tablist"
      aria-label="Filtrar pedidos"
      className="flex gap-2 overflow-x-auto scrollbar-none -mx-4 px-4 md:mx-0 md:px-0 md:flex-wrap"
    >
      {items.map(({ value, label }) => {
        const active = value === current;
        return (
          <button
            key={value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => handleClick(value)}
            className={cn(
              "shrink-0 rounded-full px-4 py-2",
              "text-[11px] font-medium tracking-[0.18em] uppercase",
              "transition-all duration-200 focus-ring",
              active
                ? "bg-brand-wine text-brand-pink border border-brand-wine shadow-[0_4px_12px_-4px_rgba(46,11,18,0.35)]"
                : "bg-admin-panel border border-admin text-ink-soft hover:border-brand-wine/40 hover:text-ink-strong",
            )}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
