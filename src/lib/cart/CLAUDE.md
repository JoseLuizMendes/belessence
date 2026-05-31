---
template: "Niche CLAUDE"
version: 1.0
status: "Ativo"
tags:
  - niche-claude
  - bounded-context
  - hexagonal
  - cart
nicho: "cart"
escopo: "Bounded context Cart — carrinho privado por usuário (banco) + cache Zustand"
---

# `src/lib/cart/` — Bounded Context Cart

> **Hexagonal soft:** infrastructure (Prisma adapter) + presentation (Server Actions + Zustand cache). Sem domain dedicado nesta iteração — entity `CartItem` é do `@prisma/client` ainda.
>
> Gerado na **Rodada 4.5** (2026-05-30).

## Escopo

Carrinho de usuário logado, **privado por usuário** no banco (FK `userId`). Server Actions movem itens; Zustand é só CACHE no client (sem `persist` — registrado em `[[ERR-2026-0006]]`).

## Estrutura

```
src/lib/cart/
├── infrastructure/
│   └── persistence/
│       └── cart-repository.ts       # ex-`cart-db.ts`
├── presentation/
│   ├── cart-actions.ts              # ex-`cart-actions.ts` (Server Actions)
│   └── cart-store.ts                # ex-`cart-store.ts` (Zustand cache)
└── CLAUDE.md
```

## Diretrizes

- **Preço relido do banco** no servidor — nunca confiar no client.
- **Zustand sem persist** — só cache do servidor. Reset no logout.
- **Server Actions** pegam `userId` via `auth()`. No-op seguro se deslogado.

## Stack Local

`@prisma/client`, `next-auth`, `zustand`. Tudo da Stack Estendida.

## Testes

`src/test/cart-store.test.ts`, `src/test/cart-wrapper.test.tsx`.

## Histórico

- **2026-05-30 (Rodada 4.5):** 3 arquivos movidos. 7 consumers + 1 vi.mock atualizados.
- **2026-04 (anterior):** carrinho migrado de localStorage global pra banco por usuário (resolve `[[ERR-2026-0006]]`).

## Referências

- `[[ERR-2026-0006]]` — cart vazamento entre users
- `[[Preferencias Dev#3. Arquitetura Hexagonal]]`
