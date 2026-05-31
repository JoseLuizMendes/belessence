"use client";

/**
 * RevealSection — wrapper que aplica `revealSection` aos filhos com `[data-reveal]`.
 *
 * Uso:
 *   <RevealSection>
 *     <p data-reveal="fade-up">linha 1</p>
 *     <p data-reveal="fade-up">linha 2</p>
 *   </RevealSection>
 */

import { useRef, ReactNode, ElementType } from "react";
import { useGSAP } from "@gsap/react";
import { revealSection } from "@/lib/motion/presentation/gsap-helpers";

interface RevealSectionProps {
  children: ReactNode;
  as?: ElementType;
  className?: string;
}

export function RevealSection({
  children,
  as: Tag = "section",
  className,
}: RevealSectionProps) {
  const ref = useRef<HTMLElement | null>(null);

  useGSAP(
    () => {
      if (ref.current) revealSection(ref.current);
    },
    { scope: ref },
  );

  return (
    <Tag
      ref={ref as React.RefObject<HTMLElement>}
      className={className}
    >
      {children}
    </Tag>
  );
}

export default RevealSection;
