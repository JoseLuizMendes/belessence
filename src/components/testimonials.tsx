/**
 * Testimonials — Belessence (inspiração Boty)
 * ─────────────────────────────────────────────────────────────────────
 * Prova social em marquee contínuo. Server Component: recebe os
 * depoimentos por prop (RSC chama getFeaturedReviews) e renderiza cards
 * dentro de <Marquee> (CSS puro, pausa no hover, estático em
 * reduced-motion). Cores/raios via tokens do DS.
 */

import { Star } from "lucide-react";
import { Marquee } from "./ui/marquee";
import { RevealSection } from "./ui/reveal-section";
import type { FeaturedReview } from "@/lib/reviews-db";

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5" aria-label={`${rating} de 5 estrelas`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={
            i < rating
              ? "size-3.5 fill-brand-wine text-brand-wine"
              : "size-3.5 text-border-strong"
          }
          strokeWidth={1.5}
          aria-hidden
        />
      ))}
    </div>
  );
}

function TestimonialCard({ review }: { review: FeaturedReview }) {
  return (
    <figure className="flex w-[280px] shrink-0 flex-col justify-between gap-5 rounded-token-2xl bg-surface-panel p-6 shadow-card sm:w-[340px]">
      <div>
        <Stars rating={review.rating} />
        <blockquote className="mt-4 font-playfair text-base leading-relaxed text-ink-strong sm:text-lg">
          “{review.text}”
        </blockquote>
      </div>
      <figcaption className="flex items-center justify-between gap-3">
        <span className="text-sm font-medium text-ink-soft">
          {review.authorName}
        </span>
        <span className="rounded-full bg-brand-pink px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.1em] text-brand-wine">
          {review.productName}
        </span>
      </figcaption>
    </figure>
  );
}

interface TestimonialsProps {
  reviews: FeaturedReview[];
}

export default function Testimonials({ reviews }: TestimonialsProps) {
  if (reviews.length === 0) return null;

  return (
    <section className="overflow-hidden py-16 sm:py-24 md:py-28 bg-surface-base">
      <RevealSection
        as="div"
        className="container-belessence mb-10 text-center sm:mb-14"
      >
        <p data-reveal="fade-up" className="eyebrow mb-4 text-brand-wine">
          Quem usa, ama
        </p>
        <h2
          data-reveal="fade-up"
          className="display-title text-ink-strong text-[clamp(2rem,4.5vw,3.4rem)]"
        >
          O que dizem sobre nós
        </h2>
        <div
          data-reveal="fade-up"
          className="mx-auto mt-5 h-px w-12 divider-gold"
        />
      </RevealSection>

      <Marquee durationSeconds={56} gapClassName="gap-5 pr-5">
        {reviews.map((review) => (
          <TestimonialCard key={review.id} review={review} />
        ))}
      </Marquee>
    </section>
  );
}
