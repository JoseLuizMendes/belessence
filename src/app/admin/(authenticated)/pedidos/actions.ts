"use server";

/**
 * Server Actions — Admin Pedidos
 * Atualiza status de pedido com validação Zod.
 */

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { orderStatusSchema } from "@/lib/validations";

export async function updateOrderStatus(orderId: string, formData: FormData) {
  const raw = {
    status: String(formData.get("status") ?? ""),
    trackingCode: formData.get("trackingCode")
      ? String(formData.get("trackingCode"))
      : undefined,
  };

  const parsed = orderStatusSchema.safeParse(raw);
  if (!parsed.success) {
    throw new Error(
      "Validação falhou: " +
        JSON.stringify(parsed.error.flatten().fieldErrors),
    );
  }

  await prisma.order.update({
    where: { id: orderId },
    data: {
      status: parsed.data.status,
      ...(parsed.data.trackingCode
        ? { trackingCode: parsed.data.trackingCode }
        : {}),
    },
  });

  revalidatePath("/admin/pedidos");
  revalidatePath(`/admin/pedidos/${orderId}`);
}
