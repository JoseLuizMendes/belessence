"use client";

/**
 * CheckoutClient — Belessence (estilo Stitch / Bag & Checkout)
 * ─────────────────────────────────────────────────────────────────────
 * Layout 2 colunas:
 *  - ESQUERDA: Form Identificação + Entrega (email, endereço, cidade, estado, CEP, checkbox)
 *  - DIREITA: "Sua Bolsa" — lista de items + Subtotal + Frete + Total + "Finalizar Pedido"
 *
 * Estado vazio: se o carrinho está vazio, mostra mensagem e CTA "Continuar comprando"
 */

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { useCart } from "./cart";
import { Button } from "./ui/button";
import { Minus, Plus, X, ArrowRight, ShoppingBag } from "lucide-react";
import { formatPrice } from "@/api/utils";
import Image from "next/image";
import Link from "next/link";

// ── Schema do form ─────────────────────────────────────────────────────────────

const checkoutSchema = z.object({
  email: z.string().min(1, "E-mail obrigatório").email("E-mail inválido"),
  endereco: z.string().min(3, "Endereço completo obrigatório"),
  cidade: z.string().min(2, "Cidade obrigatória"),
  estado: z.string().min(2, "Estado obrigatório"),
  cep: z.string().min(8, "CEP obrigatório"),
  salvarEndereco: z.boolean().default(false).optional(),
});

type CheckoutForm = z.infer<typeof checkoutSchema>;

// ── Componente ─────────────────────────────────────────────────────────────────

