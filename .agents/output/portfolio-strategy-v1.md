# Portfolio Strategy v1
**MendeShift — José Luiz Mendes**
Gerado por: Copy Architect + Product Strategist + Web Designer

---

## 1. PRODUCT STRATEGIST

### Posicionamento Profissional

**Título:** Product Engineer
**Sub-posicionamento:** Engenheiro fullstack que pensa como engenheiro de produto — do modelo de dados à experiência do usuário final.

**Por que "Product Engineer" funciona:**
- Para clientes freelance: sinaliza que entende o problema de negócio, não só o código
- Para recrutadores/empresas: posiciona acima de "dev fullstack genérico"
- Para startups: é o que eles querem — alguém que entrega produto completo

### Target Market (Dual)

**Audiência 1 — Clientes Freelance**
- Founders de startups early-stage
- Pequenos negócios que precisam de aplicação web
- Empresas sem CTO técnico que precisam de alguém end-to-end

**Audiência 2 — Oportunidades em Empresas**
- Empresas de tecnologia (produto próprio)
- Startups em crescimento
- Consultorias e agências digitais

**Tom para cada audiência:**
- Clientes: foco em *o que você vai ter* (produto funcional, sem dívida técnica)
- Recrutadores: foco em *o que eu já fiz* (impacto real, sistemas críticos, qualidade)

### Project Tier System

**Tier 1 — Projetos Principais (case studies completos)**
- Wedding Platform → fullstack completo, produto real, entregue em produção
- Barber SaaS → pensamento de produto, multi-tenant, deploy real

**Tier 2 — Projetos Complementares**
- Spring REST API → profundidade técnica em backend

**Tier 3 — Experiência Profissional (não são projetos pessoais)**
- SIARHES Roadmap → impacto em escala (adotado por outro estado)
- SonarQube Grade A → cultura de qualidade em sistemas críticos

### Authority Signals (em ordem de impacto)

1. SIARHES roadmap adotado por Santa Catarina — impacto real fora do ES
2. SonarQube Grade A em 3 sistemas críticos — qualidade verificável
3. 1° ES / 17° Brasil — disciplina e performance analítica
4. Wedding Platform — iniciativa, execução, produto real
5. PRODEST — sistemas governamentais de escala

### Narrative Arc dos Projetos

```
Wedding Platform    → iniciativa + execução completa + produto real
Barber SaaS         → pensamento de produto + arquitetura + deploy
REST API            → profundidade técnica + boas práticas
```

---

## 2. COPY ARCHITECT

### Information Architecture

```
/ (Home)
├── HeroSection          → ID: hero       / Quem + O que + CTA
├── ServicesSection      → ID: services   / O que construo (01)
├── WorkSection          → ID: work       / Projetos selecionados (02)
├── PrinciplesSection    → ID: principles / Como trabalho (03)
├── AboutSection         → ID: about      / O engenheiro por trás (04)
├── CtaSection           → ID: contact    / Vamos conversar (05)
└── ColophonSection      → ID: colophon   / Meta + créditos

/projetos/[slug]        → Case study completo
/experience             → Trajetória profissional e acadêmica
```

**SideNav:** Início · Serviços · Projetos · Princípios · Perfil · Contato

### Hero Section

**Eyebrow:** Product Engineer / Vitória, ES
**Headline (SplitFlap):** MendeShift *(manter — identidade de marca)*
**H2:** Construo produtos completos — do modelo de dados à experiência do usuário final.
**Body:** Aplicações web robustas, interfaces modernas e arquitetura orientada a produto. Do levantamento de requisitos ao deploy em produção.
**CTA primário:** Ver projetos
**CTA secundário:** Sobre o MendeShift

**Card Foco:** *(manter copy atual — é forte)*
**Card Entrega:** *(manter copy atual — é forte)*

### Services Section (substituir Sinais)

**Eyebrow:** 01 / Serviços
**Title:** O que construo
**Lead:** Especialidades e áreas de atuação — do backend à interface.

**Cards:**
- Aplicações Web Fullstack — Next.js, React, Node.js e PostgreSQL. Do banco à interface.
- APIs & Integrações — REST APIs, JWT, webhooks, pagamentos e serviços externos.
- Testes & Qualidade — E2E com Playwright, unitários e SonarQube Grade A em projetos críticos.
- Containers & Deploy — Docker, Docker Compose e deploy em produção com CI/CD.

### Work Section

**Manter:** Eyebrow, Title, Lead
**Adicionar:** Link "Ver case study →" em cada card
**Adicionar:** Lista de tecnologias por projeto
**Adicionar:** Métrica de impacto quando disponível

### About Section (atualizar copy)

**Eyebrow:** 04 / Perfil
**Title:** O engenheiro por trás do código *(manter — é forte)*

**Novo parágrafo 1:**
Sou José Luiz Mendes — o engenheiro por trás do MendeShift. Trabalho no PRODEST, o instituto de tecnologia do Governo do Espírito Santo, onde desenvolvo e mantenho sistemas que atendem milhares de servidores públicos.

