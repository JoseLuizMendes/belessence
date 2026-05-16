import { ProductForm } from "@/components/admin/product-form";
import { createProduct } from "../actions";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

// O <CloudinaryUpload> usa env vars NEXT_PUBLIC_* que podem não estar
// presentes em build time (ex.: deploy sem secrets configurados ainda).
// Força render dinâmico — admin nunca precisa ser estático mesmo.
export const dynamic = "force-dynamic";

export default function NovoProdutoPage() {
  return (
    <div>
      <Link
        href="/admin/produtos"
        className="inline-flex items-center gap-2 text-xs tracking-[0.18em] uppercase text-ink-soft hover:text-brand-wine mb-6"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Voltar para produtos
      </Link>

      <header className="mb-8">
        <p className="text-[11px] font-medium tracking-[0.32em] uppercase text-brand-wine mb-2">
          Catálogo
        </p>
        <h1 className="font-playfair italic text-3xl sm:text-4xl text-ink-strong">
          Novo produto
        </h1>
      </header>

      <ProductForm action={createProduct} />
    </div>
  );
}
