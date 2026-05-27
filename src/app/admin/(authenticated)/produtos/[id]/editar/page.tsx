import { prisma } from "@/lib/prisma";
import { ProductForm } from "@/components/admin/product-form";
import { updateProduct, deleteProduct } from "../../actions";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/admin/page-header";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditarProdutoPage({ params }: PageProps) {
  const { id } = await params;

  const product = await prisma.product.findUnique({ where: { id } });
  if (!product) notFound();

  const update = updateProduct.bind(null, id);
  const remove = deleteProduct.bind(null, id);

  return (
    <div>
      <Link
        href="/admin/produtos"
        className="inline-flex items-center gap-2 text-[11px] tracking-[0.22em] uppercase text-ink-soft hover:text-brand-wine mb-6 focus-ring rounded-sm transition-colors"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Voltar para produtos
      </Link>

      <PageHeader eyebrow={`Catálogo · ${product.collection}`} title={product.name} />

      <ProductForm
        action={update}
        deleteAction={remove}
        defaultValues={{
          id: product.id,
          name: product.name,
          slug: product.slug,
          shortDescription: product.shortDescription,
          description: product.description,
          price: Number(product.price),
          originalPrice: product.originalPrice ? Number(product.originalPrice) : null,
          badge: product.badge,
          badgeVariant: product.badgeVariant,
          collection: product.collection,
          category: product.category,
          gender: product.gender,
          stock: product.stock,
          images: product.images,
          features: product.features,
          status: product.status,
          isLimitedEdition: product.isLimitedEdition,
          markedAsNewUntil: product.markedAsNewUntil,
          promotionStartsAt: product.promotionStartsAt,
          promotionEndsAt: product.promotionEndsAt,
        }}
      />
    </div>
  );
}
