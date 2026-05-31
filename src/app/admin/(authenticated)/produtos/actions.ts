"use server";

/**
 * Server Actions para CRUD de produtos no admin.
 * ─────────────────────────────────────────────────────────────────────
 * Aplica a semântica de transição de status via `applyStatusTransition`:
 *  - NORMAL → PROMOTION  salva originalPrice = preço atual, price = promoPrice
 *  - PROMOTION → NORMAL  restaura price = originalPrice anterior
 *
 * Validações:
 *  - Imagens obrigatórias (pelo menos 1)
 *  - Slug em kebab-case
 *  - Preço positivo
 *  - Em PROMOTION: promoPrice < price, endsAt > startsAt
 */

import { prisma } from "@/lib/shared/infrastructure/prisma-client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import {
  applyStatusTransition,
  StatusTransitionError,
} from "@/lib/product-status";
import type { ProductStatus } from "@prisma/client";

const productSchema = z.object({
  name: z.string().min(2, "Nome obrigatório"),
  slug: z
    .string()
    .min(2, "Slug obrigatório")
    .regex(/^[a-z0-9-]+$/, "Slug deve ser kebab-case (apenas letras, números e hífens)"),
  shortDescription: z.string().min(5, "Descrição curta obrigatória"),
  description: z.string().min(10, "Descrição completa obrigatória"),
  price: z.coerce.number().positive("Preço deve ser positivo"),
  originalPrice: z.coerce.number().optional().nullable(),
  badge: z.string().optional().nullable(),
  badgeVariant: z
    .enum(["default", "secondary", "destructive", "outline"])
    .optional()
    .nullable(),
  collection: z.string().min(1, "Coleção obrigatória"),
  category: z.string().min(1, "Categoria obrigatória"),
  gender: z.enum(["FEMININO", "MASCULINO", "UNISSEX"]).default("UNISSEX"),
  stock: z.coerce.number().int().min(0, "Estoque inválido"),
  images: z.string().min(1, "Pelo menos 1 imagem"),
  features: z.string(),
  // Status & flags
  status: z
    .enum(["NORMAL", "PROMOTION", "COMING_SOON", "DISCONTINUED"])
    .default("NORMAL"),
  isLimitedEdition: z.coerce.boolean().optional().default(false),
  markedAsNewUntil: z.string().optional().nullable(),
  // Promo
  promoPrice: z.coerce.number().optional().nullable(),
  promotionStartsAt: z.string().optional().nullable(),
  promotionEndsAt: z.string().optional().nullable(),
});

type ParsedForm = z.infer<typeof productSchema>;

function parseFormData(formData: FormData):
  | { error: Record<string, string[] | undefined>; data: null }
  | {
      error: null;
      data: Omit<ParsedForm, "images" | "features"> & {
        images: string[];
        features: string[];
      };
    } {
  const raw = {
    name: String(formData.get("name") ?? ""),
    slug: String(formData.get("slug") ?? "").toLowerCase().trim(),
    shortDescription: String(formData.get("shortDescription") ?? ""),
    description: String(formData.get("description") ?? ""),
    price: String(formData.get("price") ?? "0"),
    originalPrice: formData.get("originalPrice")
      ? String(formData.get("originalPrice"))
      : null,
    badge: formData.get("badge") ? String(formData.get("badge")) : null,
    badgeVariant: formData.get("badgeVariant")
      ? String(formData.get("badgeVariant"))
      : null,
    collection: String(formData.get("collection") ?? ""),
    category: String(formData.get("category") ?? ""),
    gender: String(formData.get("gender") ?? "UNISSEX"),
    stock: String(formData.get("stock") ?? "0"),
    images: String(formData.get("images") ?? ""),
    features: String(formData.get("features") ?? ""),
    status: String(formData.get("status") ?? "NORMAL"),
    isLimitedEdition: formData.get("isLimitedEdition") === "true",
    markedAsNewUntil: formData.get("markedAsNewUntil")
      ? String(formData.get("markedAsNewUntil"))
      : null,
    promoPrice: formData.get("promoPrice")
      ? String(formData.get("promoPrice"))
      : null,
    promotionStartsAt: formData.get("promotionStartsAt")
      ? String(formData.get("promotionStartsAt"))
      : null,
    promotionEndsAt: formData.get("promotionEndsAt")
      ? String(formData.get("promotionEndsAt"))
      : null,
  };

  const parsed = productSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors, data: null };
  }

  const images = parsed.data.images
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);

  if (images.length === 0) {
    return { error: { images: ["Pelo menos 1 imagem"] }, data: null };
  }

  const features = parsed.data.features
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);

  return {
    error: null,
    data: {
      ...parsed.data,
      images,
      features,
    },
  };
}

