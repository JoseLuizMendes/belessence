"use server";

/**
 * Server Actions para CRUD de produtos no admin.
 */

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

const productSchema = z.object({
  name: z.string().min(2, "Nome obrigatório"),
  slug: z.string().min(2, "Slug obrigatório").regex(/^[a-z0-9-]+$/, "Slug deve ser kebab-case (apenas letras, números e hífens)"),
  shortDescription: z.string().min(5, "Descrição curta obrigatória"),
  description: z.string().min(10, "Descrição completa obrigatória"),
  price: z.coerce.number().positive("Preço deve ser positivo"),
  originalPrice: z.coerce.number().optional().nullable(),
  badge: z.string().optional().nullable(),
  badgeVariant: z.enum(["default", "secondary", "destructive", "outline"]).optional().nullable(),
  collection: z.string().min(1, "Coleção obrigatória"),
  category: z.string().min(1, "Categoria obrigatória"),
  stock: z.coerce.number().int().min(0, "Estoque inválido"),
  images: z.string().min(1, "Pelo menos 1 imagem"),
  features: z.string(),
});

function parseFormData(formData: FormData) {
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
    stock: String(formData.get("stock") ?? "0"),
    images: String(formData.get("images") ?? ""),
    features: String(formData.get("features") ?? ""),
  };

  const parsed = productSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors, data: null };
  }

  const images = parsed.data.images
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
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

export async function createProduct(formData: FormData) {
  const { error, data } = parseFormData(formData);
  if (error || !data) {
    throw new Error("Dados inválidos: " + JSON.stringify(error));
  }

  await prisma.product.create({
    data: {
      name: data.name,
      slug: data.slug,
      shortDescription: data.shortDescription,
      description: data.description,
      price: data.price,
      originalPrice: data.originalPrice ?? null,
      badge: data.badge ?? null,
      badgeVariant: data.badgeVariant ?? null,
      collection: data.collection,
      category: data.category,
      stock: data.stock,
      images: data.images,
      features: data.features,
    },
  });

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

  await prisma.product.update({
    where: { id },
    data: {
      name: data.name,
      slug: data.slug,
      shortDescription: data.shortDescription,
      description: data.description,
      price: data.price,
      originalPrice: data.originalPrice ?? null,
      badge: data.badge ?? null,
      badgeVariant: data.badgeVariant ?? null,
      collection: data.collection,
      category: data.category,
      stock: data.stock,
      images: data.images,
      features: data.features,
    },
  });

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
