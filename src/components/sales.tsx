"use client";

import * as React from "react";
import Autoplay from "embla-carousel-autoplay";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ChevronDown, Sparkles, Timer, Tag } from "lucide-react";
import { getSalesDisplayData, getSalesIdsFromIndices, SalesProduct } from "@/api/api";

// Helper component to render icon by name
const IconRenderer = ({ name, className }: { name?: string; className?: string }) => {
  if (name === "Timer") return <Timer className={className} />;
  if (name === "Sparkles") return <Sparkles className={className} />;
  if (name === "Tag") return <Tag className={className} />;
  return null;
};

interface SalesProps {
  indices?: number[];
}

export default function Sales({ indices = [0, 1, 2] }: SalesProps) {
  const [salesData, setSalesData] = React.useState<SalesProduct[]>([]);

  // Create a stable key for the indices array to prevent unnecessary re-renders or errors
  const indicesKey = JSON.stringify(indices);

  React.useEffect(() => {
    const fetchSales = async () => {
      // Convert indices to IDs and fetch data
      // We parse the key back to ensure we use the data that triggered the effect
      const currentIndices = JSON.parse(indicesKey);
      const ids = getSalesIdsFromIndices(currentIndices);
      const data = await getSalesDisplayData(ids);
      setSalesData(data);
    };
    fetchSales();
  }, [indicesKey]); 

  const scrollToSection = React.useCallback((sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (!element) return;

    const headerOffset = 80;
    const elementPosition = element.getBoundingClientRect().top;
    const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

    window.scrollTo({
      top: offsetPosition,
      behavior: "smooth",
    });
  }, []);

  if (salesData.length === 0) return null;

  return (
    <section className="relative mb-10 sm:mb-16 md:mb-20 max-w-[1800px] mx-auto bg-linear-to-br from-gray-900 via-purple-900 to-black overflow-hidden rounded-2xl sm:rounded-3xl md:h-[72vh] md:min-h-[520px] md:max-h-[720px]">
      <Carousel
        plugins={[
          Autoplay({
            delay: 5000,
            stopOnInteraction: false,
          }),
        ]}
        className="w-full md:h-full"
        opts={{
          loop: true,
        }}
      >
        <CarouselContent className="ml-0 md:h-full">
          {salesData.map((sale, index) => (
            <CarouselItem key={`${sale.id}-${index}`} className="pl-0 w-full md:h-full">
              <div className="relative w-full flex items-center justify-center overflow-hidden md:h-full">
                
                {/* Background Gradient Decoration */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className={`absolute top-1/4 right-1/4 w-96 h-96 bg-linear-to-r ${sale.promoGradient} rounded-full blur-3xl opacity-20 animate-pulse`} />
                    <div className="absolute bottom-1/4 left-1/4 w-64 h-64 bg-white rounded-full blur-3xl opacity-10" />
                </div>

                {/* Content Container */}
                <div className="container relative z-10 mx-auto px-4 sm:px-6">
                  <div className="flex flex-col-reverse md:flex-row items-center justify-center gap-6 sm:gap-8 md:gap-12 py-8 sm:py-10 md:h-full">
                  
                    {/* Text Content - Left Side */}
                    <div className="flex-1 text-white space-y-4 sm:space-y-6 md:space-y-8 flex flex-col items-center md:items-start text-center md:text-left">
                      <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20">
                        <IconRenderer name={sale.iconName} className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" />
                        <span className="uppercase tracking-widest text-[11px] sm:text-sm font-bold">{sale.promoTitle}</span>
                      </div>
                      
                      <div className="space-y-2">
                        <h2 className="text-3xl sm:text-5xl md:text-7xl lg:text-8xl font-playfair font-bold leading-tight tracking-tight">
                          {sale.name}
                        </h2>
                        <p className={`text-lg sm:text-2xl md:text-4xl font-bold bg-linear-to-r ${sale.promoGradient} bg-clip-text text-transparent`}>
                          {sale.promoText}
                        </p>
                      </div>

                      <p className="text-base sm:text-lg md:text-xl text-gray-300 max-w-xl leading-relaxed">
                        {sale.shortDescription}
                      </p>

                      <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 pt-2 sm:pt-4 w-full sm:w-auto">
                        <div className="flex flex-col items-center md:items-start">
                          <span className="text-gray-400 text-sm sm:text-lg line-through decoration-destructive/50">
                             R$ {sale.price.toFixed(2).replace('.', ',')}
                          </span>
                          <div className="flex items-baseline gap-2">
                            <span className="text-3xl sm:text-4xl md:text-5xl font-bold text-white tracking-tighter">
                              R$ {(sale.price * 0.8).toFixed(2).replace('.', ',')}
                            </span>
                            <span className="text-[11px] sm:text-sm font-medium text-belessence-gold px-2 py-0.5 rounded bg-belessence-gold/10 border border-belessence-gold/20">
                              20% OFF
                            </span>
                          </div>
                        </div>
                        
                        <Link href={`/product/${sale.slug}`}>
                          <Button size="lg" className="w-full sm:w-auto rounded-full h-12 sm:h-14 px-7 sm:px-8 text-base sm:text-lg bg-white text-black hover:bg-gray-100 transition-all sm:hover:scale-105 shadow-[0_0_20px_rgba(255,255,255,0.3)]">
                            Eu quero! <ArrowRight className="ml-2 h-5 w-5" />
                          </Button>
                        </Link>
                      </div>
                    </div>

                    {/* Product Image - Right Side */}
                    <div className="flex-1 w-full max-w-md md:max-w-xl lg:max-w-2xl relative aspect-4/3 sm:aspect-square md:aspect-4/3 flex items-center justify-center">
                      <div className="relative w-full h-full max-h-56 sm:max-h-72 md:max-h-[420px] lg:max-h-[520px]">
                        <Image
                          src={sale.images[0]}
                          alt={sale.name}
                          fill
                          priority
                          className="object-contain drop-shadow-[0_0_35px_rgba(255,255,255,0.15)] hover:scale-105 transition-transform duration-700 ease-in-out"
                          sizes="(max-width: 768px) 100vw, 50vw"
                        />
                      </div>
                    </div>

                  </div>
                </div>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>

        {/* Navigation Buttons */}
        <CarouselPrevious className="left-3 sm:left-4 md:left-8 bg-white/10 hover:bg-white/20 border-none text-white h-10 w-10 sm:h-12 sm:w-12" />
        <CarouselNext className="right-3 sm:right-4 md:right-8 bg-white/10 hover:bg-white/20 border-none text-white h-10 w-10 sm:h-12 sm:w-12" />
      </Carousel>

      <div className="flex justify-center px-4 pb-5 pt-2 md:hidden">
        <button
          type="button"
          onClick={() => scrollToSection("destaques")}
          className="group pointer-events-auto inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-[11px] uppercase tracking-[0.18em] text-white/80 backdrop-blur-md transition hover:bg-white/15 hover:text-white"
          aria-label="Ver destaques"
        >
          <span>Ver mais</span>
          <ChevronDown className="h-4 w-4 transition-transform group-hover:translate-y-0.5" />
        </button>
      </div>
    </section>
  );
}
