/**
 * Admin Layout — sidebar (desktop) + topbar com drawer (mobile)
 * ─────────────────────────────────────────────────────────────────────
 * Desktop: sidebar fixa à esquerda (md:w-64).
 * Mobile:  topbar com hamburger que abre <Sheet> com o mesmo conteúdo.
 *
 * Logo agora usa <MariLogo> (mesma marca do hero, em vez do "M" italic).
 */

import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Mail,
  Tag,
  LogOut,
  Home,
} from "lucide-react";
import { MariLogo } from "@/components/mari-logo";
import { AdminMobileNav } from "@/components/admin/admin-mobile-nav";

const NAV = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/produtos", label: "Produtos", icon: Package, exact: false },
  { href: "/admin/pedidos", label: "Pedidos", icon: ShoppingBag, exact: false },
  { href: "/admin/cupons", label: "Cupons", icon: Tag, exact: false },
  { href: "/admin/mensagens", label: "Mensagens", icon: Mail, exact: false },
];

async function logout() {
  "use server";
  const cookieStore = await cookies();
  cookieStore.delete("admin_session");
  redirect("/admin/login");
}

/**
 * Conteúdo compartilhado da sidebar — usado no aside desktop E dentro do
 * SheetContent mobile. Renderizado pelo servidor (mantém server actions).
 */
function SidebarContent() {
  return (
    <div className="flex flex-col gap-6 p-6 md:p-8 h-full">
      {/* Logo + label */}
      <div className="flex-shrink-0">
        <Link
          href="/admin"
          className="flex items-center gap-2 mb-1 whitespace-nowrap"
        >
          <MariLogo className="h-7 w-[2.6rem] text-brand-pink" />
          <span className="text-xs tracking-[0.32em] uppercase font-medium">
            Admin
          </span>
        </Link>
        <p className="text-[10px] text-brand-pink/60">Painel Mari Beauty</p>
      </div>

      {/* Nav */}
      <nav className="flex flex-col gap-1 flex-1">
        {NAV.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="flex items-center gap-3 px-4 py-2.5 rounded-token-sm text-xs tracking-[0.18em] uppercase text-brand-pink/70 hover:text-brand-pink hover:bg-brand-pink/10 transition-all whitespace-nowrap"
          >
            <Icon className="h-4 w-4 flex-shrink-0" />
            <span>{label}</span>
          </Link>
        ))}
      </nav>

      {/* Rodapé */}
      <div className="mt-auto pt-4 border-t border-brand-pink/15 flex flex-col gap-2">
        <Link
          href="/"
          target="_blank"
          className="flex items-center gap-2 px-4 py-2.5 text-[10px] tracking-[0.18em] uppercase text-brand-pink/60 hover:text-brand-pink transition-colors whitespace-nowrap"
        >
          <Home className="h-3.5 w-3.5" />
          Ver loja
        </Link>
        <form action={logout}>
          <button
            type="submit"
            className="w-full flex items-center gap-2 px-4 py-2.5 text-[10px] tracking-[0.18em] uppercase text-brand-pink/60 hover:text-brand-pink transition-colors whitespace-nowrap"
          >
            <LogOut className="h-3.5 w-3.5" />
            Sair
          </button>
        </form>
      </div>
    </div>
  );
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-surface-section flex flex-col md:flex-row">
      {/* ── Sidebar desktop (md+) ──────────────────────────────────── */}
      <aside className="hidden md:flex md:flex-col md:w-64 md:min-h-screen bg-brand-wine text-brand-pink sticky top-0 self-start">
        <SidebarContent />
      </aside>

      {/* ── Topbar mobile (< md) ───────────────────────────────────── */}
      <header className="md:hidden sticky top-0 z-20 flex items-center justify-between px-4 py-3 bg-brand-wine text-brand-pink shadow-sm">
        <AdminMobileNav>
          <SidebarContent />
        </AdminMobileNav>

        <Link href="/admin" className="flex items-center gap-2">
          <MariLogo className="h-6 w-9 text-brand-pink" />
          <span className="text-xs tracking-[0.28em] uppercase font-medium">
            Admin
          </span>
        </Link>

        {/* Spacer pra balancear visualmente o título central */}
        <div className="w-9" aria-hidden="true" />
      </header>

      {/* Conteúdo */}
      <main className="flex-1 p-6 sm:p-10">{children}</main>
    </div>
  );
}
