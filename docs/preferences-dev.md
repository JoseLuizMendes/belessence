# Preferências e decisões do José

> Registro vivo das preferências técnicas e estéticas do dono do projeto,
> capturadas conforme aparecem em tarefas. Ler antes de propor approach
> em qualquer mudança não-trivial.

---

## 1. Arquitetura e backend

### 1.1 Bounded contexts (hexagonal)
- Todo domínio novo segue o padrão `src/lib/<contexto>/{domain,application,infrastructure/persistence}/`.
- `domain/` puro (sem Prisma, sem React, sem I/O).
- `application/` é a camada de use cases. Pass-through quando trivial, mas centralizado para abrir espaço a regras futuras (máscara de dados sensíveis, filtros).
- `infrastructure/persistence/` é o **único** lugar que conhece o Prisma dentro do contexto.
- Não introduzir ports/adapters formais (`i-*-repository.ts`) sem múltiplos adapters reais. YAGNI rígido.

### 1.2 Use cases
- Idempotência explícita por identidade de evento (ex.: `paymentId` em `metadata` do `OrderEvent`).
- Quando uma regra de negócio dispara duas transições atômicas, manter ambas dentro da mesma `prisma.$transaction` no repositório. O use case fica fino.
- Retornar `{ status, alreadyProcessed }` ou similar para que o chamador possa diferenciar 200-novo de 200-idempotente.

### 1.3 Naming de repositório
- Métodos que retornam `Entity | null` → prefixo `find*` (não `has*`, que sugere boolean).
- Métodos booleanos → `is*` / `has*` retornando `boolean` explícito.
- Inputs de mutation com 4+ campos → extrair para `interface XInput` exportada (DX no consumer).

### 1.4 Tipos do Prisma com relations
- Anotar retorno do repositório com `Prisma.XGetPayload<{ include: typeof INCLUDE }>` + `satisfies Prisma.XInclude`.
- Constante `INCLUDE` no escopo do módulo evita inferência se perder ao cruzar wrappers (use case → page RSC).
- Blindagem contra IDE com TS server stale após `prisma generate`.

### 1.5 Schema Prisma e migrations
- **`prisma db push` para mudanças aditivas** (tabela nova, coluna com default). Documentado em `prisma/CLAUDE.md` §1.
- `prisma migrate dev` está banido nesse banco até existir baseline — destrói dados (Neon foi inicializado via `db push`).
- Event log (`OrderEvent`) é preferível a colunas timestamp denormalizadas (`paymentConfirmedAt`, `preparingAt`, ...) porque é extensível e idempotente sem migration.
- `metadata Json?` documenta o shape esperado num comentário curto na linha; tipo TS real vive em domain quando necessário.

### 1.6 Boundaries (`src/CLAUDE.md` §2)
- `app/` consome `components/` e `lib/`. Nunca o contrário.
- `lib/` não importa de `components/` ou `app/`.
- RSC chama `lib/<contexto>/application/*` direto. **Não** fetcha a própria API.
- Route Handlers consomem `lib/`, nunca `components/`.

---

## 2. Testes

### 2.1 Localização e padrão
- **Centralizado em `src/test/`**, naming `<arquivo>.test.ts(x)`.
- Vitest + jsdom para unit/component, Playwright para E2E.
- TDD rigoroso: RED → GREEN → commit por step.

### 2.2 Estratégia de duas camadas (regra do projeto)
- **Unit/integração com mock**: feedback rápido sobre orquestração (ordem de chamadas, payloads, status HTTP, branches).
- **E2E com Postgres real**: prova das regras críticas (estoque decrementa, cupom incrementa, Order persiste). É lá que se confia no comportamento.
- Não mockar Prisma para afirmar comportamento de checkout/estoque — é o que documenta `src/test/CLAUDE.md` §4.

### 2.3 Mocks
- GSAP, Lenis, `@gsap/react` mockados globalmente em `src/test/setup.ts`. Não re-mockar.
- Prisma client é mockado em `setup.ts` apenas com models já conhecidos — modelos novos exigem `vi.mock` local no teste (padrão visto em `api-checkout.test.ts`).
- `vi.clearAllMocks()` no `beforeEach` para isolamento.

### 2.4 O que não testar
- Corpos de `useGSAP(...)` (não rodam em jsdom).
- Branches de Radix Select/Calendar (idem).
- Implementação interna (estado privado, classes CSS) — só comportamento observável.

---

## 3. UI / UX / Design

