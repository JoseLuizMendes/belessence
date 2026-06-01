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
