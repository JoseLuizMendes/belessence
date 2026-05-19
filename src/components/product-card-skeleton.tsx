/**
 * ProductCardSkeleton — placeholder com shadcn Skeleton.
 * Usado em loading.tsx de PLP / Suspense fallbacks.
 */

import { Skeleton } from "@/components/ui/skeleton";

export function ProductCardSkeleton() {
  return (
    <article className="flex flex-col bg-surface-panel rounded-token-sm overflow-hidden">
      <Skeleton className="aspect-[3/4] w-full rounded-none" />
      <div className="p-4 sm:p-5 flex flex-col items-center gap-3">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-6 w-24" />
        <Skeleton className="h-3 w-20" />
      </div>
    </article>
  );
}

export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}
