---
template: "Niche CLAUDE"
version: 1.0
status: "Ativo"
tags: [niche-claude, hexagonal, infrastructure, persistence, auth]
nicho: "auth/infrastructure/persistence"
escopo: "Admin login handler — Prisma + bcrypt + TOTP + lockout"
---

# `src/lib/auth/infrastructure/persistence/`

## Conteúdo

- `admin-login.ts` — fluxo de login admin: busca `AdminUser` via Prisma → compara `bcrypt.compare` → valida `otplib.authenticator.check` → registra lockout incremental em falhas.

## Diretrizes

- **Node-only** (`bcryptjs`, `Prisma`).
- Lockout: bloqueia conta por N minutos após M falhas (config no .env).
- TOTP secret armazenado em `AdminUser.totpSecret` (criptografado).

## Referências

- CLAUDE.md de `src/lib/auth/`
