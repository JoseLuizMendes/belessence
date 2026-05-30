---
template: "Niche CLAUDE"
version: 1.0
status: "Ativo"
tags:
  - niche-claude
  - per-diretorio
nicho: "allProducts"
escopo: "Rota pública do ecommerce"
---

# allProducts

> **Nota de Uso:** Server Component preferencial; dados buscados via `src/lib/*-db` ou Server Actions. Locale pt-BR. URLs públicas — não renomear.
>
> Gerado por `tools/generate-claude-md.js` em 2026-05-30 conforme regra **R8** (`[[CLAUDE]]` raiz + `[[Preferencias Dev#4. CLAUDE.md Universal]]`).

---

## Escopo do Diretório

Server Component preferencial; dados buscados via `src/lib/*-db` ou Server Actions. Locale pt-BR. URLs públicas — não renomear.

---

## Diretrizes Específicas

- Rota pública do ecommerce.
- Server Component preferencial; data fetching via `src/lib/*-db` (não fetch da própria API).
- URLs em pt-BR — NÃO renomear (são públicas, SEO-sensitive).
- Bloqueio de ações que exigem login: usar `useRequireAuth` em Client Components.

---

## Stack Local

Next.js App Router (RSC + Client) + Tailwind + Shadcn + GSAP/Lenis + Zustand (cache cart/wishlist).

---

## Testes

Playwright (`e2e/*.spec.ts`) + Vitest para componentes Client.

---

## Dependências Permitidas

Conforme `[[Preferencias Dev]]`.

---

## Referências

- `CLAUDE.md` global do projeto (raiz)
- `[[Preferencias Dev]]` — stack aprovada
- `[[Niche CLAUDE Template]]` — template canon
