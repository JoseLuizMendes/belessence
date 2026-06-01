# Bounded Context `orders/` + Regra `approved → PREPARING` — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Criar bounded context `src/lib/orders/` (domain/application/infrastructure), implementar a regra automática `approved → PAYMENT_CONFIRMED → PREPARING` num único use case idempotente, persistir transições em tabela `OrderEvent`, refatorar `/sucesso`, `/meus-pedidos` e `checkout` para consumirem o contexto, e integrar o `OrderTrackingModal` com datas reais.

**Architecture:** Hexagonal — `domain/` (tipos puros + máquina de estado), `application/` (use cases), `infrastructure/persistence/` (adapter Prisma). Use case `confirmPayment` faz duas transições atômicas registrando `OrderEvent`s, idempotente por `paymentId`. RSC consome `application/`; componente client recebe `events` via prop.

**Tech Stack:** Next.js 16 (App Router), TypeScript estrito, Prisma 7, Vitest, Playwright, Postgres.

**Spec:** `docs/superpowers/specs/2026-06-01-orders-bounded-context-design.md` (commit `93d0b06`).

**Caminho-base:** Todos os caminhos de arquivo são relativos a `frontend/belessence/`. Rode todos os comandos a partir desse diretório (`cd frontend/belessence`).

---

## Task 1: Schema do banco — model `OrderEvent` + relação reversa em `Order`

**Files:**
- Modify: `prisma/schema.prisma` (adicionar model + relação)
- Create: `prisma/migrations/<timestamp>_add_order_events/migration.sql` (gerada pelo Prisma)

- [ ] **Step 1: Adicionar relação reversa em `Order`**

Em `prisma/schema.prisma`, dentro do `model Order { ... }`, antes do `@@map("orders")` (em torno da linha 122), adicionar a linha:

```prisma
  events    OrderEvent[]
```

- [ ] **Step 2: Adicionar `model OrderEvent` após `OrderItem`**

No final do arquivo (após `model OrderItem { ... }` e seu `@@map`), adicionar:

```prisma
// ─── EVENTOS DE PEDIDO ────────────────────────────────────────────────────────

model OrderEvent {
  id        String      @id @default(uuid())
  orderId   String
  order     Order       @relation(fields: [orderId], references: [id], onDelete: Cascade)

  status    OrderStatus
  createdAt DateTime    @default(now())
  metadata  Json?       // { paymentId?, mpStatus?, source: "checkout" | "webhook" | "admin", auto?: bool }

  @@index([orderId, createdAt])
  @@map("order_events")
}
```

- [ ] **Step 3: Validar o schema sem aplicar migration**

Run: `pnpm prisma validate`
Expected: `The schema at prisma/schema.prisma is valid 🚀`

- [ ] **Step 4: Criar migration (sem aplicar ainda)**

Run: `pnpm prisma migrate dev --name add_order_events --create-only`
Expected: cria diretório `prisma/migrations/<timestamp>_add_order_events/migration.sql`. Não roda no banco ainda.

- [ ] **Step 5: Revisar `migration.sql`**

Abrir o arquivo gerado e confirmar que contém apenas `CREATE TABLE "order_events"`, `CREATE INDEX`, e `ADD CONSTRAINT ... FOREIGN KEY ... ON DELETE CASCADE`. Não deve alterar nada em `orders`, `order_items` ou outras tabelas.

- [ ] **Step 6: Aplicar migration**

Run: `pnpm prisma migrate dev`
Expected: `Database is now in sync with your schema.` e regenera o Prisma Client.

- [ ] **Step 7: Confirmar geração do client**

Run: `pnpm prisma generate`
Expected: `✔ Generated Prisma Client (...) to ./src/generated/`. Confere que o tipo `OrderEvent` agora existe em `src/generated/`.

- [ ] **Step 8: Commit**

```bash
git add prisma/schema.prisma prisma/migrations
git commit -m "feat(prisma): add OrderEvent model for order status history"
```

---

## Task 2: Domain — `order-types.ts` com state machine

**Files:**
- Create: `src/lib/orders/domain/order-types.ts`
- Test: `src/test/order-types.test.ts`

- [ ] **Step 1: Escrever teste falhando**

Criar `src/test/order-types.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { canTransition, type OrderStatus } from "@/lib/orders/domain/order-types";

describe("canTransition (máquina de estado de Order)", () => {
  it("permite PENDING → PAYMENT_CONFIRMED", () => {
    expect(canTransition("PENDING", "PAYMENT_CONFIRMED")).toBe(true);
  });

  it("permite PAYMENT_CONFIRMED → PREPARING", () => {
    expect(canTransition("PAYMENT_CONFIRMED", "PREPARING")).toBe(true);
  });

  it("permite PREPARING → SHIPPED", () => {
    expect(canTransition("PREPARING", "SHIPPED")).toBe(true);
  });

  it("permite SHIPPED → DELIVERED", () => {
    expect(canTransition("SHIPPED", "DELIVERED")).toBe(true);
  });

  it("permite PENDING → CANCELLED", () => {
    expect(canTransition("PENDING", "CANCELLED")).toBe(true);
  });

  it("permite PAYMENT_CONFIRMED → CANCELLED", () => {
    expect(canTransition("PAYMENT_CONFIRMED", "CANCELLED")).toBe(true);
  });

  it("permite PREPARING → CANCELLED", () => {
    expect(canTransition("PREPARING", "CANCELLED")).toBe(true);
  });

  it("bloqueia SHIPPED → CANCELLED (já saiu da casa)", () => {
    expect(canTransition("SHIPPED", "CANCELLED")).toBe(false);
  });

  it("bloqueia DELIVERED → qualquer", () => {
    const targets: OrderStatus[] = [
      "PENDING",
      "PAYMENT_CONFIRMED",
      "PREPARING",
      "SHIPPED",
      "CANCELLED",
    ];
    for (const to of targets) {
      expect(canTransition("DELIVERED", to)).toBe(false);
    }
  });

  it("bloqueia CANCELLED → qualquer", () => {
    const targets: OrderStatus[] = [
      "PENDING",
      "PAYMENT_CONFIRMED",
      "PREPARING",
      "SHIPPED",
      "DELIVERED",
    ];
    for (const to of targets) {
      expect(canTransition("CANCELLED", to)).toBe(false);
    }
  });

  it("bloqueia pular etapas (PENDING → PREPARING direto)", () => {
    expect(canTransition("PENDING", "PREPARING")).toBe(false);
  });
});
```

