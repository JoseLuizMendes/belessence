import "server-only";

/**
 * Acesso ao banco da wishlist — por usuário. Server-only.
 * Substitui o armazenamento global em localStorage: cada usuário só
 * enxerga e altera os próprios favoritos.
 */

import { prisma } from "@/lib/prisma";

/** IDs dos produtos favoritados pelo usuário. */
export async function getWishlistProductIds(userId: string): Promise<string[]> {
  const rows = await prisma.wishlistItem.findMany({
    where: { userId },
    select: { productId: true },
  });
  return rows.map((r) => r.productId);
}

/**
 * Alterna um produto na wishlist do usuário.
 * Retorna `true` se ficou favoritado, `false` se foi removido.
 */
export async function toggleWishlist(
  userId: string,
  productId: string,
): Promise<boolean> {
  const existing = await prisma.wishlistItem.findUnique({
    where: { userId_productId: { userId, productId } },
    select: { id: true },
  });

  if (existing) {
    await prisma.wishlistItem.delete({ where: { id: existing.id } });
    return false;
  }

  await prisma.wishlistItem.create({ data: { userId, productId } });
  return true;
}

export async function removeWishlistItem(
  userId: string,
  productId: string,
): Promise<void> {
  await prisma.wishlistItem.deleteMany({ where: { userId, productId } });
}

export async function clearWishlist(userId: string): Promise<void> {
  await prisma.wishlistItem.deleteMany({ where: { userId } });
}
