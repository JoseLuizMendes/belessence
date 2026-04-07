/**
 * CollectionPage — Server Component
 * Busca produtos da coleção via Prisma e renderiza via ProductsGrid (client).
 */

import Header from "@/components/header";
import Footer from "@/components/footer";
import ProductsGrid from "@/components/products-grid";
import { getProductsByCollection } from "@/lib/products-db";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

// Mapeamento slug → collection (deve refletir o schema.prisma)
const COLLECTION_MAP: Record<string, { type: string; name: string; description: string }> = {
  "essencia-noturna": {
    type: "night",
    name: "Essência Noturna",
    description: "Fragrâncias intensas e sedutoras para momentos especiais",
  },
  "elegancia-diurna": {
    type: "day",
    name: "Elegância Diurna",
    description: "Perfumes sofisticados para o dia a dia refinado",
  },
  "edicao-limitada": {
    type: "limited",
    name: "Edição Limitada",
    description: "Criações exclusivas em quantidades limitadas",
  },
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const collection = COLLECTION_MAP[slug];
  if (!collection) return { title: "Coleção não encontrada" };
  return { title: collection.name, description: collection.description };
}

export default async function CollectionPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const collection = COLLECTION_MAP[slug];

  if (!collection) notFound();

  const products = await getProductsByCollection(collection.type);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1 pt-20 sm:pt-24 pb-10 sm:pb-12">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-playfair font-bold mb-3 sm:mb-4">
              {collection.name}
            </h1>
            <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
              {collection.description}
            </p>
          </div>

          {products.length > 0 ? (
            <ProductsGrid products={products} />
          ) : (
            <div className="text-center py-20">
              <p className="text-muted-foreground mb-6">Nenhuma fragrância disponível nesta coleção ainda.</p>
              <Button asChild variant="outline">
                <Link href="/allProducts">Ver todas as fragrâncias</Link>
              </Button>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