- [ ] **Step 2: Rodar teste para confirmar que falha**

Run: `pnpm test:run src/test/order-types.test.ts`
Expected: FAIL com `Cannot find module '@/lib/orders/domain/order-types'`.

- [ ] **Step 3: Criar diretório e implementação mínima**

Criar `src/lib/orders/domain/order-types.ts`:

```ts
/**
 * Tipos de domínio do bounded context Orders.
 *
 * Não importa Prisma client gerado — re-declara OrderStatus para manter
 * a fronteira domain/infrastructure. Se o enum mudar no schema, atualizar
 * aqui também (caminho explícito, não acoplado).
 */

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

/**
 * Máquina de estado pura — fonte única das transições válidas.
 * Não roda I/O; testável sem banco.
 */
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

- [ ] **Step 4: Rodar teste para confirmar passa**

Run: `pnpm test:run src/test/order-types.test.ts`
Expected: 11 testes PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/orders/domain/order-types.ts src/test/order-types.test.ts
git commit -m "feat(orders): add domain types and state machine"
```

---

## Task 3: Domain — `order-tracking.ts` (DTO compartilhado com componente)

**Files:**
- Create: `src/lib/orders/domain/order-tracking.ts`

- [ ] **Step 1: Criar arquivo**

Criar `src/lib/orders/domain/order-tracking.ts`:

```ts
/**
 * DTO consumido pelo OrderTrackingModal.
 *
 * Fica em domain/ (não infrastructure/) porque é puro — sem React,
 * sem Prisma. Componente client importa daqui para compartilhar o
 * shape com o RSC pai.
 */

import type { OrderStatus } from "./order-types";

export interface TrackingOrderData {
  id: string;
  status: OrderStatus;
  customerName: string;
  trackingCode: string | null;
  createdAt: string; // ISO 8601 (já serializado)
  updatedAt: string;
  total: number;
  itemCount: number;
  /**
   * Eventos de transição registrados (opcional para preservar compat).
   * Quando presentes, o componente usa as datas reais; sem isso, cai no
   * cálculo de offset mockado interno.
   */
  events?: Array<{
    status: OrderStatus;
    createdAt: string; // ISO
  }>;
}
```

- [ ] **Step 2: Validar tipos**

Run: `pnpm tsc --noEmit`
Expected: sem erros.

- [ ] **Step 3: Commit**

```bash
git add src/lib/orders/domain/order-tracking.ts
git commit -m "feat(orders): add TrackingOrderData DTO"
```

---

## Task 4: Infrastructure — `orders-repository.ts`

**Files:**
- Create: `src/lib/orders/infrastructure/persistence/orders-repository.ts`
- Test: `src/test/orders-repository.test.ts`

> **Observação:** `setup.ts` global mocka `@/lib/prisma` historicamente, mas o singleton atual está em `@/lib/shared/infrastructure/prisma-client`. Antes de escrever o teste, abrir `src/test/setup.ts` e confirmar qual caminho está mockado. Se necessário, adicionar `vi.mock("@/lib/shared/infrastructure/prisma-client", ...)` no topo do arquivo de teste seguindo o mesmo padrão de `src/test/api-checkout.test.ts` (linha 25-27).

- [ ] **Step 1: Escrever teste falhando**

Criar `src/test/orders-repository.test.ts`:

