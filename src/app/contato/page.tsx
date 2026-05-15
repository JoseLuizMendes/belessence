/**
 * /contato — Formulário de contato + canais diretos
 */

import { ContactForm } from "@/components/contact-form";
import { Mail, Phone, MapPin, Clock, MessageCircle } from "lucide-react";

export const metadata = {
  title: "Contato — Mari Beauty",
  description:
    "Fale com a Mari Beauty. Atendimento personalizado por email, WhatsApp ou telefone.",
};

const CANAIS = [
  {
    icon: MessageCircle,
    label: "WhatsApp",
    value: "(11) 91234-5678",
    detail: "Resposta em até 2 horas úteis",
    href: "https://wa.me/5511912345678",
  },
  {
    icon: Mail,
    label: "Email",
    value: "ola@maribeauty.com.br",
    detail: "Resposta em até 24 horas",
    href: "mailto:ola@maribeauty.com.br",
  },
  {
    icon: Phone,
    label: "Telefone",
    value: "(11) 3030-2020",
    detail: "Atendimento direto",
    href: "tel:+551130302020",
  },
];

export default function ContatoPage() {
  return (
    <div className="bg-surface-base">
      {/* HERO */}
      <section className="bg-gradient-to-b from-brand-pink/30 to-surface-base py-16 sm:py-20">
        <div className="max-w-4xl mx-auto px-6 sm:px-8 text-center">
          <p className="text-[11px] font-medium tracking-[0.32em] uppercase text-brand-wine mb-3">
            Fale com a gente
          </p>
          <h1 className="font-playfair italic text-4xl sm:text-5xl lg:text-6xl text-ink-strong mb-5 leading-tight">
            Estamos por perto, sempre.
          </h1>
          <p className="text-base sm:text-lg text-ink-soft max-w-2xl mx-auto leading-relaxed">
            Dúvidas sobre fragrâncias, sugestões, pedidos especiais ou só uma
            conversa sobre perfume — nossa equipe responde pessoalmente, sem
            scripts.
          </p>
        </div>
      </section>

      {/* FORM + INFO */}
      <section className="py-16 sm:py-20">
        <div className="max-w-6xl mx-auto px-6 sm:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-12 lg:gap-16">
            {/* FORM */}
            <div className="bg-surface-panel rounded-token-md p-6 sm:p-10">
              <h2 className="font-playfair italic text-2xl sm:text-3xl text-ink-strong mb-2">
                Envie uma mensagem
              </h2>
              <div className="h-px w-12 bg-brand-wine/60 mb-6" />
              <p className="text-sm text-ink-soft mb-8 leading-relaxed">
                Preencha o formulário abaixo. Lemos cada mensagem e respondemos
                em até 24 horas úteis.
              </p>
              <ContactForm />
            </div>

            {/* SIDEBAR */}
            <aside className="space-y-6">
              {/* CANAIS */}
              <div>
                <p className="text-[11px] font-medium tracking-[0.32em] uppercase text-brand-wine mb-4">
                  Canais diretos
                </p>
                <ul className="space-y-4">
                  {CANAIS.map((c) => (
                    <li key={c.label}>
                      <a
                        href={c.href}
                        target={c.href.startsWith("http") ? "_blank" : undefined}
                        rel="noreferrer"
                        className="flex items-start gap-4 p-4 bg-surface-panel rounded-token-md hover:bg-surface-section transition-colors group"
                      >
                        <div className="w-10 h-10 rounded-full bg-brand-wine/10 flex items-center justify-center flex-shrink-0 group-hover:bg-brand-wine/20 transition-colors">
                          <c.icon className="h-4 w-4 text-brand-wine" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[10px] tracking-[0.18em] uppercase text-ink-muted mb-0.5">
                            {c.label}
                          </p>
                          <p className="text-sm text-ink-strong font-medium">
                            {c.value}
                          </p>
                          <p className="text-xs text-ink-soft mt-0.5">
                            {c.detail}
                          </p>
                        </div>
                      </a>
                    </li>
                  ))}
                </ul>
              </div>

              {/* HORÁRIO */}
              <div className="bg-surface-panel rounded-token-md p-6">
                <div className="flex items-center gap-3 mb-3">
                  <Clock className="h-4 w-4 text-brand-wine" />
                  <h3 className="text-[11px] font-medium tracking-[0.24em] uppercase text-ink-strong">
                    Horário de atendimento
                  </h3>
                </div>
                <dl className="space-y-1.5 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-ink-soft">Segunda a sexta</dt>
                    <dd className="text-ink-strong tabular-nums">09h — 18h</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-ink-soft">Sábado</dt>
                    <dd className="text-ink-strong tabular-nums">10h — 14h</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-ink-soft">Domingo</dt>
                    <dd className="text-ink-muted italic">Fechado</dd>
                  </div>
                </dl>
              </div>

              {/* ENDEREÇO */}
              <div className="bg-surface-panel rounded-token-md p-6">
                <div className="flex items-center gap-3 mb-3">
                  <MapPin className="h-4 w-4 text-brand-wine" />
                  <h3 className="text-[11px] font-medium tracking-[0.24em] uppercase text-ink-strong">
                    Onde estamos
                  </h3>
                </div>
                <p className="text-sm text-ink-soft leading-relaxed">
                  Rua das Camélias, 142 — Conjunto 8<br />
                  Vila Madalena — São Paulo, SP<br />
                  CEP 05432-010
                </p>
                <p className="text-xs text-ink-muted mt-3">
                  Visitas mediante agendamento prévio
                </p>
              </div>
            </aside>
          </div>
        </div>
      </section>
    </div>
  );
}
