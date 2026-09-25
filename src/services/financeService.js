import { supabase, isSupabaseConfigured } from './supabase.js';
import { calculateCardDueDate, addMonthsToIso } from '../utils/formatters.js';
import {
  DEMO_ACCOUNTS,
  DEMO_SAVINGS_GOALS,
  DEMO_PORTFOLIO_ASSETS,
  DEMO_CARDS,
  DEMO_CATEGORIES,
  DEMO_TRANSACTIONS,
  DEMO_SCENARIOS,
  DEMO_MONTHLY_ENVELOPES,
} from '../data/demoData.js';

export const isDemoMode = () => {
  if (typeof window === 'undefined') return false;
  const searchParams = new URLSearchParams(window.location.search);
  if (searchParams.get('demo') === 'true' || searchParams.get('demo') === '1') return true;
  if (window.location.pathname === '/demo' || window.location.pathname.startsWith('/demo/')) return true;
  if (window.location.hash === '#demo' || window.location.hash === '#/demo') return true;
  return sessionStorage.getItem('financas_is_demo') === 'true';
};

export const clearDemoSandbox = () => {
  if (typeof window === 'undefined') return;
  Object.values(STORAGE_KEYS).forEach((k) => sessionStorage.removeItem('demo_' + k));
  sessionStorage.removeItem('financas_is_demo');
};

export const STORAGE_KEYS = {
  accounts: 'financas_accounts_v1',
  cards: 'financas_cards_v1',
  categories: 'financas_categories_v1',
  transactions: 'financas_transactions_v1',
  scenarios: 'financas_scenarios_v1',
  monthlyEnvelopes: 'financas_monthly_envelopes_v1',
  savingsGoals: 'financas_savings_goals_v1',
  portfolioAssets: 'financas_portfolio_assets_v1',
};

export const markCategoryPending = (catId) => {
  if (!catId || isDemoMode()) return;
  try {
    const list = JSON.parse(localStorage.getItem('financas_pending_categories') || '[]');
    if (!list.includes(catId)) {
      list.push(catId);
      localStorage.setItem('financas_pending_categories', JSON.stringify(list));
    }
  } catch {}
};

export const clearCategoryPending = (catId) => {
  if (!catId || isDemoMode()) return;
  try {
    const list = JSON.parse(localStorage.getItem('financas_pending_categories') || '[]');
    const filtered = list.filter((id) => id !== catId);
    localStorage.setItem('financas_pending_categories', JSON.stringify(filtered));
  } catch {}
};

export const getPendingCategories = () => {
  if (isDemoMode()) return [];
  try {
    return JSON.parse(localStorage.getItem('financas_pending_categories') || '[]');
  } catch {
    return [];
  }
};

export const markTransactionPending = (txId) => {
  if (!txId || isDemoMode()) return;
  try {
    const list = JSON.parse(localStorage.getItem('financas_pending_transactions') || '[]');
    if (!list.includes(txId)) {
      list.push(txId);
      localStorage.setItem('financas_pending_transactions', JSON.stringify(list));
    }
  } catch {}
};

export const clearTransactionPending = (txId) => {
  if (!txId || isDemoMode()) return;
  try {
    const list = JSON.parse(localStorage.getItem('financas_pending_transactions') || '[]');
    const filtered = list.filter((id) => id !== txId);
    localStorage.setItem('financas_pending_transactions', JSON.stringify(filtered));
  } catch {}
};

export const getPendingTransactions = () => {
  if (isDemoMode()) return [];
  try {
    return JSON.parse(localStorage.getItem('financas_pending_transactions') || '[]');
  } catch {
    return [];
  }
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
  householdId: row.household_id || row.householdId || null,
});

export const accountToDb = (acc) => {
  const obj = {
    id: acc.id,
    name: acc.name,
    bank: acc.bank,
    type: acc.type,
    initial_balance_cents: acc.initialBalanceCents,
    holder: acc.holder,
    color: acc.color,
    archived: acc.archived,
    owner_id: acc.ownerId,
  };
  if (acc.householdId || acc.household_id) {
    obj.household_id = acc.householdId || acc.household_id;
  }
  return obj;
};

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
  householdId: row.household_id || row.householdId || null,
});

export const cardToDb = (c) => {
  const obj = {
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
  };
  if (c.householdId || c.household_id) {
    obj.household_id = c.householdId || c.household_id;
  }
  return obj;
};

export const categoryToClient = (row) => ({
  id: row.id,
  name: row.name,
  type: row.type || 'EXPENSE',
  color: row.color || '#475569',
  archived: Boolean(row.archived),
  budgetLimitCents: Number(row.budget_limit_cents ?? row.budgetLimitCents ?? 0),
  parentId: row.parent_id || row.parentId || null,
  householdId: row.household_id || row.householdId || null,
});

export const categoryToDb = (cat) => {
  const obj = {
    id: cat.id,
    name: cat.name,
    type: cat.type,
    color: cat.color,
    archived: cat.archived,
    budget_limit_cents: Number(cat.budgetLimitCents || 0),
    parent_id: cat.parentId || null,
  };
  if (cat.householdId || cat.household_id) {
    obj.household_id = cat.householdId || cat.household_id;
  }
  return obj;
};

export const transactionToClient = (row) => {
  const recRule = row.recurrence_rule_id || row.recurrenceRuleId || '';
  const isInvoicePayByRec = typeof recRule === 'string' && recRule.startsWith('INVOICE_PAY:');
  const isInvoicePayById = String(row.id || '').startsWith('tx-invoice-pay-');
  const isInvoicePayment = Boolean(
    row.is_invoice_payment ??
    row.isInvoicePayment ??
    isInvoicePayByRec ??
    isInvoicePayById
  );

  let targetCardId = row.target_card_id || row.targetCardId || null;
  let invoiceMonth = row.invoice_month || row.invoiceMonth || null;

  if (isInvoicePayByRec) {
    const parts = recRule.split(':');
    if (parts.length >= 3) {
      targetCardId = targetCardId || parts[1];
      invoiceMonth = invoiceMonth || parts[2];
    }
  } else if (isInvoicePayById) {
    const idMatch = String(row.id || '').match(/^tx-invoice-pay-(.+)-(\d{4}-\d{2})-\d+$/);
    if (idMatch) {
      targetCardId = targetCardId || idMatch[1];
      invoiceMonth = invoiceMonth || idMatch[2];
    }
  }

  let purchaseDate = row.purchase_date || row.purchaseDate || null;
  let dueDate = row.due_date || row.dueDate || row.date || null;

  if (!purchaseDate && typeof recRule === 'string' && recRule.startsWith('PURCHASE_DATE:')) {
    purchaseDate = recRule.replace('PURCHASE_DATE:', '').slice(0, 10);
  }

  let destinationAccountId = row.destination_account_id || row.destinationAccountId || null;
  if (!destinationAccountId && typeof recRule === 'string' && recRule.startsWith('TRANSFER_DEST:')) {
    destinationAccountId = recRule.replace('TRANSFER_DEST:', '').trim();
  }

  let savingsGoalId = row.savings_goal_id || row.savingsGoalId || null;
  if (!savingsGoalId && typeof recRule === 'string' && recRule.startsWith('GOAL_TX:')) {
    savingsGoalId = recRule.replace('GOAL_TX:', '').trim();
  }

  const txType = row.type || ((destinationAccountId || savingsGoalId) ? 'TRANSFER' : 'EXPENSE');

  return {
    id: row.id,
    description: row.description,
    amountCents: Number(row.amount_cents ?? row.amountCents ?? 0),
    type: txType,
    status: row.status || (txType === 'TRANSFER' ? 'REALIZADO' : 'COMPROMETIDO'),
    date: row.date,
    dueDate: dueDate || row.date,
    purchaseDate: purchaseDate || row.date,
    accountId: row.account_id || row.accountId || null,
    destinationAccountId,
    savingsGoalId,
    cardId: row.card_id || row.cardId || null,
    targetCardId,
    categoryId: row.category_id || row.categoryId || null,
    scope: row.scope || 'FAMILY',
    visibility: row.visibility || (row.scope === 'PERSONAL' ? 'PERSONAL_PRIVATE' : 'FAMILY'),
    ownerId: row.owner_id || row.ownerId || 'user-1',
    installmentGroupId: row.installment_group_id || row.installmentGroupId || null,
    installmentNumber: row.installment_number ? Number(row.installment_number) : null,
    installmentCount: row.installment_count ? Number(row.installment_count) : null,
    isRecurring: Boolean(row.is_recurring ?? row.isRecurring),
    recurrenceRuleId:
      isInvoicePayment ||
      (typeof recRule === 'string' &&
        (recRule.startsWith('PURCHASE_DATE:') ||
         recRule.startsWith('INVOICE_PAY:') ||
         recRule.startsWith('TRANSFER_DEST:') ||
         recRule.startsWith('GOAL_TX:')))
        ? null
        : (row.recurrence_rule_id || row.recurrenceRuleId || null),
    isInvoicePayment,
    invoiceMonth,
    householdId: row.household_id || row.householdId || null,
  };
};