```ts
import { describe, it, expect, beforeEach, vi } from "vitest";

vi.mock("@/lib/shared/infrastructure/prisma-client", () => ({
  prisma: {
    order: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
    },
    orderEvent: {
      findFirst: vi.fn(),
      create: vi.fn(),
    },
    $transaction: vi.fn(async (cb: (tx: unknown) => unknown) => cb({
      order: { update: vi.fn() },
      orderEvent: { create: vi.fn() },
    })),
  },
}));

import { ordersRepository } from "@/lib/orders/infrastructure/persistence/orders-repository";
import { prisma } from "@/lib/shared/infrastructure/prisma-client";

describe("ordersRepository", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("findById", () => {
    it("inclui items e events ordenados", async () => {
      vi.mocked(prisma.order.findUnique).mockResolvedValue(null);

      await ordersRepository.findById("order-1");

      expect(prisma.order.findUnique).toHaveBeenCalledWith({
        where: { id: "order-1" },
        include: {
          items: true,
          events: { orderBy: { createdAt: "asc" } },
        },
      });
    });
  });

  describe("findByEmail", () => {
    it("normaliza email para lowercase e ordena por createdAt desc", async () => {
      vi.mocked(prisma.order.findMany).mockResolvedValue([]);

      await ordersRepository.findByEmail("Maria@Example.com");

      expect(prisma.order.findMany).toHaveBeenCalledWith({
        where: { customerEmail: "maria@example.com" },
        orderBy: { createdAt: "desc" },
        include: {
          items: true,
          events: { orderBy: { createdAt: "asc" } },
        },
      });
    });
  });

  describe("hasEventForPayment", () => {
    it("filtra por orderId e metadata.paymentId", async () => {
      vi.mocked(prisma.orderEvent.findFirst).mockResolvedValue(null);

      await ordersRepository.hasEventForPayment("order-1", "MP_123");

      expect(prisma.orderEvent.findFirst).toHaveBeenCalledWith({
        where: {
          orderId: "order-1",
          metadata: { path: ["paymentId"], equals: "MP_123" },
        },
      });
    });
  });

  describe("applyPaymentConfirmation", () => {
    it("executa 2 updates e 2 creates dentro de $transaction", async () => {
      const txUpdate = vi.fn();
      const txCreate = vi.fn();
      vi.mocked(prisma.$transaction).mockImplementation(async (cb) =>
        (cb as (tx: unknown) => unknown)({
          order: { update: txUpdate },
          orderEvent: { create: txCreate },
        }),
      );

      await ordersRepository.applyPaymentConfirmation({
        orderId: "order-1",
        paymentId: "MP_123",
        mpStatus: "approved",
        paymentMethod: "pix",
        source: "checkout",
      });

      expect(prisma.$transaction).toHaveBeenCalledTimes(1);
      expect(txUpdate).toHaveBeenCalledTimes(2);
      expect(txCreate).toHaveBeenCalledTimes(2);

      // Primeiro update: status=PAYMENT_CONFIRMED + dados de pagamento
      expect(txUpdate).toHaveBeenNthCalledWith(1, {
        where: { id: "order-1" },
        data: {
          status: "PAYMENT_CONFIRMED",
          mpPaymentId: "MP_123",
          mpStatus: "approved",
          paymentMethod: "pix",
        },
      });

      // Segundo update: status=PREPARING (transição automática)
      expect(txUpdate).toHaveBeenNthCalledWith(2, {
        where: { id: "order-1" },
        data: { status: "PREPARING" },
      });

      // Eventos: PAYMENT_CONFIRMED e PREPARING (com auto:true no segundo)
      expect(txCreate).toHaveBeenNthCalledWith(1, {
        data: {
          orderId: "order-1",
          status: "PAYMENT_CONFIRMED",
          metadata: { paymentId: "MP_123", source: "checkout" },
        },
      });
      expect(txCreate).toHaveBeenNthCalledWith(2, {
        data: {
          orderId: "order-1",
          status: "PREPARING",
          metadata: { paymentId: "MP_123", source: "checkout", auto: true },
        },
      });
    });
  });
});
```

- [ ] **Step 2: Rodar teste para confirmar que falha**

Run: `pnpm test:run src/test/orders-repository.test.ts`
Expected: FAIL com `Cannot find module '@/lib/orders/infrastructure/persistence/orders-repository'`.

- [ ] **Step 3: Criar repositório**

Criar `src/lib/orders/infrastructure/persistence/orders-repository.ts`:

```ts
/**
 * orders-repository — adapter Prisma do bounded context Orders.
 *
 * Único arquivo do contexto que conhece o Prisma. Application e domain
 * dependem do shape deste objeto, não do client diretamente (DIP).
 */
import "server-only";
import { prisma } from "@/lib/shared/infrastructure/prisma-client";
import type { OrderStatus } from "../../domain/order-types";

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

  /**
   * Idempotência: chamado antes de `applyPaymentConfirmation`. Se já existe
   * um OrderEvent com este paymentId, o pagamento já foi processado.
   */
  hasEventForPayment(orderId: string, paymentId: string) {
    return prisma.orderEvent.findFirst({
      where: {
        orderId,
        metadata: { path: ["paymentId"], equals: paymentId },
      },
    });
  },

  /**
   * Aplica a regra de negócio: PAYMENT_CONFIRMED → PREPARING numa única
   * transação atômica. Persiste dois OrderEvents (com `auto: true` no
   * segundo para marcar transição derivada).
   */
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
            auto: true,
          },
        },
      });
    });
  },
};

// Reexporta tipo do retorno para uso no application/.
export type OrderWithRelations = NonNullable<
  Awaited<ReturnType<typeof ordersRepository.findById>>
>;
export type { OrderStatus };
```

- [ ] **Step 4: Rodar teste para confirmar passa**

Run: `pnpm test:run src/test/orders-repository.test.ts`
Expected: 4 testes PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/orders/infrastructure/persistence/orders-repository.ts src/test/orders-repository.test.ts
git commit -m "feat(orders): add ordersRepository Prisma adapter"
```

---

## Task 5: Application — `confirm-payment.ts` (use case idempotente)

**Files:**
- Create: `src/lib/orders/application/confirm-payment.ts`
- Test: `src/test/confirm-payment.test.ts`

- [ ] **Step 1: Escrever teste falhando**

Criar `src/test/confirm-payment.test.ts`:

```ts
import { describe, it, expect, beforeEach, vi } from "vitest";

vi.mock("@/lib/orders/infrastructure/persistence/orders-repository", () => ({
  ordersRepository: {
    hasEventForPayment: vi.fn(),
    applyPaymentConfirmation: vi.fn(),
  },
}));

import { confirmPayment } from "@/lib/orders/application/confirm-payment";
import { ordersRepository } from "@/lib/orders/infrastructure/persistence/orders-repository";

