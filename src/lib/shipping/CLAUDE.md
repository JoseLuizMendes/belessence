---
template: "Niche CLAUDE"
version: 1.0
status: "Ativo"
tags: [niche-claude, bounded-context, hexagonal, shipping]
nicho: "shipping"
escopo: "Bounded context Shipping — cálculo de frete por região + integração ViaCEP"
---

# `src/lib/shipping/` — Bounded Context Shipping

## Estrutura

```
src/lib/shipping/
├── infrastructure/external/shipping.ts   # ex-shipping.ts
└── CLAUDE.md
```

> **Pendente (futuro):** extrair regras de pricing puras (frete grátis ≥ R$ 199, preço por região) pra `domain/pricing-rules.ts`. Por ora monolítico em infrastructure/external pq integra com ViaCEP.

## Política de Frete

- Frete grátis se subtotal ≥ R$ 199.
- Sudeste R$ 14,90 | Sul R$ 19,90 | Centro-Oeste R$ 24,90 | Nordeste R$ 29,90 | Norte R$ 34,90.

## Histórico

- **2026-05-30 (Rodada 4.8):** movido.
