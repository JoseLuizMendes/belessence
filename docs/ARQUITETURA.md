# Arquitetura — Autenticação, Dados por Usuário e Loja

> Documento de referência das features e correções entregues no client-side
> da loja: login, bloqueio de ações, carrinho/favoritos privados por usuário,
> checkout parcial, filtros de fragrância e correções pontuais.
> Idioma do produto: **pt-BR**. Stack: Next.js 16 (App Router) + Prisma 7 +
> Auth.js v5.

---

## 1. Visão geral

| Área | O que mudou |
| --- | --- |
| **Autenticação** | Login/cadastro com Auth.js v5 (credenciais; Google cabeado/desativado). |
| **Bloqueio de ações** | Curtir, adicionar ao carrinho e comprar exigem login (modal inline). |
| **Privacidade de dados** | Carrinho e favoritos passaram de `localStorage` global para **banco, por usuário**. |
| **Checkout parcial** | Cliente escolhe quais itens finalizar (mín. 1, máx. todos); o resto fica no carrinho. |
| **Filtros** | Dropdown "Fragrâncias" funcional: categoria (perfume/colônia) + gênero, combináveis. |
| **Correções** | Coração da wishlist preenche; warning de SSL do Postgres; garantia de imagens. |

---

## 2. Autenticação (Auth.js v5 / NextAuth)

### Arquivos
- [`src/lib/auth.ts`](../src/lib/auth.ts) — config central: `PrismaAdapter`,
  `session.strategy = "jwt"` (obrigatório com credenciais), providers e
  callbacks. Expõe `handlers`, `auth`, `signIn`, `signOut`.
- [`src/app/api/auth/[...nextauth]/route.ts`](../src/app/api/auth/[...nextauth]/route.ts) — endpoints `/api/auth/*`.
- [`src/lib/auth-actions.ts`](../src/lib/auth-actions.ts) — `registerUser` (cria conta de credenciais com hash bcrypt).
- [`src/components/auth/auth-form.tsx`](../src/components/auth/auth-form.tsx) — formulário login/cadastro (RHF + Zod).
- [`src/components/auth/auth-panel.tsx`](../src/components/auth/auth-panel.tsx) — usado nas páginas `/entrar` e `/cadastro` (lê `callbackUrl`).
- [`src/components/auth/account-menu.tsx`](../src/components/auth/account-menu.tsx) — controle de conta no header.
- [`src/components/providers/session-provider.tsx`](../src/components/providers/session-provider.tsx) — `SessionProvider` client, montado no layout.
- [`src/types/next-auth.d.ts`](../src/types/next-auth.d.ts) — augmenta `Session.user.id`.

### Schema (Prisma)
`User`, `Account`, `Session`, `VerificationToken` (modelos do
`@auth/prisma-adapter`). `User.passwordHash` guarda o hash bcrypt das contas
de credenciais (null em contas só-OAuth). Campos OAuth em snake_case são
exigência do adapter — não renomear.

### Providers
- **Credenciais** (email + senha): `authorize` valida via `bcrypt.compare`
  contra `User.passwordHash`.
- **Google**: incluído **apenas** se `AUTH_GOOGLE_ID` e `AUTH_GOOGLE_SECRET`
  existirem no ambiente — fica "pronto e desligado" até as chaves serem
  configuradas.

### Sessão / identidade
Estratégia **JWT**. O `token.sub` recebe o id do usuário no sign-in; o
callback `session` expõe `session.user.id`.

### Separação do admin
O painel admin (`/admin/*`) continua protegido pelo cookie `admin_session`
no [`middleware.ts`](../src/middleware.ts) — **não foi alterado**. A
autenticação do cliente é totalmente separada.

### Habilitar Google (quando quiser)
1. Criar um OAuth Client ID (tipo Web) em https://console.cloud.google.com.
2. Redirect URI autorizado (dev): `http://localhost:3000/api/auth/callback/google`.
3. Preencher `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` no `.env` e reiniciar o dev.

---

## 3. Bloqueio de ações (auth-gate)

Ações que exigem login: **curtir**, **adicionar ao carrinho**, **comprar**.

- [`src/lib/hooks/use-require-auth.ts`](../src/lib/hooks/use-require-auth.ts):
  `requireAuth(action)` — se autenticado, executa; senão abre o modal
  guardando a ação pendente.
- [`src/lib/auth-gate-store.ts`](../src/lib/auth-gate-store.ts): estado do
  modal (`open`, `pendingAction`).
- [`src/components/auth/auth-dialog.tsx`](../src/components/auth/auth-dialog.tsx):
  modal montado no layout. No sucesso do login, **fecha mantendo a ação
  pendente**.
- A ação pendente roda no `AuthDataSync` **após** a hidratação dos dados do
  usuário (`consumePending`), evitando corrida (ex.: o "curtir" que disparou
  o login ser sobrescrito pela hidratação).
- **Checkout** (`/checkout`) tem proteção server-side adicional via `auth()`
  (redireciona para `/entrar?callbackUrl=/checkout`).

Componentes que aplicam o gate: `wishlist-button`, `product-card`,
`product-details-client`, `product-details-dialog`.

---

## 4. Carrinho e favoritos — privados por usuário

> **Problema corrigido:** antes, carrinho e favoritos viviam num único
> `localStorage` global do navegador, sem vínculo com usuário e sem limpeza
> no logout — o próximo usuário via os dados do anterior.

