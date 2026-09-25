-- ==============================================================================
-- FASE 4 — PASSO 2 DE 2: DADOS, ÍNDICES E SEGURANÇA (DML & RLS)
-- ==============================================================================
-- Execute este script APÓS a execução bem-sucedida do Passo 1.
-- Ele cria os índices, migra os dados legados para a Família Principal
-- e ativa as políticas RLS isoladas.
-- ==============================================================================

-- 1. Índices de Performance para Multi-Tenancy
CREATE INDEX IF NOT EXISTS idx_household_members_user ON public.household_members(user_id);
CREATE INDEX IF NOT EXISTS idx_household_members_household ON public.household_members(household_id);
CREATE INDEX IF NOT EXISTS idx_household_members_status ON public.household_members(status);
CREATE INDEX IF NOT EXISTS idx_accounts_household ON public.accounts(household_id);
CREATE INDEX IF NOT EXISTS idx_cards_household ON public.cards(household_id);
CREATE INDEX IF NOT EXISTS idx_categories_household ON public.categories(household_id);
CREATE INDEX IF NOT EXISTS idx_transactions_household ON public.transactions(household_id);
CREATE INDEX IF NOT EXISTS idx_transactions_visibility ON public.transactions(visibility);
CREATE INDEX IF NOT EXISTS idx_scenarios_household ON public.scenarios(household_id);
CREATE INDEX IF NOT EXISTS idx_monthly_envelopes_household ON public.monthly_envelopes(household_id);

-- 2. Migração dos Dados Legados para a Família Principal
INSERT INTO public.households (id, name, invite_code)
VALUES ('00000000-0000-0000-0000-000000000001', 'Família Principal', 'FAM-ORIGINAL')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.household_members (household_id, user_id, role, status, display_name, member_key)
SELECT 
  '00000000-0000-0000-0000-000000000001'::uuid, 
  p.id, 
  CASE WHEN p.role = 'admin' THEN 'owner' ELSE 'member' END,
  'active',
  COALESCE(p.name, 'Membro'), 
  COALESCE(p.member_key, 'user-1')
FROM public.profiles p
ON CONFLICT (household_id, user_id) DO UPDATE SET
  status = 'active';

UPDATE public.accounts SET household_id = '00000000-0000-0000-0000-000000000001' WHERE household_id IS NULL;
UPDATE public.cards SET household_id = '00000000-0000-0000-0000-000000000001' WHERE household_id IS NULL;
UPDATE public.categories SET household_id = '00000000-0000-0000-0000-000000000001' WHERE household_id IS NULL;
UPDATE public.transactions SET household_id = '00000000-0000-0000-0000-000000000001' WHERE household_id IS NULL;
UPDATE public.scenarios SET household_id = '00000000-0000-0000-0000-000000000001' WHERE household_id IS NULL;
UPDATE public.monthly_envelopes SET household_id = '00000000-0000-0000-0000-000000000001' WHERE household_id IS NULL;

UPDATE public.transactions 
SET visibility = 'PERSONAL_PRIVATE' 
WHERE scope = 'PERSONAL' AND visibility = 'FAMILY';

-- 3. Função auxiliar para obter os IDs de famílias ativas do usuário logado (usada nas políticas RLS)
DROP FUNCTION IF EXISTS public.current_user_household_ids() CASCADE;
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

-- 4. Função / Trigger para Novos Usuários do Supabase Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_invite_code TEXT;
  v_target_household_id UUID;
  v_new_household_id UUID;
  v_user_name TEXT;
  v_member_key TEXT;
