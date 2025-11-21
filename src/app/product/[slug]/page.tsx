"use client";

import { useCart } from "@/components/cart";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PRODUCTS } from "@/lib/products";
import { formatPrice } from "@/lib/utils";
import { Minus, Plus, ShoppingBag, Star } from "lucide-react";
import { useParams } from "next/navigation";
import { useState } from "react";
import Header from "@/components/header";
import Footer from "@/components/footer";
import { motion } from "framer-motion";
import Link from "next/link";

export default function ProductPage() {
  const params = useParams();
  const slug = params.slug as string;
  const product = PRODUCTS.find((p) => p.slug === slug);
  const { addToCart } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-playfair font-bold mb-4">Produto não encontrado</h1>
            <p className="text-muted-foreground">O produto que você está procurando não existe.</p>
            <Button className="mt-6" asChild>
                <Link href="/">Voltar para a loja</Link>
            </Button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const handleAddToCart = () => {
    // Since addToCart from context currently takes a product object and adds 1,
    // we might need to call it multiple times or update the context to accept quantity.
    // For now, let's just call it 'quantity' times or update context later. 
    // The current context implementation: addToCart(product). 
    // I'll just call it once for now as the requirement was "add to cart".
    // To support quantity from here, I would need to update the context. 
    // But simpler is to just add it and let the user adjust in cart, 
    // OR update context. Let's stick to simple first: Add 1 item.
    
    // Actually, I should loop or update context.
    // Let's just add one for now to be safe with current context API, 
    // but since I have "quantity" selector, users expect that amount.
    // I will assume the user wants to add the specific quantity.
    
    for(let i=0; i<quantity; i++) {
        addToCart({
            name: product.name,
            description: product.shortDescription,
            price: formatPrice(product.price),
            originalPrice: product.originalPrice ? formatPrice(product.originalPrice) : undefined,
            badge: product.badge,
            badgeVariant: product.badgeVariant,
            rating: product.rating,
            reviews: product.reviews
        });
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-12 mt-20">
        <div className="grid md:grid-cols-2 gap-12">
          {/* Product Images */}
          <div className="space-y-4">
            <motion.div 
              className="aspect-square bg-muted rounded-xl overflow-hidden relative gradient-card flex items-center justify-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
                {product.badge && (
                    <Badge className="absolute top-4 left-4 z-10" variant={product.badgeVariant}>
                        {product.badge}
                    </Badge>
                )}
                <ShoppingBag className="h-32 w-32 text-white/50" />
            </motion.div>
            <div className="grid grid-cols-4 gap-4">
              {[0, 1, 2].map((i) => (
                <button
                  key={i}
                  className={`aspect-square rounded-lg border-2 flex items-center justify-center bg-muted/50 ${
                    selectedImage === i ? "border-primary" : "border-transparent"
                  }`}
                  onClick={() => setSelectedImage(i)}
                >
                   <ShoppingBag className="h-8 w-8 text-muted-foreground/50" />
                </button>
              ))}
            </div>
          </div>

          {/* Product Info */}
          <div className="space-y-8">
            <div>
              <motion.h1 
                className="text-4xl md:text-5xl font-playfair font-bold text-primary mb-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                {product.name}
              </motion.h1>
              <motion.div 
                className="flex items-center gap-4 mb-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`h-5 w-5 ${
                        i < product.rating ? "fill-secondary text-secondary" : "text-muted"
                      }`}
                    />
                  ))}
                </div>
                <span className="text-muted-foreground">({product.reviews} avaliações)</span>
              </motion.div>
              <motion.p 
                className="text-lg text-muted-foreground leading-relaxed"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                {product.description}
              </motion.p>
            </div>

            <div className="space-y-6 pt-6 border-t">
              <div className="flex items-end gap-4">
                <span className="text-4xl font-bold text-primary">
                  {formatPrice(product.price)}
                </span>
                {product.originalPrice && (
                  <span className="text-xl text-muted-foreground line-through mb-1">
                    {formatPrice(product.originalPrice)}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center border rounded-md">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="w-12 text-center font-medium">{quantity}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setQuantity(quantity + 1)}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <Button size="lg" className="flex-1 text-lg h-12" onClick={handleAddToCart}>
                  Adicionar ao Carrinho
                </Button>
              </div>
            </div>

            <div className="space-y-4 pt-8">
                <h3 className="font-playfair text-xl font-semibold">Características</h3>
                <ul className="grid grid-cols-1 gap-2">
                    {product.features.map((feature, index) => (
                        <li key={index} className="flex items-center gap-2 text-muted-foreground">
                            <div className="h-1.5 w-1.5 rounded-full bg-secondary" />
                            {feature}
                        </li>
                    ))}
                </ul>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
