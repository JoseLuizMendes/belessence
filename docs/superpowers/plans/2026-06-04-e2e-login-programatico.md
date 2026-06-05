# Aprofundar e2e — login programático (Fase 3, fatia 2) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Destravar os e2e gated por login: criar `loginAsUser` (forja JWT Auth.js v5), consertar `loginAsAdmin` (jose assinado), semear um usuário de teste, un-skipar os fluxos (checkout-flow, admin-crud, cart, product, order-tracking) e adicionar o smoke do `/api/health`.

**Architecture:** Helpers em `e2e/support/` (fora da app; usam imports de pacote — `next-auth/jwt`, `jose` — porque o Playwright não resolve o alias `@/`). O `loginAsUser` injeta o cookie de sessão Auth.js no `BrowserContext`; o `loginAsAdmin` injeta o cookie `admin_session` JWT. Un-skip = remover `.skip` + chamar o helper.

**Tech Stack:** Playwright, Auth.js v5 (`next-auth/jwt` `encode`), `jose`, `bcryptjs`, Prisma seed. Sem novas deps, sem schema.

**Branch:** `test/e2e-login-programatico`. Spec: `docs/superpowers/specs/2026-06-04-e2e-login-programatico-design.md`.

## Pré-requisitos de execução (e2e)

E2e precisa de **app + Postgres seedado**. Local: `pnpm db:up`, e rodar com `DATABASE_URL` apontando pro banco de teste (5433) já migrado+seedado; o `pnpm test:e2e` sobe o app via `pnpm dev`. **O gate autoritativo é o job `e2e` do CI** (Postgres efêmero + `migrate deploy` + `seed`). Onde um passo disser "rodar local", se o ambiente e2e não estiver de pé, validar no CI ao final (Task 8).

---

## File Structure

| Arquivo | Responsabilidade |
|---|---|
| `prisma/seed.ts` (mod) | Semear o usuário de teste (`e2e-user`) idempotente. |
| `e2e/support/auth.ts` (novo) | `loginAsUser` — forja o cookie de sessão Auth.js v5 + `TEST_USER`. |
| `e2e/support/admin.ts` (mod) | `loginAsAdmin` — cookie `admin_session` = JWT jose assinado. |
| `e2e/auth-smoke.spec.ts` (novo) | Prova que `loginAsUser` autentica (de-risk). |
| `e2e/checkout-flow.spec.ts` (mod) | Un-skip + `loginAsUser`. |
| `e2e/admin-crud.spec.ts` (mod) | Un-skip (2 tests; `loginAsAdmin` já no `beforeEach`). |
| `e2e/cart.spec.ts` / `e2e/product.spec.ts` / `e2e/order-tracking.spec.ts` (mod) | Un-skip + `loginAsUser`. |
| `e2e/health.spec.ts` (novo) | Smoke `/api/health` + `/api/health/ready`. |

---

## Task 1: Semear usuário de teste

**Files:**
- Modify: `prisma/seed.ts`

- [ ] **Step 1: Add bcrypt import** — no topo do `prisma/seed.ts`, após `import 'dotenv/config'`:

```ts
import bcrypt from 'bcryptjs'
```

- [ ] **Step 2: Seed the test user** — dentro de `main()`, logo após o loop de cupons (antes do `console.log('\n✅ Seed finalizado...')`):

```ts
  // ─── Usuário de teste (E2E) ──────────────────────────────────────────────────
  // Só em ambientes não-prod. Forjamos o JWT no e2e via este id/email fixos.
  if (process.env.NODE_ENV !== 'production') {
    await prisma.user.upsert({
      where: { email: 'e2e@belessence.dev' },
      update: {},
      create: {
        id: 'e2e-user',
        email: 'e2e@belessence.dev',
        name: 'Cliente E2E',
        passwordHash: await bcrypt.hash('e2e-password-123', 10),
      },
    })
    console.log('Created/Updated test user: e2e@belessence.dev')
  }
```

- [ ] **Step 3: Verify the seed runs** (precisa do banco up)

Run: `pnpm db:seed`
Expected: termina com `✅ Seed finalizado com sucesso!` e a linha `Created/Updated test user: e2e@belessence.dev` (em ambiente não-prod). Se o banco não estiver up, validar no CI (Task 8).

- [ ] **Step 4: Commit**

```bash
git add prisma/seed.ts
git commit -m "test(e2e): semeia usuário de teste e2e-user no seed"
```

---

## Task 2: Helper `loginAsUser` + smoke (de-risk do forjar JWT)

**Files:**
- Create: `e2e/support/auth.ts`
- Test: `e2e/auth-smoke.spec.ts`

- [ ] **Step 1: Write the smoke test** — `e2e/auth-smoke.spec.ts`

