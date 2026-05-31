---
template: "Niche CLAUDE"
version: 1.0
status: "Ativo"
tags: [niche-claude, bounded-context, hexagonal, reviews]
nicho: "reviews"
escopo: "Bounded context Reviews — avaliações de produto via Prisma"
---

# `src/lib/reviews/` — Bounded Context Reviews

## Estrutura

```
src/lib/reviews/
├── infrastructure/persistence/reviews-repository.ts   # ex-reviews-db.ts
└── CLAUDE.md
```

## Diretrizes

- Avg rating recalculado a cada review nova/atualizada.
- Server-only.

## Histórico

- **2026-05-30 (Rodada 4.10):** movido.
