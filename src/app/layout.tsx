import type { Metadata } from "next";
import { Marcellus, Geist, Geist_Mono, DM_Sans } from "next/font/google";
import { CartProvider } from "@/components/cart";
import { Toaster } from "@/components/ui/sonner";
import { LenisProvider } from "@/components/providers/lenis-provider";
import { AuthSessionProvider } from "@/components/providers/session-provider";
import { AuthDialog } from "@/components/auth/auth-dialog";
import { AuthDataSync } from "@/components/auth/auth-data-sync";
import "./globals.css";

// ─── FONTES ──────────────────────────────────────────────────────────────────
// Display humanista (Marcellus, primo gratuito do Optima) nos títulos +
// DM Sans no corpo/UI (inspiração Boty) + mono tabular (Geist Mono) nos
// números/dados. Geist mantido como fallback do sistema. Todas self-hosted via
// next/font — sem @import externo.

const geist = Geist({
  variable: "--font-geist",
  subsets: ["latin"],
  display: "swap",
});

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

const marcellus = Marcellus({
  variable: "--font-marcellus",
  subsets: ["latin"],
  weight: "400",
  display: "swap",
});

// ─── METADATA ────────────────────────────────────────────────────────────────

export const metadata: Metadata = {
  title: {
    default: "Mari Beauty — Beauty is a Lifestyle",
    template: "%s | Mari Beauty",
  },
  description:
    "Beauty is a lifestyle. Descubra a essência da Mari Beauty — produtos selecionados para realçar sua autenticidade.",
  keywords: ["mari beauty", "beauty", "lifestyle", "cosmética", "beleza"],
  openGraph: {
    type: "website",
    locale: "pt_BR",
    siteName: "Mari Beauty",
  },
};

// ─── ROOT LAYOUT (Server Component) ──────────────────────────────────────────

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body
        className={`${geist.variable} ${dmSans.variable} ${geistMono.variable} ${marcellus.variable} antialiased font-sans`}
      >
        <AuthSessionProvider>
          {/* Hidrata carrinho/favoritos no login e limpa no logout */}
          <AuthDataSync />
          <LenisProvider>
            <CartProvider>
              {children}
            </CartProvider>
          </LenisProvider>
          {/* Modal de bloqueio de ações que exigem login (curtir/carrinho/comprar) */}
          <AuthDialog />
        </AuthSessionProvider>
        {/* Toast system — Sonner shadcn (puxa --popover / --border do theme) */}
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              fontFamily: "var(--font-geist)",
            },
          }}
        />
      </body>
    </html>
  );
}
