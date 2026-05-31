---
template: "Niche CLAUDE"
version: 1.0
status: "Ativo"
tags:
  - niche-claude
  - hexagonal
  - presentation
  - cart
nicho: "cart/presentation"
escopo: "Entry points do bounded context cart — Server Actions + Zustand cache"
---

# `src/lib/cart/presentation/`

> Entry points. Server Actions são server-only; store Zustand é client-only.

## Diretrizes

### Server Actions (`cart-actions.ts`)
- Marcadas com `"use server"`.
- Pegam `userId` via `auth()` de `next-auth`.
- No-op (sucesso vazio) se deslogado — UI não quebra.
- Re-validam tudo no servidor.

### Zustand store (`cart-store.ts`)
- **Client-only** — não importar em RSC.
- **SEM `persist`** — só cache do servidor (resolve `[[ERR-2026-0006]]`).
- `reset()` chamado no logout via `auth-data-sync`.
- Mutações otimistas com rollback em falha.

## Referências

- `[[ERR-2026-0006]]`
- CLAUDE.md de `src/lib/cart/`
