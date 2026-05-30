---
template: "Project INIT"
version: 1.0
status: "Ativo"
tags:
  - init
  - boot
  - per-projeto
  - belessence
projeto: "Belessence"
cliente: "Belessence (Mari Beauty)"
nicho: "Ecommerce"
stack_principal: "Next.js 16 Standalone Fullstack + Prisma 7 + Tailwind 4"
data_inicio: "2026-04-05"
package_manager: "pnpm"
---

# 🚀 INIT — Belessence (Mari Beauty)

> **Nota de Uso:** Gerado a partir de `[[Project INIT Template]]` em 2026-05-30 via `[[Protocol-Bootstrap]]`.
>
> ⚠️ **Função:** boot per-projeto. Carregado quando o agente entra neste diretório de código. Complementa (não substitui) `[[Session Protocol]]` do vault.

---

## Boot Sequence (per-projeto)

```yaml
init_sequence:
  - passo: 1
    ação: "Ler este INIT.md"
    propósito: "Contexto do projeto + atalhos para o vault"

  - passo: 2
    ação: "Ler CLAUDE.md local"
    arquivo: "./CLAUDE.md"
    propósito: "Diretrizes do diretório de código"

  - passo: 3
    ação: "Ler escopo no vault"
    arquivo: "Dev/2 - Projects/Ecommerce/Belessence/01-Escopo.md"
    propósito: "User Stories + critérios BDD + classificação Refatoração Full-stack"

  - passo: 4
    ação: "Ler dev-log no vault"
    arquivo: "Dev/2 - Projects/Ecommerce/Belessence/05-Dev-Log.md"
    propósito: "Estado atual + decisões recentes (2 meses de retroativo + rodada atual)"

  - passo: 5
    ação: "Ler 04-Tarefas para saber o que está pendente"
    arquivo: "Dev/2 - Projects/Ecommerce/Belessence/04-Tarefas.md"
    propósito: "Backlog granular Rodadas 1-4"

  - passo: 6
    ação: "Resumir + aguardar instrução"
    formato: "3 bullets: contexto, estado atual, próxima tarefa pending"
```

> O canon de boot completo do vault está em `[[Session Protocol]]`. Este INIT é o boot **per-projeto** (complementar, não substituto). A matriz canon de Gatilho → Template está em `[[Master Pipeline & Enforcement]]`.

---

## Atalhos para o Vault

| Preciso de... | Arquivo no vault |
|---|---|
| Escopo + User Stories | `Dev/2 - Projects/Ecommerce/Belessence/01-Escopo.md` |
| Contrato (Refatoração Full-stack) | `Dev/2 - Projects/Ecommerce/Belessence/02-Contrato.md` |
| Planejamento (EAP) | `Dev/2 - Projects/Ecommerce/Belessence/03-Planejamento.md` |
| Backlog granular | `Dev/2 - Projects/Ecommerce/Belessence/04-Tarefas.md` |
| Diário de decisões | `Dev/2 - Projects/Ecommerce/Belessence/05-Dev-Log.md` |
| Erros do projeto | `Dev/2 - Projects/Ecommerce/Belessence/06-Erros.md` |
| Stack aprovada + Filosofia + R8 | `Dev/0 - Planner Project/Preferencias Dev.md` |
| Memória global de erros | `Dev/4 - Error's Memory/INDEX.md` |
| Regras constitucionais R1-R8 | `Dev/CLAUDE.md` |
| Matriz Gatilho → Template | `Dev/0 - Planner Project/Master Pipeline & Enforcement.md` |

---

## Contexto rápido do projeto

- **Stack:** Next.js 16 Standalone Fullstack (Route Handlers + Prisma 7 + Auth.js v5 + Mercado Pago + Cloudinary + Resend)
- **Classificação:** Refatoração Full-stack (era "Refatoração de Frontend" até 2026-05-30)
- **Fase atual:** Rodada 1 (Vault Refresh) executando agora; Rodadas 2-4 pendentes
- **Decisão arquitetural:** Hexagonal aplicado em `src/lib/` na Rodada 4 (5/6 sinais da matriz favoráveis)
- **Brand pública:** Mari Beauty (package name será `mari-beauty` após T-2.1.6)

---

## Comandos rápidos

```bash
# Instalar dependências (apenas pnpm — npm/yarn/bun BANIDOS)
pnpm install

# Dev server
pnpm dev

# Testes
pnpm test            # Vitest watch
pnpm test:ui         # Vitest UI
pnpm test:run        # Vitest single-run
pnpm test:e2e        # Playwright
pnpm test:coverage   # cobertura

# Build
pnpm build           # prisma generate && next build

# Prisma
pnpm prisma migrate dev
pnpm prisma db seed
pnpm prisma studio
```

---

## Regras críticas (consulte antes de mexer)

- **R1-R8** em `Dev/CLAUDE.md` (constitucionais). Em especial:
  - **R7:** antes de sugerir qualquer lib/padrão/comando, validar contra `Preferencias Dev`. Stack Estendida — Ecommerce já cobre Auth.js / Mercado Pago / Cloudinary / Resend / recharts.
  - **R8:** toda pasta DEVE ter CLAUDE.md. Antes de criar pasta nova durante refactor, primeiro arquivo é o CLAUDE.md.
- **Server-first:** componentes são Server Components por padrão; só usar `"use client"` quando necessário.
- **Re-validar no servidor:** preço, estoque, cupom — nunca confiar no client.
- **Stores Zustand:** são cache do servidor (sem `persist` em localStorage). Cart/wishlist no banco, hidratam no login, resetam no logout.
- **Auth.js v5:** session.strategy = "jwt" obrigatório com Credentials.
- **Prisma 7 + Postgres:** usar `@prisma/adapter-pg` com Pool (SSL config explícita).
- **Path alias atual:** `@/*` → `src/*`. `@/api/*` é o shadcn-utils legado — será renomeado pra `@/shadcn-utils/*` na Rodada 3.
- **Não tocar em:** `src/generated/` (Prisma client gerado), `prisma/schema.prisma` (fora do escopo desta refatoração).

---

## Plan de execução

Plan completo da refatoração em `C:\Users\ADM\.claude\plans\f-1-zeca-1-repositorio-documentos-meusp-foamy-barto.md`.

Estado atual: **Rodada 1 — Vault Refresh** (em execução).
Próxima: **Rodada 2 — Limpeza + CLAUDE.md universal**.

---

## Quality Gate

- [x] Artefato foi gerado a partir de `[[Project INIT Template]]` como base
- [x] Todas as variáveis `{{}}` substituídas
- [x] Paths para o vault apontam corretamente para `Dev/2 - Projects/Ecommerce/Belessence/`
- [x] `package_manager` substituído por `pnpm`

---

## Referências

- `[[Session Protocol]]` — boot canônico do vault
- `[[Master Pipeline & Enforcement]]` — matriz canon
- `[[Project Lifecycle Pipeline]]` — fluxo de fases
- `[[Preferencias Dev]]` — stack + Filosofia + Estrutura
- `[[Protocol-Bootstrap]]` — protocolo que gerou este arquivo
- `[[Project INIT Template]]` — template canon
