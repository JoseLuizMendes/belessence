---
template: "Niche CLAUDE"
version: 1.0
status: "Ativo"
tags: [niche-claude, hexagonal, presentation, wishlist]
nicho: "wishlist/presentation"
escopo: "Server Actions + Zustand store para wishlist"
---

# `src/lib/wishlist/presentation/`

> Mesmas regras de `cart/presentation/`. Store sem persist; Server Actions com `auth()`.

## Conteúdo

- `wishlist-actions.ts` — Server Actions.
- `wishlist-store.ts` — Zustand cache.

## Referências

- CLAUDE.md de `src/lib/wishlist/`
- `[[ERR-2026-0006]]`
