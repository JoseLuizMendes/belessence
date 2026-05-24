"use client";

/**
 * OrderStatusForm — Admin
 * Form para atualizar status de pedido + opcional trackingCode.
 */

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";

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
        <Label
          htmlFor="status"
          className="block text-[10px] font-medium tracking-[0.24em] uppercase text-ink-soft mb-2"
        >
          Status do pedido
        </Label>
        {/* Select shadcn é controlado; hidden input carrega o valor no FormData */}
        <input type="hidden" name="status" value={status} />
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger
            id="status"
            className="data-[size=default]:h-11 w-full bg-surface-base border-border-subtle rounded-token-sm"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label
          htmlFor="trackingCode"
          className="block text-[10px] font-medium tracking-[0.24em] uppercase text-ink-soft mb-2"
        >
          Código de rastreio {requiresTracking && <span className="text-destructive">*</span>}
        </Label>
        <Input
          id="trackingCode"
          name="trackingCode"
          type="text"
          value={trackingCode}
          onChange={(e) => setTrackingCode(e.target.value)}
          placeholder="BR123456789XX"
          required={requiresTracking}
          className="h-11 bg-surface-base border-border-subtle rounded-token-sm focus-visible:border-brand-wine focus-visible:ring-0"
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
            <Spinner className="mr-2" />
            Salvando...
          </>
        ) : (
          "Atualizar pedido"
        )}
      </Button>
    </form>
  );
}
