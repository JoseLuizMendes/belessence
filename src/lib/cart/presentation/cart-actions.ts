"use server";

/**
 * Server Actions do carrinho. Pegam o userId da sessão (auth) e delegam ao
 * data layer. No-ops seguros se deslogado.
 */

import { auth } from "@/lib/auth";
import {
  getCart,
  addToCart,
  setCartQuantity,
  removeFromCart,
  clearCart,
} from "@/lib/cart/infrastructure/persistence/cart-repository";
import type { CartItem } from "@/lib/cart/presentation/cart-store";

async function currentUserId(): Promise<string | null> {
  const session = await auth();
  return session?.user?.id ?? null;
}

export async function getCartAction(): Promise<CartItem[]> {
  const userId = await currentUserId();
  if (!userId) return [];
  return getCart(userId);
}

export async function addToCartAction(
  productId: string,
  quantity = 1,
): Promise<{ ok: boolean }> {
  const userId = await currentUserId();
  if (!userId) return { ok: false };
  await addToCart(userId, productId, quantity);
  return { ok: true };
}

export async function setCartQuantityAction(
  productId: string,
  quantity: number,
): Promise<{ ok: boolean }> {
  const userId = await currentUserId();
  if (!userId) return { ok: false };
  await setCartQuantity(userId, productId, quantity);
  return { ok: true };
}

export async function removeFromCartAction(
  productId: string,
): Promise<{ ok: boolean }> {
  const userId = await currentUserId();
  if (!userId) return { ok: false };
  await removeFromCart(userId, productId);
  return { ok: true };
}

export async function clearCartAction(): Promise<{ ok: boolean }> {
  const userId = await currentUserId();
  if (!userId) return { ok: false };
  await clearCart(userId);
  return { ok: true };
}