export const transactionToDb = (tx) => {
  let recurrenceRuleId = tx.recurrenceRuleId || null;

  // Se for pagamento de fatura, persistir metadados em recurrence_rule_id para sobreviver ao Supabase
  if (tx.isInvoicePayment && tx.targetCardId && tx.invoiceMonth) {
    recurrenceRuleId = `INVOICE_PAY:${tx.targetCardId}:${tx.invoiceMonth}`;
  } else if (!recurrenceRuleId && tx.purchaseDate && tx.cardId && tx.purchaseDate !== tx.date) {
    // Para compras de cartão cujo purchaseDate difere do vencimento contábil da fatura (date)
    recurrenceRuleId = `PURCHASE_DATE:${tx.purchaseDate}`;
  } else if (!recurrenceRuleId && tx.type === 'TRANSFER' && tx.destinationAccountId) {
    // Backup de destino em recurrence_rule_id para sobreviver a esquemas sem a coluna
    recurrenceRuleId = `TRANSFER_DEST:${tx.destinationAccountId}`;
  } else if (!recurrenceRuleId && tx.savingsGoalId) {
    // Backup de cofrinho em recurrence_rule_id para sobreviver a esquemas sem a coluna
    recurrenceRuleId = `GOAL_TX:${tx.savingsGoalId}`;
  }

  const obj = {
    id: tx.id,
    description: tx.description,
    amount_cents: tx.amountCents,
    type: tx.type,
    status: tx.status,
    date: tx.dueDate || tx.date,
    account_id: tx.accountId || null,
    destination_account_id: tx.destinationAccountId || null,
    savings_goal_id: tx.savingsGoalId || null,
    card_id: tx.cardId || null,
    category_id: tx.categoryId || null,
    scope: tx.scope,
    visibility: tx.visibility || (tx.scope === 'PERSONAL' ? 'PERSONAL_PRIVATE' : 'FAMILY'),
    owner_id: tx.ownerId,
    installment_group_id: tx.installmentGroupId || null,
    installment_number: tx.installmentNumber || null,
    installment_count: tx.installmentCount || null,
    is_recurring: Boolean(tx.isRecurring),
    recurrence_rule_id: recurrenceRuleId,
  };
  if (tx.householdId || tx.household_id) {
    obj.household_id = tx.householdId || tx.household_id;
  }
  return obj;
};

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
  adjustments: row.adjustments || {
    ignoredIncomes: [],
    ignoredExpenses: [],
    categoryReductions: [],
  },
  householdId: row.household_id || row.householdId || null,
});

export const scenarioToDb = (scen) => {
  const obj = {
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
    adjustments: scen.adjustments || null,
  };
  if (scen.householdId || scen.household_id) {
    obj.household_id = scen.householdId || scen.household_id;
  }
  return obj;
};

export const monthlyEnvelopeToClient = (row) => ({
  id: row.id,
  categoryId: row.category_id || row.categoryId,
  monthKey: row.month_key || row.monthKey,
  amountCents: Number(row.amount_cents ?? row.amountCents ?? 0),
  ruleId: row.rule_id || row.ruleId || null,
  createdAt: row.created_at || row.createdAt || new Date().toISOString(),
  householdId: row.household_id || row.householdId || null,
});

export const monthlyEnvelopeToDb = (env) => {
  const obj = {
    id: env.id,
    category_id: env.categoryId,
    month_key: env.monthKey,
    amount_cents: env.amountCents,
    rule_id: env.ruleId || null,
  };
  if (env.householdId || env.household_id) {
    obj.household_id = env.householdId || env.household_id;
  }
  return obj;
};

export const savingsGoalToClient = (row) => ({
  id: row.id,
  name: row.name,
  linkedAccountId: row.linked_account_id || row.linkedAccountId || null,
  targetCents: Number(row.target_cents ?? row.targetCents ?? 0),
  currentBalanceCents: Number(row.current_balance_cents ?? row.currentBalanceCents ?? 0),
  yieldRate: row.yield_rate || row.yieldRate || '100% CDI',
  color: row.color || '#10b981',
  icon: row.icon || 'PiggyBank',
  ownerId: row.owner_id || row.ownerId || 'user-all',
  householdId: row.household_id || row.householdId || null,
});

export const savingsGoalToDb = (goal) => {
  const obj = {
    id: goal.id,
    name: goal.name,
    linked_account_id: goal.linkedAccountId || null,
    target_cents: Number(goal.targetCents || 0),
    current_balance_cents: Number(goal.currentBalanceCents || 0),
    yield_rate: goal.yieldRate || '100% CDI',
    color: goal.color || '#10b981',
    icon: goal.icon || 'PiggyBank',
    owner_id: goal.ownerId || 'user-all',
  };
  if (goal.householdId || goal.household_id) {
    obj.household_id = goal.householdId || goal.household_id;
  }
  return obj;
};

export const portfolioAssetToClient = (row) => ({
  id: row.id,
  name: row.name,
  ticker: row.ticker,
  assetType: row.asset_type || row.assetType || 'STOCK',
  institution: row.institution || '',
  quantity: Number(row.quantity ?? 0),
  averagePriceCents: Number(row.average_price_cents ?? row.averagePriceCents ?? 0),
  currentPriceCents: Number(row.current_price_cents ?? row.currentPriceCents ?? 0),
  notes: row.notes || '',
  ownerId: row.owner_id || row.ownerId || 'user-all',
  householdId: row.household_id || row.householdId || null,
  createdAt: row.created_at || row.createdAt || null,
  updatedAt: row.updated_at || row.updatedAt || null,
});

export const portfolioAssetToDb = (asset) => {
  const obj = {
    id: asset.id,
    name: asset.name,
    ticker: asset.ticker,
    asset_type: asset.assetType || 'STOCK',
    institution: asset.institution || '',
    quantity: Number(asset.quantity || 0),
    average_price_cents: Math.round(Number(asset.averagePriceCents || 0)),
    current_price_cents: Math.round(Number(asset.currentPriceCents || 0)),
    notes: asset.notes || null,
    owner_id: asset.ownerId || 'user-all',
  };
  if (asset.householdId || asset.household_id) {
    obj.household_id = asset.householdId || asset.household_id;
  }
  return obj;
};

// ==========================================
// CARREGAMENTO INICIAL UNIFICADO
// ==========================================

