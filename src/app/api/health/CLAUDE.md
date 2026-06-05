# health

> **Nota de Uso:** Healthchecks públicos. **Composition roots** — delegam pro
> bounded context `@/lib/health`. Não consumir de RSC.

## Endpoints

- **`GET /api/health` (este dir)** — liveness: `checkHealth([])`, 200 sem tocar
  o banco. **Alvo do monitor de uptime** (deixa o Neon suspender).
- **`GET /api/health/ready` (subdir `ready/`)** — readiness:
  `checkHealth([databaseProbe])`, 200/503 com checagem de banco. Deploy-smoke /
  monitor de baixa frequência.

## Diretrizes

- Route Handler magro: injeta a lista de probes, chama `checkHealth`, mapeia pra
  `NextResponse.json(report, { status })`. `dynamic = "force-dynamic"`.
- Sem auth — o middleware só guarda `/admin*` e `/api/admin*`.

## Referências

- `src/lib/health/CLAUDE.md` — o contexto e a porta
- `docs/observabilidade.md` — runbook
