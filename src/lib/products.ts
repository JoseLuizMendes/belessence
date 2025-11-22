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
  // New fields for analytics and categorization
  category: string;
  totalSold: number;
  seasonalSold: number; // Sales in the last 4 months
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
    images: ["/assets/Perf1.jpg"],
    collection: "night",
    features: ["Longa duração (8-10h)", "Projeção intensa", "Família olfativa: Oriental Baunilha"],
    category: "perfume",
    totalSold: 120,
    seasonalSold: 45
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
    images: ["/assets/Perf2.jpg"],
    collection: "day",
    features: ["Versátil dia/noite", "Toque aveludado", "Família olfativa: Floral Amadeirado"],
    category: "perfume",
    totalSold: 450,
    seasonalSold: 120
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
    images: ["/assets/Perf3.jpg"],
    collection: "limited",
    features: ["Ingredientes raros", "Edição numerada", "Família olfativa: Floral Oriental"],
    category: "perfume",
    totalSold: 50,
    seasonalSold: 15
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
    images: ["/assets/Perf4.jpg"],
    collection: "day",
    features: ["Frescor imediato", "Ideal para o calor", "Família olfativa: Aquático Cítrico"],
    category: "cologne",
    totalSold: 80,
    seasonalSold: 60
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
    images: ["/assets/Perf5.jpg"],
    collection: "night",
    features: ["Alta fixação", "Notas de couro", "Família olfativa: Couro Especiado"],
    category: "perfume",
    totalSold: 210,
    seasonalSold: 75
  },
  {
    id: "6",
    slug: "royal-amber",
    name: "Royal Amber",
    shortDescription: "A majestade do âmbar em uma composição luxuosa",
    description: "Royal Amber é uma homenagem à realeza. Uma fragrância quente, envolvente e profundamente luxuosa. Notas de âmbar, especiarias douradas e um toque de mel criam uma aura de poder e sofisticação.",
    price: 319.90,
    badge: "Exclusivo",
    badgeVariant: "outline",
    rating: 5,
    reviews: 18,
    images: ["/assets/Perf6.jpg"],
    collection: "limited",
    features: ["Luxo extremo", "Notas quentes", "Família olfativa: Oriental Ambarado"],
    category: "perfume",
    totalSold: 30,
    seasonalSold: 10
  },
  {
    id: "7",
    slug: "aurora-boreal",
    name: "Aurora Boreal",
    shortDescription: "O brilho magnético do norte em uma fragrância vibrante",
    description: "Aurora Boreal é uma celebração de luzes e cores. Notas cítricas efervescentes encontram o calor do âmbar e a sensualidade do almíscar branco. Uma fragrância que desperta os sentidos e ilumina quem a usa.",
    price: 199.90,
    originalPrice: 259.90,
    badge: "Oferta",
    badgeVariant: "destructive",
    rating: 5,
    reviews: 62,
    images: ["/assets/sale/sale-1.png"],
    collection: "limited",
    features: ["Edição Especial", "Notas luminosas", "Família olfativa: Cítrico Ambarado"],
    category: "perfume",
    totalSold: 500,
    seasonalSold: 150
  },
  {
    id: "8",
    slug: "jardim-secreto",
    name: "Jardim Secreto",
    shortDescription: "Um refúgio floral escondido entre notas verdes e frescas",
    description: "Descubra o mistério de um jardim proibido. Jardim Secreto combina a delicadeza da peônia e do lírio do vale com o frescor do orvalho da manhã. Romântico, etéreo e absolutamente encantador.",
    price: 179.90,
    originalPrice: 219.90,
    badge: "Desconto",
    badgeVariant: "secondary",
    rating: 4.8,
    reviews: 45,
    images: ["/assets/sale/sale-2.png"],
    collection: "day",
    features: ["Floral fresco", "Romântico", "Família olfativa: Floral Verde"],
    category: "cologne",
    totalSold: 320,
    seasonalSold: 90
  },
  {
    id: "9",
    slug: "elixir-noturno",
    name: "Elixir Noturno",
    shortDescription: "A sedução da noite capturada em uma essência profunda",
    description: "Elixir Noturno é puro mistério e sedução. A riqueza do cacau e da fava tonka se mistura com a profundidade do patchouli e um toque de pimenta preta. Perfeito para noites inesquecíveis.",
    price: 219.90,
    originalPrice: 289.90,
    badge: "Imperdível",
    badgeVariant: "default",
    rating: 4.9,
    reviews: 78,
    images: ["/assets/sale/sale-3.png"],
    collection: "night",
    features: ["Intenso", "Sedução pura", "Família olfativa: Oriental Gourmand"],
    category: "perfume",
    totalSold: 280,
    seasonalSold: 110
  },
];

export const SALES = [
  PRODUCTS[6],
  PRODUCTS[7],
  PRODUCTS[8]
];
