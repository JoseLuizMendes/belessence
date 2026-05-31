"use client";

/**
 * Features — Belessence · estética Aesop (quiet luxury) + scroll motion
 * ─────────────────────────────────────────────────────────────────────
 *  - Base neutra (ivory), heading à esquerda em Marcellus
 *  - "Ritual": 2 imagens assimétricas, cantos retos, legenda editorial
 *    (mais compactas no mobile: landscape em vez de retrato full-width)
 *  - Garantias: numerais 01/02/03 + fios hairline (sem ícones); aparecem
 *    uma a uma conforme o scroll, alternando direita→esquerda (bidirecional)
 *  - Imagens estáticas (sem transform) p/ não "sumir" no scroll sob Lenis
 */

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { Sparkles, Gem, Truck, ShieldCheck, type LucideIcon } from "lucide-react";
import { scrollReveal, blurReveal } from "@/lib/motion/presentation/gsap-helpers";
import { MediaBackground, type MediaType } from "./ui/media-background";

const RITUAL: {
  src: string;
  type?: MediaType;
  poster?: string;
  alt: string;
  caption: string;
  aspect: string;
  col: string;
}[] = [
  {
    src: "/assets/inspiration/a0b7c364-afa9-4afa-9716-45718578cc01.mp4",
    type: "video",
    poster: "/assets/inspiration/0ed61900-dd29-4dd2-bc2d-abc2db54c352.png",
    alt: "",
    caption: "Ritual de cuidado",
    aspect: "aspect-[4/3] md:aspect-[4/5]",
    col: "md:col-span-7",
  },
  {
    src: "/assets/inspiration/jars-wooden-lid.png",
    alt: "Potes com tampa de madeira Mari Beauty",
    caption: "Essência natural",
    aspect: "aspect-[4/3] md:aspect-[3/4]",
    col: "md:col-span-5 md:mt-20",
  },
];

const FEATURES: {
  icon: LucideIcon;
  eyebrow: string;
  title: string;
  body: string;
}[] = [
  {
    icon: Sparkles,
    eyebrow: "Atelier",
    title: "Curadoria Especializada",
    body: "Seleção criteriosa de fragrâncias premium e exclusivas.",
  },
  {
    icon: Gem,
    eyebrow: "Maison",
    title: "Experiência Personalizada",
    body: "Encontre o perfume perfeito para a sua personalidade.",
  },
  {
    icon: Truck,
    eyebrow: "Service",
    title: "Entrega Premium",
    body: "Embalagem cuidadosa e entrega rápida e segura.",
  },
  {
    icon: ShieldCheck,
    eyebrow: "Garantia",
    title: "Compra Segura",
    body: "Produtos autênticos e pagamento protegido de ponta a ponta.",
  },
];

export default function Features() {
  const sectionRef = useRef<HTMLElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const ritualRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      // Título — blur reveal (estilo Boty)
      if (titleRef.current) {
        blurReveal(titleRef.current, { trigger: headerRef.current });
      }

      // Eyebrow + intro — reveal bidirecional com stagger
      if (headerRef.current) {
        const copy = headerRef.current.querySelectorAll("[data-reveal]");
        if (copy.length) {
          scrollReveal(copy, {
            trigger: headerRef.current,
            y: 20,
            stagger: 0.12,
          });
        }
      }

      // Benefícios (grid de ícones) — reveal em stagger conforme o scroll.
      if (gridRef.current) {
        const items = gridRef.current.querySelectorAll("[data-animate-feature]");
        if (items.length) {
          scrollReveal(items, {
            trigger: gridRef.current,
            y: 24,
            stagger: 0.1,
          });
        }
      }

      // Imagens estáticas + .gpu-layer (camada cacheada própria). NÃO usar
      // reveal/transform que esconda a imagem: sob Lenis o Next/Image não
      // rasteriza a tempo no scroll rápido e parece "sumir".
    },
    { scope: sectionRef },
  );

  return (
    <section ref={sectionRef} className="py-12 sm:py-24 md:py-32 bg-surface-base">
      <div className="container-belessence">
        {/* Heading — à esquerda, editorial */}
        <div ref={headerRef} className="max-w-2xl mb-8 sm:mb-16">
          <p data-reveal className="eyebrow text-brand-wine mb-4 sm:mb-5">
            Ritual Mari Beauty
          </p>
          <div className="overflow-hidden pb-[0.12em]">
            <h2
              ref={titleRef}
              className="font-playfair text-[clamp(1.5rem,6vw,3rem)] leading-[1.1] tracking-[-0.01em] text-ink-strong"
            >
              O ritual completo
            </h2>
          </div>
          <p
            data-reveal
            className="mt-3 sm:mt-5 text-sm sm:text-base leading-relaxed text-ink-soft font-light max-w-xl"
          >
            Da seleção da fragrância ao gesto final, cada etapa é pensada para
            transformar o cuidado diário em um momento inteiramente seu.
          </p>
        </div>

        {/* Ritual — grid assimétrico, cantos retos, parallax */}
        <div
          ref={ritualRef}
          className="grid grid-cols-1 md:grid-cols-12 gap-x-6 gap-y-6 sm:gap-y-10 mb-12 sm:mb-24"
        >
          {RITUAL.map((r) => (
            <figure key={r.src} data-ritual-img className={r.col}>
              <div className={`relative ${r.aspect} overflow-hidden bg-surface-section`}>
                <MediaBackground
                  src={r.src}
                  type={r.type}
                  poster={r.poster}
                  alt={r.alt}
                  sizes="(max-width: 768px) 100vw, 58vw"
                  className="gpu-layer"
                />
              </div>
              <figcaption className="mt-3 flex items-center gap-3">
                <span className="h-px w-6 bg-brand-wine/40" />
                <span className="section-label text-ink-soft">{r.caption}</span>
              </figcaption>
            </figure>
          ))}
        </div>

        {/* Benefícios — cards editoriais: ícone em contorno (preenche no hover),
            índice numérico e linha de acento que cresce. */}
        <div ref={gridRef} className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-4">
          {FEATURES.map((f, i) => {
            const Icon = f.icon;
            return (
              <div
                key={f.title}
                data-animate-feature
                className="group relative flex flex-col gap-5 rounded-token-2xl bg-surface-panel p-6 shadow-card transition-all duration-500 hover:-translate-y-1.5 hover:shadow-card-hover sm:p-7"
              >
                <div className="flex items-start justify-between">
                  <span className="flex size-12 items-center justify-center rounded-full border border-brand-wine/20 text-brand-wine transition-colors duration-300 group-hover:border-brand-wine group-hover:bg-brand-wine group-hover:text-brand-pink">
                    <Icon className="size-5" strokeWidth={1.5} />
                  </span>
                  <span className="font-data text-xs tracking-[0.16em] text-brand-wine/30">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                </div>
                <div>
                  <p className="eyebrow text-brand-wine mb-2">{f.eyebrow}</p>
                  <h3 className="font-playfair text-lg text-ink-strong">
                    {f.title}
                  </h3>
                  <span className="my-3 block h-px w-8 bg-brand-wine/30 transition-all duration-500 group-hover:w-14 group-hover:bg-brand-wine" />
                  <p className="text-sm leading-relaxed text-ink-soft font-light">
                    {f.body}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
