---
template: "Design / Spec"
status: "Em design — aguardando aprovação (rev. 2: liveness/readiness + runProbe)"
data: 2026-06-04
autor: "José Luiz Mendes + Claude"
escopo: "Fase 3 (fatia Observabilidade) — /api/health (liveness) + /api/health/ready (readiness) + uptime + doc de Sentry"
repo: "JoseLuizMendes/belessence (raiz git = frontend/belessence)"
referencia: "docs/superpowers/specs/2026-06-03-ambiente-dev-prod-design.md §5.9, §6, §7 (Fase 3)"
---

# Observabilidade (Fase 3 — fatia 1) — Design

> Primeira fatia da **Fase 3** do spec de ambiente dev/prod (§5.9). Base de
> observabilidade **free-first**: endpoints de saúde (liveness + readiness),
> monitor de uptime apontando pro liveness, e doc (desligada) do opt-in de
> Sentry. A fatia de **testes** da Fase 3 (aprofundar e2e + cobertura) fica para
> um **ciclo separado**.

## 1. Contexto e objetivo

O Belessence está em produção (Vercel + Neon) sem uso real. Hoje não dá pra
saber, de fora, se o app **e o banco** estão de pé, nem qual versão está no ar
após um deploy. Esta fatia entrega:

1. **`GET /api/health` (liveness)** — 200 imediato se o app responde. **Não toca
   o banco** (barato; é o alvo do monitor de uptime).
2. **`GET /api/health/ready` (readiness)** — 200 com ping leve no banco; 503 se o
   banco não responde. Inclui o commit do deploy (smoke pós-deploy).
3. **Uptime** — runbook do **UptimeRobot** (grátis) batendo no **liveness**.
4. **Sentry (opt-in, desligado)** — doc de como ligar (D8).

**Objetivo de arquitetura:** **SOLID à risca** + Hexagonal, com porta + adapter
(`HealthProbe`) cravando **ISP/OCP/DIP**. Liveness e readiness são o **mesmo use
case** com **listas de probes diferentes** — OCP/DIP na prática.

## 2. Escopo e não-objetivos

**No escopo:** os 2 endpoints, o bounded context `health/` (porta + use case +
adapter, com timeout/isolamento de probe), testes unit, o runbook.

**Fora de escopo (deferido):** aprofundar e2e + thresholds de cobertura (ciclo
separado); instalar Sentry (só documentar); smoke e2e do health (ver §8); probes
além do banco (a porta já deixa pronto — OCP); métricas/tracing/APM (YAGNI).

## 3. Registro de decisões

| ID | Decisão | Por quê |
|---|---|---|
| O1 | Bounded context `health/` com camadas `domain/application/infrastructure` | `§1.1`: todo contexto novo tem as camadas. Espelha `orders/`. |
| O2 | **COM porta formal `HealthProbe`** (override consciente do `§1.1` YAGNI) | Pedido de **SOLID à risca (ISP/DIP)** + health é multi-probe por natureza. Usa a pasta `application/ports/` já prevista. |
| O3 | Adapter `databaseProbe` (implementa `HealthProbe`) | Probe de liveness do banco; nome reflete o adapter concreto. |
| O4 | **UptimeRobot externo + runbook** | Alerta real por email, zero gasto de CI. |
| O5 | Extras de deploy-smoke (`latencyMs`, `commit`, `timestamp`) | `commit` confirma a versão no ar pós-deploy. |
| O6 | **503 quando algum check falha** | Monitor detecta queda de **banco**, não só app fora. |
| O7 | Injeção no **composition root** (a route) | Application não importa infraestrutura → DIP textbook. |
| **O8** | **`runProbe(probe, timeoutMs)` no use case**: `Promise.race` (timeout 3s) + `try/catch`, sempre devolve `ProbeResult` | Blinda **todo** probe (atual e futuro) contra **hang** (timeout) e **throw** (isolamento) num só lugar. DRY; dispensa `allSettled`; escala pra N probes. |
| **O9** | **Split liveness/readiness** (`/api/health` = `checkHealth([])`; `/api/health/ready` = `checkHealth([databaseProbe])`) | O ping de 5 min no banco **mataria o autosuspend do Neon** → queima compute-hours do free (gatilho §6). Liveness sem banco deixa o Neon dormir. Padrão de produção (k8s). Custo ~zero: só muda a **lista de probes injetada**. |
| **O10** | Caminho de falha testado na **orquestração** (timeout/isolamento/`ok:false`) | Fecha a branch do 503 agora, via probes fake injetados. Adapter Prisma fica como defesa redundante (E2E depois). |

