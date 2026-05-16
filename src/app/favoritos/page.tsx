/**
 * /favoritos — Server Component wrapper
 * ─────────────────────────────────────────────────────────────────────
 * Estrutura SSR (Header + Footer) + FavoritosClient (lê wishlist store).
 */

import Header from "@/components/header";
import Footer from "@/components/footer";
import { FavoritosClient } from "@/components/favoritos-client";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Meus favoritos",
  description: "Suas fragrâncias favoritas em um só lugar.",
};

export default function FavoritosPage() {
  return (
    <div className="min-h-screen bg-brand-pink flex flex-col">
      <Header />

      <main className="flex-1 pt-24 sm:pt-28 pb-16 sm:pb-24">
        <div className="container-belessence">
          <FavoritosClient />
        </div>
      </main>

      <Footer />
    </div>
  );
}
