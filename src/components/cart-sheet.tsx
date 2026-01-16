"use client";

import { Button } from "@/components/ui/button";
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

export function CartSheet({ children }: { children: React.ReactNode }) {
  const { items, removeFromCart, updateQuantity, cartTotal, isCartOpen, setIsCartOpen } = useCart();

  return (
    <Sheet open={isCartOpen} onOpenChange={setIsCartOpen}>
      <SheetTrigger asChild>
        {children}
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md flex flex-col">
        <SheetHeader>
          <SheetTitle className="font-playfair text-2xl">Seu Carrinho</SheetTitle>
          <SheetDescription>
            {items.length === 0 ? "Seu carrinho está vazio" : `${items.length} itens selecionados`}
          </SheetDescription>
        </SheetHeader>
        
        <div className="flex-1 overflow-y-auto py-6">
            {items.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground space-y-4">
                    <ShoppingBag className="h-16 w-16 opacity-20" />
                    <p>Nenhum produto selecionado</p>
                </div>
            )}
            <div className="space-y-6">
                {items.map((item) => (
                    <div key={item.id} className="flex gap-4">
                        <div className="h-20 w-20 bg-muted rounded-md flex items-center justify-center flex-shrink-0 relative overflow-hidden">
                             {item.image ? (
                                <Image 
                                    src={item.image} 
                                    alt={item.name} 
                                    fill 
                                    className="object-cover" 
                                />
                             ) : (
                                <ShoppingBag className="h-8 w-8 opacity-20" />
                             )}
                        </div>
                        <div className="flex-1 flex flex-col justify-between">
                            <div>
                                <h3 className="font-medium leading-none">{item.name}</h3>
                                <p className="text-sm text-muted-foreground mt-1 line-clamp-1">{item.description}</p>
                            </div>
                            <div className="flex items-center justify-between mt-2">
                                <div className="font-semibold text-primary">{formatPrice(item.numericPrice)}</div>
                                <div className="flex items-center gap-2">
                                    <Button 
                                        variant="outline" 
                                        size="icon" 
                                        className="h-7 w-7"
                                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                    >
                                        <Minus className="h-3 w-3" />
                                    </Button>
                                    <span className="w-6 text-center text-sm font-medium">{item.quantity}</span>
                                    <Button 
                                        variant="outline" 
                                        size="icon" 
                                        className="h-7 w-7"
                                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                    >
                                        <Plus className="h-3 w-3" />
                                    </Button>
                                    <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        className="h-7 w-7 text-destructive hover:text-destructive/90 ml-2"
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

        <div className="space-y-4 pt-6 border-t bg-background">
            <div className="flex items-center justify-between font-medium text-lg">
                <span>Total</span>
                <span className="text-primary font-bold">{formatPrice(cartTotal)}</span>
            </div>
            <Button className="w-full" size="lg" disabled={items.length === 0}>
                Finalizar Compra
            </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
