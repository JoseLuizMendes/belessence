/**
 * AllProducts — Loading state com Skeletons shadcn.
 * Next.js mostra esse componente automaticamente enquanto o Server Component
 * de page.tsx faz a query do banco.
 */

import Header from "@/components/header";
import Footer from "@/components/footer";
import { ProductGridSkeleton } from "@/components/product-card-skeleton";
import { Skeleton } from "@/components/ui/skeleton";

export default function AllProductsLoading() {
  return (
    <div className="min-h-screen bg-brand-pink flex flex-col">
      <Header />

      <main className="flex-1 pt-24 sm:pt-28 pb-16 sm:pb-24">
        <div className="container-belessence">
          {/* Hero skeleton */}
          <div className="text-center mb-10 sm:mb-14 flex flex-col items-center gap-4">
            <Skeleton className="h-3 w-32" />
            <Skeleton className="h-14 sm:h-20 w-72 sm:w-96" />
            <Skeleton className="h-4 w-80" />
            <div className="mt-2 h-px w-12 bg-brand-wine/20" />
          </div>

          {/* Filtros skeleton */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-10 sm:mb-14">
            <div className="flex gap-2">
              <Skeleton className="h-9 w-20 rounded-full" />
              <Skeleton className="h-9 w-24 rounded-full" />
              <Skeleton className="h-9 w-24 rounded-full" />
            </div>
            <Skeleton className="h-9 w-48 rounded-full" />
          </div>

          {/* Grid */}
          <ProductGridSkeleton count={8} />
        </div>
      </main>

      <Footer />
    </div>
  );
}
