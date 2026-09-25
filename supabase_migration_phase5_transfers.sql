-- ==============================================================================
-- FASE 5: SUPORTE NATIVO A TRANSFERÊNCIAS ENTRE CONTAS (PIX & TED)
-- ==============================================================================
-- Execute este script no "SQL Editor" do painel do Supabase.
-- Ele habilita o tipo TRANSFER na base de dados, adiciona a coluna destination_account_id
-- e registra a categoria técnica de transferências.
-- ==============================================================================

-- 1. Atualizar a constraint de tipo na tabela de Transações
ALTER TABLE public.transactions DROP CONSTRAINT IF EXISTS transactions_type_check;
ALTER TABLE public.transactions ADD CONSTRAINT transactions_type_check 
  CHECK (type IN ('INCOME', 'EXPENSE', 'TRANSFER'));

-- 2. Atualizar a constraint de tipo na tabela de Categorias
ALTER TABLE public.categories DROP CONSTRAINT IF EXISTS categories_type_check;
ALTER TABLE public.categories ADD CONSTRAINT categories_type_check 
  CHECK (type IN ('INCOME', 'EXPENSE', 'TRANSFER'));

-- 3. Adicionar coluna destination_account_id na tabela de Transações
ALTER TABLE public.transactions 
  ADD COLUMN IF NOT EXISTS destination_account_id TEXT REFERENCES public.accounts(id) ON DELETE SET NULL;

-- 4. Índice para alta performance em consultas de extrato e conciliação por conta de destino
CREATE INDEX IF NOT EXISTS idx_transactions_dest_account 
  ON public.transactions(destination_account_id);

-- 5. Registrar categoria padrão para Transferências entre Contas
INSERT INTO public.categories (id, name, type, color, archived)
VALUES ('cat-transferencia', 'Transferência entre Contas', 'TRANSFER', '#0284c7', false)
ON CONFLICT (id) DO UPDATE SET 
  name = 'Transferência entre Contas',
  type = 'TRANSFER';

-- Garantir household_id se o multi-tenancy estiver ativo
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'categories' AND column_name = 'household_id'
  ) THEN
    UPDATE public.categories
    SET household_id = '00000000-0000-0000-0000-000000000001'
    WHERE id = 'cat-transferencia' AND household_id IS NULL;
  END IF;
END $$;

-- 6. Resgatar destination_account_id gravado no fallback temporário de recurrence_rule_id
UPDATE public.transactions
SET destination_account_id = SUBSTRING(recurrence_rule_id FROM 15)
WHERE type = 'TRANSFER'
  AND destination_account_id IS NULL
  AND recurrence_rule_id LIKE 'TRANSFER_DEST:%';
