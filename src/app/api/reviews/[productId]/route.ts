/**
 * /api/reviews/[productId] — GET
 * ─────────────────────────────────────────────────────────────────────
 * Lista reviews aprovadas de um produto, mais recentes primeiro.
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ productId: string }> },
) {
  try {
    const { productId } = await params;

    const reviews = await prisma.review.findMany({
      where: { productId, approved: true },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return NextResponse.json(reviews);
  } catch (error) {
    console.error("[/api/reviews/[productId]] Erro:", error);
    return NextResponse.json(
      { error: "Erro ao buscar avaliações" },
      { status: 500 },
    );
  }
}
