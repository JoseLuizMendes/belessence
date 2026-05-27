"use client";

/**
 * CouponsClient — lista interativa de cupons (tabela desktop + cards mobile).
 * Recebe os cupons já serializados do RSC e orquestra:
 *  - Dialog "Novo cupom" / "Editar cupom" (CouponForm)
 *  - Switch de ativo (toggleCouponActive)
 *  - Excluir com AlertDialog (deleteCoupon)
 */

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Tag, Infinity as InfinityIcon } from "lucide-react";
import { formatPrice } from "@/api/utils";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { TableBody, TableCell } from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { CouponForm, type CouponFormData } from "./coupon-form";
import { EmptyState } from "@/components/admin/empty-state";
import { StatusPill, type StatusTone } from "@/components/admin/status-pill";
import {
  DataTable,
  DataTableHeader,
  DataTableRow,
} from "@/components/admin/data-table";
import {
  createCoupon,
  updateCoupon,
  toggleCouponActive,
  deleteCoupon,
} from "@/app/admin/(authenticated)/cupons/actions";

export interface CouponDTO {
  id: string;
  code: string;
  type: "PERCENTAGE" | "FIXED";
  value: number;
  minOrder: number | null;
  maxUses: number | null;
  usedCount: number;
  expiresAt: string | null;
  active: boolean;
  createdAt: string;
}

function formatValue(c: CouponDTO): string {
  return c.type === "PERCENTAGE" ? `${c.value}%` : formatPrice(c.value);
}

interface Validity {
  label: string;
  tone: StatusTone;
}

function validity(iso: string | null): Validity {
  if (!iso) return { label: "Sem validade", tone: "muted" };
  const end = new Date(iso);
  const now = new Date();
  const ms = end.getTime() - now.getTime();
  const day = 1000 * 60 * 60 * 24;
  const fmt = new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(end);
  if (ms < 0) return { label: `Expirou em ${fmt}`, tone: "danger" };
  const days = Math.ceil(ms / day);
  if (days <= 7) return { label: `Expira em ${days}d`, tone: "alert" };
  return { label: `Até ${fmt}`, tone: "active" };
}

