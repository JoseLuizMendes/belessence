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
