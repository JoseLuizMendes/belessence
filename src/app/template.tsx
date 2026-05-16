/**
 * template.tsx — Next.js re-monta este componente a cada navegação.
 *
 * Usamos para aplicar uma transição CSS sutil (fade + leve translateY) sem
 * depender da View Transitions API experimental do Next 16. A animação é
 * desativada via prefers-reduced-motion no globals.css.
 */

export default function Template({ children }: { children: React.ReactNode }) {
  return <div className="page-transition">{children}</div>;
}
