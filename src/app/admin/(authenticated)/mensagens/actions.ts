"use server";

/**
 * Server Actions — Admin Mensagens (contato)
 * Marca como respondida/não respondida e exclui. Revalida a lista e o
 * dashboard (que conta mensagens não respondidas).
 */

import { prisma } from "@/lib/shared/infrastructure/prisma-client";
import { revalidatePath } from "next/cache";

export interface MessageActionResult {
  ok: boolean;
  error?: string;
}

export async function setMessageReplied(
  id: string,
  replied: boolean,
): Promise<MessageActionResult> {
  try {
    await prisma.contactMessage.update({ where: { id }, data: { replied } });
  } catch {
    return { ok: false, error: "Não foi possível atualizar a mensagem." };
  }
  revalidatePath("/admin/mensagens");
  revalidatePath("/admin");
  return { ok: true };
}

export async function deleteMessage(id: string): Promise<MessageActionResult> {
  try {
    await prisma.contactMessage.delete({ where: { id } });
  } catch {
    return { ok: false, error: "Não foi possível excluir a mensagem." };
  }
  revalidatePath("/admin/mensagens");
  revalidatePath("/admin");
  return { ok: true };
}
