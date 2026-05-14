/**
 * AllProducts — Server Component (estilo Stitch / "Coleção Essência")
 * ─────────────────────────────────────────────────────────────────────
 * Layout PLP do Stitch:
 *  - Header rosa claro
 *  - Hero centralizado: eyebrow + título serif italic + subtítulo
 *  - Filtros pill (Todos, Femininos, Masculinos, Unissex)
 *  - Grid 3 colunas de produtos
 *  - Footer bordô
 */

import Header from "@/components/header";
import Footer from "@/components/footer";
import ProductsGrid from "@/components/products-grid";
import { getAllProducts } from "@/lib/products-db";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Coleção Essência",
  description: "Explore nossa coleção completa de fragrâncias exclusivas.",
};

const FILTERS = [
  { label: "Todos", href: "/allProducts" },
  { label: "Femininos", href: "/allProducts?genero=feminino" },
  { label: "Masculinos", href: "/allProducts?genero=masculino" },
  { label: "Unissex", href: "/allProducts?genero=unissex" },
];

export default async function AllProductsPage() {
  const products = await getAllProducts();

  return (
    <div className="min-h-screen bg-brand-pink flex flex-col">
      <Header />

      <main className="flex-1 pt-24 sm:pt-28 pb-16 sm:pb-24">
        <div className="container-belessence">
          {/* Hero da PLP */}
          <div className="text-center mb-12 sm:mb-16">
            <p className="text-[11px] font-medium tracking-[0.32em] uppercase text-brand-wine mb-4">
              Coleção exclusiva
            </p>
            <h1 className="font-playfair italic text-[clamp(2.4rem,6vw,4.4rem)] leading-[1.04] tracking-[-0.02em] text-ink-strong mb-5">
              Coleção Essência
            </h1>
            <p className="max-w-2xl mx-auto text-sm sm:text-base text-ink-soft leading-relaxed font-light">
              Um aroma para despertar seus sentidos e enaltecer o caráter de cada pele.
              Fragrâncias e cuidados para a sua beleza autêntica.
            </p>
            <div className="mx-auto mt-6 h-px w-12 bg-brand-wine/60" />
          </div>

          {/* Filtros pill */}
          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 mb-10 sm:mb-14">
            {FILTERS.map((filter, i) => (
              <a
                key={filter.label}
                href={filter.href}
                className={[
                  "px-5 py-2 rounded-full text-[11px] font-medium tracking-[0.18em] uppercase transition-all",
                  i === 0
                    ? "bg-brand-wine text-brand-pink"
                    : "bg-surface-panel text-ink-soft border border-border-subtle hover:border-brand-wine hover:text-brand-wine",
                ].join(" ")}
              >
                {filter.label}
              </a>
            ))}
          </div>

          {/* Grid de produtos */}
          <ProductsGrid products={products} />
        </div>
      </main>

      <Footer />
    </div>
  );
}
