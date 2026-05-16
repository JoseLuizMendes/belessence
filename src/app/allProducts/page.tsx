/**
 * AllProducts — Server Component (PLP)
 * ─────────────────────────────────────────────────────────────────────
 * Layout PLP do Stitch:
 *  - Filtros pill (Todos, Perfume, Cologne)
 *  - Dropdown de ordenação
 *  - Paginação "Carregar mais" via ?show=N (default 12, increment 12)
 *  - Server-driven count para "X de Y produtos"
 */

import Header from "@/components/header";
import Footer from "@/components/footer";
import ProductsGrid from "@/components/products-grid";
import {
  getFilteredProducts,
  countFilteredProducts,
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
    show?: string;
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

const PAGE_SIZE = 12;

function buildHref(
  current: { category?: string; sort?: string; q?: string; show?: number },
  changes: Partial<{ category?: string; sort?: string; q?: string; show?: number }>,
): string {
  const merged = { ...current, ...changes };
  const params = new URLSearchParams();
  if (merged.q) params.set("q", merged.q);
  if (merged.category) params.set("category", merged.category);
  if (merged.sort) params.set("sort", merged.sort);
  if (merged.show && merged.show !== PAGE_SIZE) {
    params.set("show", String(merged.show));
  }
  const qs = params.toString();
  return qs ? `/allProducts?${qs}` : "/allProducts";
}

function parseShow(raw: string | undefined): number {
  const n = Number(raw);
  if (!Number.isFinite(n) || n < PAGE_SIZE) return PAGE_SIZE;
  // arredonda para o próximo múltiplo de PAGE_SIZE, evita valores arbitrários grandes
  return Math.min(Math.ceil(n / PAGE_SIZE) * PAGE_SIZE, 240);
}

export default async function AllProductsPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const activeCategory = sp.category ?? sp.genero ?? "";
  const activeSort = (SORT_OPTIONS.find((o) => o.value === sp.sort)?.value ??
    "best-seller") as ProductSort;
  const searchQuery = sp.q?.trim() ?? "";
  const show = parseShow(sp.show);

  const filters = {
    category: activeCategory || undefined,
    sort: activeSort,
    search: searchQuery || undefined,
  };

  const [allFiltered, total] = await Promise.all([
    getFilteredProducts(filters),
    countFilteredProducts(filters),
  ]);

  const visible = allFiltered.slice(0, show);
  const hasMore = show < total;

  const current = {
    category: activeCategory || undefined,
    sort: activeSort,
    q: searchQuery || undefined,
    show,
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
                ? `${total} ${total === 1 ? "resultado encontrado" : "resultados encontrados"}`
                : "Um aroma para despertar seus sentidos e enaltecer o caráter de cada pele. Fragrâncias e cuidados para a sua beleza autêntica."}
            </p>
            <div className="mx-auto mt-6 h-px w-12 bg-brand-wine/60" />
          </div>

          {/* Banner de busca ativa */}
          {searchQuery && (
            <div className="mb-8 flex justify-center">
              <Link
                href={buildHref(current, { q: undefined, show: PAGE_SIZE })}
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
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              {FILTERS.map((filter) => {
                const isActive = activeCategory === filter.value;
                return (
                  <Link
                    key={filter.label}
                    href={buildHref(current, {
                      category: filter.value || undefined,
                      show: PAGE_SIZE,
                    })}
                    className={[
                      "px-5 py-2 rounded-full text-[11px] font-medium tracking-[0.18em] uppercase transition-all active:scale-95",
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

            <SortSelect options={SORT_OPTIONS} defaultValue={activeSort} />
          </div>

          {/* Estado vazio */}
          {total === 0 ? (
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
            <>
              <ProductsGrid products={visible} />

              {/* Contador + Carregar mais */}
              <div className="mt-12 flex flex-col items-center gap-4">
                <p className="text-xs text-ink-soft tracking-wide">
                  Mostrando{" "}
                  <strong className="text-ink-strong">{visible.length}</strong>{" "}
                  de <strong className="text-ink-strong">{total}</strong>{" "}
                  {total === 1 ? "produto" : "produtos"}
                </p>
                {hasMore && (
                  <Link
                    href={buildHref(current, { show: show + PAGE_SIZE })}
                    scroll={false}
                    className="inline-flex items-center gap-2 px-6 h-11 rounded-full bg-brand-wine text-brand-pink text-[11px] font-medium tracking-[0.18em] uppercase hover:bg-brand-wine/90 transition-all active:scale-95"
                  >
                    Carregar mais (+{Math.min(PAGE_SIZE, total - show)})
                  </Link>
                )}
              </div>
            </>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
