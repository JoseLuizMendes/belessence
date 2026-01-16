"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Star, ShoppingBag } from "lucide-react";
import { Product, useCart } from "./cart";

interface ProductDetailsDialogProps {
  product: Product | null;
    triggerLabel?: string;
}

export function ProductDetailsDialog({
    product,
    triggerLabel = "Ver detalhes",
}: ProductDetailsDialogProps) {
  const { addToCart } = useCart();
    const [open, setOpen] = React.useState(false);

  if (!product) return null;

  return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline">{triggerLabel}</Button>
            </DialogTrigger>
            <DialogContent className="w-[calc(100vw-2rem)] sm:max-w-2xl overflow-hidden">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Image Section */}
                        <div className="h-56 sm:h-64 md:h-full w-full rounded-md gradient-card relative flex items-center justify-center">
                {product.badge && (
                    <Badge className="absolute top-4 left-4 z-10" variant={product.badgeVariant}>
                        {product.badge}
                    </Badge>
                )}
                <ShoppingBag className="h-24 w-24 text-white/50" />
            </div>
            
            {/* Details Section */}
            <div className="flex flex-col justify-center space-y-4">
                <DialogHeader>
                    <DialogTitle className="text-3xl font-playfair">{product.name}</DialogTitle>
                    <DialogDescription className="text-base">
                        {product.description}
                    </DialogDescription>
                </DialogHeader>
                
                <div className="flex items-center gap-2">
                    <div className="flex">
                        {[...Array(5)].map((_, i) => (
                            <Star
                                key={i}
                                className={`h-4 w-4 ${i < product.rating ? "fill-secondary text-secondary" : "text-muted"}`}
                            />
                        ))}
                    </div>
                    <span className="text-sm text-muted-foreground">({product.reviews} avaliações)</span>
                </div>

                <div className="space-y-1">
                    <div className="flex items-center gap-3">
                        <span className="text-3xl font-bold text-primary">{product.price}</span>
                        {product.originalPrice && (
                            <span className="text-lg text-muted-foreground line-through">{product.originalPrice}</span>
                        )}
                    </div>
                </div>

                <div className="pt-4 flex gap-3">
                    <Button className="flex-1" size="lg" onClick={() => {
                        addToCart(product);
                        setOpen(false);
                    }}>
                        Adicionar ao Carrinho
                    </Button>
                </div>
                
                <div className="text-sm text-muted-foreground pt-4 border-t">
                    <p>Entrega grátis para todo o Brasil.</p>
                    <p>Garantia de satisfação de 30 dias.</p>
                </div>
            </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
