"use client";

/**
 * FavoritosClient — Belessence
 * ─────────────────────────────────────────────────────────────────────
 * Lê wishlist store, busca produtos via /api/products?ids=, renderiza grid
 * usando o <ProductCard> compartilhado. Limite suave de 24 visíveis com
 * botão "Mostrar todos".
 */

import { useEffect, useState } from "react";
import { useWishlistStore } from "@/lib/wishlist/presentation/wishlist-store";
import { useHasMounted } from "@/lib/hooks/use-has-mounted";
import { Button } from "./ui/button";
import { Spinner } from "./ui/spinner";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "./ui/empty";
import { ProductCard } from "./product-card";
import { Heart, ArrowRight, Trash2 } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import type { Product } from "@/lib/products/infrastructure/persistence/products-repository";

const SOFT_LIMIT = 24;

export function FavoritosClient() {
  const ids = useWishlistStore((s) => s.items);
  const clear = useWishlistStore((s) => s.clear);

  const mounted = useHasMounted();
  const [fetchedProducts, setFetchedProducts] = useState<Product[] | null>(null);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    if (!mounted) return;
    if (ids.length === 0) return;
    let cancelled = false;
    fetch(`/api/products?ids=${ids.join(",")}`)
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled) setFetchedProducts(data);
      })
      .catch(() => {
        if (!cancelled) {
          toast.error("Erro ao carregar favoritos");
          setFetchedProducts([]);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [ids, mounted]);

  const products: Product[] | null =
    ids.length === 0
      ? []
      : fetchedProducts
        ? fetchedProducts.filter((p) => ids.includes(p.id))
        : null;

  const handleClearAll = () => {
    if (confirm("Remover todos os favoritos?")) {
      clear();
      toast.success("Lista de favoritos limpa");
    }
  };

  if (!mounted) {
    return (
      <div className="text-center py-24">
        <Spinner className="size-8 text-brand-wine mx-auto" />
      </div>
    );
  }

  const Header = (
    <div className="text-center mb-10 sm:mb-14">
      <p className="text-[11px] font-medium tracking-[0.32em] uppercase text-brand-wine mb-4">
        Mari Beauty
      </p>
      <h1 className="font-playfair italic text-[clamp(2.4rem,5vw,3.8rem)] leading-tight tracking-[-0.02em] text-ink-strong mb-4">
        Meus favoritos
      </h1>
      <p className="text-sm sm:text-base text-ink-soft font-light max-w-md mx-auto">
        {ids.length === 0
          ? "Sua lista de desejos ainda está vazia."
          : `${ids.length} ${ids.length === 1 ? "fragrância salva" : "fragrâncias salvas"}`}
      </p>
      <div className="mx-auto mt-6 h-px w-12 bg-brand-wine/60" />
    </div>
  );

  if (ids.length === 0) {
    return (
      <div>
        {Header}
        <Empty className="max-w-md mx-auto bg-surface-panel rounded-token-md py-12">
          <EmptyHeader>
            <EmptyMedia
              variant="icon"
              className="size-16 rounded-full bg-surface-section"
            >
              <Heart className="size-7 text-brand-wine/60" strokeWidth={1.2} />
            </EmptyMedia>
            <EmptyTitle className="text-base text-ink-strong font-medium">
              Nenhum favorito ainda
            </EmptyTitle>
            <EmptyDescription className="text-sm text-ink-soft">
              Clique no coração dos produtos para adicioná-los aqui.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Link href="/allProducts">
              <Button className="loreal-btn-pill h-11 px-6 bg-brand-wine text-brand-pink text-[11px] font-medium tracking-[0.18em] uppercase hover:bg-brand-wine/90">
                Explorar coleção
                <ArrowRight className="ml-2 h-3.5 w-3.5" />
              </Button>
            </Link>
          </EmptyContent>
        </Empty>
      </div>
    );
  }

  if (!products) {
    return (
      <div>
        {Header}
        <div className="text-center py-12">
          <Spinner className="size-8 text-brand-wine mx-auto" />
        </div>
      </div>
    );
  }

  const total = products.length;
  const visible = showAll ? products : products.slice(0, SOFT_LIMIT);
  const hasMore = total > SOFT_LIMIT && !showAll;

  return (
    <div>
      {Header}

      <div className="flex justify-between items-center mb-6">
        <p className="text-xs text-ink-soft">
          {hasMore ? `Mostrando ${SOFT_LIMIT} de ${total}` : `${total} ${total === 1 ? "item" : "itens"}`}
        </p>
        <Button
          type="button"
          variant="ghost"
          onClick={handleClearAll}
          className="h-auto p-0 gap-2 text-xs text-ink-soft hover:bg-transparent hover:text-destructive"
        >
          <Trash2 className="h-3.5 w-3.5" />
          Limpar tudo
        </Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
        {visible.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>

      {hasMore && (
        <div className="mt-10 flex justify-center">
          <Button
            type="button"
            onClick={() => setShowAll(true)}
            className="loreal-btn-pill px-6 h-11 bg-brand-wine text-brand-pink text-[11px] font-medium tracking-[0.18em] uppercase hover:bg-brand-wine/90"
          >
            Mostrar todos ({total})
          </Button>
        </div>
      )}
    </div>
  );
}
