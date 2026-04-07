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
    <div className="min-h-screen bg-background loreal-surface">
      <Header />

      <main>
        <div id="inicio">
          <Hero />

          <Sales products={salesProducts} />

          <div
            id="destaques"
            className="relative z-10 -mt-10 sm:-mt-12 bg-background pt-4 sm:pt-6 border-t"
          >
            <Features />
          </div>
        </div>

        <div id="colecoes">
          <CollectionsProducts />
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