export const loadInitialAppData = async (defaults = {}) => {
  if (isDemoMode()) {
    const getDemoSession = (key, fallback) => {
      try {
        const stored = sessionStorage.getItem('demo_' + key);
        if (stored !== null) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
        return fallback;
      } catch {
        return fallback;
      }
    };

    return {
      isCloud: false,
      isDemo: true,
      accounts: getDemoSession(STORAGE_KEYS.accounts, defaults.accounts || DEMO_ACCOUNTS),
      savingsGoals: getDemoSession(STORAGE_KEYS.savingsGoals, defaults.savingsGoals || DEMO_SAVINGS_GOALS).map(savingsGoalToClient),
      portfolioAssets: getDemoSession(STORAGE_KEYS.portfolioAssets, defaults.portfolioAssets || DEMO_PORTFOLIO_ASSETS).map(portfolioAssetToClient),
      cards: getDemoSession(STORAGE_KEYS.cards, defaults.cards || DEMO_CARDS),
      categories: getDemoSession(STORAGE_KEYS.categories, defaults.categories || DEMO_CATEGORIES),
      transactions: getDemoSession(STORAGE_KEYS.transactions, defaults.transactions || DEMO_TRANSACTIONS).map(transactionToClient),
      scenarios: getDemoSession(STORAGE_KEYS.scenarios, defaults.scenarios || DEMO_SCENARIOS),
      monthlyEnvelopes: getDemoSession(STORAGE_KEYS.monthlyEnvelopes, defaults.monthlyEnvelopes || DEMO_MONTHLY_ENVELOPES).map(monthlyEnvelopeToClient),
    };
  }

  const isCloud = isSupabaseConfigured() && supabase;

  // Fallback para LocalStorage (NUNCA gera transações de exemplo por padrão)
  const getLocal = (key, fallback) => {
    try {
      const stored = localStorage.getItem(key);
      if (stored !== null) return JSON.parse(stored);
      return fallback;
    } catch {
      return fallback;
    }
  };

  if (isCloud) {
    try {
      const [accRes, cardRes, catRes, txRes, scenRes, envRes, goalRes, assetRes] = await Promise.all([
        supabase.from('accounts').select('*').order('created_at', { ascending: true }),
        supabase.from('cards').select('*').order('created_at', { ascending: true }),
        supabase.from('categories').select('*').order('name', { ascending: true }),
        supabase.from('transactions').select('*').order('date', { ascending: false }),
        supabase.from('scenarios').select('*').order('created_at', { ascending: true }),
        supabase.from('monthly_envelopes').select('*'),
        supabase.from('savings_goals').select('*').order('created_at', { ascending: true }),
        supabase.from('portfolio_assets').select('*').order('created_at', { ascending: true }),
      ]);

      const localCats = getLocal(STORAGE_KEYS.categories, defaults.categories || []);
      const localCatsMap = new Map((localCats || []).map((c) => [c.id, c]));

      // 1. Categorias: se a nuvem responder com sucesso, ela é a Fonte da Verdade (SSOT)
      let cloudCats = [];
      const isCatSuccess = !catRes?.error && Array.isArray(catRes?.data);
      if (isCatSuccess) {
        if (catRes.data.length === 0 && defaults.categories?.length) {
          // Se o banco for completamente virgem, insere categorias padrão
          try {
            await supabase.from('categories').upsert(defaults.categories.map(categoryToDb));
          } catch (e) {
            console.warn('Erro ao inserir categorias padrão:', e);
          }
          cloudCats = defaults.categories;
        } else {
          cloudCats = catRes.data.map(categoryToClient);
        }
      } else {
        // Falha de rede nas categorias: usa cache local com segurança
        cloudCats = localCats;
      }

      // Identificar categorias locais que estão pendentes de sincronização OU em uso por transações locais
      const pendingCategoryIds = new Set(getPendingCategories());
      const localTxs = getLocal(STORAGE_KEYS.transactions, []);
      const usedCatIds = new Set((localTxs || []).map((t) => t.categoryId).filter(Boolean));
      const cloudCatIds = new Set(cloudCats.map((c) => c.id));

      const preservedLocalCats = (localCats || []).filter(
        (c) => !cloudCatIds.has(c.id) && (pendingCategoryIds.has(c.id) || usedCatIds.has(c.id))
      );

      // Auto-sincronizar categorias locais pendentes/em uso no Supabase para garantir integridade referencial (pais primeiro, depois filhos)
      if (preservedLocalCats.length > 0) {
        try {
          const sortedCats = [...preservedLocalCats].sort((a, b) => (a.parentId ? 1 : 0) - (b.parentId ? 1 : 0));
          for (const pCat of sortedCats) {
            await supabase.from('categories').upsert(categoryToDb(pCat));
            clearCategoryPending(pCat.id);
          }
        } catch (e) {
          console.warn('Erro ao auto-sincronizar categorias preservadas:', e);
        }
      }

      // Mescla com localStorage apenas para preservar budgetLimitCents e parentId de categorias existentes
      const mergedCats = cloudCats.map((c) => {
        const local = localCatsMap.get(c.id);
        if (local) {
          return {
            ...c,
            budgetLimitCents: (c.budgetLimitCents && c.budgetLimitCents > 0) ? c.budgetLimitCents : (local.budgetLimitCents || 0),
            parentId: c.parentId || local.parentId || null,
          };
        }
        return c;
      });

      const allMergedCats = [...mergedCats, ...preservedLocalCats];

      // Se a nuvem respondeu com sucesso, atualiza o cache local com as categorias autoritativas.
      if (isCatSuccess) {
        localStorage.setItem(STORAGE_KEYS.categories, JSON.stringify(allMergedCats));
      }

      // 2. Envelopes mensais: segue estritamente a nuvem sem ressuscitar envelopes excluídos
      const isEnvSuccess = !envRes?.error && Array.isArray(envRes?.data);
      let mergedEnvelopes = [];
      if (isEnvSuccess) {
        mergedEnvelopes = envRes.data.map(monthlyEnvelopeToClient);
        localStorage.setItem(STORAGE_KEYS.monthlyEnvelopes, JSON.stringify(mergedEnvelopes));
      } else {
        mergedEnvelopes = getLocal(STORAGE_KEYS.monthlyEnvelopes, []).map(monthlyEnvelopeToClient);
      }

      // 3. Contas, Cartões, Transações e Cenários
      const isAccSuccess = !accRes?.error && Array.isArray(accRes?.data);
      const localAccs = getLocal(STORAGE_KEYS.accounts, []);
      const accounts = isAccSuccess && (accRes.data.length > 0 || localAccs.length === 0)
        ? accRes.data.map(accountToClient)
        : localAccs;
      if (isAccSuccess && (accRes.data.length > 0 || localAccs.length === 0)) {
        localStorage.setItem(STORAGE_KEYS.accounts, JSON.stringify(accounts));
      }

      const isCardSuccess = !cardRes?.error && Array.isArray(cardRes?.data);
      const localCards = getLocal(STORAGE_KEYS.cards, []);
      const cards = isCardSuccess && (cardRes.data.length > 0 || localCards.length === 0)
        ? cardRes.data.map(cardToClient)
        : localCards;
      if (isCardSuccess && (cardRes.data.length > 0 || localCards.length === 0)) {
        localStorage.setItem(STORAGE_KEYS.cards, JSON.stringify(cards));
      }

      const isTxSuccess = !txRes?.error && Array.isArray(txRes?.data);
      let transactions = [];
      if (isTxSuccess) {
        if (txRes.data.length === 0 && (localTxs || []).length > 0) {
          console.warn('[FinanceService] Nuvem retornou 0 transações com cache local preenchido. Preservando cache local.');
          transactions = (localTxs || []).map(transactionToClient);
        } else {
          const cloudTxs = txRes.data.map(transactionToClient);
          const localTxsMap = new Map((localTxs || []).map((t) => [t.id, t]));
          const pendingTxIds = new Set(getPendingTransactions());

          // Mescla inteligente: se o lançamento local tem edição pendente ou localUpdatedAt recente, preserva a versão local do usuário!
          const mergedCloudTxs = cloudTxs.map((cTx) => {
            const lTx = localTxsMap.get(cTx.id);
            if (lTx && (pendingTxIds.has(lTx.id) || (lTx._localUpdatedAt && Date.now() - lTx._localUpdatedAt < 15000))) {
              return { ...cTx, ...lTx };
            }
            return cTx;
          });

          const cloudTxIds = new Set(cloudTxs.map((t) => t.id));
          const unmergedLocalTxs = (localTxs || []).filter((t) => !cloudTxIds.has(t.id) && (pendingTxIds.has(t.id) || (t._localUpdatedAt && Date.now() - t._localUpdatedAt < 60000)));
          transactions = [...mergedCloudTxs, ...unmergedLocalTxs];
          const { healedTransactions, hasChanges, changedTxs } = healMigratedInvoiceTransactions(transactions, cards);
          transactions = healedTransactions;
          localStorage.setItem(STORAGE_KEYS.transactions, JSON.stringify(transactions));
          if (hasChanges && changedTxs.length > 0) {
            syncBatchTransactions(changedTxs).catch(console.warn);
          }

          // Re-sincronizar transações locais pendentes em segundo plano
          if (pendingTxIds.size > 0) {
            const txsToSync = transactions.filter((t) => pendingTxIds.has(t.id));
            if (txsToSync.length > 0) {
              syncBatchTransactions(txsToSync).catch(console.warn);
            }
          }
        }
      } else {
        transactions = getLocal(STORAGE_KEYS.transactions, []).map(transactionToClient);
      }

      const isScenSuccess = !scenRes?.error && Array.isArray(scenRes?.data);
      const scenarios = isScenSuccess ? scenRes.data.map(scenarioToClient) : getLocal(STORAGE_KEYS.scenarios, []);
      if (isScenSuccess) localStorage.setItem(STORAGE_KEYS.scenarios, JSON.stringify(scenarios));

      const isGoalSuccess = !goalRes?.error && Array.isArray(goalRes?.data);
      const localGoals = getLocal(STORAGE_KEYS.savingsGoals, []);
      const savingsGoals = isGoalSuccess && (goalRes.data.length > 0 || localGoals.length === 0)
        ? goalRes.data.map(savingsGoalToClient)
        : localGoals.map(savingsGoalToClient);
      if (isGoalSuccess && (goalRes.data.length > 0 || localGoals.length === 0)) {
        localStorage.setItem(STORAGE_KEYS.savingsGoals, JSON.stringify(savingsGoals));
      }

      const isAssetSuccess = !assetRes?.error && Array.isArray(assetRes?.data);
      const localAssets = getLocal(STORAGE_KEYS.portfolioAssets, []);
      const portfolioAssets = isAssetSuccess && (assetRes.data.length > 0 || localAssets.length === 0)
        ? assetRes.data.map(portfolioAssetToClient)
        : localAssets.map(portfolioAssetToClient);
      if (isAssetSuccess && (assetRes.data.length > 0 || localAssets.length === 0)) {
        localStorage.setItem(STORAGE_KEYS.portfolioAssets, JSON.stringify(portfolioAssets));
      }

      // Retorna exatamente os dados reais do banco (SEM injetar transações ou simulações fictícias)
      return {
        isCloud: true,
        accounts,
        cards,
        categories: allMergedCats,
        transactions,
        scenarios,
        monthlyEnvelopes: mergedEnvelopes,
        savingsGoals,
        portfolioAssets,
      };
    } catch (err) {
      console.warn('Falha ao conectar no Supabase. Usando armazenamento local:', err);
    }
  }

  return {
    isCloud: false,
    accounts: getLocal(STORAGE_KEYS.accounts, []),
    cards: getLocal(STORAGE_KEYS.cards, []),
    categories: getLocal(STORAGE_KEYS.categories, defaults.categories || []),
    transactions: getLocal(STORAGE_KEYS.transactions, []).map(transactionToClient),
    scenarios: getLocal(STORAGE_KEYS.scenarios, []),
    monthlyEnvelopes: getLocal(STORAGE_KEYS.monthlyEnvelopes, []).map(monthlyEnvelopeToClient),
    savingsGoals: getLocal(STORAGE_KEYS.savingsGoals, []).map(savingsGoalToClient),
    portfolioAssets: getLocal(STORAGE_KEYS.portfolioAssets, []).map(portfolioAssetToClient),
  };
};

