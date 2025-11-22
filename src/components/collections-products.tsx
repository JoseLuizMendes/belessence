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
import Link from "next/link";
import Image from "next/image";

export default function CollectionsProducts() {
  return (
    <div>
      {/* Collections Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <motion.div
            className="text-center mb-16"
            variants={fadeInUp}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-playfair font-bold mb-4">
              Coleções Exclusivas
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Cada coleção conta uma história única através de aromas
              cuidadosamente selecionados
            </p>
          </motion.div>

          <motion.div
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
          >
            <motion.div variants={fadeInUp}>
              <Card className="group overflow-hidden hover:shadow-xl transition-all duration-300">
                <div className="relative h-64 gradient-card overflow-hidden">
                  <Image
                    src="/assets/Perf5.jpg"
                    alt="Essência Noturna"
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-black/40 group-hover:bg-black/30 transition-colors" />
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Link href="/collections/essencia-noturna">
                        <Button
                        variant="outline"
                        className="bg-white/90 text-primary"
                        >
                        Explorar
                        </Button>
                    </Link>
                  </div>
                </div>
                <CardHeader>
                  <CardTitle className="font-playfair">
                    Essência Noturna
                  </CardTitle>
                  <CardDescription>
                    Fragrâncias intensas e sedutoras para momentos especiais
                  </CardDescription>
                  <Badge variant="secondary" className="w-fit">
                    12 fragrâncias
                  </Badge>
                </CardHeader>
              </Card>
            </motion.div>

            <motion.div variants={fadeInUp}>
              <Card className="group overflow-hidden hover:shadow-xl transition-all duration-300">
                <div className="relative h-64 gradient-card overflow-hidden">
                  <Image
                    src="/assets/Perf4.jpg"
                    alt="Elegância Diurna"
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-black/40 group-hover:bg-black/30 transition-colors" />
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Link href="/collections/elegancia-diurna">
                        <Button
                        variant="outline"
                        className="bg-white/90 text-primary"
                        >
                        Explorar
                        </Button>
                    </Link>
                  </div>
                </div>
                <CardHeader>
                  <CardTitle className="font-playfair">
                    Elegância Diurna
                  </CardTitle>
                  <CardDescription>
                    Perfumes sofisticados para o dia a dia refinado
                  </CardDescription>
                  <Badge variant="secondary" className="w-fit">
                    8 fragrâncias
                  </Badge>
                </CardHeader>
              </Card>
            </motion.div>

            <motion.div variants={fadeInUp}>
              <Card className="group overflow-hidden hover:shadow-xl transition-all duration-300">
                <div className="relative h-64 gradient-card overflow-hidden">
                  <Image
                    src="/assets/Perf6.jpg"
                    alt="Edição Limitada"
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-black/40 group-hover:bg-black/30 transition-colors" />
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Link href="/collections/edicao-limitada">
                        <Button
                        variant="outline"
                        className="bg-white/90 text-primary"
                        >
                        Explorar
                        </Button>
                    </Link>
                  </div>
                </div>
                <CardHeader>
                  <CardTitle className="font-playfair">
                    Edição Limitada
                  </CardTitle>
                  <CardDescription>
                    Criações exclusivas em quantidades limitadas
                  </CardDescription>
                  <Badge variant="secondary" className="w-fit">
                    5 fragrâncias
                  </Badge>
                </CardHeader>
              </Card>
            </motion.div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
