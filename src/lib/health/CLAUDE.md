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
