/**
 * Belessence Design Tokens — v2
 * Hybrid Design System extraído de:
 *   - Byredo.com  → whitespace generoso, tracking preciso, hairline borders, fades lentos
 *   - Aesop.com   → ivory quente, leading apertado, escala tipográfica editorial
 *   - MFK         → champagne-gold palette, silk eases, luxo francês, simetria
 *
 * Fonte única da verdade. Todos os componentes referenciam estes tokens.
 * Nunca usar valores hardcoded nos componentes.
 */

// ─── CORES ────────────────────────────────────────────────────────────────────

export const colors = {
  brand: {
    // Noir — inspirado em Byredo: preto profundo com leve temperatura neutra
    black:        'oklch(0.08  0    0)',
    blackSoft:    'oklch(0.14  0    0)',    // Para cards escuros, overlays
    // Gold — inspirado em MFK: ouro quente champagne, não amarelo
    gold:         'oklch(0.72  0.12 82)',   // Ouro principal — secondary
    goldLight:    'oklch(0.82  0.09 82)',   // Hover states, accents suaves
    goldDeep:     'oklch(0.58  0.14 78)',   // Active states, sombras douradas
    goldMuted:    'oklch(0.92  0.04 82)',   // Backgrounds subtis com tom dourado
    // Ivory — inspirado em Aesop: branco quente, nunca puro
    ivory:        'oklch(0.975 0.01 85)',   // Background principal (vs branco frio)
    ivoryWarm:    'oklch(0.96  0.02 85)',   // Cards, seções alternadas
    ivoryDeep:    'oklch(0.93  0.03 85)',   // Bordas, separadores
    // Neutros editoriais
    white:        'oklch(1     0    0)',
    grayHair:     'oklch(0.90  0    0)',    // Hairline borders — Byredo
    grayLight:    'oklch(0.96  0    0)',
    grayMid:      'oklch(0.75  0    0)',    // Texto terciário
    grayMedium:   'oklch(0.45  0    0)',    // Texto secundário
    grayDark:     'oklch(0.25  0    0)',    // Texto em fundos claros
  },
  semantic: {
    background:          'var(--background)',
    foreground:          'var(--foreground)',
    primary:             'var(--primary)',
    primaryForeground:   'var(--primary-foreground)',
    secondary:           'var(--secondary)',
    secondaryForeground: 'var(--secondary-foreground)',
    muted:               'var(--muted)',
    mutedForeground:     'var(--muted-foreground)',
    accent:              'var(--accent)',
    accentForeground:    'var(--accent-foreground)',
    border:              'var(--border)',
    ring:                'var(--ring)',
    destructive:         'var(--destructive)',
  },
} as const;

// ─── TIPOGRAFIA ───────────────────────────────────────────────────────────────
// Hierarquia: Display (Marcellus, Optima-like) > Heading > Subheading >
//             Body/UI (Geist) > Caption · Dados/números (Geist Mono)

export const typography = {
  fontSerif:  'var(--font-marcellus), "Optima", Georgia, serif',
  fontSans:   'var(--font-geist), system-ui, sans-serif',
  fontMono:   'var(--font-geist-mono), ui-monospace, monospace',

  // Pesos — MFK usa muito thin/light para serifs em destaque
  weights: {
    thin:       '300',
    regular:    '400',
    medium:     '500',
    semibold:   '600',
    bold:       '700',
  },

  // Escala modular — ratio 1.25 (Major Third), mais elegante que 1.333
  sizes: {
    '2xs': '0.625rem',   // 10px — micro labels
    xs:    '0.75rem',    // 12px
    sm:    '0.8125rem',  // 13px — captions refinadas
    base:  '1rem',       // 16px
    lg:    '1.125rem',   // 18px
    xl:    '1.25rem',    // 20px
    '2xl': '1.5rem',     // 24px
    '3xl': '1.875rem',   // 30px
    '4xl': '2.25rem',    // 36px
    '5xl': '3rem',       // 48px
    '6xl': '3.75rem',    // 60px — hero principal
    '7xl': '4.5rem',     // 72px
    '8xl': '6rem',       // 96px — display editorial Byredo
    '9xl': '8rem',       // 128px — statement type
  },

  // Letter-spacing — Byredo usa tracking largo para branding, MFK usa moderado
  tracking: {
    tighter: '-0.02em',   // Display serifs grandes
    tight:   '-0.01em',
    normal:   '0em',
    wide:     '0.05em',   // Subheadings
    wider:    '0.1em',    // Labels, captions
    luxury:   '0.18em',   // Eyebrows uppercase — Byredo signature
    ultra:    '0.25em',   // Branding hero
  },

  // Line height — Aesop usa leading apertado para serifs editoriais
  leading: {
    none:     '1',
    tight:    '1.05',    // Display headers — Aesop
    snug:     '1.2',     // Headings
    normal:   '1.5',     // Body
    relaxed:  '1.7',     // Long-form text
    loose:    '2',
  },

  // Presets compostos — prontos para usar nos componentes.
  // Marcellus (font-serif) é peso único 400 e sem itálico — não usar font-light
  // nem italic nos presets de display/heading.
  presets: {
    eyebrow:  'text-xs tracking-[0.18em] uppercase font-sans font-medium',
    display:  'font-serif leading-[1.05] tracking-[-0.01em]',
    heading:  'font-serif leading-snug',
    subhead:  'font-sans font-medium tracking-[0.05em] uppercase text-sm',
    body:     'font-sans font-regular leading-relaxed',
    caption:  'font-sans text-xs tracking-[0.05em] text-muted-foreground',
    price:    'font-sans font-semibold tracking-tight tabular-nums',
    data:     'font-mono tabular-nums tracking-tight',
  },
} as const;

