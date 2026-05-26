/**
 * Home — Server Component
 * Busca dados do banco via Prisma e distribui como props para os Client
 * Components. Sem "use client" — sem fetch no cliente — sem dados hardcoded.
 *
 * Ordem (inspiração Boty, paleta Mari Beauty):
 *   Header → Hero → Features → TabbedProducts → MediaMosaic →
 *   FeatureProducts (Destaques) → Testimonials → Newsletter → Footer
 */

import Header from "@/components/header";
import Hero from "@/components/hero";
import Features from "@/components/features";
import ParallaxStage from "@/components/parallax-stage";
import TabbedProducts from "@/components/tabbed-products";
import MediaMosaic from "@/components/media-mosaic";
import FeatureProducts from "@/components/feature-products";
import Testimonials from "@/components/testimonials";
import Newsletter from "@/components/newsletter";
import Footer from "@/components/footer";
import { getFeaturedProducts } from "@/lib/products-db";
import { getFeaturedReviews } from "@/lib/reviews-db";

export default async function Home() {
  // Pool maior alimenta as tabs (filtro coleção→gênero em memória);
  // a faixa "Destaques" reaproveita os primeiros itens. As imagens já vêm
  // atualizadas do banco (script update-product-images / seed).
  const [productPool, reviews] = await Promise.all([
    getFeaturedProducts(24),
    getFeaturedReviews(12),
  ]);

  return (
    <div className="min-h-screen bg-brand-pink">
      <Header />

      <main className="bg-brand-pink">
        <div id="inicio">
          <Hero />
        </div>

        {/* Painel creme: 12px de respiro rosa acima (gap) e, ao rolar, sobe
            sobre o carrossel via parallax intenso (sem gradiente). */}
        <ParallaxStage
          id="ritual"
          amount={54}
          className="relative z-10 overflow-hidden rounded-t-[2.75rem] bg-surface-base sm:rounded-t-[2.5rem]"
        >
          <Features />
        </ParallaxStage>

        {/* id="colecoes" definido dentro de TabbedProducts */}
        <TabbedProducts products={productPool} />

        {/* id="sobre" definido dentro de MediaMosaic */}
        <MediaMosaic />

        <div id="destaques">
          <FeatureProducts products={productPool} />
        </div>

        <Testimonials reviews={reviews} />

        <div id="newsletter">
          <Newsletter />
        </div>
      </main>

      <Footer />
    </div>
  );
}
