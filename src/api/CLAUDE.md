# CLAUDE.md — `src/api/`

> **⚠️ Nome confuso, leia com atenção.**
>
> Esta pasta **não** contém endpoints HTTP. Endpoints estão em
> [`src/app/api/`](../app/api/) (Route Handlers do App Router).
>
> Esta `src/api/` existe por causa do **alias do shadcn**: `components.json`
> mapeia `"utils": "@/api/utils"` e `"lib": "@/api"`. Ou seja, os helpers
> consumidos pelos primitivos shadcn vivem aqui.

---

## 1. Conteúdo atual

| Arquivo | Papel |
| --- | --- |
| `utils.ts` | `cn()` (twMerge + clsx) e `formatPrice()` (BRL) |
| `api.ts` | Wrapper de fetch (cliente HTTP simples) |
| `products.ts` | Cliente HTTP para `/api/products` |
| `search/` | (reservado para utilidades de busca) |

## 2. Regras

1. **Não duplicar lógica de `src/lib/`.** Se algo é regra de negócio, vai
   em `lib/`. Aqui só helpers de UI / fetch wrappers.
2. **`cn()`** é o único helper de classes — sempre importar daqui em
   componentes shadcn (`@/api/utils`).
3. **`formatPrice()`** é a forma canônica de exibir preço. Não inventar
   `formatBRL()` paralelo.
4. **Clientes HTTP daqui** consomem `/api/*` (Route Handlers) e só são
   usados em **Client Components**. RSC chama `src/lib/*-db` direto.
5. **Tipos compartilhados** com Route Handler: se ambos os lados
   precisam, defina em `src/lib/` e importe nos dois.

## 3. Renomeação?

A separação `src/api` ↔ `src/lib` é histórica (alias do shadcn). Se um dia
o time decidir consolidar, atualizar:
- `components.json` (aliases)
- Imports em `src/components/ui/*` (centenas)
- Esta pasta inteira

**Não fazer essa renomeação ad-hoc** — é mudança ampla, exige PR dedicado.

## 4. Não faça

- Não fazer fetch para domínios externos daqui — proxies vão em
  `src/app/api/*`.
- Não importar Prisma aqui (boundary client/server).
- Não logar erros silenciosamente em wrappers de fetch; propagar para
  quem chamou tratar.
