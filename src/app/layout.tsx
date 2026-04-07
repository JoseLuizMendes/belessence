import type { Metadata } from "next";
import { Playfair_Display, Inter } from "next/font/google";
import { CartProvider } from "@/components/cart";
import { Toaster } from "sonner";
import { LenisProvider } from "@/components/providers/lenis-provider";
import "./globals.css";

// ─── FONTES APROVADAS (Preferencias Dev) ─────────────────────────────────────

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

// ─── METADATA ────────────────────────────────────────────────────────────────

export const metadata: Metadata = {
  title: {
    default: "Belessence — Fragrâncias Premium",
    template: "%s | Belessence",
  },
  description:
    "Fragrâncias que despertam seus sentidos. Descubra perfumes únicos selecionados para expressar sua essência mais autêntica.",
  keywords: ["perfume", "fragrância", "luxury", "belessence", "perfumaria"],
  openGraph: {
    type: "website",
    locale: "pt_BR",
    siteName: "Belessence",
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
      <body className={`${playfair.variable} ${inter.variable} antialiased font-sans`}>
        <LenisProvider>
          <CartProvider>
            {children}
          </CartProvider>
        </LenisProvider>
        {/* Toast system — Sonner (substitui alerts nativos) */}
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              fontFamily: "var(--font-inter)",
              borderRadius: "0.75rem",
            },
          }}
        />
      </body>
    </html>
  );
}
