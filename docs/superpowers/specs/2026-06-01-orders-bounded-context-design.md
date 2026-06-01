# Design — Bounded Context `orders/` + Regra `approved → PREPARING`

- **Data:** 2026-06-01
- **Autor:** Claude (sessão de brainstorming com o usuário)
- **Escopo:** `frontend/belessence/`
- **Status:** Aprovado para implementação

---

## 1. Motivação

Hoje o domínio de pedido (`Order`) está espalhado:

- `src/app/api/checkout/route.ts` faz `prisma.order.create` + `prisma.order.update` inline.
- `src/app/sucesso/[id]/page.tsx` e `src/app/meus-pedidos/page.tsx` chamam `prisma.order.findMany` direto no RSC.
- A regra "pagamento aprovado → em separação" não existe — o checkout marca `PAYMENT_CONFIRMED` e para por aí.
- Não há registro de quando cada transição aconteceu — o `OrderTrackingModal` simula datas via `offsetMs` mockado.

Isso fere o padrão hexagonal já estabelecido para `payment/`, `coupons/`, `products/`, `shipping/`, etc. O objetivo deste design é:

1. Criar o bounded context `src/lib/orders/` seguindo o mesmo padrão `domain/application/infrastructure`.
2. Implementar a regra **`approved → PAYMENT_CONFIRMED → PREPARING`** num único use case, idempotente, reutilizável pelo checkout síncrono e pelo futuro webhook do Mercado Pago.
3. Persistir cada transição em uma tabela `OrderEvent` para que o modal de rastreamento exiba datas reais.
4. Refatorar as duas páginas RSC (`/sucesso/[id]`, `/meus-pedidos`) para consumirem o novo contexto, eliminando `prisma` direto fora de `lib/`.

---

## 2. Princípios e restrições

- **Hexagonal:** domain não conhece Prisma; application orquestra via repositório; infrastructure traduz Prisma↔domain.
- **SOLID:**
  - SRP: cada use case (`confirm-payment`, `get-order-by-id`, `list-orders-by-email`) tem uma única responsabilidade.
  - DIP: o use case depende da interface do repositório, não da implementação Prisma. (Como o projeto hoje não usa ports/adapters formais em todos os contextos, vamos adotar o padrão mínimo que já existe: função pura em `application/` consumindo repositório de `infrastructure/`. Não introduziremos `i-orders-repository.ts` neste passo — YAGNI: há apenas um adapter.)
  - OCP: novos eventos (ex.: `OUT_FOR_DELIVERY`) entram via novos use cases sem alterar os existentes.
- **Server-only:** todo o conteúdo de `src/lib/orders/` é server-only. Topo dos arquivos com `import "server-only"` quando manipulam Prisma.
- **pt-BR:** mensagens de erro voltadas ao usuário em pt-BR; identificadores em inglês; comentários em pt-BR.
- **Decimal:** preço/total continuam `Decimal` do Prisma; conversão `Number()` só na borda (DTO de saída p/ componentes).
- **Idempotência:** o use case `confirmPayment` é idempotente por `paymentId` — chamadas repetidas (webhook retransmitindo) não duplicam eventos nem estoque.

---

## 3. Mudanças de banco

### 3.1 Nova tabela `OrderEvent`

```prisma
model OrderEvent {
  id        String      @id @default(uuid())
  orderId   String
  order     Order       @relation(fields: [orderId], references: [id], onDelete: Cascade)
  status    OrderStatus
  createdAt DateTime    @default(now())
  metadata  Json?       // { paymentId?, mpStatus?, source: "checkout" | "webhook" | "admin" }

  @@index([orderId, createdAt])
  @@map("order_events")
}
```

Em `model Order`, adicionar a relação reversa:

```prisma
events    OrderEvent[]
```

### 3.2 Migration

Nome: `add_order_events`. Conteúdo gerado por `pnpm prisma migrate dev --name add_order_events --create-only` e revisado antes de aplicar.

### 3.3 Justificativa para tabela vs. colunas `*At` em `Order`

