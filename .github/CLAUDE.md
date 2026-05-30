---
template: "Niche CLAUDE"
version: 1.0
status: "Ativo"
tags:
  - niche-claude
  - per-diretorio
nicho: ".github"
escopo: "Configuração GitHub"
---

# .github

> **Nota de Uso:** CI workflows, issue/PR templates, dependabot. Mexer só com PR dedicado.
>
> Gerado por `tools/generate-claude-md.js` em 2026-05-30 conforme regra **R8** (`[[CLAUDE]]` raiz + `[[Preferencias Dev#4. CLAUDE.md Universal]]`).

---

## Escopo do Diretório

CI workflows, issue/PR templates, dependabot. Mexer só com PR dedicado.

---

## Diretrizes Específicas

- CI / CD workflows em `workflows/`.
- Issue & PR templates respeitam o pipeline canon do vault.
- Mudanças no CI exigem revisão.

---

## Stack Local

YAML (GitHub Actions). Sem código TS.

---

## Testes

Validação CI roda no próprio workflow.

---

## Dependências Permitidas

Actions oficiais GitHub + actions de terceiros versionadas.

---

## Referências

- `CLAUDE.md` global do projeto (raiz)
- `[[Preferencias Dev]]` — stack aprovada
- `[[Niche CLAUDE Template]]` — template canon
