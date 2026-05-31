---
template: "Niche CLAUDE"
version: 1.0
status: "Ativo"
tags:
  - niche-claude
  - hexagonal
  - infrastructure
  - persistence
  - cart
nicho: "cart/infrastructure/persistence"
escopo: "Adapter Prisma para carrinho — server-only"
---

# `src/lib/cart/infrastructure/persistence/`

> Adapter Prisma. **Server-only.**

## Diretrizes

- Toda query usa `prisma` de `@/lib/shared/infrastructure/prisma-client`.
- Preço sempre relido do `Product.price` atual — não do `CartItem`.
- Atomicidade via `prisma.$transaction` para mudanças que afetam múltiplas rows.

## Conteúdo

- `cart-repository.ts` — ex-`cart-db.ts`.

## Referências

- CLAUDE.md de `src/lib/cart/`
