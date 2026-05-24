# CLAUDE.md — `src/lib/`

> Coração lógico do app: acesso a dados, regras de negócio, stores,
> tokens de design, integrações. **Trate como "domain layer".**

---

## 1. Mapa atual

| Arquivo | Responsabilidade | Server/Client |
| --- | --- | --- |
| `prisma.ts` | Singleton do Prisma Client (config SSL explícita no Pool) | **Server-only** |
| `products-db.ts` | Queries de produto (inclui filtro de `gender`) | Server-only |
| `coupons.ts` | Regras e validação de cupom | Server-only |
| `shipping.ts` | Cálculo de frete por UF | Server-only |
| `payment-provider.ts` | Wrapper Mercado Pago | Server-only |
| `auth.ts` | Config do Auth.js v5 (NextAuth) — providers, callbacks | **Server-only** |
| `auth-actions.ts` | Server Action `registerUser` (cadastro credenciais) | **Server-only** (`"use server"`) |
| `admin-auth.ts` | Cookie de sessão admin assinado (jose) — `verifyAdminSession` | **Server-only (Edge-safe — só jose)** |
| `admin-login.ts` | Login admin: bcrypt + TOTP + lockout | **Server-only (Node)** |
| `admin-google.ts` | OAuth Google do admin (arctic) + allowlist de email | **Server-only (Node)** |
| `wishlist-db.ts` | Queries da wishlist por usuário | **Server-only** |
| `wishlist-actions.ts` | Server Actions da wishlist (auth + db) | **Server-only** (`"use server"`) |
| `cart-db.ts` | Queries do carrinho por usuário (preço relido do banco) | **Server-only** |
| `cart-actions.ts` | Server Actions do carrinho (auth + db) | **Server-only** (`"use server"`) |
| `product-status.ts` | Lógica de status (NOVO, PROMOÇÃO, ESGOTADO) | Compartilhado |
| `product-image.ts` | Helpers de imagem/Cloudinary | Compartilhado |
| `validations.ts` | Schemas Zod (form + handler; inclui login/cadastro) | Compartilhado |
| `design-tokens.ts` | Tokens OKLCH + tipografia + espaçamento | Compartilhado |
| `gsap-utils.ts` | Helpers de motion | **Client-only** |
| `cart-store.ts` | Zustand — **cache** do carrinho do servidor (sem persist) | **Client-only** |
| `wishlist-store.ts` | Zustand — **cache** dos favoritos do servidor (sem persist) | **Client-only** |
| `auth-gate-store.ts` | Zustand — modal de login que bloqueia ações | **Client-only** |
| `hooks/` | React hooks (inclui `use-require-auth`) | **Client-only** (ver [hooks/CLAUDE.md](hooks/CLAUDE.md)) |

> **Carrinho e favoritos são privados por usuário, no banco.** As stores
> Zustand (`cart-store`/`wishlist-store`) **não** usam mais `localStorage`:
> são cache hidratado do servidor no login e zerado no logout (ver
> `components/auth/auth-data-sync.tsx`). Mutações são otimistas e
> sincronizam via Server Actions com rollback. **Nunca** voltar a persistir
> esses dados em `localStorage` global — vaza dados entre usuários.

## 2. Regras gerais

1. **Server-only é estrito**: arquivos que tocam Prisma, Mercado Pago,
   Resend, ou `process.env.*` que não sejam `NEXT_PUBLIC_*` **nunca** podem
   ser importados em Client Components. Se houver risco, marque com
   `import "server-only"` no topo.
2. **Client-only**: Zustand stores e GSAP helpers devem usar
   `import "client-only"` (ou viver atrás de `"use client"` em quem
   importa).
3. **Sem React aqui** (exceto hooks/). `lib/` é lógica pura — fica
   testável e reutilizável.
4. **Funções puras > classes.** Não há motivo para classes nesta camada.
5. **Erros de domínio** devem ter mensagens em pt-BR estáveis (vão para
   toasts). Erros de programação podem ser em inglês.

## 3. Prisma singleton

[`prisma.ts`](prisma.ts) é o **único** lugar onde `PrismaClient` é
instanciado. Importar dele em todos os `*-db.ts` e Route Handlers:

```ts
import { prisma } from "@/lib/prisma";
```

**Não** criar `new PrismaClient()` em nenhum outro arquivo — em dev gera
múltiplas conexões e vaza pool.

## 4. Validações Zod

- Schemas em [`validations.ts`](validations.ts) são a fonte única de
  verdade para shape de input. Forms (RHF + `zodResolver`) e Route
  Handlers (`safeParse`) consomem o mesmo schema.
- Helpers (CPF, CEP) já existem — reutilize antes de criar novos.
- Mensagens de erro Zod em **pt-BR** (`.min(1, "Nome obrigatório")`).

## 5. Stores Zustand

- Stores são **client-only**. Padrão atual:
  ```ts
  import { create } from "zustand";
  import { persist } from "zustand/middleware";
  export const useCartStore = create(persist(...));
  ```
- Hidratação: cuidado com mismatch SSR ↔ client em stores persistidas.
  Usar `useHasMounted` (ver [hooks/CLAUDE.md](hooks/CLAUDE.md)).
- Selectors finos para evitar re-render geral: `useCartStore(s => s.count)`.

## 6. Pagamento e dinheiro

- Preços vêm como **`Decimal`** do Prisma. **Nunca usar `number` para
  cálculo monetário** — converter para string ou usar lib `decimal.js`.
- `payment-provider.ts` é a **única** porta para Mercado Pago. Trocar
  provedor = trocar essa implementação, contrato externo se mantém.
- Webhook de pagamento confirma Order **e** dá baixa em estoque, em
  transação atômica. Idempotente por `paymentId`.

## 7. Tokens de design

- [`design-tokens.ts`](design-tokens.ts) é a **fonte única**. Cores
  (OKLCH), tipografia, espaçamento. Nunca hardcodar paleta em componente.
- Se precisar de cor que não está nos tokens: **adicione ao tokens
  primeiro**, depois use.

## 8. Não faça

- Não importar de `@/components/*` ou `@/app/*` aqui (direção errada).
- Não escrever query SQL crua (`prisma.$queryRaw`) sem motivo claro —
  perde tipos e segurança.
- Não esconder erro de banco em `try/catch` vazio — propague ou logue.
- Não duplicar validação Zod em handler + form; importe do mesmo lugar.
