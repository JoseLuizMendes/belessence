"use client";

/**
 * FavoritosClient — Belessence
 * ─────────────────────────────────────────────────────────────────────
 * Lê wishlist store, busca produtos via /api/products?ids=, renderiza grid.
 * Permite remover individual ou limpar tudo.
 */

import { useEffect, useState } from "react";
import { useWishlistStore } from "@/lib/wishlist-store";
import { useHasMounted } from "@/lib/hooks/use-has-mounted";
import { useCart } from "./cart";
import { WishlistButton } from "./wishlist-button";
import { Button } from "./ui/button";
import {
  Heart,
  ShoppingBag,
  ArrowRight,
  Trash2,
  Loader2,
} from "lucide-react";
import { formatPrice } from "@/api/utils";
import Link from "next/link";
import Image from "next/image";
import { toast } from "sonner";

interface Product {
  id: string;
  slug: string;
  name: string;
  shortDescription: string;
  price: number | string;
  originalPrice: number | string | null;
  badge: string | null;
  badgeVariant: string | null;
  images: string[];
}

export function FavoritosClient() {
  const ids = useWishlistStore((s) => s.items);
  const clear = useWishlistStore((s) => s.clear);
  const { addToCart } = useCart();

  const mounted = useHasMounted();
  // products = null → loading; Product[] → carregado (pode estar vazio)
  const [fetchedProducts, setFetchedProducts] = useState<Product[] | null>(
    null,
  );

  // Busca produtos sempre que IDs mudarem (apenas no client)
  useEffect(() => {
    if (!mounted) return;
    if (ids.length === 0) {
      // estado derivado: empty é derivado de ids em render, não setado aqui
      return;
    }
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

  // Derivação: empty se ids vazio; senão filtra para refletir o wishlist atual.
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

  // SSR placeholder (evita hydration mismatch)
  if (!mounted) {
    return (
      <div className="text-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-brand-wine mx-auto" />
      </div>
    );
  }

  // Header
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

  // Estado vazio
  if (ids.length === 0) {
    return (
      <div>
        {Header}
        <div className="max-w-md mx-auto text-center py-12 bg-surface-panel rounded-token-md">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-surface-section flex items-center justify-center">
            <Heart
              className="h-7 w-7 text-brand-wine/60"
              strokeWidth={1.2}
            />
          </div>
          <p className="text-base text-ink-strong font-medium mb-2">
            Nenhum favorito ainda
          </p>
          <p className="text-sm text-ink-soft mb-6">
            Clique no coração dos produtos para adicioná-los aqui.
          </p>
          <Link href="/allProducts">
            <Button className="loreal-btn-pill h-11 px-6 bg-brand-wine text-brand-pink text-[11px] font-medium tracking-[0.18em] uppercase hover:bg-brand-wine/90">
              Explorar coleção
              <ArrowRight className="ml-2 h-3.5 w-3.5" />
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // Loading produtos
  if (!products) {
    return (
      <div>
        {Header}
        <div className="text-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-brand-wine mx-auto" />
        </div>
      </div>
    );
  }

  return (
    <div>
      {Header}

      {/* Toolbar com limpar tudo */}
      <div className="flex justify-end mb-6">
        <button
          type="button"
          onClick={handleClearAll}
          className="inline-flex items-center gap-2 text-xs text-ink-soft hover:text-destructive transition-colors"
        >
          <Trash2 className="h-3.5 w-3.5" />
          Limpar tudo
        </button>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
        {products.map((product) => {
          const price = Number(product.price);
          const originalPrice = product.originalPrice
            ? Number(product.originalPrice)
            : null;

          return (
            <article
              key={product.id}
              className="group flex flex-col bg-surface-panel rounded-token-sm overflow-hidden transition-all duration-500 hover:shadow-card-hover"
            >
              <Link
                href={`/product/${product.slug}`}
                className="relative block overflow-hidden aspect-[3/4] bg-surface-section"
              >
                <Image
                  src={product.images[0]}
                  alt={product.name}
                  fill
                  className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                  sizes="(max-width: 768px) 50vw, 33vw"
                />

                {product.badge && (
                  <span className="absolute top-3 left-3 inline-flex items-center rounded-full bg-brand-wine px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.16em] text-brand-pink">
                    {product.badge}
                  </span>
                )}

                <div className="absolute top-3 right-3">
                  <WishlistButton
                    productId={product.id}
                    productName={product.name}
                  />
                </div>

                <button
                  type="button"
                  aria-label={`Adicionar ${product.name} ao carrinho`}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    addToCart({
                      id: product.id,
                      slug: product.slug,
                      name: product.name,
                      shortDescription: product.shortDescription,
                      price,
                      originalPrice: originalPrice ?? undefined,
                      badge: product.badge ?? undefined,
                      image: product.images[0],
                    });
                  }}
                  className="absolute bottom-3 right-3 flex h-10 w-10 items-center justify-center rounded-full bg-brand-wine text-brand-pink shadow-card opacity-0 translate-y-2 transition-all duration-300 group-hover:opacity-100 group-hover:translate-y-0 hover:bg-ink-strong"
                >
                  <ShoppingBag className="h-4 w-4" strokeWidth={1.5} />
                </button>
              </Link>

              <div className="p-4 sm:p-5 text-center">
                <Link href={`/product/${product.slug}`}>
                  <h3 className="font-playfair italic text-base sm:text-lg leading-snug text-ink-strong transition-opacity hover:opacity-70 line-clamp-2 mb-2">
                    {product.name}
                  </h3>
                </Link>

                <div className="flex items-center justify-center gap-2 mb-3">
                  {originalPrice && (
                    <span className="text-xs text-ink-muted line-through">
                      {formatPrice(originalPrice)}
                    </span>
                  )}
                  <span className="price-display text-base sm:text-lg font-semibold text-brand-wine">
                    {formatPrice(price)}
                  </span>
                </div>

                <Link
                  href={`/product/${product.slug}`}
                  className="inline-flex items-center gap-1.5 text-[10px] font-medium tracking-[0.24em] uppercase text-ink-soft transition-colors hover:text-brand-wine"
                >
                  Ver detalhes
                </Link>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
