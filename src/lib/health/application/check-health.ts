/**
 * check-health — use case de saúde (bounded context Health).
 *
 * `runProbe` blinda cada sonda: corre `check()` contra um timeout e captura
 * throw — SEMPRE devolve um ProbeResult (`ok:false` em hang/erro), nunca rejeita.
 * Assim um probe lento ou podre não pendura o endpoint nem derruba os outros.
 *
 * `checkHealth` depende da PORTA (DIP) e itera a lista (OCP): somar um probe =
 * passá-lo na lista; este arquivo nunca muda.
 */
import "server-only";
import type { HealthProbe } from "./ports/health-probe";
import type { HealthReport, ProbeResult } from "../domain/health-types";

const PROBE_TIMEOUT_MS = 3000;

async function runProbe(
  probe: HealthProbe,
  timeoutMs: number,
): Promise<ProbeResult> {
  const start = Date.now();
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      probe.check(),
      new Promise<never>((_, reject) => {
        timer = setTimeout(
          () => reject(new Error(`probe '${probe.name}' timeout`)),
          timeoutMs,
        );
      }),
    ]);
  } catch (error) {
    console.error(`[health] probe '${probe.name}' falhou:`, error);
    return { ok: false, latencyMs: Date.now() - start };
  } finally {
    clearTimeout(timer);
  }
}

export async function checkHealth(
  probes: HealthProbe[],
): Promise<HealthReport> {
  const entries = await Promise.all(
    probes.map(
      async (probe): Promise<[string, ProbeResult]> => [
        probe.name,
        await runProbe(probe, PROBE_TIMEOUT_MS),
      ],
    ),
  );

  return {
    status: entries.every(([, result]) => result.ok) ? "ok" : "error",
    checks: Object.fromEntries(entries),
    commit: process.env.VERCEL_GIT_COMMIT_SHA ?? null,
    timestamp: new Date().toISOString(),
  };
}
