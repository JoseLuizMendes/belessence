---
template: "Design / Spec"
status: "Em design — aguardando aprovação"
data: 2026-06-04
autor: "José Luiz Mendes + Claude"
escopo: "Fase 3 (fatia Observabilidade) — /api/health + uptime + doc de Sentry"
repo: "JoseLuizMendes/belessence (raiz git = frontend/belessence)"
referencia: "docs/superpowers/specs/2026-06-03-ambiente-dev-prod-design.md §5.9, §7 (Fase 3)"
---

# Observabilidade (Fase 3 — fatia 1) — Design

> Primeira fatia da **Fase 3** do spec de ambiente dev/prod (§5.9). Entrega a
> base de observabilidade **free-first**: um endpoint de saúde, um monitor de
> uptime externo apontando pra ele, e a documentação (desligada) do opt-in de
> Sentry. A fatia de **testes** da Fase 3 (aprofundar e2e + subir thresholds de
> cobertura) fica para um **ciclo separado**.

## 1. Contexto e objetivo

O Belessence está em produção (Vercel + Neon) sem uso real. Hoje não há como
saber, de fora, se o app **e o banco** estão de pé, nem confirmar qual versão
está no ar após um deploy. Esta fatia entrega:

1. **`GET /api/health`** — responde 200 com um ping leve no banco; 503 se o banco
   não responde. Inclui o commit do deploy (smoke pós-deploy).
2. **Uptime** — runbook para configurar o **UptimeRobot** (grátis) batendo no
   `/api/health` de produção, com alerta real por email.
3. **Sentry (opt-in, desligado)** — documentação de como ligar quando houver
   tráfego, sem instalar nada agora (decisão D8 do spec de ambiente).

**Objetivo de arquitetura:** respeitar **SOLID + Clean/Hexagonal Architecture**
exatamente como o resto do projeto (`preferences-dev.md §1.1`), criando um
bounded context `health/` com as camadas `domain/application/infrastructure`,
espelhando `orders/`.

## 2. Escopo e não-objetivos

**No escopo:** endpoint `/api/health`, o bounded context `health/`, teste unit,
o runbook `docs/observabilidade.md` (uptime + Sentry opt-in).

**Fora de escopo (deferido):**
- Aprofundar e2e (helper de login programático / un-skip) e subir thresholds de
  cobertura → **ciclo separado da Fase 3**.
- Instalar/ligar Sentry (só documentar) — gatilho de ROI em §6 do spec de ambiente.
- Smoke e2e do `/api/health` → entra junto com o ciclo de testes (ver §8).
- Métricas/tracing/APM, dashboards — não pedidos; YAGNI.

## 3. Registro de decisões

| ID | Decisão | Por quê |
|---|---|---|
| O1 | **Bounded context `health/` com 3 camadas** (não jogar em `shared/`) | `shared/` é só fundação (sem application); `§1.1` manda todo contexto novo ter `domain/application/infrastructure`. Consistência com `orders/`. |
| O2 | **Sem porta formal** (`i-*`); application depende do **shape** de `databaseHealth` | `§1.1`: "Não introduzir ports/adapters formais sem múltiplos adapters reais. YAGNI rígido." Mesmo DIP pragmático de `orders`. |
| O3 | Adapter de infra chamado **`database-health.ts`** (`databaseHealth.ping()`) | É um probe de liveness, não um repository CRUD de entidade — nome honesto. |
| O4 | **UptimeRobot externo + runbook** (não cron in-repo) | Alerta real por email, zero gasto de minutos de CI. O endpoint é o único código; o monitor é click-ops documentado. |
| O5 | Resposta com **extras de deploy-smoke** (`db.latencyMs`, `commit`, `timestamp`) | `commit` (`VERCEL_GIT_COMMIT_SHA`) confirma qual versão está no ar pós-deploy. |
| O6 | **503 quando o ping falha** | Faz o monitor detectar queda de **banco**, não só app fora do ar. |