```ts
import { test, expect } from "@playwright/test";
import { loginAsUser } from "./support/auth";

/**
 * Prova que loginAsUser autentica: /checkout tem proteção server-side (auth()
 * redireciona deslogado pra /entrar). Logado, NÃO deve redirecionar.
 */
test("loginAsUser autentica — /checkout não redireciona pra /entrar", async ({
  context,
  page,
}) => {
  await loginAsUser(context);
  await page.goto("/checkout");
  await expect(page).not.toHaveURL(/\/entrar/);
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `pnpm test:e2e e2e/auth-smoke.spec.ts --project=chromium`
Expected: FAIL — `Cannot find module "./support/auth"` (o helper ainda não existe).

- [ ] **Step 3: Implement the helper** — `e2e/support/auth.ts`

```ts
/**
 * Helper de login de USUÁRIO comum para E2E.
 * ─────────────────────────────────────────────────────────────────────
 * Forja o cookie de sessão Auth.js v5 (JWT) via `encode` do `next-auth/jwt`,
 * evitando passar pela tela de login. O `sub` casa com o usuário semeado
 * (`e2e-user`) — o callback `session` do app expõe `session.user.id = token.sub`.
 *
 * Import de pacote (`next-auth/jwt`) de propósito: o Playwright não resolve o
 * alias `@/` (por isso `db.ts` usa `pg` puro).
 */
import type { BrowserContext } from "@playwright/test";
import { encode } from "next-auth/jwt";

export const TEST_USER = {
  id: "e2e-user",
  email: "e2e@belessence.dev",
  name: "Cliente E2E",
};

export async function loginAsUser(
  context: BrowserContext,
  baseURL = process.env.E2E_BASE_URL ?? "http://localhost:3000",
): Promise<void> {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error("AUTH_SECRET não definido — necessário para loginAsUser");
  }

  const { protocol, hostname } = new URL(baseURL);
  // Auth.js v5: nome do cookie de sessão (http vs https). O `salt` do encode
  // DEVE ser igual ao nome do cookie.
  const cookieName =
    protocol === "https:"
      ? "__Secure-authjs.session-token"
      : "authjs.session-token";

  const token = await encode({
    token: { sub: TEST_USER.id, email: TEST_USER.email, name: TEST_USER.name },
    secret,
    salt: cookieName,
  });

  await context.addCookies([
    {
      name: cookieName,
      value: token,
      domain: hostname,
      path: "/",
      httpOnly: true,
      sameSite: "Lax",
      secure: protocol === "https:",
    },
  ]);
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `pnpm test:e2e e2e/auth-smoke.spec.ts --project=chromium`
Expected: PASS — `/checkout` não redireciona pra `/entrar`.

> **Se FALHAR** (continua redirecionando pra `/entrar`): o forjar não casou com a config. **Fallback (E2 do spec):** trocar o corpo do `loginAsUser` por login real via UI — `page.goto("/entrar")`, preencher `getByLabel(/e-mail/i)` = `e2e@belessence.dev` e `getByLabel(/senha/i)` = `e2e-password-123`, clicar em entrar, e `await page.waitForURL((u) => !u.pathname.startsWith("/entrar"))`; depois reusar o `storageState` do `context`. Re-rodar o Step 4 até passar.

- [ ] **Step 5: Commit**

```bash
git add e2e/support/auth.ts e2e/auth-smoke.spec.ts
git commit -m "test(e2e): loginAsUser (forja JWT Auth.js) + smoke de autenticação"
```

- [ ] **Step 6: Define AUTH_SECRET no job e2e do CI** — `.github/workflows/test.yml`

No job `e2e`, no bloco `env:` (que já tem `DATABASE_URL`, `ADMIN_SECRET`, `NODE_ENV`), adicionar uma linha:

```yaml
      AUTH_SECRET: e2e-auth-secret-fixo-para-ci
```

Sem isso, o app (Auth.js) e o `loginAsUser` usam segredos diferentes (ou nenhum) e o forjar **não autentica no CI** — os testes logados falhariam só no CI. O valor é arbitrário, mas o **app e o helper leem o mesmo** `process.env.AUTH_SECRET`.

- [ ] **Step 7: Commit**

```bash
git add .github/workflows/test.yml
git commit -m "ci(e2e): define AUTH_SECRET no job e2e (necessário pro loginAsUser)"
```

---

## Task 3: Consertar `loginAsAdmin` (JWT jose assinado)

**Files:**
- Modify: `e2e/support/admin.ts`

- [ ] **Step 1: Replace the stale helper** — em `e2e/support/admin.ts`, trocar o `import` do topo e a função `loginAsAdmin` inteira (linhas 10–31) por:

