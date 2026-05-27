/**
 * SkeletonRow / SkeletonBlock — fallback de carregamento para o admin.
 * Pulsa lento; nunca bloqueia o layout. Usar em <Suspense> e em listas
 * antes de hidratar dados client-side.
 */

import { cn } from "@/api/utils";

export function SkeletonBlock({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "rounded-token-sm bg-admin-row-hover animate-pulse-slow",
        className,
      )}
      style={{ backgroundColor: "var(--color-admin-row-hover)" }}
      aria-hidden="true"
    />
  );
}

export function SkeletonRow() {
  return (
    <div className="flex items-center gap-4 px-5 py-4 border-b border-admin-soft last:border-b-0">
      <SkeletonBlock className="h-10 w-10 rounded-token-sm" />
      <SkeletonBlock className="h-3 flex-1 max-w-[200px]" />
      <SkeletonBlock className="h-3 w-20" />
      <SkeletonBlock className="h-3 w-16" />
      <SkeletonBlock className="h-7 w-20 rounded-full" />
    </div>
  );
}

export function SkeletonList({ rows = 4 }: { rows?: number }) {
  return (
    <div
      className="bg-admin-panel border border-admin rounded-token-md overflow-hidden shadow-petal-1"
      role="status"
      aria-label="Carregando"
    >
      {Array.from({ length: rows }).map((_, i) => (
        <SkeletonRow key={i} />
      ))}
    </div>
  );
}
