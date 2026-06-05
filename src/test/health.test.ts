import { describe, it, expect, vi, afterEach } from "vitest";
import { checkHealth } from "@/lib/health/application/check-health";
import type { HealthProbe } from "@/lib/health/application/ports/health-probe";
import type { ProbeResult } from "@/lib/health/domain/health-types";

const okProbe: HealthProbe = {
  name: "db",
  check: async () => ({ ok: true, latencyMs: 12 }),
};

describe("checkHealth", () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllEnvs();
  });

  it("status 'ok' quando todos os probes passam", async () => {
    const report = await checkHealth([okProbe]);

    expect(report.status).toBe("ok");
    expect(report.checks.db).toEqual({ ok: true, latencyMs: 12 });
    expect(typeof report.timestamp).toBe("string");
  });

  it("lista vazia (liveness) → 'ok' e checks vazio", async () => {
    const report = await checkHealth([]);

    expect(report.status).toBe("ok");
    expect(report.checks).toEqual({});
  });

  it("status 'error' quando algum probe reporta ok:false", async () => {
    const downProbe: HealthProbe = {
      name: "extra",
      check: async () => ({ ok: false, latencyMs: 5 }),
    };

    const report = await checkHealth([okProbe, downProbe]);

    expect(report.status).toBe("error");
    expect(report.checks.extra.ok).toBe(false);
  });

  it("isola um probe que lança (vira ok:false; os outros sobrevivem)", async () => {
    const throwingProbe: HealthProbe = {
      name: "boom",
      check: async () => {
        throw new Error("falhou feio");
      },
    };

    const report = await checkHealth([okProbe, throwingProbe]);

    expect(report.checks.db.ok).toBe(true);
    expect(report.checks.boom.ok).toBe(false);
    expect(report.status).toBe("error");
  });

  it("dá ok:false quando o probe estoura o timeout", async () => {
    vi.useFakeTimers();
    const hangingProbe: HealthProbe = {
      name: "slow",
      check: () => new Promise<ProbeResult>(() => {}), // nunca resolve
    };

    const promise = checkHealth([hangingProbe]);
    await vi.advanceTimersByTimeAsync(3001);
    const report = await promise;

    expect(report.checks.slow.ok).toBe(false);
    expect(report.status).toBe("error");
  });

  it("expõe o commit do deploy quando VERCEL_GIT_COMMIT_SHA existe", async () => {
    vi.stubEnv("VERCEL_GIT_COMMIT_SHA", "abc123");

    const report = await checkHealth([okProbe]);

    expect(report.commit).toBe("abc123");
  });
});
