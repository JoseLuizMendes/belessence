# Observabilidade (Fase 3 — fatia 1) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Entregar `GET /api/health` (200/503 + ping de banco + commit de deploy), um bounded context `health/` hexagonal, testes unit, e o runbook `docs/observabilidade.md` (UptimeRobot + Sentry opt-in desligado).

**Architecture:** Bounded context `src/lib/health/` com 3 camadas (`domain` puro → `application` use case → `infrastructure/persistence` adapter Prisma), espelhando `orders/`. Sem porta formal (YAGNI-rígido, `preferences-dev.md §1.1`); DIP pelo shape do objeto. O Route Handler `src/app/api/health/route.ts` é a porta HTTP magra que delega ao use case.

**Tech Stack:** Next.js 16 (Route Handler), TypeScript estrito, Prisma 7 (`$queryRaw`), Vitest. Sem novas dependências, sem schema, sem `.env` novo.

**Branch:** `feat/observabilidade` (já criado a partir da `master`). Spec: `docs/superpowers/specs/2026-06-04-observabilidade-design.md`.

---

## File Structure

| Arquivo | Responsabilidade |
|---|---|
| `src/lib/health/domain/health-types.ts` | Tipos puros `ProbeResult`, `HealthReport` (sem Prisma/IO). |
| `src/lib/health/infrastructure/persistence/database-health.ts` | `databaseHealth.ping()` — `SELECT 1` + latência; único a tocar Prisma. |
| `src/lib/health/application/check-health.ts` | `checkHealth()` — roda o probe, deriva status, monta o report. |
| `src/app/api/health/route.ts` | Porta HTTP `GET` → `checkHealth()` → 200/503 JSON. |
| `src/test/health.test.ts` | Unit de `checkHealth()` (mocka `databaseHealth`). |
| `src/test/api-health.test.ts` | Unit da route `GET` (mocka `checkHealth`). |
| `vitest.config.ts` (modificar) | Excluir `database-health.ts` da cobertura (adapter Prisma, E2E-coberto). |
| `docs/observabilidade.md` | Runbook: UptimeRobot + Sentry opt-in (desligado). |
| `src/lib/health/CLAUDE.md` | Doc do bounded context (estilo `orders/CLAUDE.md`). |
| `src/app/api/health/CLAUDE.md` | Doc da rota (estilo `products/CLAUDE.md`). |

---

## Task 1: Bounded context `health/` + use case `checkHealth`

**Files:**
- Create: `src/lib/health/domain/health-types.ts`
- Create: `src/lib/health/infrastructure/persistence/database-health.ts`
- Create: `src/lib/health/application/check-health.ts`
- Test: `src/test/health.test.ts`
- Modify: `vitest.config.ts` (exclude do adapter na cobertura)

- [ ] **Step 1: Write the failing test** — `src/test/health.test.ts`

```ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { checkHealth } from "@/lib/health/application/check-health";
import { databaseHealth } from "@/lib/health/infrastructure/persistence/database-health";

vi.mock("@/lib/health/infrastructure/persistence/database-health", () => ({
  databaseHealth: { ping: vi.fn() },
}));

const pingMock = vi.mocked(databaseHealth.ping);

describe("checkHealth", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("retorna status 'ok' quando o banco responde", async () => {
    pingMock.mockResolvedValue({ ok: true, latencyMs: 12 });

    const report = await checkHealth();

    expect(report.status).toBe("ok");
    expect(report.db).toEqual({ ok: true, latencyMs: 12 });
    expect(typeof report.timestamp).toBe("string");
  });

  it("retorna status 'error' quando o ping do banco falha", async () => {
    pingMock.mockResolvedValue({ ok: false, latencyMs: 5000 });

    const report = await checkHealth();

    expect(report.status).toBe("error");
    expect(report.db.ok).toBe(false);
  });

  it("expõe o commit do deploy quando VERCEL_GIT_COMMIT_SHA existe", async () => {
    pingMock.mockResolvedValue({ ok: true, latencyMs: 1 });
    vi.stubEnv("VERCEL_GIT_COMMIT_SHA", "abc123");

    const report = await checkHealth();

    expect(report.commit).toBe("abc123");
    vi.unstubAllEnvs();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm test:run src/test/health.test.ts`
Expected: FAIL — erro de resolução de import (`Failed to resolve import "@/lib/health/application/check-health"`), pois os arquivos ainda não existem.

