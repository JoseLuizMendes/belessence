"use client";

/**
 * AuthDataSync — sincroniza carrinho e favoritos com a sessão.
 * ─────────────────────────────────────────────────────────────────────
 * - Login (authenticated): hidrata as stores com os dados do usuário no banco.
 * - Logout (unauthenticated): zera as stores, para que nenhum dado de um
 *   usuário fique visível para o próximo.
 * Montado uma vez no layout, dentro do SessionProvider. Não renderiza nada.
 */

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useCartStore } from "@/lib/cart/presentation/cart-store";
import { useWishlistStore } from "@/lib/wishlist-store";
import { useAuthGate } from "@/lib/auth-gate-store";
import { getCartAction } from "@/lib/cart/presentation/cart-actions";
import { getWishlistAction } from "@/lib/wishlist-actions";

export function AuthDataSync() {
  const { status } = useSession();

  useEffect(() => {
    let cancelled = false;

    if (status === "authenticated") {
      Promise.all([
        getWishlistAction().then((ids) => {
          if (!cancelled) useWishlistStore.getState().hydrate(ids);
        }),
        getCartAction().then((items) => {
          if (!cancelled) useCartStore.getState().hydrate(items);
        }),
      ])
        .catch(() => {})
        .finally(() => {
          // Roda a ação que disparou o login (curtir/adicionar) já sobre o
          // estado hidratado, evitando que a hidratação a sobrescreva.
          if (!cancelled) useAuthGate.getState().consumePending();
        });
    } else if (status === "unauthenticated") {
      useWishlistStore.getState().reset();
      useCartStore.getState().reset();
    }

    return () => {
      cancelled = true;
    };
  }, [status]);

  return null;
}
