# Beauty AI Match — Quiz Olfativo com IA

> **Status:** Documentado — implementação adiada até o catálogo ter ≥ 30 produtos com tags olfativas estruturadas.
> **Inspirações:** ZARA "Style Quiz", Sephora "Foundation Finder", Olfasense, Sillage.

---

## 1. Conceito

Quiz interativo guiado por inteligência artificial que descobre o **perfil olfativo** da cliente em poucas perguntas e recomenda **3 a 5 fragrâncias do catálogo Mari Beauty** com justificativa personalizada para cada uma.

Diferente de um filtro de busca tradicional (que exige que a cliente já saiba o que quer), o quiz traduz **emoção, estilo de vida e memória afetiva** em recomendações concretas. É uma forma de transformar a primeira visita ao site numa experiência personalizada — sem precisar de cadastro nem login.

### Promessa de valor

- **Para a cliente:** descoberta personalizada sem precisar entender de notas olfativas
- **Para a marca:** redução de abandono na PLP, aumento de ticket médio (recomendação de kits), captura de email opt-in via newsletter no final
- **Para o catálogo:** dados estruturados sobre intenções de compra, mesmo de visitantes não-convertidos

---

## 2. Fluxo proposto

### 2.1 Página de entrada — `/descubra-sua-fragrancia`

Hero envolvente: "Em 2 minutos, descubra a fragrância que conta a sua história."
CTA "Começar quiz" → multi-step.

### 2.2 Perguntas (5 a 7 etapas)

Cada step com 3-4 opções visuais (imagens + texto curto), animação sutil de transição.

1. **Momento do dia que mais te define:**
   - Manhãs ensolaradas
   - Tarde produtiva
   - Final de tarde dourado
   - Noite estrelada

2. **Como você descreveria seu estilo:**
   - Clássico atemporal
   - Romântico delicado
   - Ousado e marcante
   - Minimalista contemporâneo

3. **Ocasião que mais aparece na sua agenda:**
   - Trabalho e reuniões
   - Encontros e jantares
   - Eventos especiais
   - Dia a dia leve

4. **Qual cheiro te transporta para a infância?**
   - Doces caseiros / baunilha
   - Flores do jardim
   - Frutas frescas
   - Madeira e papel

5. **Intensidade que você prefere:**
   - Discreto, só pra mim
   - Equilibrado, perceptível
   - Marcante, deixa rastro

6. **Quanto está disposta a investir?**
   - Até R$ 200
   - R$ 200 — R$ 400
   - R$ 400+
   - Quero o kit descoberta primeiro

7. **(Opcional) Conte algo que te marca:**
   - Campo aberto livre (max 200 chars)

### 2.3 Tela de loading "Analisando seu perfil…"

Animação de 3-5s com mensagens rotativas:
- "Cruzando suas respostas com nosso catálogo…"
- "Buscando notas olfativas compatíveis…"
- "Selecionando as fragrâncias mais alinhadas…"

### 2.4 Tela de resultado

Card grande no topo: **"Seu perfil olfativo: [nome do arquétipo]"**
- Ex: "A Romântica Contemporânea", "A Clássica Confiante", "A Ousada Inquieta"
- Parágrafo de 2-3 linhas descrevendo o perfil

Abaixo, **3-5 produtos recomendados** em ordem decrescente de compatibilidade:
- Card do produto + score "94% de match"
- Justificativa em 1-2 frases gerada pela IA: "A combinação de baunilha, jasmim e cedro do Midnight Velvet acompanha a sua preferência por noites marcantes mas equilibradas."
- Botão "Adicionar ao carrinho" inline

CTAs no final:
- "Refazer o quiz" (reset)
- "Salvar meu resultado" → input de email → envia link por email + cadastra na newsletter
- "Ver todo o catálogo"

---

## 3. Arquitetura técnica

### 3.1 Rotas & componentes

```
src/app/descubra-sua-fragrancia/
  page.tsx                    # entry page (hero)
  quiz/
    page.tsx                  # multi-step client component
  resultado/[id]/
    page.tsx                  # resultado persistido (compartilhável)

src/components/quiz/
  quiz-step.tsx               # step genérico com opções
  quiz-progress.tsx           # barra de progresso
  quiz-result-card.tsx        # card de produto recomendado com score
  archetype-card.tsx          # card do perfil descoberto

src/lib/quiz/
  archetypes.ts               # definição dos arquétipos olfativos
  match-engine.ts             # orquestra chamada à IA
```

### 3.2 Route Handler `/api/ai/match`

```typescript
POST /api/ai/match
Body: {
  answers: {
    momento: string,
    estilo: string,
    ocasiao: string,
    memoria: string,
    intensidade: string,
    orcamento: string,
    textoLivre?: string,
  }
}
Response: {
  resultId: string,           // persistido no banco
  archetype: {
    name: string,
    description: string,
  },
  recommendations: Array<{
    productId: string,
    score: number,            // 0-100
    rationale: string,        // gerado pela IA
  }>
}
```

**Implementação:**