- [ ] **Step 3: Create the domain types** — `src/lib/health/domain/health-types.ts`

```ts
/**
 * Tipos puros do bounded context Health. Sem Prisma/Next/IO — podem ser
 * usados em qualquer camada.
 */

/** Resultado de uma sonda individual de saúde. */
export type ProbeResult = {
  ok: boolean;
  latencyMs: number;
};

/** Relatório agregado de saúde do sistema (corpo do /api/health). */
export type HealthReport = {
  status: "ok" | "error";
  db: ProbeResult;
  /** SHA do commit do deploy (VERCEL_GIT_COMMIT_SHA) ou null fora da Vercel. */
  commit: string | null;
  /** Momento da checagem, ISO 8601. */
  timestamp: string;
};
```

- [ ] **Step 4: Create the Prisma adapter** — `src/lib/health/infrastructure/persistence/database-health.ts`

```ts
/**
 * database-health — adapter de liveness do Postgres (bounded context Health).
 *
 * Único arquivo do contexto que conhece o Prisma. Faz um ping barato
 * (`SELECT 1`) e mede a latência. Uma queda de banco é estado ESPERADO de
 * saúde (retorna { ok: false }), não exceção — por isso o try/catch.
 *
 * `$queryRaw` é justificado (apesar de lib/CLAUDE.md §8): liveness não é uma
 * query de modelo; `SELECT 1` é a sonda canônica e barata.
 */
import "server-only";
import { prisma } from "@/lib/shared/infrastructure/prisma-client";
import type { ProbeResult } from "../../domain/health-types";

export const databaseHealth = {
  async ping(): Promise<ProbeResult> {
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

- [ ] **Step 5: Create the use case** — `src/lib/health/application/check-health.ts`

```ts
/**
 * check-health — use case de saúde (bounded context Health).
 *
 * Orquestra as sondas, deriva o status e monta o HealthReport. Depende do
 * SHAPE de `databaseHealth` (DIP pragmático), não do Prisma. Pronto para OCP:
 * um 2º probe entra agregando aqui, sem mudar a route.
 */
import "server-only";
import { databaseHealth } from "../infrastructure/persistence/database-health";
import type { HealthReport } from "../domain/health-types";

export async function checkHealth(): Promise<HealthReport> {
  const db = await databaseHealth.ping();
  return {
    status: db.ok ? "ok" : "error",
    db,
    commit: process.env.VERCEL_GIT_COMMIT_SHA ?? null,
    timestamp: new Date().toISOString(),
  };
}
```

- [ ] **Step 6: Exclude the adapter from coverage** — `vitest.config.ts`

Na array `test.coverage.exclude`, logo após a linha `"src/lib/shared/infrastructure/prisma-client.ts", // singleton, mockado`, adicionar:

```ts
        // Adapter Prisma de liveness — coberto por integração/E2E (smoke),
        // como o prisma-client. Unit cobre a orquestração (checkHealth + route).
        "src/lib/health/infrastructure/persistence/database-health.ts",
```

- [ ] **Step 7: Run the test to verify it passes**

Run: `pnpm test:run src/test/health.test.ts`
Expected: PASS — `3 passed`.

- [ ] **Step 8: Commit**

```bash
git add src/lib/health src/test/health.test.ts vitest.config.ts
git commit -m "feat(health): bounded context health + use case checkHealth"
```

---

## Task 2: Route Handler `GET /api/health`

**Files:**
- Create: `src/app/api/health/route.ts`
- Test: `src/test/api-health.test.ts`

- [ ] **Step 1: Write the failing test** — `src/test/api-health.test.ts`

```ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "@/app/api/health/route";
import { checkHealth } from "@/lib/health/application/check-health";

vi.mock("@/lib/health/application/check-health", () => ({
  checkHealth: vi.fn(),
}));

const checkHealthMock = vi.mocked(checkHealth);

describe("GET /api/health", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("responde 200 quando o status é 'ok'", async () => {
    checkHealthMock.mockResolvedValue({
      status: "ok",
      db: { ok: true, latencyMs: 8 },
      commit: "abc123",
      timestamp: "2026-06-04T00:00:00.000Z",
    });

    const res = await GET();

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe("ok");
  });

  it("responde 503 quando o status é 'error'", async () => {
    checkHealthMock.mockResolvedValue({
      status: "error",
      db: { ok: false, latencyMs: 5000 },
      commit: "abc123",
      timestamp: "2026-06-04T00:00:00.000Z",
    });

    const res = await GET();

    expect(res.status).toBe(503);
  });

  it("responde 503 quando checkHealth lança erro inesperado", async () => {
    checkHealthMock.mockRejectedValue(new Error("boom"));

    const res = await GET();

    expect(res.status).toBe(503);
    const body = await res.json();
    expect(body.status).toBe("error");
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm test:run src/test/api-health.test.ts`
Expected: FAIL — `Failed to resolve import "@/app/api/health/route"` (a route ainda não existe).

