---
template: "Niche CLAUDE"
version: 1.0
status: "Ativo"
tags:
  - niche-claude
  - per-diretorio
nicho: "sql"
escopo: "Migrations SQL manuais"
---

# sql

> **Nota de Uso:** Migrations geradas pela CLI do Prisma vivem em `prisma/migrations/`. Aqui vão SQL ad-hoc (índices custom, raw SQL, etc).
>
> Gerado por `tools/generate-claude-md.js` em 2026-05-30 conforme regra **R8** (`[[CLAUDE]]` raiz + `[[Preferencias Dev#4. CLAUDE.md Universal]]`).

---

## Escopo do Diretório

Migrations geradas pela CLI do Prisma vivem em `prisma/migrations/`. Aqui vão SQL ad-hoc (índices custom, raw SQL, etc).

---

## Diretrizes Específicas

- Migrations SQL manuais (raw SQL, índices custom, triggers).
- Migrations padrão geradas pela CLI vivem em `prisma/migrations/`.
- Versionar com mesmo padrão de nomeação das migrations.

---

## Stack Local

SQL Postgres. Sem TS.

---

## Testes

Testar em DB de staging antes de aplicar em prod.

---

## Dependências Permitidas

N/A (SQL).

---

## Referências

- `CLAUDE.md` global do projeto (raiz)
- `[[Preferencias Dev]]` — stack aprovada
- `[[Niche CLAUDE Template]]` — template canon
