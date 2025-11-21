import { motion } from "framer-motion";
import { Sparkles, Heart, Truck} from "lucide-react";
import { fadeInUp } from "./ui/fadeInUp";
import {staggerContainer} from './ui/staggerContainer'

export default function Features() {
  return (
    <div>
      {/* Features Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <motion.div
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}>
            <motion.div variants={fadeInUp} className="text-center">
              <div className="w-16 h-16 bg-secondary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Sparkles className="h-8 w-8 text-secondary" />
              </div>
              <h3 className="text-xl font-playfair font-semibold mb-2">
                Curadoria Especializada
              </h3>
              <p className="text-muted-foreground">
                Seleção criteriosa de fragrâncias premium e exclusivas
              </p>
            </motion.div>

            <motion.div variants={fadeInUp} className="text-center">
              <div className="w-16 h-16 bg-secondary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Heart className="h-8 w-8 text-secondary" />
              </div>
              <h3 className="text-xl font-playfair font-semibold mb-2">
                Experiência Personalizada
              </h3>
              <p className="text-muted-foreground">
                Encontre o perfume perfeito para sua personalidade
              </p>
            </motion.div>

            <motion.div variants={fadeInUp} className="text-center">
              <div className="w-16 h-16 bg-secondary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Truck className="h-8 w-8 text-secondary" />
              </div>
              <h3 className="text-xl font-playfair font-semibold mb-2">
                Entrega Premium
              </h3>
              <p className="text-muted-foreground">
                Embalagem cuidadosa e entrega rápida e segura
              </p>
            </motion.div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
