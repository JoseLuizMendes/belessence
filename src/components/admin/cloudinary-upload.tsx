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
 * UX:
 *   - Grid de previews com botão remover por imagem
 *   - Botão "Adicionar imagem" abre o widget
 *   - Limite default 5 imagens
 *   - Primeira imagem é destacada como "principal" (mesmo padrão do card)
 */

import { useId, useState } from "react";
import Image from "next/image";
import {
  CldUploadWidget,
  type CloudinaryUploadWidgetResults,
  type CloudinaryUploadWidgetError,
} from "next-cloudinary";
import { ImagePlus, X, Star, AlertCircle } from "lucide-react";
import { productImageSrc } from "@/lib/product-image";

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

  return (
    <div className="space-y-3">
      {/* Hidden input para o form action ler. Serializamos como uma URL por linha
          para preservar compatibilidade com o parser existente em actions.ts. */}
      <input type="hidden" name={inputName} value={value.join("\n")} />

      {missingConfig && (
        <div className="flex items-center gap-2 p-3 rounded-token-sm bg-amber-50 border border-amber-200 text-amber-800 text-xs">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span>
            Cloudinary não configurado. Adicione{" "}
            <code className="font-mono">NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME</code> e{" "}
            <code className="font-mono">NEXT_PUBLIC_CLOUDINARY_API_KEY</code> em{" "}
            <code className="font-mono">.env.local</code> e reinicie o dev server.
          </span>
        </div>
      )}

      {/* Grid de previews */}
      {value.length > 0 && (
        <ul className="grid grid-cols-3 sm:grid-cols-4 gap-3">
          {value.map((url, idx) => (
            <li
              key={`${url}-${idx}`}
              className="relative group aspect-square rounded-token-sm overflow-hidden border border-border-subtle bg-surface-section"
            >
              <Image
                src={productImageSrc(url)}
                alt={`Imagem ${idx + 1}`}
                fill
                sizes="(max-width: 640px) 33vw, 200px"
                className="object-cover"
              />

              {/* Badge principal */}
              {idx === 0 && (
                <span className="absolute top-1.5 left-1.5 inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-brand-wine text-brand-pink text-[9px] font-medium tracking-wider uppercase">
                  <Star className="h-2.5 w-2.5 fill-current" /> Principal
                </span>
              )}

              {/* Overlay com ações */}
              <div className="absolute inset-0 bg-ink-strong/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                {idx > 0 && (
                  <button
                    type="button"
                    onClick={() => move(idx, idx - 1)}
                    aria-label="Mover para esquerda"
                    className="px-2 py-1 rounded bg-surface-panel text-ink-strong text-[10px] hover:bg-brand-pink"
                  >
                    ←
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => remove(idx)}
                  aria-label="Remover imagem"
                  className="p-1.5 rounded-full bg-destructive text-white hover:bg-destructive/90"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
                {idx < value.length - 1 && (
                  <button
                    type="button"
                    onClick={() => move(idx, idx + 1)}
                    aria-label="Mover para direita"
                    className="px-2 py-1 rounded bg-surface-panel text-ink-strong text-[10px] hover:bg-brand-pink"
                  >
                    →
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Botão de adicionar */}
      {!missingConfig && canAddMore && (
        <CldUploadWidget
          signatureEndpoint="/api/admin/cloudinary/sign"
          options={{
            folder,
            multiple: true,
            maxFiles: max - value.length,
            sources: ["local", "url", "camera"],
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
          }}
          onSuccess={(result: CloudinaryUploadWidgetResults) => {
            const info = result?.info;
            if (typeof info !== "object" || info === null) return;
            const secureUrl = (info as { secure_url?: string }).secure_url;
            if (!secureUrl) return;
            // Evita duplicatas
            if (value.includes(secureUrl)) return;
            onChange([...value, secureUrl]);
            setError(null);
          }}
          onError={(err: CloudinaryUploadWidgetError) => {
            console.error("[CloudinaryUpload]", err);
            setError("Falha no upload. Tente novamente.");
          }}
        >
          {({ open }: { open: () => void }) => (
            <button
              type="button"
              id={id}
              onClick={() => open()}
              className="w-full flex items-center justify-center gap-2 px-4 py-6 border-2 border-dashed border-border-subtle rounded-token-sm text-sm text-ink-soft hover:border-brand-wine hover:text-brand-wine transition-colors"
            >
              <ImagePlus className="h-5 w-5" />
              Adicionar imagem ({value.length}/{max})
            </button>
          )}
        </CldUploadWidget>
      )}

      {!canAddMore && (
        <p className="text-xs text-ink-muted text-center">
          Limite de {max} imagens atingido. Remova alguma para adicionar nova.
        </p>
      )}

      {error && (
        <p className="text-xs text-destructive flex items-center gap-1.5">
          <AlertCircle className="h-3 w-3" /> {error}
        </p>
      )}

      <p className="text-xs text-ink-muted">
        Primeira imagem aparece no card e na thumbnail do checkout. Arraste para
        reordenar.
      </p>
    </div>
  );
}

export default CloudinaryUpload;