## 4. Arquitetura

### 4.1 Estrutura

```
src/lib/health/
├── domain/
│   └── health-types.ts            # ProbeResult, HealthReport — tipos puros
├── application/
│   ├── ports/
│   │   └── health-probe.ts        # interface HealthProbe (porta — ISP)
│   └── check-health.ts            # checkHealth(probes) + runProbe (timeout+isolamento) — DIP+OCP
└── infrastructure/
    └── persistence/
        └── database-health.ts     # databaseProbe: HealthProbe — único a tocar Prisma
src/app/api/health/route.ts        # LIVENESS — composition root: checkHealth([])
src/app/api/health/ready/route.ts  # READINESS — composition root: checkHealth([databaseProbe])
```

**Direção de dependência (pra dentro):** `infrastructure` → `application/ports`
→ `domain`; `application/check-health` → `application/ports` + `domain` (**não**
importa infraestrutura). Só os **composition roots** (as routes) casam o concreto
com a abstração e injetam a lista de probes.

### 4.2 `domain/health-types.ts` (puro)

```ts
export type ProbeResult = { ok: boolean; latencyMs: number };

export type HealthReport = {
  status: "ok" | "error";
  checks: Record<string, ProbeResult>; // keyed pelo nome do probe; {} no liveness
  commit: string | null;               // VERCEL_GIT_COMMIT_SHA ou null
  timestamp: string;                   // ISO 8601
};
```

### 4.3 `application/ports/health-probe.ts` (porta — ISP)

```ts
import type { ProbeResult } from "../../domain/health-types";

export interface HealthProbe {
  readonly name: string;
  check(): Promise<ProbeResult>;
}
```

### 4.4 `infrastructure/persistence/database-health.ts` (adapter)

`import "server-only"`. Único a importar o `prisma`. Implementa `HealthProbe`;
em erro **captura** e retorna `{ ok: false }` (latência medida). `$queryRaw\`SELECT 1\``
justificado (liveness, não query de modelo).

```ts
export const databaseProbe: HealthProbe = {
  name: "db",
  async check(): Promise<ProbeResult> { /* SELECT 1 + latência + try/catch */ },
};
```

### 4.5 `application/check-health.ts` (use case — DIP + OCP + robustez)

- `import "server-only"`. **`runProbe(probe, timeoutMs)`** (helper interno) corre
  `probe.check()` contra um timeout (`Promise.race`) e captura throw — **sempre**
  devolve `ProbeResult` (`{ ok: false }` em hang/erro). `checkHealth(probes)` mapeia
  todos por `runProbe`, deriva `status` (ok ⇔ todos ok) e monta o report.
- **DIP:** depende da porta. **OCP:** somar probe = nova entrada na lista; este
  arquivo nunca muda. **Robustez:** um probe lento/podre vira `ok:false`, não
  derruba os outros nem pendura o endpoint.

```ts
const PROBE_TIMEOUT_MS = 3000;
async function runProbe(probe: HealthProbe, timeoutMs: number): Promise<ProbeResult> { /* race + try/catch/finally */ }
export async function checkHealth(probes: HealthProbe[]): Promise<HealthReport> { /* map(runProbe) → checks + status */ }
```

### 4.6 Delivery / composition roots

- **`app/api/health/route.ts` (liveness):** `checkHealth([])` → sempre 200 (sem
  banco). `dynamic = "force-dynamic"`. Alvo do UptimeRobot.
- **`app/api/health/ready/route.ts` (readiness):** `checkHealth([databaseProbe])`
  → 200/503 conforme o banco. `dynamic = "force-dynamic"`. `try/catch` (erro
  inesperado → 503).
- Ambos **públicos** (o middleware só guarda `/admin*` e `/api/admin*`).

### 4.7 Contrato HTTP

