// scripts/update-product-images.ts
// Atualiza as imagens de TODOS os produtos do banco para o POOL abaixo
// (imagens do carrossel hero1–6 + as novas de inspiração), ciclando por índice.
// Remove as antigas (Perf*/sale*). O carrossel (hero.tsx) é independente e
// permanece intacto. Roda com: pnpm exec tsx scripts/update-product-images.ts
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

// Mantém em sincronia com PRODUCT_IMAGE_POOL em prisma/seed.ts
const POOL = [
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
  const products = await prisma.product.findMany({
    select: { id: true, name: true },
    orderBy: { createdAt: 'asc' },
  })

  let i = 0
  for (const product of products) {
    const image = POOL[i % POOL.length]
    await prisma.product.update({
      where: { id: product.id },
      data: { images: [image] },
    })
    console.log(`✓ ${product.name} → ${image}`)
    i++
  }

  console.log(`\nAtualizados ${products.length} produtos com imagens do POOL.`)
}

main()
  .then(async () => {
    await pool.end()
  })
  .catch(async (err) => {
    console.error(err)
    await pool.end()
    process.exit(1)
  })
