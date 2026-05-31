"use client";

/**
 * CloudinaryUpload — widget de upload usado no ProductForm do admin.
 * ─────────────────────────────────────────────────────────────────────
 * Usa o `<CldUploadWidget>` oficial do `next-cloudinary` em modo signed
 * (assinatura buscada do endpoint `/api/admin/cloudinary/sign`).
 *
 * Estado:
 *   - props.value: string[] (URLs Cloudinary salvas, ordem importa)
 *   - props.onChange: callback ao adicionar/remover
 *
 * Visual:
 *   - Dropzone grande quando vazio
 *   - Grid de previews + tile "adicionar mais" quando já tem imagens
 *   - Badge contador "X de Y"
 *   - Hover com ações (ordenar, remover) e tooltips
 */

import { useId, useState } from "react";
import Image from "next/image";
import {
  CldUploadWidget,
  type CloudinaryUploadWidgetResults,
  type CloudinaryUploadWidgetError,
} from "next-cloudinary";
import {
  ImagePlus,
  Trash2,
  Star,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  UploadCloud,
  Plus,
} from "lucide-react";
import { productImageSrc } from "@/lib/products/infrastructure/external/product-image";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/shadcn-utils/utils";

interface CloudinaryUploadProps {
  value: string[];
  onChange: (urls: string[]) => void;
  max?: number;
  /** Nome do input hidden que carrega o JSON serializado para o form action. */
  inputName?: string;
}

