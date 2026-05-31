---
template: "Niche CLAUDE"
version: 1.0
status: "Ativo"
tags: [niche-claude, bounded-context, hexagonal, auth]
nicho: "auth"
escopo: "Bounded context Auth — autenticação de usuário (Auth.js v5) + admin (cookie jose + bcrypt + TOTP + Google OAuth allowlist)"
---

# `src/lib/auth/` — Bounded Context Auth

> **Hexagonal soft.** Auth tem 2 caminhos paralelos: **usuário comum** (Auth.js v5 com Credentials + Google) e **admin** (cookie próprio assinado com jose + bcrypt + TOTP + Google OAuth com allowlist via Arctic).

## Estrutura

```
src/lib/auth/
├── infrastructure/
│   ├── external/
│   │   ├── auth.ts                # Auth.js v5 config (NextAuth)
│   │   └── admin-google.ts        # Arctic OAuth Google (admin)
│   └── persistence/
│       └── admin-login.ts         # Admin login: bcrypt + TOTP + lockout via Prisma
└── presentation/
    ├── auth-actions.ts            # Server Actions (registerUser, etc)
    ├── auth-gate-store.ts         # Zustand: modal de auth + ação pendente
    └── admin-auth.ts              # Cookie admin_session Edge-safe (jose)
```

## Diretrizes críticas

- **Auth.js v5 com Credentials EXIGE `session.strategy = "jwt"`** (`[[ERR-2026-0003]]`).
- **PrismaAdapter exige tabelas snake_case** (`[[ERR-2026-0004]]`) — não renomear.
- **admin-auth.ts** é Edge-safe (só `jose`) — usado pelo middleware. Não importar Node-only aqui.
- **admin-login.ts** é Node-only (`bcrypt`, `Prisma`) — usado em Server Actions/Route Handlers.
- **Allowlist Google admin** definida via `ADMIN_GOOGLE_ALLOWLIST` env var.

## Stack Local

`next-auth@5.0-beta.31`, `@auth/prisma-adapter`, `arctic@3.7`, `bcryptjs@3.0`, `jose@6.2`, `otplib@13.4`.

## Histórico

- **2026-05-30 (Rodada 4.7):** 6 arquivos movidos. 14 consumers atualizados.

## Referências

- `[[ERR-2026-0003]]`, `[[ERR-2026-0004]]`, `[[ERR-2026-0006]]`
- `[[Preferencias Dev#Stack Estendida — Ecommerce]]`
