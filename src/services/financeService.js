import { supabase, isSupabaseConfigured } from './supabase';

const STORAGE_KEYS = {
  accounts: 'financas_accounts_v1',
  cards: 'financas_cards_v1',
  categories: 'financas_categories_v1',
  transactions: 'financas_transactions_v1',
  scenarios: 'financas_scenarios_v1',
};

// ==========================================
// CONVERSORES DE FORMATO (CAMELCASE <-> SNAKE_CASE)
// ==========================================

export const accountToClient = (row) => ({
  id: row.id,
  name: row.name,
  bank: row.bank,
  type: row.type || 'corrente',
  initialBalanceCents: Number(row.initial_balance_cents ?? row.initialBalanceCents ?? 0),
  holder: row.holder || 'Família',
  color: row.color || '#2563eb',
  archived: Boolean(row.archived),
  ownerId: row.owner_id || row.ownerId || 'user-all',
});

export const accountToDb = (acc) => ({
  id: acc.id,
  name: acc.name,
  bank: acc.bank,
  type: acc.type,
  initial_balance_cents: acc.initialBalanceCents,
  holder: acc.holder,
  color: acc.color,
  archived: acc.archived,
  owner_id: acc.ownerId,
});

export const cardToClient = (row) => ({
  id: row.id,
  name: row.name,
  bank: row.bank,
  flag: row.flag || 'Mastercard',
  limitCents: Number(row.limit_cents ?? row.limitCents ?? 0),
  closingDay: Number(row.closing_day ?? row.closingDay ?? 25),
  dueDay: Number(row.due_day ?? row.dueDay ?? 5),
  color: row.color || '#1e293b',
  archived: Boolean(row.archived),
  ownerId: row.owner_id || row.ownerId || 'user-all',
});

export const cardToDb = (c) => ({
  id: c.id,
  name: c.name,
  bank: c.bank,
  flag: c.flag,
  limit_cents: c.limitCents,
  closing_day: c.closingDay,
  due_day: c.dueDay,
  color: c.color,
  archived: c.archived,
  owner_id: c.ownerId,
});

export const categoryToClient = (row) => ({
  id: row.id,
  name: row.name,
  type: row.type || 'EXPENSE',
  color: row.color || '#475569',
  archived: Boolean(row.archived),
});

export const categoryToDb = (cat) => ({
  id: cat.id,
  name: cat.name,
  type: cat.type,
  color: cat.color,
  archived: cat.archived,
});

export const transactionToClient = (row) => ({
  id: row.id,
  description: row.description,
  amountCents: Number(row.amount_cents ?? row.amountCents ?? 0),
  type: row.type || 'EXPENSE',
  status: row.status || 'COMPROMETIDO',
  date: row.date,
  accountId: row.account_id || row.accountId || null,
  cardId: row.card_id || row.cardId || null,
  categoryId: row.category_id || row.categoryId || null,
  scope: row.scope || 'FAMILY',
  ownerId: row.owner_id || row.ownerId || 'user-1',
  installmentGroupId: row.installment_group_id || row.installmentGroupId || null,
  installmentNumber: row.installment_number ? Number(row.installment_number) : null,
  installmentCount: row.installment_count ? Number(row.installment_count) : null,
  isRecurring: Boolean(row.is_recurring ?? row.isRecurring),
  recurrenceRuleId: row.recurrence_rule_id || row.recurrenceRuleId || null,
});

export const transactionToDb = (tx) => ({
  id: tx.id,
  description: tx.description,
  amount_cents: tx.amountCents,
  type: tx.type,
  status: tx.status,
  date: tx.date,
  account_id: tx.accountId || null,
  card_id: tx.cardId || null,
  category_id: tx.categoryId || null,
  scope: tx.scope,
  owner_id: tx.ownerId,
  installment_group_id: tx.installmentGroupId || null,
  installment_number: tx.installmentNumber || null,
  installment_count: tx.installmentCount || null,
  is_recurring: tx.isRecurring || false,
  recurrence_rule_id: tx.recurrenceRuleId || null,
});

export const scenarioToClient = (row) => ({
  id: row.id,
  title: row.title,
  type: row.type || (Number(row.monthly_impact_cents ?? row.monthlyImpactCents) < 0 ? 'EXPENSE' : 'INCOME'),
  monthlyImpactCents: Number(row.monthly_impact_cents ?? row.monthlyImpactCents ?? 0),
  months: Number(row.months ?? 12),
  startDate: row.start_date || row.startDate || new Date().toISOString().slice(0, 10),
  categoryId: row.category_id || row.categoryId || null,
  sourceType: row.source_type || row.sourceType || 'ACCOUNT',
  accountId: row.account_id || row.accountId || null,
  cardId: row.card_id || row.cardId || null,
  scope: row.scope || 'FAMILY',
  ownerId: row.owner_id || row.ownerId || 'user-1',
  active: Boolean(row.active ?? true),
});

