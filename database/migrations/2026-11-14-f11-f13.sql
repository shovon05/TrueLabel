-- F11/F13 schema for PostgreSQL (TrueLabel).
-- Review this migration with the team before running it on any shared database.
-- Do not run against production as part of the GitHub pull request.

BEGIN;

CREATE TABLE IF NOT EXISTS public.food_reviews (
  id SERIAL PRIMARY KEY,
  "productId" INTEGER NOT NULL REFERENCES public.food_products(id) ON DELETE CASCADE,
  "userId" INTEGER NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  title VARCHAR(120) NOT NULL DEFAULT '',
  comment TEXT NOT NULL,
  "manufacturerReply" TEXT NULL,
  "repliedAt" VARCHAR(40) NULL,
  "createdAt" TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
  CONSTRAINT "UQ_food_reviews_product_user" UNIQUE ("productId", "userId")
);

CREATE TABLE IF NOT EXISTS public.food_reports (
  id SERIAL PRIMARY KEY,
  "productId" INTEGER NOT NULL REFERENCES public.food_products(id) ON DELETE CASCADE,
  "userId" INTEGER NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  category VARCHAR(20) NOT NULL,
  description TEXT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  "createdAt" TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "IDX_food_reviews_product" ON public.food_reviews ("productId");
CREATE INDEX IF NOT EXISTS "IDX_food_reports_user" ON public.food_reports ("userId");
CREATE INDEX IF NOT EXISTS "IDX_food_reports_status" ON public.food_reports (status);

COMMIT;
