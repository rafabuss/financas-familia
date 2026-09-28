-- ==============================================================================
-- FASE 7: GESTÃO DA FAMÍLIA & CONTROLE GRANULAR DE PERMISSÕES E VISIBILIDADE
-- ==============================================================================
-- Execute este script no "SQL Editor" do painel Supabase.
-- Atualiza a tabela public.household_members com suporte a suspensão temporária
-- e matriz granular de visibilidade de entidades e contas bancárias.
-- ==============================================================================

-- 1. Permitir status 'suspended' na restrição de verificação de status
ALTER TABLE public.household_members DROP CONSTRAINT IF EXISTS household_members_status_check;
ALTER TABLE public.household_members ADD CONSTRAINT household_members_status_check 
  CHECK (status IN ('active', 'suspended', 'pending', 'rejected'));

-- 2. Adicionar novas colunas de controle e permissões se não existirem
ALTER TABLE public.household_members ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.household_members ADD COLUMN IF NOT EXISTS visible_entities JSONB DEFAULT '["family-shared", "user-all"]'::jsonb;
ALTER TABLE public.household_members ADD COLUMN IF NOT EXISTS hidden_account_ids JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.household_members ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 3. Preencher email a partir de profiles para membros existentes caso esteja em branco
UPDATE public.household_members hm
SET email = p.email
FROM public.profiles p
WHERE hm.user_id = p.id AND (hm.email IS NULL OR hm.email = '');

-- 4. Atualizar valores padrão de visible_entities para membros existentes caso nulo
UPDATE public.household_members
SET visible_entities = '["family-shared", "user-all", "user-1", "user-2"]'::jsonb
WHERE visible_entities IS NULL;

-- 5. Atualizar valores padrão de hidden_account_ids para membros existentes caso nulo
UPDATE public.household_members
SET hidden_account_ids = '[]'::jsonb
WHERE hidden_account_ids IS NULL;

-- 6. Atualizar função RLS current_user_household_ids() para garantir bloqueio estrito de membros suspensos
CREATE OR REPLACE FUNCTION public.current_user_household_ids()
RETURNS UUID[]
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public, auth
AS $$
  SELECT COALESCE(array_agg(hm.household_id), ARRAY[]::uuid[])
  FROM public.household_members hm 
  WHERE hm.user_id = auth.uid()
    AND hm.status = 'active';
$$;
