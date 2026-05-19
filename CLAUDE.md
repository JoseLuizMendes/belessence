# CLAUDE.md — App Belessence (Next.js 16)

> Diretrizes para o aplicativo. Subdiretórios em `src/`, `prisma/`, `public/`
> têm `CLAUDE.md` próprio com regras locais. **Esta página é o ponto de
> entrada.**

---

## 1. O que é este projeto

E-commerce fullstack (B2C) de perfumes premium. Branding visível: **Mari
Beauty**. Nome interno do package: `belessence-new`.

- **Frontend público** — vitrine, busca, carrinho, checkout, pedido.
- **Painel admin** (`/admin/*`) — CRUD de produtos, pedidos, cupons,
  mensagens. Protegido por cookie `admin_session` validado no middleware.
- **Backend** — Route Handlers em `src/app/api/*` falando com Postgres via
  Prisma.

## 2. Stack e versões

- **Next.js 16** com **App Router** (RSC + Route Handlers). **Sem `pages/`.**
- **React 19** — usar `use()`, Server Actions, `useFormStatus` quando
  apropriado.
- **TypeScript** com paths `@/*` → `src/*` (ver `tsconfig.json`).
- **Tailwind v4** (PostCSS): tokens OKLCH em `src/app/globals.css` + helpers
  em `src/lib/design-tokens.ts`. **Não há `tailwind.config.ts`** — v4 lê
  do CSS.
- **Prisma 7** com `@prisma/adapter-pg` (driver `pg`). Cliente em
  `src/generated/` (não tocar). Schema em `prisma/schema.prisma`.
- **shadcn/ui** — style `new-york`, icon library `lucide`. Aliases em
  `components.json` apontam `utils → @/api/utils` e `lib → @/api`
  (peculiaridade do projeto — ver [src/api/CLAUDE.md](src/api/CLAUDE.md)).

## 3. Scripts (sempre via pnpm)

```bash
pnpm dev          # next dev
pnpm build        # prisma generate && next build
pnpm start        # produção
pnpm lint         # eslint
pnpm test         # vitest (watch)
pnpm test:ui      # vitest UI
pnpm test:e2e     # playwright
```

`postinstall` roda `prisma generate` — não removê-lo.

## 4. Variáveis de ambiente obrigatórias

`DATABASE_URL`, `ADMIN_SECRET`, credenciais Mercado Pago, Cloudinary,
Resend. Lista canônica em `.env.example`. **Acessar sempre via
`process.env.*` em código server-side**; em código client-side só
`NEXT_PUBLIC_*`.

## 5. Regras de alto nível

### 5.1 Server-first
- Componentes são **Server Components por padrão**. Só usar `"use client"`
  quando precisar de estado, efeito, evento de DOM, ou hook client-only.
- Buscas de dados em RSC chamam `src/lib/*` diretamente — **não** fetchar a
  própria API por HTTP.
- Route Handlers (`src/app/api/*`) são para clientes externos / componentes
  client. RSC não consome Route Handler.

### 5.2 Segurança
- O middleware [`src/middleware.ts`](src/middleware.ts) protege `/admin/*` e
  `/api/admin/*` com `admin_session === ADMIN_SECRET`. **Não bypassar.**
- **Nunca confiar em preço, estoque ou cupom vindo do client.** Re-validar
  no servidor via Prisma (ver `src/app/api/checkout/route.ts`).
- Toda entrada externa passa por **Zod** (`src/lib/validations.ts`).

### 5.3 Performance
- Imagens externas: usar `<Image>` do Next; domínios permitidos em
  `next.config.ts` (atualmente `res.cloudinary.com`).
- Animações pesadas (GSAP) são opt-in client-side; evitar carregar GSAP em
  RSC ou layout root.
- Prisma client é singleton ([`src/lib/prisma.ts`](src/lib/prisma.ts)) —
  não instanciar manualmente.

### 5.4 Testes
- Unit/component: Vitest + `@testing-library/react` (`jsdom`). Setup em
  `src/test/setup.ts`.
- E2E: Playwright.
- Não mockar Prisma em testes que afirmam comportamento de checkout/estoque
  — usar banco de teste ou fixtures reais.

### 5.5 Convenções de código
- **`async/await`**, sem `.then()` encadeado.
- **TS estrito**: nada de `any`, preferir `unknown` + narrow.
- Imports relativos curtos via alias `@/*`.
- `cn()` (de `src/api/utils.ts` por convenção shadcn) para merge de
  classes.

## 6. Não faça

- Não rodar `npm install` / `yarn install`.
- Não tocar em `src/generated/` (Prisma client) ou `prisma.config.ts` sem
  motivo claro.
- Não renomear rotas em pt-BR (`/sobre`, `/contato`, `/favoritos`,
  `/meus-pedidos`, `/sucesso`) — fazem parte da URL pública.
- Não criar componentes UI à mão se existe um em `src/components/ui/`.
- Não usar `framer-motion` — o projeto padronizou GSAP. (README menciona
  framer historicamente; ignorar.)
