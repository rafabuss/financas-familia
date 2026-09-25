-- ==============================================================================
-- DIAGNÓSTICO E AUTO-CURA DEFINITIVA: MULTI-TENANCY & VISIBILIDADE DE TRANSAÇÕES
-- ==============================================================================
-- Execute este script no "SQL Editor" do painel do Supabase.
-- Ele realiza 4 ações essenciais:
-- 1. Vincula todos os usuários autenticados (ex: rafatones@gmail.com) como membros ativos da Família Principal
-- 2. Resgata e vincula todas as transações, contas e cartões com household_id NULL à Família Principal
-- 3. Cria triggers automáticos para que novos lançamentos nunca fiquem órfãos (sem household_id)
-- 4. Torna as políticas de RLS retrocompatíveis e resilientes
-- ==============================================================================

-- 1. Garantir existência da Família Principal
INSERT INTO public.households (id, name, invite_code)
VALUES ('00000000-0000-0000-0000-000000000001', 'Família Principal', 'FAM-ORIGINAL')
ON CONFLICT (id) DO UPDATE SET name = 'Família Principal';

-- 2. Vincular todos os usuários existentes em auth.users à Família Principal como ativos
INSERT INTO public.household_members (household_id, user_id, role, status, display_name, member_key)
SELECT 
  '00000000-0000-0000-0000-000000000001'::uuid, 
  u.id, 
  'owner',
  'active',
  COALESCE(u.raw_user_meta_data->>'name', split_part(u.email, '@', 1)), 
  COALESCE(u.raw_user_meta_data->>'memberKey', 'user-1')
FROM auth.users u
ON CONFLICT (household_id, user_id) DO UPDATE SET 
  status = 'active',
  role = 'owner';

-- 3. Resgatar TODOS os dados legados com household_id NULL ou órfãos
UPDATE public.accounts 
SET household_id = '00000000-0000-0000-0000-000000000001' 
WHERE household_id IS NULL;

UPDATE public.cards 
SET household_id = '00000000-0000-0000-0000-000000000001' 
WHERE household_id IS NULL;

UPDATE public.categories 
SET household_id = '00000000-0000-0000-0000-000000000001' 
WHERE household_id IS NULL;

UPDATE public.transactions 
SET household_id = '00000000-0000-0000-0000-000000000001' 
WHERE household_id IS NULL;

UPDATE public.scenarios 
SET household_id = '00000000-0000-0000-0000-000000000001' 
WHERE household_id IS NULL;

UPDATE public.monthly_envelopes 
SET household_id = '00000000-0000-0000-0000-000000000001' 
WHERE household_id IS NULL;

-- 4. Função e Trigger para preenchimento automático do household_id nas inserções/atualizações
CREATE OR REPLACE FUNCTION public.set_default_household_id()
RETURNS TRIGGER AS $$
DECLARE
  v_user_household UUID;
BEGIN
  IF NEW.household_id IS NULL THEN
    -- Busca a família ativa da qual o usuário faz parte
    SELECT hm.household_id INTO v_user_household
    FROM public.household_members hm
    WHERE hm.user_id = auth.uid() AND hm.status = 'active'
    ORDER BY hm.created_at ASC
    LIMIT 1;
    
    NEW.household_id := COALESCE(v_user_household, '00000000-0000-0000-0000-000000000001'::uuid);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_set_household_transactions ON public.transactions;
CREATE TRIGGER trg_set_household_transactions
  BEFORE INSERT OR UPDATE ON public.transactions
  FOR EACH ROW EXECUTE FUNCTION public.set_default_household_id();

DROP TRIGGER IF EXISTS trg_set_household_accounts ON public.accounts;
CREATE TRIGGER trg_set_household_accounts
  BEFORE INSERT OR UPDATE ON public.accounts
  FOR EACH ROW EXECUTE FUNCTION public.set_default_household_id();

DROP TRIGGER IF EXISTS trg_set_household_cards ON public.cards;
CREATE TRIGGER trg_set_household_cards
  BEFORE INSERT OR UPDATE ON public.cards
  FOR EACH ROW EXECUTE FUNCTION public.set_default_household_id();

DROP TRIGGER IF EXISTS trg_set_household_categories ON public.categories;
CREATE TRIGGER trg_set_household_categories
  BEFORE INSERT OR UPDATE ON public.categories
  FOR EACH ROW EXECUTE FUNCTION public.set_default_household_id();

