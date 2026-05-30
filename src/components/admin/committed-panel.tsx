/**
 * CommittedPanel — o "momento committed" de uma página admin.
 * Bloco vinho com texto rosé, reservado a UMA coisa por tela
 * (receita destacada, total do pedido, próxima ação importante).
 * Não usar como decoração; é semântico.
 */

import { cn } from "@/shadcn-utils/utils";

interface CommittedPanelProps {
  eyebrow?: string;
  children: React.ReactNode;
  footnote?: string;
  className?: string;
}

export function CommittedPanel({
  eyebrow,
  children,
  footnote,
  className,
}: CommittedPanelProps) {
  return (
    <section
      className={cn(
        "bg-brand-wine text-brand-pink rounded-token-md p-6 sm:p-8",
        "shadow-[0_24px_48px_-24px_rgba(46,11,18,0.45)]",
        className,
      )}
    >
      {eyebrow && (
        <p className="text-[10px] font-medium tracking-[0.32em] uppercase text-brand-pink/70 mb-3">
          {eyebrow}
        </p>
      )}
      <div className="text-brand-pink">{children}</div>
      {footnote && (
        <p className="text-xs text-brand-pink/60 mt-3">{footnote}</p>
      )}
    </section>
  );
}
