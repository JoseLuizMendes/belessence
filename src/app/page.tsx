/**
 * Home — Server Component
 * Busca dados do banco via Prisma e distribui como props para os Client Components.
 * Sem "use client" — sem fetch no cliente — sem dados hardcoded.
 */

import Header from "@/components/header";
import Hero from "@/components/hero";
import Features from "@/components/features";
import CollectionsProducts from "@/components/collections-products";
import FeatureProducts from "@/components/feature-products";
import Newsletter from "@/components/newsletter";
import Footer from "@/components/footer";
import { getFeaturedProducts } from "@/lib/products-db";

export default async function Home() {
  const featuredProducts = await getFeaturedProducts(6);

  return (
    <div className="min-h-screen bg-brand-pink">
      <Header />

      <main className="bg-brand-pink">
        <div id="inicio">
          <Hero />
        </div>

        {/* Bloco contínuo bg-brand-pink — sem vão bege entre seções */}
        <div className="bg-brand-pink">
          <div id="ritual" className="relative z-10">
            <Features />
          </div>

          <div id="colecoes">
            <CollectionsProducts />
          </div>
        </div>

        <div id="destaques">
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