- **Extensibilidade:** futuro `OUT_FOR_DELIVERY`, retentativas de pagamento, anotações admin entram sem migration.
- **Idempotência clara:** `WHERE metadata->>'paymentId' = ?` é a checagem natural antes de gravar.
- **Imutabilidade histórica:** `Order.status` continua sendo o estado atual; histórico fica isolado.

---

## 4. Estrutura de `src/lib/orders/`

```
src/lib/orders/
├── CLAUDE.md
├── domain/
│   ├── order-types.ts          # OrderStatus, OrderEvent (tipo de domínio), canTransition()
│   └── order-tracking.ts       # TrackingOrderData (DTO para o componente)
├── application/
│   ├── confirm-payment.ts      # use case principal
│   ├── get-order-by-id.ts      # leitura para /sucesso e modal
│   └── list-orders-by-email.ts # leitura para /meus-pedidos
└── infrastructure/
    └── persistence/
        └── orders-repository.ts
```

### 4.1 `domain/order-types.ts`

```ts
// Reexporta o enum do Prisma como tipo de domínio para evitar import direto do client
// gerado fora de lib/. Não há lógica de negócio acoplada ao Prisma aqui.
export type OrderStatus =
  | "PENDING"
  | "PAYMENT_CONFIRMED"
  | "PREPARING"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED";

export interface OrderEvent {
  status: OrderStatus;
  createdAt: Date;
  metadata?: Record<string, unknown> | null;
}

// Tabela de transições válidas — máquina de estado pura, testável sem Prisma.
const VALID_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDING: ["PAYMENT_CONFIRMED", "CANCELLED"],
  PAYMENT_CONFIRMED: ["PREPARING", "CANCELLED"],
  PREPARING: ["SHIPPED", "CANCELLED"],
  SHIPPED: ["DELIVERED"],
  DELIVERED: [],
  CANCELLED: [],
};

export function canTransition(from: OrderStatus, to: OrderStatus): boolean {
  return VALID_TRANSITIONS[from].includes(to);
}
```

### 4.2 `domain/order-tracking.ts`

DTO consumido pelo `OrderTrackingModal`. Move o tipo `TrackingOrderData` que hoje vive no próprio componente para cá — assim o RSC pai e o componente compartilham a mesma definição.

```ts
import type { OrderStatus, OrderEvent } from "./order-types";

export interface TrackingOrderData {
  id: string;
  status: OrderStatus;
  customerName: string;
  trackingCode: string | null;
  createdAt: string; // ISO
  updatedAt: string;
  total: number;
  itemCount: number;
  // Novo: eventos serializados (criado pelo RSC pai a partir do OrderEvent[]).
  events?: Array<{ status: OrderStatus; createdAt: string }>;
}
```

### 4.3 `infrastructure/persistence/orders-repository.ts`

Funções puras de acesso ao banco. Não exporta `prisma`; encapsula.