export const loadDemoPresentationData = async (demo) => {
  if (isDemoMode()) {
    saveToLocalStorage(STORAGE_KEYS.accounts, demo.accounts || []);
    saveToLocalStorage(STORAGE_KEYS.savingsGoals, demo.savingsGoals || DEMO_SAVINGS_GOALS);
    saveToLocalStorage(STORAGE_KEYS.portfolioAssets, demo.portfolioAssets || DEMO_PORTFOLIO_ASSETS);
    saveToLocalStorage(STORAGE_KEYS.cards, demo.cards || []);
    saveToLocalStorage(STORAGE_KEYS.categories, demo.categories || []);
    saveToLocalStorage(STORAGE_KEYS.transactions, demo.transactions || []);
    saveToLocalStorage(STORAGE_KEYS.scenarios, demo.scenarios || []);
    saveToLocalStorage(STORAGE_KEYS.monthlyEnvelopes, demo.monthlyEnvelopes || []);
    sessionStorage.setItem('financas_demo_loaded', 'true');

    return {
      accounts: demo.accounts || [],
      savingsGoals: demo.savingsGoals || DEMO_SAVINGS_GOALS,
      portfolioAssets: demo.portfolioAssets || DEMO_PORTFOLIO_ASSETS,
      cards: demo.cards || [],
      categories: demo.categories || [],
      transactions: demo.transactions || [],
      scenarios: demo.scenarios || [],
      monthlyEnvelopes: demo.monthlyEnvelopes || [],
    };
  }

  const isCloud = isSupabaseConfigured() && supabase;

  if (isCloud) {
    try {
      if (demo.categories?.length) await supabase.from('categories').upsert(demo.categories.map(categoryToDb));
      if (demo.accounts?.length) await supabase.from('accounts').upsert(demo.accounts.map(accountToDb));
      if (demo.savingsGoals?.length) await supabase.from('savings_goals').upsert(demo.savingsGoals.map(savingsGoalToDb));
      if (demo.portfolioAssets?.length) await supabase.from('portfolio_assets').upsert(demo.portfolioAssets.map(portfolioAssetToDb));
      if (demo.cards?.length) await supabase.from('cards').upsert(demo.cards.map(cardToDb));
      if (demo.transactions?.length) await supabase.from('transactions').upsert(demo.transactions.map(transactionToDb));
      if (demo.scenarios?.length) await supabase.from('scenarios').upsert(demo.scenarios.map(scenarioToDb));
    } catch (e) {
      console.error('Erro ao carregar demo no Supabase:', e);
    }
  }

  localStorage.setItem(STORAGE_KEYS.accounts, JSON.stringify(demo.accounts || []));
  localStorage.setItem(STORAGE_KEYS.savingsGoals, JSON.stringify(demo.savingsGoals || DEMO_SAVINGS_GOALS));
  localStorage.setItem(STORAGE_KEYS.portfolioAssets, JSON.stringify(demo.portfolioAssets || DEMO_PORTFOLIO_ASSETS));
  localStorage.setItem(STORAGE_KEYS.cards, JSON.stringify(demo.cards || []));
  localStorage.setItem(STORAGE_KEYS.categories, JSON.stringify(demo.categories || []));
  localStorage.setItem(STORAGE_KEYS.transactions, JSON.stringify(demo.transactions || []));
  localStorage.setItem(STORAGE_KEYS.scenarios, JSON.stringify(demo.scenarios || []));
  localStorage.setItem('financas_demo_loaded', 'true');

  return {
    accounts: demo.accounts || [],
    savingsGoals: demo.savingsGoals || DEMO_SAVINGS_GOALS,
    portfolioAssets: demo.portfolioAssets || DEMO_PORTFOLIO_ASSETS,
    cards: demo.cards || [],
    categories: demo.categories || [],
    transactions: demo.transactions || [],
    scenarios: demo.scenarios || [],
  };
};

