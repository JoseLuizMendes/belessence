# Implementation Guide

Objetivo: manter a UI premium por consistência, não por “efeitos”.

## Como compor uma página

1) Comece com o background
- Use o overlay: `<div className="noise-overlay" aria-hidden="true" />`

2) Use `Container` para largura e padding
- Evita divergências entre páginas.

3) Use `Section` para ritmo vertical
- Cada bloco principal deve ser uma `Section`.

4) Use `Eyebrow + SectionTitle + SectionLead`
- Mantém hierarquia e escaneabilidade.

5) Use `Card` para superfícies
- Card = borda fina + leve transparência, sem sombras pesadas.

6) Use `ActionLink` para CTAs
- `variant="outline"` (padrão) para CTA principal.
- `variant="ghost"` para ações secundárias.

## Padrões de motion

- Prefira `duration-[var(--motion-base)]` e `ease-[var(--ease-emphasis)]` para hover.
- Motion deve indicar:
  - interatividade (hover)
  - foco (focus-visible)
  - hierarquia (reveal discreto)

## Padrões de cor

- Conteúdo principal: `text-foreground`
- Secundário/meta: `text-muted-foreground`
- Superfícies: `bg-card`
- Bordas: `border-border/40` (ou variações próximas)
- Destaques: `text-accent` / `border-accent`

## Checklist de consistência

- Títulos usam display (`font-display`).
- Labels/datas/índices usam `font-mono` e uppercase com tracking.
- Sem novos “cinzas” hard-coded: usar tokens (`background/card/muted/border`).
- Sem sombras novas; elevar com borda + leve translate.
