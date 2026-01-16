"use client"

import { ArrowRight } from "lucide-react";
import { Button } from "./ui/button";
import { fadeInUp } from "./ui/fadeInUp";
import { staggerContainer } from "./ui/staggerContainer";
import { motion } from "framer-motion";

export default function Hero() {
    {/* Hero Section */}
    return (
        <section className="relative py-20 md:py-28 overflow-hidden gradient-hero">
        <div className="absolute inset-0 bg-black/30" />

        <motion.div
          className="relative z-10 text-center text-white px-4 max-w-4xl mx-auto"
          variants={staggerContainer}
          initial="initial"
          animate="animate">
          <motion.p
            variants={fadeInUp}
            className="text-sm md:text-base font-medium tracking-[0.2em] uppercase text-belessence-champagne mb-4">
            Desperte Seus Sentidos
          </motion.p>

          <motion.h1
            variants={fadeInUp}
            className="text-4xl md:text-6xl lg:text-7xl font-playfair font-bold mb-6 leading-tight text-shadow-gold">
            Fragrâncias que Contam
            <br />
            <span className="text-belessence-gold">Sua História</span>
          </motion.h1>

          <motion.p
            variants={fadeInUp}
            className="text-lg md:text-xl text-gray-200 mb-8 max-w-2xl mx-auto leading-relaxed">
            Descubra perfumes únicos que transcendem o comum. Cada fragrância é
            uma experiência sensorial cuidadosamente selecionada para expressar
            sua essência mais autêntica.
          </motion.p>

          <motion.div
            variants={fadeInUp}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button
              size="lg"
              className="bg-secondary hover:bg-secondary/90 text-secondary-foreground px-8 py-3">
              Explorar Coleção
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-white text-primary hover:bg-white hover:text-primary px-8 py-3">
              Descobrir Mais
            </Button>
          </motion.div>
        </motion.div>
      </section>
    )
}