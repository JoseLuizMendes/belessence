---
template: "Niche CLAUDE"
version: 1.0
status: "Ativo"
tags:
  - niche-claude
  - hexagonal
  - infrastructure
  - persistence
  - products
nicho: "products/infrastructure/persistence"
escopo: "Adapter Prisma para o bounded context products — queries via @/lib/shared/infrastructure/prisma-client"
---

# `src/lib/products/infrastructure/persistence/` — Persistence adapter

> Adapter Prisma para o repositório de produtos. **Server-only.**

## Diretrizes

- **Decimals → number** antes do retorno (Decimals não cruzam Server → Client em Next.js 16/React 19).
- **Singleton Prisma** importado de `@/lib/shared/infrastructure/prisma-client`.
- **Queries nomeadas** (`findFeaturedProducts`, `findBySlug`, `searchProducts`, etc) — sem ad-hoc no consumer.

## Conteúdo

- `products-repository.ts` — todas as queries do catálogo (ex-`products-db.ts`).

## Testes

- `src/test/products-db*.test.ts` (3 arquivos).

## Referências

- CLAUDE.md de `src/lib/products/`
- `[[ERR-2026-0005]]` — SSL Postgres (resolvido em `prisma-client`)