// Limpeza estrita e segura APENAS de dados de exemplo (prefixo demo-)
export const clearDemoDataOnly = async ({
  transactions = [],
  scenarios = [],
  accounts = [],
  cards = [],
  savingsGoals = [],
  portfolioAssets = [],
}) => {
  const isCloud = isSupabaseConfigured() && supabase;

  const demoTxIds = transactions.filter((t) => String(t.id || '').startsWith('demo-')).map((t) => t.id);
  const demoScenIds = scenarios.filter((s) => String(s.id || '').startsWith('demo-')).map((s) => s.id);
  const demoAccIds = accounts.filter((a) => String(a.id || '').startsWith('demo-')).map((a) => a.id);
  const demoCardIds = cards.filter((c) => String(c.id || '').startsWith('demo-')).map((c) => c.id);
  const demoGoalIds = savingsGoals.filter((g) => String(g.id || '').startsWith('demo-')).map((g) => g.id);
  const demoAssetIds = portfolioAssets.filter((a) => String(a.id || '').startsWith('demo-')).map((a) => a.id);

  if (isCloud) {
    try {
      if (demoTxIds.length) await supabase.from('transactions').delete().in('id', demoTxIds);
      if (demoScenIds.length) await supabase.from('scenarios').delete().in('id', demoScenIds);
      if (demoGoalIds.length) await supabase.from('savings_goals').delete().in('id', demoGoalIds);
      if (demoAssetIds.length) await supabase.from('portfolio_assets').delete().in('id', demoAssetIds);
      if (demoAccIds.length) await supabase.from('accounts').delete().in('id', demoAccIds);
      if (demoCardIds.length) await supabase.from('cards').delete().in('id', demoCardIds);
    } catch (e) {
      console.error('Erro ao excluir dados demo do Supabase:', e);
    }
  }

  // Preserva TODOS os dados reais do usuário intactos
  const remainingTransactions = transactions.filter((t) => !String(t.id || '').startsWith('demo-'));
  const remainingScenarios = scenarios.filter((s) => !String(s.id || '').startsWith('demo-'));
  const remainingAccounts = accounts.filter((a) => !String(a.id || '').startsWith('demo-'));
  const remainingCards = cards.filter((c) => !String(c.id || '').startsWith('demo-'));
  const remainingSavingsGoals = savingsGoals.filter((g) => !String(g.id || '').startsWith('demo-'));
  const remainingPortfolioAssets = portfolioAssets.filter((a) => !String(a.id || '').startsWith('demo-'));

  localStorage.setItem(STORAGE_KEYS.transactions, JSON.stringify(remainingTransactions));
  localStorage.setItem(STORAGE_KEYS.scenarios, JSON.stringify(remainingScenarios));
  localStorage.setItem(STORAGE_KEYS.accounts, JSON.stringify(remainingAccounts));
  localStorage.setItem(STORAGE_KEYS.cards, JSON.stringify(remainingCards));
  localStorage.setItem(STORAGE_KEYS.savingsGoals, JSON.stringify(remainingSavingsGoals));
  localStorage.setItem(STORAGE_KEYS.portfolioAssets, JSON.stringify(remainingPortfolioAssets));
  localStorage.removeItem('financas_demo_loaded');
  localStorage.setItem('financas_initialized', 'true');

  return {
    transactions: remainingTransactions,
    scenarios: remainingScenarios,
    accounts: remainingAccounts,
    cards: remainingCards,
    savingsGoals: remainingSavingsGoals,
    portfolioAssets: remainingPortfolioAssets,
  };
};

// Reset Geral do Sistema (Apenas quando acionado explicitamente em Configurações Avançadas)
export const resetEntireSystem = async () => {
  const isCloud = isSupabaseConfigured() && supabase;

  if (isCloud) {
    try {
      await Promise.all([
        supabase.from('transactions').delete().neq('id', '__none__'),
        supabase.from('scenarios').delete().neq('id', '__none__'),
        supabase.from('savings_goals').delete().neq('id', '__none__'),
        supabase.from('portfolio_assets').delete().neq('id', '__none__'),
        supabase.from('accounts').delete().neq('id', '__none__'),
        supabase.from('cards').delete().neq('id', '__none__'),
        supabase.from('monthly_envelopes').delete().neq('id', '__none__'),
      ]);
    } catch (e) {
      console.error('Erro ao resetar Supabase:', e);
    }
  }

  localStorage.setItem(STORAGE_KEYS.transactions, JSON.stringify([]));
  localStorage.setItem(STORAGE_KEYS.scenarios, JSON.stringify([]));
  localStorage.setItem(STORAGE_KEYS.accounts, JSON.stringify([]));
  localStorage.setItem(STORAGE_KEYS.savingsGoals, JSON.stringify([]));
  localStorage.setItem(STORAGE_KEYS.portfolioAssets, JSON.stringify([]));
  localStorage.setItem(STORAGE_KEYS.cards, JSON.stringify([]));
  localStorage.setItem(STORAGE_KEYS.monthlyEnvelopes, JSON.stringify([]));
  localStorage.removeItem('financas_demo_loaded');
  localStorage.setItem('financas_initialized', 'true');

  return {
    transactions: [],
    scenarios: [],
    accounts: [],
    savingsGoals: [],
    portfolioAssets: [],
    cards: [],
    monthlyEnvelopes: [],
  };
};

// Alias para compatibilidade anterior, redirecionando para a versão segura
export const clearAllDemoData = clearDemoDataOnly;

// ==========================================
// OPERAÇÕES DE PERSISTÊNCIA (SAVE / DELETE)
// ==========================================