```ts
import type { BrowserContext, Page } from "@playwright/test";
import { SignJWT } from "jose";

/**
 * loginAsAdmin: injeta o cookie `admin_session` = JWT jose assinado (HS256 com
 * ADMIN_SECRET), espelhando `createAdminSessionToken` (sub "admin", v 1, exp
 * 12h). O middleware (`verifyAdminSession`) só aceita esse formato — o segredo
 * cru não vale mais.
 */
export async function loginAsAdmin(
  context: BrowserContext,
  baseURL = process.env.E2E_BASE_URL ?? "http://localhost:3000",
): Promise<void> {
  const secret = process.env.ADMIN_SECRET;
  if (!secret) {
    throw new Error("ADMIN_SECRET não definido — necessário para E2E admin");
  }
  const { hostname } = new URL(baseURL);
  const token = await new SignJWT({ v: 1 })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject("admin")
    .setIssuedAt()
    .setExpirationTime("43200s")
    .sign(new TextEncoder().encode(secret));

  await context.addCookies([
    {
      name: "admin_session",
      value: token,
      domain: hostname,
      path: "/",
      httpOnly: true,
      sameSite: "Lax",
    },
  ]);
}
```

> A função `stubCloudinary(page)` (resto do arquivo) **fica como está**.

- [ ] **Step 2: Verify it compiles**

Run: `pnpm typecheck`
Expected: PASS (exit 0).

- [ ] **Step 3: Commit**

```bash
git add e2e/support/admin.ts
git commit -m "test(e2e): loginAsAdmin gera JWT jose assinado (não mais o segredo cru)"
```

---

## Task 4: Un-skip `checkout-flow` (a joia)

**Files:**
- Modify: `e2e/checkout-flow.spec.ts`

- [ ] **Step 1: Import the helper** — adicionar após o import de `./support/db` (linha 7):

```ts
import { loginAsUser } from "./support/auth";
```

- [ ] **Step 2: Un-skip + login** — trocar a assinatura do teste (linhas 33–35) de:

```ts
test.skip("checkout cria pedido, baixa estoque e consome cupom — requer login programático (T-extra-4)", async ({
  page,
}) => {
```

para:

```ts
test("checkout cria pedido, baixa estoque e consome cupom", async ({
  page,
  context,
}) => {
  await loginAsUser(context);
```

(O resto do corpo — interceptar CEP, adicionar à bag, checkout, asserções no banco — fica idêntico.)

- [ ] **Step 3: Run to verify it passes**

Run: `pnpm test:e2e e2e/checkout-flow.spec.ts --project=chromium`
Expected: PASS — redireciona pra `/sucesso/[id]`; no banco: 1 pedido pro email, estoque −1, `usedCount` do BELES10 +1. (Se o ambiente e2e local não estiver up, validar no CI — Task 8.)

- [ ] **Step 4: Commit**

```bash
git add e2e/checkout-flow.spec.ts
git commit -m "test(e2e): un-skip checkout-flow (pedido + estoque + cupom em banco real)"
```

---

## Task 5: Un-skip `admin-crud` (2 testes)

**Files:**
- Modify: `e2e/admin-crud.spec.ts`

- [ ] **Step 1: Un-skip both tests** — trocar `test.skip(` por `test(` nas duas linhas, removendo a nota T-extra-4 do título:
  - Linha 29: `test.skip("login admin dá acesso à área protegida de produtos — helper precisa de JWT (T-extra-4)", ...)` → `test("login admin dá acesso à área protegida de produtos", ...)`
  - Linha 34: `test.skip("criar produto persiste no catálogo — depende de login admin (T-extra-4)", ...)` → `test("criar produto persiste no catálogo", ...)`

(O `beforeEach` já chama `loginAsAdmin(context)` + `stubCloudinary(page)` — nada mais muda.)

- [ ] **Step 2: Run to verify it passes**

Run: `pnpm test:e2e e2e/admin-crud.spec.ts --project=chromium`
Expected: PASS — `/admin/produtos` não redireciona pro login; criar produto persiste (count == 1). (Senão, validar no CI — Task 8.)

- [ ] **Step 3: Commit**

```bash
git add e2e/admin-crud.spec.ts
git commit -m "test(e2e): un-skip admin-crud (acesso protegido + criar produto persiste)"
```

---

## Task 6: Un-skip `cart`, `product` e `order-tracking`

**Files:**
- Modify: `e2e/cart.spec.ts`, `e2e/product.spec.ts`, `e2e/order-tracking.spec.ts`

- [ ] **Step 1: cart.spec.ts** — adicionar import no topo e un-skipar:
  - Após `import { test, expect } from "@playwright/test";` (linha 1) adicionar:
    ```ts
    import { loginAsUser } from "./support/auth";
    ```
  - Linha 14: trocar
    ```ts
    test.skip("adicionar produto abre a gaveta e mostra o item — requer login programático (T-extra-4)", async ({ page }) => {
    ```
    por
    ```ts
    test("adicionar produto abre a gaveta e mostra o item", async ({ page, context }) => {
      await loginAsUser(context);
    ```

