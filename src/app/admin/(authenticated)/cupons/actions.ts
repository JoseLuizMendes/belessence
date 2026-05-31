"use server";

/**
 * Server Actions — Admin Cupons (CRUD)
 * ─────────────────────────────────────────────────────────────────────
 * Criar/editar via Dialog na lista (sem redirect — retornam { ok | error }).
 * Toggle de ativo e exclusão são chamadas diretas por id.
 * Validação compartilhada em `adminCouponSchema` (@/lib/validations).
 */

import { prisma } from "@/lib/shared/infrastructure/prisma-client";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { adminCouponSchema } from "@/lib/shared/domain/zod-schemas";

export interface CouponActionResult {
  ok: boolean;
  error?: string;
  /** Erros por campo (quando a validação Zod falha). */
  fieldErrors?: Record<string, string[] | undefined>;
}

/** Converte a FormData do form em objeto com tipos JS corretos. */
function parseCouponForm(formData: FormData) {
  const num = (key: string): number | null => {
    const raw = formData.get(key);
    if (raw == null || String(raw).trim() === "") return null;
    const n = Number(String(raw).replace(",", "."));
    return Number.isFinite(n) ? n : NaN; // NaN deixa o Zod reprovar
  };

  const expiresRaw = formData.get("expiresAt");
  const expiresAt =
    expiresRaw && String(expiresRaw).trim() !== ""
      ? new Date(String(expiresRaw))
      : null;

  return {
    code: String(formData.get("code") ?? ""),
    type: String(formData.get("type") ?? ""),
    value: num("value") ?? 0,
    minOrder: num("minOrder"),
    maxUses: num("maxUses"),
    expiresAt:
      expiresAt && Number.isNaN(expiresAt.getTime()) ? null : expiresAt,
    active: formData.get("active") === "true",
  };
}

function friendlyError(err: unknown): string {
  if (
    err instanceof Prisma.PrismaClientKnownRequestError &&
    err.code === "P2002"
  ) {
    return "Já existe um cupom com esse código.";
  }
  return "Não foi possível salvar o cupom. Tente novamente.";
}

export async function createCoupon(
  formData: FormData,
): Promise<CouponActionResult> {
  const parsed = adminCouponSchema.safeParse(parseCouponForm(formData));
  if (!parsed.success) {
    return { ok: false, fieldErrors: parsed.error.flatten().fieldErrors };
  }

  try {
    await prisma.coupon.create({
      data: {
        code: parsed.data.code,
        type: parsed.data.type,
        value: parsed.data.value,
        minOrder: parsed.data.minOrder,
        maxUses: parsed.data.maxUses,
        expiresAt: parsed.data.expiresAt,
        active: parsed.data.active,
      },
    });
  } catch (err) {
    return { ok: false, error: friendlyError(err) };
  }

  revalidatePath("/admin/cupons");
  return { ok: true };
}

export async function updateCoupon(
  id: string,
  formData: FormData,
): Promise<CouponActionResult> {
  const parsed = adminCouponSchema.safeParse(parseCouponForm(formData));
  if (!parsed.success) {
    return { ok: false, fieldErrors: parsed.error.flatten().fieldErrors };
  }

  try {
    await prisma.coupon.update({
      where: { id },
      data: {
        code: parsed.data.code,
        type: parsed.data.type,
        value: parsed.data.value,
        minOrder: parsed.data.minOrder,
        maxUses: parsed.data.maxUses,
        expiresAt: parsed.data.expiresAt,
        active: parsed.data.active,
      },
    });
  } catch (err) {
    return { ok: false, error: friendlyError(err) };
  }

  revalidatePath("/admin/cupons");
  return { ok: true };
}

export async function toggleCouponActive(
  id: string,
  active: boolean,
): Promise<CouponActionResult> {
  try {
    await prisma.coupon.update({ where: { id }, data: { active } });
  } catch {
    return { ok: false, error: "Não foi possível alterar o status." };
  }
  revalidatePath("/admin/cupons");
  return { ok: true };
}

export async function deleteCoupon(id: string): Promise<CouponActionResult> {
  try {
    await prisma.coupon.delete({ where: { id } });
  } catch {
    return { ok: false, error: "Não foi possível excluir o cupom." };
  }
  revalidatePath("/admin/cupons");
  return { ok: true };
}
