"use client";

import { motion } from "framer-motion";
import { 
  Search, 
  ShoppingBag, 
  Menu, 
  Star, 
  Sparkles, 
  Heart, 
  Truck,
  Shield,
  Award,
  ChevronDown,
  ArrowRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { NavigationMenu, NavigationMenuContent, NavigationMenuItem, NavigationMenuLink, NavigationMenuList, NavigationMenuTrigger } from "@/components/ui/navigation-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { useState } from "react";

const fadeInUp = {
  initial: { opacity: 0, y: 60 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, ease: "easeOut" }
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
};

export default function Home() {
  const [cartCount, setCartCount] = useState(0);

  const addToCart = () => {
    setCartCount(prev => prev + 1);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <motion.header 
        className="fixed top-0 left-0 right-0 z-50 glass-effect border-b border-border/50"
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="flex items-center space-x-2"
            >
              <h1 className="text-2xl font-playfair font-bold text-primary">
                Belessence
              </h1>
            </motion.div>

            {/* Desktop Navigation */}
            <NavigationMenu className="hidden md:flex">
              <NavigationMenuList>
                <NavigationMenuItem>
                  <NavigationMenuLink className="px-4 py-2 text-sm font-medium hover:text-secondary transition-colors">
                    Início
                  </NavigationMenuLink>
                </NavigationMenuItem>
                <NavigationMenuItem>
                  <NavigationMenuTrigger className="px-4 py-2 text-sm font-medium">
                    Fragrâncias
                  </NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <div className="w-64 p-4">
                      <div className="space-y-2">
                        <NavigationMenuLink className="block px-3 py-2 text-sm hover:bg-accent rounded-md">
                          Femininas
                        </NavigationMenuLink>
                        <NavigationMenuLink className="block px-3 py-2 text-sm hover:bg-accent rounded-md">
                          Masculinas
                        </NavigationMenuLink>
                        <NavigationMenuLink className="block px-3 py-2 text-sm hover:bg-accent rounded-md">
                          Unissex
                        </NavigationMenuLink>
                      </div>
                    </div>
                  </NavigationMenuContent>
                </NavigationMenuItem>
                <NavigationMenuItem>
                  <NavigationMenuLink className="px-4 py-2 text-sm font-medium hover:text-secondary transition-colors">
                    Coleções
                  </NavigationMenuLink>
                </NavigationMenuItem>
                <NavigationMenuItem>
                  <NavigationMenuLink className="px-4 py-2 text-sm font-medium hover:text-secondary transition-colors">
                    Sobre
                  </NavigationMenuLink>
                </NavigationMenuItem>
              </NavigationMenuList>
            </NavigationMenu>

            {/* Actions */}
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="icon" className="hidden md:flex">
                <Search className="h-5 w-5" />
              </Button>
              
              <Button variant="ghost" size="icon" className="relative">
                <ShoppingBag className="h-5 w-5" />
                {cartCount > 0 && (
                  <Badge className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs bg-secondary text-secondary-foreground">
                    {cartCount}
                  </Badge>
                )}
              </Button>

              {/* Mobile Menu */}
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="md:hidden">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-80">
                  <div className="flex flex-col space-y-4 mt-8">
                    <Button variant="ghost" className="justify-start">Início</Button>
                    <Button variant="ghost" className="justify-start">Fragrâncias</Button>
                    <Button variant="ghost" className="justify-start">Coleções</Button>
                    <Button variant="ghost" className="justify-start">Sobre</Button>
                    <Separator />
                    <Button variant="ghost" className="justify-start">
                      <Search className="h-4 w-4 mr-2" />
                      Buscar
                    </Button>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden gradient-hero">
        <div className="absolute inset-0 bg-black/30" />
        
        <motion.div 
          className="relative z-10 text-center text-white px-4 max-w-4xl mx-auto"
          variants={staggerContainer}
          initial="initial"
          animate="animate"
        >
          <motion.p 
            variants={fadeInUp}
            className="text-sm md:text-base font-medium tracking-[0.2em] uppercase text-belessence-champagne mb-4"
          >
            Desperte Seus Sentidos
          </motion.p>
          
          <motion.h1 
            variants={fadeInUp}
            className="text-4xl md:text-6xl lg:text-7xl font-playfair font-bold mb-6 leading-tight text-shadow-gold"
          >
            Fragrâncias que Contam
            <br />
            <span className="text-belessence-gold">Sua História</span>
          </motion.h1>
          
          <motion.p 
            variants={fadeInUp}
            className="text-lg md:text-xl text-gray-200 mb-8 max-w-2xl mx-auto leading-relaxed"
          >
            Descubra perfumes únicos que transcendem o comum. Cada fragrância é uma 
            experiência sensorial cuidadosamente selecionada para expressar sua essência mais autêntica.
          </motion.p>
          
          <motion.div 
            variants={fadeInUp}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          >
            <Button size="lg" className="bg-secondary hover:bg-secondary/90 text-secondary-foreground px-8 py-3">
              Explorar Coleção
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-primary px-8 py-3">
              Descobrir Mais
            </Button>
          </motion.div>
        </motion.div>

        {/* Scroll Indicator */}
        <motion.div 
          className="absolute bottom-8 left-1/2 transform -translate-x-1/2 text-white/70"
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <div className="flex flex-col items-center">
            <span className="text-xs uppercase tracking-wider mb-2">Role para descobrir</span>
            <ChevronDown className="h-5 w-5" />
          </div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
          >
            <motion.div variants={fadeInUp} className="text-center">
              <div className="w-16 h-16 bg-secondary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Sparkles className="h-8 w-8 text-secondary" />
              </div>
              <h3 className="text-xl font-playfair font-semibold mb-2">Curadoria Especializada</h3>
              <p className="text-muted-foreground">Seleção criteriosa de fragrâncias premium e exclusivas</p>
            </motion.div>

            <motion.div variants={fadeInUp} className="text-center">
              <div className="w-16 h-16 bg-secondary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Heart className="h-8 w-8 text-secondary" />
              </div>
              <h3 className="text-xl font-playfair font-semibold mb-2">Experiência Personalizada</h3>
              <p className="text-muted-foreground">Encontre o perfume perfeito para sua personalidade</p>
            </motion.div>

            <motion.div variants={fadeInUp} className="text-center">
              <div className="w-16 h-16 bg-secondary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Truck className="h-8 w-8 text-secondary" />
              </div>
              <h3 className="text-xl font-playfair font-semibold mb-2">Entrega Premium</h3>
              <p className="text-muted-foreground">Embalagem cuidadosa e entrega rápida e segura</p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Collections Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <motion.div 
            className="text-center mb-16"
            variants={fadeInUp}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-playfair font-bold mb-4">Coleções Exclusivas</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Cada coleção conta uma história única através de aromas cuidadosamente selecionados
            </p>
          </motion.div>

          <motion.div 
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
          >
            <motion.div variants={fadeInUp}>
              <Card className="group overflow-hidden hover:shadow-xl transition-all duration-300">
                <div className="relative h-64 gradient-card">
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="outline" className="bg-white/90 text-primary">
                      Explorar
                    </Button>
                  </div>
                </div>
                <CardHeader>
                  <CardTitle className="font-playfair">Essência Noturna</CardTitle>
                  <CardDescription>
                    Fragrâncias intensas e sedutoras para momentos especiais
                  </CardDescription>
                  <Badge variant="secondary" className="w-fit">12 fragrâncias</Badge>
                </CardHeader>
              </Card>
            </motion.div>

            <motion.div variants={fadeInUp}>
              <Card className="group overflow-hidden hover:shadow-xl transition-all duration-300">
                <div className="relative h-64 gradient-card">
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="outline" className="bg-white/90 text-primary">
                      Explorar
                    </Button>
                  </div>
                </div>
                <CardHeader>
                  <CardTitle className="font-playfair">Elegância Diurna</CardTitle>
                  <CardDescription>
                    Perfumes sofisticados para o dia a dia refinado
                  </CardDescription>
                  <Badge variant="secondary" className="w-fit">8 fragrâncias</Badge>
                </CardHeader>
              </Card>
            </motion.div>

            <motion.div variants={fadeInUp}>
              <Card className="group overflow-hidden hover:shadow-xl transition-all duration-300">
                <div className="relative h-64 gradient-card">
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="outline" className="bg-white/90 text-primary">
                      Explorar
                    </Button>
                  </div>
                </div>
                <CardHeader>
                  <CardTitle className="font-playfair">Edição Limitada</CardTitle>
                  <CardDescription>
                    Criações exclusivas em quantidades limitadas
                  </CardDescription>
                  <Badge variant="secondary" className="w-fit">5 fragrâncias</Badge>
                </CardHeader>
              </Card>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <motion.div 
            className="text-center mb-16"
            variants={fadeInUp}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-playfair font-bold mb-4">Destaques da Semana</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Fragrâncias selecionadas especialmente para você
            </p>
          </motion.div>

          <motion.div 
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
          >
            {[
              {
                name: "Midnight Velvet",
                description: "Uma experiência olfativa envolvente com notas de baunilha e sândalo",
                price: "R$ 189,90",
                originalPrice: "R$ 229,90",
                badge: "Novo",
                badgeVariant: "default" as const,
                rating: 5,
                reviews: 47
              },
              {
                name: "Golden Essence",
                description: "Sofisticação em cada borrifo com acordes florais e amadeirados",
                price: "R$ 249,90",
                badge: "Bestseller",
                badgeVariant: "secondary" as const,
                rating: 5,
                reviews: 89
              },
              {
                name: "Rare Bloom",
                description: "Edição exclusiva com essências raras e ingredientes premium",
                price: "R$ 349,90",
                badge: "Limitado",
                badgeVariant: "destructive" as const,
                rating: 5,
                reviews: 23
              }
            ].map((product, index) => (
              <motion.div key={index} variants={fadeInUp}>
                <Card className="group overflow-hidden hover:shadow-xl transition-all duration-300">
                  <div className="relative h-64 gradient-card">
                    <Badge 
                      className="absolute top-4 left-4 z-10" 
                      variant={product.badgeVariant}
                    >
                      {product.badge}
                    </Badge>
                    <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="flex gap-2">
                        <Button size="sm" className="bg-white/90 text-primary hover:bg-white">
                          Ver Detalhes
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="bg-white/90 text-primary border-primary hover:bg-primary hover:text-white"
                          onClick={addToCart}
                        >
                          Adicionar
                        </Button>
                      </div>
                    </div>
                  </div>
                  <CardHeader>
                    <CardTitle className="font-playfair">{product.name}</CardTitle>
                    <CardDescription className="text-sm">
                      {product.description}
                    </CardDescription>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xl font-bold text-primary">{product.price}</span>
                      {product.originalPrice && (
                        <span className="text-sm text-muted-foreground line-through">
                          {product.originalPrice}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <div className="flex">
                        {[...Array(product.rating)].map((_, i) => (
                          <Star key={i} className="h-4 w-4 fill-secondary text-secondary" />
                        ))}
                      </div>
                      <span className="text-sm text-muted-foreground">({product.reviews})</span>
                    </div>
                  </CardHeader>
                </Card>
              </motion.div>
            ))}
          </motion.div>

          <motion.div 
            className="text-center mt-12"
            variants={fadeInUp}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
          >
            <Button size="lg" variant="outline" className="px-8">
              Ver Todas as Fragrâncias
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Newsletter */}
      <section className="py-20 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4">
          <motion.div 
            className="text-center max-w-2xl mx-auto"
            variants={fadeInUp}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-playfair font-bold mb-4">
              Desperte Seus Sentidos
            </h2>
            <p className="text-lg text-primary-foreground/80 mb-8">
              Receba em primeira mão lançamentos exclusivos, dicas de fragrâncias 
              e ofertas especiais selecionadas especialmente para você.
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

      {/* Footer */}
      <footer className="bg-muted py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-xl font-playfair font-bold mb-4">Belessence</h3>
              <p className="text-muted-foreground mb-4">
                Fragrâncias que despertam seus sentidos
              </p>
              <div className="flex space-x-4">
                <Button variant="ghost" size="icon">📷</Button>
                <Button variant="ghost" size="icon">📘</Button>
                <Button variant="ghost" size="icon">📱</Button>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Produtos</h4>
              <div className="space-y-2 text-sm">
                <p className="text-muted-foreground hover:text-foreground cursor-pointer">Fragrâncias Femininas</p>
                <p className="text-muted-foreground hover:text-foreground cursor-pointer">Fragrâncias Masculinas</p>
                <p className="text-muted-foreground hover:text-foreground cursor-pointer">Unissex</p>
                <p className="text-muted-foreground hover:text-foreground cursor-pointer">Edições Limitadas</p>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Atendimento</h4>
              <div className="space-y-2 text-sm">
                <p className="text-muted-foreground hover:text-foreground cursor-pointer">Central de Ajuda</p>
                <p className="text-muted-foreground hover:text-foreground cursor-pointer">Trocas e Devoluções</p>
                <p className="text-muted-foreground hover:text-foreground cursor-pointer">Entrega</p>
                <p className="text-muted-foreground hover:text-foreground cursor-pointer">Contato</p>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Empresa</h4>
              <div className="space-y-2 text-sm">
                <p className="text-muted-foreground hover:text-foreground cursor-pointer">Sobre Nós</p>
                <p className="text-muted-foreground hover:text-foreground cursor-pointer">Política de Privacidade</p>
                <p className="text-muted-foreground hover:text-foreground cursor-pointer">Termos de Uso</p>
                <p className="text-muted-foreground hover:text-foreground cursor-pointer">Trabalhe Conosco</p>
              </div>
            </div>
          </div>
          
          <Separator className="my-8" />
          
          <div className="text-center text-sm text-muted-foreground">
            <p>&copy; {new Date().getFullYear()} Belessence. Todos os direitos reservados.</p>
            <p className="mt-1">Desenvolvido com ❤️ para despertar seus sentidos</p>
          </div>
        </div>
      </footer>
    </div>
  );
}