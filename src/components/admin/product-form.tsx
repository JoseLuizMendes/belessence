"use client";

/**
 * ProductForm — Belessence Admin
 * ─────────────────────────────────────────────────────────────────────
 * Form reutilizável para criar e editar produtos.
 *
 * Mudanças do Tier C:
 *  - Imagens via <CloudinaryUpload> (substitui textarea de URLs).
 *  - Dropdown "Estado" controla NORMAL/PROMOTION/COMING_SOON/DISCONTINUED.
 *  - Quando status=PROMOTION, abre bloco condicional com preço promo + datas.
 *  - Switch "Edição limitada" + campo "Novo até" (override).
 *  - Validação client-side via Zod (mesma do server) com hint visual.
 */

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import { CalendarIcon, Loader2, Trash2, X } from "lucide-react";
import { cn } from "@/api/utils";
import { CloudinaryUpload } from "./cloudinary-upload";
import type { ProductStatus } from "@prisma/client";

export interface ProductFormData {
  id?: string;
  name: string;
  slug: string;
  shortDescription: string;
  description: string;
  price: number | string;
  originalPrice: number | string | null;
  badge: string | null;
  badgeVariant: string | null;
  collection: string;
  category: string;
  stock: number;
  images: string[];
  features: string[];
  status: ProductStatus;
  isLimitedEdition: boolean;
  markedAsNewUntil: Date | null;
  promotionStartsAt: Date | null;
  promotionEndsAt: Date | null;
}

interface ProductFormProps {
  defaultValues?: ProductFormData;
  action: (formData: FormData) => Promise<void>;
  deleteAction?: () => Promise<void>;
}

function toDateInputValue(date: Date | null | string | null | undefined): string {
  if (!date) return "";
  const d = typeof date === "string" ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return "";
  // datetime-local em pt-BR usa formato YYYY-MM-DDTHH:mm (sem TZ explícito)
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
}

