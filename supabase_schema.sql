-- ==============================================================================
-- FINANÇAS DA FAMÍLIA - SCRIPT DE CRIAÇÃO DE BANCO DE DADOS (SUPABASE POSTGRESQL)
-- ==============================================================================
-- Execute este script no "SQL Editor" do seu painel Supabase para criar
-- todas as tabelas, permissões e dados iniciais da família.

-- 1. Tabela de Perfis de Usuário (vinculada ao Supabase Auth)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  member_key TEXT NOT NULL DEFAULT 'user-1' CHECK (member_key IN ('user-1', 'user-2')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Tabela de Contas Bancárias & Carteiras
CREATE TABLE IF NOT EXISTS public.accounts (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  bank TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'corrente',
  initial_balance_cents BIGINT NOT NULL DEFAULT 0,
  holder TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#2563eb',
  archived BOOLEAN NOT NULL DEFAULT FALSE,
  owner_id TEXT NOT NULL DEFAULT 'user-all',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Tabela de Cartões de Crédito
CREATE TABLE IF NOT EXISTS public.cards (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  bank TEXT NOT NULL,
  flag TEXT NOT NULL DEFAULT 'Mastercard',
  limit_cents BIGINT NOT NULL DEFAULT 0,
  closing_day INT NOT NULL DEFAULT 25,
  due_day INT NOT NULL DEFAULT 5,
  color TEXT NOT NULL DEFAULT '#1e293b',
  archived BOOLEAN NOT NULL DEFAULT FALSE,
  owner_id TEXT NOT NULL DEFAULT 'user-all',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Tabela de Categorias Financeiras (com suporte a Subcategorias e Tetos/Envelopes)
CREATE TABLE IF NOT EXISTS public.categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'EXPENSE' CHECK (type IN ('INCOME', 'EXPENSE')),
  color TEXT NOT NULL DEFAULT '#475569',
  archived BOOLEAN NOT NULL DEFAULT FALSE,
  budget_limit_cents BIGINT NOT NULL DEFAULT 0,
  parent_id TEXT REFERENCES public.categories(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Garante as colunas budget_limit_cents e parent_id em instalações prévias
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS budget_limit_cents BIGINT NOT NULL DEFAULT 0;
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS parent_id TEXT REFERENCES public.categories(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_categories_parent_id ON public.categories(parent_id);

-- 5. Tabela de Lançamentos Financeiros (Transações)
CREATE TABLE IF NOT EXISTS public.transactions (
  id TEXT PRIMARY KEY,
  description TEXT NOT NULL,
  amount_cents BIGINT NOT NULL,
  type TEXT NOT NULL DEFAULT 'EXPENSE' CHECK (type IN ('INCOME', 'EXPENSE')),
  status TEXT NOT NULL DEFAULT 'COMPROMETIDO' CHECK (status IN ('REALIZADO', 'COMPROMETIDO', 'PREVISTO', 'HIPOTETICO')),
  date TEXT NOT NULL,
  account_id TEXT REFERENCES public.accounts(id) ON DELETE SET NULL,
  card_id TEXT REFERENCES public.cards(id) ON DELETE SET NULL,
  category_id TEXT REFERENCES public.categories(id) ON DELETE SET NULL,
  scope TEXT NOT NULL DEFAULT 'FAMILY' CHECK (scope IN ('FAMILY', 'PERSONAL')),
  owner_id TEXT NOT NULL DEFAULT 'user-1',
  installment_group_id TEXT,
  installment_number INT,
  installment_count INT,
  is_recurring BOOLEAN DEFAULT FALSE,
  recurrence_rule_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Tabela de Cenários & Simulações ("What-If")
CREATE TABLE IF NOT EXISTS public.scenarios (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'EXPENSE' CHECK (type IN ('INCOME', 'EXPENSE')),
  monthly_impact_cents BIGINT NOT NULL,
  months INT NOT NULL DEFAULT 12,
  start_date TEXT NOT NULL,
  category_id TEXT REFERENCES public.categories(id) ON DELETE SET NULL,
  source_type TEXT NOT NULL DEFAULT 'ACCOUNT' CHECK (source_type IN ('ACCOUNT', 'CARD')),
  account_id TEXT REFERENCES public.accounts(id) ON DELETE SET NULL,
  card_id TEXT REFERENCES public.cards(id) ON DELETE SET NULL,
  scope TEXT NOT NULL DEFAULT 'FAMILY' CHECK (scope IN ('FAMILY', 'PERSONAL')),
  owner_id TEXT NOT NULL DEFAULT 'user-1',
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Tabela de Envelopes Mensais e Tetos Planejados
CREATE TABLE IF NOT EXISTS public.monthly_envelopes (
  id TEXT PRIMARY KEY,
  category_id TEXT NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  month_key TEXT NOT NULL,
  amount_cents BIGINT NOT NULL DEFAULT 0,
  rule_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices de performance para consultas frequentes
CREATE INDEX IF NOT EXISTS idx_transactions_date ON public.transactions(date);
CREATE INDEX IF NOT EXISTS idx_transactions_scope ON public.transactions(scope);
CREATE INDEX IF NOT EXISTS idx_transactions_owner ON public.transactions(owner_id);
CREATE INDEX IF NOT EXISTS idx_transactions_account ON public.transactions(account_id);
CREATE INDEX IF NOT EXISTS idx_transactions_card ON public.transactions(card_id);
CREATE INDEX IF NOT EXISTS idx_transactions_group ON public.transactions(installment_group_id);
CREATE INDEX IF NOT EXISTS idx_monthly_envelopes_month ON public.monthly_envelopes(month_key);
CREATE INDEX IF NOT EXISTS idx_monthly_envelopes_cat ON public.monthly_envelopes(category_id);

-- ==============================================================================
-- DADOS INICIAIS (SEEDS) - Executados se as tabelas estiverem vazias
-- ==============================================================================

-- Categorias Iniciais
INSERT INTO public.categories (id, name, type, color, archived)
VALUES
  ('cat-1', 'Salário & Dividendos', 'INCOME', '#16a34a', false),
  ('cat-2', 'Renda Extra & Consultoria', 'INCOME', '#0d9488', false),
  ('cat-3', 'Moradia (Aluguel/Condomínio)', 'EXPENSE', '#2563eb', false),
  ('cat-4', 'Supermercado & Feira', 'EXPENSE', '#d97706', false),
  ('cat-5', 'Educação & Cursos', 'EXPENSE', '#7c3aed', false),
  ('cat-6', 'Saúde & Farmácia', 'EXPENSE', '#e11d48', false),
  ('cat-7', 'Lazer & Restaurantes', 'EXPENSE', '#0284c7', false),
  ('cat-8', 'Transporte & Combustível', 'EXPENSE', '#475569', false)
ON CONFLICT (id) DO NOTHING;

-- Contas Iniciais (Opcional - Mantido comentado para iniciar o banco 100% limpo)
-- INSERT INTO public.accounts (id, name, bank, type, initial_balance_cents, holder, color, archived, owner_id)
-- VALUES
--   ('acc-1', 'Conta Corrente Principal', 'Banco do Brasil', 'corrente', 450000, 'Família', '#2563eb', false, 'user-all'),
--   ('acc-2', 'Reserva de Emergência', 'Nubank', 'investimento', 1500000, 'Família', '#16a34a', false, 'user-all'),
--   ('acc-3', 'Conta Pessoal Rafael', 'Inter', 'corrente', 180000, 'Rafael', '#f97316', false, 'user-1')
-- ON CONFLICT (id) DO NOTHING;

-- Cartões Iniciais (Opcional - Mantido comentado para iniciar o banco 100% limpo)
-- INSERT INTO public.cards (id, name, bank, flag, limit_cents, closing_day, due_day, color, archived, owner_id)
-- VALUES
--   ('card-1', 'Nubank Ultravioleta', 'Nubank', 'Mastercard', 1500000, 25, 5, '#1e293b', false, 'user-all'),
--   ('card-2', 'XP Infinite', 'XP Investimentos', 'Visa', 2000000, 15, 25, '#0f172a', false, 'user-all')
-- ON CONFLICT (id) DO NOTHING;

-- Habilitar RLS (Row Level Security) com políticas permissivas para a família autenticada
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scenarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monthly_envelopes ENABLE ROW LEVEL SECURITY;

-- Políticas para perfis
CREATE POLICY "Permitir leitura de perfis para todos"
  ON public.profiles FOR SELECT USING (true);

CREATE POLICY "Permitir inserção e atualização de perfis para autenticados"
  ON public.profiles FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Permitir acesso completo às contas para autenticados"
  ON public.accounts FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Permitir acesso completo aos cartões para autenticados"
  ON public.cards FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Permitir acesso completo às categorias para autenticados"
  ON public.categories FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Permitir acesso completo às transações para autenticados"
  ON public.transactions FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Permitir acesso completo aos cenários para autenticados"
  ON public.scenarios FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Permitir acesso completo aos envelopes para autenticados"
  ON public.monthly_envelopes FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Permitir leitura e escrita de envelopes"
  ON public.monthly_envelopes FOR ALL USING (true) WITH CHECK (true);

-- Trigger para sincronização automática de novo usuário do Supabase Auth para a tabela profiles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, role, member_key)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', 'Membro'),
    COALESCE(NEW.raw_user_meta_data->>'role', 'member'),
    COALESCE(NEW.raw_user_meta_data->>'memberKey', 'user-1')
  )
  ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    role = EXCLUDED.role,
    member_key = EXCLUDED.member_key;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

