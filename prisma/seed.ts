// prisma/seed.ts
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'
import { Pool } from 'pg'
import 'dotenv/config'

const connectionString = process.env.DATABASE_URL
if (!connectionString) {
  throw new Error('DATABASE_URL não definido no .env')
}

const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

// Datas auxiliares para as promoções demonstrativas
const NOW = new Date()
const SEVEN_DAYS_FROM_NOW = new Date(NOW.getTime() + 7 * 24 * 60 * 60 * 1000)
const THIRTY_DAYS_FROM_NOW = new Date(NOW.getTime() + 30 * 24 * 60 * 60 * 1000)

// Copiamos os dados do seu products.ts para cá
const PRODUCTS = [
  {
    id: "1",
    slug: "midnight-velvet",
    name: "Midnight Velvet",
    shortDescription: "Uma experiência olfativa envolvente com notas de baunilha e sândalo",
    description: "Midnight Velvet é uma fragrância misteriosa e sofisticada, perfeita para a noite. Com notas de topo de bergamota e pimenta rosa, evoluindo para um coração de jasmim e baunilha, e finalizando com uma base rica de sândalo e patchouli. Uma verdadeira joia da perfumaria.",
    price: 229.9,
    originalPrice: null,
    badge: "Novo",
    badgeVariant: "default",
    rating: 5,
    reviews: 47,
    images: ["/assets/Perf1.jpg"],
    collection: "night",
    features: ["Longa duração (8-10h)", "Projeção intensa", "Família olfativa: Oriental Baunilha"],
    category: "perfume",
    gender: "UNISSEX" as const,
    totalSold: 120,
    seasonalSold: 45,
    stock: 48,
    status: "NORMAL" as const,
    isLimitedEdition: false,
    markedAsNewUntil: THIRTY_DAYS_FROM_NOW,
    promotionStartsAt: null,
    promotionEndsAt: null,
  },
  {
    id: "2",
    slug: "golden-essence",
    name: "Golden Essence",
    shortDescription: "Sofisticação em cada borrifo com acordes florais e amadeirados",
    description: "Golden Essence captura a luz do sol em um frasco. Uma combinação radiante de flores brancas e madeiras nobres. Elegante, atemporal e marcante, é a assinatura perfeita para quem busca distinção e classe.",
    price: 249.9,
    badge: "Bestseller",
    badgeVariant: "secondary",
    rating: 5,
    reviews: 89,
    images: ["/assets/Perf2.jpg"],
    collection: "day",
    features: ["Versátil dia/noite", "Toque aveludado", "Família olfativa: Floral Amadeirado"],
    category: "perfume",
    gender: "FEMININO" as const,
    totalSold: 450,
    seasonalSold: 120,
    stock: 85,
    status: "NORMAL" as const,
    isLimitedEdition: false,
    markedAsNewUntil: null,
    promotionStartsAt: null,
    promotionEndsAt: null,
  },
  {
    id: "3",
    slug: "rare-bloom",
    name: "Rare Bloom",
    shortDescription: "Edição exclusiva com essências raras e ingredientes premium",
    description: "Uma edição limitada criada com os ingredientes mais raros do mundo. Rare Bloom traz a exclusividade da Rosa de Grasse combinada com o Oud mais puro. Uma fragrância para colecionadores e amantes da alta perfumaria.",
    price: 349.9,
    badge: "Limitado",
    badgeVariant: "destructive",
    rating: 5,
    reviews: 23,
    images: ["/assets/Perf3.jpg"],
    collection: "limited",
    features: ["Ingredientes raros", "Edição numerada", "Família olfativa: Floral Oriental"],
    category: "perfume",
    gender: "FEMININO" as const,
    totalSold: 50,
    seasonalSold: 15,
    stock: 12,
    status: "NORMAL" as const,
    isLimitedEdition: true,
    markedAsNewUntil: null,
    promotionStartsAt: null,
    promotionEndsAt: null,
  },
  {
    id: "4",
    slug: "ocean-breeze",
    name: "Ocean Breeze",
    shortDescription: "Frescor marinho com notas cítricas revigorantes",
    description: "Sinta a brisa do mar com Ocean Breeze. Uma fragrância leve e energizante que combina notas aquáticas com limão siciliano e cedro. Ideal para os dias quentes de verão.",
    price: 159.9,
    rating: 4,
    reviews: 32,
    images: ["/assets/Perf4.jpg"],
    collection: "day",
    features: ["Frescor imediato", "Ideal para o calor", "Família olfativa: Aquático Cítrico"],
    category: "cologne",
    gender: "MASCULINO" as const,
    totalSold: 80,
    seasonalSold: 60,
    stock: 34,
    status: "NORMAL" as const,
    isLimitedEdition: false,
    markedAsNewUntil: null,
    promotionStartsAt: null,
    promotionEndsAt: null,
  },
  {
    id: "5",
    slug: "noir-intense",
    name: "Noir Intense",
    shortDescription: "Poder e sedução em uma fragrância marcante",
    description: "Noir Intense é para quem não tem medo de ousar. Couro, tabaco e especiarias se unem em uma dança olfativa inesquecível. Uma fragrância que deixa rastro e marca presença.",
    price: 289.9,
    rating: 5,
    reviews: 56,
    images: ["/assets/Perf5.jpg"],
    collection: "night",
    features: ["Alta fixação", "Notas de couro", "Família olfativa: Couro Especiado"],
    category: "perfume",
    gender: "MASCULINO" as const,
    totalSold: 210,
    seasonalSold: 75,
    stock: 60,
    status: "NORMAL" as const,
    isLimitedEdition: false,
    markedAsNewUntil: null,
    promotionStartsAt: null,
    promotionEndsAt: null,
  },
  {
    id: "6",
    slug: "royal-amber",
    name: "Royal Amber",
    shortDescription: "A majestade do âmbar em uma composição luxuosa",
    description: "Royal Amber é uma homenagem à realeza. Uma fragrância quente, envolvente e profundamente luxuosa. Notas de âmbar, especiarias douradas e um toque de mel criam uma aura de poder e sofisticação.",
    price: 319.9,
    badge: "Exclusivo",
    badgeVariant: "outline",
    rating: 5,
    reviews: 18,
    images: ["/assets/Perf6.jpg"],
    collection: "limited",
    features: ["Luxo extremo", "Notas quentes", "Família olfativa: Oriental Ambarado"],
    category: "perfume",
    gender: "UNISSEX" as const,
    totalSold: 30,
    seasonalSold: 10,
    stock: 8,
    status: "NORMAL" as const,
    isLimitedEdition: true,
    markedAsNewUntil: null,
    promotionStartsAt: null,
    promotionEndsAt: null,
  },
  {
    id: "7",
    slug: "aurora-boreal",
    name: "Aurora Boreal",
    shortDescription: "O brilho magnético do norte em uma fragrância vibrante",
    description: "Aurora Boreal é uma celebração de luzes e cores. Notas cítricas efervescentes encontram o calor do âmbar e a sensualidade do almíscar branco. Uma fragrância que desperta os sentidos e ilumina quem a usa.",
    price: 199.9,
    originalPrice: 259.9,
    badge: "Oferta",
    badgeVariant: "destructive",
    rating: 5,
    reviews: 62,
    images: ["/assets/sale/sale-1.png"],
    collection: "limited",
    features: ["Edição Especial", "Notas luminosas", "Família olfativa: Cítrico Ambarado"],
    category: "perfume",
    gender: "UNISSEX" as const,
    totalSold: 500,
    seasonalSold: 150,
    stock: 95,
    status: "PROMOTION" as const,
    isLimitedEdition: false,
    markedAsNewUntil: null,
    promotionStartsAt: NOW,
    promotionEndsAt: SEVEN_DAYS_FROM_NOW,
  },
  {
    id: "8",
    slug: "jardim-secreto",
    name: "Jardim Secreto",
    shortDescription: "Um refúgio floral escondido entre notas verdes e frescas",
    description: "Descubra o mistério de um jardim proibido. Jardim Secreto combina a delicadeza da peônia e do lírio do vale com o frescor do orvalho da manhã. Romântico, etéreo e absolutamente encantador.",
    price: 179.9,
    originalPrice: 219.9,
    badge: "Desconto",
    badgeVariant: "secondary",
    rating: 4.8,
    reviews: 45,
    images: ["/assets/sale/sale-2.png"],
    collection: "day",
    features: ["Floral fresco", "Romântico", "Família olfativa: Floral Verde"],
    category: "cologne",
    gender: "FEMININO" as const,
    totalSold: 320,
    seasonalSold: 90,
    stock: 72,
    status: "PROMOTION" as const,
    isLimitedEdition: false,
    markedAsNewUntil: null,
    promotionStartsAt: NOW,
    promotionEndsAt: SEVEN_DAYS_FROM_NOW,
  },
  {
    id: "9",
    slug: "elixir-noturno",
    name: "Elixir Noturno",
    shortDescription: "A sedução da noite capturada em uma essência profunda",
    description: "Elixir Noturno é puro mistério e sedução. A riqueza do cacau e da fava tonka se mistura com a profundidade do patchouli e um toque de pimenta preta. Perfeito para noites inesquecíveis.",
    price: 219.9,
    originalPrice: 289.9,
    badge: "Imperdível",
    badgeVariant: "default",
    rating: 4.9,
    reviews: 78,
    images: ["/assets/sale/sale-3.png"],
    collection: "night",
    features: ["Intenso", "Sedução pura", "Família olfativa: Oriental Gourmand"],
    category: "perfume",
    gender: "MASCULINO" as const,
    totalSold: 280,
    seasonalSold: 110,
    stock: 55,
    status: "PROMOTION" as const,
    isLimitedEdition: false,
    markedAsNewUntil: null,
    promotionStartsAt: NOW,
    promotionEndsAt: SEVEN_DAYS_FROM_NOW,
  },
]

