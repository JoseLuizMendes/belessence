"use client";

/**
 * Parte interativa do login admin (Caminho A: senha + TOTP).
 * A server action `login` vive em `app/admin/login/page.tsx` e é passada
 * como prop. Aqui só cuidamos da UX: input OTP segmentado, estado de
 * envio e cópia que deixa claro que o código vem do app autenticador.
 */

import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";

interface Props {
  /** Server action de login (recebe a FormData do formulário). */
  action: (formData: FormData) => void | Promise<void>;
  redirectTo: string;
  totpOn: boolean;
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      disabled={pending}
      className="loreal-btn-pill w-full h-12 bg-brand-wine text-brand-pink text-[12px] font-medium tracking-[0.18em] uppercase hover:bg-brand-wine/90 disabled:opacity-60"
    >
      {pending ? "Entrando…" : "Entrar"}
    </Button>
  );
}

export function AdminLoginForm({ action, redirectTo, totpOn }: Props) {
  return (
    <form action={action} className="space-y-5">
      <input type="hidden" name="redirect" value={redirectTo} />

      <div>
        <label
          htmlFor="password"
          className="block text-[10px] font-medium tracking-[0.24em] uppercase text-ink-soft mb-2"
        >
          Senha
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoFocus
          autoComplete="current-password"
          className="h-12 w-full px-4 text-sm bg-surface-base border border-border-subtle rounded-token-sm outline-none transition-colors focus:border-brand-wine"
        />
      </div>

      {totpOn && (
        <div className="flex flex-col items-center justify-center">
          <label
            htmlFor="code"
            className="block text-[10px] font-medium tracking-[0.24em] uppercase text-ink-soft mb-2"
          >
            Código do autenticador
          </label>
          <InputOTP
            id="code"
            name="code"
            maxLength={6}
            inputMode="numeric"
            pattern="\d*"
            autoComplete="one-time-code"
            containerClassName="justify-between"
          >
            <InputOTPGroup className="gap-2">
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <InputOTPSlot
                  key={i}
                  index={i}
                  className="h-12 w-11 rounded-token-sm border-border-subtle bg-surface-base text-base data-[active=true]:border-brand-wine data-[active=true]:ring-brand-wine/30"
                />
              ))}
            </InputOTPGroup>
          </InputOTP>
          <p className="mt-2 text-[11px] leading-relaxed text-ink-muted">
            Abra seu app autenticador (Authy) e digite
            o código de 6 dígitos. Ele muda a cada 30 segundos.
          </p>
        </div>
      )}

      <SubmitButton />
    </form>
  );
}
