---
template: "Design / Spec"
status: "Em design — aguardando aprovação"
data: 2026-06-04
autor: "José Luiz Mendes + Claude"
escopo: "Fase 3 (fatia 2) — aprofundar e2e: login programático + un-skip dos fluxos gated + smoke do health"
repo: "JoseLuizMendes/belessence (raiz git = frontend/belessence)"
referencia: "docs/superpowers/specs/2026-06-03-ambiente-dev-prod-design.md §7 (Fase 3); 2026-06-04-observabilidade-design.md §8"
---

# Aprofundar e2e — login programático (Fase 3, fatia 2) — Design

> Segunda fatia da **Fase 3**. Destrava os e2e que estão `skip` porque faltam os
> **helpers de login programático** (apelidados "T-extra-4" no código), conserta
> o helper de admin que ficou stale, e fecha o **smoke do health** deferido da
> fatia 1. O **ratchet de cobertura 73→75** fica para uma fatia separada (e2e não
> conta na cobertura do Vitest).

## 1. Contexto e objetivo

Vários e2e críticos estão `test.skip(... T-extra-4)` por falta de login
programático:

- **`checkout-flow`** (joia): cria pedido, **baixa estoque**, **consome cupom** em
  **banco real** — a "regra crítica" do `preferences-dev.md §2.2`.
- **`cart`** (adicionar produto), **`product`** (add to bag), **`order-tracking`**
  (PREPARING).
- **`admin-crud`** (criar produto persiste) — bloqueado porque o `loginAsAdmin`
  ficou **stale**: injeta o `ADMIN_SECRET` cru, mas o middleware passou a exigir
  um **JWT jose assinado** (blindagem do admin).

Objetivo: construir os helpers, un-skipar os fluxos gated e validar tudo no job
e2e do CI. Mais o smoke do `/api/health`.

## 2. Escopo e não-objetivos

**No escopo:** `loginAsUser` (novo), conserto do `loginAsAdmin`, usuário de teste
no seed, un-skip dos testes **gated por login**, smoke do health.

**Fora de escopo (deferido):**
- **Ratchet de cobertura 73→75** (unit) → fatia separada.
- Skips por **outro motivo** (mobile-only em `search`; "sem FAQ" em `help`;
  "idempotência coberta em unit" em `order-tracking`) — **continuam skip**.
- Login via OAuth Google (cabeado/desligado) — fora.

## 3. Registro de decisões

| ID | Decisão | Por quê |
|---|---|---|
| E1 | **`loginAsUser` forja o JWT** de sessão Auth.js v5 (via `encode` do `next-auth/jwt`) | Rápido, sem UI, padrão de mercado. `next-auth/jwt` é import de pacote (resolve no e2e; o alias `@/` não). |
| E2 | **Fallback: login real pela UI** se o `encode` não casar com a config | Reduz o risco do E1 (o maior da fatia) sem travar a entrega. |
| E3 | **Usuário de teste no seed** (id fixo, upsert idempotente) | Determinístico; o `sub` do JWT casa com um `User` real (FK do `CartItem`). Melhor que criar no teste. |
| E4 | **`loginAsAdmin`: replicar o jose `SignJWT` inline** (não importar `@/lib`) | O Playwright não resolve o alias `@/`; `jose` é pacote. Replica `createAdminSessionToken` (`sub:"admin"`, `v:1`, HS256/`ADMIN_SECRET`). |
| E5 | **TDD: provar o login antes de un-skipar** | Um smoke ("após `loginAsUser`, rota protegida abre logada") valida o helper antes de depender dele em 5 specs. |

## 4. Arquitetura / componentes

### 4.1 Usuário de teste no seed — `prisma/seed.ts`
`upsert` de um `User` com **id fixo** (ex.: `"e2e-user"`), `email`
`e2e@belessence.dev`, `passwordHash` bcrypt de uma senha conhecida (pro fallback
de UI). Idempotente — roda em todo `db seed` (dev e CI).

### 4.2 `loginAsUser(context)` — `e2e/support/auth.ts` (novo)
- Forja o token com `encode({ token: { sub: "e2e-user", email, name }, secret: process.env.AUTH_SECRET, salt: <cookie> })` do `next-auth/jwt`.
- Cookie: `authjs.session-token` (http/CI) — injeta no `BrowserContext` via `addCookies`.
- **Fallback (E2):** se o forjar não autenticar, fazer login real preenchendo o
  form em `/entrar` com o usuário do seed.

### 4.3 Conserto do `loginAsAdmin` — `e2e/support/admin.ts`
Trocar `value: ADMIN_SECRET` por um **jose `SignJWT`**: `{ v: 1 }`, `sub: "admin"`,
`setProtectedHeader({ alg: "HS256" })`, `setExpirationTime("12h")`, assinado com
`new TextEncoder().encode(process.env.ADMIN_SECRET)`. Espelha
`createAdminSessionToken` (`src/lib/auth/presentation/admin-auth.ts`).

### 4.4 Un-skip dos fluxos gated
Tirar o `test.skip` e cabear com os helpers + asserções de banco real (`db.ts`):
`checkout-flow`, `cart`, `product`, `order-tracking` (PREPARING), `admin-crud`
(criar produto). Manter os asserts já escritos nos specs (estoque ↓, cupom ↑,
pedido criado, produto persiste).

### 4.5 Smoke do health — `e2e/health.spec.ts` (novo)
`GET /api/health` → 200 + `status:"ok"`; `GET /api/health/ready` → 200 (banco up
no CI). Via `request` fixture do Playwright (sem navegar).

## 5. Risco e mitigação

| Risco | Mitigação |
|---|---|
| Forjar o JWT Auth.js não autenticar (salt/cookie/secret errados) | **E5**: smoke do `loginAsUser` primeiro (TDD); **E2**: fallback pra login via UI |
| Seed user colidir com dados existentes | id/email fixos + `upsert`; email dedicado de teste |
| e2e ficar flaky com login | Helpers determinísticos (cookie injetado); auto-wait do Playwright |
| `admin-crud` ainda depender de upload Cloudinary | `stubCloudinary` (já existe) |

## 6. Testes / verificação

- Os **próprios e2e** un-skipados são a entrega; rodam no job `e2e` do CI (banco
  efêmero, `migrate deploy + seed`).
- **Smoke do helper** (`loginAsUser`): um teste mínimo que abre uma rota protegida
  logado — escrito e verde **antes** de un-skipar os 5 specs.
- Local: `pnpm test:e2e` (Docker de teste 5433 + seed).

## 7. Arquivos tocados

**Novos:** `e2e/support/auth.ts` (`loginAsUser`), `e2e/health.spec.ts`.
**Modificados:** `prisma/seed.ts` (+user de teste), `e2e/support/admin.ts` (fix do
token), `e2e/checkout-flow.spec.ts`, `e2e/cart.spec.ts`, `e2e/product.spec.ts`,
`e2e/order-tracking.spec.ts`, `e2e/admin-crud.spec.ts` (un-skip).

**Sem novas dependências** (`jose`, `next-auth`, `bcryptjs`, `pg` já estão).
Sem mudança de schema.

## 8. Itens deferidos

- **Cobertura 73→75** (unit) — fatia separada da Fase 3.
- **OAuth Google** programático — fora.