function UsageBar({ used, max }: { used: number; max: number | null }) {
  if (max == null) {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-ink-soft font-data">
        {used} <InfinityIcon className="h-3.5 w-3.5 text-ink-muted" />
      </span>
    );
  }
  const pct = Math.min(100, Math.round((used / max) * 100));
  const exhausted = used >= max;
  return (
    <div className="min-w-[88px]">
      <span
        className={`font-data text-xs ${
          exhausted ? "text-destructive font-medium" : "text-ink-soft"
        }`}
      >
        {used}/{max}
        {exhausted && " · esgotado"}
      </span>
      <div className="mt-1.5 h-1 w-full rounded-full bg-admin-panel-soft overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-300 ${
            exhausted ? "bg-destructive" : "bg-brand-wine"
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function toFormData(c: CouponDTO): CouponFormData {
  return {
    id: c.id,
    code: c.code,
    type: c.type,
    value: c.value,
    minOrder: c.minOrder,
    maxUses: c.maxUses,
    expiresAt: c.expiresAt,
    active: c.active,
  };
}

export function CouponsClient({ coupons }: { coupons: CouponDTO[] }) {
  const [newOpen, setNewOpen] = useState(false);
  const [editing, setEditing] = useState<CouponDTO | null>(null);
  const [, startTransition] = useTransition();

  const handleToggle = (c: CouponDTO, next: boolean) => {
    startTransition(async () => {
      const r = await toggleCouponActive(c.id, next);
      if (!r.ok) toast.error(r.error ?? "Falha ao alterar status.");
      else toast.success(next ? "Cupom ativado." : "Cupom desativado.");
    });
  };

  const handleDelete = (c: CouponDTO) => {
    startTransition(async () => {
      const r = await deleteCoupon(c.id);
      if (!r.ok) toast.error(r.error ?? "Falha ao excluir.");
      else toast.success("Cupom excluído.");
    });
  };

  return (
    <div>
      <div className="flex justify-end mb-4">
        <Button
          onClick={() => setNewOpen(true)}
          className="loreal-btn-pill h-11 px-6 btn-wine text-[11px] font-medium tracking-[0.18em] uppercase"
        >
          <Plus className="mr-2 h-4 w-4" />
          Novo cupom
        </Button>
      </div>

      {coupons.length === 0 ? (
        <EmptyState
          icon={<Tag strokeWidth={1.2} />}
          title="Nenhum cupom cadastrado"
          description="Crie cupons de desconto percentual ou fixo para campanhas e parcerias."
          action={
            <Button
              onClick={() => setNewOpen(true)}
              className="loreal-btn-pill h-11 px-6 btn-wine text-[11px] font-medium tracking-[0.18em] uppercase"
            >
              Criar primeiro cupom
            </Button>
          }
        />
      ) : (
        <>
          {/* Mobile: cards */}
          <ul className="md:hidden flex flex-col gap-3">
            {coupons.map((c) => {
              const v = validity(c.expiresAt);
              return (
                <li
                  key={c.id}
                  className="bg-admin-panel border border-admin rounded-token-md p-4 shadow-petal-1"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-data text-sm font-semibold tracking-[0.12em] text-brand-wine">
                        {c.code}
                      </p>
                      <div className="flex items-baseline gap-2 mt-1">
                        <span className="text-[10px] uppercase tracking-[0.18em] text-ink-muted">
                          {c.type === "PERCENTAGE" ? "Percentual" : "Fixo"}
                        </span>
                        <span className="text-sm font-medium text-ink-strong">
                          {formatValue(c)}
                        </span>
                      </div>
                    </div>
                    <Switch
                      checked={c.active}
                      onCheckedChange={(next) => handleToggle(c, next)}
                      aria-label="Ativar cupom"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3 mt-4 text-xs">
                    <div>
                      <p className="text-[10px] tracking-[0.22em] uppercase text-ink-muted mb-1">
                        Pedido mínimo
                      </p>
                      <p className="text-ink-strong font-data">
                        {c.minOrder ? formatPrice(c.minOrder) : "—"}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] tracking-[0.22em] uppercase text-ink-muted mb-1">
                        Usos
                      </p>
                      <UsageBar used={c.usedCount} max={c.maxUses} />
                    </div>
                    <div className="col-span-2">
                      <p className="text-[10px] tracking-[0.22em] uppercase text-ink-muted mb-1">
                        Validade
                      </p>
                      <StatusPill tone={v.tone}>{v.label}</StatusPill>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 mt-4 pt-3 border-t border-admin-soft">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditing(c)}
                      className="rounded-full text-[10px] tracking-[0.18em] uppercase text-brand-wine border-brand-wine/20 hover:bg-brand-wine hover:text-brand-pink"
                    >
                      <Pencil className="h-3 w-3" />
                      Editar
                    </Button>
                    <DeleteButton coupon={c} onConfirm={() => handleDelete(c)} />
                  </div>
                </li>
              );
            })}
          </ul>

          {/* Desktop: tabela */}
          <DataTable>
            <DataTableHeader
              columns={[
                { key: "codigo", label: "Código" },
                { key: "valor", label: "Valor" },
                { key: "minimo", label: "Pedido mínimo" },
                { key: "usos", label: "Usos" },
                { key: "validade", label: "Validade" },
                { key: "ativo", label: "Ativo", align: "right" },
                { key: "acoes", label: "Ações", align: "right" },
              ]}
            />
            <TableBody>
              {coupons.map((c) => {
                const v = validity(c.expiresAt);
                return (
                  <DataTableRow key={c.id}>
                    <TableCell className="py-4 px-5">
                      <div className="flex items-baseline gap-2">
                        <span className="font-data text-sm font-semibold tracking-[0.12em] text-brand-wine">
                          {c.code}
                        </span>
                        <span className="text-[10px] uppercase tracking-[0.18em] text-ink-muted">
                          {c.type === "PERCENTAGE" ? "%" : "R$"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="py-4 px-5 text-sm font-medium text-ink-strong font-data">
                      {formatValue(c)}
                    </TableCell>
                    <TableCell className="py-4 px-5 text-sm text-ink-soft font-data">
                      {c.minOrder ? formatPrice(c.minOrder) : "—"}
                    </TableCell>
                    <TableCell className="py-4 px-5">
                      <UsageBar used={c.usedCount} max={c.maxUses} />
                    </TableCell>
                    <TableCell className="py-4 px-5">
                      <StatusPill tone={v.tone}>{v.label}</StatusPill>
                    </TableCell>
                    <TableCell className="py-4 px-5 text-right">
                      <Switch
                        checked={c.active}
                        onCheckedChange={(next) => handleToggle(c, next)}
                        aria-label="Ativar cupom"
                      />
                    </TableCell>
                    <TableCell className="py-4 px-5">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEditing(c)}
                          className="rounded-full text-[10px] tracking-[0.18em] uppercase text-brand-wine border-brand-wine/20 hover:bg-brand-wine hover:text-brand-pink"
                        >
                          <Pencil className="h-3 w-3" />
                          Editar
                        </Button>
                        <DeleteButton coupon={c} onConfirm={() => handleDelete(c)} />
                      </div>
                    </TableCell>
                  </DataTableRow>
                );
              })}
            </TableBody>
          </DataTable>
        </>
      )}

      {/* Dialog: novo */}
      <Dialog open={newOpen} onOpenChange={setNewOpen}>
        <DialogContent className="bg-admin-panel border-admin">
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl text-ink-strong">
              Novo cupom
            </DialogTitle>
            <DialogDescription>
              Defina código, tipo de desconto e regras de uso.
            </DialogDescription>
          </DialogHeader>
          <CouponForm action={createCoupon} onDone={() => setNewOpen(false)} />
        </DialogContent>
      </Dialog>

      {/* Dialog: editar */}
      <Dialog open={editing !== null} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="bg-admin-panel border-admin">
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl text-ink-strong">
              Editar cupom
            </DialogTitle>
            <DialogDescription>
              Alterações valem para novos usos do cupom.
            </DialogDescription>
          </DialogHeader>
          {editing && (
            <CouponForm
              defaultValues={toFormData(editing)}
              action={(fd) => updateCoupon(editing.id, fd)}
              onDone={() => setEditing(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function DeleteButton({
  coupon,
  onConfirm,
}: {
  coupon: CouponDTO;
  onConfirm: () => void;
}) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          aria-label={`Excluir cupom ${coupon.code}`}
          className="rounded-full text-[10px] tracking-[0.18em] uppercase text-destructive border-destructive/30 hover:bg-destructive hover:text-white"
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="font-serif text-2xl text-ink-strong">
            Excluir cupom?
          </AlertDialogTitle>
          <AlertDialogDescription>
            O cupom <strong>{coupon.code}</strong> será removido
            permanentemente. Para apenas pausá-lo, prefira desativar.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-destructive text-white hover:bg-destructive/90"
          >
            Sim, excluir
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
