# Tailwind Token Mapping (Tailwind v4 — CSS-first)

Fonte: [src/app/globals.css](../../src/app/globals.css)

O projeto usa Tailwind v4 com `@theme inline`, mapeando variáveis CSS para tokens do Tailwind.

## Cores

Disponíveis como utilities:
- `bg-background`, `text-foreground`
- `bg-card`
- `text-muted-foreground`
- `border-border`
- `ring-ring`
- `text-accent`, `bg-accent`, `border-accent`

Mapeamento base:
- `--color-background` → `--background`
- `--color-foreground` → `--foreground`
- `--color-card` → `--card`
- `--color-muted` → `--muted`
- `--color-muted-foreground` → `--muted-foreground`
- `--color-border` → `--border`
- `--color-ring` → `--ring`
- `--color-accent` → `--accent`
- `--color-accent-foreground` → `--accent-foreground`

## Tipografia

- `font-sans` → `--font-sans`
- `font-mono` → `--font-mono`
- `font-display` → `--font-display`

## Radius

- `rounded-[var(--radius)]` (ou `rounded-lg` etc, se preferir manter Tailwind default)

## Motion

Uso direto via CSS vars:
- `duration-[var(--motion-fast)]`, `duration-[var(--motion-base)]`
- `ease-[var(--ease-standard)]`, `ease-[var(--ease-emphasis)]`

## Dark mode

- Sistema por classe: `<html class="dark">`
- Tokens alternam valores dentro de `.dark { ... }`
