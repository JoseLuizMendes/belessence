import "server-only";

/**
 * Acesso ao banco do carrinho — por usuário. Server-only.
 * Cada usuário só enxerga/altera o próprio carrinho. O preço retornado é
 * sempre relido do produto no banco (nunca confiar no client).
 */

import { prisma } from "@/lib/shared/infrastructure/prisma-client";
import type { CartItem } from "@/lib/cart/presentation/cart-store";

type BadgeVariant = CartItem["badgeVariant"];

function toBadgeVariant(value: string | null): BadgeVariant {
  if (
    value === "default" ||
    value === "secondary" ||
    value === "destructive" ||
    value === "outline"
  ) {
    return value;
  }
  return undefined;
}

/** Carrinho do usuário, enriquecido com dados atuais do produto. */
export async function getCart(userId: string): Promise<CartItem[]> {
  const rows = await prisma.cartItem.findMany({
    where: { userId },
    include: { product: true },
    orderBy: { createdAt: "asc" },
  });

  return rows.map((r) => ({
    id: r.product.id,
    slug: r.product.slug,
    name: r.product.name,
    shortDescription: r.product.shortDescription,
    description: r.product.description,
    price: Number(r.product.price),
    originalPrice:
      r.product.originalPrice != null ? Number(r.product.originalPrice) : undefined,
    badge: r.product.badge ?? undefined,
    badgeVariant: toBadgeVariant(r.product.badgeVariant),
    image: r.product.images[0] ?? "",
    quantity: r.quantity,
  }));
}

/** Adiciona (ou incrementa) um produto no carrinho. */
export async function addToCart(
  userId: string,
  productId: string,
  quantity = 1,
): Promise<void> {
  await prisma.cartItem.upsert({
    where: { userId_productId: { userId, productId } },
    update: { quantity: { increment: quantity } },
    create: { userId, productId, quantity },
  });
}

/** Define a quantidade exata; quantidade <= 0 remove o item. */
export async function setCartQuantity(
  userId: string,
  productId: string,
  quantity: number,
): Promise<void> {
  if (quantity <= 0) {
    await prisma.cartItem.deleteMany({ where: { userId, productId } });
    return;
  }
  await prisma.cartItem.upsert({
    where: { userId_productId: { userId, productId } },
    update: { quantity },
    create: { userId, productId, quantity },
  });
}

export async function removeFromCart(
  userId: string,
  productId: string,
): Promise<void> {
  await prisma.cartItem.deleteMany({ where: { userId, productId } });
}

export async function clearCart(userId: string): Promise<void> {
  await prisma.cartItem.deleteMany({ where: { userId } });
}
