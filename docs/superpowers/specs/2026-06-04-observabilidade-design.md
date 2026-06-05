---
template: "Design / Spec"
status: "Em design — aguardando aprovação (revisado p/ porta HealthProbe)"
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

**Objetivo de arquitetura:** respeitar **SOLID à risca** + Clean/Hexagonal
Architecture, com um bounded context `health/` que usa **porta + adapter**
(`HealthProbe`) para cravar **ISP, OCP e DIP** — não só SRP.

## 2. Escopo e não-objetivos

**No escopo:** endpoint `/api/health`, o bounded context `health/` (com porta
`HealthProbe`), testes unit, o runbook `docs/observabilidade.md`.

**Fora de escopo (deferido):**
- Aprofundar e2e e subir thresholds de cobertura → **ciclo separado da Fase 3**.
- Instalar/ligar Sentry (só documentar).
- Smoke e2e do `/api/health` → junto com o ciclo de testes (ver §8).
- Probes além do banco (Cloudinary/Resend) — a **porta já deixa pronto** (OCP),
  mas só se adiciona um probe real quando houver razão. Métricas/tracing/APM: YAGNI.

## 3. Registro de decisões

| ID | Decisão | Por quê |
|---|---|---|
| O1 | **Bounded context `health/` com camadas** `domain/application/infrastructure` | `§1.1` manda todo contexto novo ter as camadas. Consistência com `orders/`. |
| O2 | **COM porta formal `HealthProbe`** (override consciente do `§1.1` "YAGNI-rígido: sem porta com 1 adapter") | O usuário pediu **SOLID à risca (ISP/DIP)**, que *é sobre interfaces*. Um sistema de health é **multi-probe por natureza** (o §8 prevê mais probes), então a porta não é especulativa de verdade. Usa a pasta `application/ports/` que o próprio projeto designa. |
| O3 | Probe de banco chamado **`databaseProbe`** (implementa `HealthProbe`) | É um probe de liveness; o nome reflete o adapter concreto da porta. |
| O4 | **UptimeRobot externo + runbook** (não cron in-repo) | Alerta real por email, zero gasto de CI. |
| O5 | Resposta com **extras de deploy-smoke** (`checks[].latencyMs`, `commit`, `timestamp`) | `commit` (`VERCEL_GIT_COMMIT_SHA`) confirma a versão no ar pós-deploy. |
| O6 | **503 quando algum check falha** | Faz o monitor detectar queda de **banco**, não só app fora do ar. |
| O7 | **Injeção no composition root (`route.ts`)** | A route injeta `[databaseProbe]` no `checkHealth`. Application não importa infraestrutura → DIP textbook. |

## 4. Arquitetura

### 4.1 Estrutura

```
src/lib/health/
├── domain/
│   └── health-types.ts            # ProbeResult, HealthReport — tipos puros
├── application/
│   ├── ports/
│   │   └── health-probe.ts        # interface HealthProbe (porta) — ISP
│   └── check-health.ts            # checkHealth(probes: HealthProbe[]) — DIP + OCP
├── infrastructure/
│   └── persistence/
│       └── database-health.ts     # databaseProbe: HealthProbe — adapter (único a tocar Prisma)
└── CLAUDE.md
src/app/api/health/route.ts        # composition root: checkHealth([databaseProbe]) → 200/503
```

**Direção de dependência (pra dentro):** `infrastructure` → `application/ports`
→ `domain`; `application/check-health` → `application/ports` + `domain` (**não**
importa infraestrutura). Só o **composition root** (`route.ts`) conhece o
concreto e a abstração ao mesmo tempo, e injeta um no outro.

### 4.2 `domain/health-types.ts` (puro)

```ts
export type ProbeResult = { ok: boolean; latencyMs: number };

export type HealthReport = {
  status: "ok" | "error";
  checks: Record<string, ProbeResult>; // keyed pelo nome do probe (ex.: { db })
  commit: string | null;               // VERCEL_GIT_COMMIT_SHA ou null
  timestamp: string;                   // ISO 8601
};
```

### 4.3 `application/ports/health-probe.ts` (porta — ISP)

Interface **mínima e segregada**: um cliente só depende de `name` + `check()`.

```ts
import type { ProbeResult } from "../../domain/health-types";

export interface HealthProbe {
  readonly name: string;
  check(): Promise<ProbeResult>;
}
```

### 4.4 `infrastructure/persistence/database-health.ts` (adapter)

- `import "server-only"`. **Único** arquivo do contexto que importa o `prisma`.
  Implementa a porta `HealthProbe`. Em erro, **captura** e retorna
  `{ ok: false }` (queda de banco é estado esperado), logando via `console.error`.
- **`$queryRaw\`SELECT 1\``** justificado (apesar de `lib/CLAUDE.md §8`): liveness
  não é query de modelo; é a sonda canônica.

```ts
export const databaseProbe: HealthProbe = {
  name: "db",
  async check(): Promise<ProbeResult> { /* SELECT 1 + latência + try/catch */ },
};
```

### 4.5 `application/check-health.ts` (use case — DIP + OCP)

