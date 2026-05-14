/**
 * ProductPage — Server Component (estilo Stitch / PDP)
 * Background bg-brand-pink, layout container-belessence, padding top maior.
 */

import Header from "@/components/header";
import Footer from "@/components/footer";
import ProductDetailsClient from "@/components/product-details-client";
import { getProductBySlug, getFeaturedProducts } from "@/lib/products-db";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { formatPrice } from "@/api/utils";
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

// Grid simples para "Você Também Vai Amar"
function FeatureProductsInline({ products }: { products: Product[] }) {
  const displayProducts = products.slice(0, 4);
  if (displayProducts.length === 0) return null;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
      {displayProducts.map((product) => {
        const price = Number(product.price);
        const originalPrice = product.originalPrice ? Number(product.originalPrice) : null;

        return (
          <article
            key={product.id}
            className="group flex flex-col bg-surface-panel rounded-token-sm overflow-hidden transition-all duration-500 hover:shadow-card-hover"
          >
            <Link
              href={`/product/${product.slug}`}
              className="relative block overflow-hidden aspect-[3/4] bg-surface-section"
            >
              <Image
                src={product.images[0]}
                alt={product.name}
                fill
                className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                sizes="(max-width: 768px) 50vw, 280px"
              />
            </Link>

            <div className="p-4 sm:p-5 text-center">
              <Link href={`/product/${product.slug}`}>
                <h3 className="font-playfair italic text-base sm:text-lg leading-snug text-ink-strong transition-opacity hover:opacity-70 line-clamp-2 mb-2">
                  {product.name}
                </h3>
              </Link>

              <div className="flex items-center justify-center gap-2">
                {originalPrice && (
                  <span className="text-xs text-ink-muted line-through">
                    {formatPrice(originalPrice)}
                  </span>
                )}
                <span className="price-display text-base sm:text-lg font-semibold text-brand-wine">
                  {formatPrice(price)}
                </span>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}
