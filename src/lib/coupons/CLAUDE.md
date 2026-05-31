---
template: "Niche CLAUDE"
version: 1.0
status: "Ativo"
tags: [niche-claude, bounded-context, hexagonal, coupons]
nicho: "coupons"
escopo: "Bounded context Coupons — validação e cálculo de desconto via Prisma"
---

# `src/lib/coupons/` — Bounded Context Coupons

## Estrutura

```
src/lib/coupons/
├── infrastructure/persistence/coupons-repository.ts   # ex-coupons.ts
└── CLAUDE.md
```

## Diretrizes

- Re-valida sempre no servidor — nunca confiar em desconto vindo do client.
- Suporta `PERCENTAGE` e `FIXED`.
- Increment de `timesUsed` é atômico via `prisma.coupon.update({ data: { timesUsed: { increment: 1 }}})`.

## Histórico

- **2026-05-30 (Rodada 4.8):** movido. 4 consumers + 1 vi.mock atualizados.
