-- ==============================================================================
-- FASE 4 — PASSO 1 DE 2: ESTRUTURA E COLUNAS (DDL)
-- ==============================================================================
-- Execute este script PRIMEIRO no "SQL Editor" do Supabase.
-- Ele cria as tabelas de Multi-Tenancy e adiciona as novas colunas necessárias.
-- Tempo estimado de execução: ~1 segundo.
-- ==============================================================================

-- 1. Criação das Tabelas de Multi-Tenancy
CREATE TABLE IF NOT EXISTS public.households (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  invite_code TEXT UNIQUE DEFAULT substring(md5(random()::text) from 1 for 8),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.households ADD COLUMN IF NOT EXISTS invite_code TEXT UNIQUE DEFAULT substring(md5(random()::text) from 1 for 8);

CREATE TABLE IF NOT EXISTS public.household_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'pending', 'rejected')),
  display_name TEXT NOT NULL,
  color TEXT DEFAULT '#2563eb',
  member_key TEXT DEFAULT 'user-1',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT uq_household_user UNIQUE (household_id, user_id)
);

ALTER TABLE public.household_members ADD COLUMN IF NOT EXISTS household_id UUID REFERENCES public.households(id) ON DELETE CASCADE;
ALTER TABLE public.household_members ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'pending', 'rejected'));

-- 2. Adicionar household_id em todas as tabelas de finanças
ALTER TABLE public.accounts ADD COLUMN IF NOT EXISTS household_id UUID REFERENCES public.households(id) ON DELETE CASCADE;
ALTER TABLE public.cards ADD COLUMN IF NOT EXISTS household_id UUID REFERENCES public.households(id) ON DELETE CASCADE;
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS household_id UUID REFERENCES public.households(id) ON DELETE CASCADE;
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS household_id UUID REFERENCES public.households(id) ON DELETE CASCADE;
ALTER TABLE public.scenarios ADD COLUMN IF NOT EXISTS household_id UUID REFERENCES public.households(id) ON DELETE CASCADE;
ALTER TABLE public.monthly_envelopes ADD COLUMN IF NOT EXISTS household_id UUID REFERENCES public.households(id) ON DELETE CASCADE;

-- 3. Adicionar coluna visibility em transactions (Privacidade / Olho Amigo)
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS visibility TEXT NOT NULL DEFAULT 'FAMILY';
ALTER TABLE public.transactions DROP CONSTRAINT IF EXISTS transactions_visibility_check;
ALTER TABLE public.transactions ADD CONSTRAINT transactions_visibility_check CHECK (visibility IN ('FAMILY', 'PERSONAL_PRIVATE'));
