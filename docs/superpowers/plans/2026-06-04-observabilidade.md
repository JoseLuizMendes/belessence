# Observabilidade (Fase 3 — fatia 1) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Entregar `/api/health` (liveness, sem banco) e `/api/health/ready` (readiness, com banco), um bounded context `health/` hexagonal com porta `HealthProbe` e probes blindados (timeout + isolamento), testes unit, e o runbook `docs/observabilidade.md`.

**Architecture:** `health/` com `domain` (tipos) → `application/ports` (porta `HealthProbe`) + `application` (use case `checkHealth` + helper `runProbe`) → `infrastructure/persistence` (adapter `databaseProbe`). O use case depende da **porta** (DIP) e itera `HealthProbe[]` com timeout/isolamento por probe (OCP + robustez). As routes são **composition roots**: liveness injeta `[]`, readiness injeta `[databaseProbe]`.

**Tech Stack:** Next.js 16 (Route Handlers), TypeScript estrito, Prisma 7 (`$queryRaw`), Vitest (fake timers). Sem novas dependências, sem schema, sem `.env` novo.

**Branch:** `feat/observabilidade`. Spec: `docs/superpowers/specs/2026-06-04-observabilidade-design.md`.

---

## File Structure

| Arquivo | Responsabilidade |
|---|---|
| `src/lib/health/domain/health-types.ts` | `ProbeResult`, `HealthReport` (tipos puros). |
| `src/lib/health/application/ports/health-probe.ts` | Interface `HealthProbe` (porta, ISP). |
| `src/lib/health/application/check-health.ts` | `checkHealth(probes)` + `runProbe` (timeout/isolamento) — DIP + OCP. |
| `src/lib/health/infrastructure/persistence/database-health.ts` | `databaseProbe: HealthProbe` — `SELECT 1`; único a tocar Prisma. |
| `src/app/api/health/route.ts` | Liveness: `checkHealth([])` → 200. |
| `src/app/api/health/ready/route.ts` | Readiness: `checkHealth([databaseProbe])` → 200/503. |
| `src/test/health.test.ts` | Unit de `checkHealth` (ok/error/timeout/isolamento/vazio). |
| `src/test/api-health.test.ts` | Unit das 2 routes (mapping + injeção). |
| `vitest.config.ts` (modificar) | Excluir `database-health.ts` da cobertura. |
| `docs/observabilidade.md` | Runbook: UptimeRobot + Sentry opt-in. |
| `src/lib/health/CLAUDE.md`, `src/app/api/health/CLAUDE.md`, `src/app/api/health/ready/CLAUDE.md` | Docs. |

---

## Task 1: Bounded context `health/` (porta + adapter + use case blindado)

**Files:**
- Create: `src/lib/health/domain/health-types.ts`
- Create: `src/lib/health/application/ports/health-probe.ts`
- Create: `src/lib/health/infrastructure/persistence/database-health.ts`
- Create: `src/lib/health/application/check-health.ts`
- Test: `src/test/health.test.ts`
- Modify: `vitest.config.ts`

- [ ] **Step 1: Write the failing test** — `src/test/health.test.ts`

```ts
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
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm test:run src/test/health.test.ts`
Expected: FAIL — `Failed to resolve import "@/lib/health/application/check-health"`.

- [ ] **Step 3: Create the domain types** — `src/lib/health/domain/health-types.ts`

```ts
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
```

- [ ] **Step 4: Create the port** — `src/lib/health/application/ports/health-probe.ts`

```ts
/**
 * HealthProbe — porta (interface) do bounded context Health.
 *
 * Contrato mínimo (ISP): só `name` + `check()`. O use case depende DESTA
 * abstração (DIP). Somar uma sonda = novo adapter que implementa a porta (OCP).
 * Convenção: `check()` deve devolver ProbeResult; se lançar/pendurar, o use
 * case (runProbe) trata como `ok:false`.
 */
import type { ProbeResult } from "../../domain/health-types";

export interface HealthProbe {
  readonly name: string;
  check(): Promise<ProbeResult>;
}
```

- [ ] **Step 5: Create the Prisma adapter** — `src/lib/health/infrastructure/persistence/database-health.ts`

```ts
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
```

- [ ] **Step 6: Create the use case (com timeout/isolamento)** — `src/lib/health/application/check-health.ts`

```ts
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

export async function checkHealth(probes: HealthProbe[]): Promise<HealthReport> {
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
```

- [ ] **Step 7: Exclude the adapter from coverage** — `vitest.config.ts`

