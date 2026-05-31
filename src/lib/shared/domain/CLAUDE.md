---
template: "Niche CLAUDE"
version: 1.0
status: "Ativo"
tags:
  - niche-claude
  - per-diretorio
  - hexagonal
  - domain
nicho: "shared/domain"
escopo: "Camada Domain do bounded context shared — primitivos puros (Zod schemas globais)"
---

# `src/lib/shared/domain/` — Domain layer

> **Camada Domain (Hexagonal):** entities, value objects, regras puras. **ZERO** imports de framework (sem Prisma, sem Next, sem Auth.js, sem Mercado Pago).
>
> Para `shared/`, o "domain" é primariamente Zod schemas compartilhados.

---

## Diretrizes Específicas

- **Imports proibidos:** `@prisma/client`, `next-auth`, `mercadopago`, `cloudinary`, `resend`, `next/*`. Validar com `grep -r "from '@prisma/client'\|from 'next-auth'\|from 'mercadopago'\|from 'cloudinary'\|from 'resend'\|from 'next/" .` retornando zero.
- **Imports permitidos:** `zod`, tipos puros, outras pastas `domain/` de outros bounded contexts.
- **Sem side effects** — funções puras, sem `fetch`, sem `localStorage`, sem `console.log` (exceto em dev).
- **Validações que valem em RSC + Client + Route Handler** vivem aqui. Validações específicas de um endpoint vão em `application/use-cases/` do bounded context dono.

## Stack Local

- `zod@3.25` apenas.

## Testes

- `src/test/validations.test.ts` (Vitest, sem mocks).

## Conteúdo

- `zod-schemas.ts` — schemas Zod globais (newsletter, contact, login, signup, etc).

## Referências

- `[[Preferencias Dev#3. Arquitetura Hexagonal]]`
- CLAUDE.md de `src/lib/shared/`
