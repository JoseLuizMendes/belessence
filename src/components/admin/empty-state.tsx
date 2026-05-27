/**
 * EmptyState — estado vazio gentil e útil.
 * Não é "nada aqui"; ensina a interface (próxima ação clara).
 * Icon: ReactNode (passar <Package /> etc. com strokeWidth={1.2}).
 */

import { cn } from "@/api/utils";

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "bg-admin-panel border border-admin rounded-token-md",
        "px-6 py-14 text-center shadow-petal-1",
        className,
      )}
    >
      {icon && (
        <div className="text-ink-muted mb-5 flex justify-center [&_svg]:h-12 [&_svg]:w-12">
          {icon}
        </div>
      )}
      <p className="font-serif text-xl text-ink-strong mb-2">{title}</p>
      {description && (
        <p className="text-sm text-ink-soft mb-6 max-w-md mx-auto">
          {description}
        </p>
      )}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
