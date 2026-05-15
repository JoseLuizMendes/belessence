/**
 * /admin/produtos — Lista de produtos
 */

import { prisma } from "@/lib/prisma";
import Link from "next/link";
import Image from "next/image";
import { formatPrice } from "@/api/utils";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Package } from "lucide-react";

export default async function AdminProductsPage() {
  const products = await prisma.product.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <header className="flex items-end justify-between mb-8 gap-4 flex-wrap">
        <div>
          <p className="text-[11px] font-medium tracking-[0.32em] uppercase text-brand-wine mb-2">
            Catálogo
          </p>
          <h1 className="font-playfair italic text-3xl sm:text-4xl text-ink-strong">
            Produtos
          </h1>
          <p className="text-sm text-ink-soft mt-1">
            {products.length} {products.length === 1 ? "produto" : "produtos"} no catálogo
          </p>
        </div>
        <Link href="/admin/produtos/novo">
          <Button className="loreal-btn-pill h-11 px-6 bg-brand-wine text-brand-pink text-[11px] font-medium tracking-[0.18em] uppercase hover:bg-brand-wine/90">
            <Plus className="mr-2 h-4 w-4" />
            Novo produto
          </Button>
        </Link>
      </header>

      {products.length === 0 ? (
        <div className="bg-surface-panel rounded-token-md p-12 text-center">
          <Package className="h-12 w-12 text-ink-muted mx-auto mb-4" strokeWidth={1.2} />
          <p className="text-base text-ink-strong font-medium mb-2">
            Nenhum produto cadastrado
          </p>
          <p className="text-sm text-ink-soft mb-6">
            Comece criando seu primeiro produto.
          </p>
          <Link href="/admin/produtos/novo">
            <Button className="loreal-btn-pill h-11 px-6 bg-brand-wine text-brand-pink text-[11px] font-medium tracking-[0.18em] uppercase">
              Criar primeiro produto
            </Button>
          </Link>
        </div>
      ) : (
        <div className="bg-surface-panel rounded-token-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-surface-section">
                <tr>
                  <th className="text-left py-3 px-5 text-[10px] tracking-[0.18em] uppercase font-medium text-ink-soft">
                    Produto
                  </th>
                  <th className="text-left py-3 px-5 text-[10px] tracking-[0.18em] uppercase font-medium text-ink-soft">
                    Coleção
                  </th>
                  <th className="text-right py-3 px-5 text-[10px] tracking-[0.18em] uppercase font-medium text-ink-soft">
                    Preço
                  </th>
                  <th className="text-right py-3 px-5 text-[10px] tracking-[0.18em] uppercase font-medium text-ink-soft">
                    Estoque
                  </th>
                  <th className="text-right py-3 px-5 text-[10px] tracking-[0.18em] uppercase font-medium text-ink-soft">
                    Vendidos
                  </th>
                  <th className="text-right py-3 px-5 text-[10px] tracking-[0.18em] uppercase font-medium text-ink-soft">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr
                    key={p.id}
                    className="border-t border-border-subtle hover:bg-surface-section/50 transition-colors"
                  >
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-3">
                        <div className="relative w-12 h-12 rounded-token-sm overflow-hidden bg-surface-section flex-shrink-0">
                          {p.images[0] && (
                            <Image
                              src={p.images[0]}
                              alt={p.name}
                              fill
                              className="object-cover"
                              sizes="48px"
                            />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-ink-strong line-clamp-1">
                            {p.name}
                          </p>
                          <p className="text-xs text-ink-muted">{p.slug}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-5 text-sm text-ink-soft capitalize">
                      {p.collection}
                    </td>
                    <td className="py-4 px-5 text-right text-sm font-medium text-brand-wine">
                      {formatPrice(Number(p.price))}
                    </td>
                    <td className="py-4 px-5 text-right">
                      <span
                        className={`text-sm font-medium tabular-nums ${
                          p.stock < 5
                            ? "text-destructive"
                            : p.stock < 20
                              ? "text-amber-600"
                              : "text-ink-strong"
                        }`}
                      >
                        {p.stock}
                      </span>
                    </td>
                    <td className="py-4 px-5 text-right text-sm text-ink-soft tabular-nums">
                      {p.totalSold}
                    </td>
                    <td className="py-4 px-5 text-right">
                      <Link
                        href={`/admin/produtos/${p.id}/editar`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[10px] tracking-[0.18em] uppercase text-brand-wine border border-brand-wine/20 rounded-full hover:bg-brand-wine hover:text-brand-pink transition-colors"
                      >
                        <Pencil className="h-3 w-3" />
                        Editar
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
