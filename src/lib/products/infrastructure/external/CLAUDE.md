---
template: "Niche CLAUDE"
version: 1.0
status: "Ativo"
tags:
  - niche-claude
  - hexagonal
  - infrastructure
  - external
  - products
nicho: "products/infrastructure/external"
escopo: "Adapter Cloudinary para imagens de produto — URL transform helper"
---

# `src/lib/products/infrastructure/external/` — External adapter

> Adapter para serviço externo (Cloudinary CDN). Hoje só URL transform — quando precisar de upload signature ou auto-rename, virá pra cá também.

## Diretrizes

- **String manipulation puro** — não usa SDK Cloudinary aqui (URL helpers são suficientes).
- **Fallback local** — se URL inválida, retorna `/assets/placeholder.svg`.
- **Auto-transform `f_auto,q_auto`** anexado pra URLs Cloudinary sem transformação.

## Conteúdo

- `product-image.ts` — `productImageSrc()` (ex-`src/lib/product-image.ts`).

## Testes

`src/test/product-image.test.ts`.

## Referências

- CLAUDE.md de `src/lib/products/`