### Modelo
Tabelas `WishlistItem` e `CartItem`, ambas com `userId` (FK
`onDelete: Cascade`) e `@@unique([userId, productId])`. O `CartItem` guarda
`quantity`; o preço é **sempre relido do produto no banco** ao montar o
carrinho (nunca confiar no client).

### Camadas
- **Data layer (server-only):** [`wishlist-db.ts`](../src/lib/wishlist-db.ts),
  [`cart-db.ts`](../src/lib/cart-db.ts).
- **Server Actions:** [`wishlist-actions.ts`](../src/lib/wishlist-actions.ts),
  [`cart-actions.ts`](../src/lib/cart-actions.ts) — pegam o `userId` via
  `auth()`; no-op seguro se deslogado.
- **Stores (client) = cache do servidor:** [`cart-store.ts`](../src/lib/cart-store.ts),
  [`wishlist-store.ts`](../src/lib/wishlist-store.ts). **Sem `persist`/localStorage.**
  Mutações são otimistas e sincronizam via Server Action, com **rollback** em
  falha.
- **Sincronização de sessão:** [`auth-data-sync.tsx`](../src/components/auth/auth-data-sync.tsx)
  — no login hidrata as stores do banco; no **logout zera** (`reset`), para
  que nada de um usuário sobre para o próximo.

### Regra de ouro
**Nunca** voltar a persistir carrinho/favoritos em `localStorage` global.
Dado por usuário vive no banco; a store é só cache de UI.

---

## 5. Checkout parcial

O cliente pode escolher quais itens finalizar (**mínimo 1, máximo todos**) e
manter o restante no carrinho.

- Seleção fica na `cart-store` (`selectedIds`) — estado de UI, não persiste.
  Por padrão, todos os itens entram selecionados.
- **Bag (header)** [`cart-sheet.tsx`](../src/components/cart-sheet.tsx):
  checkbox por item + "Selecionar todos"; total reflete só os selecionados;
  botão "Finalizar" desabilitado com 0 selecionados.
- **Checkout** [`checkout-client.tsx`](../src/components/checkout-client.tsx):
  opera apenas nos itens selecionados (resumo, total, POST). Ao concluir,
  `removeOrdered(ids)` remove só os comprados (store + banco) e re-seleciona o
  que sobrou. Fallback: se chegar sem seleção, seleciona tudo.

---

## 6. Filtros de fragrância (categoria + gênero)

- Schema: enum `Gender { FEMININO MASCULINO UNISSEX }` + `Product.gender`.
- [`products-db.ts`](../src/lib/products-db.ts): `category` filtra a coluna
  `category` (perfume/cologne); `genero` filtra `gender` (normalizado por
  prefixo). Os dois **combinam** via `AND` (ex.: perfumes femininos).
- PLP [`/allProducts`](../src/app/allProducts/page.tsx): duas linhas de pills
  (Tipo + Gênero), combináveis, preservadas na URL.
- Header [`header.tsx`](../src/components/header.tsx): dropdown "Fragrâncias"
  com links reais (desktop + mobile).
- Admin: campo "Gênero" no formulário de produto.

---

## 7. Correções pontuais

- **Coração da wishlist não preenchia:** as cores `brand-*` não estão no
  `@theme` do Tailwind v4 (utilities `text-*`/`bg-*` são manuais). Faltava
  `.fill-brand-wine` — adicionada em [`globals.css`](../src/app/globals.css).
- **Warning de SSL do Postgres:** [`prisma.ts`](../src/lib/prisma.ts) extrai o
  `sslmode` da `DATABASE_URL` e passa a config `ssl` explicitamente ao `Pool`,
  preservando o comportamento (verify-full) sem o warning de depreciação.
- **Imagens (.webp):** renderizam desde que a URL seja do Cloudinary
  (`res.cloudinary.com`, liberado em `next.config.ts`) ou arquivo existente em
  `public/`. O helper [`product-image.ts`](../src/lib/product-image.ts) injeta
  `f_auto,q_auto` (Cloudinary serve webp/avif). Host novo precisa entrar em
  `remotePatterns`.

---

## 8. Variáveis de ambiente

Ver `.env.example`. Novas para autenticação:

| Variável | Uso |
| --- | --- |
| `AUTH_SECRET` | Assina o JWT de sessão. Gere com `npx auth secret`. |
| `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` | OAuth Google. Vazio = Google desativado. |

---

## 9. Testes e verificação

- **Vitest:** stores (carrinho/wishlist/seleção), componentes (cart-sheet,
  checkout-client, wishlist-button, product-card), filtros e auth.
  Mocks globais em [`src/test/setup.ts`](../src/test/setup.ts): `next-auth/react`,
  `cart-actions`, `wishlist-actions` (além de prisma/gsap/lenis).
- **Verificações de runtime no banco** feitas durante o desenvolvimento:
  isolamento por usuário (um usuário não vê dados do outro), cascade no delete,
  login de credenciais (hash/compare/unicidade), filtro combinado e fix de SSL.

---

## 10. Pontos de atenção

- Após mudanças de schema/deps, **reiniciar o `next dev`** (client Prisma e
  módulos são recarregados só no restart).
- Os dados antigos em `localStorage` (`belessence-cart`/`belessence-wishlist`)
  **não são mais lidos** — ficam inertes; podem ser limpos no navegador.
- Mudança de schema no banco de dev: usar `prisma db push` (aditivo, seguro).
  Evitar `migrate dev` sem baseline (risco de reset).
