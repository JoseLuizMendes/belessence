/**
 * Admin Layout — sidebar + topbar para todas as rotas /admin/*
 * Login não usa este layout (tem seu próprio layout fullscreen).
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

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-surface-section flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="md:w-64 md:min-h-screen bg-brand-wine text-brand-pink p-6 md:p-8 flex md:flex-col gap-3 md:gap-2 sticky top-0 z-10 md:relative overflow-x-auto md:overflow-visible">
        <div className="md:mb-8 flex-shrink-0">
          <Link href="/admin" className="flex items-center gap-2 md:mb-1 whitespace-nowrap">
            <span className="font-playfair italic text-2xl">M</span>
            <span className="text-xs tracking-[0.32em] uppercase font-medium">
              Admin
            </span>
          </Link>
          <p className="text-[10px] text-brand-pink/60 hidden md:block">
            Painel Mari Beauty
          </p>
        </div>

        <nav className="flex md:flex-col gap-1 md:gap-1 flex-1">
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

        <div className="md:mt-auto md:pt-4 md:border-t border-brand-pink/15 flex md:flex-col gap-2">
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
      </aside>

      {/* Conteúdo */}
      <main className="flex-1 p-6 sm:p-10">{children}</main>
    </div>
  );
}