- [ ] **Step 3: Create the route handler** — `src/app/api/health/route.ts`

```ts
/**
 * /api/health — GET
 * ─────────────────────────────────────────────────────────────────────
 * Healthcheck público: 200 com ping leve no banco; 503 se o banco não
 * responde. Inclui o commit do deploy (smoke pós-deploy). Sem auth — o
 * middleware só guarda /admin* e /api/admin*.
 *
 * Porta HTTP (driving adapter): delega toda a lógica para
 * `@/lib/health/application/check-health`.
 */
import { NextResponse } from "next/server";
import { checkHealth } from "@/lib/health/application/check-health";

// Nunca cachear a saúde — sempre refletir o estado atual.
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const report = await checkHealth();
    return NextResponse.json(report, {
      status: report.status === "ok" ? 200 : 503,
    });
  } catch (error) {
    console.error("[/api/health] erro inesperado:", error);
    return NextResponse.json(
      {
        status: "error",
        db: { ok: false, latencyMs: 0 },
        commit: process.env.VERCEL_GIT_COMMIT_SHA ?? null,
        timestamp: new Date().toISOString(),
      },
      { status: 503 },
    );
  }
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm test:run src/test/api-health.test.ts`
Expected: PASS — `3 passed`.

- [ ] **Step 5: Commit**

```bash
git add src/app/api/health/route.ts src/test/api-health.test.ts
git commit -m "feat(health): add GET /api/health route handler"
```

---

## Task 3: Runbook, CLAUDE.md e verificação final

**Files:**
- Create: `docs/observabilidade.md`
- Create: `src/lib/health/CLAUDE.md`
- Create: `src/app/api/health/CLAUDE.md`

> Nota de fence: os blocos abaixo usam **cerca de 4 crases** (````) por fora porque o conteúdo dos arquivos tem blocos de 3 crases dentro. Ao criar cada arquivo, use apenas o conteúdo interno (com as cercas de 3 crases normais).

- [ ] **Step 1: Create the runbook** — `docs/observabilidade.md`

````markdown
# Observabilidade — Belessence

> Runbook da base de observabilidade (Fase 3). Cobre o healthcheck, o monitor
> de uptime e o opt-in (desligado) do Sentry. Design:
> `docs/superpowers/specs/2026-06-04-observabilidade-design.md`.

## 1. Healthcheck — `GET /api/health`

Endpoint público que responde **200** (app e banco de pé) ou **503** (ping no
banco falhou). Corpo:

```jsonc
{ "status": "ok",
  "db": { "ok": true, "latencyMs": 12 },
  "commit": "<sha-do-deploy>",   // VERCEL_GIT_COMMIT_SHA, ou null fora da Vercel
  "timestamp": "2026-06-04T20:00:00.000Z" }
```

O `commit` confirma **qual versão está no ar** após um deploy
(`VERCEL_GIT_COMMIT_SHA` é injetada automaticamente pela Vercel — sem `.env`).

## 2. Uptime — UptimeRobot (grátis)

1. Conta em https://uptimerobot.com (plano free).
2. **Add New Monitor** → tipo **HTTP(s)**.
3. **URL:** `https://<seu-domínio-de-prod>/api/health`.
4. **Monitoring interval:** 5 min (free).
5. (Opcional) **Keyword monitoring:** alerta se a resposta **não** contiver
   `"status":"ok"` — pega o 503 (banco fora) mesmo com o app respondendo.
6. **Alert contacts:** seu email.

Como o endpoint devolve **503 quando o banco cai**, o monitor detecta tanto app
fora do ar quanto **queda de banco**.

## 3. Sentry — opt-in (desligado)

**Estado:** desligado de propósito (D8 do spec de ambiente). Sem tráfego real,
não há erro a capturar.

**Gatilho pra ligar (§6 do spec de ambiente):** tráfego gerando >5k eventos/mês
ou necessidade de retenção.

