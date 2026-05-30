---
template: "Niche CLAUDE"
version: 1.0
status: "Ativo"
tags:
  - niche-claude
  - per-diretorio
nicho: "search"
escopo: "Reservado para utilities de busca"
---

# search

> **Nota de Uso:** Atualmente vazio. Quando popular: helpers para Client Components consumirem `/api/products?search=`. Não confundir com `src/app/api/products/` (Route Handler).
>
> Gerado por `tools/generate-claude-md.js` em 2026-05-30 conforme regra **R8** (`[[CLAUDE]]` raiz + `[[Preferencias Dev#4. CLAUDE.md Universal]]`).

---

## Escopo do Diretório

Atualmente vazio. Quando popular: helpers para Client Components consumirem `/api/products?search=`. Não confundir com `src/app/api/products/` (Route Handler).

---

## Diretrizes Específicas

- Reservado para utilities de busca (autocomplete, fuzzy match) consumidas por Client Components.
- Hoje vazio — usar `src/lib/products/` para queries de produto.
- NÃO confundir com `src/app/api/` (Route Handlers HTTP).

---

## Stack Local

Conforme `[[Preferencias Dev]]`.

---

## Testes

Vitest + Playwright conforme `[[Preferencias Dev]]`.

---

## Dependências Permitidas

Helpers internos apenas; sem libs novas.

---

## Referências

- `CLAUDE.md` global do projeto (raiz)
- `[[Preferencias Dev]]` — stack aprovada
- `[[Niche CLAUDE Template]]` — template canon
