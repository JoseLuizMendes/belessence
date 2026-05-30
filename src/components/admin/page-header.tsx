/**
 * PageHeader — cabeçalho padrão das páginas admin.
 * Eyebrow uppercase (admin-eyebrow) + título Marcellus + descrição opcional
 * + slot de ação à direita. Sem container; quem renderiza decide a margem.
 */

import { cn } from "@/shadcn-utils/utils";

interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function PageHeader({
  eyebrow,
  title,
  description,
  action,
  className,
}: PageHeaderProps) {
  return (
    <header
      className={cn(
        "flex items-end justify-between gap-4 flex-wrap mb-10",
        className,
      )}
    >
      <div className="min-w-0">
        {eyebrow && <p className="admin-eyebrow mb-3">{eyebrow}</p>}
        <h1 className="font-serif text-3xl sm:text-4xl text-ink-strong leading-tight">
          {title}
        </h1>
        {description && (
          <p className="text-sm text-ink-soft mt-2 max-w-xl">{description}</p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </header>
  );
}
