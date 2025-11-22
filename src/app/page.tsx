import Sales from "@/components/sales";
import Header from "@/components/header";
import Hero from "@/components/hero";
import Features from "@/components/features";
import CollectionsProducts from "@/components/collections-products";
import FeatureProducts from "@/components/feature-products";
import Newsletter from "@/components/newsletter";
import Footer from "@/components/footer";

export default function Home() {


  return (
    <div className="min-h-screen bg-background">
      <Header/>
      <Sales />
      <Hero />
      <Features />
      <CollectionsProducts />
      <FeatureProducts />
      <Newsletter />
      <Footer />
    </div>
  );
}
