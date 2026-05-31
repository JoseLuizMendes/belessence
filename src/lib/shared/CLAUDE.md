---
template: "Niche CLAUDE"
version: 1.0
status: "Ativo"
tags:
  - niche-claude
  - per-diretorio
  - bounded-context
  - hexagonal
  - shared
nicho: "shared"
escopo: "Bounded context fundação — utilitários transversais usados por todos os outros (Prisma singleton, Zod schemas globais)"
---

# `src/lib/shared/` — Bounded Context Fundação

> **Hexagonal Architecture** — bounded context **shared/** fornece a base que os outros bounded contexts (`cart/`, `wishlist/`, `auth/`, `products/`, `orders/`, etc) consomem. Não tem `application/` nem `presentation/` próprios — é só fundação.
>
> Gerado na **Rodada 4.1** (2026-05-30) conforme `[[Ecommerce/Belessence/03-Planejamento]]`.

---

## 1. Escopo

Utilitários transversais que não pertencem a nenhum domínio de negócio específico mas são consumidos por todos:

- **Prisma Client singleton** — instância única do ORM, com configuração de driver adapter pra Postgres.
- **Zod schemas globais** — validações compartilhadas entre Route Handlers, Server Actions, Server Components e Client Components.

---

## 2. Estrutura Hexagonal

```
src/lib/shared/
├── domain/                    # primitivos puros (sem framework)
│   └── zod-schemas.ts        # ex-`src/lib/validations.ts`
├── infrastructure/           # adapters concretos
│   └── prisma-client.ts      # ex-`src/lib/prisma.ts` (singleton)
└── CLAUDE.md                 # este arquivo
```

> Sem `application/use-cases/` nem `application/ports/`: shared/ não tem regras de negócio próprias — só fundação técnica.

---

## 3. Diretrizes Específicas

- **Domain é puro:** `zod-schemas.ts` é zod só, sem imports de Prisma/Next/Auth. Use em qualquer lugar (RSC, Client, Route Handler).
- **Infrastructure é server-only:** `prisma-client.ts` exporta default `prisma` singleton (idempotente em dev), com `@prisma/adapter-pg` + `Pool` configurado. NUNCA importar em Client Components.
- **Adicionar novo schema Zod** que é usado em MAIS de um bounded context → vai em `domain/zod-schemas.ts`. Se for único de um bounded context (ex: `addItemToCartSchema`), fica em `<bc>/application/ports/` ou junto do use case que usa.

---

## 4. Stack Local

- `@prisma/client@7.2`, `@prisma/adapter-pg@7.6`, `pg@8.20` — infra Prisma
- `zod@3.25` — schemas

---

## 5. Testes

- `src/test/validations.test.ts` cobre os schemas Zod (já existente, atualizar imports após move).
- Sem teste dedicado a `prisma-client.ts` — singleton é trivial; testes que dependem dele são integração.

---

## 6. Dependências Permitidas

Apenas Stack Principal/Estendida em `[[Preferencias Dev]]`. Sem novas libs sem registrar em `[[05-Dev-Log]]`.

---

## 7. Histórico

- **2026-05-30 (Rodada 4.1):** `src/lib/prisma.ts` → `src/lib/shared/infrastructure/prisma-client.ts`. `src/lib/validations.ts` → `src/lib/shared/domain/zod-schemas.ts`. Imports em 43 arquivos atualizados.

---

## Referências

- `CLAUDE.md` global do projeto (raiz)
- `[[Preferencias Dev#3. Arquitetura Hexagonal (Ports & Adapters)]]`
- `[[Niche CLAUDE Template]]`
- `[[Ecommerce/Belessence/03-Planejamento]]` — sub-rodada 4.1
