import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET as livenessGET } from "@/app/api/health/route";
import { GET as readinessGET } from "@/app/api/health/ready/route";
import { checkHealth } from "@/lib/health/application/check-health";
import { databaseProbe } from "@/lib/health/infrastructure/persistence/database-health";

vi.mock("@/lib/health/application/check-health", () => ({
  checkHealth: vi.fn(),
}));

const checkHealthMock = vi.mocked(checkHealth);

const okReport = {
  status: "ok" as const,
  checks: { db: { ok: true, latencyMs: 8 } },
  commit: "abc123",
  timestamp: "2026-06-04T00:00:00.000Z",
};

describe("GET /api/health (liveness)", () => {
  beforeEach(() => vi.clearAllMocks());

  it("responde 200 e chama checkHealth SEM probes (não toca o banco)", async () => {
    checkHealthMock.mockResolvedValue({ ...okReport, checks: {} });

    const res = await livenessGET();

    expect(res.status).toBe(200);
    expect(checkHealthMock).toHaveBeenCalledWith([]);
  });

  it("responde 503 se o app estiver quebrado (checkHealth lança)", async () => {
    checkHealthMock.mockRejectedValue(new Error("boom"));

    const res = await livenessGET();

    expect(res.status).toBe(503);
  });
});

describe("GET /api/health/ready (readiness)", () => {
  beforeEach(() => vi.clearAllMocks());

  it("responde 200 e injeta o databaseProbe", async () => {
    checkHealthMock.mockResolvedValue(okReport);

    const res = await readinessGET();

    expect(res.status).toBe(200);
    expect(checkHealthMock).toHaveBeenCalledWith([databaseProbe]);
  });

  it("responde 503 quando o status é 'error'", async () => {
    checkHealthMock.mockResolvedValue({
      ...okReport,
      status: "error",
      checks: { db: { ok: false, latencyMs: 3000 } },
    });

    const res = await readinessGET();

    expect(res.status).toBe(503);
  });

  it("responde 503 quando checkHealth lança erro inesperado", async () => {
    checkHealthMock.mockRejectedValue(new Error("boom"));

    const res = await readinessGET();

    expect(res.status).toBe(503);
    const body = await res.json();
    expect(body.status).toBe("error");
  });
});