### 3.1 Estética geral (Mari Beauty)
- Paleta OKLCH: ivory, champagne gold, **bordô (`brand-wine`)**, pink (`brand-pink`).
- Tipografia: Poppins (sans) + Playfair Display italic para destaques.
- Tracking generoso em uppercase (`tracking-[0.22em]` a `tracking-[0.32em]`) — registro luxo/L'Oréal.
- Hex está **banido** em código novo; sempre tokens via `globals.css` + `design-tokens.ts`.

### 3.2 Motion
- **GSAP é o engine padrão**. `framer-motion` está banido por `frontend/belessence/CLAUDE.md` §6.
- Helpers em `@/lib/motion/presentation/gsap-helpers` (bounded context Motion). Reutilizar `fadeInUp`, `staggerContainer`, etc. antes de criar novo.
- Lenis (smooth scroll) montado uma vez em `providers/lenis-provider.tsx`.

### 3.3 Princípios de transição **(deste turno)**
- **Suavidade > velocidade.** Trocas abruptas, "agressivas", sem easing são rejeitadas. Padrão: `ease: "expo.out"` ou `ease: "quart.out"`, `duration: 0.45–0.6s`.
- **Estados ativos com pill deslizante.** Quando há tabs/segmented control, a marca visual do ativo deve **deslizar** entre opções (não pop-in/pop-out). Implementação: `<span>` absoluto atrás dos triggers, `gsap.to(pill, { x, width })`.
- **Conteúdo com altura animada.** Trocar de tab ou expandir seção não deve causar salto de layout. Captura `offsetHeight` antes da troca, `gsap.fromTo(wrapper, { height: old }, { height: new, onComplete: () => set "auto" })`.
- **Nada de bounce/elastic.** Ease-out exponencial sempre.

### 3.4 Espaçamento e ritmo **(deste turno)**
- **Não deixar "vão" entre seções**. Borders horizontais full-width + `pt-12` criam blocos desconectados. Preferir: hairline curto e centralizado (`w-16 h-px bg-brand-wine/15`) ou nada.
- Tailwind v4 — escala 4px. Evitar valores arbitrários `[12px]` quando `space-3`/`gap-6` resolvem.

### 3.5 Componentes shadcn
- Style `new-york`, ícones `lucide`. Não introduzir outros.
- Customizar `cva` variants ou estender via `className` — manter API pública.
- Não duplicar primitivos: verificar `src/components/ui/` antes.

---

## 4. Convenções de código

- TS estrito. Sem `any` — `unknown` + narrow.
- `async/await` puro. Sem `.then()` encadeado.
- Named exports para utilitários. Default só para pages/layouts (exigência App Router).
- Imports relativos via alias `@/*`. `cn()` de `@/shadcn-utils/utils`.
- Server-only: `import "server-only"` no topo de arquivos que tocam Prisma/MP/Resend.

---

## 5. Workflow com o agente

### 5.1 Decisões já tomadas
- **Subagent-driven development** para planos com 5+ tasks independentes — preserva contexto do controller, review em duas etapas (spec + qualidade).
- **Brainstorming antes de qualquer trabalho criativo**, mas com perguntas mínimas quando o usuário já especificou direção concreta.
- **Auto mode**: bias para agir sem pausar a cada decisão. Pausar só quando genuinamente bloqueado.
- **Plano escrito antes de código** para qualquer tarefa multi-step.

### 5.2 Commits
- Conventional commits em **inglês** (`feat(orders): add ordersRepository Prisma adapter`).
- Mensagens longas em pt-BR no corpo são aceitáveis quando ajudam o contexto.
- 1 task = 1 commit (granular, revertível).

### 5.3 Documentação
- Specs em `docs/superpowers/specs/YYYY-MM-DD-<topico>-design.md`.
- Planos em `docs/superpowers/plans/YYYY-MM-DD-<topico>.md`.
- Decisões arquiteturais avulsas vão em `docs/ARQUITETURA.md` ou novo arquivo nessa pasta.

### 5.4 Não fazer
- Não rodar `npm install` / `yarn install` — **pnpm é o único gerenciador**.
- Não tocar em `src/generated/`, `.next/`, `node_modules/`.
- Não criar `README.md` ou docs auxiliares sem pedido explícito.
- Não bypassar middleware admin (`admin_session`).

---

## 6. Histórico

- **2026-06-01** — criado durante a tarefa de refactor da seção de tabs em `product-details-client.tsx`, capturando preferências da rodada anterior (bounded context `orders/`) + desta nova (motion delicado em tabs).
