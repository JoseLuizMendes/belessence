---
template: "Niche CLAUDE"
version: 1.0
status: "Ativo"
tags:
  - niche-claude
  - per-diretorio
nicho: "types"
escopo: "Type augmentations TypeScript"
---

# types

> **Nota de Uso:** `*.d.ts` para extender tipos de libs (ex: `next-auth.d.ts` adiciona `Session.user.id`). Sem código runtime.
>
> Gerado por `tools/generate-claude-md.js` em 2026-05-30 conforme regra **R8** (`[[CLAUDE]]` raiz + `[[Preferencias Dev#4. CLAUDE.md Universal]]`).

---

## Escopo do Diretório

`*.d.ts` para extender tipos de libs (ex: `next-auth.d.ts` adiciona `Session.user.id`). Sem código runtime.

---

## Diretrizes Específicas

- Apenas `*.d.ts` augmentations de tipos.
- Ex: `next-auth.d.ts` adiciona campos custom a `Session.user`.
- Sem runtime code aqui.

---

## Stack Local

TypeScript declarations (`*.d.ts`).

---

## Testes

Type-check via `tsc --noEmit` (parte do `pnpm build`).

---

## Dependências Permitidas

N/A.

---

## Referências

- `CLAUDE.md` global do projeto (raiz)
- `[[Preferencias Dev]]` — stack aprovada
- `[[Niche CLAUDE Template]]` — template canon
