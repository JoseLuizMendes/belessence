/**
 * Tipos puros do bounded context Health. Sem Prisma/Next/IO.
 */

/** Resultado de uma sonda individual de saúde. */
export type ProbeResult = {
  ok: boolean;
  latencyMs: number;
};

/** Relatório agregado de saúde (corpo das rotas de health). */
export type HealthReport = {
  status: "ok" | "error";
  /** Resultados por nome de probe (ex.: { db }); vazio no liveness. */
  checks: Record<string, ProbeResult>;
  /** SHA do commit do deploy (VERCEL_GIT_COMMIT_SHA) ou null fora da Vercel. */
  commit: string | null;
  /** Momento da checagem, ISO 8601. */
  timestamp: string;
};
