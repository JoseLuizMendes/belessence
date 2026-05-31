/**
 * /api/products — GET
 * ─────────────────────────────────────────────────────────────────────
 * Lista produtos. Suporta filtro por IDs via query string.
 *
 * Query params:
 *  - ?ids=a,b,c → retorna apenas os produtos com esses IDs (qualquer ordem)
 *  - sem `ids` → retorna todos
 */

import { NextRequest, NextResponse } from "next/server";
import { getAllProducts, getFilteredProducts } from "@/lib/products/infrastructure/persistence/products-repository";

export async function GET(req: NextRequest) {
  try {
    const idsParam = req.nextUrl.searchParams.get("ids");

    if (idsParam) {
      const ids = idsParam
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      if (ids.length === 0) {
        return NextResponse.json([]);
      }

      // getFilteredProducts não suporta filtro por IDs diretamente.
      // Usamos getAllProducts (serializado) e filtramos em memória — OK para
      // o uso atual (página /favoritos com poucos IDs).
      const all = await getAllProducts();
      const byId = new Map(all.map((p) => [p.id, p]));
      const products = ids
        .map((id) => byId.get(id))
        .filter((p): p is NonNullable<typeof p> => Boolean(p));

      return NextResponse.json(products);
    }

    const all = await getFilteredProducts();
    return NextResponse.json(all);
  } catch (error) {
    console.error("[/api/products] Erro:", error);
    return NextResponse.json(
      { error: "Erro ao buscar produtos" },
      { status: 500 },
    );
  }
}
