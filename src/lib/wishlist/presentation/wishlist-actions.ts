"use server";

/**
 * Server Actions da wishlist. Pegam o userId da sessão (auth) e delegam ao
 * data layer. Se não houver sessão, são no-ops seguros — a UI só dispara
 * essas ações para usuários logados (auth-gate), isto é uma rede de proteção.
 */

import { auth } from "@/lib/auth/infrastructure/external/auth";
import {
  getWishlistProductIds,
  toggleWishlist,
  removeWishlistItem,
  clearWishlist,
} from "@/lib/wishlist/infrastructure/persistence/wishlist-repository";

async function currentUserId(): Promise<string | null> {
  const session = await auth();
  return session?.user?.id ?? null;
}

export async function getWishlistAction(): Promise<string[]> {
  const userId = await currentUserId();
  if (!userId) return [];
  return getWishlistProductIds(userId);
}

export async function toggleWishlistAction(
  productId: string,
): Promise<{ ok: boolean; favorited: boolean }> {
  const userId = await currentUserId();
  if (!userId) return { ok: false, favorited: false };
  const favorited = await toggleWishlist(userId, productId);
  return { ok: true, favorited };
}

export async function removeWishlistAction(
  productId: string,
): Promise<{ ok: boolean }> {
  const userId = await currentUserId();
  if (!userId) return { ok: false };
  await removeWishlistItem(userId, productId);
  return { ok: true };
}

export async function clearWishlistAction(): Promise<{ ok: boolean }> {
  const userId = await currentUserId();
  if (!userId) return { ok: false };
  await clearWishlist(userId);
  return { ok: true };
}
