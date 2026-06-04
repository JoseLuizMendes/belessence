# Contribuindo — Belessence (Mari Beauty)

Guia rápido para rodar o projeto localmente e abrir mudanças com a disciplina do
pipeline. Arquitetura completa do fluxo em
[`docs/superpowers/specs/2026-06-03-ambiente-dev-prod-design.md`](docs/superpowers/specs/2026-06-03-ambiente-dev-prod-design.md).

## Pré-requisitos

- **Node 24** — há um `.nvmrc`, então `nvm use` resolve a versão certa.
- **pnpm 10** via corepack: rode `corepack enable` (a versão exata vem do campo
  `packageManager` do `package.json`). **Não** use `npm` nem `yarn` — isso quebra
  o `pnpm-lock.yaml`.
- **Docker** — para o Postgres local de dev e de teste.

## Setup local

```bash
corepack enable
pnpm install
cp .env.example .env        # preencha os valores (sandbox/test em dev)
pnpm db:up                  # sobe Postgres dev (5544) + teste (5433) no Docker
pnpm migrate                # aplica migrations no banco de dev (migrate dev)
pnpm db:seed                # popula dados de exemplo
pnpm dev                    # http://localhost:3000
```

Para inspecionar o banco de dev visualmente: **pgweb** em http://localhost:8081.

## Scripts úteis

| Script                              | O que faz                                                     |
| ----------------------------------- | ------------------------------------------------------------- |
| `pnpm dev`                          | Sobe o app em desenvolvimento                                 |
| `pnpm db:up` / `pnpm db:down`       | Sobe / para os Postgres do Docker                             |
| `pnpm db:reset`                     | Reseta o banco de dev (recria a partir das migrations + seed) |
| `pnpm db:seed`                      | Roda a seed                                                   |
| `pnpm migrate`                      | Cria/aplica migration em dev (`prisma migrate dev`)           |
| `pnpm migrate:deploy`               | Aplica migrations existentes (preview/prod/CI)                |
| `pnpm lint` / `pnpm typecheck`      | ESLint / `tsc --noEmit`                                       |
| `pnpm format` / `pnpm format:check` | Prettier (escreve / só confere)                               |
| `pnpm test` / `pnpm test:coverage`  | Vitest (watch / cobertura)                                    |
| `pnpm test:e2e`                     | Playwright e2e                                                |

## Fluxo de trabalho (GitHub Flow)

```
feature/<slug>  →  Pull Request  →  Preview + CI  →  squash merge  →  master  →  prod
```

1. Crie um branch a partir da `master`: `git switch -c feat/<slug>` (ou `fix/`,
   `chore/`, `docs/`…).
2. Faça commits no padrão **Conventional Commits** (abaixo).
3. Abra um PR — a Vercel cria um **Preview** (banco Neon `preview`, **nunca** o de
   prod) e o CI roda os jobs `unit` e `e2e`.
4. Com o **CI verde**, faça **squash merge** na `master`. A `master` é a trunk e
   está **protegida**: push direto é bloqueado; tudo entra via PR.

## Conventional Commits

Título de commit e de PR no formato `tipo(escopo): resumo`.

| Tipo       | Uso                                      |
| ---------- | ---------------------------------------- |
| `feat`     | Nova funcionalidade                      |
| `fix`      | Correção de bug                          |
| `chore`    | Manutenção/infra sem mudar comportamento |
| `docs`     | Só documentação                          |
| `test`     | Só testes                                |
| `refactor` | Refatoração sem mudar comportamento      |
| `ci`       | Pipeline/CI                              |
| `perf`     | Performance                              |
| `style`    | Formatação (sem mudar lógica)            |
| `build`    | Build / dependências                     |

Exemplos: `feat(checkout): adiciona cupom de primeira compra`,
`fix(cart): corrige total com frete grátis`.

## Git hooks (husky)

- **pre-commit** → `lint-staged`: roda `eslint --fix` + `prettier --write` **só
  nos arquivos staged** (mantém o commit rápido).
- **pre-push** → `pnpm typecheck` (projeto inteiro; pesado demais para cada
  commit, por isso fica no push).

Os hooks se instalam sozinhos no `pnpm install` (script `prepare`). Em emergência
dá para pular um hook com `--no-verify` — use com parcimônia.

## Migrations

Mexeu em `prisma/schema.prisma`? Gere uma migration com `pnpm migrate` (nunca
`db push`). O histórico em `prisma/migrations/` é a fonte de verdade do schema e é
reproduzível do zero com `pnpm migrate:deploy`.
