# `src/lib/orders/` — Bounded Context Orders

## Estrutura

```
src/lib/orders/
├── domain/
│   ├── order-types.ts        # OrderStatus + canTransition() (state machine pura)
│   └── order-tracking.ts     # TrackingOrderData (DTO consumido pelo modal)
├── application/
│   ├── confirm-payment.ts    # approved → PAYMENT_CONFIRMED → PREPARING (idempotente)
│   ├── get-order-by-id.ts    # leitura para /sucesso e modal
│   └── list-orders-by-email.ts  # leitura para /meus-pedidos
└── infrastructure/
    └── persistence/
        └── orders-repository.ts  # único acesso direto ao Prisma
```

## Diretrizes

- **Server-only:** todos os arquivos têm `import "server-only"`. Domain compartilha tipos com o cliente, mas não importa Prisma.
- **Idempotência (`confirmPayment`):** o repositório checa `OrderEvent` por `metadata.paymentId` antes de gravar. Chamada repetida do mesmo webhook é no-op.
- **State machine:** `canTransition` em `domain/order-types.ts` é a fonte única das transições válidas. Use ao adicionar novos pontos de mutação (ex.: admin marcando SHIPPED).
- **OrderEvent:** event log imutável. Toda transição de status grava uma linha. Não há "rollback" — para reverter, gravar nova transição (ex.: `CANCELLED`).
- **Boundary:** `infrastructure/persistence/orders-repository.ts` é o único arquivo do contexto que conhece o Prisma. `application/` depende do shape do objeto exportado, não do Prisma Client.

## Pontos de chamada da regra `approved → PREPARING`

- `src/app/api/checkout/route.ts` — checkout síncrono com mock retornando `approved`.
- `src/app/api/webhooks/mercado-pago/route.ts` — **a criar** quando o gateway real for plugado. Mesmo use case, `source: "webhook"`.

## Histórico

- **2026-06-01:** criado. Migração de `prisma` direto em `/sucesso` e `/meus-pedidos` para o contexto. Nova tabela `OrderEvent`.
