---
template: "Niche CLAUDE"
version: 1.0
status: "Ativo"
tags: [niche-claude, hexagonal, presentation, auth]
nicho: "auth/presentation"
escopo: "Entry points de auth — Server Actions, store cliente, helper de cookie admin (Edge-safe)"
---

# `src/lib/auth/presentation/`

## Conteúdo

- `auth-actions.ts` — Server Actions (`registerUser` com `bcrypt.hash`).
- `auth-gate-store.ts` — Zustand: modal de login + ação pendente. Client-only.
- `admin-auth.ts` — `verifyAdminSession(cookie)` Edge-safe via `jose`. Usado pelo middleware.

## Diretrizes

- **admin-auth.ts é Edge-safe** — só `jose`, sem `bcrypt` (Node-only).
- **auth-gate-store.ts** sem `persist` — modal state é efêmero, não vaza entre users.
- **registerUser** valida com Zod (de `@/lib/shared/domain/zod-schemas`) antes de criar.

## Referências

- CLAUDE.md de `src/lib/auth/`
- `[[ERR-2026-0003]]`