- [ ] **Step 2: product.spec.ts** — import + un-skip:
  - Após `import { test, expect } from "@playwright/test";` (linha 1) adicionar:
    ```ts
    import { loginAsUser } from "./support/auth";
    ```
  - Linha 39: trocar
    ```ts
    test.skip("aumentar quantidade e adicionar à bag abre o carrinho — requer login (T-extra-4)", async ({
      page,
    }) => {
    ```
    por
    ```ts
    test("aumentar quantidade e adicionar à bag abre o carrinho", async ({
      page,
      context,
    }) => {
      await loginAsUser(context);
    ```

- [ ] **Step 3: order-tracking.spec.ts** — import + un-skip (só o teste PREPARING; o `idempotência` continua skip):
  - Após o import de `./support/db` (linhas 2–6) adicionar:
    ```ts
    import { loginAsUser } from "./support/auth";
    ```
  - Linhas 42–44: trocar
    ```ts
    test.skip(
      "PREPARING: após checkout aprovado, pedido fica em PREPARING e modal mostra etapas com datas reais",
      async ({ page }) => {
    ```
    por
    ```ts
    test(
      "PREPARING: após checkout aprovado, pedido fica em PREPARING e modal mostra etapas com datas reais",
      async ({ page, context }) => {
        await loginAsUser(context);
    ```
  - **Não** mexer no teste `"PREPARING idempotência (skip — coberta em unit)"` (continua skip).

- [ ] **Step 4: Run to verify they pass**

Run: `pnpm test:e2e e2e/cart.spec.ts e2e/product.spec.ts e2e/order-tracking.spec.ts --project=chromium`
Expected: PASS nos 3 (os outros skips legítimos — mobile/idempotência — permanecem skip). Senão, validar no CI (Task 8).

- [ ] **Step 5: Commit**

```bash
git add e2e/cart.spec.ts e2e/product.spec.ts e2e/order-tracking.spec.ts
git commit -m "test(e2e): un-skip cart, product e order-tracking (PREPARING) com loginAsUser"
```

---

## Task 7: Smoke do health

**Files:**
- Create: `e2e/health.spec.ts`

- [ ] **Step 1: Write the spec** — `e2e/health.spec.ts`

```ts
import { test, expect } from "@playwright/test";

/**
 * Smoke dos healthchecks (fatia 1 da Fase 3). Usa o `request` fixture do
 * Playwright (sem navegar). Valida liveness (sem banco) e readiness (com banco).
 */
test("GET /api/health (liveness) responde 200 e status ok", async ({
  request,
}) => {
  const res = await request.get("/api/health");
  expect(res.status()).toBe(200);
  const body = await res.json();
  expect(body.status).toBe("ok");
});

test("GET /api/health/ready (readiness) responde 200 com o banco up", async ({
  request,
}) => {
  const res = await request.get("/api/health/ready");
  expect(res.status()).toBe(200);
  const body = await res.json();
  expect(body.status).toBe("ok");
  expect(body.checks.db.ok).toBe(true);
});
```

- [ ] **Step 2: Run to verify it passes**

Run: `pnpm test:e2e e2e/health.spec.ts --project=chromium`
Expected: PASS — 200 nos dois; readiness com `checks.db.ok === true`. Senão, validar no CI (Task 8).

- [ ] **Step 3: Commit**

```bash
git add e2e/health.spec.ts
git commit -m "test(e2e): smoke do /api/health e /api/health/ready"
```

---

## Task 8: Verificação final (typecheck + lint + CI)

- [ ] **Step 1: Typecheck + lint**

Run: `pnpm typecheck`
Expected: PASS (exit 0).

Run: `pnpm lint`
Expected: PASS (exit 0).

- [ ] **Step 2: Suíte e2e completa** (se o ambiente e2e local estiver up)

Run: `pnpm test:e2e --project=chromium`
Expected: PASS — incl. os un-skipados; só os skips legítimos (mobile-only, FAQ, idempotência) permanecem.

- [ ] **Step 3: Gate autoritativo — CI**

O job `e2e` do CI (Postgres efêmero + `migrate deploy` + `seed`) roda tudo. Concluir via **superpowers:finishing-a-development-branch** → push + PR; o CI valida. Se o `loginAsUser` falhar no CI (forjar não casar), aplicar o **fallback de UI** (Task 2 Step 4) e re-push.

---

## Conclusão

Após as tasks: **superpowers:finishing-a-development-branch** (push + PR; `master` protegida exige PR + CI verde). Maior risco = o forjar do JWT (Task 2); mitigado pelo smoke + fallback de UI. O **ratchet de cobertura 73→75** segue para uma fatia separada da Fase 3.
