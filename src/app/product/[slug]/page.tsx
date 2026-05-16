/**
 * ProductPage — Server Component (estilo Stitch / PDP)
 * Background bg-brand-pink, layout container-belessence, padding top maior.
 */

import Header from "@/components/header";
import Footer from "@/components/footer";
import ProductDetailsClient from "@/components/product-details-client";
import { getProductBySlug, getFeaturedProducts } from "@/lib/products-db";
import { ProductCard } from "@/components/product-card";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import type { Product } from "@/lib/products-db";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: "Produto não encontrado" };
  return {
    title: product.name,
    description: product.shortDescription,
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [product, relatedProducts] = await Promise.all([
    getProductBySlug(slug),
    getFeaturedProducts(4),
  ]);

  if (!product) notFound();

  return (
    <div className="min-h-screen bg-brand-pink flex flex-col">
      <Header />

      <main className="flex-1 pt-24 sm:pt-28 pb-16 sm:pb-24">
        <div className="container-belessence">
          <ProductDetailsClient product={product} />
        </div>
      </main>

      {/* "Você Também Vai Amar" */}
      <section className="bg-surface-base py-16 sm:py-24">
        <div className="container-belessence">
          <div className="text-center mb-12">
            <p className="text-[11px] font-medium tracking-[0.32em] uppercase text-brand-wine mb-4">
              Combinações perfeitas
            </p>
            <h2 className="font-playfair italic text-[clamp(1.8rem,4vw,2.8rem)] leading-tight tracking-[-0.02em] text-ink-strong">
              Você Também Vai Amar
            </h2>
            <div className="mx-auto mt-5 h-px w-12 bg-brand-wine/60" />
          </div>

          <FeatureProductsInline products={relatedProducts} />
        </div>
      </section>

      <Footer />
    </div>
  );
}

// Grid "Você Também Vai Amar" — reusa <ProductCard> compartilhado.
function FeatureProductsInline({ products }: { products: Product[] }) {
  const displayProducts = products.slice(0, 4);
  if (displayProducts.length === 0) return null;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
      {displayProducts.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          sizes="(max-width: 768px) 50vw, 280px"
        />
      ))}
    </div>
  );
}
