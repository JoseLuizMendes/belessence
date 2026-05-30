# Loreal Extracted Design System

Fonte analisada: Codigo Fonte Loreal.txt
Framework de extração: ai-web-designer-agent.md

## UI Audit
- O projeto já tinha direção editorial/luxo, mas faltava um bloco explícito de tokens no estilo Loreal.
- Havia coerência em cor e animação, porém sem nomenclatura de utilitários diretamente ligada ao sistema extraído.
- Grid de 12 colunas da referência não estava formalizado como utilitário reutilizável.

## Design System

### Typography
- Primary/Labor: EssentielleWeb (fallback Inter/sans)
- Accent: RoyaleWeb (fallback Playfair/serif)
- Handwritten: HeritageWeb (fallback Playfair/serif)
- Body scale base: 1.6rem na referência
- Label/caps com tracking alto: 0.1em+ e uppercase

### Color Strategy
- Base quente: #eae6e2 (fundo global)
- Preto profundo: #000
- Branco puro: #fff
- Linhas sutis: #8c8c8c4d
- Glass/overlays com opacidade e blur

### Motion System
- Easing principal: cubic-bezier(0.22, 1, 0.36, 1)
- Easing secundário: cubic-bezier(0.84, 0, 0.16, 1)
- Durações predominantes entre 0.6s e 1.2s
- Entrada/saída por transform + opacity

### Grid & Spacing
- Grid: 12 colunas
- Gutter mobile: 1rem
- Gutter desktop: 1.38889vw
- Container horizontal mobile: 2rem
- Container horizontal desktop: 4.16667vw

## Design Tokens

### Typography Tokens
- --font-loreal-labor
- --font-loreal-accent
- --font-loreal-hand

### Motion Tokens
- --ease-loreal-smooth
- --ease-loreal-shift
- --duration-loreal-fast
- --duration-loreal-base
- --duration-loreal-slow

### Surface/Component Utilities
- .loreal-surface
- .loreal-kicker
- .loreal-title-caps
- .loreal-body
- .loreal-panel
- .loreal-btn-pill
- .loreal-grid-12

## Tailwind Mapping
- Cores e semântica continuam no sistema atual via variáveis CSS + utilitários.
- Tipografia da referência mapeada por variáveis e classes utilitárias.
- Motion mapeado por custom properties para transições sem GSAP.

## Component Architecture
- Página principal usa o tema extraído no wrapper com loreal-surface.
- Bloco de destaque recebe loreal-panel para reforçar linguagem de painel editorial.
- Features incorpora kicker e body tokens para hierarquia semântica.

## Refactoring Suggestions
- Aplicar loreal-kicker/loreal-title-caps nos títulos de Collections e FeatureProducts.
- Introduzir loreal-grid-12 em layouts maiores (header e footer) para alinhamento macro.
- Unificar botões com loreal-btn-pill em CTAs hero e sales.

## Implementation Guide
1. Aplicar loreal-surface no shell principal.
2. Usar loreal-panel em blocos de transição visual.
3. Substituir labels locais por loreal-kicker.
4. Usar loreal-body em textos auxiliares.
5. Migrar gradualmente grids para loreal-grid-12 quando layout exigir alinhamento macro.