BEGIN
  v_user_name := COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1));
  v_member_key := COALESCE(NEW.raw_user_meta_data->>'memberKey', 'user-1');
  v_invite_code := NULLIF(TRIM(NEW.raw_user_meta_data->>'invite_code'), '');

  INSERT INTO public.profiles (id, email, name, role, member_key)
  VALUES (
    NEW.id,
    NEW.email,
    v_user_name,
    COALESCE(NEW.raw_user_meta_data->>'role', 'member'),
    v_member_key
  )
  ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    role = EXCLUDED.role,
    member_key = EXCLUDED.member_key;

  IF v_invite_code IS NOT NULL THEN
    SELECT id INTO v_target_household_id 
    FROM public.households 
    WHERE invite_code = v_invite_code;

    IF v_target_household_id IS NOT NULL THEN
      INSERT INTO public.household_members (household_id, user_id, role, status, display_name, member_key)
      VALUES (v_target_household_id, NEW.id, 'member', 'pending', v_user_name, v_member_key)
      ON CONFLICT (household_id, user_id) DO NOTHING;
      RETURN NEW;
    END IF;
  END IF;

  INSERT INTO public.households (name)
  VALUES ('Família de ' || v_user_name)
  RETURNING id INTO v_new_household_id;

  INSERT INTO public.household_members (household_id, user_id, role, status, display_name, member_key)
  VALUES (v_new_household_id, NEW.id, 'owner', 'active', v_user_name, 'user-1')
  ON CONFLICT (household_id, user_id) DO NOTHING;

  INSERT INTO public.categories (id, household_id, name, type, color, archived)
  VALUES
    (gen_random_uuid()::text, v_new_household_id, 'Salário & Dividendos', 'INCOME', '#16a34a', false),
    (gen_random_uuid()::text, v_new_household_id, 'Renda Extra & Consultoria', 'INCOME', '#0d9488', false),
    (gen_random_uuid()::text, v_new_household_id, 'Moradia (Aluguel/Condomínio)', 'EXPENSE', '#2563eb', false),
    (gen_random_uuid()::text, v_new_household_id, 'Supermercado & Feira', 'EXPENSE', '#d97706', false),
    (gen_random_uuid()::text, v_new_household_id, 'Educação & Cursos', 'EXPENSE', '#7c3aed', false),
    (gen_random_uuid()::text, v_new_household_id, 'Saúde & Farmácia', 'EXPENSE', '#e11d48', false),
    (gen_random_uuid()::text, v_new_household_id, 'Lazer & Restaurantes', 'EXPENSE', '#0284c7', false),
    (gen_random_uuid()::text, v_new_household_id, 'Transporte & Combustível', 'EXPENSE', '#475569', false)
  ON CONFLICT DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 5. Procedimentos de Gerenciamento de Membros
CREATE OR REPLACE FUNCTION public.approve_household_member(p_member_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_household_id UUID;
  v_is_authorized BOOLEAN;
BEGIN
  SELECT household_id INTO v_household_id FROM public.household_members WHERE id = p_member_id;
  IF v_household_id IS NULL THEN
    RAISE EXCEPTION 'Membro não encontrado.';
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.household_members
    WHERE household_id = v_household_id
      AND user_id = auth.uid()
      AND role IN ('owner', 'admin')
      AND status = 'active'
  ) INTO v_is_authorized;

  IF NOT v_is_authorized THEN
    RAISE EXCEPTION 'Apenas o proprietário ou administrador pode aprovar novos membros.';
  END IF;

  UPDATE public.household_members
  SET status = 'active'
  WHERE id = p_member_id;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.reject_household_member(p_member_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_household_id UUID;
  v_is_authorized BOOLEAN;
BEGIN
  SELECT household_id INTO v_household_id FROM public.household_members WHERE id = p_member_id;
  IF v_household_id IS NULL THEN
    RAISE EXCEPTION 'Membro não encontrado.';
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.household_members
    WHERE household_id = v_household_id
      AND user_id = auth.uid()
      AND role IN ('owner', 'admin')
      AND status = 'active'
  ) INTO v_is_authorized;

  IF NOT v_is_authorized THEN
    RAISE EXCEPTION 'Apenas o proprietário ou administrador pode recusar membros.';
  END IF;

  UPDATE public.household_members
  SET status = 'rejected'
  WHERE id = p_member_id;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Políticas de Row Level Security (RLS) Estritas
ALTER TABLE public.households ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.household_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scenarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monthly_envelopes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Permitir leitura de famílias para membros" ON public.households;
CREATE POLICY "Permitir leitura de famílias para membros" ON public.households FOR SELECT TO authenticated USING (id = ANY(public.current_user_household_ids()));

DROP POLICY IF EXISTS "Permitir atualização de família para administradores" ON public.households;
CREATE POLICY "Permitir atualização de família para administradores" ON public.households FOR ALL TO authenticated USING (id IN (
  SELECT hm.household_id FROM public.household_members hm
  WHERE hm.user_id = auth.uid() AND hm.role IN ('owner', 'admin') AND hm.status = 'active'
)) WITH CHECK (id IN (
  SELECT hm.household_id FROM public.household_members hm
  WHERE hm.user_id = auth.uid() AND hm.role IN ('owner', 'admin') AND hm.status = 'active'
));

