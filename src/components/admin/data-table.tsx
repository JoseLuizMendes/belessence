/**
 * Wrappers finos sobre o `Table` do shadcn, com a estética admin:
 *  - Painel com borda hairline aquecida e sombra petal
 *  - Header com tipografia uppercase consistente
 *  - Linhas com hover warm e separadores soft
 *
 * NÃO reimplementa Table — apenas dá vocabulário visual unificado.
 * Use junto com TableBody, TableCell, TableRow do shadcn diretamente.
 */

import * as React from "react";
import { cn } from "@/api/utils";
import {
  Table,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface DataPanelProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function DataPanel({ className, children, ...rest }: DataPanelProps) {
  return (
    <div
      className={cn(
        "bg-admin-panel border border-admin rounded-token-md overflow-hidden shadow-petal-1",
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}

interface DataTableProps {
  children: React.ReactNode;
  className?: string;
}

export function DataTable({ children, className }: DataTableProps) {
  return (
    <DataPanel className="hidden md:block">
      <Table className={className}>{children}</Table>
    </DataPanel>
  );
}

interface DataTableHeaderProps {
  columns: Array<{
    key: string;
    label: string;
    align?: "left" | "right" | "center";
    className?: string;
  }>;
}

export function DataTableHeader({ columns }: DataTableHeaderProps) {
  return (
    <TableHeader className="bg-admin-panel-soft">
      <TableRow className="hover:bg-transparent border-b border-admin">
        {columns.map((col) => (
          <TableHead
            key={col.key}
            className={cn(
              "py-3 px-5 text-[10px] tracking-[0.22em] uppercase font-medium text-ink-muted",
              col.align === "right" && "text-right",
              col.align === "center" && "text-center",
              col.className,
            )}
          >
            {col.label}
          </TableHead>
        ))}
      </TableRow>
    </TableHeader>
  );
}

/** Linha clicável (toda a linha vira link). Usa <tr> + onClick sintético.
 *  Para acessibilidade, prefira manter um link visível dentro da linha
 *  (ex.: botão "Editar"); este wrapper só estiliza o hover. */
export function DataTableRow({
  children,
  className,
  ...rest
}: React.HTMLAttributes<HTMLTableRowElement>) {
  return (
    <TableRow
      className={cn(
        "border-b border-admin-soft last:border-b-0",
        "hover:bg-admin-row transition-colors duration-150",
        className,
      )}
      {...rest}
    >
      {children}
    </TableRow>
  );
}