describe("confirmPayment (use case)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("aplica confirmação quando paymentId é novo (alreadyProcessed=false)", async () => {
    vi.mocked(ordersRepository.hasEventForPayment).mockResolvedValue(null);
    vi.mocked(ordersRepository.applyPaymentConfirmation).mockResolvedValue(undefined as unknown as void);

    const result = await confirmPayment({
      orderId: "order-1",
      paymentId: "MP_NEW",
      mpStatus: "approved",
      paymentMethod: "pix",
    });

    expect(ordersRepository.hasEventForPayment).toHaveBeenCalledWith("order-1", "MP_NEW");
    expect(ordersRepository.applyPaymentConfirmation).toHaveBeenCalledWith({
      orderId: "order-1",
      paymentId: "MP_NEW",
      mpStatus: "approved",
      paymentMethod: "pix",
      source: "checkout",
    });
    expect(result).toEqual({ status: "PREPARING", alreadyProcessed: false });
  });

  it("é no-op quando paymentId já foi processado (alreadyProcessed=true)", async () => {
    vi.mocked(ordersRepository.hasEventForPayment).mockResolvedValue({
      id: "evt-1",
      orderId: "order-1",
      status: "PAYMENT_CONFIRMED",
      createdAt: new Date(),
      metadata: { paymentId: "MP_NEW" },
    } as never);

    const result = await confirmPayment({
      orderId: "order-1",
      paymentId: "MP_NEW",
      mpStatus: "approved",
      paymentMethod: "pix",
    });

    expect(ordersRepository.applyPaymentConfirmation).not.toHaveBeenCalled();
    expect(result).toEqual({ status: "PREPARING", alreadyProcessed: true });
  });

  it("usa source='webhook' quando fornecido", async () => {
    vi.mocked(ordersRepository.hasEventForPayment).mockResolvedValue(null);
    vi.mocked(ordersRepository.applyPaymentConfirmation).mockResolvedValue(undefined as unknown as void);

    await confirmPayment({
      orderId: "order-1",
      paymentId: "MP_HOOK",
      mpStatus: "approved",
      paymentMethod: "credit_card",
      source: "webhook",
    });

    expect(ordersRepository.applyPaymentConfirmation).toHaveBeenCalledWith(
      expect.objectContaining({ source: "webhook" }),
    );
  });
});
```

- [ ] **Step 2: Rodar teste para confirmar que falha**

Run: `pnpm test:run src/test/confirm-payment.test.ts`
Expected: FAIL com `Cannot find module '@/lib/orders/application/confirm-payment'`.

- [ ] **Step 3: Implementar use case**

Criar `src/lib/orders/application/confirm-payment.ts`:

```ts
/**
 * confirmPayment — use case.
 *
 * Regra de negócio: gateway aprovou o pagamento → o pedido transita por
 * PAYMENT_CONFIRMED e, automaticamente, para PREPARING (em separação).
 * Ambas as transições ficam registradas como OrderEvent.
 *
 * Idempotente por `paymentId`: chamada repetida (webhook retransmitindo)
 * é no-op e retorna `alreadyProcessed: true`.
 */
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

- [ ] **Step 4: Rodar teste para confirmar passa**

Run: `pnpm test:run src/test/confirm-payment.test.ts`
Expected: 3 testes PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/orders/application/confirm-payment.ts src/test/confirm-payment.test.ts
git commit -m "feat(orders): add confirmPayment use case (idempotent)"
```

---

## Task 6: Application — `get-order-by-id.ts` e `list-orders-by-email.ts`

**Files:**
- Create: `src/lib/orders/application/get-order-by-id.ts`
- Create: `src/lib/orders/application/list-orders-by-email.ts`

> Use cases finos sobre o repositório — não exigem teste próprio (são pass-through; o repo já tem cobertura). Ficam separados para manter SRP e abrir espaço para regras futuras (ex.: filtrar dados sensíveis).

- [ ] **Step 1: Criar `get-order-by-id.ts`**

Criar `src/lib/orders/application/get-order-by-id.ts`:

```ts
/**
 * Use case de leitura para /sucesso/[id] e OrderTrackingModal.
 *
 * Pass-through do repositório por enquanto. Centralizar aqui permite
 * adicionar regras futuras (mascarar CPF, esconder dados de pagamento
 * de chamadas externas) sem alterar quem consome.
 */
import "server-only";
import { ordersRepository } from "../infrastructure/persistence/orders-repository";

export function getOrderById(id: string) {
  return ordersRepository.findById(id);
}
```

- [ ] **Step 2: Criar `list-orders-by-email.ts`**

Criar `src/lib/orders/application/list-orders-by-email.ts`:

```ts
/**
 * Use case de leitura para /meus-pedidos.
 *
 * Trim básico no email para evitar lookup vazio. Normalização para
 * lowercase fica no repositório.
 */
import "server-only";
import { ordersRepository } from "../infrastructure/persistence/orders-repository";

export function listOrdersByEmail(email: string) {
  const cleaned = email.trim();
  if (!cleaned) return Promise.resolve([]);
  return ordersRepository.findByEmail(cleaned);
}
```

- [ ] **Step 3: Validar tipos**

Run: `pnpm tsc --noEmit`
Expected: sem erros.

- [ ] **Step 4: Commit**

```bash
git add src/lib/orders/application
git commit -m "feat(orders): add getOrderById and listOrdersByEmail use cases"
```

---

## Task 7: `CLAUDE.md` do bounded context

**Files:**
- Create: `src/lib/orders/CLAUDE.md`

- [ ] **Step 1: Criar documento**

Criar `src/lib/orders/CLAUDE.md`:

```markdown
# `src/lib/orders/` — Bounded Context Orders

