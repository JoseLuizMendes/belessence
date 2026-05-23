/**
 * Zod schemas de validação — Belessence
 * Usados tanto no cliente (forms) quanto no servidor (Route Handlers)
 */

import { z } from "zod";

// ─── HELPERS ──────────────────────────────────────────────────────────────────

/** Valida CPF — dígitos verificadores */
function isValidCpf(cpf: string): boolean {
  const digits = cpf.replace(/\D/g, "");
  if (digits.length !== 11 || /^(\d)\1+$/.test(digits)) return false;

  const calcDigit = (slice: string, len: number) => {
    const sum = slice
      .split("")
      .reduce((acc, d, i) => acc + Number(d) * (len + 1 - i), 0);
    const rem = (sum * 10) % 11;
    return rem === 10 || rem === 11 ? 0 : rem;
  };

  return (
    calcDigit(digits.slice(0, 9), 9) === Number(digits[9]) &&
    calcDigit(digits.slice(0, 10), 10) === Number(digits[10])
  );
}

/** Valida CEP — apenas formato 00000-000 ou 00000000 */
const cepRegex = /^\d{5}-?\d{3}$/;

// ─── CHECKOUT ─────────────────────────────────────────────────────────────────

export const checkoutCustomerSchema = z.object({
  name:  z.string().min(3, "Nome deve ter pelo menos 3 caracteres"),
  email: z.string().email("Email inválido"),
  phone: z
    .string()
    .regex(/^\(?\d{2}\)?\s?\d{4,5}-?\d{4}$/, "Telefone inválido"),
  cpf: z
    .string()
    .refine(isValidCpf, { message: "CPF inválido" }),
});

export const checkoutAddressSchema = z.object({
  cep:          z.string().regex(cepRegex, "CEP inválido"),
  street:       z.string().min(3, "Logradouro obrigatório"),
  number:       z.string().min(1, "Número obrigatório"),
  complement:   z.string().optional(),
  neighborhood: z.string().min(2, "Bairro obrigatório"),
  city:         z.string().min(2, "Cidade obrigatória"),
  state:        z.string().length(2, "UF deve ter 2 letras"),
});

export const checkoutSchema = z.object({
  customer: checkoutCustomerSchema,
  address:  checkoutAddressSchema,
  couponCode: z.string().optional(),
  // paymentMethod definido no Brick — não precisa validar aqui
});

export type CheckoutInput   = z.infer<typeof checkoutSchema>;
export type CheckoutCustomer = z.infer<typeof checkoutCustomerSchema>;
export type CheckoutAddress  = z.infer<typeof checkoutAddressSchema>;

// ─── REVIEW ───────────────────────────────────────────────────────────────────

export const reviewSchema = z.object({
  productId:   z.string().uuid("ID de produto inválido"),
  authorName:  z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  authorEmail: z.string().email("Email inválido"),
  rating:      z.number().int().min(1).max(5),
  text:        z.string().max(250, "Máximo 250 caracteres").optional(),
});

export type ReviewInput = z.infer<typeof reviewSchema>;

// ─── CUPOM ────────────────────────────────────────────────────────────────────

export const couponValidateSchema = z.object({
  code:         z.string().min(1, "Código obrigatório").toUpperCase(),
  orderSubtotal: z.number().positive("Subtotal inválido"),
});

export type CouponValidateInput = z.infer<typeof couponValidateSchema>;

// ─── ADMIN — ATUALIZAÇÃO DE STATUS ────────────────────────────────────────────

export const orderStatusSchema = z.object({
  status: z.enum([
    "PENDING",
    "PAYMENT_CONFIRMED",
    "PREPARING",
    "SHIPPED",
    "DELIVERED",
    "CANCELLED",
  ]),
  trackingCode: z.string().optional(), // obrigatório quando status = SHIPPED
}).refine(
  (data) => data.status !== "SHIPPED" || !!data.trackingCode,
  { message: "Código de rastreio obrigatório ao marcar como Enviado", path: ["trackingCode"] }
);

export type OrderStatusInput = z.infer<typeof orderStatusSchema>;

// ─── AUTENTICAÇÃO ─────────────────────────────────────────────────────────────

export const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(1, "Senha obrigatória"),
});

export const registerSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  email: z.string().email("Email inválido"),
  password: z.string().min(8, "Senha deve ter pelo menos 8 caracteres"),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