```ts
import "server-only";
import { prisma } from "@/lib/shared/infrastructure/prisma-client";
import type { OrderStatus } from "../../domain/order-types";

export interface CreateOrderEventInput {
  orderId: string;
  status: OrderStatus;
  metadata?: Record<string, unknown>;
}

export const ordersRepository = {
  findById(id: string) {
    return prisma.order.findUnique({
      where: { id },
      include: {
        items: true,
        events: { orderBy: { createdAt: "asc" } },
      },
    });
  },

  findByEmail(email: string) {
    return prisma.order.findMany({
      where: { customerEmail: email.toLowerCase() },
      orderBy: { createdAt: "desc" },
      include: {
        items: true,
        events: { orderBy: { createdAt: "asc" } },
      },
    });
  },

  // Verifica se já existe evento com o mesmo paymentId (idempotência).
  hasEventForPayment(orderId: string, paymentId: string) {
    return prisma.orderEvent.findFirst({
      where: {
        orderId,
        metadata: { path: ["paymentId"], equals: paymentId },
      },
    });
  },

  // Aplica `confirmPayment` numa transação atômica.
  applyPaymentConfirmation(input: {
    orderId: string;
    paymentId: string;
    mpStatus: string;
    paymentMethod: string;
    source: "checkout" | "webhook";
  }) {
    return prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id: input.orderId },
        data: {
          status: "PAYMENT_CONFIRMED",
          mpPaymentId: input.paymentId,
          mpStatus: input.mpStatus,
          paymentMethod: input.paymentMethod,
        },
      });
      await tx.orderEvent.create({
        data: {
          orderId: input.orderId,
          status: "PAYMENT_CONFIRMED",
          metadata: {
            paymentId: input.paymentId,
            source: input.source,
          },
        },
      });
      await tx.order.update({
        where: { id: input.orderId },
        data: { status: "PREPARING" },
      });
      await tx.orderEvent.create({
        data: {
          orderId: input.orderId,
          status: "PREPARING",
          metadata: {
            paymentId: input.paymentId,
            source: input.source,
            auto: true, // marca: transição automática derivada de PAYMENT_CONFIRMED
          },
        },
      });
    });
  },
};
```

### 4.4 `application/confirm-payment.ts`

```ts
import "server-only";
import { ordersRepository } from "../infrastructure/persistence/orders-repository";
import type { OrderStatus } from "../domain/order-types";

export interface ConfirmPaymentInput {
  orderId: string;
  paymentId: string;
  mpStatus: string;
  paymentMethod: string;
  source?: "checkout" | "webhook";
}

export interface ConfirmPaymentResult {
  status: OrderStatus;
  alreadyProcessed: boolean;
}

/**
 * Regra de negócio: quando o gateway confirma o pagamento, o pedido transita
 * por PAYMENT_CONFIRMED e em seguida automaticamente para PREPARING (em
 * separação). Ambas as transições ficam registradas como OrderEvent.
 *
 * Idempotente: chamada repetida com o mesmo paymentId é no-op.
 */
export async function confirmPayment(
  input: ConfirmPaymentInput,
): Promise<ConfirmPaymentResult> {
  const existing = await ordersRepository.hasEventForPayment(
    input.orderId,
    input.paymentId,
  );
  if (existing) {
    return { status: "PREPARING", alreadyProcessed: true };
  }

  await ordersRepository.applyPaymentConfirmation({
    orderId: input.orderId,
    paymentId: input.paymentId,
    mpStatus: input.mpStatus,
    paymentMethod: input.paymentMethod,
    source: input.source ?? "checkout",
  });

  return { status: "PREPARING", alreadyProcessed: false };
}
```

### 4.5 `application/get-order-by-id.ts`

```ts
import "server-only";
import { ordersRepository } from "../infrastructure/persistence/orders-repository";

export function getOrderById(id: string) {
  return ordersRepository.findById(id);
}
```

### 4.6 `application/list-orders-by-email.ts`

```ts
import "server-only";
import { ordersRepository } from "../infrastructure/persistence/orders-repository";

export function listOrdersByEmail(email: string) {
  return ordersRepository.findByEmail(email);
}
```

### 4.7 `CLAUDE.md` do contexto

Documento curto seguindo o padrão dos outros bounded contexts (`payment/CLAUDE.md`, `coupons/CLAUDE.md`), descrevendo: estrutura, diretrizes (server-only, idempotência, state machine), e ponteiros para os arquivos.

---

## 5. Refatoração dos consumidores

### 5.1 `src/app/api/checkout/route.ts`

Hoje (linhas 189-203) o handler faz `prisma.order.update` inline. Substituir por:

