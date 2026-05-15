/**
 * AllProducts — Server Component (estilo Stitch / "Coleção Essência")
 * ─────────────────────────────────────────────────────────────────────
 * Layout PLP do Stitch:
 *  - Header rosa claro
 *  - Hero centralizado: eyebrow + título serif italic + subtítulo
 *  - Filtros pill (Todos, Perfume, Cologne) com searchParam ativo
 *  - Dropdown de ordenação
 *  - Banner de busca quando ?q= está presente
 *  - Grid de produtos filtrado server-side via getFilteredProducts
 */

import Header from "@/components/header";
import Footer from "@/components/footer";
import ProductsGrid from "@/components/products-grid";
import {
  getFilteredProducts,
  type ProductSort,
} from "@/lib/products-db";
import { SortSelect } from "@/components/sort-select";
import type { Metadata } from "next";
import Link from "next/link";
import { Search, X } from "lucide-react";

export const metadata: Metadata = {
  title: "Coleção Essência",
  description: "Explore nossa coleção completa de fragrâncias exclusivas.",
};

interface PageProps {
  searchParams: Promise<{
    category?: string;
    genero?: string;
    sort?: string;
    q?: string;
  }>;
}

const FILTERS = [
  { label: "Todos", value: "" },
  { label: "Perfumes", value: "perfume" },
  { label: "Colônias", value: "cologne" },
];

const SORT_OPTIONS: Array<{ label: string; value: ProductSort }> = [
  { label: "Mais vendidos", value: "best-seller" },
  { label: "Lançamentos", value: "newest" },
  { label: "Menor preço", value: "price-asc" },
  { label: "Maior preço", value: "price-desc" },
  { label: "Nome (A-Z)", value: "name-asc" },
];

function buildHref(
  current: { category?: string; sort?: string; q?: string },
  changes: Partial<{ category?: string; sort?: string; q?: string }>,
): string {
  const merged = { ...current, ...changes };
  const params = new URLSearchParams();
  if (merged.q) params.set("q", merged.q);
  if (merged.category) params.set("category", merged.category);
  if (merged.sort) params.set("sort", merged.sort);
  const qs = params.toString();
  return qs ? `/allProducts?${qs}` : "/allProducts";
}

export default async function AllProductsPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const activeCategory = sp.category ?? sp.genero ?? "";
  const activeSort = (SORT_OPTIONS.find((o) => o.value === sp.sort)?.value ??
    "best-seller") as ProductSort;
  const searchQuery = sp.q?.trim() ?? "";

  const products = await getFilteredProducts({
    category: activeCategory || undefined,
    sort: activeSort,
    search: searchQuery || undefined,
  });

  const current = {
    category: activeCategory || undefined,
    sort: activeSort,
    q: searchQuery || undefined,
  };

  return (
    <div className="min-h-screen bg-brand-pink flex flex-col">
      <Header />

      <main className="flex-1 pt-24 sm:pt-28 pb-16 sm:pb-24">
        <div className="container-belessence">
          {/* Hero da PLP */}
          <div className="text-center mb-10 sm:mb-14">
            <p className="text-[11px] font-medium tracking-[0.32em] uppercase text-brand-wine mb-4">
              {searchQuery ? "Busca" : "Coleção exclusiva"}
            </p>
            <h1 className="font-playfair italic text-[clamp(2.4rem,6vw,4.4rem)] leading-[1.04] tracking-[-0.02em] text-ink-strong mb-5">
              {searchQuery ? `“${searchQuery}”` : "Coleção Essência"}
            </h1>
            <p className="max-w-2xl mx-auto text-sm sm:text-base text-ink-soft leading-relaxed font-light">
              {searchQuery
                ? `${products.length} ${products.length === 1 ? "resultado encontrado" : "resultados encontrados"}`
                : "Um aroma para despertar seus sentidos e enaltecer o caráter de cada pele. Fragrâncias e cuidados para a sua beleza autêntica."}
            </p>
            <div className="mx-auto mt-6 h-px w-12 bg-brand-wine/60" />
          </div>

          {/* Banner de busca ativa */}
          {searchQuery && (
            <div className="mb-8 flex justify-center">
              <Link
                href={buildHref(current, { q: undefined })}
                className="inline-flex items-center gap-2 px-4 py-2 bg-surface-panel border border-border-subtle rounded-full text-xs text-ink-soft hover:border-brand-wine transition-colors"
              >
                <Search className="h-3 w-3" />
                Buscando por: <strong className="text-ink-strong">{searchQuery}</strong>
                <X className="h-3 w-3" />
              </Link>
            </div>
          )}

          {/* Filtros + ordenação */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-10 sm:mb-14">
            {/* Pills de categoria */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              {FILTERS.map((filter) => {
                const isActive = activeCategory === filter.value;
                return (
                  <Link
                    key={filter.label}
                    href={buildHref(current, {
                      category: filter.value || undefined,
                    })}
                    className={[
                      "px-5 py-2 rounded-full text-[11px] font-medium tracking-[0.18em] uppercase transition-all",
                      isActive
                        ? "bg-brand-wine text-brand-pink"
                        : "bg-surface-panel text-ink-soft border border-border-subtle hover:border-brand-wine hover:text-brand-wine",
                    ].join(" ")}
                  >
                    {filter.label}
                  </Link>
                );
              })}
            </div>

            {/* Dropdown de ordenação */}
            <SortSelect options={SORT_OPTIONS} defaultValue={activeSort} />
          </div>

          {/* Estado vazio */}
          {products.length === 0 ? (
            <div className="text-center py-16 bg-surface-panel rounded-token-md">
              <p className="text-base text-ink-strong font-medium mb-2">
                Nenhum produto encontrado
              </p>
              <p className="text-sm text-ink-soft mb-6">
                Tente outros termos ou{" "}
                <Link
                  href="/allProducts"
                  className="text-brand-wine underline hover:no-underline"
                >
                  remover os filtros
                </Link>
                .
              </p>
            </div>
          ) : (
            <ProductsGrid products={products} />
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