export function CloudinaryUpload({
  value,
  onChange,
  max = 5,
  inputName = "images",
}: CloudinaryUploadProps) {
  const id = useId();
  const [error, setError] = useState<string | null>(null);
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY;
  const folder =
    process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_FOLDER ?? "belessence/products";

  const canAddMore = value.length < max;
  const missingConfig = !cloudName || !apiKey;
  const isEmpty = value.length === 0;

  const remove = (idx: number) => {
    onChange(value.filter((_, i) => i !== idx));
  };

  const move = (from: number, to: number) => {
    if (to < 0 || to >= value.length) return;
    const next = [...value];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    onChange(next);
  };

  // Opções do widget Cloudinary
  const widgetOptions = {
    folder,
    multiple: true,
    maxFiles: max - value.length,
    sources: ["local", "url", "camera"] as ("local" | "url" | "camera")[],
    clientAllowedFormats: ["jpg", "jpeg", "png", "webp", "avif"],
    maxFileSize: 6_000_000, // 6 MB
    cropping: false,
    showAdvancedOptions: false,
    language: "pt",
    text: {
      pt: {
        or: "ou",
        menu: { files: "Meu computador", url: "URL", camera: "Câmera" },
        local: {
          browse: "Procurar",
          dd_title_single: "Arraste e solte uma imagem aqui",
          dd_title_multi: "Arraste e solte imagens aqui",
          drop_title_single: "Solte para enviar",
          drop_title_multiple: "Solte para enviar",
        },
      },
    },
  };

  const handleSuccess = (result: CloudinaryUploadWidgetResults) => {
    const info = result?.info;
    if (typeof info !== "object" || info === null) return;
    const secureUrl = (info as { secure_url?: string }).secure_url;
    if (!secureUrl) return;
    if (value.includes(secureUrl)) return;
    onChange([...value, secureUrl]);
    setError(null);
  };

  const handleError = (err: CloudinaryUploadWidgetError) => {
    console.error("[CloudinaryUpload]", err);
    setError("Falha no upload. Tente novamente.");
  };

  return (
    <TooltipProvider delayDuration={200}>
      <div className="space-y-4">
        {/* Hidden input para o form action ler */}
        <input type="hidden" name={inputName} value={value.join("\n")} />

        {missingConfig && (
          <Alert variant="destructive" className="bg-amber-50 border-amber-200 text-amber-900 [&>svg]:text-amber-600">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Cloudinary não configurado</AlertTitle>
            <AlertDescription className="text-amber-800">
              Adicione{" "}
              <code className="font-mono text-[11px] px-1 py-0.5 rounded bg-amber-100">
                NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
              </code>{" "}
              e{" "}
              <code className="font-mono text-[11px] px-1 py-0.5 rounded bg-amber-100">
                NEXT_PUBLIC_CLOUDINARY_API_KEY
              </code>{" "}
              em <code className="font-mono text-[11px] px-1 py-0.5 rounded bg-amber-100">.env.local</code> e reinicie o dev server.
            </AlertDescription>
          </Alert>
        )}

        {/* Header com counter — só quando há imagens */}
        {!isEmpty && (
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Badge
                variant="outline"
                className="text-[10px] tracking-[0.18em] uppercase border-brand-wine/30 text-brand-wine bg-brand-pink/10"
              >
                {value.length} de {max}
              </Badge>
              <span className="text-xs text-ink-muted">
                {canAddMore
                  ? `${max - value.length} ${max - value.length === 1 ? "vaga restante" : "vagas restantes"}`
                  : "Limite atingido"}
              </span>
            </div>
          </div>
        )}

        {/* DROPZONE GRANDE — só quando vazio */}
        {!missingConfig && isEmpty && (
          <CldUploadWidget
            signatureEndpoint="/api/admin/cloudinary/sign"
            options={widgetOptions}
            onSuccess={handleSuccess}
            onError={handleError}
          >
            {({ open }: { open: () => void }) => (
              <button
                type="button"
                id={id}
                onClick={() => open()}
                className="group relative w-full overflow-hidden rounded-token-md border-2 border-dashed border-border-subtle bg-surface-section/40 px-6 py-12 sm:py-16 transition-all hover:border-brand-wine hover:bg-brand-pink/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-wine focus-visible:ring-offset-2"
              >
                <div className="flex flex-col items-center gap-4 text-center">
                  <div className="flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-full bg-brand-pink/40 text-brand-wine transition-transform group-hover:scale-110">
                    <UploadCloud className="h-7 w-7 sm:h-8 sm:w-8" strokeWidth={1.5} />
                  </div>

                  <div className="space-y-1.5">
                    <p className="font-playfair italic text-lg sm:text-xl text-ink-strong">
                      Adicione as fotos do produto
                    </p>
                    <p className="text-xs sm:text-sm text-ink-soft">
                      JPG, PNG, WebP ou AVIF · até 6&nbsp;MB cada · até {max} imagens
                    </p>
                  </div>

                  <div className="pointer-events-none mt-2 inline-flex items-center gap-2 rounded-full bg-brand-wine px-5 h-10 text-[11px] font-medium tracking-[0.18em] uppercase text-brand-pink transition-all group-hover:bg-brand-wine/90">
                    <ImagePlus className="h-4 w-4" />
                    Selecionar imagens
                  </div>

                  <p className="text-[11px] text-ink-muted">
                    ou arraste e solte aqui
                  </p>
                </div>
              </button>
            )}
          </CldUploadWidget>
        )}

        {/* Grid de previews + tile "adicionar mais" */}
        {!isEmpty && (
          <ul className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {value.map((url, idx) => {
              const isFirst = idx === 0;
              return (
                <li
                  key={`${url}-${idx}`}
                  className={cn(
                    "group relative overflow-hidden rounded-token-sm border bg-surface-section transition-all",
                    isFirst
                      ? "border-brand-wine/40 ring-1 ring-brand-wine/15 shadow-sm"
                      : "border-border-subtle hover:border-brand-wine/30",
                  )}
                >
                  <AspectRatio ratio={1}>
                    <Image
                      src={productImageSrc(url)}
                      alt={`Imagem ${idx + 1}`}
                      fill
                      sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 200px"
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                    />

                    {/* Badge principal — sutil, sempre visível */}
                    {isFirst && (
                      <Badge
                        className="absolute top-2 left-2 gap-1 bg-brand-wine text-brand-pink text-[9px] tracking-[0.16em] uppercase border-transparent hover:bg-brand-wine shadow-sm"
                      >
                        <Star className="h-2.5 w-2.5 fill-current" />
                        Principal
                      </Badge>
                    )}

                    {/* Número do slot — canto superior direito */}
                    <span className="absolute top-2 right-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-ink-strong/70 text-brand-pink text-[10px] font-medium tabular-nums backdrop-blur-sm">
                      {idx + 1}
                    </span>

                    {/* Overlay com ações no hover */}
                    <div className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-1.5 bg-gradient-to-t from-ink-strong/85 via-ink-strong/40 to-transparent p-2 opacity-0 transition-opacity group-hover:opacity-100">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            type="button"
                            size="icon"
                            variant="secondary"
                            disabled={idx === 0}
                            onClick={() => move(idx, idx - 1)}
                            className="h-8 w-8 rounded-full bg-surface-panel/95 hover:bg-brand-pink text-ink-strong disabled:opacity-30"
                          >
                            <ChevronLeft className="h-4 w-4" />
                            <span className="sr-only">Mover para esquerda</span>
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Mover para esquerda</TooltipContent>
                      </Tooltip>

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            type="button"
                            size="icon"
                            variant="destructive"
                            onClick={() => remove(idx)}
                            className="h-8 w-8 rounded-full"
                          >
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">Remover imagem</span>
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Remover</TooltipContent>
                      </Tooltip>

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            type="button"
                            size="icon"
                            variant="secondary"
                            disabled={idx === value.length - 1}
                            onClick={() => move(idx, idx + 1)}
                            className="h-8 w-8 rounded-full bg-surface-panel/95 hover:bg-brand-pink text-ink-strong disabled:opacity-30"
                          >
                            <ChevronRight className="h-4 w-4" />
                            <span className="sr-only">Mover para direita</span>
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Mover para direita</TooltipContent>
                      </Tooltip>
                    </div>
                  </AspectRatio>
                </li>
              );
            })}

            {/* Tile "adicionar mais" — mesmo tamanho dos previews */}
            {!missingConfig && canAddMore && (
              <li>
                <CldUploadWidget
                  signatureEndpoint="/api/admin/cloudinary/sign"
                  options={widgetOptions}
                  onSuccess={handleSuccess}
                  onError={handleError}
                >
                  {({ open }: { open: () => void }) => (
                    <button
                      type="button"
                      onClick={() => open()}
                      aria-label="Adicionar mais imagens"
                      className="group/add relative w-full overflow-hidden rounded-token-sm border-2 border-dashed border-border-subtle bg-surface-section/40 transition-all hover:border-brand-wine hover:bg-brand-pink/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-wine focus-visible:ring-offset-2"
                    >
                      <AspectRatio ratio={1}>
                        <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-ink-soft transition-colors group-hover/add:text-brand-wine">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-panel transition-transform group-hover/add:scale-110">
                            <Plus className="h-5 w-5" strokeWidth={1.5} />
                          </div>
                          <span className="text-[10px] tracking-[0.18em] uppercase font-medium">
                            Adicionar
                          </span>
                        </div>
                      </AspectRatio>
                    </button>
                  )}
                </CldUploadWidget>
              </li>
            )}
          </ul>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {!isEmpty && (
          <p className="flex items-start gap-1.5 text-xs text-ink-muted">
            <Star className="h-3 w-3 mt-0.5 fill-brand-wine/30 text-brand-wine/60 flex-shrink-0" />
            <span>
              A primeira imagem é destacada como principal — aparece no card do
              catálogo, na thumbnail do checkout e como capa do produto.
            </span>
          </p>
        )}
      </div>
    </TooltipProvider>
  );
}

export default CloudinaryUpload;
