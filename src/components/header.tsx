"use client"

import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "./ui/navigation-menu";
import { Input } from "./ui/input";
import { motion } from "framer-motion";
import { Button } from "./ui/button";
import { Menu, Search, ShoppingBag } from "lucide-react";
import { Badge } from "./ui/badge";
import { Sheet, SheetContent, SheetTrigger } from "./ui/sheet";
import { Separator } from "./ui/separator";
import { useCart } from "./cart";
import { CartSheet } from "./cart-sheet";
import Link from "next/link";

export default function Header() {
    const { cartCount } = useCart();
    
    const scrollToSection = (sectionId: string) => {
      const element = document.getElementById(sectionId);
      const isProductPage = window.location.pathname.startsWith("/product/");
      
      if (isProductPage) {
        window.location.href = `/#${sectionId}`;
      } else if (element) {
        const headerOffset = 80;
        const elementPosition = element.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
        
        window.scrollTo({
          top: offsetPosition,
          behavior: "smooth"
        });
      }
    };

  return (
    <div>
      {/* Header */}
      <motion.header
        className="fixed top-0 left-0 right-0 z-50 glass-effect border-b border-border/50"
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}>
        <div className="w-full mx-auto px-4 py-3 sm:py-4">
          
          {/* ALTERAÇÃO 1: Removi space-x-[1200px] e usei justify-between e w-full */}
          <div className="flex items-center justify-between w-full">
            
            {/* Logo (Ficará na Esquerda) */}
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="flex items-center shrink-0"> {/* Adicionei flex-shrink-0 para garantir que o logo não encolha */}
              <Link href="/" className="text-xl sm:text-2xl font-playfair font-bold text-primary">
                Belessence
              </Link>
            </motion.div>

            {/* Desktop Navigation (Centralizado) */}
            {/* ALTERAÇÃO 2: Envolvi o Menu em uma div que ocupa o espaço livre (flex-1) e centraliza (justify-center) */}
            <div className="hidden md:flex flex-1 justify-center px-4">
                <NavigationMenu className="flex justify-between">
                <NavigationMenuList>
                    <NavigationMenuItem>
                    <Button
                        variant={"ghost"}
                        onClick={() => scrollToSection('inicio')} 
                        className="px-4 py-2 text-sm font-medium hover:text-secondary transition-colors cursor-pointer">
                        Início
                    </Button>
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
                    <Button
                        variant={"ghost"}
                        onClick={() => scrollToSection('colecoes')} 
                        className="px-4 py-2 text-sm font-medium hover:text-secondary transition-colors cursor-pointer">
                        Coleções
                    </Button>
                    </NavigationMenuItem>
                    <NavigationMenuItem>
                    <Button
                        variant={"ghost"}
                        onClick={() => scrollToSection('sobre')} 
                        className="px-4 py-2 text-sm font-medium hover:text-secondary transition-colors cursor-pointer">
                        Sobre
                    </Button>
                    </NavigationMenuItem>
                </NavigationMenuList>
                </NavigationMenu>
            </div>

            {/* Actions (Pesquisa e Sacola - Ficará na Direita) */}
            <div className="flex items-center justify-end space-x-2 sm:space-x-4 shrink-0">
              <div className="relative hidden md:block">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Buscar..."
                  className="w-64 pl-9 rounded-full bg-muted/50 border-transparent focus:bg-background focus:border-primary transition-all duration-300"
                />
              </div>

              <CartSheet>
                <Button variant="ghost" size="icon" className="relative">
                  <ShoppingBag className="h-5 w-5" />
                  {cartCount > 0 && (
                    <Badge className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs bg-secondary text-secondary-foreground">
                      {cartCount}
                    </Badge>
                  )}
                </Button>
              </CartSheet>

              {/* Mobile Menu */}
              <Sheet>   
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="md:hidden">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[85vw] max-w-sm">
                   {/* ... conteúdo do mobile mantido igual ... */}
                  <div className="flex flex-col space-y-5 mt-8">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="search"
                        placeholder="Buscar..."
                        className="w-full pl-9 rounded-full bg-muted/50 border-transparent focus:bg-background focus:border-primary transition-all duration-300"
                      />
                    </div>
                    <Button 
                      variant="ghost" 
                      className="justify-start"
                      onClick={() => scrollToSection('inicio')}>
                      Início
                    </Button>
                    <Button variant="ghost" className="justify-start">
                      Fragrâncias
                    </Button>
                    <Button 
                      variant="ghost" 
                      className="justify-start"
                      onClick={() => scrollToSection('colecoes')}>
                      Coleções
                    </Button>
                    <Button 
                      variant="ghost" 
                      className="justify-start"
                      onClick={() => scrollToSection('sobre')}>
                      Sobre
                    </Button>
                    <Separator />
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </motion.header>
    </div>
  );
}