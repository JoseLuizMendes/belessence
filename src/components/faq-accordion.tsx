"use client";

/**
 * FAQAccordion — accordion controlado para /ajuda
 */

import { useState } from "react";
import { ChevronDown } from "lucide-react";

interface FAQItem {
  question: string;
  answer: string;
}

interface FAQAccordionProps {
  items: FAQItem[];
}

export function FAQAccordion({ items }: FAQAccordionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <ul className="divide-y divide-border-subtle border border-border-subtle rounded-token-md overflow-hidden bg-surface-panel">
      {items.map((item, i) => {
        const isOpen = openIndex === i;
        return (
          <li key={item.question}>
            <button
              type="button"
              onClick={() => setOpenIndex(isOpen ? null : i)}
              aria-expanded={isOpen}
              className="w-full flex items-center justify-between gap-4 px-5 sm:px-7 py-5 text-left hover:bg-surface-section transition-colors"
            >
              <span className="text-sm sm:text-base font-medium text-ink-strong">
                {item.question}
              </span>
              <ChevronDown
                className={`h-4 w-4 text-brand-wine flex-shrink-0 transition-transform ${
                  isOpen ? "rotate-180" : ""
                }`}
              />
            </button>
            {isOpen && (
              <div className="px-5 sm:px-7 pb-6 -mt-1 text-sm text-ink-soft leading-relaxed whitespace-pre-line">
                {item.answer}
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
