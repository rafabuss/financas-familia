-- ==============================================================================
-- FASE 6.1: COFRINHOS, CAIXINHAS & RESERVA DE EMERGÊNCIA (LIQUIDEZ E RENDA FIXA)
-- ==============================================================================
-- Execute este script no "SQL Editor" do painel do Supabase.
-- Ele cria a tabela de savings_goals (cofrinhos/caixinhas), vincula à família ativa,
-- adiciona a coluna savings_goal_id na tabela de transações e configura RLS.
-- ==============================================================================

-- 1. Criar a tabela savings_goals (Cofrinhos / Metas de Reserva)
CREATE TABLE IF NOT EXISTS public.savings_goals (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  linked_account_id TEXT REFERENCES public.accounts(id) ON DELETE SET NULL,
  target_cents BIGINT NOT NULL DEFAULT 0,
  current_balance_cents BIGINT NOT NULL DEFAULT 0,
  yield_rate TEXT DEFAULT '100% CDI',
  color TEXT NOT NULL DEFAULT '#10b981',
  icon TEXT NOT NULL DEFAULT 'PiggyBank',
  owner_id TEXT NOT NULL DEFAULT 'user-all',
  household_id UUID REFERENCES public.households(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Garantir colunas caso a tabela já exista
ALTER TABLE public.savings_goals ADD COLUMN IF NOT EXISTS linked_account_id TEXT REFERENCES public.accounts(id) ON DELETE SET NULL;
ALTER TABLE public.savings_goals ADD COLUMN IF NOT EXISTS target_cents BIGINT NOT NULL DEFAULT 0;
ALTER TABLE public.savings_goals ADD COLUMN IF NOT EXISTS current_balance_cents BIGINT NOT NULL DEFAULT 0;
ALTER TABLE public.savings_goals ADD COLUMN IF NOT EXISTS yield_rate TEXT DEFAULT '100% CDI';
ALTER TABLE public.savings_goals ADD COLUMN IF NOT EXISTS color TEXT NOT NULL DEFAULT '#10b981';
ALTER TABLE public.savings_goals ADD COLUMN IF NOT EXISTS icon TEXT NOT NULL DEFAULT 'PiggyBank';
ALTER TABLE public.savings_goals ADD COLUMN IF NOT EXISTS owner_id TEXT NOT NULL DEFAULT 'user-all';
ALTER TABLE public.savings_goals ADD COLUMN IF NOT EXISTS household_id UUID REFERENCES public.households(id) ON DELETE CASCADE;

-- 2. Adicionar coluna savings_goal_id na tabela de transações
ALTER TABLE public.transactions 
  ADD COLUMN IF NOT EXISTS savings_goal_id TEXT REFERENCES public.savings_goals(id) ON DELETE SET NULL;

-- 3. Índices de performance
CREATE INDEX IF NOT EXISTS idx_savings_goals_household ON public.savings_goals(household_id);
CREATE INDEX IF NOT EXISTS idx_savings_goals_linked_account ON public.savings_goals(linked_account_id);
CREATE INDEX IF NOT EXISTS idx_transactions_savings_goal ON public.transactions(savings_goal_id);

-- 4. Habilitar RLS (Row Level Security) na tabela savings_goals
ALTER TABLE public.savings_goals ENABLE ROW LEVEL SECURITY;

-- Política de RLS para autenticados
DROP POLICY IF EXISTS "Permitir acesso completo aos cofrinhos para autenticados" ON public.savings_goals;
CREATE POLICY "Permitir acesso completo aos cofrinhos para autenticados"
  ON public.savings_goals FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 5. Trigger para preenchimento automático do household_id (se a função existir)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc WHERE proname = 'set_default_household_id'
  ) THEN
    DROP TRIGGER IF EXISTS trg_savings_goals_household ON public.savings_goals;
    CREATE TRIGGER trg_savings_goals_household
      BEFORE INSERT ON public.savings_goals
      FOR EACH ROW EXECUTE FUNCTION public.set_default_household_id();
  END IF;
END $$;

-- 6. Vincular registros existentes à Família Principal se household_id estiver NULL
UPDATE public.savings_goals
SET household_id = '00000000-0000-0000-0000-000000000001'
WHERE household_id IS NULL;
