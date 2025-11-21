"use client";

import { motion } from "framer-motion";
import {
  Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Footer from "@/components/footer";
import Newsletter from "@/components/newsletter";
import { fadeInUp } from "@/components/ui/fadeInUp";
import { staggerContainer } from "@/components/ui/staggerContainer";
import Features from "@/components/features";
import Header from "@/components/header";
import { useCart } from "@/components/cart";
import Hero from "@/components/hero";
import CollectionsProducts from "@/components/collections-products";
import FeatureProducts from "@/components/feature-products";


export default function Home() {
  const { addToCart } = useCart();


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