// ─── ESPAÇAMENTO ──────────────────────────────────────────────────────────────
// Byredo usa seções generosas — mínimo 80px mobile, 120px desktop

export const spacing = {
  section: {
    xs:  'py-8  md:py-12',
    sm:  'py-12 md:py-20',
    md:  'py-16 md:py-24 lg:py-28',
    lg:  'py-20 md:py-32 lg:py-40',    // Hero sections
    xl:  'py-24 md:py-40 lg:py-48',    // Editorial full-bleed
  },
  container: 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8',
  containerNarrow: 'max-w-4xl mx-auto px-4 sm:px-6',
  containerWide: 'max-w-screen-2xl mx-auto px-4 sm:px-8 lg:px-12',
} as const;

// ─── BORDER RADIUS ────────────────────────────────────────────────────────────
// Byredo e MFK preferem cantos retos/mínimos — mais editorial

export const radius = {
  none: '0px',
  xs:   '2px',
  sm:   '4px',           // Cards editoriais
  md:   '8px',
  lg:   '12px',          // Shadcn default
  xl:   '16px',
  '2xl':'24px',
  full: '9999px',        // Pills, badges
} as const;

// ─── MOTION / EASING ─────────────────────────────────────────────────────────
// GSAP only — nunca Framer Motion
// Byredo: fades lentos deliberados | MFK: silk eases | Aesop: quase nenhum

export const motion = {
  ease: {
    // GSAP named easings
    linear:   'none',
    out:      'power2.out',
    inOut:    'power2.inOut',
    expo:     'expo.out',        // Snap energético
    back:     'back.out(1.4)',   // Micro-bounce sutil
    elastic:  'elastic.out(1, 0.4)',
    luxury:   'power4.out',     // Hero entries — MFK signature
    silk:     'power3.inOut',   // Hover transitions suaves — MFK
    editorial:'power1.inOut',   // Scroll reveals lentos — Byredo
    // CSS equivalents (para transitions sem GSAP)
    cssLuxury:   'cubic-bezier(0.16, 1, 0.3, 1)',    // power4.out approx
    cssSilk:     'cubic-bezier(0.45, 0, 0.55, 1)',   // power3.inOut approx
    cssEditorial:'cubic-bezier(0.25, 0.1, 0.25, 1)', // power1.inOut approx
  },
  duration: {
    instant:   0.1,   // Micro-feedback
    fast:      0.25,  // Hover states
    normal:    0.45,  // Standard transitions
    slow:      0.8,   // Scroll reveals
    cinematic: 1.2,   // Hero entries — Byredo
    theatrical:1.8,   // Page transitions editorial
  },
  stagger: {
    tight:  0.04,
    normal: 0.08,
    loose:  0.15,
    slow:   0.2,
  },
  // prefers-reduced-motion — acessibilidade obrigatória
  reduced: {
    duration: 0,
    stagger:  0,
  },
  // Presets compostos para GSAP
  presets: {
    heroEntry:   { duration: 1.2, ease: 'power4.out', y: 40 },
    fadeUp:      { duration: 0.8, ease: 'power2.out', y: 24 },
    fadeIn:      { duration: 0.6, ease: 'power1.inOut', opacity: 0 },
    cardHover:   { duration: 0.25, ease: 'power3.inOut', y: -4, scale: 1.01 },
    scrollReveal:{ duration: 0.9, ease: 'expo.out', y: 32, start: 'top 85%' },
  },
} as const;

// ─── GRADIENTES ───────────────────────────────────────────────────────────────

export const gradients = {
  // Hero principal — noir para noir suave (Byredo: sem gradiente colorido)
  heroNoir:    'linear-gradient(160deg, oklch(0.08 0 0) 0%, oklch(0.18 0 0) 100%)',
  // Hero com acento dourado sutil — MFK
  heroGold:    'linear-gradient(135deg, oklch(0.08 0 0) 0%, oklch(0.14 0 0) 60%, oklch(0.58 0.14 78 / 30%) 100%)',
  // Cards — ivory para ivoryWarm
  card:        'linear-gradient(145deg, oklch(0.975 0.01 85), oklch(0.96 0.02 85))',
  // Seção alternada
  sectionWarm: 'linear-gradient(180deg, oklch(0.975 0.01 85) 0%, oklch(0.93 0.03 85) 100%)',
  // Gold accent para badges/highlights
  goldSilk:    'linear-gradient(90deg, oklch(0.82 0.09 82), oklch(0.72 0.12 82))',
  // Overlay de imagem — preserva leitura de texto
  imageOverlay:'linear-gradient(to top, oklch(0.08 0 0 / 70%) 0%, oklch(0.08 0 0 / 0%) 60%)',
} as const;

