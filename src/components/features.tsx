"use client"

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { Sparkles, Heart, Truck} from "lucide-react";
import { staggerIn } from "@/lib/gsap-utils";

export default function Features() {
  const sectionRef = useRef<HTMLElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (!gridRef.current) return;
      const cards = gridRef.current.querySelectorAll("[data-animate-feature]");
      if (cards.length > 0) {
        staggerIn(cards, { y: 20, duration: 0.45, stagger: 0.12 });
      }
    },
    { scope: sectionRef }
  );

  return (
    <div>
      {/* Features Section */}
      <section ref={sectionRef} className="py-10 sm:py-14 md:py-16">
        <div className="container-belessence">
          <div ref={gridRef} className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            <div data-animate-feature className="text-center">
              <div className="w-14 h-14 sm:w-16 sm:h-16 bg-secondary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Sparkles className="h-7 w-7 sm:h-8 sm:w-8 text-secondary" />
              </div>
              <p className="loreal-kicker text-brand-gold mb-2">Atelier</p>
              <h3 className="text-lg sm:text-xl font-playfair font-semibold mb-2">
                Curadoria Especializada
              </h3>
              <p className="loreal-body text-sm sm:text-base text-muted-foreground max-w-xs mx-auto">
                Seleção criteriosa de fragrâncias premium e exclusivas
              </p>
            </div>

            <div data-animate-feature className="text-center">
              <div className="w-14 h-14 sm:w-16 sm:h-16 bg-secondary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Heart className="h-7 w-7 sm:h-8 sm:w-8 text-secondary" />
              </div>
              <p className="loreal-kicker text-brand-gold mb-2">Maison</p>
              <h3 className="text-lg sm:text-xl font-playfair font-semibold mb-2">
                Experiência Personalizada
              </h3>
              <p className="loreal-body text-sm sm:text-base text-muted-foreground max-w-xs mx-auto">
                Encontre o perfume perfeito para sua personalidade
              </p>
            </div>

            <div data-animate-feature className="text-center">
              <div className="w-14 h-14 sm:w-16 sm:h-16 bg-secondary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Truck className="h-7 w-7 sm:h-8 sm:w-8 text-secondary" />
              </div>
              <p className="loreal-kicker text-brand-gold mb-2">Service</p>
              <h3 className="text-lg sm:text-xl font-playfair font-semibold mb-2">
                Entrega Premium
              </h3>
              <p className="loreal-body text-sm sm:text-base text-muted-foreground max-w-xs mx-auto">
                Embalagem cuidadosa e entrega rápida e segura
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