```ts
import { confirmPayment } from "@/lib/orders/application/confirm-payment";

// ... após createPayment(...):
if (payment.status === "approved") {
  await confirmPayment({
    orderId: order.id,
    paymentId: payment.paymentId,
    mpStatus: payment.status,
    paymentMethod: payment.paymentMethod,
    source: "checkout",
  });
} else {
  // pagamento pendente (boleto/pix futuro): apenas salva metadados, sem transição.
  await prisma.order.update({
    where: { id: order.id },
    data: {
      mpPaymentId: payment.paymentId,
      mpStatus: payment.status,
      paymentMethod: payment.paymentMethod,
    },
  });
}

return NextResponse.json({
  orderId: order.id,
  status: payment.status === "approved" ? "PREPARING" : "PENDING",
  paymentMethod: payment.paymentMethod,
});
```

### 5.2 `src/app/sucesso/[id]/page.tsx`

Substituir `prisma.order.findUnique` por `getOrderById(id)`. Construir o array `events` para o modal:

```tsx
const order = await getOrderById(id);
if (!order) notFound();

const events = order.events.map((e) => ({
  status: e.status,
  createdAt: e.createdAt.toISOString(),
}));

<OrderTrackingModal
  order={{
    // ... campos atuais
    events,
  }}
/>
```

### 5.3 `src/app/meus-pedidos/page.tsx`

Substituir `prisma.order.findMany` por `listOrdersByEmail(email)`. Nenhuma mudança visual.

---

## 6. Mudanças no `OrderTrackingModal`

Componente continua `"use client"`. Mudanças:

1. **Importar `TrackingOrderData` de `@/lib/orders/domain/order-tracking`** em vez de declarar localmente. (Boundary: tipo compartilhado em `lib/`, sem React.)
2. **Resolver data de cada step:**
   ```ts
   function resolveStepDate(
     step: TimelineStep,
     idx: number,
     events: TrackingOrderData["events"],
     createdAt: Date,
   ): Date {
     // Busca evento real correspondente ao step (pelo status mapeado)
     const realEvent = events?.find((e) => stepKeyToStatus(step.key) === e.status);
     if (realEvent) return new Date(realEvent.createdAt);
     // Fallback: usa offsetMs (preview/estimativa)
     return new Date(createdAt.getTime() + step.offsetMs);
   }
   ```
3. **Helper `stepKeyToStatus`:** mapeia `"RECEIVED" → "PENDING"`, `"PAYMENT_CONFIRMED" → "PAYMENT_CONFIRMED"`, `"PREPARING" → "PREPARING"`, etc. Steps que não têm OrderStatus correspondente (`IN_TRANSIT`, `OUT_FOR_DELIVERY`) sempre usam offset (até existir granularidade no domínio).
4. **`getCompletedCount` permanece igual** — já trata corretamente `PREPARING = 3`.
5. **Datas exibidas só para steps com `isCompleted=true`** (comportamento atual) — agora reais quando o evento existe.

Nenhuma outra mudança visual. O modal segue recebendo `order` via props do RSC pai (não fetcha sozinho).

---

## 7. Direção de imports (boundary check)

```
app/api/checkout/route.ts
   └─> lib/orders/application/confirm-payment
          └─> lib/orders/infrastructure/persistence/orders-repository
                 └─> lib/shared/infrastructure/prisma-client

app/sucesso/[id]/page.tsx
   ├─> lib/orders/application/get-order-by-id
   └─> components/order-tracking-modal (client)
          └─> lib/orders/domain/order-tracking  (tipo puro, sem Prisma)

app/meus-pedidos/page.tsx
   └─> lib/orders/application/list-orders-by-email
```

- `components/` nunca importa de `infrastructure/persistence/` (boundary).
- `domain/` não importa nada do Prisma client gerado.
- `application/` só conhece o repositório, não o Prisma diretamente.

---

## 8. Estratégia de testes

- **Unit (Vitest):**
  - `domain/order-types.ts`: tabela de transições — `canTransition` cobre todos os pares.
  - `application/confirm-payment.ts`: testar idempotência (mock do repositório). Dois caminhos: `alreadyProcessed=false` e `alreadyProcessed=true`.
- **Integration:**
  - `orders-repository.applyPaymentConfirmation`: roda contra banco de teste, valida que cria 2 eventos e atualiza Order para PREPARING numa única transação.
