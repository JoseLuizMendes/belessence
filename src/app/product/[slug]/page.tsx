/**
 * ProductPage — Server Component
 * Busca produto do banco via Prisma e passa ao ProductDetailsClient.
 */

import Header from "@/components/header";
import Footer from "@/components/footer";
import ProductDetailsClient from "@/components/product-details-client";
import { getProductBySlug } from "@/lib/products-db";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

// ─── METADATA DINÂMICA ───────────────────────────────────────────────────────

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

// ─── PAGE ─────────────────────────────────────────────────────────────────────

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) notFound();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 pt-20 sm:pt-24 pb-12">
        <ProductDetailsClient product={product} />
      </main>
      <Footer />
    </div>
  );
}
