# UI Audit — MendeShift

Referência principal analisada: [../SIGNAL — Experimental Creative Studio (05_03_2026 09：58：14).html](../SIGNAL%20%E2%80%94%20Experimental%20Creative%20Studio%20(05_03_2026%2009%EF%BC%9A58%EF%BC%9A14).html)

Escopo: auditoria do app Next.js (App Router) e do estado inicial (template) vs. estado atual após refatoração do sistema.

## UI Problems (estado inicial)

- **Hierarquia tipográfica fraca**: H1 genérico, pouca distinção entre título/subtítulo/ações.
- **Ritmo vertical inconsistente**: blocos com espaçamento “template-driven”, sem sistema de seções.
- **Identidade visual inexistente**: paleta e superfícies sem intenção (look de boilerplate).
- **Componentes sem contrato**: botões/links estilizados inline, sem tokens nem variantes.
- **Motion não sistematizado**: transições pontuais, sem durações/easing padronizados.

## Improvements já aplicadas

- **Tokens globais + mapeamento Tailwind v4** em [src/app/globals.css](../../src/app/globals.css): background/foreground/card/muted/border/ring/accent + radius + motion.
- **Tipografia consistente** em [src/app/layout.tsx](../../src/app/layout.tsx): `IBM Plex Sans` (corpo), `IBM Plex Mono` (micro-labels), `Bebas Neue` (display).
- **Componentes base** (Container/Section/Card/ActionLink) em [src/components/ui](../../src/components/ui).
- **Home refatorada** em [src/app/page.tsx](../../src/app/page.tsx) com seções e navegação lateral discreta.

## Remaining Issues / Risks (ainda em aberto)

- **Acessibilidade de navegação/estado ativo**: a navegação lateral usa `:hover` para revelar labels; falta um estado “ativo” (por scroll ou foco) e `aria-current`.
- **Semântica de botão vs. link**: `ActionLink` cobre ações via `<a>`; quando houver ações internas (submit, abrir modal), será necessário `Button`.
- **Formulários**: não há `Input`, `Textarea`, `Label` e padrões de erro/sucesso.
- **Tokens de spacing/text scale**: o sistema está forte em cor/motion/tipo, mas ainda sem tokens explícitos de spacing (além do Tailwind).

## Improvement Suggestions (prioridade)

- Padronizar um `Button` (elemento `<button>`) com variantes compatíveis com `ActionLink`.
- Introduzir componentes de formulário mínimos (`Input`, `Label`, `Field`), usando `border/ring` e estados `focus-visible`.
- Definir convenção de **ritmo vertical** por seção (já iniciada pelo `Section`) e aplicar em páginas futuras.
- Se necessário, adicionar tokens opcionais de spacing (ex.: `--space-4`, `--space-6`, …) para consumo por CSS e docs.
