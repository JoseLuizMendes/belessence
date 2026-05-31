---
template: "Niche CLAUDE"
version: 1.0
status: "Ativo"
tags:
  - niche-claude
  - per-diretorio
  - hexagonal
  - infrastructure
nicho: "shared/infrastructure"
escopo: "Camada Infrastructure do bounded context shared — adapters concretos (Prisma singleton)"
---

# `src/lib/shared/infrastructure/` — Infrastructure layer

> **Camada Infrastructure (Hexagonal):** adapters concretos. Aqui mora o Prisma Client singleton, com config SSL explícita via `@prisma/adapter-pg`.
>
> **Server-only.** NUNCA importar em Client Components.

---

## Diretrizes Específicas

- **Singleton em dev:** `globalThis.prisma` reutilizado pra evitar múltiplas instâncias durante hot-reload.
- **SSL Postgres:** `Pool({ ssl: { rejectUnauthorized: false } })` — solução do `[[ERR-2026-0005]]` em `[[06-Erros]]`.
- **Adapter:** `PrismaPg(pool)` — required pra Prisma 7+ em ambientes serverless.
- **Não exportar tipos** do `@/generated/prisma` daqui — quem precisa importa direto.

## Stack Local

- `@prisma/client@7.2`, `@prisma/adapter-pg@7.6`, `pg@8.20`.

## Testes

Sem testes unit dedicados — o singleton é trivial. Testes que dependem dele são integração (Vitest com banco de teste OU Playwright).

## Conteúdo

- `prisma-client.ts` — singleton com adapter + pool SSL.

## Referências

- `[[ERR-2026-0005]]` em `[[06-Erros]]` — SSL Postgres warning solução
- CLAUDE.md de `src/lib/shared/`
