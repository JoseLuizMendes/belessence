/**
 * Testes — Server Actions de produtos (admin)
 * src/app/admin/(authenticated)/produtos/actions.ts
 *
 * Integra a action real com a lógica de domínio `applyStatusTransition`
 * (NÃO mockada). Prisma mockado em setup.ts. revalidatePath/redirect mockados.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";

const { revalidatePath, redirect } = vi.hoisted(() => ({
  revalidatePath: vi.fn(),
  redirect: vi.fn(),
}));

vi.mock("next/cache", () => ({ revalidatePath }));
vi.mock("next/navigation", () => ({ redirect }));

import {
  createProduct,
  updateProduct,
  deleteProduct,
} from "@/app/admin/(authenticated)/produtos/actions";
import { prisma } from "@/lib/prisma";

/** Monta um FormData de produto com defaults válidos. */
function makeForm(over: Record<string, string> = {}): FormData {
  const fd = new FormData();
  const base: Record<string, string> = {
    name: "Midnight Velvet",
    slug: "midnight-velvet",
    shortDescription: "Fragrância misteriosa",
    description: "Notas amadeiradas profundas e envolventes.",
    price: "200",
    collection: "night",
    category: "perfume",
    stock: "10",
    images: "https://cdn/a.jpg",
    features: "Long-lasting\nVegano",
    status: "NORMAL",
    ...over,
  };
  for (const [k, v] of Object.entries(base)) fd.set(k, v);
  return fd;
}

describe("createProduct", () => {
  beforeEach(() => vi.clearAllMocks());

  it("rejeita dados inválidos (slug não kebab-case)", async () => {
    await expect(
      createProduct(makeForm({ slug: "Slug Invalido!" })),
    ).rejects.toThrow(/Dados inválidos/);
    expect(prisma.product.create).not.toHaveBeenCalled();
  });

  it("rejeita sem imagens", async () => {
    await expect(createProduct(makeForm({ images: "" }))).rejects.toThrow(
      /Dados inválidos/,
    );
  });

  it("cria produto NORMAL e revalida caches + redireciona", async () => {
    vi.mocked(prisma.product.create).mockResolvedValueOnce({} as never);
    await createProduct(makeForm());

    expect(prisma.product.create).toHaveBeenCalledOnce();
    const arg = vi.mocked(prisma.product.create).mock.calls[0][0] as {
      data: Record<string, unknown>;
    };
    expect(arg.data.slug).toBe("midnight-velvet");
    expect(arg.data.price).toBe(200);
    expect(arg.data.status).toBe("NORMAL");
    expect(arg.data.images).toEqual(["https://cdn/a.jpg"]);
    expect(arg.data.features).toEqual(["Long-lasting", "Vegano"]);

    expect(revalidatePath).toHaveBeenCalledWith("/admin/produtos");
    expect(revalidatePath).toHaveBeenCalledWith("/allProducts");
    expect(redirect).toHaveBeenCalledWith("/admin/produtos");
  });

  it("entrar em PROMOTION com promoPrice >= price lança erro de domínio", async () => {
    await expect(
      createProduct(
        makeForm({
          status: "PROMOTION",
          price: "200",
          promoPrice: "250", // inválido: >= price
          promotionEndsAt: "2099-12-31T23:59",
        }),
      ),
    ).rejects.toThrow(/menor que o preço atual/i);
    expect(prisma.product.create).not.toHaveBeenCalled();
  });

  it("PROMOTION válida salva price=promoPrice e originalPrice=preço cheio", async () => {
    vi.mocked(prisma.product.create).mockResolvedValueOnce({} as never);
    await createProduct(
      makeForm({
        status: "PROMOTION",
        price: "200",
        promoPrice: "150",
        promotionEndsAt: "2099-12-31T23:59",
      }),
    );
    const arg = vi.mocked(prisma.product.create).mock.calls[0][0] as {
      data: Record<string, unknown>;
    };
    expect(arg.data.status).toBe("PROMOTION");
    expect(arg.data.price).toBe(150);
    expect(arg.data.originalPrice).toBe(200);
    expect(arg.data.promotionEndsAt).toBeInstanceOf(Date);
  });

  it("parseia campos opcionais (badge, badgeVariant, originalPrice, markedAsNewUntil)", async () => {
    vi.mocked(prisma.product.create).mockResolvedValueOnce({} as never);
    await createProduct(
      makeForm({
        badge: "Bestseller",
        badgeVariant: "secondary",
        originalPrice: "250",
        markedAsNewUntil: "2099-06-01",
        isLimitedEdition: "true",
      }),
    );
    const arg = vi.mocked(prisma.product.create).mock.calls[0][0] as {
      data: Record<string, unknown>;
    };
    expect(arg.data.badge).toBe("Bestseller");
    expect(arg.data.badgeVariant).toBe("secondary");
    expect(arg.data.isLimitedEdition).toBe(true);
    expect(arg.data.markedAsNewUntil).toBeInstanceOf(Date);
  });

  it("PROMOTION com promotionStartsAt explícito preserva a data informada", async () => {
    vi.mocked(prisma.product.create).mockResolvedValueOnce({} as never);
    await createProduct(
      makeForm({
        status: "PROMOTION",
        price: "200",
        promoPrice: "150",
        promotionStartsAt: "2099-01-01T00:00",
        promotionEndsAt: "2099-12-31T23:59",
      }),
    );
    const arg = vi.mocked(prisma.product.create).mock.calls[0][0] as {
      data: { promotionStartsAt: Date };
    };
    expect(arg.data.promotionStartsAt).toBeInstanceOf(Date);
    expect(arg.data.promotionStartsAt.getFullYear()).toBe(2099);
  });

  it("COMING_SOON preserva preços do form e zera datas de promo", async () => {
    vi.mocked(prisma.product.create).mockResolvedValueOnce({} as never);
    await createProduct(makeForm({ status: "COMING_SOON", price: "180" }));
    const arg = vi.mocked(prisma.product.create).mock.calls[0][0] as {
      data: Record<string, unknown>;
    };
    expect(arg.data.status).toBe("COMING_SOON");
    expect(arg.data.price).toBe(180);
    expect(arg.data.promotionStartsAt).toBeNull();
    expect(arg.data.promotionEndsAt).toBeNull();
  });

  it("markedAsNewUntil inválido vira null (toDate trata data inválida)", async () => {
    vi.mocked(prisma.product.create).mockResolvedValueOnce({} as never);
    await createProduct(makeForm({ markedAsNewUntil: "data-invalida" }));
    const arg = vi.mocked(prisma.product.create).mock.calls[0][0] as {
      data: Record<string, unknown>;
    };
    expect(arg.data.markedAsNewUntil).toBeNull();
  });
});

