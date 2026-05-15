/**
 * Funções de acesso ao banco via Prisma — substitui src/api/products.ts hardcoded.
 * Chamadas sempre em Server Components ou Route Handlers — nunca no cliente.
 *
 * IMPORTANTE: todos os campos Decimal do Prisma são serializados para `number`
 * antes do retorno. Decimals são objetos não-serializáveis e não podem cruzar
 * a fronteira Server → Client Component no Next.js 16 / React 19.
 */

import { prisma } from "@/lib/prisma";

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
  totalSold: number;
  seasonalSold: number;
  stock?: number;
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
  totalSold: number;
  seasonalSold: number;
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
  totalSold: true,
  seasonalSold: true,
  createdAt: true,
  updatedAt: true,
} as const;

// ─── QUERIES ─────────────────────────────────────────────────────────────────

export async function getAllProducts(): Promise<Product[]> {
  const rows = await prisma.product.findMany({
    select: PRODUCT_SELECT,
    orderBy: { createdAt: "desc" },
  });
  return rows.map(serializeProduct);
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
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
    where: { collection },
    orderBy: { totalSold: "desc" },
  });
  return rows.map(serializeProduct);
}

export async function getFeaturedProducts(limit = 6): Promise<Product[]> {
  const rows = await prisma.product.findMany({
    select: PRODUCT_SELECT,
    orderBy: { totalSold: "desc" },
    take: limit,
  });
  return rows.map(serializeProduct);
}

/** Retorna produtos com originalPrice (promoções) enriquecidos com dados de promo */
export async function getSalesProducts(): Promise<SalesProduct[]> {
  const rows = await prisma.product.findMany({
    select: PRODUCT_SELECT,
    where: { originalPrice: { not: null } },
    orderBy: { seasonalSold: "desc" },
    take: 3,
  });

  return rows.map((p, i) => {
    const serialized = serializeProduct(p);
    return {
      ...serialized,
      priceNum: serialized.price,
      ...PROMO_CONFIG[i % PROMO_CONFIG.length],
    };
  });
}

export async function getBestsellers(limit = 5): Promise<Product[]> {
  const rows = await prisma.product.findMany({
    select: PRODUCT_SELECT,
    orderBy: { totalSold: "desc" },
    take: limit,
  });
  return rows.map(serializeProduct);
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
  /** filtro por categoria (perfume/cologne/...). Aceita "feminino"/"masculino"/"unissex" → mapeia para gênero futuro */
  category?: string;
  /** filtro pelo "genero" — alias intuitivo para category */
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
 * Busca produtos com filtros e ordenação flexíveis.
 * Usado pela PLP (`/allProducts`) e busca do header.
 */
export async function getFilteredProducts(
  filters: ProductFilters = {},
): Promise<Product[]> {
  const {
    collection,
    category,
    genero,
    search,
    minPrice,
    maxPrice,
    sort = "best-seller",
    limit,
  } = filters;

  // Constrói o WHERE dinamicamente
  const whereConditions: Array<Record<string, unknown>> = [];

  if (collection) {
    whereConditions.push({ collection });
  }

  // genero é tratado como sinônimo de category (aceita ambos)
  const effectiveCategory = category ?? genero;
  if (effectiveCategory) {
    whereConditions.push({ category: { equals: effectiveCategory, mode: "insensitive" } });
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

  const where = whereConditions.length ? { AND: whereConditions } : {};

  const sortConfig = SORT_MAP[sort] ?? SORT_MAP["best-seller"];

  const rows = await prisma.product.findMany({
    select: PRODUCT_SELECT,
    where,
    orderBy: { [sortConfig.field]: sortConfig.dir },
    ...(limit ? { take: limit } : {}),
  });
  return rows.map(serializeProduct);
}
