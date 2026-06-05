/**
 * /api/health — GET (liveness)
 * ─────────────────────────────────────────────────────────────────────
 * Sinal de vida raso: 200 se o app responde. NÃO toca o banco — é o alvo do
 * monitor de uptime (deixa o Neon suspender). Sem auth.
 *
 * Composition root: checkHealth sem probes (lista vazia).
 */
import { NextResponse } from "next/server";
import { checkHealth } from "@/lib/health/application/check-health";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const report = await checkHealth([]);
    return NextResponse.json(report); // 200 — liveness
  } catch (error) {
    console.error("[/api/health] erro inesperado:", error);
    return NextResponse.json(
      {
        status: "error",
        checks: {},
        commit: process.env.VERCEL_GIT_COMMIT_SHA ?? null,
        timestamp: new Date().toISOString(),
      },
      { status: 503 },
    );
  }
}
