"use client";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useCart } from "./cart";
import { Minus, Plus, Trash2, ShoppingBag } from "lucide-react";
import { formatPrice } from "@/api/utils";
import Image from "next/image";
import Link from "next/link";

export function CartSheet({ children }: { children: React.ReactNode }) {
  const {
    items,
    removeFromCart,
    updateQuantity,
    isCartOpen,
    setIsCartOpen,
    isSelected,
    toggleSelected,
    setAllSelected,
    selectedCount,
    selectedItems,
    selectedTotal,
  } = useCart();

  const allSelected = items.length > 0 && selectedItems.length === items.length;

  return (
    <Sheet open={isCartOpen} onOpenChange={setIsCartOpen}>
      <SheetTrigger asChild>
        {children}
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md flex flex-col p-0 gap-0">
        <SheetHeader className="px-5 sm:px-6 pt-6 pb-4 border-b border-border-subtle">
          <SheetTitle className="font-playfair text-2xl text-ink-strong">Seu Carrinho</SheetTitle>
          <SheetDescription className="text-ink-soft">
            {items.length === 0
              ? "Seu carrinho está vazio"
              : `${selectedItems.length} de ${items.length} ${items.length === 1 ? "item selecionado" : "itens selecionados"}`}
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-5 sm:px-6 py-5">
            {items.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-ink-muted space-y-4">
                    <ShoppingBag className="h-16 w-16 opacity-20" />
                    <p className="text-sm">Nenhum produto selecionado</p>
                </div>
            )}

            {items.length > 0 && (
              <label className="mb-4 flex items-center gap-2.5 text-xs text-ink-soft cursor-pointer select-none">
                <Checkbox
                  checked={allSelected}
                  onCheckedChange={(c) => setAllSelected(c === true)}
                  aria-label="Selecionar todos os itens"
                />
                Selecionar todos
              </label>
            )}

            <div className="space-y-5">
                {items.map((item) => (
                    <div key={item.id} className="flex gap-3 sm:gap-4">
                        <div className="flex items-center">
                          <Checkbox
                            checked={isSelected(item.id)}
                            onCheckedChange={() => toggleSelected(item.id)}
                            aria-label={`Selecionar ${item.name} para o checkout`}
                          />
                        </div>
                        <div className="h-20 w-20 bg-surface-section rounded-token-sm flex items-center justify-center flex-shrink-0 relative overflow-hidden">
                             {item.image ? (
                                <Image
                                    src={item.image}
                                    alt={item.name}
                                    fill
                                    className="object-cover"
                                    sizes="80px"
                                />
                             ) : (
                                <ShoppingBag className="h-8 w-8 opacity-20" />
                             )}
                        </div>
                        <div className="flex-1 min-w-0 flex flex-col justify-between gap-2">
                            <div className="min-w-0">
                                <h3 className="font-medium text-sm leading-snug text-ink-strong line-clamp-1">{item.name}</h3>
                                <p className="text-xs text-ink-soft mt-1 line-clamp-1">{item.shortDescription}</p>
                            </div>
                            <div className="flex items-center justify-between gap-2">
                                <div className="font-semibold text-sm text-brand-wine tabular-nums">{formatPrice(item.price)}</div>
                                <div className="flex items-center gap-1">
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        className="h-7 w-7 rounded-full"
                                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                    >
                                        <Minus className="h-3 w-3" />
                                    </Button>
                                    <span className="w-6 text-center text-sm font-medium tabular-nums">{item.quantity}</span>
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        className="h-7 w-7 rounded-full"
                                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                    >
                                        <Plus className="h-3 w-3" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7 text-destructive hover:text-destructive/90 ml-1"
                                        onClick={() => removeFromCart(item.id)}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>

        <div className="space-y-4 px-5 sm:px-6 py-5 border-t border-border-subtle bg-background">
            <div className="flex items-center justify-between font-medium text-base">
                <span className="text-ink-strong">Total selecionado</span>
                <span className="text-brand-wine font-bold tabular-nums">{formatPrice(selectedTotal)}</span>
            </div>
            {items.length > 0 && selectedCount === 0 && (
              <p className="text-xs text-ink-muted">
                Selecione ao menos um item para finalizar.
              </p>
            )}
            <Button
              asChild={selectedCount > 0}
              className="w-full bg-brand-wine text-brand-pink hover:bg-brand-wine/90 loreal-btn-pill h-12 text-[12px] font-medium tracking-[0.18em] uppercase"
              size="lg"
              disabled={selectedCount === 0}
            >
              {selectedCount > 0 ? (
                <Link href="/checkout" onClick={() => setIsCartOpen(false)}>
                  Finalizar Compra ({selectedCount})
                </Link>
              ) : (
                <span>Finalizar Compra</span>
              )}
            </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
