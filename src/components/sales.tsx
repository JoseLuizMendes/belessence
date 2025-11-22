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
import { ArrowRight, Sparkles, Timer, Tag } from "lucide-react";
import { getSalesDisplayData, SalesProduct } from "@/lib/api";

// Helper component to render icon by name
const IconRenderer = ({ name, className }: { name?: string; className?: string }) => {
  if (name === "Timer") return <Timer className={className} />;
  if (name === "Sparkles") return <Sparkles className={className} />;
  if (name === "Tag") return <Tag className={className} />;
  return null;
};

export default function Sales() {
  const [salesData, setSalesData] = React.useState<SalesProduct[]>([]);

  React.useEffect(() => {
    // In a real app, these IDs would come from a CMS or props
    const fetchSales = async () => {
      const data = await getSalesDisplayData(["sale-1", "sale-2", "sale-3"]);
      setSalesData(data);
    };
    fetchSales();
  }, []);

  if (salesData.length === 0) return null;

  return (
    <section className="relative w-full min-h-screen bg-linear-to-br from-gray-900 via-purple-900 to-black overflow-hidden">
      <Carousel
        plugins={[
          Autoplay({
            delay: 5000,
            stopOnInteraction: false,
          }),
        ]}
        className="w-full h-full"
        opts={{
          loop: true,
        }}
      >
        <CarouselContent className="h-full ml-0">
          {salesData.map((sale) => (
            <CarouselItem key={sale.id} className="pl-0 h-full min-h-screen w-full">
              <div className="relative w-full h-screen flex items-center justify-center overflow-hidden">
                
                {/* Background Gradient Decoration */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className={`absolute top-1/4 right-1/4 w-96 h-96 bg-linear-to-r ${sale.promoGradient} rounded-full blur-3xl opacity-20 animate-pulse`} />
                    <div className="absolute bottom-1/4 left-1/4 w-64 h-64 bg-white rounded-full blur-3xl opacity-10" />
                </div>

                {/* Content Container */}
                <div className="container relative z-10 mx-auto px-4 h-full">
                  <div className="flex flex-col-reverse md:flex-row items-center justify-center h-full gap-8 md:gap-12">
                  
                    {/* Text Content - Left Side */}
                    <div className="flex-1 text-white space-y-6 md:space-y-8 flex flex-col items-center md:items-start text-center md:text-left">
                      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20">
                        <IconRenderer name={sale.iconName} className="w-5 h-5 mr-2" />
                        <span className="uppercase tracking-widest text-sm font-bold">{sale.promoTitle}</span>
                      </div>
                      
                      <div className="space-y-2">
                        <h2 className="text-5xl md:text-7xl lg:text-8xl font-playfair font-bold leading-tight tracking-tight">
                          {sale.name}
                        </h2>
                        <p className={`text-2xl md:text-4xl font-bold bg-linear-to-r ${sale.promoGradient} bg-clip-text text-transparent`}>
                          {sale.promoText}
                        </p>
                      </div>

                      <p className="text-lg md:text-xl text-gray-300 max-w-xl leading-relaxed">
                        {sale.shortDescription}
                      </p>

                      <div className="flex flex-col sm:flex-row items-center gap-6 pt-4">
                        <div className="flex flex-col items-center md:items-start">
                          <span className="text-gray-400 text-lg line-through decoration-destructive/50">
                             R$ {sale.price.toFixed(2).replace('.', ',')}
                          </span>
                          <div className="flex items-baseline gap-2">
                            <span className="text-4xl md:text-5xl font-bold text-white tracking-tighter">
                              R$ {(sale.price * 0.8).toFixed(2).replace('.', ',')}
                            </span>
                            <span className="text-sm font-medium text-belessence-gold px-2 py-0.5 rounded bg-belessence-gold/10 border border-belessence-gold/20">
                              20% OFF
                            </span>
                          </div>
                        </div>
                        
                        <Link href={`/product/${sale.slug}`}>
                          <Button size="lg" className="rounded-full h-14 px-8 text-lg bg-white text-black hover:bg-gray-100 transition-all hover:scale-105 shadow-[0_0_20px_rgba(255,255,255,0.3)]">
                            Eu quero! <ArrowRight className="ml-2 h-5 w-5" />
                          </Button>
                        </Link>
                      </div>
                    </div>

                    {/* Product Image - Right Side */}
                    <div className="flex-1 w-full max-w-md md:max-w-xl lg:max-w-2xl relative aspect-square md:aspect-4/3 flex items-center justify-center">
                      <div className="relative w-full h-full max-h-[50vh] md:max-h-[70vh]">
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
        <CarouselPrevious className="left-4 md:left-8 bg-white/10 hover:bg-white/20 border-none text-white h-12 w-12" />
        <CarouselNext className="right-4 md:right-8 bg-white/10 hover:bg-white/20 border-none text-white h-12 w-12" />
      </Carousel>
    </section>
  );
}