export const syncItem = async (entity, item, isDelete = false) => {
  if (isDemoMode()) return { success: true };
  const isCloud = isSupabaseConfigured() && supabase;
  if (!isCloud) return { success: true };

  try {
    const targetTable = (entity === 'monthlyEnvelopes' || entity === 'monthly_envelopes')
      ? 'monthly_envelopes'
      : (entity === 'savingsGoals' || entity === 'savings_goals')
      ? 'savings_goals'
      : (entity === 'portfolioAssets' || entity === 'portfolio_assets')
      ? 'portfolio_assets'
      : entity;

    if (isDelete) {
      await supabase.from(targetTable).delete().eq('id', item.id);
      if (entity === 'categories') {
        clearCategoryPending(item.id);
      }
      if (entity === 'transactions') {
        clearTransactionPending(item.id);
      }
      return { success: true };
    } else {
      let dbData;
      if (entity === 'accounts') dbData = accountToDb(item);
      else if (entity === 'cards') dbData = cardToDb(item);
      else if (entity === 'categories') {
        markCategoryPending(item.id);
        dbData = categoryToDb(item);
      }
      else if (entity === 'transactions') {
        markTransactionPending(item.id);
        dbData = transactionToDb(item);
      }
      else if (entity === 'scenarios') dbData = scenarioToDb(item);
      else if (entity === 'monthlyEnvelopes' || entity === 'monthly_envelopes') dbData = monthlyEnvelopeToDb(item);
      else if (entity === 'savingsGoals' || entity === 'savings_goals') dbData = savingsGoalToDb(item);
      else if (entity === 'portfolioAssets' || entity === 'portfolio_assets') dbData = portfolioAssetToDb(item);

      // Pré-sincronização de categoria e dependências para garantir integridade referencial antes do upsert
      if (entity === 'transactions' && dbData?.category_id) {
        try {
          const localCats = JSON.parse(localStorage.getItem(STORAGE_KEYS.categories) || '[]');
          const catObj = localCats.find((c) => c.id === dbData.category_id);
          if (catObj) {
            if (catObj.parentId) {
              const parentCat = localCats.find((c) => c.id === catObj.parentId);
              if (parentCat) {
                await supabase.from('categories').upsert(categoryToDb(parentCat));
                clearCategoryPending(parentCat.id);
              }
            }
            await supabase.from('categories').upsert(categoryToDb(catObj));
            clearCategoryPending(catObj.id);
          }
        } catch (catErr) {
          console.warn('Aviso ao sincronizar categoria prévia:', catErr);
        }
      }

      if (entity === 'transactions' && dbData?.card_id) {
        try {
          const localCards = JSON.parse(localStorage.getItem(STORAGE_KEYS.cards) || '[]');
          const cardObj = localCards.find((c) => c.id === dbData.card_id);
          if (cardObj) {
            await supabase.from('cards').upsert(cardToDb(cardObj));
          }
        } catch (cardErr) {
          console.warn('Aviso ao sincronizar cartão prévio:', cardErr);
        }
      }

      if (dbData) {
        let res = await supabase.from(targetTable).upsert(dbData);
        if (res?.error) {
          // Tentar update direto por ID se o upsert der erro
          if (entity === 'transactions') {
            const updateRes = await supabase.from('transactions').update(dbData).eq('id', dbData.id);
            if (!updateRes?.error) {
              clearTransactionPending(item.id);
              return { success: true };
            }
          }

          console.warn(`Erro ao sincronizar ${targetTable} no Supabase:`, res.error.message);

          // 1. Fallback para categorias caso colunas opcionais faltem no Supabase
          if (entity === 'categories') {
            markCategoryPending(item.id);
            if (res.error.code === '42703' || String(res.error.message || '').includes('budget_limit_cents') || String(res.error.message || '').includes('parent_id')) {
              const fallbackData = {
                id: dbData.id,
                name: dbData.name,
                type: dbData.type,
                color: dbData.color,
                archived: dbData.archived,
              };
              if (!String(res.error.message || '').includes('budget_limit_cents')) {
                fallbackData.budget_limit_cents = dbData.budget_limit_cents;
              }
              if (!String(res.error.message || '').includes('parent_id') && dbData.parent_id) {
                fallbackData.parent_id = dbData.parent_id;
              }
              const retryRes = await supabase.from('categories').upsert(fallbackData);
              if (!retryRes?.error) {
                clearCategoryPending(item.id);
                return { success: true };
              }
              const basicData = {
                id: dbData.id,
                name: dbData.name,
                type: dbData.type,
                color: dbData.color,
                archived: dbData.archived,
              };
              const basicRes = await supabase.from('categories').upsert(basicData);
              if (!basicRes?.error) {
                clearCategoryPending(item.id);
                return { success: true };
              }
            }
            return { success: false, error: res.error };
          }

          // 2. Auto-cura de Chave Estrangeira para Transações: se o erro for 23503 ou menção a category/foreign key
          if (entity === 'transactions' && (res.error.code === '23503' || String(res.error.message || '').includes('category') || String(res.error.message || '').includes('foreign key') || String(res.error.message || '').includes('parent_id'))) {
            try {
              const localCats = JSON.parse(localStorage.getItem(STORAGE_KEYS.categories) || '[]');
              const catObj = localCats.find((c) => c.id === dbData.category_id);
              if (catObj) {
                if (catObj.parentId) {
                  const parentCat = localCats.find((c) => c.id === catObj.parentId);
                  if (parentCat) {
                    await supabase.from('categories').upsert(categoryToDb(parentCat));
                    clearCategoryPending(parentCat.id);
                  }
                }
                console.log(`Auto-sincronizando categoria "${catObj.name}" (${catObj.id}) no Supabase para resolver chave estrangeira da transação...`);
                await supabase.from('categories').upsert(categoryToDb(catObj));
                clearCategoryPending(catObj.id);
                const retryRes = await supabase.from('transactions').upsert(dbData);
                if (!retryRes?.error) {
                  clearTransactionPending(item.id);
                  console.log('Transação sincronizada com sucesso após auto-cura da categoria!');
                  return { success: true };
                }
                res = retryRes;
              }
            } catch (healErr) {
              console.warn('Falha na auto-cura de categoria para transação:', healErr);
            }
          }

          // 2.1 Fallback para destination_account_id ou restrição CHECK de tipo TRANSFER (caso a migration ainda não tenha sido rodada no Supabase)
          if (
            entity === 'transactions' &&
            (res.error.code === '42703' ||
              res.error.code === '23514' ||
              String(res.error.message || '').includes('destination_account_id') ||
              String(res.error.message || '').includes('transactions_type_check'))
          ) {
            try {
              const fallbackTx = { ...dbData };
              if (String(res.error.message || '').includes('destination_account_id') || res.error.code === '42703') {
                delete fallbackTx.destination_account_id;
                if (!fallbackTx.recurrence_rule_id && item.destinationAccountId) {
                  fallbackTx.recurrence_rule_id = `TRANSFER_DEST:${item.destinationAccountId}`;
                }
              }
              if (String(res.error.message || '').includes('transactions_type_check') || (res.error.code === '23514' && fallbackTx.type === 'TRANSFER')) {
                fallbackTx.type = 'EXPENSE';
                if (!fallbackTx.recurrence_rule_id && item.destinationAccountId) {
                  fallbackTx.recurrence_rule_id = `TRANSFER_DEST:${item.destinationAccountId}`;
                }
              }
              const retryRes = await supabase.from('transactions').upsert(fallbackTx);
              if (!retryRes?.error) {
                clearTransactionPending(item.id);
                return { success: true };
              }
            } catch (fbErr) {
              console.warn('Falha no fallback de transferência para Supabase:', fbErr);
            }
          }

          // 3. Fallback para cenários caso coluna adjustments não exista no Supabase (código 42703)
          if (entity === 'scenarios' && (res.error.code === '42703' || String(res.error.message || '').includes('adjustments'))) {
            const { adjustments, ...fallbackScen } = dbData;
            const retryRes = await supabase.from('scenarios').upsert(fallbackScen);
            if (!retryRes?.error) {
              return { success: true };
            }
          }

          return { success: false, error: res.error };
        } else {
          if (entity === 'categories') {
            clearCategoryPending(item.id);
          }
          if (entity === 'transactions') {
            clearTransactionPending(item.id);
          }
          return { success: true };
        }
      }
      return { success: true };
    }
  } catch (err) {
    console.error(`Erro ao sincronizar ${entity} no Supabase:`, err);
    return { success: false, error: err };
  }
};

export const syncBatchTransactions = async (txList, isDelete = false) => {
  if (isDemoMode()) return { success: true };
  const isCloud = isSupabaseConfigured() && supabase;
  if (!isCloud || !txList?.length) return { success: true };

  try {
    if (isDelete) {
      const ids = txList.map((t) => t.id);
      await supabase.from('transactions').delete().in('id', ids);
      ids.forEach(clearTransactionPending);
      return { success: true };
    } else {
      txList.forEach((t) => markTransactionPending(t.id));
      const dbList = txList.map(transactionToDb);

      // Pré-sincronizar categorias utilizadas no lote (pais primeiro, depois filhos)
      try {
        const localCats = JSON.parse(localStorage.getItem(STORAGE_KEYS.categories) || '[]');
        const catMap = new Map(localCats.map((c) => [c.id, c]));
        const usedCatIds = new Set(dbList.map((t) => t.category_id).filter(Boolean));
        const parentsToSync = [];
        const childrenToSync = [];
        usedCatIds.forEach((cid) => {
          const cat = catMap.get(cid);
          if (cat) {
            if (cat.parentId) {
              const p = catMap.get(cat.parentId);
              if (p && !parentsToSync.some((x) => x.id === p.id)) parentsToSync.push(categoryToDb(p));
              if (!childrenToSync.some((x) => x.id === cat.id)) childrenToSync.push(categoryToDb(cat));
            } else {
              if (!parentsToSync.some((x) => x.id === cat.id)) parentsToSync.push(categoryToDb(cat));
            }
          }
        });
        if (parentsToSync.length > 0) await supabase.from('categories').upsert(parentsToSync);
        if (childrenToSync.length > 0) await supabase.from('categories').upsert(childrenToSync);
      } catch (catBatchErr) {
        console.warn('Aviso ao sincronizar categorias para lote:', catBatchErr);
      }

      let res = await supabase.from('transactions').upsert(dbList);
      if (res?.error) {
        if (
          res.error.code === '42703' ||
          res.error.code === '23514' ||
          String(res.error.message || '').includes('destination_account_id') ||
          String(res.error.message || '').includes('transactions_type_check')
        ) {
          const fallbackList = dbList.map((dbData, idx) => {
            const copy = { ...dbData };
            const origItem = txList[idx];
            if (copy.destination_account_id) {
              if (!copy.recurrence_rule_id && origItem?.destinationAccountId) {
                copy.recurrence_rule_id = `TRANSFER_DEST:${origItem.destinationAccountId}`;
              }
              delete copy.destination_account_id;
            }
            if (copy.type === 'TRANSFER') {
              copy.type = 'EXPENSE';
              if (!copy.recurrence_rule_id && origItem?.destinationAccountId) {
                copy.recurrence_rule_id = `TRANSFER_DEST:${origItem.destinationAccountId}`;
              }
            }
            return copy;
          });
          const retryRes = await supabase.from('transactions').upsert(fallbackList);
          if (!retryRes?.error) {
            txList.forEach((t) => clearTransactionPending(t.id));
            return { success: true };
          }
        }
        console.warn('Erro ao sincronizar lote de transações no Supabase:', res.error.message);
        return { success: false, error: res.error };
      }
      txList.forEach((t) => clearTransactionPending(t.id));
      return { success: true };
    }
  } catch (err) {
    console.error('Erro ao sincronizar lote de transações:', err);
    return { success: false, error: err };
  }
};

