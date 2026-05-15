/**
 * /ajuda — Central de Ajuda com FAQ
 */

import Link from "next/link";
import { FAQAccordion } from "@/components/faq-accordion";
import {
  Truck,
  RefreshCcw,
  CreditCard,
  Droplets,
  Sparkles,
  Gift,
} from "lucide-react";

export const metadata = {
  title: "Central de Ajuda — Mari Beauty",
  description:
    "Tire suas dúvidas sobre pedidos, entrega, trocas e cuidados com fragrâncias Mari Beauty.",
};

const CATEGORIAS = [
  { icon: Truck, title: "Entrega" },
  { icon: RefreshCcw, title: "Trocas" },
  { icon: CreditCard, title: "Pagamento" },
  { icon: Droplets, title: "Conservação" },
  { icon: Sparkles, title: "Escolha" },
  { icon: Gift, title: "Presente" },
];

const FAQS = [
  {
    question: "Como funciona o prazo de entrega?",
    answer:
      "Após a confirmação do pagamento, o pedido é separado em até 2 dias úteis. O prazo total varia por região:\n\n• Sudeste (SP, RJ, MG, ES): 2 a 4 dias úteis\n• Sul (PR, SC, RS): 3 a 5 dias úteis\n• Centro-Oeste: 4 a 7 dias úteis\n• Nordeste: 5 a 9 dias úteis\n• Norte: 7 a 12 dias úteis\n\nFrete grátis em compras acima de R$ 199 para todo o Brasil. Você acompanha cada etapa pelo código de rastreio enviado por email.",
  },
  {
    question: "Posso trocar ou devolver meu perfume?",
    answer:
      "Sim. Você tem até 7 dias corridos após o recebimento para solicitar troca ou devolução, conforme o Código de Defesa do Consumidor. O frasco precisa estar lacrado, na embalagem original, sem sinais de uso. Em caso de defeito de fabricação, o prazo é estendido para 30 dias. Para iniciar, envie email para ola@maribeauty.com.br com o número do pedido — respondemos no mesmo dia útil.",
  },
  {
    question: "Quais formas de pagamento vocês aceitam?",
    answer:
      "Aceitamos cartão de crédito (Visa, Mastercard, Elo, American Express, Hipercard) em até 6× sem juros, PIX com 5% de desconto à vista e boleto bancário (compensação em 1-2 dias úteis). Todos os pagamentos são processados em ambiente seguro, com criptografia de ponta a ponta.",
  },
  {
    question: "Como devo conservar minha fragrância?",
    answer:
      "Perfume é frágil — gosta de escuro, fresco e estável. Algumas regras simples para garantir longevidade:\n\n• Guarde longe da luz solar direta\n• Evite banheiros (umidade e variação térmica aceleram a oxidação)\n• Mantenha o frasco fechado quando não estiver em uso\n• Temperatura ideal: entre 15°C e 25°C\n• Não congele e não exponha a fontes de calor\n\nBem conservada, uma fragrância Mari Beauty mantém qualidade plena por até 5 anos.",
  },
  {
    question: "Como escolher a fragrância certa pra mim?",
    answer:
      "Cada coleção tem um propósito olfativo:\n\n• Day: notas frescas e florais, ideais para o dia a dia, ambientes profissionais e momentos de luminosidade.\n• Night: notas orientais, especiarias e madeiras — para ocasiões marcantes, jantares e momentos íntimos.\n• Limited: edições autorais, em pequenos lotes, com composições mais ousadas.\n\nSe estiver em dúvida, recomendamos começar pelo nosso Kit Descoberta — você recebe três miniaturas para testar antes de investir num frasco grande. Em breve lançaremos também um quiz olfativo com IA para recomendação personalizada.",
  },
  {
    question: "Quanto tempo dura um perfume Mari Beauty na pele?",
    answer:
      "Nossas fragrâncias são Eau de Parfum, com concentração entre 15% e 20% de essência — o que garante durabilidade de 6 a 10 horas em média. A persistência varia com tipo de pele, clima e ponto de aplicação. Dica: aplique em pontos quentes (pulsos, atrás das orelhas, dobra interna do cotovelo) sobre a pele hidratada.",
  },
  {
    question: "Como funciona o programa de fidelidade?",
    answer:
      "Estamos preparando o programa Mari Club, com benefícios como cashback de 5%, acesso antecipado a lançamentos, brindes em datas especiais e degustação de fragrâncias inéditas antes da venda oficial. O lançamento está previsto para o próximo trimestre — cadastre-se na newsletter para receber o convite em primeira mão.",
  },
  {
    question: "Vocês fazem testes em animais?",
    answer:
      "Não, nunca. Mari Beauty é certificada cruelty-free desde a fundação. Nenhum dos nossos produtos ou ingredientes é testado em animais em nenhuma etapa do processo. Trabalhamos exclusivamente com fornecedores que compartilham desse compromisso.",
  },
  {
    question: "Posso comprar como presente e enviar para outro endereço?",
    answer:
      "Sim. No checkout, o campo de endereço de entrega é independente dos dados do comprador — você pode informar qualquer endereço no Brasil. Se quiser uma embalagem-presente com cartão personalizado, escreva uma observação no momento do pedido ou nos avise pelo WhatsApp após finalizar a compra. Não cobramos taxa extra por isso.",
  },
  {
    question: "O que faço se meu pedido chegar danificado?",
    answer:
      "Embora a gente embale com cuidado obsessivo, acidentes acontecem no transporte. Se receber o pedido com o frasco quebrado, lacre violado ou produto vazado, tire fotos imediatamente (antes de abrir qualquer coisa) e envie para ola@maribeauty.com.br com o número do pedido. Substituímos o produto em até 5 dias úteis, sem custo nenhum para você.",
  },
];

