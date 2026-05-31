---
template: "Niche CLAUDE"
version: 1.0
status: "Ativo"
tags:
  - niche-claude
  - per-diretorio
  - hexagonal
  - domain
nicho: "design/domain"
escopo: "Camada Domain do bounded context design — tokens visuais puros"
---

# `src/lib/design/domain/` — Domain layer

> **Camada Domain (Hexagonal):** tokens visuais como primitivos puros. ZERO imports de framework.

## Diretrizes

- **Imports proibidos:** qualquer coisa de Next.js, Tailwind plugins, GSAP, framework UI.
- **Imports permitidos:** TypeScript stdlib apenas.
- **Convenção de nome:** valores em camelCase (`brandGold`, `brandChampagne`). Helpers começam com `resolve*` ou `get*`.
- **Funções são puras.** Sem side effects.

## Conteúdo

- `tokens.ts` — paleta OKLCH + tipografia + spacing + helpers.

## Stack Local

TypeScript puro.

## Testes

Sem suite dedicada — valores literais.

## Referências

- CLAUDE.md de `src/lib/design/`
- `[[Preferencias Dev#3. Arquitetura Hexagonal]]`