describe("updateProduct", () => {
  beforeEach(() => vi.clearAllMocks());

  it("lança quando produto não existe", async () => {
    vi.mocked(prisma.product.findUnique).mockResolvedValueOnce(null as never);
    await expect(updateProduct("id-x", makeForm())).rejects.toThrow(
      /não encontrado/i,
    );
    expect(prisma.product.update).not.toHaveBeenCalled();
  });

  it("atualiza produto existente e redireciona", async () => {
    vi.mocked(prisma.product.findUnique).mockResolvedValueOnce({
      status: "NORMAL",
      originalPrice: null,
      price: { toString: () => "200" },
    } as never);
    vi.mocked(prisma.product.update).mockResolvedValueOnce({} as never);

    await updateProduct("id-1", makeForm());

    expect(prisma.product.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "id-1" } }),
    );
    expect(redirect).toHaveBeenCalledWith("/admin/produtos");
  });

  it("PROMOTION → NORMAL restaura o preço cheio anterior", async () => {
    // Produto atualmente em promoção: price=150, originalPrice=200
    vi.mocked(prisma.product.findUnique).mockResolvedValueOnce({
      status: "PROMOTION",
      originalPrice: { toString: () => "200" },
      price: { toString: () => "150" },
    } as never);
    vi.mocked(prisma.product.update).mockResolvedValueOnce({} as never);

    // Form volta para NORMAL
    await updateProduct("id-1", makeForm({ status: "NORMAL", price: "150" }));

    const arg = vi.mocked(prisma.product.update).mock.calls[0][0] as {
      data: Record<string, unknown>;
    };
    expect(arg.data.status).toBe("NORMAL");
    expect(arg.data.price).toBe(200); // restaurado do originalPrice
    expect(arg.data.originalPrice).toBeNull();
  });

  it("converte StatusTransitionError em Error com a mensagem do domínio", async () => {
    // Produto NORMAL; form tenta PROMOTION com promoPrice >= price → erro.
    vi.mocked(prisma.product.findUnique).mockResolvedValueOnce({
      status: "NORMAL",
      originalPrice: null,
      price: { toString: () => "200" },
    } as never);

    await expect(
      updateProduct(
        "id-1",
        makeForm({
          status: "PROMOTION",
          price: "200",
          promoPrice: "250", // inválido
          promotionEndsAt: "2099-12-31T23:59",
        }),
      ),
    ).rejects.toThrow(/menor que o preço atual/i);
    expect(prisma.product.update).not.toHaveBeenCalled();
  });
});

describe("deleteProduct", () => {
  beforeEach(() => vi.clearAllMocks());

  it("deleta produto, revalida e redireciona", async () => {
    vi.mocked(prisma.product.delete).mockResolvedValueOnce({} as never);
    await deleteProduct("id-1");
    expect(prisma.product.delete).toHaveBeenCalledWith({ where: { id: "id-1" } });
    expect(revalidatePath).toHaveBeenCalledWith("/admin/produtos");
    expect(redirect).toHaveBeenCalledWith("/admin/produtos");
  });
});
