-- PostgreSQL migration to support budget timeframes and tracking ranges.
ALTER TABLE IF EXISTS public.budgets
  ADD COLUMN IF NOT EXISTS category VARCHAR(100),
  ADD COLUMN IF NOT EXISTS timeframe VARCHAR(20),
  ADD COLUMN IF NOT EXISTS start_date DATE,
  ADD COLUMN IF NOT EXISTS end_date DATE;

UPDATE public.budgets b
SET category = c.name
FROM public.categories c
WHERE b.category IS NULL
  AND b.category_id = c.id;

UPDATE public.budgets
SET timeframe = 'monthly'
WHERE timeframe IS NULL;

UPDATE public.budgets
SET start_date = COALESCE(start_date, date_trunc('month', COALESCE(month, CURRENT_DATE))::date),
    end_date = COALESCE(end_date, (date_trunc('month', COALESCE(month, CURRENT_DATE)) + INTERVAL '1 month - 1 day')::date);

ALTER TABLE public.budgets
  ALTER COLUMN category SET NOT NULL,
  ALTER COLUMN timeframe SET NOT NULL,
  ALTER COLUMN start_date SET NOT NULL,
  ALTER COLUMN end_date SET NOT NULL;

ALTER TABLE public.budgets
  DROP CONSTRAINT IF EXISTS budgets_category_id_fkey;

ALTER TABLE public.budgets
  DROP COLUMN IF EXISTS category_id,
  DROP COLUMN IF EXISTS month;

ALTER TABLE public.budgets
  DROP CONSTRAINT IF EXISTS budgets_limit_amount_check;

ALTER TABLE public.budgets
  ADD CONSTRAINT budgets_limit_amount_check CHECK (limit_amount > 0);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_indexes
    WHERE schemaname = 'public' AND indexname = 'uq_budgets_user_category_period'
  ) THEN
    CREATE UNIQUE INDEX uq_budgets_user_category_period
      ON public.budgets (user_id, LOWER(category), timeframe, start_date, end_date);
  END IF;
END $$;
