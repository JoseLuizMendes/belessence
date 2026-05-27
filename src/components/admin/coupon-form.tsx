"use client";

/**
 * CouponForm — formulário de cupom usado dentro do Dialog (criar/editar).
 * Recebe a server action já vinculada (create ou update(id)) e fecha via onDone.
 */

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { NumberField } from "@/components/ui/number-field";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/api/utils";
import type { CouponActionResult } from "@/app/admin/(authenticated)/cupons/actions";

export interface CouponFormData {
  id?: string;
  code: string;
  type: "PERCENTAGE" | "FIXED";
  value: number;
  minOrder: number | null;
  maxUses: number | null;
  /** ISO string ou null. */
  expiresAt: string | null;
  active: boolean;
}

interface CouponFormProps {
  defaultValues?: CouponFormData;
  action: (formData: FormData) => Promise<CouponActionResult>;
  onDone: () => void;
}

/** Date → "YYYY-MM-DD" (componentes locais) para o input hidden do form. */
function toDayValue(d: Date): string {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

const labelCls =
  "block text-[10px] font-medium tracking-[0.24em] uppercase text-ink-soft mb-2";
const inputCls =
  "h-11 bg-admin-canvas border-admin rounded-token-sm focus-visible:border-brand-wine focus-visible:ring-0";

export function CouponForm({ defaultValues, action, onDone }: CouponFormProps) {
  const [isPending, startTransition] = useTransition();
  const [type, setType] = useState<"PERCENTAGE" | "FIXED">(
    defaultValues?.type ?? "PERCENTAGE",
  );
  const [active, setActive] = useState<boolean>(defaultValues?.active ?? true);
  const [expiresAt, setExpiresAt] = useState<Date | undefined>(
    defaultValues?.expiresAt ? new Date(defaultValues.expiresAt) : undefined,
  );
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[] | undefined>>(
    {},
  );

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    setErrors({});
    startTransition(async () => {
      const result = await action(formData);
      if (result.ok) {
        toast.success(
          defaultValues?.id ? "Cupom atualizado." : "Cupom criado.",
        );
        onDone();
        return;
      }
      if (result.fieldErrors) setErrors(result.fieldErrors);
      toast.error(
        result.error ?? "Confira os campos destacados e tente novamente.",
      );
    });
  };

  const fieldError = (name: string) =>
    errors[name]?.[0] ? (
      <p className="mt-1 text-xs text-destructive">{errors[name]![0]}</p>
    ) : null;

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <Label htmlFor="code" className={labelCls}>
          Código
        </Label>
        <Input
          id="code"
          name="code"
          required
          autoFocus
          defaultValue={defaultValues?.code ?? ""}
          placeholder="BEMVINDA10"
          className={`${inputCls} uppercase tracking-[0.12em]`}
        />
        {fieldError("code")}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label className={labelCls}>Tipo</Label>
          <input type="hidden" name="type" value={type} />
          <Select
            value={type}
            onValueChange={(v) => setType(v as "PERCENTAGE" | "FIXED")}
          >
            <SelectTrigger className="data-[size=default]:h-11 w-full bg-admin-canvas border-admin rounded-token-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="PERCENTAGE">Percentual (%)</SelectItem>
              <SelectItem value="FIXED">Valor fixo (R$)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="value" className={labelCls}>
            {type === "PERCENTAGE" ? "Valor (%)" : "Valor (R$)"}
          </Label>
          <NumberField
            id="value"
            name="value"
            step={type === "PERCENTAGE" ? 1 : 0.01}
            min={0}
            required
            defaultValue={defaultValues?.value ?? ""}
            placeholder={type === "PERCENTAGE" ? "10" : "20,00"}
            className={inputCls}
          />
          {fieldError("value")}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="minOrder" className={labelCls}>
            Pedido mínimo (R$)
          </Label>
          <NumberField
            id="minOrder"
            name="minOrder"
            step={0.01}
            min={0}
            defaultValue={defaultValues?.minOrder ?? ""}
            placeholder="Opcional"
            className={inputCls}
          />
          {fieldError("minOrder")}
        </div>

        <div>
          <Label htmlFor="maxUses" className={labelCls}>
            Limite de usos
          </Label>
          <NumberField
            id="maxUses"
            name="maxUses"
            step={1}
            min={1}
            defaultValue={defaultValues?.maxUses ?? ""}
            placeholder="Ilimitado"
            className={inputCls}
          />
          {fieldError("maxUses")}
        </div>
      </div>

      <div>
        <Label className={labelCls}>Validade</Label>
        <input
          type="hidden"
          name="expiresAt"
          value={expiresAt ? toDayValue(expiresAt) : ""}
        />
        <div className="flex items-stretch gap-2">
          <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="outline"
                className={cn(
                  "h-11 flex-1 justify-start text-left font-normal text-sm rounded-token-sm border-admin bg-admin-canvas hover:bg-admin-row",
                  !expiresAt && "text-ink-muted",
                )}
              >
                <CalendarIcon className="mr-2 size-4 text-ink-soft" />
                {expiresAt
                  ? format(expiresAt, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
                  : "Sem validade"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={expiresAt}
                onSelect={(date) => {
                  setExpiresAt(date);
                  if (date) setCalendarOpen(false);
                }}
                locale={ptBR}
                autoFocus
                captionLayout="dropdown"
              />
            </PopoverContent>
          </Popover>

          {expiresAt && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => setExpiresAt(undefined)}
              aria-label="Limpar validade"
              className="h-11 w-11 shrink-0 text-ink-soft hover:text-destructive"
            >
              <X className="size-4" />
            </Button>
          )}
        </div>
        <p className="mt-1 text-xs text-ink-muted">
          Deixe em branco para não expirar.
        </p>
        {fieldError("expiresAt")}
      </div>

      <div className="flex items-center gap-3 pt-1">
        <input type="hidden" name="active" value={active ? "true" : "false"} />
        <Switch
          id="active"
          checked={active}
          onCheckedChange={setActive}
          className="data-[state=checked]:bg-accent-foreground"
        />
        <Label htmlFor="active" className="text-sm text-ink-strong cursor-pointer">
          Cupom ativo
        </Label>
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <Button
          type="submit"
          disabled={isPending}
          className="loreal-btn-pill h-11 px-7 btn-wine text-[11px] font-medium tracking-[0.18em] uppercase disabled:opacity-60"
        >
          {isPending ? (
            <>
              <Spinner className="mr-2" />
              Salvando
            </>
          ) : defaultValues?.id ? (
            "Salvar alterações"
          ) : (
            "Criar cupom"
          )}
        </Button>
      </div>
    </form>
  );
}