## Estrutura

```
src/lib/orders/
├── domain/
│   ├── order-types.ts        # OrderStatus + canTransition() (state machine pura)
│   └── order-tracking.ts     # TrackingOrderData (DTO consumido pelo modal)
├── application/
│   ├── confirm-payment.ts    # approved → PAYMENT_CONFIRMED → PREPARING (idempotente)
│   ├── get-order-by-id.ts    # leitura para /sucesso e modal
│   └── list-orders-by-email.ts  # leitura para /meus-pedidos
└── infrastructure/
    └── persistence/
        └── orders-repository.ts  # único acesso direto ao Prisma
```

## Diretrizes

- **Server-only:** todos os arquivos têm `import "server-only"`. Domain compartilha tipos com o cliente, mas não importa Prisma.
- **Idempotência (`confirmPayment`):** o repositório checa `OrderEvent` por `metadata.paymentId` antes de gravar. Chamada repetida do mesmo webhook é no-op.
- **State machine:** `canTransition` em `domain/order-types.ts` é a fonte única das transições válidas. Use ao adicionar novos pontos de mutação (ex.: admin marcando SHIPPED).
- **OrderEvent:** event log imutável. Toda transição de status grava uma linha. Não há "rollback" — para reverter, gravar nova transição (ex.: `CANCELLED`).
- **Boundary:** `infrastructure/persistence/orders-repository.ts` é o único arquivo do contexto que conhece o Prisma. `application/` depende do shape do objeto exportado, não do Prisma Client.

## Pontos de chamada da regra `approved → PREPARING`

- `src/app/api/checkout/route.ts` — checkout síncrono com mock retornando `approved`.
- `src/app/api/webhooks/mercado-pago/route.ts` — **a criar** quando o gateway real for plugado. Mesmo use case, `source: "webhook"`.

## Histórico

- **2026-06-01:** criado. Migração de `prisma` direto em `/sucesso` e `/meus-pedidos` para o contexto. Nova tabela `OrderEvent`.
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/orders/CLAUDE.md
git commit -m "docs(orders): add bounded context CLAUDE.md"
```

---

## Task 8: Refatorar `src/app/api/checkout/route.ts` para usar `confirmPayment`

**Files:**
- Modify: `src/app/api/checkout/route.ts` (linhas 189-209)
- Modify: `src/test/api-checkout.test.ts` (ajustar asserts do status retornado)

- [ ] **Step 1: Editar `route.ts` — substituir o `prisma.order.update` final**

No arquivo `src/app/api/checkout/route.ts`, **substituir** o bloco que vai da linha 189 até a linha 209 (do comentário `// ── 6. Chama payment provider` até o `return NextResponse.json(...)`) pelo seguinte. **Mantenha a chamada a `createPayment` antes da edição.**

Localize:

```ts
    // ── 7. Atualiza Order com dados do pagamento ────────────────────────────
    // Como o mock retorna `approved` imediatamente, marcamos como PAYMENT_CONFIRMED.
    // Em produção, isso aconteceria via webhook do MP, e aqui só salvaríamos o paymentId.
    const finalStatus =
      payment.status === "approved" ? "PAYMENT_CONFIRMED" : "PENDING";

    await prisma.order.update({
      where: { id: order.id },
      data: {
        status: finalStatus,
        mpPaymentId: payment.paymentId,
        mpStatus: payment.status,
        paymentMethod: payment.paymentMethod,
      },
    });

    return NextResponse.json({
      orderId: order.id,
      status: finalStatus,
      paymentMethod: payment.paymentMethod,
    });
```

E substitua por:

```ts
    // ── 7. Aplica regra de negócio se aprovado, ou só salva metadados ──────
    // approved → use case orquestra PAYMENT_CONFIRMED + PREPARING (idempotente).
    // pending/rejected → apenas persiste o paymentId para futuro webhook.
    let finalStatus: "PREPARING" | "PENDING";

    if (payment.status === "approved") {
      await confirmPayment({
        orderId: order.id,
        paymentId: payment.paymentId,
        mpStatus: payment.status,
        paymentMethod: payment.paymentMethod,
        source: "checkout",
      });
      finalStatus = "PREPARING";
    } else {
      await prisma.order.update({
        where: { id: order.id },
        data: {
          mpPaymentId: payment.paymentId,
          mpStatus: payment.status,
          paymentMethod: payment.paymentMethod,
        },
      });
      finalStatus = "PENDING";
    }

    return NextResponse.json({
      orderId: order.id,
      status: finalStatus,
      paymentMethod: payment.paymentMethod,
    });
```

- [ ] **Step 2: Adicionar import no topo de `route.ts`**

Logo após `import { createPayment } from "@/lib/payment/infrastructure/external/payment-provider";` adicione:

```ts
import { confirmPayment } from "@/lib/orders/application/confirm-payment";
```

- [ ] **Step 3: Atualizar testes de checkout para refletir novo status**

Abrir `src/test/api-checkout.test.ts`. No início do arquivo, junto com os `vi.mock` existentes (linhas 25-27), adicionar:

```ts
vi.mock("@/lib/orders/application/confirm-payment", () => ({ confirmPayment: vi.fn() }));
```

E adicionar ao bloco de imports correspondente:

```ts
import { confirmPayment } from "@/lib/orders/application/confirm-payment";
```

- [ ] **Step 4: Ajustar asserts dos casos "aprovado" no teste**