Na array `test.coverage.exclude`, logo após `"src/lib/shared/infrastructure/prisma-client.ts", // singleton, mockado`, adicionar:

```ts
        // Adapter Prisma de liveness — coberto por integração/E2E (smoke) e
        // redundante com o runProbe do use case. Unit cobre a orquestração.
        "src/lib/health/infrastructure/persistence/database-health.ts",
```

- [ ] **Step 8: Run the test to verify it passes**

Run: `pnpm test:run src/test/health.test.ts`
Expected: PASS — `6 passed`.

- [ ] **Step 9: Commit**

```bash
git add src/lib/health src/test/health.test.ts vitest.config.ts
git commit -m "feat(health): contexto health (porta HealthProbe + checkHealth com timeout/isolamento)"
```

---

## Task 2: Rotas liveness e readiness (composition roots)

**Files:**
- Create: `src/app/api/health/route.ts`
- Create: `src/app/api/health/ready/route.ts`
- Test: `src/test/api-health.test.ts`

- [ ] **Step 1: Write the failing test** — `src/test/api-health.test.ts`

```ts
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
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm test:run src/test/api-health.test.ts`
Expected: FAIL — `Failed to resolve import "@/app/api/health/route"`.

- [ ] **Step 3: Create the liveness route** — `src/app/api/health/route.ts`

```ts
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
```

- [ ] **Step 4: Create the readiness route** — `src/app/api/health/ready/route.ts`

```ts
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
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `pnpm test:run src/test/api-health.test.ts`
Expected: PASS — `5 passed`.

- [ ] **Step 6: Commit**

```bash
git add src/app/api/health src/test/api-health.test.ts
git commit -m "feat(health): rotas liveness (/api/health) e readiness (/api/health/ready)"
```

---

## Task 3: Runbook, CLAUDE.md e verificação final

**Files:**
- Create: `docs/observabilidade.md`
- Create: `src/lib/health/CLAUDE.md`
- Create: `src/app/api/health/CLAUDE.md`
- Create: `src/app/api/health/ready/CLAUDE.md`

> Nota de fence: os blocos abaixo usam **4 crases** (````) por fora porque têm blocos de 3 crases dentro. Ao criar cada arquivo, use só o conteúdo interno.

- [ ] **Step 1: Create the runbook** — `docs/observabilidade.md`

````markdown
# Observabilidade — Belessence

> Runbook da base de observabilidade (Fase 3): healthchecks (liveness +
> readiness), uptime e o opt-in (desligado) do Sentry. Design:
> `docs/superpowers/specs/2026-06-04-observabilidade-design.md`.

## 1. Healthchecks

- **`GET /api/health` (liveness)** — 200 se o app responde. **Não toca o banco**
  (barato; é o que o monitor de uptime bate). Corpo: `{ "status":"ok", "checks":{}, "commit":…, "timestamp":… }`.
- **`GET /api/health/ready` (readiness)** — 200 (banco ok) ou **503** (banco
  fora/lento). Corpo:

```jsonc
{ "status": "ok",
  "checks": { "db": { "ok": true, "latencyMs": 12 } },
  "commit": "<sha-do-deploy>",   // VERCEL_GIT_COMMIT_SHA, ou null fora da Vercel
  "timestamp": "2026-06-04T20:00:00.000Z" }
```

O `commit` confirma **qual versão está no ar** após um deploy (injetado pela Vercel).

## 2. Uptime — UptimeRobot (grátis)

1. Conta em https://uptimerobot.com (plano free).
2. **Add New Monitor** → **HTTP(s)** → URL `https://<seu-domínio-de-prod>/api/health`
   (**liveness** — não acorda o Neon).
3. Intervalo 5 min; keyword opcional `"status":"ok"`; alerta por email.

> **Por que o liveness, e não o readiness?** Bater no `/ready` (que toca o banco)
> a cada 5 min **mantém o Neon acordado** e queima compute-hours do free tier.
> Pro check de **banco** (deploy-smoke), bata em `/api/health/ready` manualmente
> ou com um monitor **separado de baixa frequência** (ex.: 1×/hora).

## 3. Sentry — opt-in (desligado)

**Estado:** desligado (D8). Sem tráfego, não há erro a capturar.
**Gatilho (§6 do spec de ambiente):** >5k eventos/mês ou retenção.
**Como ligar:** `pnpm add @sentry/nextjs`; wizard `pnpm dlx @sentry/wizard@latest -i nextjs`;
env `SENTRY_DSN`/`NEXT_PUBLIC_SENTRY_DSN`/`SENTRY_AUTH_TOKEN`; sourcemaps no build.
Sem dependência neste ciclo.
````

