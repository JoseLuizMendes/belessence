---
template: "Niche CLAUDE"
version: 1.0
status: "Ativo"
tags:
  - niche-claude
  - per-diretorio
  - bounded-context
  - hexagonal
  - products
nicho: "products"
escopo: "Bounded context Products — catálogo, estado de produto (NORMAL/PROMOTION/COMING_SOON/DISCONTINUED), imagens"
---

# `src/lib/products/` — Bounded Context Products

> **Hexagonal Architecture** — bounded context **products/** representa o catálogo. Aplica hex "soft" nesta iteração: domain (regras puras) + infrastructure (adapters). Use cases ainda inline em `infrastructure/persistence/`; serão extraídos quando virar dor de manutenção (`promoção tardia` permitida pelo `[[Preferencias Dev#3. Arquitetura Hexagonal]]`).
>
> Gerado na **Rodada 4.4** (2026-05-30) conforme `[[Ecommerce/Belessence/03-Planejamento]]`.

---

## 1. Escopo

- **Catálogo:** listar, buscar por slug, filtrar (categoria/gênero/coleção/status), encontrar featured/sales/coming-soon.
- **Estado de produto:** transições NORMAL ↔ PROMOTION ↔ COMING_SOON ↔ DISCONTINUED com regras de preço.
- **Imagem:** helper de URL (Cloudinary auto-transform, fallback local).

---

## 2. Estrutura Hexagonal

```
src/lib/products/
├── domain/
│   └── product-status.ts            # ex-`src/lib/product-status.ts` (regras puras de transição)
├── infrastructure/
│   ├── persistence/
│   │   └── products-repository.ts   # ex-`src/lib/products-db.ts` (Prisma queries)
│   └── external/
│       └── product-image.ts         # ex-`src/lib/product-image.ts` (Cloudinary URL helper)
└── CLAUDE.md
```

**Promoção tardia para Full Hex:** quando os primeiros 3-4 consumidores diretos de queries começarem a duplicar lógica de filtro ou transformação, extrair use cases em `application/use-cases/` + port `IProductRepository` em `application/ports/`.

---

## 3. Diretrizes

- **`Product` type** vive em `infrastructure/persistence/products-repository.ts` por ora — quando promovido a entidade rica, vai pra `domain/product.entity.ts`.
- **Decimals do Prisma** são serializados pra `number` antes de cruzar fronteira Server → Client (regra documentada em `products-repository.ts`).
- **Server-only:** `products-repository.ts` é server (importa Prisma). `product-status.ts` é compartilhado (sem Prisma — só usa o type). `product-image.ts` é compartilhado (sem deps externas).

## 4. Stack Local

- `@prisma/client` (server-only) + `@/lib/shared/infrastructure/prisma-client`
- Cloudinary URL transformations (string manipulation puro, sem SDK).

## 5. Testes

- `src/test/products-db*.test.ts` — queries
- `src/test/product-status.test.ts` — transições
- `src/test/product-image.test.ts` — URL helper

Imports atualizados na Rodada 4.4.

## 6. Dependências Permitidas

Apenas Stack Principal/Estendida — Prisma + Cloudinary URL.

## 7. Histórico

- **2026-05-30 (Rodada 4.4):** 3 arquivos movidos (`products-db.ts`, `product-status.ts`, `product-image.ts`). 25 consumers atualizados.

## Referências

- `[[Preferencias Dev#3. Arquitetura Hexagonal]]`
- `[[Ecommerce/Belessence/03-Planejamento]]` — sub-rodada 4.4
