"use client";

/**
 * AuthForm — formulário de login/cadastro reutilizável.
 * ─────────────────────────────────────────────────────────────────────
 * Usado pelo modal de bloqueio (AuthDialog) e pelas páginas /entrar e
 * /cadastro. Alterna entre "entrar" e "criar conta" internamente.
 *
 * - Login: signIn("credentials") com redirect:false.
 * - Cadastro: registerUser (server action) + login automático.
 * - Google: cabeado mas desativado (sem chaves OAuth ainda).
 *
 * `onSuccess` é chamado após autenticação bem-sucedida (o modal usa para
 * fechar e rodar a ação pendente; as páginas usam para redirecionar).
 */

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signIn } from "next-auth/react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { registerUser } from "@/lib/auth-actions";
import {
  loginSchema,
  registerSchema,
  type LoginInput,
  type RegisterInput,
} from "@/lib/shared/domain/zod-schemas";

type AuthMode = "login" | "register";

interface AuthFormProps {
  initialMode?: AuthMode;
  /** Chamado após login/cadastro com sucesso. */
  onSuccess?: () => void;
  /** Chamado quando o modo de autenticação muda internamente. */
  onModeChange?: (mode: AuthMode) => void;
}

const FIELD_LABEL =
  "block text-[10px] font-medium tracking-[0.24em] uppercase text-ink-soft mb-2";
const FIELD_ERROR = "mt-1 text-xs text-destructive";

function LoginForm({ onSuccess }: { onSuccess?: () => void }) {
  const [submitting, setSubmitting] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (values: LoginInput) => {
    setSubmitting(true);
    const res = await signIn("credentials", { ...values, redirect: false });
    setSubmitting(false);
    if (res?.error) {
      toast.error("Email ou senha incorretos");
      return;
    }
    toast.success("Bem-vinda de volta!");
    onSuccess?.();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <div>
        <Label htmlFor="login-email" className={FIELD_LABEL}>
          Email
        </Label>
        <Input
          id="login-email"
          type="email"
          autoComplete="email"
          placeholder="seu@email.com"
          {...register("email")}
        />
        {errors.email && <p className={FIELD_ERROR}>{errors.email.message}</p>}
      </div>
      <div>
        <Label htmlFor="login-password" className={FIELD_LABEL}>
          Senha
        </Label>
        <Input
          id="login-password"
          type="password"
          autoComplete="current-password"
          placeholder="••••••••"
          {...register("password")}
        />
        {errors.password && (
          <p className={FIELD_ERROR}>{errors.password.message}</p>
        )}
      </div>
      <Button type="submit" disabled={submitting} className="w-full">
        {submitting && <Spinner />}
        Entrar
      </Button>
    </form>
  );
}

function RegisterForm({ onSuccess }: { onSuccess?: () => void }) {
  const [submitting, setSubmitting] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: "", email: "", password: "" },
  });

  const onSubmit = async (values: RegisterInput) => {
    setSubmitting(true);
    const res = await registerUser(values);
    if (!res.ok) {
      setSubmitting(false);
      toast.error(res.error);
      return;
    }
    // Login automático logo após criar a conta.
    const signed = await signIn("credentials", {
      email: values.email,
      password: values.password,
      redirect: false,
    });
    setSubmitting(false);
    if (signed?.error) {
      toast.error("Conta criada, mas falha ao entrar. Tente fazer login.");
      return;
    }
    toast.success("Conta criada com sucesso!");
    onSuccess?.();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <div>
        <Label htmlFor="register-name" className={FIELD_LABEL}>
          Nome
        </Label>
        <Input
          id="register-name"
          type="text"
          autoComplete="name"
          placeholder="Seu nome"
          {...register("name")}
        />
        {errors.name && <p className={FIELD_ERROR}>{errors.name.message}</p>}
      </div>
      <div>
        <Label htmlFor="register-email" className={FIELD_LABEL}>
          Email
        </Label>
        <Input
          id="register-email"
          type="email"
          autoComplete="email"
          placeholder="seu@email.com"
          {...register("email")}
        />
        {errors.email && <p className={FIELD_ERROR}>{errors.email.message}</p>}
      </div>
      <div>
        <Label htmlFor="register-password" className={FIELD_LABEL}>
          Senha
        </Label>
        <Input
          id="register-password"
          type="password"
          autoComplete="new-password"
          placeholder="Mínimo 8 caracteres"
          {...register("password")}
        />
        {errors.password && (
          <p className={FIELD_ERROR}>{errors.password.message}</p>
        )}
      </div>
      <Button type="submit" disabled={submitting} className="w-full">
        {submitting && <Spinner />}
        Criar conta
      </Button>
    </form>
  );
}

export function AuthForm({ initialMode = "login", onSuccess, onModeChange }: AuthFormProps) {
  const [mode, setMode] = useState<AuthMode>(initialMode);

  return (
    <div className="space-y-5">
      {mode === "login" ? (
        <LoginForm onSuccess={onSuccess} />
      ) : (
        <RegisterForm onSuccess={onSuccess} />
      )}

      <div className="flex items-center gap-3">
        <span className="h-px flex-1 bg-border-subtle" />
        <span className="text-[10px] tracking-[0.18em] uppercase text-ink-muted">
          ou
        </span>
        <span className="h-px flex-1 bg-border-subtle" />
      </div>

      {/* Google — cabeado, desativado até as chaves OAuth existirem. */}
      <Button
        type="button"
        variant="outline"
        disabled
        title="Disponível em breve"
        className="w-full"
      >
        Entrar com Google (em breve)
      </Button>

      <p className="text-center text-xs text-ink-soft">
        {mode === "login" ? (
          <>
            Não tem conta?{" "}
            <Button
              type="button"
              variant="link"
              onClick={() => {
                setMode("register");
                onModeChange?.("register");
              }}
              className="h-auto p-0 align-baseline font-medium text-brand-wine underline-offset-2"
            >
              Criar conta
            </Button>
          </>
        ) : (
          <>
            Já tem conta?{" "}
            <Button
              type="button"
              variant="link"
              onClick={() => {
                setMode("login");
                onModeChange?.("login");
              }}
              className="h-auto p-0 align-baseline font-medium text-brand-wine underline-offset-2"
            >
              Entrar
            </Button>
          </>
        )}
      </p>
    </div>
  );
}