- **E2E (Playwright):**
  - Checkout completo: usuário finaliza compra → `/sucesso/[id]` mostra status "Em separação" e modal exibe 3 etapas concluídas com datas distintas.

Sem mockar Prisma no teste de checkout (regra global do projeto).

---

## 9. O que está **fora** de escopo

- Webhook real do Mercado Pago (`/api/webhooks/mercado-pago/route.ts`). O design deixa o caminho pronto: basta o handler validar assinatura e chamar `confirmPayment({ source: "webhook" })`.
- Estados de pagamento `pending`/`rejected` em detalhe (boleto/PIX que aprovam mais tarde). O checkout já trata graciosamente quando `payment.status !== "approved"`.
- Tabela `OrderEvent` para eventos não-status (anotações admin, retentativas). O `metadata` JSON deixa preparado.
- Refatoração do admin (`/admin/pedidos/*`) para usar o repositório — fica para a próxima rodada.
- Notificação por e-mail (Resend) ao transitar para PREPARING.

---

## 10. Critérios de aceite

1. Migration `add_order_events` aplicada, schema válido.
2. `pnpm lint` e `pnpm test` passam.
3. Checkout de ponta a ponta resulta em `order.status === "PREPARING"` no banco.
4. Tabela `order_events` contém 2 linhas para o pedido (status `PAYMENT_CONFIRMED` e `PREPARING`) com `metadata.paymentId` igual.
5. Chamar `confirmPayment` duas vezes com o mesmo `paymentId` produz uma única dupla de eventos (`alreadyProcessed=true` na segunda).
6. `/sucesso/[id]` exibe o modal com as etapas `Pedido Recebido`, `Pagamento Confirmado`, `Em Separação` marcadas como concluídas, cada uma com **data real** (não offset mockado) — verificado visualmente.
7. `/meus-pedidos?email=...` continua renderizando idêntico ao atual, sem `prisma` direto no arquivo.
8. Nenhum import de `@/lib/shared/infrastructure/prisma-client` em `src/app/sucesso/` ou `src/app/meus-pedidos/`.

---

## 11. Riscos e mitigações

| Risco | Mitigação |
|---|---|
| Tipo `Json` no Prisma + query `metadata->>'paymentId'` pode não funcionar em SQLite (testes locais). | Confirmar driver de teste = Postgres. Se for SQLite, usar `findFirst({ where: { orderId, status: "PAYMENT_CONFIRMED" } })` e validar `paymentId` em código. |
| `applyPaymentConfirmation` faz 4 writes em transação — se o gateway demorar e a transação travar, pode segurar conexão. | Transação é curta (4 ops simples, sem chamada externa dentro). Pagamento já foi criado **antes** da transação. |
| State machine `canTransition` adicionada mas não usada inicialmente (só em `confirmPayment` o caminho é fixo). | Aceitar como infraestrutura para evoluções futuras (admin marcando `SHIPPED`, etc). Documentar no CLAUDE.md. |
| `OrderTrackingModal` recebe `events` opcional — esquecer de passar deixa modal usando offset mockado silenciosamente. | Para o RSC pai novo (`/sucesso`), sempre passar. Documentar no JSDoc do componente. |

---

## 12. Ordem de implementação

1. Schema + migration `add_order_events`.
2. `src/lib/orders/domain/*` (tipos puros, testáveis sem banco).
3. `src/lib/orders/infrastructure/persistence/orders-repository.ts`.
4. `src/lib/orders/application/*` (3 use cases).
5. `src/lib/orders/CLAUDE.md`.
6. Refatorar `src/app/api/checkout/route.ts`.
7. Refatorar `src/app/sucesso/[id]/page.tsx`.
8. Refatorar `src/app/meus-pedidos/page.tsx`.
9. Atualizar `src/components/order-tracking-modal.tsx` (tipo + lógica de datas).
10. Testes (unit + e2e do fluxo de checkout).
11. `pnpm prisma generate && pnpm build && pnpm lint` — verificação final.
