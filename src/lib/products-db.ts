/**
 * Funções de acesso ao banco via Prisma — substitui src/api/products.ts hardcoded.
 * Chamadas sempre em Server Components ou Route Handlers — nunca no cliente.
 */

import { prisma } from "@/lib/prisma";
import type { Product } from "@prisma/client";

export type { Product };

// ─── TIPO SALES ──────────────────────────────────────────────────────────────

export interface SalesProduct extends Product {
  promoTitle: string;
  promoText: string;
  promoGradient: string;
  iconName: "Timer" | "Sparkles" | "Tag";
  // Preço como number para o cliente
  priceNum: number;
}

// Dados de promoção mapeados por posição (index 0, 1, 2 no resultado)
const PROMO_CONFIG = [
  {
    promoTitle: "Oferta da Madrugada",
    promoText: "20% OFF na segunda unidade",
    promoGradient: "from-indigo-400 via-purple-400 to-pink-400",
    iconName: "Timer" as const,
  },
  {
    promoTitle: "Exclusividade",
    promoText: "Brinde especial na compra",
    promoGradient: "from-rose-400 via-red-400 to-orange-400",
    iconName: "Sparkles" as const,
  },
  {
    promoTitle: "Últimas Unidades",
    promoText: "Preço especial de lançamento",
    promoGradient: "from-amber-400 via-yellow-400 to-orange-400",
    iconName: "Tag" as const,
  },
];

// ─── QUERIES ─────────────────────────────────────────────────────────────────

export async function getAllProducts(): Promise<Product[]> {
  return prisma.product.findMany({
    orderBy: { createdAt: "desc" },
  });
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  return prisma.product.findUnique({ where: { slug } });
}

export async function getProductsByCollection(
  collection: string
): Promise<Product[]> {
  return prisma.product.findMany({
    where: { collection },
    orderBy: { totalSold: "desc" },
  });
}

export async function getFeaturedProducts(limit = 6): Promise<Product[]> {
  return prisma.product.findMany({
    orderBy: { totalSold: "desc" },
    take: limit,
  });
}

/** Retorna produtos com originalPrice (promoções) enriquecidos com dados de promo */
export async function getSalesProducts(): Promise<SalesProduct[]> {
  const products = await prisma.product.findMany({
    where: { originalPrice: { not: null } },
    orderBy: { seasonalSold: "desc" },
    take: 3,
  });

  return products.map((p, i) => ({
    ...p,
    priceNum: Number(p.price),
    ...PROMO_CONFIG[i % PROMO_CONFIG.length],
  }));
}

export async function getBestsellers(limit = 5): Promise<Product[]> {
  return prisma.product.findMany({
    orderBy: { totalSold: "desc" },
    take: limit,
  });
}