// ─── CUPONS ───────────────────────────────────────────────────────────────────

const COUPONS = [
  {
    code: 'BELES10',
    type: 'PERCENTAGE' as const,
    value: 10,
    minOrder: null,
    maxUses: null,
    active: true,
  },
  {
    code: 'FRETE15',
    type: 'FIXED' as const,
    value: 15,
    minOrder: 100,
    maxUses: null,
    active: true,
  },
  {
    code: 'PRIMEIRA20',
    type: 'PERCENTAGE' as const,
    value: 20,
    minOrder: 250,
    maxUses: 100,
    active: true,
  },
]

// Pool de imagens dos produtos: imagens do carrossel (hero1–6) + as novas
// (inspiração). Ciclado por índice; remove as antigas (Perf*/sale*).
const PRODUCT_IMAGE_POOL = [
  '/assets/hero1.png',
  '/assets/hero2.png',
  '/assets/hero3.png',
  '/assets/hero4.png',
  '/assets/hero5.png',
  '/assets/hero6.png',
  '/assets/inspiration/amber-dropper-bottles.png',
  '/assets/inspiration/serum-bottles-1.png',
  '/assets/inspiration/spray-bottles.png',
  '/assets/inspiration/cream-jars-colored.png',
  '/assets/inspiration/tube-bottles.png',
  '/assets/inspiration/jars-wooden-lid.png',
]

