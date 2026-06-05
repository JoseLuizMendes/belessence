# Observabilidade — Belessence

> Runbook da base de observabilidade (Fase 3): healthchecks (liveness +
> readiness), uptime e o opt-in (desligado) do Sentry. Design:
> `docs/superpowers/specs/2026-06-04-observabilidade-design.md`.

## 1. Healthchecks

- **`GET /api/health` (liveness)** — 200 se o app responde. **Não toca o banco**
  (barato; é o que o monitor de uptime bate). Corpo:
  `{ "status":"ok", "checks":{}, "commit":…, "timestamp":… }`.
- **`GET /api/health/ready` (readiness)** — 200 (banco ok) ou **503** (banco
  fora/lento). Corpo:

```jsonc
{ "status": "ok",
  "checks": { "db": { "ok": true, "latencyMs": 12 } },
  "commit": "<sha-do-deploy>",   // VERCEL_GIT_COMMIT_SHA, ou null fora da Vercel
  "timestamp": "2026-06-04T20:00:00.000Z" }
```

O `commit` confirma **qual versão está no ar** após um deploy (injetado pela
Vercel).

## 2. Uptime — UptimeRobot (grátis)

1. Conta em https://uptimerobot.com (plano free).
2. **Add New Monitor** → **HTTP(s)** → URL
   `https://<seu-domínio-de-prod>/api/health` (**liveness** — não acorda o Neon).
3. Intervalo 5 min; keyword opcional `"status":"ok"`; alerta por email.

> **Por que o liveness, e não o readiness?** Bater no `/ready` (que toca o banco)
> a cada 5 min **mantém o Neon acordado** e queima compute-hours do free tier.
> Pro check de **banco** (deploy-smoke), bata em `/api/health/ready` manualmente
> ou com um monitor **separado de baixa frequência** (ex.: 1×/hora).

## 3. Sentry — opt-in (desligado)

**Estado:** desligado (D8). Sem tráfego, não há erro a capturar.
**Gatilho (§6 do spec de ambiente):** >5k eventos/mês ou retenção.
**Como ligar:** `pnpm add @sentry/nextjs`; wizard
`pnpm dlx @sentry/wizard@latest -i nextjs`; env
`SENTRY_DSN`/`NEXT_PUBLIC_SENTRY_DSN`/`SENTRY_AUTH_TOKEN`; sourcemaps no build.
Sem dependência neste ciclo.
