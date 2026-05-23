"use client";

/**
 * AccountMenu — controle de conta no header.
 * Deslogado: ícone que leva a /entrar.
 * Logado: dropdown com nome, "Meus pedidos" e "Sair".
 * Hydration-safe: antes de montar/resolver a sessão, mostra o link de entrar.
 */

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { User, LogOut, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useHasMounted } from "@/lib/hooks/use-has-mounted";

export function AccountMenu() {
  const mounted = useHasMounted();
  const { data: session, status } = useSession();

  if (!mounted || status !== "authenticated") {
    return (
      <Link href="/entrar" aria-label="Entrar">
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 text-ink-strong hover:bg-transparent"
        >
          <User className="h-4.5 w-4.5" strokeWidth={1.5} />
        </Button>
      </Link>
    );
  }

  const displayName = session.user?.name || session.user?.email || "Minha conta";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Minha conta"
          className="h-9 w-9 text-ink-strong hover:bg-transparent"
        >
          <User className="h-4.5 w-4.5" strokeWidth={1.5} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuLabel className="truncate">{displayName}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/meus-pedidos">
            <Package className="mr-2 h-4 w-4" />
            Meus pedidos
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => signOut({ callbackUrl: "/" })}>
          <LogOut className="mr-2 h-4 w-4" />
          Sair
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
