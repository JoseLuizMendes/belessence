---
template: "Niche CLAUDE"
version: 1.0
status: "Ativo"
tags:
  - niche-claude
  - per-diretorio
  - hexagonal
  - presentation
nicho: "motion/presentation"
escopo: "Camada Presentation do bounded context motion — helpers GSAP/Lenis consumidos por Client Components"
---

# `src/lib/motion/presentation/` — Presentation layer

> **Camada Presentation (Hexagonal):** entrega ao consumidor. Aqui mora os helpers GSAP/Lenis que Client Components importam pra animar.
>
> **Client-only.** NUNCA importar em Server Components.

## Diretrizes

- **`useGSAP` é obrigatório** no React — cleanup automático.
- **Respeitar `prefers-reduced-motion`** — todos helpers devem oferecer no-op quando o user prefere movimento reduzido.
- **ScrollTrigger integrado com Lenis** via `gsap.ticker.add`. Configurado uma vez no carregamento do módulo.
- **Não duplicar lógica entre helpers** — extrair primitivos quando ≥ 3 uses.

## Stack Local

GSAP 3.13 + @gsap/react 2.1 + Lenis 1.3.

## Testes

Mocks em `src/test/setup.ts` cobrem GSAP/Lenis para os testes de componentes animados.

## Conteúdo

- `gsap-helpers.ts` — helpers reutilizáveis (fadeInUp, stagger, parallax, scrollTrigger setup).

## Referências

- CLAUDE.md de `src/lib/motion/`
- `[[Preferencias Dev]]`
