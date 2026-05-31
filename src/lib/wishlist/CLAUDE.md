---
template: "Niche CLAUDE"
version: 1.0
status: "Ativo"
tags:
  - niche-claude
  - bounded-context
  - hexagonal
  - wishlist
nicho: "wishlist"
escopo: "Bounded context Wishlist — favoritos privados por usuário (banco) + cache Zustand"
---

# `src/lib/wishlist/` — Bounded Context Wishlist

> Espelha `cart/`: privado por usuário no banco, Zustand sem persist (cache do servidor), reset no logout.
>
> Gerado na **Rodada 4.6** (2026-05-30).

## Estrutura

```
src/lib/wishlist/
├── infrastructure/persistence/wishlist-repository.ts   # ex-wishlist-db.ts
├── presentation/
│   ├── wishlist-actions.ts                             # Server Actions
│   └── wishlist-store.ts                               # Zustand cache (sem persist)
└── CLAUDE.md
```

## Diretrizes

- Mesmas do cart: server-only no repository; client-only no store; Server Actions com `auth()` (no-op se deslogado).
- Reset chamado em `auth-data-sync` no logout (resolve `[[ERR-2026-0006]]`).

## Histórico

- **2026-05-30 (Rodada 4.6):** 3 arquivos movidos.

## Referências

- CLAUDE.md de `src/lib/cart/` (estrutura espelhada)
- `[[ERR-2026-0006]]`
