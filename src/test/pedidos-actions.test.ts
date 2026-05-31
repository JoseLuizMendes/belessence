/**
 * Testes — Server Action de pedidos (admin)
 * src/app/admin/(authenticated)/pedidos/actions.ts
 *
 * updateOrderStatus valida com Zod (orderStatusSchema) e atualiza via Prisma.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";

const { revalidatePath } = vi.hoisted(() => ({ revalidatePath: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath }));

import { updateOrderStatus } from "@/app/admin/(authenticated)/pedidos/actions";
import { prisma } from "@/lib/shared/infrastructure/prisma-client";

function form(fields: Record<string, string>): FormData {
  const fd = new FormData();
  for (const [k, v] of Object.entries(fields)) fd.set(k, v);
  return fd;
}

describe("updateOrderStatus", () => {
  beforeEach(() => vi.clearAllMocks());

  it("lança quando SHIPPED sem trackingCode (refine do Zod)", async () => {
    await expect(
      updateOrderStatus("ord-1", form({ status: "SHIPPED" })),
    ).rejects.toThrow(/Validação falhou/);
    expect(prisma.order.update).not.toHaveBeenCalled();
  });

  it("lança em status fora do enum", async () => {
    await expect(
      updateOrderStatus("ord-1", form({ status: "FOO" })),
    ).rejects.toThrow(/Validação falhou/);
  });

  it("atualiza status simples (PREPARING) e revalida os caminhos", async () => {
    vi.mocked(prisma.order.update).mockResolvedValueOnce({} as never);
    await updateOrderStatus("ord-1", form({ status: "PREPARING" }));

    expect(prisma.order.update).toHaveBeenCalledWith({
      where: { id: "ord-1" },
      data: { status: "PREPARING" },
    });
    expect(revalidatePath).toHaveBeenCalledWith("/admin/pedidos");
    expect(revalidatePath).toHaveBeenCalledWith("/admin/pedidos/ord-1");
  });

  it("inclui trackingCode no update quando SHIPPED + código presente", async () => {
    vi.mocked(prisma.order.update).mockResolvedValueOnce({} as never);
    await updateOrderStatus(
      "ord-2",
      form({ status: "SHIPPED", trackingCode: "BR123456789XX" }),
    );

    expect(prisma.order.update).toHaveBeenCalledWith({
      where: { id: "ord-2" },
      data: { status: "SHIPPED", trackingCode: "BR123456789XX" },
    });
  });
});
