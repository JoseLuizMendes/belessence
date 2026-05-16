-- Migration incremental: status do produto + janela de promoção + flags
-- ─────────────────────────────────────────────────────────────────────
-- Adiciona enum ProductStatus e 5 colunas no model Product.
-- Idempotente: usa IF NOT EXISTS para poder ser reaplicada com segurança.

-- 1) Enum (cria só se não existir)
DO $$ BEGIN
  CREATE TYPE "ProductStatus" AS ENUM ('NORMAL', 'PROMOTION', 'COMING_SOON', 'DISCONTINUED');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- 2) Colunas novas no products
ALTER TABLE "products"
  ADD COLUMN IF NOT EXISTS "status" "ProductStatus" NOT NULL DEFAULT 'NORMAL',
  ADD COLUMN IF NOT EXISTS "isLimitedEdition" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "markedAsNewUntil" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "promotionStartsAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "promotionEndsAt" TIMESTAMP(3);