export default function AjudaPage() {
  return (
    <div className="bg-surface-base">
      {/* HERO */}
      <section className="bg-gradient-to-b from-brand-pink/30 to-surface-base py-16 sm:py-20">
        <div className="max-w-4xl mx-auto px-6 sm:px-8 text-center">
          <p className="text-[11px] font-medium tracking-[0.32em] uppercase text-brand-wine mb-3">
            Central de Ajuda
          </p>
          <h1 className="font-playfair italic text-4xl sm:text-5xl lg:text-6xl text-ink-strong mb-5 leading-tight">
            Tudo que você precisa saber.
          </h1>
          <p className="text-base sm:text-lg text-ink-soft max-w-2xl mx-auto leading-relaxed">
            Respondemos as dúvidas mais comuns sobre pedidos, fragrâncias e
            cuidados. Não encontrou o que procura? Fale com a gente diretamente.
          </p>
        </div>
      </section>

      {/* CATEGORIAS */}
      <section className="py-10 border-y border-border-subtle bg-surface-panel">
        <div className="max-w-6xl mx-auto px-6 sm:px-8">
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 sm:gap-4">
            {CATEGORIAS.map((c) => (
              <div
                key={c.title}
                className="flex flex-col items-center gap-2 p-4 rounded-token-md hover:bg-surface-base transition-colors"
              >
                <div className="w-11 h-11 rounded-full bg-brand-wine/10 flex items-center justify-center">
                  <c.icon className="h-4 w-4 text-brand-wine" />
                </div>
                <p className="text-[10px] sm:text-xs tracking-[0.14em] uppercase text-ink-soft text-center">
                  {c.title}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 sm:py-20">
        <div className="max-w-4xl mx-auto px-6 sm:px-8">
          <div className="mb-10">
            <p className="text-[11px] font-medium tracking-[0.32em] uppercase text-brand-wine mb-2">
              Perguntas frequentes
            </p>
            <h2 className="font-playfair italic text-3xl sm:text-4xl text-ink-strong">
              Dúvidas mais comuns
            </h2>
          </div>

          <FAQAccordion items={FAQS} />
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="py-16 bg-brand-wine text-brand-pink">
        <div className="max-w-3xl mx-auto px-6 sm:px-8 text-center">
          <h2 className="font-playfair italic text-3xl sm:text-4xl mb-4">
            Não encontrou sua resposta?
          </h2>
          <p className="text-sm text-brand-pink/80 mb-8 max-w-xl mx-auto">
            Estamos a uma mensagem de distância. Nossa equipe responde
            pessoalmente, sem chatbots, em até 24 horas úteis.
          </p>
          <Link
            href="/contato"
            className="inline-block px-8 py-3 bg-brand-pink text-brand-wine text-[11px] font-medium tracking-[0.18em] uppercase rounded-full hover:bg-brand-pink/90 transition-colors"
          >
            Fale conosco
          </Link>
        </div>
      </section>
    </div>
  );
}
