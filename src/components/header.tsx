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


export default function Header() {
    const { cartCount } = useCart();
    
  return (
    <div>
      {/* Header */}
      <motion.header
        className="fixed top-0 left-0 right-0 z-50 glass-effect border-b border-border/50"
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}>
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="flex items-center space-x-2">
              <h1 className="text-2xl font-playfair font-bold text-primary">
                Belessence
              </h1>
            </motion.div>

            {/* Desktop Navigation */}
            <NavigationMenu  className="hidden md:flex">
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
              <div className="relative hidden md:block">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Buscar..."
                  className="w-64 pl-9 rounded-full bg-muted/50 border-transparent focus:bg-background focus:border-primary transition-all duration-300"
                />
              </div>

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
                    <Button variant="ghost" className="justify-start">
                      Início
                    </Button>
                    <Button variant="ghost" className="justify-start">
                      Fragrâncias
                    </Button>
                    <Button variant="ghost" className="justify-start">
                      Coleções
                    </Button>
                    <Button variant="ghost" className="justify-start">
                      Sobre
                    </Button>
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
    </div>
  );
}