1. Server fetch do catálogo completo: `prisma.product.findMany({ where: { stock: { gt: 0 } } })`
2. Monta system prompt estruturado com o JSON do catálogo + as respostas da cliente
3. Chama `claude-sonnet-4-7` via Anthropic SDK com **tool use** forçando schema de saída
4. Salva resultado em `QuizResult` (novo model Prisma) com slug curto para compartilhamento
5. Retorna resposta estruturada

### 3.3 Anthropic Claude — tool definition

```typescript
{
  name: "recommend_fragrances",
  description: "Recommend 3-5 fragrances based on the customer profile",
  input_schema: {
    type: "object",
    properties: {
      archetype_name: { type: "string", description: "Nome do arquétipo olfativo descoberto (2-4 palavras)" },
      archetype_description: { type: "string", description: "Descrição do perfil em 2-3 frases" },
      recommendations: {
        type: "array",
        minItems: 3,
        maxItems: 5,
        items: {
          type: "object",
          properties: {
            product_id: { type: "string" },
            score: { type: "number", minimum: 0, maximum: 100 },
            rationale: { type: "string", description: "Justificativa personalizada em 1-2 frases" },
          },
          required: ["product_id", "score", "rationale"]
        }
      }
    },
    required: ["archetype_name", "archetype_description", "recommendations"]
  }
}
```

### 3.4 Modelo Prisma adicional

```prisma
model QuizResult {
  id           String   @id @default(uuid())
  shortCode    String   @unique // ex: "fragrance-romantica-x7k2"

  // Respostas da cliente (snapshot)
  answers      Json

  // Resultado da IA
  archetype    Json     // { name, description }
  recommendations Json  // [{ productId, score, rationale }]

  // Captura de leads
  email        String?  // se cliente optar por receber resultado
  emailOptIn   Boolean  @default(false)

  createdAt    DateTime @default(now())

  @@map("quiz_results")
}
```

### 3.5 Pré-requisitos no catálogo (Product)

Adicionar campos estruturados ao Product (migration futura):

```prisma
// Tags olfativas estruturadas — necessárias para a IA fazer matching de qualidade
olfactoryFamily   String?   // "Oriental", "Floral", "Amadeirado", "Cítrico", "Chipre", "Fougère"
notesTop          String[]  // ex: ["bergamota", "limão", "pêra"]
notesHeart        String[]  // ex: ["jasmim", "rosa", "íris"]
notesBase         String[]  // ex: ["baunilha", "âmbar", "cedro"]
intensity         String?   // "discreta" | "equilibrada" | "marcante"
longevity         Int?      // horas estimadas (3-12)
occasions         String[]  // ["trabalho", "noite", "festa", "casual", "romântico"]
mood              String[]  // ["confiante", "romântica", "ousada", "delicada", "contemporânea"]
```

### 3.6 Cache & performance

- **Cache de respostas similares:** Redis (Upstash) com chave hash das respostas. TTL 7 dias.
- **Streaming opcional:** retornar arquétipo primeiro, recomendações em stream (melhor UX percebida)
- **Fallback determinístico:** se a Anthropic API falhar, cair em um matching baseado em regras (filter + sort por compatibilidade calculada client-side)
- **Rate limit:** 5 quizzes por IP por hora para evitar abuso

---

## 4. Métricas de sucesso

Definir antes do lançamento — analytics events:

- `quiz_started` (entry page)
- `quiz_step_completed` (step N)
- `quiz_completed` (resultado gerado)
- `quiz_result_added_to_cart` (CTA produto recomendado)
- `quiz_result_saved_email` (captura de lead)
- `quiz_result_shared` (link compartilhado)

KPIs alvo:
- **Conclusão do quiz:** > 60% dos que começam
- **Conversão pós-quiz:** > 8% adicionam ao carrinho (vs. ~3% baseline)
- **Captura de email:** > 25% dos quizzes finalizados optam por receber

---

## 5. Roadmap de implementação

**Pré-requisitos (bloqueantes):**
1. Catálogo com pelo menos 30 produtos
2. Migration Product para campos olfativos estruturados
3. Trabalho de copy: definir arquétipos olfativos (3-5 nomeáveis) + curadoria das perguntas

**Implementação (estimativa 2-3 semanas):**

- Semana 1: backend (model QuizResult, route handler, integração Anthropic, tool use)
- Semana 2: frontend (multi-step quiz, animações GSAP, tela de resultado)
- Semana 3: cache, captura de leads, analytics, QA, polimento

**Lançamento:**
- Hard launch com banner na home
- Email à base existente: "Descobrimos a fragrância feita pra você"
- Posts patrocinados Instagram com testimonials do quiz

---

## 6. Considerações finais

A feature **só faz sentido depois que o catálogo tem profundidade**. Com 6 produtos, qualquer "recomendação personalizada" parece aleatória. Com 30+, o quiz se torna realmente útil — a IA tem material para diferenciar perfis.

O custo de inferência via Claude API é baixo (~ R$ 0,05 por quiz com sonnet), mas vale precificar contra o LTV esperado dos leads capturados antes de escalar marketing.

Pensar também em **versão simplificada sem IA** como MVP: matching por regras determinísticas usando as tags estruturadas. Lança em 1 semana, valida hipótese, depois evolui pra IA real se a conversão for boa.
