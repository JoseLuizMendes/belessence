"use client";

/**
 * ProductReviews — Belessence
 * ─────────────────────────────────────────────────────────────────────
 * Form para deixar avaliação + lista de reviews aprovadas.
 * Estrelas interativas com hover. Validação Zod + React Hook Form.
 */

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Star } from "lucide-react";
import { Button } from "./ui/button";
import { Spinner } from "./ui/spinner";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Empty, EmptyDescription, EmptyHeader } from "./ui/empty";
import { reviewSchema, type ReviewInput } from "@/lib/shared/domain/zod-schemas";

interface Review {
  id: string;
  authorName: string;
  rating: number;
  text: string | null;
  createdAt: string;
}

interface ProductReviewsProps {
  productId: string;
}

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(iso));
}

export function ProductReviews({ productId }: ProductReviewsProps) {
  const [reviews, setReviews] = useState<Review[] | null>(null);
  const [hoverRating, setHoverRating] = useState(0);
  const [selectedRating, setSelectedRating] = useState(0);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ReviewInput>({
    resolver: zodResolver(reviewSchema),
    defaultValues: { productId, rating: 0, text: "" },
  });

  // Sincroniza estrela selecionada com o form
  useEffect(() => {
    setValue("rating", selectedRating);
  }, [selectedRating, setValue]);

  // Carrega reviews
  const loadReviews = async () => {
    try {
      const res = await fetch(`/api/reviews/${productId}`);
      const data = await res.json();
      setReviews(data);
    } catch {
      setReviews([]);
    }
  };

  useEffect(() => {
    loadReviews();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId]);

  const onSubmit = async (data: ReviewInput) => {
    if (data.rating === 0) {
      toast.error("Escolha uma nota de 1 a 5 estrelas");
      return;
    }
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (!res.ok) {
        toast.error(result.error ?? "Erro ao publicar avaliação");
        return;
      }
      toast.success(result.message ?? "Avaliação publicada!");
      reset({ productId, rating: 0, text: "", authorName: "", authorEmail: "" });
      setSelectedRating(0);
      loadReviews();
    } catch {
      toast.error("Erro ao publicar avaliação");
    }
  };

  return (
    <div className="space-y-12">
      {/* Form de nova review */}
      <section className="bg-surface-panel rounded-token-md p-6 sm:p-8 max-w-2xl mx-auto">
        <h3 className="font-playfair italic text-xl text-ink-strong mb-2 text-center">
          Deixe sua avaliação
        </h3>
        <div className="h-px w-12 bg-brand-wine/60 mb-6 mx-auto" />

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Estrelas */}
          <div className="text-center">
            <p className="text-[10px] font-medium tracking-[0.24em] uppercase text-ink-soft mb-3">
              Sua nota
            </p>
            <div className="flex items-center justify-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setSelectedRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  aria-label={`${star} estrelas`}
                  className="p-1 transition-transform hover:scale-110"
                >
                  <Star
                    className={`h-7 w-7 transition-colors ${
                      star <= (hoverRating || selectedRating)
                        ? "fill-brand-wine text-brand-wine"
                        : "fill-transparent text-ink-muted"
                    }`}
                    strokeWidth={1.5}
                  />
                </button>
              ))}
            </div>
            {errors.rating && (
              <p className="mt-1 text-xs text-destructive">
                {errors.rating.message}
              </p>
            )}
          </div>

          {/* Nome + email */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label
                htmlFor="authorName"
                className="block text-[10px] font-medium tracking-[0.24em] uppercase text-ink-soft mb-2"
              >
                Seu nome
              </Label>
              <Input
                id="authorName"
                type="text"
                placeholder="Maria"
                aria-invalid={!!errors.authorName}
                {...register("authorName")}
                className={`h-11 bg-surface-base rounded-token-sm focus-visible:border-brand-wine focus-visible:ring-0 ${
                  errors.authorName ? "border-destructive" : "border-border-subtle"
                }`}
              />
              {errors.authorName && (
                <p className="mt-1 text-xs text-destructive">
                  {errors.authorName.message}
                </p>
              )}
            </div>

            <div>
              <Label
                htmlFor="authorEmail"
                className="block text-[10px] font-medium tracking-[0.24em] uppercase text-ink-soft mb-2"
              >
                Seu e-mail
              </Label>
              <Input
                id="authorEmail"
                type="email"
                placeholder="voce@email.com"
                aria-invalid={!!errors.authorEmail}
                {...register("authorEmail")}
                className={`h-11 bg-surface-base rounded-token-sm focus-visible:border-brand-wine focus-visible:ring-0 ${
                  errors.authorEmail ? "border-destructive" : "border-border-subtle"
                }`}
              />
              {errors.authorEmail && (
                <p className="mt-1 text-xs text-destructive">
                  {errors.authorEmail.message}
                </p>
              )}
            </div>
          </div>

          {/* Texto */}
          <div>
            <Label
              htmlFor="text"
              className="block text-[10px] font-medium tracking-[0.24em] uppercase text-ink-soft mb-2"
            >
              Sua opinião (opcional, max 250)
            </Label>
            <Textarea
              id="text"
              rows={4}
              maxLength={250}
              placeholder="Conte sua experiência com o produto..."
              aria-invalid={!!errors.text}
              {...register("text")}
              className={`bg-surface-base rounded-token-sm focus-visible:border-brand-wine focus-visible:ring-0 resize-none ${
                errors.text ? "border-destructive" : "border-border-subtle"
              }`}
            />
            {errors.text && (
              <p className="mt-1 text-xs text-destructive">
                {errors.text.message}
              </p>
            )}
          </div>

          <Button
            type="submit"
            disabled={isSubmitting}
            className="loreal-btn-pill w-full h-12 bg-brand-wine text-brand-pink text-[12px] font-medium tracking-[0.18em] uppercase hover:bg-brand-wine/90 disabled:opacity-60"
          >
            {isSubmitting ? (
              <>
                <Spinner className="mr-2" />
                Publicando...
              </>
            ) : (
              "Publicar avaliação"
            )}
          </Button>
        </form>
      </section>

      {/* Lista de reviews */}
      <section className="max-w-2xl mx-auto">
        <h3 className="font-playfair italic text-xl text-ink-strong mb-2 text-center">
          Avaliações de quem já comprou
        </h3>
        <div className="h-px w-12 bg-brand-wine/60 mb-8 mx-auto" />

        {reviews === null ? (
          /**
           * Skeleton com 2 cards que replicam o shape final.
           * Não usar Spinner: ele tem altura pequena, então quando as
           * reviews reais chegam (3-5 cards) o wrapper cresce de ~80px
           * para ~600px e isso causa layout shift visível.
           * Skeleton de 2 cards ~280px aproxima da altura real e
           * absorve o shift.
           */
          <ul className="space-y-6" aria-label="Carregando avaliações">
            {[0, 1].map((i) => (
              <li
                key={i}
                className="bg-surface-panel rounded-token-sm p-5 sm:p-6 animate-pulse"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="space-y-2">
                    <div className="h-3.5 w-24 rounded bg-brand-wine/10" />
                    <div className="h-3 w-16 rounded bg-brand-wine/10" />
                  </div>
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <div
                        key={s}
                        className="h-3.5 w-3.5 rounded-sm bg-brand-wine/10"
                      />
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="h-3 w-full rounded bg-brand-wine/10" />
                  <div className="h-3 w-4/5 rounded bg-brand-wine/10" />
                </div>
              </li>
            ))}
          </ul>
        ) : reviews.length === 0 ? (
          <Empty className="py-8">
            <EmptyHeader>
              <EmptyDescription className="text-sm text-ink-soft italic">
                Ainda não há avaliações. Seja a primeira a avaliar!
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <ul className="space-y-6">
            {reviews.map((r) => (
              <li
                key={r.id}
                className="bg-surface-panel rounded-token-sm p-5 sm:p-6"
              >
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="font-medium text-sm text-ink-strong">
                      {r.authorName}
                    </p>
                    <p className="text-xs text-ink-muted">
                      {formatDate(r.createdAt)}
                    </p>
                  </div>
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`h-3.5 w-3.5 ${
                          star <= r.rating
                            ? "fill-brand-wine text-brand-wine"
                            : "fill-transparent text-ink-muted"
                        }`}
                        strokeWidth={1.5}
                      />
                    ))}
                  </div>
                </div>
                {r.text && (
                  <p className="text-sm text-ink-soft leading-relaxed">
                    {r.text}
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