function toDayInputValue(date: Date | null | string | undefined): string {
  if (!date) return "";
  const d = typeof date === "string" ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return "";
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export function ProductForm({
  defaultValues,
  action,
  deleteAction,
}: ProductFormProps) {
  const [isPending, startTransition] = useTransition();
  const [isDeleting, setIsDeleting] = useState(false);

  // Estado controlado dos campos que afetam a UI condicional.
  const [status, setStatus] = useState<ProductStatus>(
    defaultValues?.status ?? "NORMAL",
  );
  const [images, setImages] = useState<string[]>(
    defaultValues?.images ?? [],
  );
  const [price, setPrice] = useState<string>(
    defaultValues?.price != null ? String(defaultValues.price) : "",
  );
  const [promoPrice, setPromoPrice] = useState<string>(
    // Em PROMOTION, o "promoPrice" é o próprio `price` (ver semântica no plano).
    defaultValues?.status === "PROMOTION" && defaultValues?.price != null
      ? String(defaultValues.price)
      : "",
  );
  const [originalPriceField, setOriginalPriceField] = useState<string>(
    defaultValues?.originalPrice != null ? String(defaultValues.originalPrice) : "",
  );
  const [markedAsNewUntil, setMarkedAsNewUntil] = useState<Date | undefined>(
    defaultValues?.markedAsNewUntil
      ? new Date(defaultValues.markedAsNewUntil)
      : undefined,
  );
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [promotionStartsAt, setPromotionStartsAt] = useState<Date | undefined>(
    defaultValues?.promotionStartsAt
      ? new Date(defaultValues.promotionStartsAt)
      : undefined,
  );
  const [promotionEndsAt, setPromotionEndsAt] = useState<Date | undefined>(
    defaultValues?.promotionEndsAt
      ? new Date(defaultValues.promotionEndsAt)
      : undefined,
  );
  const [collection, setCollection] = useState<string>(
    defaultValues?.collection ?? "day",
  );
  const [category, setCategory] = useState<string>(
    defaultValues?.category ?? "perfume",
  );
  const [badgeVariant, setBadgeVariant] = useState<string>(
    defaultValues?.badgeVariant ?? "default",
  );
  const [isLimitedEdition, setIsLimitedEdition] = useState<boolean>(
    defaultValues?.isLimitedEdition ?? false,
  );

  // Quando o admin entra em PROMOTION pela primeira vez, o "preço cheio" exibido
  // no campo Preço continua valendo como originalPrice, e ele digita o promo
  // separadamente. Para deixar visual, sincronizamos.
  const showPromoFields = status === "PROMOTION";
  const discountPct =
    showPromoFields &&
    Number(price) > 0 &&
    Number(promoPrice) > 0 &&
    Number(promoPrice) < Number(price)
      ? Math.round(((Number(price) - Number(promoPrice)) / Number(price)) * 100)
      : null;

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Validações client antes de submeter.
    if (images.length === 0) {
      toast.error("Adicione pelo menos uma imagem.");
      return;
    }

    if (showPromoFields) {
      const p = Number(price);
      const pp = Number(promoPrice);
      if (!Number.isFinite(pp) || pp <= 0) {
        toast.error("Preço promocional inválido.");
        return;
      }
      if (pp >= p) {
        toast.error("Preço promocional precisa ser menor que o preço atual.");
        return;
      }
      const endsAtRaw = (e.currentTarget.elements.namedItem(
        "promotionEndsAt",
      ) as HTMLInputElement | null)?.value;
      if (!endsAtRaw) {
        toast.error("Defina a data de término da promoção.");
        return;
      }
    }

    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      try {
        await action(formData);
        toast.success("Produto salvo com sucesso!");
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Erro ao salvar produto",
        );
      }
    });
  };

  const handleDelete = () => {
    if (!deleteAction) return;
    setIsDeleting(true);
    startTransition(async () => {
      try {
        await deleteAction();
        toast.success("Produto deletado");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Erro ao deletar");
        setIsDeleting(false);
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-3xl">
      {/* INFORMAÇÕES BÁSICAS */}
      <section className="bg-surface-panel rounded-token-md p-4 sm:p-6 md:p-8">
        <h2 className="font-playfair italic text-xl text-ink-strong mb-2">
          Informações básicas
        </h2>
        <div className="h-px w-12 bg-brand-wine/60 mb-6" />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField
            name="name"
            label="Nome do produto"
            placeholder="Ex: Midnight Velvet"
            defaultValue={defaultValues?.name}
            required
            fullWidth
          />

          <FormField
            name="slug"
            label="Slug (URL)"
            placeholder="midnight-velvet"
            hint="Apenas letras minúsculas, números e hífens"
            defaultValue={defaultValues?.slug}
            required
            fullWidth
          />

          <FormField
            name="shortDescription"
            label="Descrição curta"
            placeholder="Uma experiência olfativa envolvente..."
            defaultValue={defaultValues?.shortDescription}
            required
            fullWidth
          />

          <div className="sm:col-span-2">
            <Label
              htmlFor="description"
              className="block text-[10px] font-medium tracking-[0.24em] uppercase text-ink-soft mb-2"
            >
              Descrição completa
            </Label>
            <Textarea
              id="description"
              name="description"
              rows={5}
              defaultValue={defaultValues?.description}
              placeholder="História do produto, notas olfativas, ocasiões de uso..."
              required
              className="bg-surface-base border-border-subtle rounded-token-sm focus-visible:border-brand-wine focus-visible:ring-0 resize-none"
            />
          </div>
        </div>
      </section>

      {/* PREÇOS & ESTOQUE */}
      <section className="bg-surface-panel rounded-token-md p-4 sm:p-6 md:p-8">
        <h2 className="font-playfair italic text-xl text-ink-strong mb-2">
          Preço e estoque
        </h2>
        <div className="h-px w-12 bg-brand-wine/60 mb-6" />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label
              htmlFor="price"
              className="block text-[10px] font-medium tracking-[0.24em] uppercase text-ink-soft mb-2"
            >
              Preço cheio (R$)
            </Label>
            <Input
              id="price"
              type="number"
              name="price"
              step="0.01"
              min="0"
              required
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="h-11 bg-surface-base border-border-subtle rounded-token-sm focus-visible:border-brand-wine focus-visible:ring-0"
            />
            <p className="mt-1 text-xs text-ink-muted">
              Preço base sem desconto. Em PROMOTION, é usado como
              <strong> originalPrice</strong> riscado.
            </p>
          </div>

          <FormField
            name="stock"
            label="Estoque"
            type="number"
            min="0"
            defaultValue={defaultValues?.stock?.toString() ?? "0"}
            required
          />

          {/* Campo escondido para enviar originalPrice apenas quando relevante. */}
          <input
            type="hidden"
            name="originalPrice"
            value={originalPriceField}
          />
        </div>
      </section>

      {/* ESTADO DO PRODUTO */}
      <section className="bg-surface-panel rounded-token-md p-4 sm:p-6 md:p-8">
        <h2 className="font-playfair italic text-xl text-ink-strong mb-2">
          Estado do produto
        </h2>
        <div className="h-px w-12 bg-brand-wine/60 mb-6" />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-[10px] font-medium tracking-[0.24em] uppercase text-ink-soft mb-2">
              Estado
            </label>
            <input type="hidden" name="status" value={status} />
            <Select
              value={status}
              onValueChange={(v) => setStatus(v as ProductStatus)}
            >
              <SelectTrigger className="h-11 w-full bg-surface-base border-border-subtle rounded-token-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="NORMAL">Normal (à venda)</SelectItem>
                <SelectItem value="PROMOTION">Em promoção</SelectItem>
                <SelectItem value="COMING_SOON">Em breve (não vende)</SelectItem>
                <SelectItem value="DISCONTINUED">Descontinuado (oculto)</SelectItem>
              </SelectContent>
            </Select>
            <p className="mt-1 text-xs text-ink-muted">
              Estoque=0 mostra &quot;Esgotado&quot; independente do estado.
            </p>
          </div>

          <div className="flex flex-col justify-center sm:mt-7">
            {/* Switch envia "on"/sem-presença no FormData; usamos hidden pra controlar */}
            {isLimitedEdition && (
              <input type="hidden" name="isLimitedEdition" value="true" />
            )}
            <div className="flex items-center gap-3">
              <Switch
                id="isLimitedEdition"
                checked={isLimitedEdition}
                onCheckedChange={setIsLimitedEdition}
                className="data-[state=checked]:bg-brand-wine"
              />
              <Label
                htmlFor="isLimitedEdition"
                className="text-sm text-ink-strong cursor-pointer"
              >
                Edição limitada
              </Label>
            </div>
            <p className="mt-1.5 text-xs text-ink-muted">
              Combina com qualquer estado. Mostra badge âmbar.
            </p>
          </div>

          <div className="sm:col-span-2">
            <label className="block text-[10px] font-medium tracking-[0.24em] uppercase text-ink-soft mb-2">
              Marcar como &quot;Lançamento&quot; até (opcional)
            </label>

            {/* Input hidden — carrega o valor pro form action */}
            <input
              type="hidden"
              name="markedAsNewUntil"
              value={
                markedAsNewUntil
                  ? toDayInputValue(markedAsNewUntil)
                  : ""
              }
            />

            <div className="flex items-stretch gap-2">
              <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className={cn(
                      "h-11 w-full sm:w-auto sm:min-w-[260px] justify-start text-left font-normal text-sm rounded-token-sm border-border-subtle bg-surface-base hover:bg-surface-section",
                      !markedAsNewUntil && "text-ink-muted",
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4 text-ink-soft" />
                    {markedAsNewUntil
                      ? format(markedAsNewUntil, "dd 'de' MMMM 'de' yyyy", {
                          locale: ptBR,
                        })
                      : "Selecionar data"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={markedAsNewUntil}
                    onSelect={(date) => {
                      setMarkedAsNewUntil(date);
                      if (date) setCalendarOpen(false);
                    }}
                    locale={ptBR}
                    autoFocus
                    captionLayout="dropdown"
                  />
                </PopoverContent>
              </Popover>

              {markedAsNewUntil && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => setMarkedAsNewUntil(undefined)}
                  aria-label="Limpar data"
                  className="h-11 w-11 shrink-0 text-ink-soft hover:text-destructive"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>

            <p className="mt-1 text-xs text-ink-muted">
              Se vazio, &quot;Lançamento&quot; é automático nos primeiros 30
              dias após criar.
            </p>
          </div>
        </div>

        {/* BLOCO PROMOÇÃO */}
        {showPromoFields && (
          <div className="mt-6 pt-6 border-t border-border-subtle space-y-4">
            <h3 className="text-sm font-medium tracking-wide uppercase text-brand-wine">
              Configurar promoção
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <Label
                  htmlFor="promoPrice"
                  className="block text-[10px] font-medium tracking-[0.24em] uppercase text-ink-soft mb-2"
                >
                  Preço promocional (R$)
                </Label>
                <Input
                  id="promoPrice"
                  type="number"
                  name="promoPrice"
                  step="0.01"
                  min="0"
                  value={promoPrice}
                  onChange={(e) => {
                    setPromoPrice(e.target.value);
                    // sincroniza originalPrice = price atual
                    setOriginalPriceField(price);
                  }}
                  required={showPromoFields}
                  className="h-11 bg-surface-base border-border-subtle rounded-token-sm focus-visible:border-brand-wine focus-visible:ring-0"
                />
                {discountPct != null && (
                  <p className="mt-1 text-xs text-emerald-700 font-medium">
                    {discountPct}% de desconto
                  </p>
                )}
              </div>

              <div>
                <Label className="block text-[10px] font-medium tracking-[0.24em] uppercase text-ink-soft mb-2">
                  Início (opcional)
                </Label>
                <input
                  type="hidden"
                  name="promotionStartsAt"
                  value={promotionStartsAt ? toDateInputValue(promotionStartsAt) : ""}
                />
                <DateTimePicker
                  value={promotionStartsAt}
                  onChange={setPromotionStartsAt}
                  placeholder="Começa agora"
                  clearable
                />
                <p className="mt-1 text-xs text-ink-muted">
                  Vazio = começa agora.
                </p>
              </div>

              <div>
                <Label className="block text-[10px] font-medium tracking-[0.24em] uppercase text-ink-soft mb-2">
                  Término <span className="text-destructive">*</span>
                </Label>
                <input
                  type="hidden"
                  name="promotionEndsAt"
                  value={promotionEndsAt ? toDateInputValue(promotionEndsAt) : ""}
                  required={showPromoFields}
                />
                <DateTimePicker
                  value={promotionEndsAt}
                  onChange={setPromotionEndsAt}
                  placeholder="Selecionar data/hora"
                />
              </div>
            </div>

            <p className="text-xs text-ink-muted">
              Quando voltar para &quot;Normal&quot;, o preço cheio é restaurado
              automaticamente.
            </p>
          </div>
        )}
      </section>

      {/* CATEGORIZAÇÃO */}
      <section className="bg-surface-panel rounded-token-md p-4 sm:p-6 md:p-8">
        <h2 className="font-playfair italic text-xl text-ink-strong mb-2">
          Categorização
        </h2>
        <div className="h-px w-12 bg-brand-wine/60 mb-6" />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-[10px] font-medium tracking-[0.24em] uppercase text-ink-soft mb-2">
              Coleção
            </label>
            <input type="hidden" name="collection" value={collection} />
            <Select value={collection} onValueChange={setCollection}>
              <SelectTrigger className="h-11 w-full bg-surface-base border-border-subtle rounded-token-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="day">Day (Elegância Diurna)</SelectItem>
                <SelectItem value="night">Night (Essência Noturna)</SelectItem>
                <SelectItem value="limited">Limited (Edição Limitada)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-[10px] font-medium tracking-[0.24em] uppercase text-ink-soft mb-2">
              Categoria
            </label>
            <input type="hidden" name="category" value={category} />
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="h-11 w-full bg-surface-base border-border-subtle rounded-token-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="perfume">Perfume</SelectItem>
                <SelectItem value="cologne">Colônia</SelectItem>
                <SelectItem value="body-care">Cuidados Corporais</SelectItem>
                <SelectItem value="gift-set">Kit</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <FormField
            name="badge"
            label="Badge customizado"
            placeholder="Bestseller, Exclusivo... (opcional)"
            defaultValue={defaultValues?.badge ?? ""}
            hint="Usado apenas se estado=Normal e nenhum badge automático aplica"
          />

          <div>
            <label className="block text-[10px] font-medium tracking-[0.24em] uppercase text-ink-soft mb-2">
              Estilo do badge customizado
            </label>
            <input type="hidden" name="badgeVariant" value={badgeVariant} />
            <Select value={badgeVariant} onValueChange={setBadgeVariant}>
              <SelectTrigger className="h-11 w-full bg-surface-base border-border-subtle rounded-token-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="default">Padrão (bordô)</SelectItem>
                <SelectItem value="secondary">Secundário (rosa)</SelectItem>
                <SelectItem value="destructive">Destaque (vermelho)</SelectItem>
                <SelectItem value="outline">Outline</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </section>

      {/* MÍDIA */}
      <section className="bg-surface-panel rounded-token-md p-4 sm:p-6 md:p-8">
        <h2 className="font-playfair italic text-xl text-ink-strong mb-2">
          Imagens
        </h2>
        <div className="h-px w-12 bg-brand-wine/60 mb-6" />

        <CloudinaryUpload
          value={images}
          onChange={setImages}
          inputName="images"
          max={5}
        />
      </section>

      {/* CARACTERÍSTICAS */}
      <section className="bg-surface-panel rounded-token-md p-4 sm:p-6 md:p-8">
        <h2 className="font-playfair italic text-xl text-ink-strong mb-2">
          Características
        </h2>
        <div className="h-px w-12 bg-brand-wine/60 mb-6" />

        <Label
          htmlFor="features"
          className="block text-[10px] font-medium tracking-[0.24em] uppercase text-ink-soft mb-2"
        >
          Uma característica por linha
        </Label>
        <Textarea
          id="features"
          name="features"
          rows={4}
          defaultValue={defaultValues?.features.join("\n") ?? ""}
          placeholder="Longa duração (8h)&#10;Família olfativa: Oriental&#10;Notas: bergamota, jasmim, baunilha"
          className="bg-surface-base border-border-subtle rounded-token-sm focus-visible:border-brand-wine focus-visible:ring-0 resize-none"
        />
      </section>

      {/* AÇÕES */}
      <div className="flex items-center justify-between gap-4">
        {deleteAction && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                type="button"
                disabled={isPending || isDeleting}
                variant="outline"
                className="text-destructive border-destructive/30 hover:bg-destructive hover:text-white"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Deletar produto
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle className="font-playfair italic text-2xl text-ink-strong">
                  Deletar produto?
                </AlertDialogTitle>
                <AlertDialogDescription>
                  Esta ação não pode ser desfeita. O produto será removido
                  permanentemente do catálogo, junto com suas imagens e
                  histórico associado.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  className="bg-destructive text-white hover:bg-destructive/90"
                >
                  Sim, deletar
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}

        <Button
          type="submit"
          disabled={isPending || isDeleting}
          className="loreal-btn-pill h-12 px-8 bg-brand-wine text-brand-pink text-[12px] font-medium tracking-[0.18em] uppercase hover:bg-brand-wine/90 ml-auto"
        >
          {isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Salvando...
            </>
          ) : defaultValues?.id ? (
            "Salvar alterações"
          ) : (
            "Criar produto"
          )}
        </Button>
      </div>
    </form>
  );
}

// ─── DateTimePicker — Popover + Calendar + input de hora ────────────────────

interface DateTimePickerProps {
  value: Date | undefined;
  onChange: (date: Date | undefined) => void;
  placeholder?: string;
  clearable?: boolean;
}

function DateTimePicker({
  value,
  onChange,
  placeholder = "Selecionar data e hora",
  clearable = false,
}: DateTimePickerProps) {
  const [open, setOpen] = useState(false);
  const timeValue = value
    ? `${String(value.getHours()).padStart(2, "0")}:${String(
        value.getMinutes(),
      ).padStart(2, "0")}`
    : "00:00";

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) {
      onChange(undefined);
      return;
    }
    // Preserva a hora atual ao trocar a data.
    const next = new Date(date);
    if (value) {
      next.setHours(value.getHours(), value.getMinutes(), 0, 0);
    } else {
      // Default sensato: meio-dia, evita timezone roundtrip
      next.setHours(12, 0, 0, 0);
    }
    onChange(next);
  };

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const [h, m] = e.target.value.split(":").map(Number);
    if (!Number.isFinite(h) || !Number.isFinite(m)) return;
    const next = value ? new Date(value) : new Date();
    next.setHours(h, m, 0, 0);
    onChange(next);
  };

  return (
    <div className="flex items-stretch gap-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            className={cn(
              "h-11 flex-1 justify-start text-left font-normal text-sm rounded-token-sm border-border-subtle bg-surface-base hover:bg-surface-section",
              !value && "text-ink-muted",
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4 text-ink-soft" />
            {value
              ? format(value, "dd/MM/yyyy", { locale: ptBR })
              : placeholder}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={value}
            onSelect={handleDateSelect}
            locale={ptBR}
            autoFocus
            captionLayout="dropdown"
          />
          <div className="border-t border-border-subtle p-3">
            <Label className="text-[10px] tracking-[0.18em] uppercase text-ink-soft mb-1.5 block">
              Hora
            </Label>
            <Input
              type="time"
              value={timeValue}
              onChange={handleTimeChange}
              className="h-9 bg-surface-base border-border-subtle"
            />
          </div>
        </PopoverContent>
      </Popover>

      {clearable && value && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => onChange(undefined)}
          aria-label="Limpar"
          className="h-11 w-11 shrink-0 text-ink-soft hover:text-destructive"
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}

interface FormFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  hint?: string;
  fullWidth?: boolean;
}

function FormField({
  label,
  hint,
  fullWidth,
  className,
  ...props
}: FormFieldProps) {
  return (
    <div className={fullWidth ? "sm:col-span-2" : className}>
      <Label
        htmlFor={props.name}
        className="block text-[10px] font-medium tracking-[0.24em] uppercase text-ink-soft mb-2"
      >
        {label}
      </Label>
      <Input
        id={props.name}
        {...props}
        className="h-11 bg-surface-base border-border-subtle rounded-token-sm focus-visible:border-brand-wine focus-visible:ring-0"
      />
      {hint && <p className="mt-1 text-xs text-ink-muted">{hint}</p>}
    </div>
  );
}
