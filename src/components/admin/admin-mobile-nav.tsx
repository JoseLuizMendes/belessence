"use client";

/**
 * AdminMobileNav — hamburger + drawer com a navegação do admin.
 * ─────────────────────────────────────────────────────────────────────
 * Renderiza dois elementos:
 *  - Botão hamburger (visível no topbar mobile)
 *  - SheetContent portal-renderizado com o conteúdo da sidebar
 *
 * O conteúdo da nav vem via prop `children` (renderizado no servidor pelo
 * layout, com server actions intactos).
 */

import { useState } from "react";
import { Menu } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

interface AdminMobileNavProps {
  children: React.ReactNode;
}

export function AdminMobileNav({ children }: AdminMobileNavProps) {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          type="button"
          aria-label="Abrir menu"
          className="inline-flex items-center justify-center h-9 w-9 rounded-md text-brand-pink hover:bg-brand-pink/10 transition-colors"
        >
          <Menu className="h-5 w-5" strokeWidth={1.5} />
        </button>
      </SheetTrigger>
      <SheetContent
        side="left"
        className="w-[85vw] max-w-xs sm:w-72 sm:max-w-none bg-brand-wine text-brand-pink border-r border-brand-pink/10 p-0"
      >
        <SheetTitle className="sr-only">Menu admin</SheetTitle>
        {/* Captura cliques em <Link> para fechar o drawer automaticamente */}
        <div onClick={() => setOpen(false)} className="h-full overflow-y-auto">
          {children}
        </div>
      </SheetContent>
    </Sheet>
  );
}