export const syncBatchMonthlyEnvelopes = async (envList, isDelete = false) => {
  if (isDemoMode()) return;
  const isCloud = isSupabaseConfigured() && supabase;
  if (!isCloud || !envList?.length) return;

  try {
    if (isDelete) {
      const ids = envList.map((e) => e.id);
      await supabase.from('monthly_envelopes').delete().in('id', ids);
    } else {
      const dbList = envList.map(monthlyEnvelopeToDb);
      const res = await supabase.from('monthly_envelopes').upsert(dbList);
      if (res?.error) {
        console.warn('Erro ao sincronizar lote de envelopes no Supabase:', res.error.message);
      }
    }
  } catch (err) {
    console.error('Erro ao sincronizar lote de envelopes no Supabase:', err);
  }
};


export const saveToLocalStorage = (key, data) => {
  try {
    if (isDemoMode()) {
      sessionStorage.setItem('demo_' + key, JSON.stringify(data));
      return;
    }
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.warn('Erro ao salvar no storage:', e);
  }
};

/**
 * Auto-recuperação (Self-Healing) e reparo de integridade contábil para compras de cartão de crédito.
 * 1. Garante consistência de dueDate e purchaseDate para todos os lançamentos.
 * 2. Repara compras e parcelas de cartão que foram indevidamente alteradas ou forçadas para meses anteriores.
 * 3. Restaura parcelas futuras para seus meses corretos de vencimento com status 'COMPROMETIDO'.
 */
