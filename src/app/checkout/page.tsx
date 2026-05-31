/**
 * Checkout — Server Component (estilo Stitch / Bag & Checkout)
 * ─────────────────────────────────────────────────────────────────────
 * Wrapper SSR: monta Header + Footer e delega o conteúdo interativo
 * ao CheckoutClient (que usa o cart store).
 */

import Header from "@/components/header";
import Footer from "@/components/footer";
import CheckoutClient from "@/components/checkout-client";
import { auth } from "@/lib/auth/infrastructure/external/auth";
import { redirect } from "next/navigation";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Checkout",
  description: "Finalize seu pedido Mari Beauty",
};

export default async function CheckoutPage() {
  // Comprar exige login — backstop server-side (não dá pra burlar pelo client).
  const session = await auth();
  if (!session?.user) {
    redirect("/entrar?callbackUrl=/checkout");
  }

  return (
    <div className="min-h-screen bg-brand-pink flex flex-col">
      <Header />

      <main className="flex-1 pt-24 sm:pt-28 pb-16 sm:pb-24">
        <div className="container-belessence">
          <CheckoutClient />
        </div>
      </main>

      <Footer />
    </div>
  );
}