export const scenarioToDb = (scen) => ({
  id: scen.id,
  title: scen.title,
  type: scen.type,
  monthly_impact_cents: scen.monthlyImpactCents,
  months: scen.months,
  start_date: scen.startDate,
  category_id: scen.categoryId || null,
  source_type: scen.sourceType,
  account_id: scen.accountId || null,
  card_id: scen.cardId || null,
  scope: scen.scope,
  owner_id: scen.ownerId,
  active: scen.active,
});

// ==========================================
// CARREGAMENTO INICIAL UNIFICADO
// ==========================================

export const loadInitialAppData = async (defaults) => {
  const isCloud = isSupabaseConfigured() && supabase;

  if (isCloud) {
    try {
      const [accRes, cardRes, catRes, txRes, scenRes] = await Promise.all([
        supabase.from('accounts').select('*').order('created_at', { ascending: true }),
        supabase.from('cards').select('*').order('created_at', { ascending: true }),
        supabase.from('categories').select('*').order('name', { ascending: true }),
        supabase.from('transactions').select('*').order('date', { ascending: false }),
        supabase.from('scenarios').select('*').order('created_at', { ascending: true }),
      ]);

      const hasRemoteData = (accRes.data?.length || 0) > 0 || (txRes.data?.length || 0) > 0;

      if (hasRemoteData) {
        return {
          isCloud: true,
          accounts: (accRes.data || []).map(accountToClient),
          cards: (cardRes.data || []).map(cardToClient),
          categories: (catRes.data || []).map(categoryToClient),
          transactions: (txRes.data || []).map(transactionToClient),
          scenarios: (scenRes.data || []).map(scenarioToClient),
        };
      } else {
        // Se as tabelas estiverem vazias, faz o seed inicial no Supabase com os dados padrão
        try {
          if (defaults.categories?.length) {
            await supabase.from('categories').upsert(defaults.categories.map(categoryToDb));
          }
          if (defaults.accounts?.length) {
            await supabase.from('accounts').upsert(defaults.accounts.map(accountToDb));
          }
          if (defaults.cards?.length) {
            await supabase.from('cards').upsert(defaults.cards.map(cardToDb));
          }
          if (defaults.transactions?.length) {
            await supabase.from('transactions').upsert(defaults.transactions.map(transactionToDb));
          }
          if (defaults.scenarios?.length) {
            await supabase.from('scenarios').upsert(defaults.scenarios.map(scenarioToDb));
          }
        } catch (e) {
          console.warn('Aviso no seed inicial do Supabase:', e);
        }

        return {
          isCloud: true,
          accounts: defaults.accounts,
          cards: defaults.cards,
          categories: defaults.categories,
          transactions: defaults.transactions,
          scenarios: defaults.scenarios,
        };
      }
    } catch (err) {
      console.warn('Falha ao conectar no Supabase. Usando armazenamento local:', err);
    }
  }

  // Fallback para LocalStorage
  const getLocal = (key, fallback) => {
    try {
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : fallback;
    } catch {
      return fallback;
    }
  };

  return {
    isCloud: false,
    accounts: getLocal(STORAGE_KEYS.accounts, defaults.accounts),
    cards: getLocal(STORAGE_KEYS.cards, defaults.cards),
    categories: getLocal(STORAGE_KEYS.categories, defaults.categories),
    transactions: getLocal(STORAGE_KEYS.transactions, defaults.transactions),
    scenarios: getLocal(STORAGE_KEYS.scenarios, defaults.scenarios),
  };
};

// ==========================================
// OPERAÇÕES DE PERSISTÊNCIA (SAVE / DELETE)
// ==========================================

export const syncItem = async (entity, item, isDelete = false) => {
  const isCloud = isSupabaseConfigured() && supabase;
  if (!isCloud) return;

  try {
    if (isDelete) {
      await supabase.from(entity).delete().eq('id', item.id);
    } else {
      let dbData;
      if (entity === 'accounts') dbData = accountToDb(item);
      else if (entity === 'cards') dbData = cardToDb(item);
      else if (entity === 'categories') dbData = categoryToDb(item);
      else if (entity === 'transactions') dbData = transactionToDb(item);
      else if (entity === 'scenarios') dbData = scenarioToDb(item);

      if (dbData) {
        await supabase.from(entity).upsert(dbData);
      }
    }
  } catch (err) {
    console.error(`Erro ao sincronizar ${entity} no Supabase:`, err);
  }
};

export const syncBatchTransactions = async (txList, isDelete = false) => {
  const isCloud = isSupabaseConfigured() && supabase;
  if (!isCloud || !txList?.length) return;

  try {
    if (isDelete) {
      const ids = txList.map((t) => t.id);
      await supabase.from('transactions').delete().in('id', ids);
    } else {
      const dbList = txList.map(transactionToDb);
      await supabase.from('transactions').upsert(dbList);
    }
  } catch (err) {
    console.error('Erro ao sincronizar lote de transações:', err);
  }
};

export const saveToLocalStorage = (key, data) => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.warn('Erro ao salvar no localStorage:', e);
  }
};
