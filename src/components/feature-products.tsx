"use client"

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
import { Star } from "lucide-react";
import { useCart } from "./cart";
import { PRODUCTS } from "@/lib/products";
import Link from "next/link";
import { formatPrice } from "@/lib/utils";
import Image from "next/image";

export default function FeatureProducts() {
  const { addToCart } = useCart();

  // Filter only first 3 products for the homepage feature section
  const displayedProducts = PRODUCTS.slice(0, 3);

  return (
    <div>
      {/* Featured Products */}
      <section className="py-12 sm:py-16 md:py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <motion.div
            className="text-center mb-10 sm:mb-14 md:mb-16"
            variants={fadeInUp}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
          >
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-playfair font-bold mb-3 sm:mb-4">
              Destaques da Semana
            </h2>
            <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
              Fragrâncias selecionadas especialmente para você
            </p>
          </motion.div>

          <motion.div
            className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8"
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
          >
            {displayedProducts.map((product, index) => (
              <motion.div key={index} variants={fadeInUp} className="h-full">
                <Link href={`/product/${product.slug}`}>
                  <Card className="group overflow-hidden hover:shadow-xl transition-all duration-300 h-full flex flex-col">
                    <div className="relative h-52 sm:h-64 gradient-card shrink-0 overflow-hidden">
                      <Image
                        src={product.images[0]}
                        alt={product.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      {product.badge && (
                        <Badge
                          className="absolute top-4 left-4 z-10"
                          variant={product.badgeVariant}
                        >
                          {product.badge}
                        </Badge>
                      )}
                      <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />
                      <div className="absolute inset-0 flex items-center justify-center opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="bg-white/90 text-primary border-primary hover:bg-primary hover:text-white"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              addToCart({
                                name: product.name,
                                description: product.shortDescription,
                                price: formatPrice(product.price),
                                originalPrice: product.originalPrice
                                  ? formatPrice(product.originalPrice)
                                  : undefined,
                                badge: product.badge,
                                badgeVariant: product.badgeVariant,
                                rating: product.rating,
                                reviews: product.reviews,
                                image: product.images[0],
                              });
                            }}
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
                </Link>
              </motion.div>
            ))}
          </motion.div>

          <motion.div
            className="text-center mt-12"
            variants={fadeInUp}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
          >
            <Button size="lg" variant="outline" className="px-8 w-full sm:w-auto" asChild>
              <Link href="/allProducts">Ver Todas as Fragrâncias</Link>
            </Button>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
