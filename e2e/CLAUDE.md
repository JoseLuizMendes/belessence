# CLAUDE.md — `e2e/`

> Testes ponta-a-ponta com **Playwright**. Rodam contra o app real
> (webServer sobe via `playwright.config.ts`). Separados dos testes
> unit/integração do Vitest (que vivem em `src/test/`).

---

## 1. Pré-requisitos

E2E precisa de **app rodando + banco real seedado**:
1. `DATABASE_URL` apontando para um Postgres de teste.
2. `pnpm prisma migrate deploy && pnpm prisma db seed`.
3. `ADMIN_SECRET` no ambiente (fluxo de login admin).

Comando: `pnpm test:e2e`. O `webServer` reaproveita um app já rodando em
dev; em CI usa `pnpm build && pnpm start`.

## 2. Escopo

- **Smoke + fluxos críticos**: homepage, busca, carrinho, checkout vazio,
  proteção de rotas admin.
- **Não** duplicar o que já é coberto por Vitest (regras de negócio,
  componentes isolados). E2E valida a **integração real** (navegação,
  RSC + Prisma, middleware, persistência client).

## 3. Convenções

- Um arquivo `*.spec.ts` por área (`home`, `search`, `cart`, `admin`).
- Seletores **por papel/label acessível** (`getByRole`, `getByLabel`) —
  nunca CSS frágil.
- Testes **resilientes ao seed**: se um pré-requisito de dado não existe
  (ex.: nenhum produto comprável), usar `test.skip(...)` em vez de falhar.
- `baseURL` vem do config; usar caminhos relativos (`page.goto("/")`).

## 4. Não faça

- Não escrever em banco de produção. E2E que cria pedido deve rodar contra
  banco de teste descartável.
- Não hardcodar credenciais admin no spec — ler de env.
- Não depender de timing/animação GSAP; usar auto-waiting do Playwright
  (`expect(...).toBeVisible()`).
- Não colocar specs Playwright em `src/` (o Vitest os pegaria por engano).
