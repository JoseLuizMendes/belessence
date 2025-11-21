"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { fadeInUp } from "@/components/ui/fadeInUp";
import { staggerContainer } from "@/components/ui/staggerContainer";
import { PRODUCTS } from "@/lib/products";
import { formatPrice } from "@/lib/utils";
import Link from "next/link";
import { Star } from "lucide-react";
import { useCart } from "@/components/cart";
import { useParams } from "next/navigation";
import Header from "@/components/header";
import Footer from "@/components/footer";

export default function CollectionPage() {
    const params = useParams();
    const slug = params.slug as string;
    const { addToCart } = useCart();

    // Map slug to collection type in PRODUCTS
    const collectionType = 
        slug === "essencia-noturna" ? "night" :
        slug === "elegancia-diurna" ? "day" :
        slug === "edicao-limitada" ? "limited" : null;

    const collectionName =
        slug === "essencia-noturna" ? "Essência Noturna" :
        slug === "elegancia-diurna" ? "Elegância Diurna" :
        slug === "edicao-limitada" ? "Edição Limitada" : "Coleção";

    const products = PRODUCTS.filter(p => p.collection === collectionType);

  if (!collectionType) {
    return (
        <div className="min-h-screen flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-playfair font-bold mb-4">Coleção não encontrada</h1>
            <Button className="mt-6" asChild>
                <a href="/">Voltar para a loja</a>
            </Button>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <main className="flex-1 pt-24 pb-12">
            <div className="container mx-auto px-4">
                <motion.div
                    className="text-center mb-16"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                >
                    <h1 className="text-4xl md:text-5xl font-playfair font-bold mb-4">
                        {collectionName}
                    </h1>
                    <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                        Descubra fragrâncias únicas selecionadas para você
                    </p>
                </motion.div>

                <motion.div
                    className="grid grid-cols-1 md:grid-cols-3 gap-8"
                    variants={staggerContainer}
                    initial="initial"
                    animate="animate"
                >
                    {products.map((product, index) => (
                        <motion.div key={index} variants={fadeInUp} className="h-full">
                            <Card className="group overflow-hidden hover:shadow-xl transition-all duration-300 h-full flex flex-col">
                                <div className="relative h-64 gradient-card shrink-0">
                                    {product.badge && (
                                        <Badge
                                            className="absolute top-4 left-4 z-10"
                                            variant={product.badgeVariant}
                                        >
                                            {product.badge}
                                        </Badge>
                                    )}
                                    <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />
                                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                        <div className="flex gap-2">
                                            <Link href={`/product/${product.slug}`}>
                                                <Button
                                                    size="sm"
                                                    className="bg-white/90 text-primary hover:bg-white"
                                                >
                                                    Ver Detalhes
                                                </Button>
                                            </Link>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="bg-white/90 text-primary border-primary hover:bg-primary hover:text-white"
                                                onClick={() => addToCart({
                                                    name: product.name,
                                                    description: product.shortDescription,
                                                    price: formatPrice(product.price),
                                                    originalPrice: product.originalPrice ? formatPrice(product.originalPrice) : undefined,
                                                    badge: product.badge,
                                                    badgeVariant: product.badgeVariant,
                                                    rating: product.rating,
                                                    reviews: product.reviews
                                                })}
                                            >
                                                Adicionar
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                                <CardHeader className="flex-1 flex flex-col">
                                    <CardTitle className="font-playfair">
                                        {product.name}
                                    </CardTitle>
                                    <CardDescription className="text-sm line-clamp-2">
                                        {product.shortDescription}
                                    </CardDescription>
                                    <div className="flex items-center gap-2 mt-auto pt-4">
                                        <span className="text-xl font-bold text-primary">
                                            {formatPrice(product.price)}
                                        </span>
                                        {product.originalPrice && (
                                            <span className="text-sm text-muted-foreground line-through">
                                                {formatPrice(product.originalPrice)}
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2 mt-2">
                                        <div className="flex">
                                            {[...Array(product.rating)].map((_, i) => (
                                                <Star
                                                    key={i}
                                                    className="h-4 w-4 fill-secondary text-secondary"
                                                />
                                            ))}
                                        </div>
                                        <span className="text-sm text-muted-foreground">
                                            ({product.reviews})
                                        </span>
                                    </div>
                                </CardHeader>
                            </Card>
                        </motion.div>
                    ))}
                </motion.div>
            </div>
        </main>
        <Footer />
    </div>
  );
}