DROP TRIGGER IF EXISTS trg_set_household_scenarios ON public.scenarios;
CREATE TRIGGER trg_set_household_scenarios
  BEFORE INSERT OR UPDATE ON public.scenarios
  FOR EACH ROW EXECUTE FUNCTION public.set_default_household_id();

DROP TRIGGER IF EXISTS trg_set_household_monthly_envelopes ON public.monthly_envelopes;
CREATE TRIGGER trg_set_household_monthly_envelopes
  BEFORE INSERT OR UPDATE ON public.monthly_envelopes
  FOR EACH ROW EXECUTE FUNCTION public.set_default_household_id();

-- 5. Atualizar Políticas de RLS com resiliência total para usuários autenticados
DROP POLICY IF EXISTS "Transações isoladas por família" ON public.transactions;
CREATE POLICY "Transações isoladas por família" ON public.transactions 
FOR ALL TO authenticated 
USING (
  household_id = ANY(public.current_user_household_ids()) 
  OR (household_id IS NULL AND auth.uid() IS NOT NULL)
) 
WITH CHECK (
  household_id = ANY(public.current_user_household_ids()) 
  OR (household_id IS NULL AND auth.uid() IS NOT NULL)
);

DROP POLICY IF EXISTS "Contas isoladas por família" ON public.accounts;
CREATE POLICY "Contas isoladas por família" ON public.accounts 
FOR ALL TO authenticated 
USING (
  household_id = ANY(public.current_user_household_ids()) 
  OR (household_id IS NULL AND auth.uid() IS NOT NULL)
) 
WITH CHECK (
  household_id = ANY(public.current_user_household_ids()) 
  OR (household_id IS NULL AND auth.uid() IS NOT NULL)
);

DROP POLICY IF EXISTS "Cartões isolados por família" ON public.cards;
CREATE POLICY "Cartões isolados por família" ON public.cards 
FOR ALL TO authenticated 
USING (
  household_id = ANY(public.current_user_household_ids()) 
  OR (household_id IS NULL AND auth.uid() IS NOT NULL)
) 
WITH CHECK (
  household_id = ANY(public.current_user_household_ids()) 
  OR (household_id IS NULL AND auth.uid() IS NOT NULL)
);

DROP POLICY IF EXISTS "Categorias isoladas por família" ON public.categories;
CREATE POLICY "Categorias isoladas por família" ON public.categories 
FOR ALL TO authenticated 
USING (
  household_id = ANY(public.current_user_household_ids()) 
  OR (household_id IS NULL AND auth.uid() IS NOT NULL)
) 
WITH CHECK (
  household_id = ANY(public.current_user_household_ids()) 
  OR (household_id IS NULL AND auth.uid() IS NOT NULL)
);

DROP POLICY IF EXISTS "Cenários isolados por família" ON public.scenarios;
CREATE POLICY "Cenários isolados por família" ON public.scenarios 
FOR ALL TO authenticated 
USING (
  household_id = ANY(public.current_user_household_ids()) 
  OR (household_id IS NULL AND auth.uid() IS NOT NULL)
) 
WITH CHECK (
  household_id = ANY(public.current_user_household_ids()) 
  OR (household_id IS NULL AND auth.uid() IS NOT NULL)
);

DROP POLICY IF EXISTS "Envelopes isolados por família" ON public.monthly_envelopes;
CREATE POLICY "Envelopes isolados por família" ON public.monthly_envelopes 
FOR ALL TO authenticated 
USING (
  household_id = ANY(public.current_user_household_ids()) 
  OR (household_id IS NULL AND auth.uid() IS NOT NULL)
) 
WITH CHECK (
  household_id = ANY(public.current_user_household_ids()) 
  OR (household_id IS NULL AND auth.uid() IS NOT NULL)
);

-- 6. Verificação final do estado das tabelas e usuários
SELECT 'Usuários na Família Principal' as rotulo, count(*)::text as resultado 
FROM public.household_members WHERE household_id = '00000000-0000-0000-0000-000000000001'
UNION ALL
SELECT 'Transações Vinculadas', count(*)::text 
FROM public.transactions WHERE household_id = '00000000-0000-0000-0000-000000000001'
UNION ALL
SELECT 'Transações com household NULL (deve ser 0)', count(*)::text 
FROM public.transactions WHERE household_id IS NULL
UNION ALL
SELECT 'Contas Vinculadas', count(*)::text 
FROM public.accounts WHERE household_id = '00000000-0000-0000-0000-000000000001'
UNION ALL
SELECT 'Cartões Vinculados', count(*)::text 
FROM public.cards WHERE household_id = '00000000-0000-0000-0000-000000000001';
