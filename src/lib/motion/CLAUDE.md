---
template: "Niche CLAUDE"
version: 1.0
status: "Ativo"
tags:
  - niche-claude
  - per-diretorio
  - bounded-context
  - hexagonal
  - motion
nicho: "motion"
escopo: "Bounded context Motion — helpers GSAP/Lenis para animações client-side"
---

# `src/lib/motion/` — Bounded Context Motion

> **Hexagonal:** bounded context **motion/** centraliza helpers de animação. Tem `presentation/` apenas (sem domain/application/infra) — animações são side effects do navegador, não regra de negócio.
>
> Gerado na **Rodada 4.3** (2026-05-30) conforme `[[Ecommerce/Belessence/03-Planejamento]]`.

---

## 1. Escopo

Helpers reutilizáveis de animação (fadeInUp, stagger, parallax, cardHoverIn/Out, scrollTrigger setup). Centraliza configuração GSAP + integração com Lenis (smooth scroll) + respeita `prefers-reduced-motion`.

---

## 2. Estrutura Hexagonal

```
src/lib/motion/
├── presentation/
│   └── gsap-helpers.ts          # ex-`src/lib/gsap-utils.ts`
└── CLAUDE.md
```

Sem `domain/`/`application/`/`infrastructure/`: motion é UX/UI puro, sem regras de negócio.

---

## 3. Diretrizes

- **Client-only.** Importar em Server Components quebra (GSAP usa `window`).
- **`useGSAP` obrigatório** — cleanup automático via React. Evita memory leak.
- **`prefers-reduced-motion`** — sempre checar antes de animar. Helpers já respeitam.
- **Não criar helpers novos** sem TDD — animação flaky é difícil de debugar.
- **ScrollTrigger:** sempre via `gsap.registerPlugin(ScrollTrigger)` no module top — feito 1x em `gsap-helpers.ts`.

## 4. Stack Local

- `gsap@3.13`, `@gsap/react@2.1`, `lenis@1.3`

## 5. Testes

- Mocks globais de GSAP/Lenis em `src/test/setup.ts` — qualquer teste que renderize componente animado já tem fixtures.

## 6. Dependências Permitidas

GSAP + react bindings + Lenis. Sem framer-motion (banido pelas Preferencias).

## 7. Histórico

- **2026-05-30 (Rodada 4.3):** `src/lib/gsap-utils.ts` → `src/lib/motion/presentation/gsap-helpers.ts`. 11 consumidores atualizados.

## Referências

- `[[Preferencias Dev#GSAP + Lenis]]`
- CLAUDE.md global do projeto
