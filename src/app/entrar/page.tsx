import { Suspense } from "react";
import Header from "@/components/header";
import Footer from "@/components/footer";
import { AuthPanel } from "@/components/auth/auth-panel";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Entrar",
  description: "Acesse sua conta Mari Beauty",
};

export default function EntrarPage() {
  return (
    <div className="min-h-screen bg-brand-pink flex flex-col">
      <Header />
      <main className="flex-1 pt-24 sm:pt-28 pb-16 sm:pb-24 flex items-center">
        <div className="container-belessence w-full">
          <Suspense>
            <AuthPanel mode="login" />
          </Suspense>
        </div>
      </main>
      <Footer />
    </div>
  );
}
