# Component Architecture

Objetivo: componentes pequenos, com contrato de tokens, fáceis de recombinar.

## Utilities

- `cn(...values)` em [src/lib/cn.ts](../../src/lib/cn.ts)
  - Junta classNames sem dependências externas.

## UI Primitives

- `Container` em [src/components/ui/container.tsx](../../src/components/ui/container.tsx)
  - Responsável por largura máxima e padding.

- `Section`, `Eyebrow`, `SectionTitle`, `SectionLead` em [src/components/ui/section.tsx](../../src/components/ui/section.tsx)
  - Padroniza ritmo vertical e hierarquia de títulos.

- `Card` em [src/components/ui/card.tsx](../../src/components/ui/card.tsx)
  - Superfície tokenizada com `bg-card` e `border-border`.

- `ActionLink` em [src/components/ui/action-link.tsx](../../src/components/ui/action-link.tsx)
  - CTA com estilo premium (mono + uppercase + tracking) e variantes (`outline`, `ghost`).

## Page Composition

- Home em [src/app/page.tsx](../../src/app/page.tsx)
  - Estrutura 1-página com seções: `top`, `sinais`, `experimentos`, `contato`.
  - Navegação lateral desktop (dots + labels) e cards com microinterações.

## Próximos componentes (quando necessário)

- `Button` (para `<button>`)
- `Input`/`Label`/`Field`
- `Navbar`/`Footer` (se o projeto virar multi-page)
