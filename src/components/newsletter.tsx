"use client";

/**
 * Newsletter — Belessence (estilo Stitch / "Beauty is a Lifestyle")
 * ─────────────────────────────────────────────────────────────────────
 * Layout split: imagem editorial à esquerda + CTA + form newsletter à direita
 * Tipografia: serif italic display, copy minimalista
 */

import { useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ArrowRight } from "lucide-react";
import Image from "next/image";

gsap.registerPlugin(ScrollTrigger);

const newsletterSchema = z.object({
  email: z.string().min(1, "E-mail obrigatório").email("Informe um e-mail válido"),
});

type NewsletterForm = z.infer<typeof newsletterSchema>;

export default function Newsletter() {
  const sectionRef = useRef<HTMLElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<NewsletterForm>({ resolver: zodResolver(newsletterSchema) });

  useGSAP(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced || !contentRef.current) return;

    const children = contentRef.current.children;
    gsap.from(Array.from(children), {
      opacity: 0,
      y: 30,
      duration: 0.9,
      stagger: 0.12,
      ease: "power4.out",
      scrollTrigger: {
        trigger: contentRef.current,
        start: "top 80%",
      },
    });
  }, { scope: sectionRef });

  const onSubmit = async (data: NewsletterForm) => {
    try {
      await new Promise((resolve) => setTimeout(resolve, 800));
      toast.success("Inscrição confirmada!", {
        description: `${data.email} receberá nossas novidades em breve.`,
      });
      reset();
    } catch {
      toast.error("Erro ao inscrever", { description: "Tente novamente em instantes." });
    }
  };

  return (
    <section
      ref={sectionRef}
      className="relative py-16 sm:py-24 md:py-32 bg-surface-section overflow-hidden"
    >
      <div className="container-belessence">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 sm:gap-12 lg:gap-20 items-center">

          {/* Imagem editorial à esquerda — Stitch Lifestyle (tamanho reduzido) */}
          <div className="relative w-full max-w-xs sm:max-w-sm mx-auto md:mx-0 aspect-square overflow-hidden rounded-token-sm">
            <Image
              src="/assets/stitch/lifestyle.jpg"
              alt="Beauty is a Lifestyle"
              width={400}
              height={400}
              quality={90}
              className="w-full h-full object-cover"
              sizes="(max-width: 768px) 80vw, 400px"
            />
            <div className="absolute inset-0 bg-gradient-to-tr from-brand-wine/15 to-transparent pointer-events-none" />
          </div>

          {/* Conteúdo à direita */}
          <div ref={contentRef} className="max-w-lg">

            {/* Eyebrow */}
            <p className="text-[11px] font-medium tracking-[0.32em] uppercase text-brand-wine mb-5">
              Mari Beauty
            </p>

            {/* Título italic display */}
            <h2 className="font-playfair italic text-[clamp(2.4rem,6vw,4rem)] leading-[1.04] tracking-[-0.02em] text-ink-strong mb-6">
              Beauty is a <br className="hidden sm:block" /> lifestyle.
            </h2>

            {/* Divider */}
            <div className="h-px w-12 bg-brand-wine/60 mb-6" />

            {/* Corpo */}
            <p className="mb-8 text-base leading-relaxed text-ink-soft font-light max-w-md">
              Receba lançamentos exclusivos, rituais e curadorias diretamente
              no seu e-mail. Faça parte da nossa comunidade de beleza autêntica.
            </p>

            {/* Form */}
            <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-3">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1 relative">
                  <input
                    type="email"
                    placeholder="Seu melhor e-mail"
                    aria-label="E-mail para newsletter"
                    aria-describedby={errors.email ? "email-error" : undefined}
                    {...register("email")}
                    className={`h-12 w-full bg-surface-base px-4 text-sm text-ink-strong placeholder:text-ink-muted border border-border-subtle rounded-token-sm outline-none focus:border-brand-wine transition-colors${errors.email ? " border-destructive" : ""}`}
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="loreal-btn-pill flex h-12 items-center justify-center gap-2 whitespace-nowrap border-none bg-brand-wine px-7 text-xs font-medium tracking-[0.18em] uppercase text-surface-base transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed hover:bg-brand-wine/90"
                >
                  {isSubmitting ? "Enviando..." : (
                    <>
                      Inscrever
                      <ArrowRight className="h-3.5 w-3.5" />
                    </>
                  )}
                </button>
              </div>

              {errors.email && (
                <p id="email-error" role="alert" className="text-left text-xs text-destructive">
                  {errors.email.message}
                </p>
              )}
            </form>

            <p className="mt-5 text-xs leading-relaxed text-ink-muted">
              Ao se inscrever, você concorda com nossa política de privacidade.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