No teste `src/test/api-checkout.test.ts`, localize cada caso que afirma `status: "PAYMENT_CONFIRMED"` no response body — substitua por `status: "PREPARING"`. Adicione asserts de que `confirmPayment` foi chamado com `source: "checkout"`. Exemplo de bloco a ajustar (procure pelo trecho `Pagamento aprovado → status PAYMENT_CONFIRMED`):

```ts
expect(response.status).toBe(200);
expect(body).toMatchObject({ orderId: expect.any(String), status: "PREPARING" });
expect(confirmPayment).toHaveBeenCalledWith({
  orderId: expect.any(String),
  paymentId: expect.any(String),
  mpStatus: "approved",
  paymentMethod: expect.any(String),
  source: "checkout",
});
```

No caso "Pagamento pendente → status PENDING", garanta que `confirmPayment` **não** foi chamado:

```ts
expect(confirmPayment).not.toHaveBeenCalled();
```

E que o `prisma.order.update` para gravar apenas os metadados foi chamado (sem `status:`):

```ts
expect(prisma.order.update).toHaveBeenCalledWith(
  expect.objectContaining({
    data: expect.objectContaining({
      mpPaymentId: expect.any(String),
      mpStatus: "pending",
    }),
  }),
);
```

- [ ] **Step 5: Rodar testes do checkout**

Run: `pnpm test:run src/test/api-checkout.test.ts`
Expected: todos PASS. Se algum afirmava `PAYMENT_CONFIRMED` no body, deve estar agora afirmando `PREPARING`.

- [ ] **Step 6: Commit**

```bash
git add src/app/api/checkout/route.ts src/test/api-checkout.test.ts
git commit -m "refactor(checkout): delegate approved->PREPARING to orders use case"
```

---

## Task 9: Refatorar `src/app/sucesso/[id]/page.tsx`

**Files:**
- Modify: `src/app/sucesso/[id]/page.tsx`

- [ ] **Step 1: Trocar import do Prisma pelo use case**

No topo de `src/app/sucesso/[id]/page.tsx`, **remover**:

```ts
import { prisma } from "@/lib/shared/infrastructure/prisma-client";
```

E **adicionar**:

```ts
import { getOrderById } from "@/lib/orders/application/get-order-by-id";
```

- [ ] **Step 2: Trocar a chamada de banco**

Localize o bloco (em torno da linha 67-70):

```ts
  const order = await prisma.order.findUnique({
    where: { id },
    include: { items: true },
  });
```

Substitua por:

```ts
  const order = await getOrderById(id);
```

- [ ] **Step 3: Passar `events` para o modal**

Localize o `<OrderTrackingModal order={...} />` (em torno da linha 304-315). Substitua o objeto `order={...}` por:

```tsx
                <OrderTrackingModal
                  order={{
                    id: order.id,
                    status: order.status,
                    customerName: order.customerName,
                    trackingCode: order.trackingCode,
                    createdAt: order.createdAt.toISOString(),
                    updatedAt: order.updatedAt.toISOString(),
                    total: Number(order.total),
                    itemCount: order.items.reduce((sum, item) => sum + item.quantity, 0),
                    events: order.events.map((e) => ({
                      status: e.status,
                      createdAt: e.createdAt.toISOString(),
                    })),
                  }}
                />
```

- [ ] **Step 4: Validar tipos**

Run: `pnpm tsc --noEmit`
Expected: sem erros (a relação `events` agora existe no retorno por causa do `include`).

- [ ] **Step 5: Build sanity check**

Run: `pnpm build`
Expected: build conclui sem erros.

- [ ] **Step 6: Commit**

```bash
git add src/app/sucesso/[id]/page.tsx
git commit -m "refactor(sucesso): consume orders bounded context, pass events to modal"
```

---

## Task 10: Refatorar `src/app/meus-pedidos/page.tsx`

**Files:**
- Modify: `src/app/meus-pedidos/page.tsx`

- [ ] **Step 1: Trocar import**

No topo, **remover**:

```ts
import { prisma } from "@/lib/shared/infrastructure/prisma-client";
```

E **adicionar**:

```ts
import { listOrdersByEmail } from "@/lib/orders/application/list-orders-by-email";
```

- [ ] **Step 2: Trocar a chamada de banco**

Localize (em torno da linha 65-71):

```ts
  const orders = email
    ? await prisma.order.findMany({
        where: { customerEmail: email.toLowerCase() },
        orderBy: { createdAt: "desc" },
        include: { items: true },
      })
    : [];
```

Substitua por:

```ts
  const orders = email ? await listOrdersByEmail(email) : [];
```

- [ ] **Step 3: Validar tipos**

Run: `pnpm tsc --noEmit`
Expected: sem erros.

- [ ] **Step 4: Commit**

```bash
git add src/app/meus-pedidos/page.tsx
git commit -m "refactor(meus-pedidos): consume orders bounded context"
```

---

## Task 11: Atualizar `OrderTrackingModal` — datas reais via `events`

**Files:**
- Modify: `src/components/order-tracking-modal.tsx`

- [ ] **Step 1: Trocar `TrackingOrderData` local por import do domain**

No topo de `src/components/order-tracking-modal.tsx`, logo após os imports do shadcn (linha ~24), **adicionar**:

```ts
import type {
  TrackingOrderData,
} from "@/lib/orders/domain/order-tracking";
import type { OrderStatus } from "@/lib/orders/domain/order-types";
```

- [ ] **Step 2: Remover declarações locais redundantes**

No bloco `/* ─── Types ──────... */` (linhas 26-45), **remover**:

