/**
 * /api/health/ready — GET (readiness)
 * ─────────────────────────────────────────────────────────────────────
 * Checagem profunda: roda o probe do banco (SELECT 1). 200 se tudo ok; 503 se
 * algum check falha. Inclui o commit do deploy (smoke pós-deploy). Sem auth.
 *
 * Use sob demanda (deploy-smoke / monitor de baixa frequência) — NÃO no ping de
 * uptime, pra não manter o Neon acordado.
 *
 * Composition root: injeta [databaseProbe] no checkHealth.
 */
import { NextResponse } from "next/server";
import { checkHealth } from "@/lib/health/application/check-health";
import { databaseProbe } from "@/lib/health/infrastructure/persistence/database-health";

export const dynamic = "force-dynamic";

// Probes da readiness. Somar observabilidade = somar um adapter aqui (OCP).
const probes = [databaseProbe];

export async function GET() {
  try {
    const report = await checkHealth(probes);
    return NextResponse.json(report, {
      status: report.status === "ok" ? 200 : 503,
    });
  } catch (error) {
    console.error("[/api/health/ready] erro inesperado:", error);
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