## 4. Arquitetura

### 4.1 Estrutura (espelha `orders/`)

```
src/lib/health/
├── domain/
│   └── health-types.ts          # ProbeResult, HealthReport — tipos puros (sem Prisma/IO)
├── application/
│   └── check-health.ts          # checkHealth(): roda o probe, deriva status, monta o report
├── infrastructure/
│   └── persistence/
│       └── database-health.ts   # databaseHealth.ping(): SELECT 1 + latência — ÚNICO a tocar Prisma
└── CLAUDE.md                    # (+ CLAUDE.md em cada subpasta — convenção R8)
src/app/api/health/route.ts      # delivery HTTP: GET → checkHealth() → 200/503 + JSON
```

**Direção de import (`src/CLAUDE.md §2`):** `app/api/health/route.ts` →
`lib/health/application/check-health` → `lib/health/infrastructure/persistence/database-health`.
Só a infra conhece o Prisma; nada importa "pra cima".

### 4.2 `domain/health-types.ts` (puro)

```ts
export type ProbeResult = { ok: boolean; latencyMs: number };

export type HealthReport = {
  status: "ok" | "error";
  db: ProbeResult;
  commit: string | null; // VERCEL_GIT_COMMIT_SHA (null fora da Vercel)
  timestamp: string;      // ISO 8601
};
```

Sem imports de Prisma/Next/React. Pode ser usado em qualquer camada.

### 4.3 `infrastructure/persistence/database-health.ts` (adapter)

- `import "server-only"`. **Único** arquivo do contexto que importa o `prisma`
  singleton (`@/lib/shared/infrastructure/prisma-client`).
- `databaseHealth.ping()`: mede latência em volta de um `prisma.$queryRaw\`SELECT 1\``
  e retorna `ProbeResult`. Em erro, **captura** e retorna `{ ok: false, latencyMs }`
  (uma queda de banco é estado esperado de saúde, não exceção), logando via
  `console.error` para diagnóstico.
- **`$queryRaw` justificado** (apesar de `lib/CLAUDE.md §8`): liveness não é uma
  query de modelo; `SELECT 1` é a sonda canônica e barata. Comentário no arquivo
  registra o motivo.

```ts
export const databaseHealth = {
  async ping(): Promise<ProbeResult> { /* SELECT 1 + latência + try/catch */ },
};
```

### 4.4 `application/check-health.ts` (use case)

- `import "server-only"`. Orquestra: chama `databaseHealth.ping()`, deriva
  `status` (`db.ok ? "ok" : "error"`), lê `process.env.VERCEL_GIT_COMMIT_SHA ?? null`
  (SHA **completa** do deploy, ou `null` fora da Vercel) e `new Date().toISOString()`,
  monta o `HealthReport`. Depende do **shape** de `databaseHealth`, não do Prisma
  (DIP pragmático, O2).
- Pronto para **OCP**: um 2º probe (ex.: Cloudinary) entra agregando aqui, sem
  mudar a route.

```ts
export async function checkHealth(): Promise<HealthReport> { /* ... */ }
```

### 4.5 Delivery — `app/api/health/route.ts`

- `export const dynamic = "force-dynamic"` (nunca cachear a saúde).
- `GET`: `try/catch` (`src/CLAUDE.md §6`) → `const report = await checkHealth()`
  → `NextResponse.json(report, { status: report.status === "ok" ? 200 : 503 })`.
  Erro inesperado no `catch` → 503 com `{ status: "error" }`.
- **Público**: o `middleware.ts` só guarda `/admin*` e `/api/admin*`, então
  `/api/health` passa livre (sem auth — o monitor precisa alcançar).

### 4.6 Contrato HTTP