export const healMigratedInvoiceTransactions = (txList = [], cards = []) => {
  if (!Array.isArray(txList) || txList.length === 0) {
    return { healedTransactions: txList || [], hasChanges: false, changedTxs: [] };
  }

  const cardMap = new Map((cards || []).map((c) => [c.id, c]));
  let hasChanges = false;
  const changedTxs = [];

  // Mapear primeiro as 1ªs parcelas do grupo, prefixo de ID ou descrição para cálculo relativo seguro
  const groupFirstMap = new Map();
  const idBaseFirstMap = new Map();
  const descFirstMap = new Map();

  txList.forEach((t) => {
    if (!t.cardId || t.status === 'CANCELADO') return;
    const isFirst =
      t.installmentNumber === 1 ||
      String(t.id).endsWith('-1') ||
      String(t.id).includes('-p1-') ||
      /\(0?1\/\d+\)/.test(t.description || '');

    if (isFirst) {
      if (t.installmentGroupId) {
        groupFirstMap.set(t.installmentGroupId, t);
      }
      const idBaseMatch = String(t.id).match(/^(tx(?:-imp)?-[a-zA-Z0-9_-]+)-(?:p)?\d+$/);
      if (idBaseMatch) {
        idBaseFirstMap.set(idBaseMatch[1], t);
      }
      const cleanDesc = (t.description || '').replace(/\s*\(\d+\/\d+\)/, '').replace(/parcela\s+\d+\s+de\s+\d+/i, '').trim().toLowerCase();
      if (cleanDesc) {
        const count = t.installmentCount || '';
        descFirstMap.set(`${t.cardId}_${cleanDesc}_${count}`, t);
        descFirstMap.set(`${t.cardId}_${cleanDesc}`, t);
      }
    }
  });

  const SEPT_2026_RECONCILIATION_MAP = {
    // 1. Itaú Master Black 8557: 9 itens da fatura de setembro de 2026
    'tx-imp-1789533531029-0-vsio': { dueDate: '2026-09-22', date: '2026-09-22', status: 'REALIZADO' }, // EDUCA MAIS BRA (R$ 71.61)
    'tx-imp-1789533531029-1-bl71': { dueDate: '2026-09-22', date: '2026-09-22', status: 'REALIZADO' }, // MP *ORALGLASS (R$ 456.74)
    'tx-imp-1789533531029-2-tuvn': { dueDate: '2026-09-22', date: '2026-09-22', status: 'REALIZADO' }, // POINT ACADEMIA (R$ 198.00)
    'tx-imp-1789533531030-3-2iu6': { dueDate: '2026-09-22', date: '2026-09-22', status: 'REALIZADO' }, // Q OCULOS (R$ 33.92)
    'tx-imp-1789533531030-4-ohlp': { dueDate: '2026-09-22', date: '2026-09-22', status: 'REALIZADO' }, // PG *UNIVERSAL (R$ 9.98)
    'tx-imp-1789533531030-5-fy0j': { dueDate: '2026-09-22', date: '2026-09-22', status: 'REALIZADO' }, // PG *TORO INVES (R$ 19.99)
    'tx-imp-1789533531031-6-7mgl': { dueDate: '2026-09-22', date: '2026-09-22', status: 'REALIZADO' }, // HAVAN FLORIPA (R$ 49.99)
    'tx-imp-1789533531031-7-5smo': { dueDate: '2026-09-22', date: '2026-09-22', status: 'REALIZADO' }, // HAVAN FLORIPA (R$ 55.58)
    'tx-imp-1789533531031-8-f5h4': { dueDate: '2026-09-22', date: '2026-09-22', status: 'REALIZADO' }, // CONSTANCE (R$ 87.99)

    // Itaú Master Black 8557: parcelas futuras subsequentes alinhadas mês a mês
    'tx-imp-1789533531030-2-p12-2t4s': { dueDate: '2026-10-22', date: '2026-10-22' },
    'tx-imp-1789533531030-3-p10-imgb': { dueDate: '2026-10-22', date: '2026-10-22' },
    'tx-imp-1789533531030-4-p10-dyiz': { dueDate: '2026-10-22', date: '2026-10-22' },
    'tx-imp-1789533531030-5-p9-k1vx': { dueDate: '2026-10-22', date: '2026-10-22' },
    'tx-imp-1789533531030-5-p10-r0y1': { dueDate: '2026-11-22', date: '2026-11-22' },
    'tx-imp-1789533531030-5-p11-ocqv': { dueDate: '2026-12-22', date: '2026-12-22' },
    'tx-imp-1789533531031-5-p12-3tgp': { dueDate: '2027-01-22', date: '2027-01-22' },
    'tx-imp-1789533531031-6-p9-92ru': { dueDate: '2026-10-22', date: '2026-10-22' },
    'tx-imp-1789533531031-6-p10-79oj': { dueDate: '2026-11-22', date: '2026-11-22' },
    'tx-imp-1789533531031-7-p8-a7nz': { dueDate: '2026-10-22', date: '2026-10-22' },
    'tx-imp-1789533531031-7-p9-7ows': { dueDate: '2026-11-22', date: '2026-11-22' },
    'tx-imp-1789533531031-7-p10-q6bf': { dueDate: '2026-12-22', date: '2026-12-22' },

    // 2. Itaú Master Mult Black 3740: GIASSI SUPERME na fatura de setembro de 2026
    'tx-imp-1789533078949-0-56vo': { dueDate: '2026-09-22', date: '2026-09-22', status: 'REALIZADO' },
    'tx-imp-1789533078949-0-p10-tp0l': { dueDate: '2026-10-22', date: '2026-10-22' },

    // 3. Nubank 1742: Canva (04/12) na fatura de setembro de 2026 e subsequentes consecutivas
    'tx-1789610491187-4': { dueDate: '2026-09-23', date: '2026-09-23', status: 'REALIZADO' },
    'tx-1789610491187-5': { dueDate: '2026-10-23', date: '2026-10-23' },
    'tx-1789610491187-6': { dueDate: '2026-11-23', date: '2026-11-23' },
    'tx-1789610491187-7': { dueDate: '2026-12-23', date: '2026-12-23' },
    'tx-1789610491187-8': { dueDate: '2027-01-23', date: '2027-01-23' },
    'tx-1789610491187-9': { dueDate: '2027-02-23', date: '2027-02-23' },
    'tx-1789610491187-10': { dueDate: '2027-03-23', date: '2027-03-23' },
    'tx-1789610491187-11': { dueDate: '2027-04-23', date: '2027-04-23' },
    'tx-1789610491187-12': { dueDate: '2027-05-23', date: '2027-05-23' },

    // 4. Mercado Livre 2166: Compras na fatura de setembro de 2026
    'tx-imp-1789532819072-4-yemm': { dueDate: '2026-09-14', date: '2026-09-14', status: 'REALIZADO' },
    'tx-imp-1789532819072-5-1ib1': { dueDate: '2026-09-14', date: '2026-09-14', status: 'REALIZADO' },
    'tx-imp-1789532819073-5-p3-i2ox': { dueDate: '2026-10-14', date: '2026-10-14' },
    'tx-imp-1789532819073-5-p4-otg0': { dueDate: '2026-11-14', date: '2026-11-14' },
    'tx-imp-1789532819073-5-p5-mqne': { dueDate: '2026-12-14', date: '2026-12-14' },

    // 5. Itaú Visa Infinite 8476: Quitar OLX da fatura de setembro
    'tx-imp-1789602105891-0-p10-jjoc': { status: 'REALIZADO' },

    // 6. Inter Dé Mastercard 8682: Parcelas consecutivas mensais Hotel Estância
    'tx-1790284585790-3': { dueDate: '2026-10-22', date: '2026-10-22' },
    'tx-1790284585790-4': { dueDate: '2026-11-22', date: '2026-11-22' },
    'tx-1790284585790-5': { dueDate: '2026-12-22', date: '2026-12-22' },
    'tx-1790284585790-6': { dueDate: '2027-01-22', date: '2027-01-22' },
    'tx-1790284585790-7': { dueDate: '2027-02-22', date: '2027-02-22' },
    'tx-1790284585790-8': { dueDate: '2027-03-22', date: '2027-03-22' },
    'tx-1790284585790-9': { dueDate: '2027-04-22', date: '2027-04-22' },
    'tx-1790284585790-10': { dueDate: '2027-05-22', date: '2027-05-22' }
  };

  const healedTransactions = txList.map((t) => {
    // Aplicação prioritária de reconciliação de integridade contábil
    if (SEPT_2026_RECONCILIATION_MAP[t.id]) {
      const overrides = SEPT_2026_RECONCILIATION_MAP[t.id];
      let needsOverride = false;
      for (const [prop, val] of Object.entries(overrides)) {
        if (t[prop] !== val) {
          needsOverride = true;
          break;
        }
      }
      if (needsOverride) {
        hasChanges = true;
        const reconciled = {
          ...t,
          ...overrides,
          _localUpdatedAt: Date.now(),
        };
        changedTxs.push(reconciled);
        return reconciled;
      }
    }

    const baseDueDate = t.dueDate || t.date;
    const basePurchaseDate = t.purchaseDate || t.date;

    // Apenas compras normais de cartão de crédito ativas (ignora pagamentos técnicos de fatura, cancelados e importados de faturas oficiais)
    if (!t.cardId || t.isInvoicePayment || t.status === 'CANCELADO' || String(t.id).startsWith('tx-imp-')) {
      if (!t.dueDate || !t.purchaseDate) {
        return { ...t, dueDate: baseDueDate, purchaseDate: basePurchaseDate };
      }
      return t;
    }

    const card = cardMap.get(t.cardId);
    const safeClosing = card?.closingDay || 25;
    const safeDue = card?.dueDay || 5;

    // Extrair número e total da parcela se existirem
    let instNum = t.installmentNumber;
    let instTotal = t.installmentCount;
    if (!instNum) {
      const match = (t.description || '').match(/\((\d+)\/(\d+)\)/) || (t.description || '').match(/parcela\s+(\d+)\s+de\s+(\d+)/i);
      if (match) {
        instNum = parseInt(match[1], 10);
        instTotal = parseInt(match[2], 10);
      }
    }

    // Calcular vencimento esperado correto
    let expectedDueDate = null;

    // 1. Tentar obter a partir da 1ª parcela do mesmo grupo
    if (instNum && instNum > 1 && t.installmentGroupId && groupFirstMap.has(t.installmentGroupId)) {
      const firstTx = groupFirstMap.get(t.installmentGroupId);
      const firstDue = firstTx.dueDate || firstTx.date;
      if (firstDue) {
        expectedDueDate = addMonthsToIso(firstDue, instNum - 1);
      }
    }

    // 2. Tentar obter a partir do prefixo base de ID da 1ª parcela
    if (!expectedDueDate && instNum && instNum > 1) {
      const idBaseMatch = String(t.id).match(/^(tx(?:-imp)?-[a-zA-Z0-9_-]+)-(?:p)?\d+$/);
      if (idBaseMatch && idBaseFirstMap.has(idBaseMatch[1])) {
        const firstTx = idBaseFirstMap.get(idBaseMatch[1]);
        const firstDue = firstTx.dueDate || firstTx.date;
        if (firstDue) {
          expectedDueDate = addMonthsToIso(firstDue, instNum - 1);
        }
      }
    }

    // 3. Tentar obter a partir da 1ª parcela da mesma descrição e cartão
    if (!expectedDueDate && instNum && instNum > 1) {
      const cleanDesc = (t.description || '').replace(/\s*\(\d+\/\d+\)/, '').replace(/parcela\s+\d+\s+de\s+\d+/i, '').trim().toLowerCase();
      if (cleanDesc) {
        const firstTx = descFirstMap.get(`${t.cardId}_${cleanDesc}_${instTotal || ''}`) || descFirstMap.get(`${t.cardId}_${cleanDesc}`);
        if (firstTx) {
          const firstDue = firstTx.dueDate || firstTx.date;
          if (firstDue) {
            expectedDueDate = addMonthsToIso(firstDue, instNum - 1);
          }
        }
      }
    }

    // 4. Fallback: calcular via purchaseDate + closing/due day (Apenas se não possuir baseDueDate válida)
    if (!expectedDueDate && basePurchaseDate) {
      const calcDue = calculateCardDueDate(basePurchaseDate, safeClosing, safeDue);
      if (instNum && instNum > 1) {
        if (baseDueDate) {
          expectedDueDate = baseDueDate;
        } else {
          expectedDueDate = calcDue;
        }
      } else {
        expectedDueDate = calcDue;
      }
    }

    if (expectedDueDate) {
      const currentDueMonth = baseDueDate ? baseDueDate.slice(0, 7) : '';
      const expectedDueMonth = expectedDueDate.slice(0, 7);
      // Condições de corrupção:
      // a) Parcela N > 1 cuja competência (mês) difere do mês real esperado (ex: jogada para setembro em vez de novembro)
      // b) Compra com vencimento anterior à data em que foi comprada
      const isWrongInstallmentMonth = instNum && instNum > 1 && currentDueMonth && currentDueMonth !== expectedDueMonth;
      const isDueBeforePurchase = basePurchaseDate && baseDueDate && baseDueDate < basePurchaseDate;

      if (isWrongInstallmentMonth || isDueBeforePurchase) {
        hasChanges = true;
        const todayStr = new Date().toISOString().slice(0, 10);
        // Se a parcela corrigida tiver vencimento futuro ou atual não vencido, reverte para COMPROMETIDO
        const newStatus = expectedDueDate >= todayStr ? 'COMPROMETIDO' : t.status;

        const repaired = {
          ...t,
          date: expectedDueDate,
          dueDate: expectedDueDate,
          purchaseDate: basePurchaseDate,
          installmentNumber: instNum || t.installmentNumber,
          installmentCount: instTotal || t.installmentCount,
          status: newStatus,
          _localUpdatedAt: Date.now(),
        };

        changedTxs.push(repaired);
        return repaired;
      }
    }

    if (!t.dueDate || !t.purchaseDate) {
      return { ...t, dueDate: baseDueDate, purchaseDate: basePurchaseDate };
    }
    return t;
  });

  return { healedTransactions, hasChanges, changedTxs };
};
