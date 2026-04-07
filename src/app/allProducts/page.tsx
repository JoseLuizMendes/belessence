/**
 * AllProducts — Server Component
 * Busca produtos do banco e renderiza o grid interativo como Client Component.
 */

import Header from "@/components/header";
import Footer from "@/components/footer";
import ProductsGrid from "@/components/products-grid";
import { getAllProducts } from "@/lib/products-db";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Todas as Fragrâncias",
  description: "Explore nossa coleção completa de perfumes exclusivos.",
};

export default async function AllProductsPage() {
  const products = await getAllProducts();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1 pt-20 sm:pt-24 pb-10 sm:pb-12">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-playfair font-bold mb-3 sm:mb-4">
              Todas as Fragrâncias
            </h1>
            <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
              Explore nossa coleção completa de perfumes exclusivos
            </p>
          </div>

          <ProductsGrid products={products} />
        </div>
      </main>
      <Footer />
    </div>
  );
}
