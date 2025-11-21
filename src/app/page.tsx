"use client";

import Footer from "@/components/footer";
import Newsletter from "@/components/newsletter";
import Features from "@/components/features";
import Header from "@/components/header";
import Hero from "@/components/hero";
import CollectionsProducts from "@/components/collections-products";
import FeatureProducts from "@/components/feature-products";


export default function Home() {


  return (
    <div className="min-h-screen bg-background">
      <Header/>
      <Hero />
      <Features />
      <CollectionsProducts />
      <FeatureProducts />
      <Newsletter />
      <Footer />
    </div>
  );
}
