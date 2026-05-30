# Design Tokens

Fonte dos tokens: [src/app/globals.css](../../src/app/globals.css)

## Color Tokens

- `--background`
- `--foreground`
- `--card`
- `--muted`
- `--muted-foreground`
- `--border`
- `--ring`
- `--accent`
- `--accent-foreground`

## Shape Tokens

- `--radius`

## Motion Tokens

- `--ease-standard`
- `--ease-emphasis`
- `--motion-fast`
- `--motion-base`
- `--motion-slow`

## Typography Tokens

Implementados via Next Font vars:
- `--font-sans`
- `--font-mono`
- `--font-display`

## Dark Tokens

- Implementação por override em `.dark { ... }` (mesmos nomes, valores alternados).

## Tokens sugeridos (opcional, quando o produto crescer)

Se o projeto passar a ter múltiplas páginas/fluxos, vale explicitar tokens extras (mesmo mantendo Tailwind):

**Spacing**
- `--space-1`, `--space-2`, `--space-3`, `--space-4`, `--space-6`, `--space-8`, `--space-12`

**Typography scale (se precisar travar medidas fora do Tailwind)**
- `--text-xs`, `--text-sm`, `--text-md`, `--text-lg`, `--text-xl`, `--text-display`