```jsonc
// GET /api/health (liveness) — 200
{ "status": "ok", "checks": {}, "commit": "a1b2c3d…", "timestamp": "…" }

// GET /api/health/ready (readiness) — 200 (banco ok)
{ "status": "ok", "checks": { "db": { "ok": true, "latencyMs": 12 } }, "commit": "a1b2c3d…", "timestamp": "…" }

// GET /api/health/ready — 503 (banco fora/lento)
{ "status": "error", "checks": { "db": { "ok": false, "latencyMs": 3000 } }, "commit": "a1b2c3d…", "timestamp": "…" }
```

Sem vazar o erro cru do banco no corpo; detalhe vai pro log do servidor.

### 4.8 Mapa de SOLID

- **S:** tipos · porta · use case · adapter · 2 delivery — cada um, uma razão de mudar.
- **O:** `checkHealth` itera `HealthProbe[]`; liveness vs readiness e probes novos = só **lista diferente**, sem editar o use case.
- **L:** qualquer `HealthProbe` é substituível onde a porta é esperada.
- **I:** `HealthProbe` minúscula (`name` + `check()`).
- **D:** use case depende da **porta**; adapter a implementa; concreto **injetado** nas routes. Dependências apontam pra dentro.

## 5. Uptime — runbook (UptimeRobot)

Doc novo **`docs/observabilidade.md`**: monitor **HTTP(s)** → `https://<domínio-prod>/api/health`
(**liveness**, sem banco — não acorda o Neon), intervalo 5 min, alerta por email,
keyword `"status":"ok"`. Para checagem de **banco** (deploy-smoke), bater em
`/api/health/ready` manualmente ou via um monitor **separado de baixa frequência**.

## 6. Sentry — opt-in (desligado)

Seção no mesmo doc: off por D8; gatilho §6 (>5k eventos/mês); como ligar (alto
nível: `pnpm add @sentry/nextjs`, wizard, env vars, sourcemaps). Sem dep agora.

## 7. Testes (2 camadas — `§2.2`)

- **Unit (Vitest):**
  - `src/test/health.test.ts` — `checkHealth()` com **probes fake injetados**:
    todos ok → `ok`; algum `ok:false` → `error`; **probe que lança → isolado em
    `ok:false`** (os outros sobrevivem); **probe que pendura → timeout → `ok:false`**
    (fake timers); **lista vazia (liveness) → `ok` + `checks: {}`**. Sem `vi.mock`.
  - `src/test/api-health.test.ts` — as 2 routes (mocka `checkHealth`): liveness →
    200 e `checkHealth([])`; readiness → 200/503/catch e `checkHealth([databaseProbe])`.
- **E2E:** deferido (smoke real). Ver §8.

## 8. Itens deferidos

- **Smoke e2e** do `/api/health(/ready)` — com o ciclo de testes.
- **Probes extras** — a porta já deixa pronto (OCP).
- **Sentry ligado** — gatilho §6.

## 9. Riscos e mitigações

| Risco | Mitigação |
|---|---|
| Ping de 5 min manter o Neon acordado (queima compute-hours) | **Liveness sem banco** (O9) — o monitor frequente não toca o Neon; readiness só sob demanda |
| Probe pendurar e travar o endpoint | **Timeout por probe** (O8, 3s) → `ok:false` |
| Um probe podre derrubar os outros | **`runProbe` isola** (O8) — nunca lança |
| `/api/health` cacheado mascarar queda | `dynamic = "force-dynamic"` nas duas routes |
| Vazar internals no 503 | Corpo sem o erro cru; detalhe só no log |
| Porta "antecipada" ferir o §1.1 | Override consciente e registrado (O2) |

## 10. Arquivos tocados

**Novos:** `src/lib/health/domain/health-types.ts`,
`src/lib/health/application/ports/health-probe.ts`,
`src/lib/health/application/check-health.ts`,
`src/lib/health/infrastructure/persistence/database-health.ts`,
`src/app/api/health/route.ts`, `src/app/api/health/ready/route.ts`,
`src/test/health.test.ts`, `src/test/api-health.test.ts`,
`docs/observabilidade.md`, + `CLAUDE.md` do contexto e das rotas.

**Modificados:** `vitest.config.ts` (excluir o adapter Prisma da cobertura).

**Sem novas dependências.** Sem mudança de schema. Sem `.env` novo.
