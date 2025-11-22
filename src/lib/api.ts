import { PRODUCTS, SALES, Product } from "./products";

// Combine all products for searching/filtering
const ALL_PRODUCTS = [...PRODUCTS, ...SALES];

export interface SalesProduct extends Product {
  promoTitle?: string;
  promoText?: string;
  promoGradient?: string;
  iconName?: string;
}

/**
 * Simulates a database query to fetch products by IDs.
 */
export async function getProductsByIds(ids: string[]): Promise<Product[]> {
  // Simulate network delay
  // await new Promise((resolve) => setTimeout(resolve, 50));
  return ALL_PRODUCTS.filter((p) => ids.includes(p.id));
}

/**
 * Simulates fetching products by category.
 */
export async function getProductsByCategory(category: string): Promise<Product[]> {
  return ALL_PRODUCTS.filter((p) => p.category === category);
}

/**
 * Simulates fetching bestsellers based on total or seasonal sales.
 */
export async function getBestsellers(
  period: "total" | "seasonal" = "total",
  limit: number = 5,
  category?: string
): Promise<Product[]> {
  let filtered = ALL_PRODUCTS;
  
  if (category) {
    filtered = filtered.filter(p => p.category === category);
  }

  return filtered
    .sort((a, b) => {
      const salesA = period === "total" ? a.totalSold : a.seasonalSold;
      const salesB = period === "total" ? b.totalSold : b.seasonalSold;
      return salesB - salesA;
    })
    .slice(0, limit);
}

/**
 * Simulates fetching a single product by slug.
 */
export async function getProductBySlug(slug: string): Promise<Product | undefined> {
  return ALL_PRODUCTS.find((p) => p.slug === slug);
}

/**
 * Helper to get specific sales products with promo data.
 * In a real app, this might join a 'Promotions' table.
 */
export async function getSalesDisplayData(saleIds: string[]): Promise<SalesProduct[]> {
  const products = await getProductsByIds(saleIds);
  
  // We map the additional promo data here, which in a real DB might come from a join
  // or a separate config object passed from the CMS.
  return products.map(product => {
    let promoData = {};
    // Hardcoded logic for demo purposes, simulating CMS data injection
    if (product.id === "sale-1") {
      promoData = {
        promoTitle: "Oferta da Madrugada",
        promoText: "20% OFF na segunda unidade",
        promoGradient: "from-indigo-400 via-purple-400 to-pink-400",
        iconName: "Timer"
      };
    } else if (product.id === "sale-2") {
      promoData = {
        promoTitle: "Exclusividade",
        promoText: "Brinde especial na compra",
        promoGradient: "from-rose-400 via-red-400 to-orange-400",
        iconName: "Sparkles"
      };
    } else if (product.id === "sale-3") {
      promoData = {
        promoTitle: "Últimas Unidades",
        promoText: "Preço especial de lançamento",
        promoGradient: "from-amber-400 via-yellow-400 to-orange-400",
        iconName: "Tag"
      };
    }
    
    return {
      ...product,
      ...promoData
    };
  });
}