function toDate(value: string | null | undefined): Date | null {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d;
}

/**
 * Aplica a transição de status e retorna o payload para Prisma.
 * Encapsula `applyStatusTransition` + parsing de datas.
 */
function buildPayload(
  data: ReturnType<typeof parseFormData> extends { data: infer D } ? D : never,
  currentStatus: ProductStatus,
  currentOriginalPrice: number | null,
) {
  if (!data) throw new Error("dados ausentes");

  const transition = applyStatusTransition({
    currentStatus,
    currentPrice: data.price,
    currentOriginalPrice,
    nextStatus: data.status,
    promoPrice: data.promoPrice ?? null,
    promotionStartsAt: toDate(data.promotionStartsAt),
    promotionEndsAt: toDate(data.promotionEndsAt),
    formPrice: data.price,
    formOriginalPrice:
      data.originalPrice != null && Number.isFinite(data.originalPrice)
        ? data.originalPrice
        : null,
  });

  return {
    name: data.name,
    slug: data.slug,
    shortDescription: data.shortDescription,
    description: data.description,
    price: transition.price,
    originalPrice: transition.originalPrice,
    badge: data.badge ?? null,
    badgeVariant: data.badgeVariant ?? null,
    collection: data.collection,
    category: data.category,
    gender: data.gender,
    stock: data.stock,
    images: data.images,
    features: data.features,
    status: transition.status,
    isLimitedEdition: data.isLimitedEdition,
    markedAsNewUntil: toDate(data.markedAsNewUntil),
    promotionStartsAt: transition.promotionStartsAt,
    promotionEndsAt: transition.promotionEndsAt,
  };
}

export async function createProduct(formData: FormData) {
  const { error, data } = parseFormData(formData);
  if (error || !data) {
    throw new Error("Dados inválidos: " + JSON.stringify(error));
  }

  try {
    // Em CREATE, o "currentStatus" é NORMAL (não existe ainda).
    const payload = buildPayload(data, "NORMAL", null);
    await prisma.product.create({ data: payload });
  } catch (err) {
    if (err instanceof StatusTransitionError) {
      throw new Error(err.message);
    }
    throw err;
  }

  revalidatePath("/admin/produtos");
  revalidatePath("/allProducts");
  revalidatePath("/");
  redirect("/admin/produtos");
}

export async function updateProduct(id: string, formData: FormData) {
  const { error, data } = parseFormData(formData);
  if (error || !data) {
    throw new Error("Dados inválidos: " + JSON.stringify(error));
  }

  // Precisamos do estado atual para decidir a transição corretamente.
  const current = await prisma.product.findUnique({
    where: { id },
    select: { status: true, originalPrice: true, price: true },
  });

  if (!current) throw new Error("Produto não encontrado");

  try {
    const payload = buildPayload(
      data,
      current.status,
      current.originalPrice != null ? Number(current.originalPrice) : null,
    );
    await prisma.product.update({ where: { id }, data: payload });
  } catch (err) {
    if (err instanceof StatusTransitionError) {
      throw new Error(err.message);
    }
    throw err;
  }

  revalidatePath("/admin/produtos");
  revalidatePath(`/product/${data.slug}`);
  revalidatePath("/allProducts");
  revalidatePath("/");
  redirect("/admin/produtos");
}

export async function deleteProduct(id: string) {
  await prisma.product.delete({ where: { id } });
  revalidatePath("/admin/produtos");
  revalidatePath("/allProducts");
  revalidatePath("/");
  redirect("/admin/produtos");
}
