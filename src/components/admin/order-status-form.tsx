"use client";

/**
 * OrderStatusForm — Admin
 * Form para atualizar status de pedido + opcional trackingCode.
 */

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

const STATUS_OPTIONS = [
  { value: "PENDING", label: "Aguardando pagamento" },
  { value: "PAYMENT_CONFIRMED", label: "Pagamento confirmado" },
  { value: "PREPARING", label: "Em preparação" },
  { value: "SHIPPED", label: "Enviado" },
  { value: "DELIVERED", label: "Entregue" },
  { value: "CANCELLED", label: "Cancelado" },
] as const;

interface OrderStatusFormProps {
  currentStatus: string;
  currentTrackingCode: string | null;
  action: (formData: FormData) => Promise<void>;
}

export function OrderStatusForm({
  currentStatus,
  currentTrackingCode,
  action,
}: OrderStatusFormProps) {
  const [status, setStatus] = useState(currentStatus);
  const [trackingCode, setTrackingCode] = useState(currentTrackingCode ?? "");
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      try {
        await action(formData);
        toast.success("Status atualizado");
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Erro ao atualizar status",
        );
      }
    });
  };

  const requiresTracking = status === "SHIPPED";

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-surface-panel rounded-token-md p-6 space-y-4"
    >
      <div>
        <label className="block text-[10px] font-medium tracking-[0.24em] uppercase text-ink-soft mb-2">
          Status do pedido
        </label>
        <select
          name="status"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="h-11 w-full px-4 text-sm bg-surface-base border border-border-subtle rounded-token-sm outline-none focus:border-brand-wine"
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-[10px] font-medium tracking-[0.24em] uppercase text-ink-soft mb-2">
          Código de rastreio {requiresTracking && <span className="text-destructive">*</span>}
        </label>
        <input
          name="trackingCode"
          type="text"
          value={trackingCode}
          onChange={(e) => setTrackingCode(e.target.value)}
          placeholder="BR123456789XX"
          required={requiresTracking}
          className="h-11 w-full px-4 text-sm bg-surface-base border border-border-subtle rounded-token-sm outline-none focus:border-brand-wine"
        />
        <p className="mt-1 text-xs text-ink-muted">
          {requiresTracking
            ? "Obrigatório quando o status é Enviado"
            : "Opcional — preencha quando despachar"}
        </p>
      </div>

      <Button
        type="submit"
        disabled={isPending}
        className="w-full h-11 bg-brand-wine text-brand-pink text-[11px] font-medium tracking-[0.18em] uppercase hover:bg-brand-wine/90"
      >
        {isPending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Salvando...
          </>
        ) : (
          "Atualizar pedido"
        )}
      </Button>
    </form>
  );
}
