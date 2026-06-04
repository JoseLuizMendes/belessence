---
template: "Design / Spec"
status: "Em execução — Fases 0 e 1 concluídas (2026-06-04)"
data: 2026-06-03
autor: "José Luiz Mendes + Claude"
escopo: "Ambiente de desenvolvimento e pipeline de entrega — Belessence (Mari Beauty)"
repo: "JoseLuizMendes/belessence (raiz git = frontend/belessence)"
---

# Ambiente de Dev/Prod e Pipeline de Entrega — Design

> Documento de arquitetura do **fluxo de desenvolvimento e entrega** do
> Belessence. Objetivo: rodar o projeto com a **disciplina de uma empresa de
> verdade**, mas **custo zero** enquanto não há receita — com **gatilhos de ROI
> documentados** para cada upgrade pago futuro.

## Sumário

1. [Contexto e objetivo](#1-contexto-e-objetivo)
2. [Diagnóstico do estado atual](#2-diagnóstico-do-estado-atual)
3. [Princípios norteadores](#3-princípios-norteadores)
4. [Registro de decisões](#4-registro-de-decisões)
5. [Arquitetura alvo](#5-arquitetura-alvo)
   - 5.1 [Modelo de ambientes](#51-modelo-de-ambientes)
   - 5.2 [Estratégia de banco de dados](#52-estratégia-de-banco-de-dados)
   - 5.3 [Migrations — a fundação](#53-migrations--a-fundação)
   - 5.4 [Segredos e variáveis por ambiente](#54-segredos-e-variáveis-por-ambiente)
   - 5.5 [CI/CD](#55-cicd)
   - 5.6 [Testes e banco de teste](#56-testes-e-banco-de-teste)
   - 5.7 [Branching, fluxo e proteções](#57-branching-fluxo-e-proteções)
   - 5.8 [Developer Experience (DX)](#58-developer-experience-dx)
   - 5.9 [Observabilidade e operação](#59-observabilidade-e-operação)
6. [Custos e gatilhos de ROI](#6-custos-e-gatilhos-de-roi)
7. [Roadmap faseado](#7-roadmap-faseado)
8. [Itens deferidos / fora de escopo](#8-itens-deferidos--fora-de-escopo)
9. [Riscos e mitigações](#9-riscos-e-mitigações)
10. [Glossário](#10-glossário)
11. [Referências](#11-referências)

---

## 1. Contexto e objetivo

O Belessence é um e-commerce Next.js 16 fullstack, **já em produção** (Vercel +
Neon), mas **sem uso real** — prod existe hoje para flagrar problemas reais de
produção, não para atender clientes. O desenvolvimento é **solo**.

O objetivo deste documento é desenhar um **ambiente de desenvolvimento e um
pipeline de entrega maduros**, cobrindo: ambientes (dev/prod), infra no GitHub,
infra de testes (banco de teste isolado do de prod), gestão de segredos, e a
experiência de desenvolvimento no dia a dia — **sem nenhum gasto imediato**,
deixando explícito **até onde cada upgrade pago vale a pena**.

**Não-objetivos:** mudar a stack do produto, refatorar domínio, ou introduzir
ferramentas pagas agora.

## 2. Diagnóstico do estado atual

Levantamento feito em 2026-06-03 sobre o repositório.

**O que já está bom**

- **Banco Neon** (Postgres gerenciado) com `sslmode=require` + pooling. O plano
  grátis do Neon inclui **branching de banco** — base ideal para bancos
  não-prod sem custo.
- **Deploy via Vercel** com git-integration → **Preview Deployments por PR**
  saem de graça.
- **Testes sérios**: Vitest com thresholds de cobertura (`statements 75 /
  branches 80 / functions 79 / lines 75`) e Playwright e2e.
- **Cultura de documentação madura**: vault, `INIT.md`, `CLAUDE.md` por pasta,
  specs/plans versionados em `docs/superpowers/`.
- Arquitetura hexagonal aplicada em `src/lib/` (bounded contexts: orders, auth,
  wishlist).

**Problemas que este design corrige**

| # | Problema | Evidência | Impacto |
|---|---|---|---|
| P1 | `main` e `master` divergiram | `main` parou em 31/05 (9 commits, último é chore de `.gitignore`); `master` está 123 commits à frente e é a linha ativa | Confusão de qual é prod; CI no branch errado |
| P2 | CI dispara `push` só em `main` | `.github/workflows/test.yml` | A CI **não roda** no branch onde se trabalha (`master`) |
| P3 | Sem histórico de migrations | `prisma/migrations` vazio; existe patch manual `prisma/sql/add_product_status.sql`; uso de `db push` | **Maior risco**: mudança de schema em prod sem histórico/rollback/reprodutibilidade |
| P4 | CI e2e provavelmente quebrada | job roda `prisma migrate deploy` sem migrations existirem → schema do banco de teste nunca é criado | e2e vermelho/sem valor |
| P5 | Path de artefato errado no CI | upload aponta `frontend/belessence/playwright-report` mas a raiz do repo **é** `frontend/belessence` | Relatório Playwright não sobe |
| P6 | `.env.example` não existe | apesar dos `CLAUDE.md` afirmarem ser a "lista canônica"; e `.gitignore` tem `.env*` (ignoraria o próprio exemplo) | Onboarding/contrato de config quebrado |
| P7 | Sem `typecheck` no CI | workflow só roda `lint` + testes | Erros de tipo passam pro merge |
| P8 | Chaves de Mercado Pago e Resend ausentes do `.env` atual | extração de chaves do `.env` | Pagamento/e-mail possivelmente desconfigurados neste ambiente |

## 3. Princípios norteadores

1. **Disciplina de empresa, custo de hobby.** Tudo free-tier primeiro; rigor no
   processo, não no gasto.
2. **Cada upgrade pago tem gatilho de ROI.** Nunca pagar por antecipação —
   pagar quando uma métrica objetiva disser que o free-tier ficou pequeno
   (ver §6).
3. **Paridade entre ambientes.** dev e prod rodam o **mesmo** Postgres 16, o
   **mesmo** schema (via migrations), as **mesmas** variáveis (com valores
   distintos).
4. **Reprodutibilidade.** O schema de qualquer ambiente é materializável do zero
   com `prisma migrate deploy`. Nada de mudança manual não rastreada.
5. **Segredos com menor privilégio.** Credenciais de teste/sandbox em não-prod;
   credenciais live só em prod. Preview **nunca** toca o banco de prod.
6. **CI como porteiro.** Nada entra na `main` sem CI verde.

## 4. Registro de decisões

Decisões tomadas em conjunto antes deste documento (registradas para histórico):

| ID | Decisão | Alternativas descartadas | Por quê |
|---|---|---|---|
| D1 | **GitHub Flow + Previews** | GitFlow (branch-por-ambiente); trunk+tags | Menos overhead p/ dev solo; padrão de quem usa Vercel; os mesmos ambientes lógicos com menos merges |
| D2 | **Manter `master` como trunk único** (rename → `main` adiado) | renomear já para `main`; manter `main` + `master` | Split-brain já resolvido (branches lixo deletadas em 2026-06-03); rename é só convenção, sem ganho funcional — fica opcional/futuro |
| D3 | **Banco de dev = Postgres em Docker local** | branch Neon de dev; híbrido | Custo zero, offline, isolado, descartável |
| D4 | **2 ambientes: dev + prod** (não 3) | dev/hom/prod | Dev solo sem usuários — `hom` fixo seria cerimônia sem ROI |
| D5 | **Preview do PR = 1 branch Neon não-prod (opção B)** | desligar previews (opção A); per-PR efêmero | URL clicável pré-merge quase de graça, e **nunca** encosta no banco de prod |
| D6 | **Hooks = husky + lint-staged** | lefthook | Familiaridade/ecossistema; padrão de mercado com exemplos abundantes |
| D7 | **Adotar Prisma Migrations** (sair de `db push`) | manter `db push` | Reprodutibilidade e segurança de schema em prod |
| D8 | **Sentry = opt-in, fase tardia** | ligar agora | Sem tráfego real ⇒ sem erro a capturar; liga quando houver uso |
| D9 | **MailHog/Mailpit = opcional, fora do escopo padrão** | incluir já | React Email já tem preview; Resend tem modo teste |

## 5. Arquitetura alvo

### 5.1 Modelo de ambientes

Dois ambientes reais (**dev**, **prod**) e um **Preview seguro** automático por
PR. No dia a dia você só pensa em dev e prod.

| Ambiente | Onde roda | Banco | Gatilho de deploy | Credenciais externas |
|---|---|---|---|---|
| **dev** | Sua máquina (`pnpm dev`) | Postgres em **Docker** local | manual | sandbox/test (MP, Resend, Cloudinary) |
| **preview** (por PR) | **Vercel Preview** | **branch Neon `preview`** (não-prod, compartilhado) | abrir/atualizar PR | sandbox/test |
| **prod** | **Vercel Production** | **Neon** (branch primário) | merge na `main` | live |

```
   feature/*  ──PR──▶  Vercel Preview  ──(testa, revisa, CI verde)──▶  merge
   (local: dev)        (banco: Neon `preview`)                          │
        │                                                               ▼
   Docker Postgres                                            Vercel Production
   (banco: belessence_dev)                                    (banco: Neon prod)
```

**Decisão-chave embutida (D5):** a Vercel cria um Preview por PR
automaticamente. Para que esse Preview **não herde o banco de prod**, o escopo
*Preview* da Vercel recebe um `DATABASE_URL` apontando para um branch Neon
dedicado (`preview`). Isso transforma o Preview num "hom efêmero" seguro sem
manter um ambiente extra.

### 5.2 Estratégia de banco de dados

| Uso | Host | Origem do schema |
|---|---|---|
| **prod** | Neon (branch primário) | `prisma migrate deploy` no deploy |
| **preview** | Neon (branch `preview`) | criado a partir do schema de prod + seed |
| **dev** | Docker `belessence_dev` (porta 5432) | `prisma migrate dev` |
| **teste (local)** | Docker `belessence_test` (porta 5433) | `prisma migrate deploy` + seed |
| **teste (CI)** | Postgres efêmero (service container) | `prisma migrate deploy` + seed |

- **Neon como provedor canônico** de prod e preview — já em uso, branching
  grátis. Não trocar de provedor.
- **Branch `preview`**: criado uma vez no painel Neon, recebe `migrate deploy` +
  seed. Compartilhado por todos os previews (suficiente p/ dev solo). Evolução
  futura: branch efêmero **por PR** via Neon GitHub Action (ver §8).
- **Docker local** dá dev e teste sem custo e offline. Dois bancos (dev e teste)
  para nunca misturar dados de trabalho com dados de teste.
- **Paridade de versão**: Postgres **16** em todos (igual ao CI atual).

**Teto grátis Neon:** ≈0,5 GB de storage, autosuspend, branching incluído
*(confirmar números atuais no painel — mudam com frequência)*.
**Gatilho p/ pagar:** ver §6.

### 5.3 Migrations — a fundação

É o passo que **destrava os ambientes**: sem schema reprodutível não há paridade
dev/prod confiável. Saída de `db push` → Prisma Migrations, **baselineando** o
banco de prod existente (sem perda de dados).

Processo de adoção (baselining, conforme docs Prisma):

1. **Reconciliar** `prisma/schema.prisma` com o estado real de prod — garantir
   que ele reflete tudo que já foi aplicado, **incluindo** o que o
   `prisma/sql/add_product_status.sql` aplicou manualmente.
2. Gerar a migration inicial a partir do schema atual:
   ```bash
   mkdir -p prisma/migrations/0_init
   pnpm prisma migrate diff \
     --from-empty \
     --to-schema-datamodel prisma/schema.prisma \
     --script > prisma/migrations/0_init/migration.sql
   ```
3. **Marcar como já aplicada em prod** (não re-executar no banco existente):
   ```bash
   pnpm prisma migrate resolve --applied 0_init   # contra o banco de prod
   ```
4. A partir daqui: schema novo ⇒ `prisma migrate dev` (gera migration) em dev;
   `prisma migrate deploy` em preview/prod/CI.
5. **Arquivar** `prisma/sql/add_product_status.sql` (seu efeito já está no
   baseline) — manter só como histórico, fora do caminho de execução.

> Observação: `prisma.config.ts` já aponta `migrations.path = "prisma/migrations"`
> e `seed = "tsx prisma/seed.ts"` — ou seja, a infra de config já está pronta;
> falta apenas criar o histórico.

### 5.4 Segredos e variáveis por ambiente

**Criar `.env.example`** (lista canônica que os `CLAUDE.md` já prometem) com
todas as chaves e valores-placeholder, **sem segredos reais**. Corrigir o
`.gitignore` para versioná-lo:

```gitignore
# env files
.env*
!.env.example
```

**Mapa de variáveis** (3 lugares: `.env` local · Vercel · GitHub Actions):

| Variável | dev (.env local) | Vercel Preview | Vercel Production | CI (Secrets) |
|---|---|---|---|---|
| `DATABASE_URL` | Docker local | branch Neon `preview` | Neon prod | Postgres efêmero |
| `AUTH_SECRET` / `AUTH_TRUST_HOST` | dev | preview | live | dummy |
| `ADMIN_SECRET` / `ADMIN_PASSWORD_HASH` / `ADMIN_TOTP_SECRET` / `ADMIN_ALLOWLIST_EMAILS` | dev | preview | live | dummy de teste |
| `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` | dev OAuth app | dev OAuth app | OAuth app prod | — |
| `CLOUDINARY_*` / `NEXT_PUBLIC_CLOUDINARY_*` | conta/folder de teste | teste | live | — |
| **Mercado Pago** (`MP_*`) | **sandbox** | **sandbox** | **live** | — |
| **Resend** (`RESEND_*`) | test key / sem envio | test key | live | — |

- **Escopos da Vercel**: usar *Production* e *Preview* separadamente. O escopo
  *Preview* recebe o `DATABASE_URL` do branch `preview` (D5).
- **P8**: incluir explicitamente as chaves de **Mercado Pago** e **Resend** no
  `.env.example` e configurá-las (sandbox em não-prod, live em prod).
- Documentar por variável: onde vive, escopo e sensibilidade (tabela acima vira
  seção do `.env.example` em comentários).

### 5.5 CI/CD

**GitHub Actions** (corrige P2, P4, P5, P7):

- **Triggers**: `pull_request` + `push` em `main` (após D2).
- **Jobs**:
  - `quality`: install (`--frozen-lockfile`) → `prisma generate` → `lint` →
    **`tsc --noEmit`** (novo) → `test:coverage`.
  - `e2e`: Postgres 16 service → `prisma migrate deploy` (agora **funciona**,
    pós-§5.3) → `db seed` → `playwright install` → `test:e2e` → upload de
    artefato com path **corrigido** (`playwright-report`).
- **Caching** pnpm + **`concurrency`** (cancela runs antigos do mesmo PR).
- **Node 20** + pnpm via `pnpm/action-setup` (alinhado ao `.nvmrc`/corepack).

**Vercel**:

- Production deploya **só** pela `main`. Previews por PR (com banco `preview`).
- (Opcional) Exigir CI verde como condição de merge via branch protection
  (§5.7) — assim prod só recebe código que passou na CI.

### 5.6 Testes e banco de teste

- **Unit/integração** (Vitest): local + CI; manter o "catraca" de cobertura
  subindo conforme novos testes (thresholds atuais como piso).
- **e2e** (Playwright): contra Postgres efêmero (CI) e Docker de teste local
  (porta 5433). `migrate deploy + seed` agora funcional ⇒ e2e deixa de ser
  vermelho.
- **Isolamento**: já há `fullyParallel`; manter seed **determinística** para
  resultados estáveis.
- **Banco de teste nunca é o de prod** (atende ao pedido central): em dev é o
  `belessence_test` no Docker; em CI é o container efêmero.

### 5.7 Branching, fluxo e proteções

**Estado (executado em 2026-06-03):** o split-brain foi resolvido — a `main`
lixo e todos os branches obsoletos foram **removidos**; sobra **`master` como
trunk único**. O rename `master → main` (convenção de mercado) é **opcional e
adiado** — sem ganho funcional (ver D2). Se/quando for feito: push de `main` a
partir de `master` → trocar default no GitHub → repontar Production Branch na
Vercel → confirmar deploy de prod → deletar `master`.

**Fluxo (GitHub Flow, D1):**

```
feature/<slug>  →  Pull Request  →  Preview + CI  →  squash merge  →  master  →  prod
```

**Proteções na trunk `master`** (grátis em repo privado no GitHub):

- Exigir status checks (CI) verdes antes do merge.
- Proibir push direto (forçar PR).
- **PR template** + **Conventional Commits** (`feat:`, `fix:`, `chore:`…).

### 5.8 Developer Experience (DX)

- **`docker-compose.yml`** com dois Postgres 16 (dev:5432, teste:5433) e volume
  persistente para o de dev:
  ```yaml
  services:
    db:
      image: postgres:16
      environment:
        POSTGRES_USER: belessence
        POSTGRES_PASSWORD: belessence
        POSTGRES_DB: belessence_dev
      ports: ["5432:5432"]
      volumes: ["pgdata:/var/lib/postgresql/data"]
    db_test:
      image: postgres:16
      environment:
        POSTGRES_USER: belessence
        POSTGRES_PASSWORD: belessence
        POSTGRES_DB: belessence_test
      ports: ["5433:5432"]
  volumes: { pgdata: {} }
  ```
- **Scripts pnpm** (novos): `db:up`/`db:down` (compose), `db:reset`,
  `db:seed`, `migrate` (`migrate dev`), `migrate:deploy`, `typecheck`
  (`tsc --noEmit`).
- **Hooks (husky + lint-staged, D6)**:
  - `pnpm add -D husky lint-staged` + `pnpm exec husky init`.
  - `.husky/pre-commit` → `pnpm lint-staged` (eslint --fix + format **só no que
    mudou**).
  - `tsc --noEmit` é projeto-inteiro: roda no **pre-push** e no CI (não no
    pre-commit, para não travar cada commit).
- **Pin de runtime**: `.nvmrc` (Node 20) + campo `packageManager` no
  `package.json` (pnpm via corepack) — bate com a CI.
- **`CONTRIBUTING.md`** curto: subir Docker, copiar `.env.example` → `.env`,
  `migrate dev`, `db seed`, `pnpm dev`.

### 5.9 Observabilidade e operação

Tudo free-first, ligado sob demanda:

- **Logs/Analytics** nativos da Vercel (grátis).
- **`/api/health`**: endpoint que responde 200 e faz um ping leve no banco —
  base para uptime e smoke pós-deploy.
- **Uptime**: UptimeRobot/cron grátis batendo no `/api/health`.
- **Erros (Sentry, D8)**: documentado e **desligado**; liga quando houver
  tráfego real (ver gatilho em §6).

## 6. Custos e gatilhos de ROI

> Princípio: pagar só quando uma **métrica objetiva** disser que o free-tier
> ficou pequeno. Valores de plano são aproximados e **mudam** — confirmar no
> provedor antes de decidir.

| Ferramenta | Free hoje | **Gatilho p/ pagar** (métrica) | Próximo nível | O que o upgrade compra |
|---|---|---|---|---|
| **Vercel** | Hobby (**uso não-comercial**) | **Surgir cliente pagante** (ToS exige Pro) **ou** banda >100 GB/mês **ou** precisar de proteção de senha no preview | Pro ~US$20/mês | Uso comercial legalizado, 1 TB banda, analytics, proteção de preview, mais concorrência de build |
| **Neon** | ≈0,5 GB storage, autosuspend, branching | storage >~0,4 GB **ou** precisar do branch `preview` **sempre ligado** (sem autosuspend) **ou** estourar compute-hours | Launch ~US$19/mês | Mais storage/compute, sem autosuspend, mais branches |
| **Sentry** | ≈5k erros/mês, 1 usuário | tráfego real gerando >5k eventos/mês **ou** precisar de retenção maior | Team ~US$26/mês | Mais eventos, retenção, membros |
| **GitHub Actions** | 2.000 min/mês (repo privado) | CI estourar os minutos **ou** precisar de runner maior | Team ~US$4/usuário/mês | Mais minutos, ambientes protegidos |
| **Domínio** | — | quiser marca própria/credibilidade | ~R$40–60/ano | `.com.br`/`.com` — **único custo que eu consideraria já**, se quiser identidade |

**Leitura prática:** com prod sem uso, **nada** dispara hoje. O primeiro gasto
defensável é um **domínio** (se quiser marca). O segundo, **quando entrar
cliente pagante**, é **Vercel Pro** — não por limite técnico, mas por
conformidade de ToS (Hobby é não-comercial).

## 7. Roadmap faseado

Ordem honrando D4/D7: **ambientes primeiro**, com migrations como primeiro passo
interno (é o que torna os ambientes reprodutíveis). Todas as fases são **grátis**.

### Fase 0 — Higiene ✅ (concluída em 2026-06-03)
- [x] Trunk única: `master` mantida; `main` lixo + branches obsoletos removidos
      (rename → `main` adiado, opcional — ver D2).
- [x] `.env.example` fiel ao código (inclui `MP_ACCESS_TOKEN`) + `.gitignore`
      corrigido (`!.env.example`).
- [x] `docker-compose.yml` (Postgres 16: dev 5432 + teste 5433).
- [x] `.gitattributes` (normalização LF) — higiene extra adicionada.

### Fase 1 — Ambientes (núcleo) ✅ (concluída em 2026-06-04)
- [x] **Baseline de migrations** — `0_init` aplicado em dev; **prod baselineada**
      com `migrate resolve --applied 0_init` (diff vazio confirmou paridade).
- [x] Arquivar `prisma/sql/add_product_status.sql` — removido no PR #10 (o efeito
      já está no baseline `0_init`).
- [x] Branch Neon `preview` criado + escopo *Preview* da Vercel apontando p/ ele
      (validado por PR real: o Preview deployment subiu usando o banco `preview`).
- [x] Escopos de variáveis na Vercel: Production = banco prod · Preview = `preview`.
- [x] **CI corrigida e verde**: trigger `master`, e2e com migrations, path de
      artefato, concurrency, cache pnpm. Extras: stub `client-only`, ratchet de
      cobertura (75→73), actions em Node 24, e2e estável (abort de imagens via
      `resourceType` — matou o flake do `/_next/image` na página de produto).
- [x] `tsc --noEmit` no CI + script `typecheck` (PR #10); os 5 erros de tipo em
      mocks `auth`/`CartItem` foram corrigidos.

### Fase 2 — DX
- [ ] Scripts pnpm (`db:*`, `migrate*`, `typecheck`).
- [ ] husky + lint-staged (pre-commit) + typecheck no pre-push.
- [ ] `.nvmrc` + `packageManager`/corepack.
- [ ] Branch protection na `main` + PR template + Conventional Commits.
- [ ] `CONTRIBUTING.md`.

### Fase 3 — Qualidade / Observabilidade
- [ ] `/api/health` + uptime grátis.
- [ ] Aprofundar e2e; subir thresholds de cobertura.
- [ ] Documentar (desligado) o opt-in de Sentry.

### Fase 4 — Upgrades pagos (sob gatilho)
- [ ] Só quando uma métrica de §6 disparar. Nada proativo.

## 8. Itens deferidos / fora de escopo

- **`staging`/hom fixo com URL estável**: hoje o Preview por PR cobre a
  necessidade. Se um dia quiser uma URL fixa de demonstração, dá para criar **um**
  branch longevo `staging` apontando para um branch Neon fixo — ainda grátis.
- **Branch Neon efêmero por PR** (em vez do `preview` compartilhado): mais
  isolamento, via Neon GitHub Action. Upgrade natural quando houver mais de um
  PR aberto simultâneo com frequência.
- **MailHog/Mailpit** (inbox de e-mail local no Docker): React Email já tem
  preview de template e o Resend tem modo teste. Adicionar só se o **fluxo de
  envio** virar dor de depuração.
- **Sentry ligado**: ver D8/§6.

## 9. Riscos e mitigações

| Risco | Mitigação |
|---|---|
| Baseline de migrations divergir do banco real de prod | Reconciliar schema antes; usar `migrate diff` p/ conferir drift; `migrate resolve` em vez de re-executar |
| (Adiado) Rename `master → main` quebrar Vercel/prod | Rename é opcional e adiado; se feito, reapontar a Production Branch na Vercel **antes** de deletar `master` e confirmar 1 deploy de prod a partir de `main` |
| Preview herdar banco de prod por engano | Escopo *Preview* da Vercel com `DATABASE_URL` do branch `preview` **antes** de habilitar; checagem no `.env.example`/docs |
| Free-tier Neon estourar sem aviso | Acompanhar storage/compute no painel; gatilho de §6 antes de virar problema |
| Hooks atrasarem commits | pre-commit só `lint-staged` (arquivos staged); typecheck pesado fica no pre-push/CI |

## 10. Glossário

- **Neon branching**: cópia instantânea (copy-on-write) do banco — permite ter
  bancos não-prod (preview/dev) derivados do schema de prod sem custo de storage
  cheio.
- **Vercel Preview Deployment**: deploy automático e isolado gerado a cada PR,
  com URL própria — funciona como "hom efêmero".
- **Sentry**: monitoramento de erros de produção — captura exceções com stack
  trace e contexto e te avisa, em vez de você descobrir por reclamação/log.
- **MailHog/Mailpit**: servidor de e-mail **falso** local — captura os e-mails
  que o app "enviaria" e mostra numa caixa de entrada local, sem entregar nada
  real.
- **Baselining (Prisma)**: adotar migrations num banco que já existe, marcando o
  estado atual como migration inicial "já aplicada" para não re-executá-la.
- **lint-staged**: roda linters/formatadores **só nos arquivos staged** do
  commit, deixando o hook rápido.

## 11. Referências

- `.github/workflows/test.yml` — CI atual (a ser corrigida).
- `prisma.config.ts`, `prisma/schema.prisma`, `prisma/sql/` — config e schema.
- `vitest.config.ts`, `playwright.config.ts` — configs de teste.
- `CLAUDE.md` (raiz e `frontend/belessence/`) — diretrizes do projeto.
- Docs Prisma: *Baselining a database* (adoção de migrations em DB existente).
- Docs Neon: *Branching*; Docs Vercel: *Environment Variables* (escopos).
