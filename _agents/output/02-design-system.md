# Design System — DNA Visual (híbrido e original)

Baseado na análise do HTML de referência (tipografia, estratégia de superfícies e microinterações) e recombinado para o MendeShift.

## Typography

**Font family**
- Primary (corpo): `IBM Plex Sans` (`--font-sans`)
- Secondary (micro/labels): `IBM Plex Mono` (`--font-mono`)
- Display (títulos): `Bebas Neue` (`--font-display`)

**Escala e uso**
- Display: títulos de hero e headers de seção (tracking levemente apertado, leading denso)
- Mono: eyebrow, metadados, datas, índices, labels e pequenos textos utilitários
- Corpo: textos explicativos curtos; evitar parágrafos longos com `mono`

## Grid

- Container padrão: `max-w-6xl` com padding responsivo (ver `Container`).
- Layout com **coluna lateral fixa** no desktop (navegação) + conteúdo com `md:pl-20`.
- Divisórias sutis: linhas 1px com `border-border/xx` e gradientes para “corte” discreto.

## Spacing

- Seções com ritmo previsível (ver `Section`): espaçamento vertical amplo para escaneabilidade.
- Cards com padding 8/10 (Tailwind) para densidade premium.

## Color

Estratégia: **dark-first**, superfícies em camadas e acento único.

- Background: quase-preto com ruído discreto (overlay)
- Foreground: branco levemente suavizado
- Card: superfície elevada sem sombras pesadas (borda + transparência)
- Muted: textos secundários mono
- Border: linhas finas e pouco contrastadas
- Accent: vermelho como destaque funcional (não “decorativo”)

## Motion

- Transições de hover/foco com curvas suaves (easing) e durações consistentes.
- Usar motion para:
  - elevar cards no hover (1–2px)
  - revelar detalhes (linhas, gradientes, labels)
  - dar “acabamento” em ícones (rotação/offset)

## Dark Mode System

- Dark como padrão via `<html class="dark">`.
- Tokens com override em `.dark` e fallback via `prefers-color-scheme: dark`.

## Component Patterns

- **Section**: headings e lead padronizados (Eyebrow + Title + Lead).
- **Card**: superfície com `bg-card` + `border-border/xx` (sem shadow pesada).
- **ActionLink**: call-to-action em mono uppercase com variantes (outline/ghost).
- **Navegação lateral**: “dots + labels” com reveal no hover, para baixa intrusão.
