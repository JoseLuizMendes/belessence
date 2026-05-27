import { ProductForm } from "@/components/admin/product-form";
import { createProduct } from "../actions";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/admin/page-header";

// O <CloudinaryUpload> usa env vars NEXT_PUBLIC_* que podem não estar
// presentes em build time (ex.: deploy sem secrets configurados ainda).
// Força render dinâmico — admin nunca precisa ser estático mesmo.
export const dynamic = "force-dynamic";

export default function NovoProdutoPage() {
  return (
    <div>
      <Link
        href="/admin/produtos"
        className="inline-flex items-center gap-2 text-[11px] tracking-[0.22em] uppercase text-ink-soft hover:text-brand-wine mb-6 focus-ring rounded-sm transition-colors"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Voltar para produtos
      </Link>

      <PageHeader
        eyebrow="Catálogo · Novo"
        title="Novo produto"
        description="Cadastro com galeria de imagens, coleção, preço, estoque e estado."
      />

      <ProductForm action={createProduct} />
    </div>
  );
}
