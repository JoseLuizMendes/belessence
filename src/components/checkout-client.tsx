"use client";

/**
 * CheckoutClient — Belessence (regras de negócio reais)
 * ─────────────────────────────────────────────────────────────────────
 * Layout 2 colunas (estilo Stitch):
 *  - ESQUERDA: Form completo (Identificação + Entrega com CEP autocomplete + Cupom)
 *  - DIREITA: "Sua Bolsa" — items + Subtotal + Desconto + Frete + Total + CTA
 *
 * Integrações:
 *  - /api/cep/[cep]?subtotal=N → autopreenche endereço + calcula frete
 *  - /api/coupon/validate → valida cupom, calcula desconto
 *  - /api/checkout → cria Order no banco, mockup de pagamento aprovado
 *  - router.push(/sucesso/[id]) ao sucesso
 *
 * Validação: checkoutSchema completo de src/lib/validations.ts
 * (nome, email, telefone, CPF com dígito verificador, CEP regex)
 */

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, type Control, type FieldPath } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { useCart } from "./cart";
import { Button } from "./ui/button";
import { Spinner } from "./ui/spinner";
import {
  Minus,
  Plus,
  X,
  ArrowRight,
  ShoppingBag,
  Tag,
  CheckCircle2,
} from "lucide-react";
import { formatPrice } from "@/shadcn-utils/utils";
import Image from "next/image";
import Link from "next/link";
import { checkoutSchema, type CheckoutInput } from "@/lib/shared/domain/zod-schemas";
import { Input } from "./ui/input";
import {
  Form,
  FormControl,
  FormField as ShadcnFormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "./ui/form";

// ─── Types ─────────────────────────────────────────────────────────────────────

interface AppliedCoupon {
  code: string;
  discount: number;
  message?: string;
}

interface CepResponse {
  cep: string;
  street: string;
  neighborhood: string;
  city: string;
  state: string;
  shippingCost: number;
  isFreeShippingEligible: boolean;
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

/** Máscara de CPF: 000.000.000-00 */
function maskCpf(value: string): string {
  return value
    .replace(/\D/g, "")
    .slice(0, 11)
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
}

/** Máscara de telefone: (00) 00000-0000 */
function maskPhone(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 10) {
    return digits
      .replace(/(\d{2})(\d)/, "($1) $2")
      .replace(/(\d{4})(\d)/, "$1-$2");
  }
  return digits
    .replace(/(\d{2})(\d)/, "($1) $2")
    .replace(/(\d{5})(\d)/, "$1-$2");
}

/** Máscara de CEP: 00000-000 */
function maskCep(value: string): string {
  return value
    .replace(/\D/g, "")
    .slice(0, 8)
    .replace(/(\d{5})(\d)/, "$1-$2");
}

// ─── Componente ────────────────────────────────────────────────────────────────

export default function CheckoutClient() {
  const router = useRouter();
  const {
    items,
    updateQuantity,
    removeFromCart,
    selectedItems,
    selectedTotal,
    setAllSelected,
    removeOrdered,
  } = useCart();

  // Se chegou ao checkout sem nada selecionado (mas com carrinho), seleciona
  // tudo por padrão — garante um estado utilizável em navegação direta.
  useEffect(() => {
    if (items.length > 0 && selectedItems.length === 0) {
      setAllSelected(true);
    }
  }, [items.length, selectedItems.length, setAllSelected]);

  const unselectedCount = items.length - selectedItems.length;

  // Estados do checkout
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(null);
  const [couponInput, setCouponInput] = useState("");
  const [couponLoading, setCouponLoading] = useState(false);
  const [shippingCost, setShippingCost] = useState<number>(0);
  const [cepLoading, setCepLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form
  const form = useForm<CheckoutInput>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      customer: { name: "", email: "", phone: "", cpf: "" },
      address: {
        cep: "",
        street: "",
        number: "",
        complement: "",
        neighborhood: "",
        city: "",
        state: "",
      },
      couponCode: "",
    },
  });
  const { handleSubmit, setValue, watch } = form;

  const cep = watch("address.cep");

  // Subtotal sem desconto — apenas dos itens selecionados para checkout.
  const subtotal = selectedTotal;
  const discount = appliedCoupon?.discount ?? 0;
  const subtotalAfterDiscount = Math.max(0, subtotal - discount);
  const total = subtotalAfterDiscount + shippingCost;

  // ── Busca CEP automaticamente quando completar 8 dígitos ───────────────────
  useEffect(() => {
    const cleanCep = cep?.replace(/\D/g, "") ?? "";
    if (cleanCep.length !== 8) return;

    let cancelled = false;
    setCepLoading(true);

    fetch(`/api/cep/${cleanCep}?subtotal=${subtotalAfterDiscount}`)
      .then((r) => r.json())
      .then((data: CepResponse | { error: string }) => {
        if (cancelled) return;
        if ("error" in data) {
          toast.error(data.error);
          setShippingCost(0);
          return;
        }
        setValue("address.street", data.street, { shouldValidate: true });
        setValue("address.neighborhood", data.neighborhood, { shouldValidate: true });
        setValue("address.city", data.city, { shouldValidate: true });
        setValue("address.state", data.state, { shouldValidate: true });
        setShippingCost(data.shippingCost);
        if (data.isFreeShippingEligible) {
          toast.success("Frete grátis disponível! 🎉");
        }
      })
      .catch(() => {
        if (!cancelled) toast.error("Erro ao consultar CEP");
      })
      .finally(() => {
        if (!cancelled) setCepLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [cep, subtotalAfterDiscount, setValue]);

  // ── Aplicar cupom ──────────────────────────────────────────────────────────
  const handleApplyCoupon = async () => {
    const code = couponInput.trim().toUpperCase();
    if (!code) {
      toast.error("Digite um código de cupom");
      return;
    }
    setCouponLoading(true);
    try {
      const res = await fetch("/api/coupon/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, orderSubtotal: subtotal }),
      });
      const data = await res.json();
      if (data.valid) {
        setAppliedCoupon({
          code: data.code ?? code,
          discount: data.discount,
          message: data.message,
        });
        setValue("couponCode", code);
        toast.success(data.message ?? "Cupom aplicado!");
      } else {
        toast.error(data.message ?? "Cupom inválido");
        setAppliedCoupon(null);
      }
    } catch {
      toast.error("Erro ao validar cupom");
    } finally {
      setCouponLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponInput("");
    setValue("couponCode", "");
  };

  // ── Submit do checkout ─────────────────────────────────────────────────────
  const onSubmit = async (data: CheckoutInput) => {
    if (selectedItems.length === 0) {
      toast.error("Selecione ao menos um item para finalizar.");
      return;
    }
    setSubmitting(true);
    try {
      const purchasedIds = selectedItems.map((i) => i.id);
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer: data.customer,
          address: data.address,
          items: selectedItems.map((i) => ({ productId: i.id, quantity: i.quantity })),
          couponCode: appliedCoupon?.code,
        }),
      });
      const result = await res.json();

      if (!res.ok) {
        toast.error(result.error ?? "Erro ao finalizar pedido");
        setSubmitting(false);
        return;
      }

      toast.success("Pedido confirmado!", {
        description: "Você será redirecionada em instantes...",
      });
      // Remove só os itens comprados — os não selecionados ficam no carrinho.
      removeOrdered(purchasedIds);
      router.push(`/sucesso/${result.orderId}`);
    } catch {
      toast.error("Erro ao finalizar pedido. Tente novamente.");
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

      <Form {...form}>
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="grid grid-cols-1 lg:grid-cols-[1fr_360px] xl:grid-cols-[1fr_440px] gap-8 lg:gap-10 xl:gap-12"
      >
        {/* ESQUERDA — Identificação + Entrega + Cupom */}
        <div className="space-y-10">
          {/* IDENTIFICAÇÃO */}
          <section className="bg-surface-panel rounded-token-md p-4 sm:p-6 md:p-8">
            <h2 className="font-playfair italic text-xl sm:text-2xl text-ink-strong mb-2">
              Identificação
            </h2>
            <div className="h-px w-12 bg-brand-wine/60 mb-6" />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <CheckoutField
                control={form.control}
                name="customer.name"
                label="Nome completo"
                placeholder="Maria da Silva"
                wrapperClassName="sm:col-span-2"
              />
              <CheckoutField
                control={form.control}
                name="customer.email"
                type="email"
                label="E-mail"
                placeholder="voce@email.com"
              />
              <CheckoutField
                control={form.control}
                name="customer.phone"
                label="Telefone"
                placeholder="(11) 99999-9999"
                mask={maskPhone}
              />
              <CheckoutField
                control={form.control}
                name="customer.cpf"
                label="CPF"
                placeholder="000.000.000-00"
                mask={maskCpf}
                wrapperClassName="sm:col-span-2"
              />
            </div>
          </section>

          {/* ENTREGA */}
          <section className="bg-surface-panel rounded-token-md p-4 sm:p-6 md:p-8">
            <h2 className="font-playfair italic text-xl sm:text-2xl text-ink-strong mb-2">
              Entrega
            </h2>
            <div className="h-px w-12 bg-brand-wine/60 mb-6" />

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="relative">
                <CheckoutField
                  control={form.control}
                  name="address.cep"
                  label="CEP"
                  placeholder="00000-000"
                  mask={maskCep}
                />
                {cepLoading && (
                  <Spinner className="absolute right-3 top-9 text-brand-wine" />
                )}
              </div>

              <CheckoutField
                control={form.control}
                name="address.street"
                label="Logradouro"
                placeholder="Rua, Avenida..."
                wrapperClassName="sm:col-span-2"
              />

              <CheckoutField
                control={form.control}
                name="address.number"
                label="Número"
                placeholder="123"
              />

              <CheckoutField
                control={form.control}
                name="address.complement"
                label="Complemento"
                placeholder="Apto, bloco..."
                optional
                wrapperClassName="sm:col-span-2"
              />

              <CheckoutField
                control={form.control}
                name="address.neighborhood"
                label="Bairro"
                placeholder="Bairro"
              />

              <CheckoutField
                control={form.control}
                name="address.city"
                label="Cidade"
                placeholder="Cidade"
              />

              <CheckoutField
                control={form.control}
                name="address.state"
                label="UF"
                placeholder="SP"
                maxLength={2}
                mask={(v) => v.toUpperCase().slice(0, 2)}
              />
            </div>
          </section>

          {/* CUPOM */}
          <section className="bg-surface-panel rounded-token-md p-4 sm:p-6 md:p-8">
            <h2 className="font-playfair italic text-xl sm:text-2xl text-ink-strong mb-2">
              Cupom de desconto
            </h2>
            <div className="h-px w-12 bg-brand-wine/60 mb-6" />

            {appliedCoupon ? (
              <div className="flex items-center justify-between gap-4 p-4 bg-brand-pink/30 rounded-token-sm border border-brand-wine/20">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-brand-wine flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-ink-strong">
                      {appliedCoupon.code}
                    </p>
                    <p className="text-xs text-ink-soft">
                      {appliedCoupon.message ??
                        `Desconto de ${formatPrice(appliedCoupon.discount)}`}
                    </p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={handleRemoveCoupon}
                  className="h-auto p-0 text-xs text-ink-soft hover:bg-transparent hover:text-destructive"
                >
                  Remover
                </Button>
              </div>
            ) : (
              <div className="flex gap-3">
                <div className="relative flex-1">
                  <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-muted z-10" />
                  <Input
                    type="text"
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                    placeholder="Ex: BELES10"
                    className="h-12 pl-10 bg-surface-base text-sm border-border-subtle rounded-token-sm focus-visible:border-brand-wine focus-visible:ring-0 uppercase tracking-wider"
                  />
                </div>
                <Button
                  type="button"
                  onClick={handleApplyCoupon}
                  disabled={couponLoading || !couponInput.trim()}
                  className="loreal-btn-pill h-12 px-6 bg-brand-wine text-brand-pink text-[11px] font-medium tracking-[0.18em] uppercase hover:bg-brand-wine/90 disabled:opacity-50"
                >
                  {couponLoading ? <Spinner /> : "Aplicar"}
                </Button>
              </div>
            )}

            <p className="mt-3 text-xs text-ink-muted">
              💡 Experimente: <strong>BELES10</strong> (10% off), <strong>FRETE15</strong> (R$15 off, mínimo R$100), <strong>PRIMEIRA20</strong> (20% off, mínimo R$250)
            </p>
          </section>
        </div>

        {/* DIREITA — Sua Bolsa */}
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="bg-brand-wine text-brand-pink rounded-token-md p-4 sm:p-6 md:p-8">
            <h2 className="font-playfair italic text-xl sm:text-2xl mb-2">
              Sua Bolsa
            </h2>
            <div className="h-px w-12 bg-brand-pink/40 mb-6" />

            {/* Lista de items (apenas os selecionados para checkout) */}
            <div className="space-y-5 mb-6 max-h-96 overflow-y-auto pr-1">
              {selectedItems.map((item) => (
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
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}
                          aria-label="Diminuir"
                          className="size-6 rounded-full border border-brand-pink/30 text-brand-pink/80 hover:bg-brand-pink/10 hover:text-brand-pink"
                        >
                          <Minus className="size-3" />
                        </Button>
                        <span className="w-6 text-center">{item.quantity}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          aria-label="Aumentar"
                          className="size-6 rounded-full border border-brand-pink/30 text-brand-pink/80 hover:bg-brand-pink/10 hover:text-brand-pink"
                        >
                          <Plus className="size-3" />
                        </Button>
                      </div>

                      <span className="text-sm font-medium">
                        {formatPrice(Number(item.price) * item.quantity)}
                      </span>
                    </div>
                  </div>

                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => removeFromCart(item.id)}
                    aria-label="Remover"
                    className="h-auto w-auto p-0 text-brand-pink/50 hover:bg-transparent hover:text-brand-pink"
                  >
                    <X className="size-4" />
                  </Button>
                </div>
              ))}
            </div>

            {unselectedCount > 0 && (
              <p className="mb-4 text-[11px] text-brand-pink/70">
                {unselectedCount}{" "}
                {unselectedCount === 1
                  ? "item permanecerá no seu carrinho"
                  : "itens permanecerão no seu carrinho"}{" "}
                após esta compra.
              </p>
            )}

            {/* Totais */}
            <div className="border-t border-brand-pink/15 pt-5 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-brand-pink/80">Subtotal</span>
                <span>{formatPrice(subtotal)}</span>
              </div>

              {discount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-brand-pink/80 flex items-center gap-1.5">
                    <Tag className="h-3 w-3" />
                    Desconto ({appliedCoupon?.code})
                  </span>
                  <span className="text-emerald-300">
                    − {formatPrice(discount)}
                  </span>
                </div>
              )}

              <div className="flex justify-between text-sm">
                <span className="text-brand-pink/80">Frete</span>
                <span>
                  {shippingCost === 0 && cep
                    ? "Grátis"
                    : cep
                      ? formatPrice(shippingCost)
                      : "Calculado após CEP"}
                </span>
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
              {submitting ? (
                <>
                  <Spinner className="mr-2" />
                  Processando...
                </>
              ) : (
                <>
                  Finalizar Pedido
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>

            <p className="mt-4 text-[10px] text-center text-brand-pink/50 tracking-wide">
              Pagamento seguro · SSL · Mari Beauty
            </p>

            {/* Aviso modo demo */}
            <p className="mt-2 text-[10px] text-center text-brand-pink/40 italic">
              🚧 Modo demo: o pagamento será simulado
            </p>
          </div>
        </aside>
      </form>
      </Form>
    </div>
  );
}

