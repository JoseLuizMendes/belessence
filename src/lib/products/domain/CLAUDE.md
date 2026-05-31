---
template: "Niche CLAUDE"
version: 1.0
status: "Ativo"
tags:
  - niche-claude
  - hexagonal
  - domain
  - products
nicho: "products/domain"
escopo: "Camada Domain do bounded context products — regras puras de status/transição"
---

# `src/lib/products/domain/` — Domain layer

> **Camada Domain (Hexagonal):** regras de negócio puras. ZERO imports de framework além de `type` imports do Prisma (apenas enums/tipos).

## Diretrizes

- **Imports permitidos:** `zod`, `type`-only do `@prisma/client` (enums como `ProductStatus`).
- **Imports proibidos:** runtime do Prisma, `next-auth`, framework UI.
- **Funções puras** — sem fetch, sem DB, sem side effects.

## Conteúdo

- `product-status.ts` — regras de transição (NORMAL/PROMOTION/COMING_SOON/DISCONTINUED) com semântica de preço.

## Testes

`src/test/product-status.test.ts`.

## Referências

- CLAUDE.md de `src/lib/products/`
