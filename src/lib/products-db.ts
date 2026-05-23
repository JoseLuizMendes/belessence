/**
 * Funções de acesso ao banco via Prisma — substitui src/api/products.ts hardcoded.
 * Chamadas sempre em Server Components ou Route Handlers — nunca no cliente.
 *
 * IMPORTANTE: todos os campos Decimal do Prisma são serializados para `number`
 * antes do retorno. Decimals são objetos não-serializáveis e não podem cruzar
 * a fronteira Server → Client Component no Next.js 16 / React 19.
 */

import { prisma } from "@/lib/prisma";
import type { ProductStatus, Gender } from "@prisma/client";

// ─── TIPOS ───────────────────────────────────────────────────────────────────

export interface Product {
  id: string;
  slug: string;
  name: string;
  shortDescription: string;
  description: string;
  price: number;
  originalPrice: number | null;
  badge: string | null;
  badgeVariant: string | null;
  rating: number;
  reviews: number;
  images: string[];
  features: string[];
  collection: string;
  category: string;
  /** Gênero da fragrância (FEMININO/MASCULINO/UNISSEX). */
  gender: Gender;
  totalSold: number;
  seasonalSold: number;
  /** Quantidade em estoque. 0 → esgotado. */
  stock: number;
  /** Estado do ciclo de vida (NORMAL/PROMOTION/COMING_SOON/DISCONTINUED). */
  status: ProductStatus;
  isLimitedEdition: boolean;
  markedAsNewUntil: Date | null;
  promotionStartsAt: Date | null;
  promotionEndsAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

// ─── SERIALIZAÇÃO DE DECIMAL ─────────────────────────────────────────────────

/** Campos vindos do Prisma com Decimals + extras desnecessários no cliente */
type RawProduct = {
  id: string;
  slug: string;
  name: string;
  shortDescription: string;
  description: string;
  price: { toString(): string } | number | string;
  originalPrice: { toString(): string } | number | string | null;
  badge: string | null;
  badgeVariant: string | null;
  rating: { toString(): string } | number | string;
  reviews: number;
  images: string[];
  features: string[];
  collection: string;
  category: string;
  gender: Gender;
  totalSold: number;
  seasonalSold: number;
  stock: number;
  status: ProductStatus;
  isLimitedEdition: boolean;
  markedAsNewUntil: Date | null;
  promotionStartsAt: Date | null;
  promotionEndsAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

function serializeProduct(p: RawProduct): Product {
  return {
    ...p,
    price: Number(p.price),
    originalPrice: p.originalPrice != null ? Number(p.originalPrice) : null,
    rating: Number(p.rating),
  };
}

/**
 * Reordena uma lista preservando ordem original interna,
 * mas movendo produtos com `stock === 0` para o final.
 */
export function sortInStockFirst<T extends { stock: number }>(rows: T[]): T[] {
  const inStock: T[] = [];
  const outOfStock: T[] = [];
  for (const r of rows) {
    if (r.stock > 0) inStock.push(r);
    else outOfStock.push(r);
  }
  return [...inStock, ...outOfStock];
}

export interface SalesProduct extends Product {
  promoTitle: string;
  promoText: string;
  promoGradient: string;
  iconName: "Timer" | "Sparkles" | "Tag";
  // Preço como number para o cliente
  priceNum: number;
}

// Dados de promoção mapeados por posição (index 0, 1, 2 no resultado)
const PROMO_CONFIG = [
  {
    promoTitle: "Oferta da Madrugada",
    promoText: "20% OFF na segunda unidade",
    promoGradient: "from-indigo-400 via-purple-400 to-pink-400",
    iconName: "Timer" as const,
  },
  {
    promoTitle: "Exclusividade",
    promoText: "Brinde especial na compra",
    promoGradient: "from-rose-400 via-red-400 to-orange-400",
    iconName: "Sparkles" as const,
  },
  {
    promoTitle: "Últimas Unidades",
    promoText: "Preço especial de lançamento",
    promoGradient: "from-amber-400 via-yellow-400 to-orange-400",
    iconName: "Tag" as const,
  },
];

const PRODUCT_SELECT = {
  id: true,
  slug: true,
  name: true,
  shortDescription: true,
  description: true,
  price: true,
  originalPrice: true,
  badge: true,
  badgeVariant: true,
  rating: true,
  reviews: true,
  images: true,
  features: true,
  collection: true,
  category: true,
  gender: true,
  totalSold: true,
  seasonalSold: true,
  stock: true,
  status: true,
  isLimitedEdition: true,
  markedAsNewUntil: true,
  promotionStartsAt: true,
  promotionEndsAt: true,
  createdAt: true,
  updatedAt: true,
} as const;

// ─── QUERIES ─────────────────────────────────────────────────────────────────

/** Cláusula WHERE base para o catálogo público: esconde DISCONTINUED. */
const PUBLIC_VISIBLE_WHERE = {
  status: { not: "DISCONTINUED" as ProductStatus },
};

export async function getAllProducts(): Promise<Product[]> {
  const rows = await prisma.product.findMany({
    select: PRODUCT_SELECT,
    where: PUBLIC_VISIBLE_WHERE,
    orderBy: { createdAt: "desc" },
  });
  return sortInStockFirst(rows.map(serializeProduct));
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  // Slug direto é permitido mesmo para DISCONTINUED (link já compartilhado).
  // A página de detalhe decide se mostra badge "Fora de linha".
  const row = await prisma.product.findUnique({
    where: { slug },
    select: PRODUCT_SELECT,
  });
  return row ? serializeProduct(row) : null;
}

export async function getProductsByCollection(
  collection: string,
): Promise<Product[]> {
  const rows = await prisma.product.findMany({
    select: PRODUCT_SELECT,
    where: { collection, ...PUBLIC_VISIBLE_WHERE },
    orderBy: { totalSold: "desc" },
  });
  return sortInStockFirst(rows.map(serializeProduct));
}

export async function getFeaturedProducts(limit = 6): Promise<Product[]> {
  // Busca mais que `limit` para depois reordenar e ainda ter `limit` itens
  // mesmo se alguns esgotaram. Trade-off: leve overfetch para garantir UX.
  const rows = await prisma.product.findMany({
    select: PRODUCT_SELECT,
    where: PUBLIC_VISIBLE_WHERE,
    orderBy: { totalSold: "desc" },
    take: limit * 2,
  });
  return sortInStockFirst(rows.map(serializeProduct)).slice(0, limit);
}

/**
 * Retorna produtos em PROMOTION ativa (status=PROMOTION + originalPrice presente).
 * Filtragem fina de janela startsAt/endsAt fica para o consumidor via getEffectivePromotion.
 */
export async function getSalesProducts(): Promise<SalesProduct[]> {
  const now = new Date();
  const rows = await prisma.product.findMany({
    select: PRODUCT_SELECT,
    where: {
      status: "PROMOTION",
      originalPrice: { not: null },
      // Janela ativa: startsAt nulo ou ≤ now; endsAt nulo ou ≥ now.
      AND: [
        {
          OR: [
            { promotionStartsAt: null },
            { promotionStartsAt: { lte: now } },
          ],
        },
        {
          OR: [
            { promotionEndsAt: null },
            { promotionEndsAt: { gte: now } },
          ],
        },
      ],
    },
    orderBy: { seasonalSold: "desc" },
    take: 3,
  });

  const serializedAll = rows.map((p) => serializeProduct(p));
  return sortInStockFirst(serializedAll).map((serialized, i) => ({
    ...serialized,
    priceNum: serialized.price,
    ...PROMO_CONFIG[i % PROMO_CONFIG.length],
  }));
}

export async function getBestsellers(limit = 5): Promise<Product[]> {
  const rows = await prisma.product.findMany({
    select: PRODUCT_SELECT,
    where: PUBLIC_VISIBLE_WHERE,
    orderBy: { totalSold: "desc" },
    take: limit * 2,
  });
  return sortInStockFirst(rows.map(serializeProduct)).slice(0, limit);
}

// ─── FILTROS ─────────────────────────────────────────────────────────────────

export type ProductSort =
  | "best-seller"
  | "newest"
  | "price-asc"
  | "price-desc"
  | "name-asc";

export interface ProductFilters {
  /** filtra por coleção (night/day/limited) */
  collection?: string;
  /** filtro por categoria (perfume/cologne/...) */
  category?: string;
  /** filtro por gênero da fragrância (feminino/masculino/unissex) — combinável com category */
  genero?: string;
  /** busca textual em name/shortDescription/description */
  search?: string;
  /** preço mínimo (>=) */
  minPrice?: number;
  /** preço máximo (<=) */
  maxPrice?: number;
  /** ordenação */
  sort?: ProductSort;
  /** limite de resultados */
  limit?: number;
}

const SORT_MAP: Record<ProductSort, { field: string; dir: "asc" | "desc" }> = {
  "best-seller": { field: "totalSold", dir: "desc" },
  newest: { field: "createdAt", dir: "desc" },
  "price-asc": { field: "price", dir: "asc" },
  "price-desc": { field: "price", dir: "desc" },
  "name-asc": { field: "name", dir: "asc" },
};

/**
 * Normaliza um valor textual de gênero para o enum `Gender`.
 * Aceita variações ("feminina", "Femininas", "FEMININO", ...) por prefixo.
 * Retorna `null` se não reconhecer (filtro é ignorado).
 */
export function normalizeGender(raw: string): Gender | null {
  const v = raw.trim().toUpperCase();
  if (v.startsWith("FEM")) return "FEMININO";
  if (v.startsWith("MAS")) return "MASCULINO";
  if (v.startsWith("UNI")) return "UNISSEX";
  return null;
}

/** Constrói o cláusula WHERE compartilhada por getFilteredProducts/countFilteredProducts */
function buildProductWhere(
  filters: ProductFilters,
): Record<string, unknown> {
  const { collection, category, genero, search, minPrice, maxPrice } = filters;
  const whereConditions: Array<Record<string, unknown>> = [
    // Catálogo público nunca mostra DISCONTINUED.
    { status: { not: "DISCONTINUED" as ProductStatus } },
  ];

  if (collection) whereConditions.push({ collection });

  if (category) {
    whereConditions.push({ category: { equals: category, mode: "insensitive" } });
  }

  // Gênero é enum — combina com category via AND (ex.: perfumes femininos).
  if (genero) {
    const g = normalizeGender(genero);
    if (g) whereConditions.push({ gender: g });
  }

  if (search && search.trim()) {
    const q = search.trim();
    whereConditions.push({
      OR: [
        { name: { contains: q, mode: "insensitive" } },
        { shortDescription: { contains: q, mode: "insensitive" } },
        { description: { contains: q, mode: "insensitive" } },
        { collection: { contains: q, mode: "insensitive" } },
      ],
    });
  }

  if (typeof minPrice === "number" && minPrice > 0) {
    whereConditions.push({ price: { gte: minPrice } });
  }

  if (typeof maxPrice === "number" && maxPrice > 0) {
    whereConditions.push({ price: { lte: maxPrice } });
  }

  return { AND: whereConditions };
}

/**
 * Busca produtos com filtros e ordenação flexíveis.
 * Usado pela PLP (`/allProducts`) e busca do header.
 *
 * Esgotados são empurrados para o final independente do `sort` escolhido.
 */
export async function getFilteredProducts(
  filters: ProductFilters = {},
): Promise<Product[]> {
  const { sort = "best-seller", limit } = filters;
  const where = buildProductWhere(filters);
  const sortConfig = SORT_MAP[sort] ?? SORT_MAP["best-seller"];

  const rows = await prisma.product.findMany({
    select: PRODUCT_SELECT,
    where,
    orderBy: { [sortConfig.field]: sortConfig.dir },
    ...(limit ? { take: limit } : {}),
  });
  return sortInStockFirst(rows.map(serializeProduct));
}

/** Total de produtos que casam com os filtros, sem paginação. */
export async function countFilteredProducts(
  filters: ProductFilters = {},
): Promise<number> {
  const where = buildProductWhere(filters);
  return prisma.product.count({ where });
}
