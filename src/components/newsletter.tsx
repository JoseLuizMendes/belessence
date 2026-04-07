"use client";

/**
 * Newsletter — Belessence
 * Visual: seção noir editorial, input minimalista, CTA dourado — referência MFK/Byredo
 * Lógica: React Hook Form + Zod + Sonner (mantido da versão anterior)
 * Regra: zero style={} hardcoded — todas as cores e gradientes via classes CSS
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
      className="gradient-hero-noir relative py-24 md:py-32 overflow-hidden"
    >
      {/* Glow dourado — MFK */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] rounded-full blur-[100px] opacity-[0.07] pointer-events-none bg-brand-gold" />

      <div className="container-belessence relative z-10">
        <div ref={contentRef} className="max-w-lg mx-auto text-center">

          {/* Eyebrow */}
          <p className="eyebrow mb-6 text-brand-gold">
            Comunidade Exclusiva
          </p>

          {/* Divider */}
          <div className="mx-auto mb-8 h-px w-10 divider-gold" />

          {/* Título */}
          <h2 className="display-title mb-5 text-surface-contrast text-[clamp(2rem,5vw,3rem)]">
            Desperte Seus Sentidos
          </h2>

          {/* Corpo */}
          <p className="mb-10 text-base font-light leading-relaxed text-dark-soft">
            Receba lançamentos exclusivos, dicas de fragrâncias e
            ofertas especiais — diretamente no seu e-mail.
          </p>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-3">
            <div className="flex flex-col sm:flex-row gap-3">

              {/* Input — Byredo: minimal, underline only */}
              <div className="flex-1 relative">
                <input
                  type="email"
                  placeholder="Seu melhor e-mail"
                  aria-label="E-mail para newsletter"
                  aria-describedby={errors.email ? "email-error" : undefined}
                  {...register("email")}
                  className={`input-underline h-12 w-full bg-transparent px-0 text-sm text-surface-contrast placeholder:text-sm placeholder:text-dark-soft outline-none${errors.email ? " input-underline-error" : ""}`}
                />
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex h-12 items-center justify-center gap-2 whitespace-nowrap rounded-token-xs border-none bg-brand-gold px-7 text-xs font-medium tracking-[0.12em] uppercase text-ink-strong transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed hover:bg-brand-gold-light"
              >
                {isSubmitting ? "Enviando..." : (
                  <>
                    Inscrever
                    <ArrowRight className="h-3.5 w-3.5" />
                  </>
                )}
              </button>
            </div>

            {/* Erro */}
            {errors.email && (
              <p id="email-error" role="alert" className="text-left text-xs text-red-400">
                {errors.email.message}
              </p>
            )}
          </form>

          {/* Política */}
          <p className="mt-6 text-xs leading-relaxed text-ink-muted">
            Ao se inscrever, você concorda com nossa política de privacidade.
            Cancele a qualquer momento.
          </p>
        </div>
      </div>
    </section>
  );
}
