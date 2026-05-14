/**
 * Footer — Belessence (estilo Stitch)
 * ─────────────────────────────────────────────────────────────────────
 * Layout 4 colunas com fundo bordô (--color-brand-wine).
 * Logo + tagline | Produtos | Atendimento | Empresa
 * Bottom: copyright + ícones sociais minimalistas
 */

import { Instagram, Facebook, Youtube } from "lucide-react";
import Link from "next/link";
import { MariLogo } from "./mari-logo";

const NAV_COLUMNS = [
  {
    title: "Produtos",
    links: [
      { label: "Fragrâncias Femininas", href: "/allProducts?genero=feminino" },
      { label: "Fragrâncias Masculinas", href: "/allProducts?genero=masculino" },
      { label: "Unissex", href: "/allProducts?genero=unissex" },
      { label: "Edições Limitadas", href: "/allProducts?tag=lancamento" },
    ],
  },
  {
    title: "Atendimento",
    links: [
      { label: "Central de Ajuda", href: "#" },
      { label: "Trocas e Devoluções", href: "#" },
      { label: "Entrega", href: "#" },
      { label: "Contato", href: "#" },
    ],
  },
  {
    title: "Empresa",
    links: [
      { label: "Sobre Nós", href: "#" },
      { label: "Política de Privacidade", href: "#" },
      { label: "Termos de Uso", href: "#" },
      { label: "Trabalhe Conosco", href: "#" },
    ],
  },
];

const SOCIAL = [
  { Icon: Instagram, label: "Instagram", href: "#" },
  { Icon: Facebook, label: "Facebook", href: "#" },
  { Icon: Youtube, label: "Youtube", href: "#" },
];

export default function Footer() {
  return (
    <footer className="bg-brand-wine text-brand-pink">
      <div className="container-belessence py-14 sm:py-20">
        {/* Grid 4 colunas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 sm:gap-12">
          {/* Coluna 1 — Logo + tagline */}
          <div>
            <Link
              href="/"
              className="inline-flex items-center gap-2 mb-5 text-brand-pink hover:opacity-80 transition-opacity"
            >
              <MariLogo className="h-7 w-[2.6rem] text-brand-pink" />
              <h3 className="text-lg font-poppins font-medium">
                <span className="uppercase tracking-[0.18em]">Mari</span>{" "}
                <span className="uppercase tracking-[0.18em] opacity-80">Beauty</span>
              </h3>
            </Link>
            <p className="font-playfair italic text-base text-brand-pink/80 mb-6 leading-relaxed">
              Beauty is a lifestyle.
            </p>

            {/* Social */}
            <div className="flex items-center gap-3">
              {SOCIAL.map(({ Icon, label, href }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-brand-pink/25 text-brand-pink/80 hover:bg-brand-pink hover:text-brand-wine hover:border-brand-pink transition-all"
                >
                  <Icon className="h-3.5 w-3.5" strokeWidth={1.5} />
                </a>
              ))}
            </div>
          </div>

          {/* Colunas 2, 3, 4 */}
          {NAV_COLUMNS.map((col) => (
            <div key={col.title}>
              <h4 className="text-[11px] font-semibold tracking-[0.24em] uppercase text-brand-pink mb-5">
                {col.title}
              </h4>
              <ul className="space-y-3">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm font-light text-brand-pink/70 hover:text-brand-pink transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Divider + Copyright */}
        <div className="mt-14 sm:mt-20 pt-8 border-t border-brand-pink/15">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-xs text-brand-pink/60">
              © {new Date().getFullYear()} Mari Beauty. Todos os direitos reservados.
            </p>
            <p className="text-xs text-brand-pink/50 italic">
              Desenvolvido com cuidado para despertar seus sentidos
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