- [ ] **Step 2: Create the context CLAUDE.md** — `src/lib/health/CLAUDE.md`

````markdown
# `src/lib/health/` — Bounded Context Health

> **Hexagonal + SOLID à risca.** Saúde do sistema atrás da porta `HealthProbe`.
> As rotas `/api/health` (liveness) e `/api/health/ready` (readiness) são os
> composition roots — a lógica vive aqui.

## Estrutura

```
src/lib/health/
├── domain/health-types.ts                 # ProbeResult, HealthReport
├── application/
│   ├── ports/health-probe.ts              # interface HealthProbe (porta — ISP)
│   └── check-health.ts                    # checkHealth(probes) + runProbe (timeout/isolamento)
└── infrastructure/persistence/database-health.ts  # databaseProbe — único a tocar Prisma
```

## SOLID + robustez

- **S/O/I/D:** arquivo único por responsabilidade; `checkHealth` itera
  `HealthProbe[]` (novo probe ou liveness/readiness = lista diferente, sem editar
  o use case); porta mínima (`name`+`check`); use case depende da porta, concreto
  injetado nas routes.
- **`runProbe`:** cada probe corre contra um timeout (3s) + try/catch e **sempre**
  vira `ProbeResult` — hang/throw viram `ok:false`, sem derrubar os outros.
- **Server-only** em `application/check-health` e `infrastructure/*`; `domain/` e a
  porta são puros.

## Testes

- `src/test/health.test.ts` — `checkHealth` (ok/error/timeout/isolamento/vazio),
  probes fake injetados (sem `vi.mock` — payoff do DIP).
- `src/test/api-health.test.ts` — as 2 routes.
- `database-health.ts` (adapter) excluído da cobertura (E2E + redundante com runProbe).

## Referências

- `docs/superpowers/specs/2026-06-04-observabilidade-design.md` — design
- `docs/observabilidade.md` — runbook
````

- [ ] **Step 3: Create the route CLAUDE.md** — `src/app/api/health/CLAUDE.md`

````markdown
# health

> **Nota de Uso:** Healthchecks públicos. **Composition roots** — delegam pro
> bounded context `@/lib/health`. Não consumir de RSC.

## Endpoints

- **`GET /api/health` (este dir)** — liveness: `checkHealth([])`, 200 sem tocar
  o banco. **Alvo do monitor de uptime** (deixa o Neon suspender).
- **`GET /api/health/ready` (subdir `ready/`)** — readiness: `checkHealth([databaseProbe])`,
  200/503 com checagem de banco. Deploy-smoke / monitor de baixa frequência.

## Diretrizes

- Route Handler magro: injeta a lista de probes, chama `checkHealth`, mapeia pra
  `NextResponse.json(report, { status })`. `dynamic = "force-dynamic"`.
- Sem auth — o middleware só guarda `/admin*` e `/api/admin*`.

## Referências

- `src/lib/health/CLAUDE.md` — o contexto e a porta
- `docs/observabilidade.md` — runbook
````

- [ ] **Step 4: Create the ready CLAUDE.md** — `src/app/api/health/ready/CLAUDE.md`

````markdown
# ready

> **Nota de Uso:** `GET /api/health/ready` — **readiness** (checagem de banco via
> `databaseProbe`). 200/503. Composition root; delega pro `@/lib/health`. Use sob
> demanda (deploy-smoke), **não** no ping de uptime. Ver `../CLAUDE.md`.
````

- [ ] **Step 5: Full verification (typecheck + lint + coverage gate)**

Run: `pnpm typecheck`
Expected: PASS (exit 0).

Run: `pnpm lint`
Expected: PASS (exit 0).

Run: `pnpm test:coverage`
Expected: PASS — todas as suites verdes (incl. `health.test.ts`, `api-health.test.ts`); gate de cobertura não regride (adapter excluído; porta é interface sem runtime).

- [ ] **Step 6: Commit**

```bash
git add docs/observabilidade.md src/lib/health/CLAUDE.md src/app/api/health/CLAUDE.md src/app/api/health/ready/CLAUDE.md
git commit -m "docs(health): runbook de observabilidade + CLAUDE.md (contexto e rotas)"
```

---

## Conclusão

Após as 3 tasks: usar **superpowers:finishing-a-development-branch** para push + abrir PR (a `master` é protegida; exige PR + CI verde). **Smoke e2e** e **ratchet de cobertura** ficam para o ciclo de testes da Fase 3 (ver §8 do spec).
