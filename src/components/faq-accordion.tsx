"use client";

/**
 * FAQAccordion — accordion para /ajuda usando shadcn Accordion.
 */

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface FAQItem {
  question: string;
  answer: string;
}

interface FAQAccordionProps {
  items: FAQItem[];
}

export function FAQAccordion({ items }: FAQAccordionProps) {
  return (
    <Accordion
      type="single"
      collapsible
      defaultValue="item-0"
      className="border border-border-subtle rounded-token-md overflow-hidden bg-surface-panel divide-y divide-border-subtle"
    >
      {items.map((item, i) => (
        <AccordionItem
          key={item.question}
          value={`item-${i}`}
          className="border-0 px-5 sm:px-7"
        >
          <AccordionTrigger className="py-5 text-sm sm:text-base font-medium text-ink-strong hover:no-underline text-left [&>svg]:text-brand-wine">
            {item.question}
          </AccordionTrigger>
          <AccordionContent className="pb-6 -mt-1 text-sm text-ink-soft leading-relaxed whitespace-pre-line">
            {item.answer}
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