**Como ligar (alto nível):**
1. `pnpm add @sentry/nextjs`.
2. Wizard `pnpm dlx @sentry/wizard@latest -i nextjs` (ou config manual:
   `instrumentation.ts` + `sentry.*.config.ts`).
3. Env: `SENTRY_DSN`, `NEXT_PUBLIC_SENTRY_DSN`, `SENTRY_AUTH_TOKEN` (registrar
   no `.env.example` e nos escopos da Vercel).
4. Upload de sourcemaps no build (plugin do `@sentry/nextjs`).
5. Validar com um erro de teste.

Nenhuma dependência de Sentry é instalada neste ciclo.
````

- [ ] **Step 2: Create the context CLAUDE.md** — `src/lib/health/CLAUDE.md`

````markdown
# `src/lib/health/` — Bounded Context Health

> **Hexagonal.** Observabilidade de saúde do sistema. O endpoint público
> `GET /api/health` (`src/app/api/health/route.ts`) é só a porta HTTP — a
> lógica vive aqui.

## Estrutura

```
src/lib/health/
├── domain/
│   └── health-types.ts          # ProbeResult, HealthReport (tipos puros)
├── application/
│   └── check-health.ts          # checkHealth(): roda o probe, deriva status, monta o report
└── infrastructure/
    └── persistence/
        └── database-health.ts   # databaseHealth.ping(): SELECT 1 + latência — único a tocar Prisma
```

## Diretrizes

- **Server-only:** `application/` e `infrastructure/` têm `import "server-only"`.
  `domain/` é puro.
- **DIP pragmático:** `check-health` depende do **shape** de `databaseHealth`,
  não do Prisma. **Sem porta formal** (YAGNI-rígido, `preferences-dev.md §1.1`).
- **OCP:** um 2º probe entra agregando em `checkHealth`, sem mudar a route.
- **Queda de banco é estado esperado:** `ping()` captura o erro e retorna
  `{ ok: false }` (vira 503 na route).

## Testes

- `src/test/health.test.ts` — `checkHealth()` (mocka `databaseHealth`).
- `src/test/api-health.test.ts` — route `GET` (mocka `checkHealth`).
- `database-health.ts` (adapter Prisma) é coberto por integração/E2E, excluído
  da cobertura unit como o `prisma-client.ts`.

## Referências

- `docs/superpowers/specs/2026-06-04-observabilidade-design.md` — design
- `docs/observabilidade.md` — runbook (uptime + Sentry opt-in)
````

- [ ] **Step 3: Create the route CLAUDE.md** — `src/app/api/health/CLAUDE.md`

````markdown
# health

> **Nota de Uso:** Endpoint HTTP público de healthcheck (`GET /api/health`).
> Porta HTTP (driving adapter) — delega a lógica para
> `@/lib/health/application/check-health`. Não consumir de RSC.

## Escopo do Diretório

Healthcheck público para uptime/smoke pós-deploy. 200 (app+banco ok) ou 503
(banco fora). Sem auth — o middleware só guarda `/admin*` e `/api/admin*`.

## Diretrizes Específicas

- Route Handler magro: `try/catch` + `NextResponse.json(report, { status })`.
- `export const dynamic = "force-dynamic"` — nunca cachear a saúde.
- Toda a lógica vem de `@/lib/health/*` (nada de Prisma direto aqui).

## Referências

- `src/lib/health/CLAUDE.md` — o bounded context
- `docs/observabilidade.md` — runbook
````

- [ ] **Step 4: Full verification (typecheck + lint + coverage gate)**

Run: `pnpm typecheck`
Expected: PASS (exit 0, sem erros de tipo).

Run: `pnpm lint`
Expected: PASS (exit 0).

Run: `pnpm test:coverage`
Expected: PASS — todas as suites verdes (incl. `health.test.ts` e `api-health.test.ts`); o gate de cobertura não regride (o adapter está excluído).

- [ ] **Step 5: Commit**

```bash
git add docs/observabilidade.md src/lib/health/CLAUDE.md src/app/api/health/CLAUDE.md
git commit -m "docs(health): runbook de observabilidade + CLAUDE.md do contexto"
```

---

## Conclusão

Após as 3 tasks: usar **superpowers:finishing-a-development-branch** para push + abrir PR (a `master` é protegida; exige PR + CI verde). O **smoke e2e** do `/api/health` e o **ratchet de cobertura** ficam para o ciclo de testes da Fase 3 (ver §8 do spec).