// ─── SOMBRAS ──────────────────────────────────────────────────────────────────
// Inspiração Byredo/MFK: sombras muito suaves, quase imperceptíveis no claro

export const shadows = {
  hairline: '0 1px 0 oklch(0.90 0 0)',                          // Byredo dividers
  xs:       '0 1px 3px oklch(0.08 0 0 / 0.04)',
  sm:       '0 2px 8px oklch(0.08 0 0 / 0.06)',
  card:     '0 2px 12px oklch(0.08 0 0 / 0.06), 0 1px 4px oklch(0.08 0 0 / 0.04)',
  cardHover:'0 8px 28px oklch(0.08 0 0 / 0.10), 0 2px 8px oklch(0.08 0 0 / 0.06)',
  gold:     '0 4px 20px oklch(0.72 0.12 82 / 0.18)',           // Gold glow
  goldDeep: '0 8px 32px oklch(0.58 0.14 78 / 0.25)',           // Active gold
  luxury:   '0 24px 64px oklch(0.08 0 0 / 0.10)',              // Modal/overlay
  modal:    '0 32px 80px oklch(0.08 0 0 / 0.20)',
} as const;

// ─── BREAKPOINTS ──────────────────────────────────────────────────────────────

export const breakpoints = {
  sm:   '640px',
  md:   '768px',
  lg:   '1024px',
  xl:   '1280px',
  '2xl':'1536px',
} as const;

// ─── GLASSMORPHISM ────────────────────────────────────────────────────────────
// Usar moderadamente — MFK usa em headers ao scroll

export const glass = {
  light:  'bg-white/85 backdrop-blur-md border border-white/30',
  warm:   'bg-[oklch(0.975_0.01_85/0.90)] backdrop-blur-md border border-[oklch(0.90_0_0/0.4)]',
  dark:   'bg-[oklch(0.08_0_0/0.80)] backdrop-blur-md border border-white/10',
  subtle: 'bg-white/60 backdrop-blur-sm border border-white/20',
} as const;

// ─── GRID / LAYOUT ────────────────────────────────────────────────────────────
// Byredo: assimétrico | MFK: centrado simétrico | Aesop: editorial rígido

export const grid = {
  products:    'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
  productsWide:'grid-cols-2 md:grid-cols-3 lg:grid-cols-4',
  editorial:   'grid-cols-1 md:grid-cols-[1fr_2fr]',   // Assimétrico Byredo
  symmetric:   'grid-cols-1 md:grid-cols-2',            // MFK symmetric
  feature:     'grid-cols-1 lg:grid-cols-[3fr_2fr]',   // Hero product
} as const;

// ─── LOREAL SYSTEM EXTRACT (Referencia: Essentiality of Beauty) ────────────
// Sistema extraido do codigo-fonte de referencia para uso em temas editoriais.

export const lorealSystem = {
  typography: {
    families: {
      labor: '"EssentielleWeb", "Inter", system-ui, sans-serif',
      accent: '"RoyaleWeb", "Playfair Display", Georgia, serif',
      handwritten: '"HeritageWeb", "Playfair Display", Georgia, serif',
    },
    scale: {
      body: '1.6rem',
      btnLabel: '1rem',
      titleCaps: '2.5rem',
      copyBig: '1.6rem',
    },
    tracking: {
      body: '0.04em',
      caps: '0.05em',
      nav: '0.1em',
    },
    leading: {
      body: '1.4375',
      title: '1.2',
    },
  },
  colors: {
    pageWarm: '#eae6e2',
    noir: '#000000',
    white: '#ffffff',
    lineSubtle: '#8c8c8c4d',
    glassDark: '#00000080',
    glassLight: '#ffffff99',
  },
  motion: {
    duration: {
      fast: 0.6,
      base: 0.8,
      slow: 1.0,
      page: 1.2,
    },
    easing: {
      smoothOut: 'cubic-bezier(0.22, 1, 0.36, 1)',
      smoothInOut: 'cubic-bezier(0.84, 0, 0.16, 1)',
      draw: 'cubic-bezier(0.65, 0.05, 0.36, 1)',
    },
  },
  grid: {
    columns: 12,
    guttersMobile: '1rem',
    guttersDesktop: '1.38889vw',
    paddingMobile: '2rem',
    paddingDesktop: '4.16667vw',
  },
  radius: {
    panelMobile: '1.2rem',
    panelDesktop: '0.83333vw',
    pill: '7.5rem',
  },
} as const;
