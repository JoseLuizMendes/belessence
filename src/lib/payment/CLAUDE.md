---
template: "Niche CLAUDE"
version: 1.0
status: "Ativo"
tags: [niche-claude, bounded-context, hexagonal, payment]
nicho: "payment"
escopo: "Bounded context Payment — gateway Mercado Pago (criar preferência + processar webhook)"
---

# `src/lib/payment/` — Bounded Context Payment

## Estrutura

```
src/lib/payment/
├── infrastructure/external/payment-provider.ts   # ex-payment-provider.ts (Mercado Pago)
└── CLAUDE.md
```

## Diretrizes

- **Mercado Pago é a única implementação** atualmente. Caso troque (Stripe, Pagar.me), criar `application/ports/i-payment-gateway.ts` e múltiplos adapters em `infrastructure/external/`.
- **Webhook idempotente** — checar `paymentId` antes de dar baixa no estoque (evita double-decrement).
- **Server-only** — token MP nunca cruza pro client.

## Histórico

- **2026-05-30 (Rodada 4.9):** movido.
