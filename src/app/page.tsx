"use client";

import Sales from "@/components/sales";
import Header from "@/components/header";
import Hero from "@/components/hero";
import Features from "@/components/features";
import CollectionsProducts from "@/components/collections-products";
import FeatureProducts from "@/components/feature-products";
import Newsletter from "@/components/newsletter";
import Footer from "@/components/footer";
import { useEffect } from "react";

export default function Home() {

  useEffect(() => {
    // Verifica se há hash na URL e faz scroll para a seção
    if (window.location.hash) {
      const sectionId = window.location.hash.substring(1);
      setTimeout(() => {
        const element = document.getElementById(sectionId);
        if (element) {
          const headerOffset = 80;
          const elementPosition = element.getBoundingClientRect().top;
          const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
          
          window.scrollTo({
            top: offsetPosition,
            behavior: "smooth"
          });
        }
      }, 100);
    }
  }, []);

  return (
    <div className="min-h-screen bg-background pt-20 sm:pt-24">
      <Header/>
      {/* Pass the indices of the SALE items you want to display: 0, 1, 2, etc. */}
      <div id="inicio">
        <Sales indices={[0, 1, 2]} />

        {/* Conteúdo já “aparece” logo abaixo do carrossel */}
        <div
          id="destaques"
          className="relative z-10 -mt-10 sm:-mt-12 bg-background pt-4 sm:pt-6 shadow-[0_-12px_40px_rgba(0,0,0,0.10)] border-t border-border/40"
        >
          <Features />
        </div>

        <Hero />
      </div>
      <div id="colecoes">
        <CollectionsProducts />
      </div>
      <div id="sobre">
        <FeatureProducts />
        <Newsletter />
      </div>
      <Footer />
    </div>
  );
}