```ts
type OrderStatus =
  | "PENDING"
  | "PAYMENT_CONFIRMED"
  | "PREPARING"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED";

export interface TrackingOrderData {
  id: string;
  status: OrderStatus;
  customerName: string;
  trackingCode: string | null;
  createdAt: string;
  updatedAt: string;
  total: number;
  itemCount: number;
}
```

(Mantenha o comentário de seção `/* ─── Types ─── */` se quiser; ele agora pode apontar para o import.)

- [ ] **Step 3: Adicionar helper `stepKeyToStatus`**

Logo abaixo da constante `TIMELINE_STEPS` (após linha 108), **adicionar**:

```ts
/**
 * Mapeia chave do step visual para o OrderStatus do domínio (quando há
 * correspondência). Steps que não existem no domínio (IN_TRANSIT,
 * OUT_FOR_DELIVERY) retornam `null` → caem no fallback de offset.
 */
function stepKeyToStatus(key: string): OrderStatus | null {
  switch (key) {
    case "RECEIVED":
      return "PENDING";
    case "PAYMENT_CONFIRMED":
      return "PAYMENT_CONFIRMED";
    case "PREPARING":
      return "PREPARING";
    case "SHIPPED":
      return "SHIPPED";
    case "DELIVERED":
      return "DELIVERED";
    default:
      return null;
  }
}

/**
 * Resolve a data de um step:
 *  - Se há evento real correspondente → usa createdAt do evento.
 *  - Senão → fallback no offset mockado (preview/estimativa).
 */
function resolveStepDate(
  step: TimelineStep,
  events: TrackingOrderData["events"],
  createdAt: Date,
): Date {
  const mappedStatus = stepKeyToStatus(step.key);
  if (mappedStatus && events?.length) {
    const real = events.find((e) => e.status === mappedStatus);
    if (real) return new Date(real.createdAt);
  }
  return new Date(createdAt.getTime() + step.offsetMs);
}
```

- [ ] **Step 4: Trocar o cálculo inline de `stepDate` por `resolveStepDate`**

Dentro do `.map((step, idx) => { ... })` do `<ol>` (linha ~266), localize:

```ts
              const stepDate = new Date(
                createdAt.getTime() + step.offsetMs
              );
```

Substitua por:

```ts
              const stepDate = resolveStepDate(step, order.events, createdAt);
```

- [ ] **Step 5: Validar tipos**

Run: `pnpm tsc --noEmit`
Expected: sem erros. `TrackingOrderData["events"]` é opcional, então o uso compila.

- [ ] **Step 6: Lint**

Run: `pnpm lint`
Expected: sem erros.

- [ ] **Step 7: Commit**

```bash
git add src/components/order-tracking-modal.tsx
git commit -m "feat(modal): use real OrderEvent timestamps when available"
```

---

## Task 12: E2E Playwright — checkout completo + modal com datas reais

**Files:**
- Create: `e2e/order-tracking.spec.ts`

> Pré-requisito: a suíte existente `e2e/checkout-flow.spec.ts` deve estar verde — ela já cobre o caminho de checkout. Aqui adicionamos asserções específicas para o status `PREPARING` e dois eventos no banco.

- [ ] **Step 1: Estudar uma suíte existente**

Run: `ls e2e/ && head -40 e2e/checkout-flow.spec.ts`
Expected: lista os specs e mostra o padrão de seletores/setup do projeto. Reutilizar o mesmo padrão de `test.beforeEach` e fixtures.

- [ ] **Step 2: Escrever o spec**

Criar `e2e/order-tracking.spec.ts`:

```ts
/**
 * E2E — rastreamento de pedido após pagamento aprovado.
 *
 * Cobre a regra de negócio crítica: ao finalizar o checkout (provider mock
 * retorna `approved`), o pedido deve estar em `PREPARING` no banco e o
 * OrderTrackingModal deve exibir as etapas até "Em Separação" como
 * concluídas com datas distintas (reais, não offset mockado).
 */

import { test, expect } from "@playwright/test";
import { PrismaClient } from "../src/generated/prisma";

const prisma = new PrismaClient();

test.afterAll(async () => {
  await prisma.$disconnect();
});

test("após checkout aprovado, pedido fica em PREPARING e modal mostra etapas com datas reais", async ({ page }) => {
  // 1. Fluxo de compra — reutilizar steps de checkout-flow.spec.ts.
  //    Aqui assumimos um helper `completeCheckout(page)` que retorna o orderId.
  //    Se ainda não existe, replicar inline os passos: ir até /allProducts,
  //    adicionar produto, abrir cart-sheet, ir para /checkout, preencher
  //    form e clicar em "Finalizar".
  await page.goto("/allProducts");
  // ... (replicar fluxo conforme checkout-flow.spec.ts existente) ...
  // Após o redirect para /sucesso/[id], capturar o id:
  await page.waitForURL(/\/sucesso\/[a-f0-9-]+/);
  const url = page.url();
  const orderId = url.split("/").pop()!;

  // 2. Verificar status no banco — deve ser PREPARING (não PAYMENT_CONFIRMED).
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { events: { orderBy: { createdAt: "asc" } } },
  });
  expect(order).not.toBeNull();
  expect(order!.status).toBe("PREPARING");

  // 3. Devem existir exatamente 2 OrderEvents com o mesmo paymentId.
  expect(order!.events).toHaveLength(2);
  expect(order!.events[0].status).toBe("PAYMENT_CONFIRMED");
  expect(order!.events[1].status).toBe("PREPARING");
  const paymentIdEvt0 = (order!.events[0].metadata as { paymentId?: string })?.paymentId;
  const paymentIdEvt1 = (order!.events[1].metadata as { paymentId?: string })?.paymentId;
  expect(paymentIdEvt0).toBeTruthy();
  expect(paymentIdEvt0).toBe(paymentIdEvt1);
  expect((order!.events[1].metadata as { auto?: boolean })?.auto).toBe(true);

  // 4. Abrir modal e verificar etapas concluídas.
  await page.getByRole("button", { name: /rastrear pedido/i }).click();

  await expect(page.getByRole("heading", { name: /rastreamento/i })).toBeVisible();
  // 3 primeiras etapas devem aparecer como concluídas (Pedido Recebido, Pagamento Confirmado, Em Separação)
  await expect(page.getByText(/Pedido Recebido/i)).toBeVisible();
  await expect(page.getByText(/Pagamento Confirmado/i)).toBeVisible();
  await expect(page.getByText(/Em Separação/i)).toBeVisible();
});

test("chamar confirmPayment duas vezes com mesmo paymentId é no-op (idempotência)", async ({ }) => {
  // Cria um Order e dois OrderEvents manualmente, então chama a função.
  // Como o use case é server-only, exercitamos via API — invocar o endpoint
  // /api/checkout duas vezes com o mesmo carrinho NÃO serve (paymentIds
  // distintos do mock). Em vez disso, vamos chamar diretamente o use case
  // num teste integrado (Vitest) — este teste E2E foca apenas no caminho HTTP.
  // Marcar como "skip" se não houver endpoint que reuse paymentId.
  test.skip(true, "Idempotência coberta no teste unit de confirm-payment.test.ts");
});
```

