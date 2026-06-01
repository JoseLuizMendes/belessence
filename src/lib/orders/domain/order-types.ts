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
