export interface Product {
  id: string;
  slug: string;
  name: string;
  shortDescription: string;
  description: string;
  price: number;
  originalPrice?: number;
  badge?: string;
  badgeVariant?: "default" | "secondary" | "destructive" | "outline";
  rating: number;
  reviews: number;
  images: string[];
  collection: "night" | "day" | "limited";
  features: string[];
}

export const PRODUCTS: Product[] = [
  {
    id: "1",
    slug: "midnight-velvet",
    name: "Midnight Velvet",
    shortDescription: "Uma experiência olfativa envolvente com notas de baunilha e sândalo",
    description: "Midnight Velvet é uma fragrância misteriosa e sofisticada, perfeita para a noite. Com notas de topo de bergamota e pimenta rosa, evoluindo para um coração de jasmim e baunilha, e finalizando com uma base rica de sândalo e patchouli. Uma verdadeira joia da perfumaria.",
    price: 189.90,
    originalPrice: 229.90,
    badge: "Novo",
    badgeVariant: "default",
    rating: 5,
    reviews: 47,
    images: ["/assets/midnight-velvet-1.jpg", "/assets/midnight-velvet-2.jpg", "/assets/midnight-velvet-3.jpg",],
    collection: "night",
    features: ["Longa duração (8-10h)", "Projeção intensa", "Família olfativa: Oriental Baunilha"]
  },
  {
    id: "2",
    slug: "golden-essence",
    name: "Golden Essence",
    shortDescription: "Sofisticação em cada borrifo com acordes florais e amadeirados",
    description: "Golden Essence captura a luz do sol em um frasco. Uma combinação radiante de flores brancas e madeiras nobres. Elegante, atemporal e marcante, é a assinatura perfeita para quem busca distinção e classe.",
    price: 249.90,
    badge: "Bestseller",
    badgeVariant: "secondary",
    rating: 5,
    reviews: 89,
    images: ["/assets/golden-essence-1.jpg", "/assets/golden-essence-2.jpg"],
    collection: "day",
    features: ["Versátil dia/noite", "Toque aveludado", "Família olfativa: Floral Amadeirado"]
  },
  {
    id: "3",
    slug: "rare-bloom",
    name: "Rare Bloom",
    shortDescription: "Edição exclusiva com essências raras e ingredientes premium",
    description: "Uma edição limitada criada com os ingredientes mais raros do mundo. Rare Bloom traz a exclusividade da Rosa de Grasse combinada com o Oud mais puro. Uma fragrância para colecionadores e amantes da alta perfumaria.",
    price: 349.90,
    badge: "Limitado",
    badgeVariant: "destructive",
    rating: 5,
    reviews: 23,
    images: ["/assets/rare-bloom-1.jpg"],
    collection: "limited",
    features: ["Ingredientes raros", "Edição numerada", "Família olfativa: Floral Oriental"]
  },
  {
    id: "4",
    slug: "ocean-breeze",
    name: "Ocean Breeze",
    shortDescription: "Frescor marinho com notas cítricas revigorantes",
    description: "Sinta a brisa do mar com Ocean Breeze. Uma fragrância leve e energizante que combina notas aquáticas com limão siciliano e cedro. Ideal para os dias quentes de verão.",
    price: 159.90,
    rating: 4,
    reviews: 32,
    images: ["/assets/ocean-breeze-1.jpg"],
    collection: "day",
    features: ["Frescor imediato", "Ideal para o calor", "Família olfativa: Aquático Cítrico"]
  },
  {
    id: "5",
    slug: "noir-intense",
    name: "Noir Intense",
    shortDescription: "Poder e sedução em uma fragrância marcante",
    description: "Noir Intense é para quem não tem medo de ousar. Couro, tabaco e especiarias se unem em uma dança olfativa inesquecível. Uma fragrância que deixa rastro e marca presença.",
    price: 289.90,
    rating: 5,
    reviews: 56,
    images: ["/assets/noir-intense-1.jpg"],
    collection: "night",
    features: ["Alta fixação", "Notas de couro", "Família olfativa: Couro Especiado"]
  },
];
