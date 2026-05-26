/**
 * reviews-db — Belessence (server-only por convenção: importa Prisma; nunca
 * deve ser importado de Client Components)
 * ─────────────────────────────────────────────────────────────────────
 * Queries de avaliações voltadas à vitrine. Para reviews por produto (PDP)
 * o handler em app/api/reviews/[productId] já cobre; aqui ficam as consultas
 * usadas por RSC (ex.: carrossel de depoimentos da home).
 */

import { prisma } from "@/lib/prisma";

/** Depoimento "achatado" para a home: review + nome/slug do produto. */
export interface FeaturedReview {
  id: string;
  authorName: string;
  rating: number;
  text: string;
  productName: string;
  productSlug: string;
}

/**
 * Avaliações aprovadas, com texto, nota alta (>= 4) — material de prova
 * social para o marquee de depoimentos. Mais recentes primeiro.
 */
export async function getFeaturedReviews(limit = 12): Promise<FeaturedReview[]> {
  const rows = await prisma.review.findMany({
    where: {
      approved: true,
      rating: { gte: 4 },
      text: { not: null },
    },
    select: {
      id: true,
      authorName: true,
      rating: true,
      text: true,
      product: { select: { name: true, slug: true } },
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  return rows
    .filter((r) => r.text != null && r.text.trim().length > 0)
    .map((r) => ({
      id: r.id,
      authorName: r.authorName,
      rating: r.rating,
      text: r.text as string,
      productName: r.product.name,
      productSlug: r.product.slug,
    }));
}