DROP POLICY IF EXISTS "Permitir membros verem colegas da mesma família" ON public.household_members;
CREATE POLICY "Permitir membros verem colegas da mesma família" ON public.household_members FOR SELECT TO authenticated USING (
  household_id = ANY(public.current_user_household_ids()) OR user_id = auth.uid()
);

DROP POLICY IF EXISTS "Permitir gerenciamento de membros para administradores" ON public.household_members;
CREATE POLICY "Permitir gerenciamento de membros para administradores" ON public.household_members FOR ALL TO authenticated USING (
  household_id IN (
    SELECT hm.household_id FROM public.household_members hm
    WHERE hm.user_id = auth.uid() AND hm.role IN ('owner', 'admin') AND hm.status = 'active'
  )
) WITH CHECK (
  household_id IN (
    SELECT hm.household_id FROM public.household_members hm
    WHERE hm.user_id = auth.uid() AND hm.role IN ('owner', 'admin') AND hm.status = 'active'
  )
);

DROP POLICY IF EXISTS "Permitir leitura de perfis para todos" ON public.profiles;
DROP POLICY IF EXISTS "Permitir leitura de perfis para autenticados" ON public.profiles;
CREATE POLICY "Permitir leitura de perfis para autenticados" ON public.profiles FOR SELECT TO authenticated USING (
  id = auth.uid() OR id IN (
    SELECT hm.user_id FROM public.household_members hm
    WHERE hm.household_id = ANY(public.current_user_household_ids())
  )
);

DROP POLICY IF EXISTS "Permitir inserção e atualização de perfis para autenticados" ON public.profiles;
DROP POLICY IF EXISTS "Permitir inserção e atualização de perfis para próprio usuário" ON public.profiles;
CREATE POLICY "Permitir inserção e atualização de perfis para próprio usuário" ON public.profiles FOR ALL TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS "Permitir acesso completo às contas para autenticados" ON public.accounts;
DROP POLICY IF EXISTS "Contas isoladas por família" ON public.accounts;
CREATE POLICY "Contas isoladas por família" ON public.accounts FOR ALL TO authenticated USING (household_id = ANY(public.current_user_household_ids())) WITH CHECK (household_id = ANY(public.current_user_household_ids()));

DROP POLICY IF EXISTS "Permitir acesso completo aos cartões para autenticados" ON public.cards;
DROP POLICY IF EXISTS "Cartões isolados por família" ON public.cards;
CREATE POLICY "Cartões isolados por família" ON public.cards FOR ALL TO authenticated USING (household_id = ANY(public.current_user_household_ids())) WITH CHECK (household_id = ANY(public.current_user_household_ids()));

DROP POLICY IF EXISTS "Permitir acesso completo às categorias para autenticados" ON public.categories;
DROP POLICY IF EXISTS "Categorias isoladas por família" ON public.categories;
CREATE POLICY "Categorias isoladas por família" ON public.categories FOR ALL TO authenticated USING (household_id = ANY(public.current_user_household_ids())) WITH CHECK (household_id = ANY(public.current_user_household_ids()));

DROP POLICY IF EXISTS "Permitir acesso completo às transações para autenticados" ON public.transactions;
DROP POLICY IF EXISTS "Transações isoladas por família" ON public.transactions;
CREATE POLICY "Transações isoladas por família" ON public.transactions FOR ALL TO authenticated USING (household_id = ANY(public.current_user_household_ids())) WITH CHECK (household_id = ANY(public.current_user_household_ids()));

DROP POLICY IF EXISTS "Permitir acesso completo aos cenários para autenticados" ON public.scenarios;
DROP POLICY IF EXISTS "Cenários isolados por família" ON public.scenarios;
CREATE POLICY "Cenários isolados por família" ON public.scenarios FOR ALL TO authenticated USING (household_id = ANY(public.current_user_household_ids())) WITH CHECK (household_id = ANY(public.current_user_household_ids()));

DROP POLICY IF EXISTS "Permitir acesso completo aos envelopes para autenticados" ON public.monthly_envelopes;
DROP POLICY IF EXISTS "Permitir leitura e escrita de envelopes" ON public.monthly_envelopes;
DROP POLICY IF EXISTS "Envelopes isolados por família" ON public.monthly_envelopes;
CREATE POLICY "Envelopes isolados por família" ON public.monthly_envelopes FOR ALL TO authenticated USING (household_id = ANY(public.current_user_household_ids())) WITH CHECK (household_id = ANY(public.current_user_household_ids()));
