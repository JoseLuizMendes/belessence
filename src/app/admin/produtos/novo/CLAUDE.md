---
template: "Niche CLAUDE"
version: 1.0
status: "Ativo"
tags:
  - niche-claude
  - per-diretorio
nicho: "novo"
escopo: "Rota do painel administrativo"
---

# novo

> **Nota de Uso:** Protegida pelo middleware via `admin_session` cookie. Server Component preferencial; `"use client"` só quando precisa interatividade. Re-validar tudo no servidor.
>
> Gerado por `tools/generate-claude-md.js` em 2026-05-30 conforme regra **R8** (`[[CLAUDE]]` raiz + `[[Preferencias Dev#4. CLAUDE.md Universal]]`).

---

## Escopo do Diretório

Protegida pelo middleware via `admin_session` cookie. Server Component preferencial; `"use client"` só quando precisa interatividade. Re-validar tudo no servidor.

---

## Diretrizes Específicas

- Rota protegida pelo middleware (`admin_session` cookie + `ADMIN_SECRET`).
- Server Component preferencial; `"use client"` só quando estritamente necessário.
- Re-validar tudo no servidor — admin auth não isenta validação de input.
- URLs admin em pt-BR (cupons, produtos, pedidos, mensagens).

---

## Stack Local

Next.js App Router (RSC + Client) + Tailwind + Shadcn + Zustand (cache) + Recharts (dashboards).

---

## Testes

Playwright (`e2e/admin*.spec.ts`).

---

## Dependências Permitidas

Conforme `[[Preferencias Dev]]` + Recharts (admin).

---

## Referências

- `CLAUDE.md` global do projeto (raiz)
- `[[Preferencias Dev]]` — stack aprovada
- `[[Niche CLAUDE Template]]` — template canon
