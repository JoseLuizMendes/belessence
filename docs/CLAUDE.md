---
template: "Niche CLAUDE"
version: 1.0
status: "Ativo"
tags:
  - niche-claude
  - per-diretorio
nicho: "docs"
escopo: "Documentação técnica longa-forma"
---

# docs

> **Nota de Uso:** ARQUITETURA.md, decisões de design, runbooks. Documentação curta vai em README do projeto.
>
> Gerado por `tools/generate-claude-md.js` em 2026-05-30 conforme regra **R8** (`[[CLAUDE]]` raiz + `[[Preferencias Dev#4. CLAUDE.md Universal]]`).

---

## Escopo do Diretório

ARQUITETURA.md, decisões de design, runbooks. Documentação curta vai em README do projeto.

---

## Diretrizes Específicas

- Documentação técnica longa-forma (arquitetura, runbooks, decisões).
- Não duplicar com README do projeto — README é overview, docs/ é detalhe.
- Markdown padrão; diagramas em Mermaid.

---

## Stack Local

Conforme `[[Preferencias Dev]]`.

---

## Testes

Vitest + Playwright conforme `[[Preferencias Dev]]`.

---

## Dependências Permitidas

Apenas Stack Principal / Estendida aprovada em `[[Preferencias Dev]]`.

---

## Referências

- `CLAUDE.md` global do projeto (raiz)
- `[[Preferencias Dev]]` — stack aprovada
- `[[Niche CLAUDE Template]]` — template canon
