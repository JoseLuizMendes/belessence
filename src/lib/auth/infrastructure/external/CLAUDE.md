---
template: "Niche CLAUDE"
version: 1.0
status: "Ativo"
tags: [niche-claude, hexagonal, infrastructure, external, auth]
nicho: "auth/infrastructure/external"
escopo: "Adapters externos — Auth.js v5 config + Arctic OAuth Google admin"
---

# `src/lib/auth/infrastructure/external/`

## Conteúdo

- `auth.ts` — Auth.js v5 NextAuth config (providers, callbacks, PrismaAdapter). Exporta `handlers`, `auth`, `signIn`, `signOut`.
- `admin-google.ts` — Arctic OAuth client + allowlist (`ADMIN_GOOGLE_ALLOWLIST`).

## Diretrizes

- **`session.strategy = "jwt"`** obrigatório (Credentials Provider).
- `auth.ts` é importado em **TODAS** as fronteiras de auth (RSC `auth()`, route `/api/auth/[...nextauth]`).
- Arctic OAuth roda **server-only** (callback handler).

## Referências

- `[[ERR-2026-0003]]`, `[[ERR-2026-0004]]`
- CLAUDE.md de `src/lib/auth/`
