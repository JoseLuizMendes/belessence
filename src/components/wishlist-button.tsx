"use client";

/**
 * WishlistButton — Belessence
 * ─────────────────────────────────────────────────────────────────────
 * Botão de favoritar com ícone de coração. Toggle no wishlist store.
 * Mostra toast ao adicionar/remover. Hydration-safe (não renderiza estado
 * preenchido até o client montar para evitar mismatch).
 */

import { Heart } from "lucide-react";
import { useWishlistStore } from "@/lib/wishlist/presentation/wishlist-store";
import { toast } from "sonner";
import { useHasMounted } from "@/lib/hooks/use-has-mounted";
import { useRequireAuth } from "@/lib/hooks/use-require-auth";

interface WishlistButtonProps {
  productId: string;
  productName: string;
  className?: string;
  /** Variante visual */
  variant?: "card" | "pdp";
}

export function WishlistButton({
  productId,
  productName,
  className = "",
  variant = "card",
}: WishlistButtonProps) {
  const mounted = useHasMounted();
  const toggle = useWishlistStore((s) => s.toggle);
  const has = useWishlistStore((s) => s.items.includes(productId));
  const requireAuth = useRequireAuth();

  const isFavorited = mounted && has;

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    requireAuth(() => {
      toggle(productId);
      if (has) {
        toast.success(`Removido dos favoritos`, {
          description: productName,
        });
      } else {
        toast.success(`Adicionado aos favoritos ❤`, {
          description: productName,
        });
      }
    });
  };

  const baseClasses =
    variant === "card"
      ? "flex h-9 w-9 items-center justify-center rounded-full bg-surface-panel/90 backdrop-blur-sm shadow-card transition-all hover:scale-110"
      : "flex h-11 w-11 items-center justify-center rounded-full border border-border-subtle bg-surface-panel transition-all hover:border-brand-wine";

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={isFavorited ? "Remover dos favoritos" : "Adicionar aos favoritos"}
      aria-pressed={isFavorited}
      className={`${baseClasses} ${className}`}
    >
      <Heart
        className={`h-4 w-4 transition-all ${
          isFavorited
            ? "fill-brand-wine text-brand-wine scale-110"
            : "text-ink-soft hover:text-brand-wine"
        }`}
        strokeWidth={1.5}
      />
    </button>
  );
}