export default function CheckoutClient() {
  const { items, cartTotal, updateQuantity, removeFromCart, clearCart } = useCart();
  const [submitting, setSubmitting] = useState(false);

  const FRETE = cartTotal >= 199 ? 0 : 19.9;
  const total = cartTotal + FRETE;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CheckoutForm>({
    resolver: zodResolver(checkoutSchema),
  });

  const onSubmit = async (data: CheckoutForm) => {
    if (items.length === 0) {
      toast.error("Sua bolsa está vazia.");
      return;
    }
    setSubmitting(true);
    try {
      await new Promise((r) => setTimeout(r, 1200));
      toast.success("Pedido finalizado!", {
        description: `Confirmação enviada para ${data.email}`,
      });
      clearCart();
    } catch {
      toast.error("Erro ao finalizar pedido", { description: "Tente novamente." });
    } finally {
      setSubmitting(false);
    }
  };

  // ── Estado vazio ────────────────────────────────────────────────────────────
  if (items.length === 0) {
    return (
      <div className="max-w-xl mx-auto text-center py-16">
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-surface-section flex items-center justify-center">
          <ShoppingBag className="h-9 w-9 text-brand-wine" strokeWidth={1.2} />
        </div>
        <p className="text-[11px] font-medium tracking-[0.32em] uppercase text-brand-wine mb-4">
          Sua bolsa
        </p>
        <h1 className="font-playfair italic text-[clamp(2rem,5vw,3.4rem)] leading-tight tracking-[-0.02em] text-ink-strong mb-5">
          Bolsa vazia
        </h1>
        <p className="text-sm sm:text-base text-ink-soft font-light mb-8">
          Adicione fragrâncias à sua bolsa para começar.
        </p>
        <Link href="/allProducts">
          <Button
            size="lg"
            className="loreal-btn-pill h-12 px-8 bg-brand-wine text-brand-pink text-[12px] font-medium tracking-[0.18em] uppercase hover:bg-brand-wine/90"
          >
            Continuar comprando
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      </div>
    );
  }

  // ── Layout principal ────────────────────────────────────────────────────────
  return (
    <div>
      {/* Header da página */}
      <div className="text-center mb-10 sm:mb-14">
        <p className="text-[11px] font-medium tracking-[0.32em] uppercase text-brand-wine mb-4">
          Mari Beauty
        </p>
        <h1 className="font-playfair italic text-[clamp(2.4rem,5vw,3.8rem)] leading-tight tracking-[-0.02em] text-ink-strong">
          Checkout
        </h1>
        <div className="mx-auto mt-5 h-px w-12 bg-brand-wine/60" />
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-8 lg:gap-12">
        {/* ESQUERDA — Identificação + Entrega */}
        <div className="space-y-10">
          {/* Identificação */}
          <section className="bg-surface-panel rounded-token-md p-6 sm:p-8">
            <h2 className="font-playfair italic text-xl sm:text-2xl text-ink-strong mb-2">
              Identificação
            </h2>
            <div className="h-px w-12 bg-brand-wine/60 mb-6" />

            <div className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-[10px] font-medium tracking-[0.24em] uppercase text-ink-soft mb-2">
                  Seu e-mail
                </label>
                <input
                  id="email"
                  type="email"
                  placeholder="voce@email.com"
                  {...register("email")}
                  className={`h-12 w-full px-4 text-sm bg-surface-base border rounded-token-sm outline-none transition-colors focus:border-brand-wine ${
                    errors.email ? "border-destructive" : "border-border-subtle"
                  }`}
                />
                {errors.email && (
                  <p className="mt-1 text-xs text-destructive">{errors.email.message}</p>
                )}
              </div>
            </div>
          </section>

          {/* Entrega */}
          <section className="bg-surface-panel rounded-token-md p-6 sm:p-8">
            <h2 className="font-playfair italic text-xl sm:text-2xl text-ink-strong mb-2">
              Entrega
            </h2>
            <div className="h-px w-12 bg-brand-wine/60 mb-6" />

            <div className="space-y-4">
              <div>
                <label htmlFor="endereco" className="block text-[10px] font-medium tracking-[0.24em] uppercase text-ink-soft mb-2">
                  Endereço completo
                </label>
                <input
                  id="endereco"
                  type="text"
                  placeholder="Rua, número, complemento"
                  {...register("endereco")}
                  className={`h-12 w-full px-4 text-sm bg-surface-base border rounded-token-sm outline-none transition-colors focus:border-brand-wine ${
                    errors.endereco ? "border-destructive" : "border-border-subtle"
                  }`}
                />
                {errors.endereco && (
                  <p className="mt-1 text-xs text-destructive">{errors.endereco.message}</p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="cidade" className="block text-[10px] font-medium tracking-[0.24em] uppercase text-ink-soft mb-2">
                    Cidade
                  </label>
                  <input
                    id="cidade"
                    type="text"
                    placeholder="São Paulo"
                    {...register("cidade")}
                    className={`h-12 w-full px-4 text-sm bg-surface-base border rounded-token-sm outline-none transition-colors focus:border-brand-wine ${
                      errors.cidade ? "border-destructive" : "border-border-subtle"
                    }`}
                  />
                  {errors.cidade && (
                    <p className="mt-1 text-xs text-destructive">{errors.cidade.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="estado" className="block text-[10px] font-medium tracking-[0.24em] uppercase text-ink-soft mb-2">
                    Estado
                  </label>
                  <input
                    id="estado"
                    type="text"
                    placeholder="SP"
                    {...register("estado")}
                    className={`h-12 w-full px-4 text-sm bg-surface-base border rounded-token-sm outline-none transition-colors focus:border-brand-wine ${
                      errors.estado ? "border-destructive" : "border-border-subtle"
                    }`}
                  />
                  {errors.estado && (
                    <p className="mt-1 text-xs text-destructive">{errors.estado.message}</p>
                  )}
                </div>
              </div>

              <div>
                <label htmlFor="cep" className="block text-[10px] font-medium tracking-[0.24em] uppercase text-ink-soft mb-2">
                  CEP
                </label>
                <input
                  id="cep"
                  type="text"
                  placeholder="01310-100"
                  {...register("cep")}
                  className={`h-12 w-full px-4 text-sm bg-surface-base border rounded-token-sm outline-none transition-colors focus:border-brand-wine ${
                    errors.cep ? "border-destructive" : "border-border-subtle"
                  }`}
                />
                {errors.cep && (
                  <p className="mt-1 text-xs text-destructive">{errors.cep.message}</p>
                )}
              </div>

              <label className="flex items-center gap-3 pt-2 cursor-pointer text-sm text-ink-soft">
                <input
                  type="checkbox"
                  {...register("salvarEndereco")}
                  className="w-4 h-4 rounded border-border-subtle accent-brand-wine"
                />
                Salvar endereço para futuras compras
              </label>
            </div>
          </section>
        </div>

        {/* DIREITA — Sua Bolsa */}
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="bg-brand-wine text-brand-pink rounded-token-md p-6 sm:p-8">
            <h2 className="font-playfair italic text-xl sm:text-2xl mb-2">
              Sua Bolsa
            </h2>
            <div className="h-px w-12 bg-brand-pink/40 mb-6" />

            {/* Lista de items */}
            <div className="space-y-5 mb-6">
              {items.map((item) => (
                <div key={item.id} className="flex items-start gap-4">
                  <div className="relative w-16 h-16 flex-shrink-0 rounded-token-sm overflow-hidden bg-brand-pink/10">
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      className="object-cover"
                      sizes="64px"
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-playfair italic text-sm leading-tight mb-1.5 line-clamp-2">
                      {item.name}
                    </p>

                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1 text-xs">
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}
                          aria-label="Diminuir"
                          className="w-6 h-6 flex items-center justify-center rounded-full border border-brand-pink/30 text-brand-pink/80 hover:bg-brand-pink/10 transition-colors"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="w-6 text-center">{item.quantity}</span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          aria-label="Aumentar"
                          className="w-6 h-6 flex items-center justify-center rounded-full border border-brand-pink/30 text-brand-pink/80 hover:bg-brand-pink/10 transition-colors"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>

                      <span className="text-sm font-medium">
                        {formatPrice(Number(item.price) * item.quantity)}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => removeFromCart(item.id)}
                    aria-label="Remover"
                    className="text-brand-pink/50 hover:text-brand-pink transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>

            {/* Totais */}
            <div className="border-t border-brand-pink/15 pt-5 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-brand-pink/80">Subtotal</span>
                <span>{formatPrice(cartTotal)}</span>
              </div>

              <div className="flex justify-between text-sm">
                <span className="text-brand-pink/80">Frete</span>
                <span>{FRETE === 0 ? "Grátis" : formatPrice(FRETE)}</span>
              </div>

              <div className="flex justify-between items-baseline pt-3 border-t border-brand-pink/15">
                <span className="text-[10px] font-medium tracking-[0.24em] uppercase text-brand-pink/80">
                  Total
                </span>
                <span className="font-playfair italic text-2xl">
                  {formatPrice(total)}
                </span>
              </div>
            </div>

            {/* CTA */}
            <Button
              type="submit"
              size="lg"
              disabled={submitting}
              className="loreal-btn-pill w-full mt-6 h-12 bg-brand-pink text-brand-wine text-[12px] font-medium tracking-[0.18em] uppercase hover:bg-brand-pink/90 disabled:opacity-60"
            >
              {submitting ? "Processando..." : "Finalizar Pedido"}
              {!submitting && <ArrowRight className="ml-2 h-4 w-4" />}
            </Button>

            <p className="mt-4 text-[10px] text-center text-brand-pink/50 tracking-wide">
              Pagamento seguro · SSL · Mari Beauty
            </p>
          </div>
        </aside>
      </form>
    </div>
  );
}