async function main() {
  console.log('🌱 Iniciando o seed...')

  // Limpa o banco antes de popular (opcional, mas bom para testes)
  // await prisma.product.deleteMany()

  for (const [index, product] of PRODUCTS.entries()) {
    const productImages = [PRODUCT_IMAGE_POOL[index % PRODUCT_IMAGE_POOL.length]]
    // Upsert: Se existir (pelo slug), atualiza. Se não, cria.
    const result = await prisma.product.upsert({
      where: { slug: product.slug },
      update: {
        // Campos que queremos atualizar se rodarmos o seed de novo
        name: product.name,
        shortDescription: product.shortDescription,
        description: product.description,
        price: product.price,
        originalPrice: product.originalPrice,
        badge: product.badge,
        badgeVariant: product.badgeVariant,
        rating: product.rating,
        reviews: product.reviews,
        images: productImages,
        collection: product.collection,
        features: product.features,
        category: product.category,
        gender: product.gender,
        totalSold: product.totalSold,
        seasonalSold: product.seasonalSold,
        stock: product.stock,
        status: product.status,
        isLimitedEdition: product.isLimitedEdition,
        markedAsNewUntil: product.markedAsNewUntil,
        promotionStartsAt: product.promotionStartsAt,
        promotionEndsAt: product.promotionEndsAt,
      },
      create: {
        id: product.id, // Forçando o ID para manter compatibilidade com sua api.ts
        slug: product.slug,
        name: product.name,
        shortDescription: product.shortDescription,
        description: product.description,
        price: product.price,
        originalPrice: product.originalPrice,
        badge: product.badge,
        badgeVariant: product.badgeVariant,
        rating: product.rating,
        reviews: product.reviews,
        images: productImages,
        collection: product.collection,
        features: product.features,
        category: product.category,
        gender: product.gender,
        totalSold: product.totalSold,
        seasonalSold: product.seasonalSold,
        stock: product.stock,
        status: product.status,
        isLimitedEdition: product.isLimitedEdition,
        markedAsNewUntil: product.markedAsNewUntil,
        promotionStartsAt: product.promotionStartsAt,
        promotionEndsAt: product.promotionEndsAt,
      },
    })
    console.log(`Created/Updated product: ${result.name}`)
  }

  // ─── Seed dos Cupons ────────────────────────────────────────────────────────
  console.log('\n🎟️  Seedando cupons...')
  for (const coupon of COUPONS) {
    const result = await prisma.coupon.upsert({
      where: { code: coupon.code },
      update: {
        type: coupon.type,
        value: coupon.value,
        minOrder: coupon.minOrder,
        maxUses: coupon.maxUses,
        active: coupon.active,
      },
      create: coupon,
    })
    console.log(`Created/Updated coupon: ${result.code} (${result.type} ${result.value}${result.type === 'PERCENTAGE' ? '%' : ''})`)
  }

  console.log('\n✅ Seed finalizado com sucesso!')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })