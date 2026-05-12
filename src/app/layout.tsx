import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import { CartProvider } from "@/components/cart";
import { Toaster } from "sonner";
import { LenisProvider } from "@/components/providers/lenis-provider";
import "./globals.css";

// ─── FONTES ──────────────────────────────────────────────────────────────────

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
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
      <body className={`${poppins.variable} antialiased font-sans`}>
        <LenisProvider>
          <CartProvider>
            {children}
          </CartProvider>
        </LenisProvider>
        {/* Toast system — Sonner */}
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              fontFamily: "var(--font-poppins)",
              borderRadius: "0.75rem",
            },
          }}
        />
      </body>
    </html>
  );
}
