/**
 * databaseProbe — adapter de liveness do Postgres (implementa HealthProbe).
 *
 * Único arquivo do contexto que conhece o Prisma. Ping barato (`SELECT 1`) +
 * latência. Queda de banco é estado ESPERADO (retorna { ok: false }).
 *
 * `$queryRaw` é justificado (apesar de lib/CLAUDE.md §8): liveness não é query
 * de modelo; `SELECT 1` é a sonda canônica.
 */
import "server-only";
import { prisma } from "@/lib/shared/infrastructure/prisma-client";
import type { HealthProbe } from "../../application/ports/health-probe";
import type { ProbeResult } from "../../domain/health-types";

export const databaseProbe: HealthProbe = {
  name: "db",
  async check(): Promise<ProbeResult> {
    const start = Date.now();
    try {
      await prisma.$queryRaw`SELECT 1`;
      return { ok: true, latencyMs: Date.now() - start };
    } catch (error) {
      console.error("[health] ping no banco falhou:", error);
      return { ok: false, latencyMs: Date.now() - start };
    }
  },
};
