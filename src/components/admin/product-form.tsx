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
import { Button } from "@/components/ui/button";
import { Loader2, Trash2 } from "lucide-react";
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
    if (
      !confirm(
        "Tem certeza que deseja deletar este produto? Esta ação não pode ser desfeita.",
      )
    )
      return;
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
            <label className="block text-[10px] font-medium tracking-[0.24em] uppercase text-ink-soft mb-2">
              Descrição completa
            </label>
            <textarea
              name="description"
              rows={5}
              defaultValue={defaultValues?.description}
              placeholder="História do produto, notas olfativas, ocasiões de uso..."
              required
              className="w-full px-4 py-3 text-sm bg-surface-base border border-border-subtle rounded-token-sm outline-none focus:border-brand-wine resize-none"
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
            <label className="block text-[10px] font-medium tracking-[0.24em] uppercase text-ink-soft mb-2">
              Preço cheio (R$)
            </label>
            <input
              type="number"
              name="price"
              step="0.01"
              min="0"
              required
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="h-11 w-full px-4 text-sm bg-surface-base border border-border-subtle rounded-token-sm outline-none focus:border-brand-wine"
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
            <select
              name="status"
              value={status}
              onChange={(e) => setStatus(e.target.value as ProductStatus)}
              className="h-11 w-full px-4 text-sm bg-surface-base border border-border-subtle rounded-token-sm outline-none focus:border-brand-wine"
            >
              <option value="NORMAL">Normal (à venda)</option>
              <option value="PROMOTION">Em promoção</option>
              <option value="COMING_SOON">Em breve (não vende)</option>
              <option value="DISCONTINUED">Descontinuado (oculto)</option>
            </select>
            <p className="mt-1 text-xs text-ink-muted">
              Estoque=0 mostra &quot;Esgotado&quot; independente do estado.
            </p>
          </div>

          <div>
            <label className="flex items-center gap-3 text-sm text-ink-strong mt-7">
              <input
                type="checkbox"
                name="isLimitedEdition"
                value="true"
                defaultChecked={defaultValues?.isLimitedEdition ?? false}
                className="h-4 w-4 accent-brand-wine"
              />
              Edição limitada
            </label>
            <p className="mt-1 text-xs text-ink-muted">
              Combina com qualquer estado. Mostra badge âmbar.
            </p>
          </div>

          <div className="sm:col-span-2">
            <label className="block text-[10px] font-medium tracking-[0.24em] uppercase text-ink-soft mb-2">
              Marcar como &quot;Lançamento&quot; até (opcional)
            </label>
            <input
              type="date"
              name="markedAsNewUntil"
              defaultValue={toDayInputValue(defaultValues?.markedAsNewUntil)}
              className="h-11 px-4 text-sm bg-surface-base border border-border-subtle rounded-token-sm outline-none focus:border-brand-wine"
            />
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
                <label className="block text-[10px] font-medium tracking-[0.24em] uppercase text-ink-soft mb-2">
                  Preço promocional (R$)
                </label>
                <input
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
                  className="h-11 w-full px-4 text-sm bg-surface-base border border-border-subtle rounded-token-sm outline-none focus:border-brand-wine"
                />
                {discountPct != null && (
                  <p className="mt-1 text-xs text-emerald-700 font-medium">
                    {discountPct}% de desconto
                  </p>
                )}
              </div>

              <div>
                <label className="block text-[10px] font-medium tracking-[0.24em] uppercase text-ink-soft mb-2">
                  Início (opcional)
                </label>
                <input
                  type="datetime-local"
                  name="promotionStartsAt"
                  defaultValue={toDateInputValue(
                    defaultValues?.promotionStartsAt ?? null,
                  )}
                  className="h-11 w-full px-4 text-sm bg-surface-base border border-border-subtle rounded-token-sm outline-none focus:border-brand-wine"
                />
                <p className="mt-1 text-xs text-ink-muted">
                  Vazio = começa agora.
                </p>
              </div>

              <div>
                <label className="block text-[10px] font-medium tracking-[0.24em] uppercase text-ink-soft mb-2">
                  Término <span className="text-destructive">*</span>
                </label>
                <input
                  type="datetime-local"
                  name="promotionEndsAt"
                  defaultValue={toDateInputValue(
                    defaultValues?.promotionEndsAt ?? null,
                  )}
                  required={showPromoFields}
                  className="h-11 w-full px-4 text-sm bg-surface-base border border-border-subtle rounded-token-sm outline-none focus:border-brand-wine"
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
            <select
              name="collection"
              defaultValue={defaultValues?.collection ?? "day"}
              required
              className="h-11 w-full px-4 text-sm bg-surface-base border border-border-subtle rounded-token-sm outline-none focus:border-brand-wine"
            >
              <option value="day">Day (Elegância Diurna)</option>
              <option value="night">Night (Essência Noturna)</option>
              <option value="limited">Limited (Edição Limitada)</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-medium tracking-[0.24em] uppercase text-ink-soft mb-2">
              Categoria
            </label>
            <select
              name="category"
              defaultValue={defaultValues?.category ?? "perfume"}
              required
              className="h-11 w-full px-4 text-sm bg-surface-base border border-border-subtle rounded-token-sm outline-none focus:border-brand-wine"
            >
              <option value="perfume">Perfume</option>
              <option value="cologne">Colônia</option>
              <option value="body-care">Cuidados Corporais</option>
              <option value="gift-set">Kit</option>
            </select>
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
            <select
              name="badgeVariant"
              defaultValue={defaultValues?.badgeVariant ?? "default"}
              className="h-11 w-full px-4 text-sm bg-surface-base border border-border-subtle rounded-token-sm outline-none focus:border-brand-wine"
            >
              <option value="default">Padrão (bordô)</option>
              <option value="secondary">Secundário (rosa)</option>
              <option value="destructive">Destaque (vermelho)</option>
              <option value="outline">Outline</option>
            </select>
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

        <label className="block text-[10px] font-medium tracking-[0.24em] uppercase text-ink-soft mb-2">
          Uma característica por linha
        </label>
        <textarea
          name="features"
          rows={4}
          defaultValue={defaultValues?.features.join("\n") ?? ""}
          placeholder="Longa duração (8h)&#10;Família olfativa: Oriental&#10;Notas: bergamota, jasmim, baunilha"
          className="w-full px-4 py-3 text-sm bg-surface-base border border-border-subtle rounded-token-sm outline-none focus:border-brand-wine resize-none"
        />
      </section>

      {/* AÇÕES */}
      <div className="flex items-center justify-between gap-4">
        {deleteAction && (
          <Button
            type="button"
            onClick={handleDelete}
            disabled={isPending || isDeleting}
            variant="outline"
            className="text-destructive border-destructive/30 hover:bg-destructive hover:text-white"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Deletar produto
          </Button>
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
      <label
        htmlFor={props.name}
        className="block text-[10px] font-medium tracking-[0.24em] uppercase text-ink-soft mb-2"
      >
        {label}
      </label>
      <input
        id={props.name}
        {...props}
        className="h-11 w-full px-4 text-sm bg-surface-base border border-border-subtle rounded-token-sm outline-none focus:border-brand-wine"
      />
      {hint && <p className="mt-1 text-xs text-ink-muted">{hint}</p>}
    </div>
  );
}
