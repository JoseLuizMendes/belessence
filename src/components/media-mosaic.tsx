/**
 * MediaMosaic — Belessence (inspiração Boty)
 * ─────────────────────────────────────────────────────────────────────
 * Grade editorial 2x2 de storytelling da marca. Server Component: só
 * markup. Usa <MediaBackground> (imagens agora; trocável por vídeo via
 * `type="video"` sem mudar layout). Cores/raios via tokens do DS.
 */

import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { MediaBackground, type MediaType } from "./ui/media-background";
import { RevealSection } from "./ui/reveal-section";

interface MediaTile {
  src: string;
  type?: MediaType;
  poster?: string;
  alt: string;
  eyebrow: string;
  title: string;
  text: string;
  href: string;
}

const BIG: MediaTile = {
  src: "/assets/inspiration/f3d8cad2-8091-4809-aac0-eaac74b0be7c.mp4",
  type: "video",
  poster: "/assets/inspiration/bf965cf4-e728-4e72-ab1b-16b1cd8f1822.png",
  alt: "",
  eyebrow: "Nossa essência",
  title: "Beleza que conta histórias",
  text: "Fragrâncias autorais para revelar a sua assinatura — composições que acompanham cada momento do seu dia.",
  href: "/sobre",
};

const SMALL: MediaTile[] = [
  {
    src: "/assets/inspiration/spray-bottles.png",
    alt: "Brumas e sprays Mari Beauty",
    eyebrow: "Frescor",
    title: "Para o dia a dia",
    text: "Camadas leves que perfumam e revigoram a pele.",
    href: "/allProducts",
  },
  {
    src: "/assets/inspiration/cream-jars-colored.png",
    alt: "Potes de creme Mari Beauty",
    eyebrow: "Cuidado",
    title: "Ritual das mãos",
    text: "Toque sedoso e fragrância envolvente.",
    href: "/allProducts",
  },
];

export default function MediaMosaic() {
  return (
    <section id="sobre" className="py-16 sm:py-24 md:py-28 bg-surface-section">
      <div className="container-belessence">
        <RevealSection as="div" className="mb-10 text-center sm:mb-14">
          <p data-reveal="fade-up" className="eyebrow mb-4 text-brand-wine">
            Universo Mari Beauty
          </p>
          <h2
            data-reveal="fade-up"
            className="display-title text-ink-strong text-[clamp(2rem,4.5vw,3.4rem)]"
          >
            Uma experiência sensorial
          </h2>
          <div
            data-reveal="fade-up"
            className="mx-auto mt-5 h-px w-12 divider-gold"
          />
        </RevealSection>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-4 md:grid-rows-2 md:h-[34rem] lg:gap-5">
          {/* Tile grande — cols 1-2, rows 1-2 */}
          <Link
            href={BIG.href}
            className="group relative block h-72 overflow-hidden rounded-token-2xl md:col-span-2 md:row-span-2 md:h-auto"
          >
            <MediaBackground
              src={BIG.src}
              type={BIG.type}
              poster={BIG.poster}
              alt={BIG.alt}
              sizes="(max-width: 768px) 100vw, 50vw"
              className="transition-transform duration-700 ease-out group-hover:scale-105 gpu-layer"
              overlayClassName="gradient-image-overlay"
            />
            <div className="absolute inset-0 flex flex-col justify-end p-7 sm:p-9">
              <p className="eyebrow mb-3 text-brand-pink opacity-90">
                {BIG.eyebrow}
              </p>
              <h3 className="mb-3 display-title text-surface-contrast text-[clamp(1.5rem,3vw,2.25rem)]">
                {BIG.title}
              </h3>
              <p className="mb-5 max-w-md text-sm font-light leading-relaxed text-dark-warm">
                {BIG.text}
              </p>
              <span className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-[0.12em] text-brand-pink transition-all duration-300 group-hover:gap-2.5">
                Conheça nossa história
                <ArrowRight className="size-3.5" />
              </span>
            </div>
          </Link>

          {/* Tile marca — cols 3-4, row 1: imagem de fragrâncias + overlay wine */}
          <div className="group relative flex flex-col justify-center overflow-hidden rounded-token-2xl p-7 sm:p-9 md:col-span-2">
            <MediaBackground
              src="/assets/inspiration/serum-bottles-1.png"
              alt=""
              sizes="(max-width: 768px) 100vw, 50vw"
              className="transition-transform duration-700 ease-out group-hover:scale-105 gpu-layer object-[center_40%]"
              overlayClassName="bg-ink-overlay-strong"
            />
            <div className="relative z-10">
              <Sparkles className="mb-4 size-7 text-brand-pink" strokeWidth={1.5} />
              <h3 className="mb-2 display-title text-surface-contrast text-[clamp(1.25rem,2.4vw,1.75rem)]">
                Curadoria de fragrâncias premium
              </h3>
              <p className="max-w-md text-sm font-light leading-relaxed text-dark-warm">
                Cada produto é selecionado para realçar a sua autenticidade — sem
                excessos, com a delicadeza que a sua pele merece.
              </p>
            </div>
          </div>

          {/* Dois tiles pequenos — cols 3 e 4, row 2 */}
          {SMALL.map((tile) => (
            <Link
              key={tile.src}
              href={tile.href}
              className="group relative block h-64 overflow-hidden rounded-token-2xl md:col-span-1 md:h-auto"
            >
              <MediaBackground
                src={tile.src}
                type={tile.type}
                poster={tile.poster}
                alt={tile.alt}
                sizes="(max-width: 768px) 100vw, 25vw"
                className="transition-transform duration-700 ease-out group-hover:scale-105 gpu-layer"
                overlayClassName="gradient-image-overlay"
              />
              <div className="absolute inset-0 flex flex-col justify-end p-5 sm:p-6">
                <p className="eyebrow mb-2 text-brand-pink opacity-90">
                  {tile.eyebrow}
                </p>
                <h3 className="mb-1.5 font-playfair leading-tight text-surface-contrast text-lg">
                  {tile.title}
                </h3>
                <p className="line-clamp-2 text-xs font-light leading-relaxed text-dark-warm">
                  {tile.text}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
