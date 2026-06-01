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
