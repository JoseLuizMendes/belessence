"use client";

/**
 * ProductForm — Belessence Admin
 * ─────────────────────────────────────────────────────────────────────
 * Form reutilizável para criar e editar produtos.
 * Usa server actions para submit.
 */

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Loader2, Trash2 } from "lucide-react";

interface ProductFormData {
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
}

interface ProductFormProps {
  defaultValues?: ProductFormData;
  action: (formData: FormData) => Promise<void>;
  deleteAction?: () => Promise<void>;
}

export function ProductForm({
  defaultValues,
  action,
  deleteAction,
}: ProductFormProps) {
  const [isPending, startTransition] = useTransition();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
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
    if (!confirm("Tem certeza que deseja deletar este produto? Esta ação não pode ser desfeita."))
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
      <section className="bg-surface-panel rounded-token-md p-6 sm:p-8">
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

      {/* PREÇOS */}
      <section className="bg-surface-panel rounded-token-md p-6 sm:p-8">
        <h2 className="font-playfair italic text-xl text-ink-strong mb-2">
          Preços
        </h2>
        <div className="h-px w-12 bg-brand-wine/60 mb-6" />

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <FormField
            name="price"
            label="Preço (R$)"
            type="number"
            step="0.01"
            min="0"
            defaultValue={defaultValues?.price?.toString()}
            required
          />

          <FormField
            name="originalPrice"
            label="Preço de"
            type="number"
            step="0.01"
            min="0"
            defaultValue={defaultValues?.originalPrice?.toString() ?? ""}
            hint="Riscar preço maior"
          />

          <FormField
            name="stock"
            label="Estoque"
            type="number"
            min="0"
            defaultValue={defaultValues?.stock?.toString() ?? "0"}
            required
          />
        </div>
      </section>

      {/* CATEGORIZAÇÃO */}
      <section className="bg-surface-panel rounded-token-md p-6 sm:p-8">
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
            label="Badge"
            placeholder="Novo, Bestseller, Edição Limitada..."
            defaultValue={defaultValues?.badge ?? ""}
            hint="Opcional"
          />

          <div>
            <label className="block text-[10px] font-medium tracking-[0.24em] uppercase text-ink-soft mb-2">
              Estilo do badge
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

      {/* MÍDIA E DETALHES */}
      <section className="bg-surface-panel rounded-token-md p-6 sm:p-8">
        <h2 className="font-playfair italic text-xl text-ink-strong mb-2">
          Imagens e detalhes
        </h2>
        <div className="h-px w-12 bg-brand-wine/60 mb-6" />

        <div className="space-y-4">
          <div>
            <label className="block text-[10px] font-medium tracking-[0.24em] uppercase text-ink-soft mb-2">
              URLs das imagens (uma por linha)
            </label>
            <textarea
              name="images"
              rows={4}
              defaultValue={defaultValues?.images.join("\n") ?? "/assets/Perf1.jpg"}
              required
              placeholder="/assets/produto.jpg&#10;https://exemplo.com/foto2.jpg"
              className="w-full px-4 py-3 text-sm bg-surface-base border border-border-subtle rounded-token-sm outline-none focus:border-brand-wine resize-none font-mono"
            />
            <p className="mt-1 text-xs text-ink-muted">
              Primeira imagem é o card. Adicione mais imagens para a galeria do PDP.
            </p>
          </div>

          <div>
            <label className="block text-[10px] font-medium tracking-[0.24em] uppercase text-ink-soft mb-2">
              Características (uma por linha)
            </label>
            <textarea
              name="features"
              rows={4}
              defaultValue={defaultValues?.features.join("\n") ?? ""}
              placeholder="Longa duração (8h)&#10;Família olfativa: Oriental&#10;Notas: bergamota, jasmim, baunilha"
              className="w-full px-4 py-3 text-sm bg-surface-base border border-border-subtle rounded-token-sm outline-none focus:border-brand-wine resize-none"
            />
          </div>
        </div>
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
          ) : (
            defaultValues?.id ? "Salvar alterações" : "Criar produto"
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
