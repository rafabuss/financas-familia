-- ==============================================================================
-- FASE 6.2: CARTEIRA DE ATIVOS & RENDA VARIÁVEL (AÇÕES, FIIS, CRIPTO E TESOURO)
-- ==============================================================================
-- Execute este script no "SQL Editor" do painel do Supabase.
-- Ele cria a tabela portfolio_assets (carteira de investimentos), vincula à família
-- ativa e configura Row Level Security (RLS) para sincronização multi-dispositivo.
-- ==============================================================================

-- 1. Criar a tabela portfolio_assets
CREATE TABLE IF NOT EXISTS public.portfolio_assets (
  id TEXT PRIMARY KEY,
  household_id UUID REFERENCES public.households(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  ticker TEXT NOT NULL,
  asset_type TEXT NOT NULL DEFAULT 'STOCK', -- 'CRYPTO', 'STOCK', 'FII', 'TREASURY', 'FIXED_INCOME'
  institution TEXT NOT NULL DEFAULT '',
  quantity NUMERIC NOT NULL DEFAULT 0,
  average_price_cents BIGINT NOT NULL DEFAULT 0,
  current_price_cents BIGINT NOT NULL DEFAULT 0,
  notes TEXT,
  owner_id TEXT NOT NULL DEFAULT 'user-all',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Garantir colunas caso a tabela já exista
ALTER TABLE public.portfolio_assets ADD COLUMN IF NOT EXISTS household_id UUID REFERENCES public.households(id) ON DELETE CASCADE;
ALTER TABLE public.portfolio_assets ADD COLUMN IF NOT EXISTS name TEXT NOT NULL DEFAULT '';
ALTER TABLE public.portfolio_assets ADD COLUMN IF NOT EXISTS ticker TEXT NOT NULL DEFAULT '';
ALTER TABLE public.portfolio_assets ADD COLUMN IF NOT EXISTS asset_type TEXT NOT NULL DEFAULT 'STOCK';
ALTER TABLE public.portfolio_assets ADD COLUMN IF NOT EXISTS institution TEXT NOT NULL DEFAULT '';
ALTER TABLE public.portfolio_assets ADD COLUMN IF NOT EXISTS quantity NUMERIC NOT NULL DEFAULT 0;
ALTER TABLE public.portfolio_assets ADD COLUMN IF NOT EXISTS average_price_cents BIGINT NOT NULL DEFAULT 0;
ALTER TABLE public.portfolio_assets ADD COLUMN IF NOT EXISTS current_price_cents BIGINT NOT NULL DEFAULT 0;
ALTER TABLE public.portfolio_assets ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE public.portfolio_assets ADD COLUMN IF NOT EXISTS owner_id TEXT NOT NULL DEFAULT 'user-all';
ALTER TABLE public.portfolio_assets ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.portfolio_assets ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 3. Índices de performance
CREATE INDEX IF NOT EXISTS idx_portfolio_assets_household ON public.portfolio_assets(household_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_assets_type ON public.portfolio_assets(asset_type);
CREATE INDEX IF NOT EXISTS idx_portfolio_assets_owner ON public.portfolio_assets(owner_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_assets_ticker ON public.portfolio_assets(ticker);

-- 4. Habilitar RLS (Row Level Security) na tabela portfolio_assets
ALTER TABLE public.portfolio_assets ENABLE ROW LEVEL SECURITY;

-- Política de RLS para autenticados
DROP POLICY IF EXISTS "Permitir acesso completo aos ativos de carteira para autenticados" ON public.portfolio_assets;
CREATE POLICY "Permitir acesso completo aos ativos de carteira para autenticados"
  ON public.portfolio_assets FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 5. Trigger para preenchimento automático do household_id (se a função existir)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc WHERE proname = 'set_default_household_id'
  ) THEN
    DROP TRIGGER IF EXISTS trg_portfolio_assets_household ON public.portfolio_assets;
    CREATE TRIGGER trg_portfolio_assets_household
      BEFORE INSERT ON public.portfolio_assets
      FOR EACH ROW EXECUTE FUNCTION public.set_default_household_id();
  END IF;
END $$;

-- 6. Vincular registros existentes à Família Principal se household_id estiver NULL
UPDATE public.portfolio_assets
SET household_id = '00000000-0000-0000-0000-000000000001'
WHERE household_id IS NULL;