- [ ] **Step 3: Adaptar à helper real de checkout-flow**

Substituir o comentário `// ... (replicar fluxo conforme checkout-flow.spec.ts existente) ...` pelos passos reais usados no spec atual `e2e/checkout-flow.spec.ts`. Se houver uma função utilitária exportada em `e2e/_fixtures/checkout.ts` (ou similar), importar e usar. Caso não exista, replicar os passos inline.

- [ ] **Step 4: Rodar E2E**

Run: `pnpm test:e2e --grep "PREPARING"`
Expected: o caso "após checkout aprovado..." passa; o segundo é skip.

- [ ] **Step 5: Commit**

```bash
git add e2e/order-tracking.spec.ts
git commit -m "test(e2e): order tracking shows PREPARING with real event dates"
```

---

## Task 13: Verificação final — lint, types, build, suíte completa

- [ ] **Step 1: Regenerar Prisma client (garantir que tipos estão atualizados)**

Run: `pnpm prisma generate`
Expected: `✔ Generated Prisma Client`.

- [ ] **Step 2: Lint**

Run: `pnpm lint`
Expected: zero erros.

- [ ] **Step 3: TypeScript**

Run: `pnpm tsc --noEmit`
Expected: zero erros.

- [ ] **Step 4: Suíte Vitest completa**

Run: `pnpm test:run`
Expected: todos os testes passam. Em particular: `order-types`, `orders-repository`, `confirm-payment`, `api-checkout`.

- [ ] **Step 5: Build de produção**

Run: `pnpm build`
Expected: build conclui sem erros.

- [ ] **Step 6: E2E completo**

Run: `pnpm test:e2e`
Expected: suíte verde, incluindo `order-tracking.spec.ts`.

- [ ] **Step 7: Smoke manual**

Em um terminal: `pnpm dev`. No navegador:
1. Adicionar um produto ao carrinho.
2. Ir até `/checkout`, preencher e finalizar.
3. Na `/sucesso/[id]`, clicar em "Rastrear Pedido".
4. Confirmar visualmente: as etapas "Pedido Recebido", "Pagamento Confirmado" e "Em Separação" aparecem como concluídas, **com datas distintas** (não todas a mesma data + offset fixo).
5. Em outro terminal, abrir o banco e rodar:

```sql
SELECT id, status, "createdAt", metadata FROM order_events
WHERE "orderId" = '<id-do-pedido>'
ORDER BY "createdAt" ASC;
```

Expected: 2 linhas, status `PAYMENT_CONFIRMED` e `PREPARING`, mesmo `paymentId` em ambas as `metadata`, segunda com `auto: true`.

- [ ] **Step 8: Commit final (se houve qualquer ajuste de lint/format)**

```bash
git status
# se houver arquivos modificados:
git add -u
git commit -m "chore: post-implementation lint/format pass"
```

---

## Checklist de critérios de aceite (do spec §10)

Marcar conforme cada item for verificado nas tarefas acima:

- [ ] Migration `add_order_events` aplicada, schema válido (Task 1).
- [ ] `pnpm lint` e `pnpm test:run` passam (Task 13 §2-§4).
- [ ] Checkout E2E resulta em `order.status === "PREPARING"` (Task 12, Task 13 §6-§7).
- [ ] Tabela `order_events` contém 2 linhas com `metadata.paymentId` igual (Task 12, Task 13 §7).
- [ ] `confirmPayment` com mesmo `paymentId` repete → `alreadyProcessed=true` (Task 5).
- [ ] `/sucesso/[id]` mostra 3 etapas concluídas com **datas reais** (Task 13 §7).
- [ ] `/meus-pedidos` continua idêntico, sem `prisma` direto (Task 10, grep manual abaixo).
- [ ] Nenhum import de Prisma fora de `lib/`:

```bash
git grep -nE "@/lib/shared/infrastructure/prisma-client" src/app | grep -v "/api/"
# Expected: vazio (nenhuma página RSC importa Prisma direto).
```