**Novo parágrafo 2:**
Fui 1° lugar no Espírito Santo e 17° no Brasil pelo Colégio Sagrado Coração de Maria. Essa disciplina define como executo projetos até hoje — sem atalhos, sem dívida técnica invisível.

**Novo parágrafo 3:**
Interesses em neurociência, música e finanças constroem uma leitura analítica diferente dos problemas. Quando clareza de propósito encontra engenharia bem feita, os resultados mudam de escala.

**Stat atualizado:**
- Grade A → SonarQube — 3 sistemas críticos
- 17° → No Brasil — Colégio Sagrado Coração de Maria
- 07/09 → Casamento — projeto entregue em produção

### CTA Section (nova)

**Eyebrow:** 05 / Contato
**Title:** Vamos construir algo juntos.
**Lead:** Disponível para projetos freelance e oportunidades em empresas de tecnologia. Prefiro conversas diretas sobre o que você precisa construir.
**CTA primário:** josemendess004@gmail.com
**CTA secundário:** LinkedIn

### Colophon

**Eyebrow:** 06 / Colophon *(atualizar número)*
**Title:** Créditos *(simplificar)*
**Lead:** *(remover — o CTA já foi feito acima)*

---

## 3. WEB DESIGNER

### UI Audit

**O que está funcionando (manter):**
- Design tokens — sistema coeso e profissional
- Tipografia — Bebas Neue + IBM Plex Mono + IBM Plex Sans: combinação forte
- Accent #ff4d4f — vermelho memorável, premium
- Card pattern — consistente em todo o site
- Cursor follow effect — microinteração refinada
- GSAP animations — propositivas, não excessivas
- Noise overlay + scanlines — estética editorial coerente
- SideNav com dot indicators — navegação elegante

**Problemas identificados:**
1. Signals section — conteúdo editorial não comunica serviços/capacidades
2. WorkSection cards — sem link para case studies (dead ends)
3. AboutSection — copy começa com a marca, não com a pessoa (distância)
4. ColophonSection — "Contato e créditos" mistura CTA com meta info
5. Eyebrow numbering — vai ficar inconsistente com reordenação
6. Falta visual de tech stack nos cards de projeto

**Hierarquia da home:**
- Problema atual: Hero → About → Signals → Work → Principles → Colophon
- A About aparece antes dos projetos — visitante lê sobre a pessoa antes de ver o trabalho
- Problema: perde atenção antes de demonstrar competência

**Hierarquia proposta:**
- Hero → Services → Work → Principles → About → CTA → Colophon
- Lógica: quem → o que faço → prova → como penso → pessoa real → ação

### Component Architecture

**Componentes a criar:**
- `CtaSection` — seção de chamada para ação (pré-colophon)

**Componentes a repurposear:**
- `SignalsSection` → manter estrutura visual, trocar conteúdo por serviços

**Componentes a atualizar:**
- `WorkSection` → adicionar links + dados de projetos de `lib/projects.ts`
- `AboutSection` → copy update, novo número de eyebrow
- `ColophonSection` → número e copy update
- `SideNav` → novos labels e IDs

**Data files a criar:**
- `src/lib/projects.ts` → fonte única de dados de projetos

### Design System

**Tokens ativos (não alterar):**
```
--background: #0b0c0f (dark)
--foreground: #f4f6f8
--accent: #ff4d4f
--font-display: Bebas Neue
--font-mono: IBM Plex Mono
--font-sans: IBM Plex Sans
--ease-emphasis: cubic-bezier(0.16, 1, 0.3, 1)
--motion-slow: 420ms
```

**Motion principles:**
- Scroll triggers: start "top 85-90%", toggleActions: "play none none reverse"
- Stagger: 0.1-0.12s entre elementos
- Duration: 0.75-1s para elementos principais
- Entrada: x: -60 para headers, y: 40-60 para cards

---

## 4. CASE STUDY STRUCTURE (/projetos/[slug])

Para cada projeto, a página deve conter:

```
[Eyebrow] categoria / slug
[Title] Nome do Projeto
[Lead] Descrição curta

[Section] Contexto
[Section] Problema
[Section] Restrições
[Section] Solução
[Section] Stack
[Section] Decisões de Engenharia (lista)
[Section] Desafios (lista)
[Section] Resultado

[Footer] ← Voltar para projetos | Ver próximo projeto →
```

---

## 5. EXPERIENCE PAGE (/experience)

**O que manter:**
- Layout e componentes (estão bons)
- ExperienceSection data

**O que atualizar:**
- SectionLead: remover "A home continua vendendo..." — é copy interna, não para o visitante
- Adicionar achievements do SIARHES de forma mais proeminente (é o case mais forte)
- Considerar adicionar uma tech stack section (C#, .NET, ASP.NET, Azure DevOps, SQL)

---

## 6. METADATA

**layout.tsx:**
- title: "José Luiz Mendes — Product Engineer"
- description: "Product Engineer em Vitória, ES. Construo aplicações web fullstack, APIs e sistemas orientados a produto."

**experience/page.tsx:**
- title: "Experiência | José Luiz Mendes"
- description: "Trajetória profissional e acadêmica..."

**projetos/[slug]/page.tsx:**
- title dinâmico: "{Project Name} | José Luiz Mendes"
