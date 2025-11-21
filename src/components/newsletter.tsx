import { motion } from "framer-motion";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

const fadeInUp = {
  initial: { opacity: 0, y: 60 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, ease: "easeOut" },
};

export default function Newsletter() {
  return (
    <div className="bg-primary text-primary-foreground">
      {/* Newsletter */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <motion.div
            className="text-center max-w-2xl mx-auto"
            variants={fadeInUp}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}>
            <h2 className="text-3xl md:text-4xl font-playfair font-bold mb-4">
              Desperte Seus Sentidos
            </h2>
            <p className="text-lg text-primary-foreground/80 mb-8">
              Receba em primeira mão lançamentos exclusivos, dicas de
              fragrâncias e ofertas especiais selecionadas especialmente para
              você.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
              <Input
                type="email"
                placeholder="Seu melhor e-mail"
                className="bg-white text-primary border-0 flex-1"
              />
              <Button className="bg-secondary hover:bg-secondary/90 text-secondary-foreground">
                Inscrever-se
              </Button>
            </div>

            <p className="text-sm text-primary-foreground/60 mt-4">
              Ao se inscrever, você concorda com nossa política de privacidade.
              Cancele a qualquer momento.
            </p>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