// ─── CheckoutField — wrapper de shadcn FormField + Input ───────────────────────

interface CheckoutFieldProps {
  control: Control<CheckoutInput>;
  name: FieldPath<CheckoutInput>;
  label: string;
  placeholder?: string;
  type?: React.HTMLInputTypeAttribute;
  maxLength?: number;
  optional?: boolean;
  wrapperClassName?: string;
  /** Função que transforma o valor digitado antes de gravar (máscara). */
  mask?: (value: string) => string;
}

function CheckoutField({
  control,
  name,
  label,
  placeholder,
  type,
  maxLength,
  optional,
  wrapperClassName,
  mask,
}: CheckoutFieldProps) {
  return (
    <ShadcnFormField
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <FormItem className={wrapperClassName}>
          <FormLabel className="block text-[10px] font-medium tracking-[0.24em] uppercase text-ink-soft">
            {label}
            {optional && (
              <span className="text-ink-muted normal-case tracking-normal ml-1">
                (opcional)
              </span>
            )}
          </FormLabel>
          <FormControl>
            <Input
              type={type}
              placeholder={placeholder}
              maxLength={maxLength}
              {...field}
              value={typeof field.value === "string" ? field.value : ""}
              onChange={(e) => {
                const v = mask ? mask(e.target.value) : e.target.value;
                field.onChange(v);
              }}
              className={`h-12 bg-surface-base text-sm rounded-token-sm focus-visible:ring-0 focus-visible:border-brand-wine ${
                fieldState.error
                  ? "border-destructive"
                  : "border-border-subtle"
              }`}
            />
          </FormControl>
          <FormMessage className="text-xs" />
        </FormItem>
      )}
    />
  );
}
