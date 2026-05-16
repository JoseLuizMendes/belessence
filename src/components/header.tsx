"use client";

/**
 * Header — Belessence
 * Visual: glass ivory, logo Playfair italic, nav uppercase tracking — referência MFK
 * Animação: GSAP entrada slide-down + blur scroll progressivo (GSAP scrub = rgba dinâmico, exceção aceita)
 * Regra: zero style={} com valores hardcoded — apenas classes CSS
 */

import { useRef, useState } from "react";
import { useHasMounted } from "@/lib/hooks/use-has-mounted";
import { useRouter } from "next/navigation";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "./ui/navigation-menu";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Heart, Menu, Search, ShoppingBag } from "lucide-react";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "./ui/sheet";
import { Separator } from "./ui/separator";
import { useCart } from "./cart";
import { CartSheet } from "./cart-sheet";
import { MariLogo } from "./mari-logo";
import Link from "next/link";
import { useWishlistStore } from "@/lib/wishlist-store";

gsap.registerPlugin(ScrollTrigger);

const NAV_LINKS = [
  { label: "Início",   id: "inicio" },
  { label: "Coleções", id: "colecoes" },
  { label: "Sobre",    id: "sobre" },
];

export default function Header() {
  const headerRef = useRef<HTMLElement>(null);
  const logoRef   = useRef<HTMLAnchorElement>(null);
  const router    = useRouter();
  const { cartCount } = useCart();
  const wishlistCount = useWishlistStore((s) => s.count);
  const [searchTerm, setSearchTerm] = useState("");
  const mounted = useHasMounted();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const term = searchTerm.trim();
    if (!term) return;
    router.push(`/allProducts?q=${encodeURIComponent(term)}`);
    setSearchTerm("");
  };

  useGSAP(() => {
    const header = headerRef.current;
    if (!header) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (!reduced) {
      gsap.fromTo(
        header,
        { y: -100, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8, ease: "power4.out", immediateRender: false, clearProps: "opacity,transform" },
      );
    }

    // Scroll affordance — só blur e sombra mudam; cor do header fica fixa (bg-brand-pink).
    ScrollTrigger.create({
      start: "top top",
      end: "+=160",
      scrub: true,
      onUpdate: (self) => {
        const p = self.progress;
        gsap.set(header, {
          backdropFilter: `blur(${10 + p * 16}px)`,
          boxShadow: `0 6px 24px rgba(46, 11, 18, ${0.02 + p * 0.08})`,
        });
      },
    });
  }, { scope: headerRef });

  const scrollTo = (id: string) => {
    if (window.location.pathname !== "/") {
      window.location.assign(`/#${id}`);
      return;
    }
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <header
      ref={headerRef}
      className="fixed left-0 right-0 top-0 z-50 border-b bg-brand-pink"
    >
      <div className="container-belessence py-4 sm:py-5">
        <div className="flex items-center justify-between">

          {/* Logo — Mari Beauty: M cursivo + wordmark Poppins */}
          <Link
            ref={logoRef}
            href="/"
            className="flex items-center gap-2 font-poppins font-medium tracking-[0.02em] text-ink-strong transition-opacity hover:opacity-70"
          >
            <MariLogo className="h-6 w-9 sm:h-7 sm:w-[2.6rem] text-brand-wine" />
            <span className="text-lg sm:text-xl">
              <span className="uppercase tracking-[0.18em]">Mari</span>{" "}
              <span className="uppercase tracking-[0.18em] text-ink-soft">Beauty</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden items-center gap-1 md:flex">
            {NAV_LINKS.map(({ label, id }) => (
              <button
                key={id}
                onClick={() => scrollTo(id)}
                className="cursor-pointer border-none bg-transparent px-4 py-2 text-[11px] font-medium tracking-[0.14em] uppercase text-ink-soft transition-colors hover:opacity-60"
              >
                {label}
              </button>
            ))}

            {/* Dropdown Fragrâncias */}
            <NavigationMenu>
              <NavigationMenuList>
                <NavigationMenuItem>
                  <NavigationMenuTrigger className="h-auto bg-transparent px-4 py-2 text-[11px] font-medium tracking-[0.14em] uppercase text-ink-soft">
                    Fragrâncias
                  </NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <div className="w-52 space-y-0.5 p-3">
                      {["Femininas", "Masculinas", "Unissex"].map((cat) => (
                        <NavigationMenuLink
                          key={cat}
                          className="block cursor-pointer rounded-sm px-3 py-2.5 text-xs tracking-[0.08em] uppercase text-ink-soft transition-colors hover:bg-accent"
                        >
                          {cat}
                        </NavigationMenuLink>
                      ))}
                    </div>
                  </NavigationMenuContent>
                </NavigationMenuItem>
              </NavigationMenuList>
            </NavigationMenu>
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-2 sm:gap-3">

            {/* Busca — desktop */}
            <form onSubmit={handleSearch} className="relative hidden md:block">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-muted pointer-events-none" />
              <Input
                type="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="buscar fragrâncias"
                aria-label="Buscar produtos"
                className="h-9 w-72 rounded-none border-0 bg-transparent pl-9 text-xs text-ink-strong placeholder:text-ink-muted placeholder:tracking-[0.02em] focus:ring-0 focus-visible:outline-none focus-visible:ring-0"
              />
            </form>

            {/* Wishlist */}
            <Link href="/favoritos" aria-label="Meus favoritos">
              <Button variant="ghost" size="icon" className="relative h-9 w-9 text-ink-strong hover:bg-transparent">
                <Heart className="h-4.5 w-4.5" strokeWidth={1.5} />
                {mounted && wishlistCount > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-brand-wine text-[10px] font-semibold text-brand-pink">
                    {wishlistCount}
                  </span>
                )}
              </Button>
            </Link>

            {/* Cart */}
            <CartSheet>
              <Button variant="ghost" size="icon" className="relative h-9 w-9 text-ink-strong hover:bg-transparent">
                <ShoppingBag className="h-4.5 w-4.5" strokeWidth={1.5} />
                {cartCount > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-brand-wine text-[10px] font-semibold text-brand-pink">
                    {cartCount}
                  </span>
                )}
              </Button>
            </CartSheet>

            {/* Mobile menu */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9 text-ink-strong hover:bg-transparent md:hidden">
                  <Menu className="h-4.5 w-4.5" strokeWidth={1.5} />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[75vw] max-w-xs border-l border-subtle bg-surface-base">
                <SheetTitle className="sr-only">Menu Mari Beauty</SheetTitle>
                <div className="mt-10 flex flex-col gap-0">
                  {/* Logo mobile */}
                  <div className="mb-8 px-4 flex items-center gap-2 text-ink-strong">
                    <MariLogo className="h-7 w-[2.6rem] text-brand-wine" />
                    <p className="font-poppins font-medium text-lg">
                      <span className="uppercase tracking-[0.18em]">Mari</span>{" "}
                      <span className="uppercase tracking-[0.18em] text-ink-soft">Beauty</span>
                    </p>
                  </div>

                  {/* Search mobile */}
                  <form onSubmit={handleSearch} className="relative mb-6 px-4">
                    <Search className="absolute left-7 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-muted pointer-events-none" />
                    <Input
                      type="search"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="buscar fragrâncias"
                      aria-label="Buscar produtos"
                      className="h-9 w-full rounded-none border-0 bg-transparent pl-9 text-xs text-ink-strong placeholder:text-ink-muted placeholder:tracking-[0.02em] focus:ring-0 focus-visible:outline-none focus-visible:ring-0"
                    />
                  </form>

                  <Separator className="bg-border-subtle" />

                  {/* Nav links mobile */}
                  {[...NAV_LINKS, { label: "Fragrâncias", id: "inicio" }].map(({ label, id }) => (
                    <button
                      key={label}
                      onClick={() => scrollTo(id)}
                      className="cursor-pointer border-b border-b-border bg-transparent px-4 py-4 text-left text-[11px] tracking-[0.16em] uppercase text-ink-soft transition-colors hover:bg-surface-section"
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}
