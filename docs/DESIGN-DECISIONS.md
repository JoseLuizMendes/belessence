# DESIGN-DECISIONS.md — Decisões e Preferências do Usuário

> Documento vivo. Toda decisão de UX/UI discutida e aprovada pelo dono do
> projeto fica registrada aqui para que qualquer agente ou dev futuro
> respeite as escolhas já feitas.

---

## Princípios Gerais

1. **Suavidade acima de tudo.** Transições agressivas são inaceitáveis. Toda
   mudança de estado visual (troca de aba, expansão, colapso, aparição de
   elemento) deve ser animada com curvas exponenciais suaves (`expo.out` ou
   similar). O usuário deve sentir "seda", nunca "susto".

2. **GSAP é o padrão de animação.** Framer Motion está banido (ver CLAUDE.md
   §6). Toda animação usa GSAP com `useGSAP` do `@gsap/react`.

3. **Sem vãos visuais desnecessários.** Espaçamentos enormes entre seções
   que deveriam estar conectadas criam sensação de "página quebrada".
   Preferir respiro leve (24–32px) entre seções relacionadas.

4. **Design premium, não genérico.** Evitar designs que pareçam template.
   Cada componente deve ter craft visual que reflita a marca Mari Beauty
   (vinho, rosa, elegância, perfumaria).

---

## Decisões Específicas

### Tabs da PDP (Página de Detalhe do Produto)

| Aspecto                   | Decisão                                                                 |
|---------------------------|-------------------------------------------------------------------------|
| **Espaçamento seção→tabs**| Respiro leve (24–32px), sem o gap de 64px que existia antes             |
| **Visual da tab ativa**   | Pill sólida arredondada com bg vinho e texto rosa/claro                 |
| **Transição da pill**     | Desliza suavemente via GSAP com ease `expo.out` (~0.55s)                |
| **Container da TabsList** | Sem container visível; tabs flutuam limpas sobre o fundo rosa           |
| **Transição de conteúdo** | Slide lateral: conteúdo entra/sai deslizando na direção da tab          |
| **Transição de altura**   | Suave, interpolando old→new com GSAP expo.out (~0.5s), sem saltos      |
| **Posicionamento**        | Largura total da seção de info, alinhadas à esquerda (estilo inline)    |

### Animações — Anti-padrões (o que NÃO fazer)

- ❌ Mudança abrupta de altura (parece "susto")
- ❌ Transições instantâneas sem easing
- ❌ Bounce/elastic em easing (preferir exponencial)
- ❌ Containers desnecessários com borda/sombra que poluem visualmente

---

## Paleta e Tokens Rápidos (referência)

- `--color-brand-wine: #47131C` — cor principal (bordô/vinho)
- `--color-brand-pink: #FFD7E7` — cor secundária (rosa claro)
- `--color-surface-base: #FFFDE9` — fundo geral (creme quente)
- Fonte display: Marcellus (aliasada como `font-playfair`)
- Fonte corpo: DM Sans

---

*Última atualização: 2026-06-01*