```jsonc
// 200 OK
{ "status": "ok",
  "db": { "ok": true, "latencyMs": 12 },
  "commit": "a1b2c3d",            // ou null fora da Vercel
  "timestamp": "2026-06-04T20:00:00.000Z" }

// 503 Service Unavailable (banco fora)
{ "status": "error",
  "db": { "ok": false, "latencyMs": 5004 },
  "commit": "a1b2c3d",
  "timestamp": "2026-06-04T20:00:00.000Z" }
```

Sem vazar o erro cru do banco no corpo (evita expor internals); detalhe vai pro
log do servidor.

## 5. Uptime — runbook (UptimeRobot)

Doc novo **`docs/observabilidade.md`**, seção "Uptime":
- Criar conta grátis no UptimeRobot; monitor **HTTP(s)** → `https://<domínio-prod>/api/health`.
- Intervalo 5 min; contato de alerta = email; (opcional) checagem de keyword `"status":"ok"`.
- Registrar que o **503-quando-o-banco-cai** faz o monitor pegar queda de DB, não
  só app fora do ar.
- `VERCEL_GIT_COMMIT_SHA` é injetada automaticamente pela Vercel — sem `.env`.

## 6. Sentry — opt-in (desligado)

Seção no mesmo **`docs/observabilidade.md`**:
- **Por que off:** D8 do spec de ambiente — sem tráfego, nada a capturar.
- **Gatilho de ROI:** §6 do spec de ambiente (>5k eventos/mês ou necessidade de retenção).
- **Como ligar (alto nível, sem código agora):** `pnpm add @sentry/nextjs`,
  rodar o wizard/config, env vars (`SENTRY_DSN`, `NEXT_PUBLIC_SENTRY_DSN`,
  `SENTRY_AUTH_TOKEN`), arquivos de instrumentation, upload de sourcemap no build.
- **Sem dependência nova** neste ciclo.

## 7. Testes (estratégia de 2 camadas — `§2.2`)

- **Unit (Vitest), `src/test/health.test.ts`:** mocka `databaseHealth.ping` e
  cobre `checkHealth()` (ramo ok → `status:"ok"`; ramo falha → `status:"error"`)
  e o mapeamento HTTP da route (200 vs 503). Centralizado em `src/test/` (`§2.1`).
  Ajuda o ratchet futuro de cobertura.
- **E2E:** deferido pro ciclo de testes (um smoke real `/api/health → 200` prova
  o ponta-a-ponta contra o Postgres do CI). Ver §8.

## 8. Itens deferidos

- **Smoke e2e** do `/api/health` (2 linhas em `e2e/static.spec.ts` ou
  `e2e/health.spec.ts`) — junto com o ciclo de testes da Fase 3.
- **Probes extras** (Cloudinary/Resend/Mercado Pago) — agregar em `checkHealth`
  quando houver razão real (OCP já previsto). YAGNI agora.
- **Sentry ligado** — quando o gatilho de §6 disparar.

## 9. Riscos e mitigações

| Risco | Mitigação |
|---|---|
| `/api/health` ser cacheado e mascarar queda | `dynamic = "force-dynamic"` |
| Ping pesar no banco | `SELECT 1` é trivial; sem scan de tabela |
| Vazar internals no corpo do 503 | Corpo sem o erro cru; detalhe só no log do servidor |
| Endpoint exposto publicamente | Só revela status/latência/commit (commit já está no bundle) — baixa sensibilidade; sem dados de usuário |

## 10. Arquivos tocados

**Novos:** `src/lib/health/domain/health-types.ts`,
`src/lib/health/application/check-health.ts`,
`src/lib/health/infrastructure/persistence/database-health.ts`,
`src/app/api/health/route.ts`, `src/test/health.test.ts`,
`docs/observabilidade.md`, + `CLAUDE.md` em cada pasta nova de `src/lib/health/`.

**Sem novas dependências.** Sem mudança de schema. Sem `.env` novo
(`VERCEL_GIT_COMMIT_SHA` é auto-injetada pela Vercel).