- `import "server-only"`. Recebe `probes: HealthProbe[]` (**depende da abstração**,
  não do concreto → DIP). Roda todos, deriva `status` (ok ⇔ todos ok), monta o
  report. **Somar um probe = passar mais um na lista; este arquivo nunca muda**
  (OCP).

```ts
export async function checkHealth(probes: HealthProbe[]): Promise<HealthReport> {
  /* Promise.all(probes.map(p => [p.name, await p.check()])) → checks + status */
}
```

### 4.6 Delivery / composition root — `app/api/health/route.ts`

- `export const dynamic = "force-dynamic"`.
- Monta a lista `const probes = [databaseProbe]` (composition root — o único lugar
  que casa porta + adapter) e chama `checkHealth(probes)`.
- `GET` com `try/catch` (`src/CLAUDE.md §6`) → `NextResponse.json(report, { status: report.status === "ok" ? 200 : 503 })`. Erro inesperado → 503.
- **Público**: o `middleware.ts` só guarda `/admin*` e `/api/admin*`.

### 4.7 Contrato HTTP

```jsonc
// 200 OK
{ "status": "ok",
  "checks": { "db": { "ok": true, "latencyMs": 12 } },
  "commit": "a1b2c3d…",            // ou null fora da Vercel
  "timestamp": "2026-06-04T20:00:00.000Z" }

// 503 Service Unavailable (algum check falhou)
{ "status": "error",
  "checks": { "db": { "ok": false, "latencyMs": 5004 } },
  "commit": "a1b2c3d…",
  "timestamp": "2026-06-04T20:00:00.000Z" }
```

Sem vazar o erro cru do banco no corpo; detalhe vai pro log do servidor.

### 4.8 Mapa de SOLID (agora à risca)

- **S:** tipos · porta · adapter · use case · delivery — cada um com uma razão de mudar.
- **O:** `checkHealth` itera `HealthProbe[]`; novo probe entra na lista **sem** editar o use case nem a route.
- **L:** qualquer `HealthProbe` é substituível onde a porta é esperada.
- **I:** `HealthProbe` é minúscula (`name` + `check()`) — nada de método não usado.
- **D:** `check-health` depende da **porta** (abstração); o adapter implementa a porta; o concreto é **injetado** no composition root. Dependências apontam pra dentro.

## 5. Uptime — runbook (UptimeRobot)

Doc novo **`docs/observabilidade.md`**, seção "Uptime": conta grátis no
UptimeRobot; monitor **HTTP(s)** → `https://<domínio-prod>/api/health`; intervalo
5 min; alerta por email; (opcional) keyword `"status":"ok"`. Registrar que o
**503-quando-um-check-falha** faz o monitor pegar queda de DB.
`VERCEL_GIT_COMMIT_SHA` é injetada automaticamente pela Vercel.

## 6. Sentry — opt-in (desligado)

Seção no mesmo **`docs/observabilidade.md`**: por que off (D8); gatilho de ROI
(§6 do spec de ambiente, >5k eventos/mês); como ligar (alto nível: `pnpm add
@sentry/nextjs`, wizard/config, env vars, sourcemaps). **Sem dependência** agora.

## 7. Testes (estratégia de 2 camadas — `§2.2`)

- **Unit (Vitest):**
  - `src/test/health.test.ts` — `checkHealth()` com **probes fake injetados**
    (test doubles que implementam `HealthProbe`): todos ok → `status:"ok"`; algum
    falha → `status:"error"`; commit do env. **Sem `vi.mock`** — o DIP permite
    injetar direto (payoff da inversão).
  - `src/test/api-health.test.ts` — a route `GET` (mocka `checkHealth`): 200/503/catch.
- **E2E:** deferido pro ciclo de testes (smoke real `/api/health → 200`). Ver §8.

## 8. Itens deferidos

- **Smoke e2e** do `/api/health` — com o ciclo de testes da Fase 3.
- **Probes extras** (Cloudinary/Resend/Mercado Pago) — a porta `HealthProbe` já
  deixa pronto (OCP); adicionar quando houver razão real.
- **Sentry ligado** — quando o gatilho de §6 disparar.

## 9. Riscos e mitigações

| Risco | Mitigação |
|---|---|
| `/api/health` cacheado mascarar queda | `dynamic = "force-dynamic"` |
| Ping pesar no banco | `SELECT 1` trivial; sem scan |
| Vazar internals no 503 | Corpo sem o erro cru; detalhe só no log |
| Endpoint público | Só revela status/latência/commit — baixa sensibilidade; sem dado de usuário |
| Porta "antecipada" ferir o §1.1 | Override consciente e registrado (O2): health é multi-probe por natureza; usa a pasta `application/ports/` já prevista |

## 10. Arquivos tocados

**Novos:** `src/lib/health/domain/health-types.ts`,
`src/lib/health/application/ports/health-probe.ts`,
`src/lib/health/application/check-health.ts`,
`src/lib/health/infrastructure/persistence/database-health.ts`,
`src/app/api/health/route.ts`, `src/test/health.test.ts`,
`src/test/api-health.test.ts`, `docs/observabilidade.md`,
+ `CLAUDE.md` do contexto e da rota.

**Modificados:** `vitest.config.ts` (excluir o adapter Prisma da cobertura).

**Sem novas dependências.** Sem mudança de schema. Sem `.env` novo.
