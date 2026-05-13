/**
 * Home — Server Component
 * Busca dados do banco via Prisma e distribui como props para os Client Components.
 * Sem "use client" — sem fetch no cliente — sem dados hardcoded.
 */

import Header from "@/components/header";
import Hero from "@/components/hero";
import Sales from "@/components/sales";
import Features from "@/components/features";
import CollectionsProducts from "@/components/collections-products";
import FeatureProducts from "@/components/feature-products";
import Newsletter from "@/components/newsletter";
import Footer from "@/components/footer";
import { getSalesProducts, getFeaturedProducts } from "@/lib/products-db";

export default async function Home() {
  const [salesProducts, featuredProducts] = await Promise.all([
    getSalesProducts(),
    getFeaturedProducts(6),
  ]);

  return (
    <div className="min-h-screen bg-brand-pink loreal-surface">
      <Header />

      <main>
        <div id="inicio">
          <Hero />
        </div>

        {/* Gradient progressivo do fim do Hero até o início de Destaques
            (cobre Sales + Features + Coleções) — pink segura no topo,
            cream chega só lá em baixo */}
        <div className="bg-gradient-to-b from-brand-pink from-0% via-brand-pink via-25% to-accent to-100%">
          <Sales products={salesProducts} />

          <div id="destaques" className="relative z-10 pt-16 sm:pt-24">
            <Features />
          </div>

          <div id="colecoes">
            <CollectionsProducts />
          </div>
        </div>

        <div id="destaques-produtos">
          <FeatureProducts products={featuredProducts} />
        </div>

        <div id="sobre">
          <Newsletter />
        </div>
      </main>

      <Footer />
    </div>
  );
}
