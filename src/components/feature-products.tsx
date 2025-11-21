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


export default function CollectionsProducts() {
  return (
    <div>
      {/* Featured Products */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <motion.div
            className="text-center mb-16"
            variants={fadeInUp}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-playfair font-bold mb-4">
              Destaques da Semana
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Fragrâncias selecionadas especialmente para você
            </p>
          </motion.div>

          <motion.div
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
          >
            {[
              {
                name: "Midnight Velvet",
                description:
                  "Uma experiência olfativa envolvente com notas de baunilha e sândalo",
                price: "R$ 189,90",
                originalPrice: "R$ 229,90",
                badge: "Novo",
                badgeVariant: "default" as const,
                rating: 5,
                reviews: 47,
              },
              {
                name: "Golden Essence",
                description:
                  "Sofisticação em cada borrifo com acordes florais e amadeirados",
                price: "R$ 249,90",
                badge: "Bestseller",
                badgeVariant: "secondary" as const,
                rating: 5,
                reviews: 89,
              },
              {
                name: "Rare Bloom",
                description:
                  "Edição exclusiva com essências raras e ingredientes premium",
                price: "R$ 349,90",
                badge: "Limitado",
                badgeVariant: "destructive" as const,
                rating: 5,
                reviews: 23,
              },
            ].map((product, index) => (
              <motion.div key={index} variants={fadeInUp}>
                <Card className="group overflow-hidden hover:shadow-xl transition-all duration-300">
                  <div className="relative h-64 gradient-card">
                    <Badge
                      className="absolute top-4 left-4 z-10"
                      variant={product.badgeVariant}
                    >
                      {product.badge}
                    </Badge>
                    <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          className="bg-white/90 text-primary hover:bg-white"
                        >
                          Ver Detalhes
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="bg-white/90 text-primary border-primary hover:bg-primary hover:text-white"
                          onClick={() => addToCart(product)}
                        >
                          Adicionar
                        </Button>
                      </div>
                    </div>
                  </div>
                  <CardHeader>
                    <CardTitle className="font-playfair">
                      {product.name}
                    </CardTitle>
                    <CardDescription className="text-sm">
                      {product.description}
                    </CardDescription>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xl font-bold text-primary">
                        {product.price}
                      </span>
                      {product.originalPrice && (
                        <span className="text-sm text-muted-foreground line-through">
                          {product.originalPrice}
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

          <motion.div
            className="text-center mt-12"
            variants={fadeInUp}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
          >
            <Button size="lg" variant="outline" className="px-8">
              Ver Todas as Fragrâncias
            </Button>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
