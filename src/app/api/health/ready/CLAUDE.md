# ready

> **Nota de Uso:** `GET /api/health/ready` — **readiness** (checagem de banco via
> `databaseProbe`). 200/503. Composition root; delega pro `@/lib/health`. Use sob
> demanda (deploy-smoke), **não** no ping de uptime. Ver `../CLAUDE.md`.
