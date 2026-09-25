import { supabase, isSupabaseConfigured } from './supabase.js';
import { calculateCardDueDate, addMonthsToIso } from '../utils/formatters.js';
import {
  DEMO_ACCOUNTS,
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

  return {
    id: row.id,
    description: row.description,
    amountCents: Number(row.amount_cents ?? row.amountCents ?? 0),
    type: row.type || 'EXPENSE',
    status: row.status || 'COMPROMETIDO',
    date: row.date,
    dueDate: dueDate || row.date,
    purchaseDate: purchaseDate || row.date,
    accountId: row.account_id || row.accountId || null,
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
      isInvoicePayment || (typeof recRule === 'string' && (recRule.startsWith('PURCHASE_DATE:') || recRule.startsWith('INVOICE_PAY:')))
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
  }

  const obj = {
    id: tx.id,
    description: tx.description,
    amount_cents: tx.amountCents,
    type: tx.type,
    status: tx.status,
    date: tx.dueDate || tx.date,
    account_id: tx.accountId || null,
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
      const [accRes, cardRes, catRes, txRes, scenRes, envRes] = await Promise.all([
        supabase.from('accounts').select('*').order('created_at', { ascending: true }),
        supabase.from('cards').select('*').order('created_at', { ascending: true }),
        supabase.from('categories').select('*').order('name', { ascending: true }),
        supabase.from('transactions').select('*').order('date', { ascending: false }),
        supabase.from('scenarios').select('*').order('created_at', { ascending: true }),
        supabase.from('monthly_envelopes').select('*'),
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

      // Retorna exatamente os dados reais do banco (SEM injetar transações ou simulações fictícias)
      return {
        isCloud: true,
        accounts,
        cards,
        categories: allMergedCats,
        transactions,
        scenarios,
        monthlyEnvelopes: mergedEnvelopes,
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
  };
};

export const loadDemoPresentationData = async (demo) => {
  if (isDemoMode()) {
    saveToLocalStorage(STORAGE_KEYS.accounts, demo.accounts || []);
    saveToLocalStorage(STORAGE_KEYS.cards, demo.cards || []);
    saveToLocalStorage(STORAGE_KEYS.categories, demo.categories || []);
    saveToLocalStorage(STORAGE_KEYS.transactions, demo.transactions || []);
    saveToLocalStorage(STORAGE_KEYS.scenarios, demo.scenarios || []);
    saveToLocalStorage(STORAGE_KEYS.monthlyEnvelopes, demo.monthlyEnvelopes || []);
    sessionStorage.setItem('financas_demo_loaded', 'true');

    return {
      accounts: demo.accounts || [],
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
      if (demo.cards?.length) await supabase.from('cards').upsert(demo.cards.map(cardToDb));
      if (demo.transactions?.length) await supabase.from('transactions').upsert(demo.transactions.map(transactionToDb));
      if (demo.scenarios?.length) await supabase.from('scenarios').upsert(demo.scenarios.map(scenarioToDb));
    } catch (e) {
      console.error('Erro ao carregar demo no Supabase:', e);
    }
  }

  localStorage.setItem(STORAGE_KEYS.accounts, JSON.stringify(demo.accounts || []));
  localStorage.setItem(STORAGE_KEYS.cards, JSON.stringify(demo.cards || []));
  localStorage.setItem(STORAGE_KEYS.categories, JSON.stringify(demo.categories || []));
  localStorage.setItem(STORAGE_KEYS.transactions, JSON.stringify(demo.transactions || []));
  localStorage.setItem(STORAGE_KEYS.scenarios, JSON.stringify(demo.scenarios || []));
  localStorage.setItem('financas_demo_loaded', 'true');

  return {
    accounts: demo.accounts || [],
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
}) => {
  const isCloud = isSupabaseConfigured() && supabase;

  const demoTxIds = transactions.filter((t) => String(t.id || '').startsWith('demo-')).map((t) => t.id);
  const demoScenIds = scenarios.filter((s) => String(s.id || '').startsWith('demo-')).map((s) => s.id);
  const demoAccIds = accounts.filter((a) => String(a.id || '').startsWith('demo-')).map((a) => a.id);
  const demoCardIds = cards.filter((c) => String(c.id || '').startsWith('demo-')).map((c) => c.id);

  if (isCloud) {
    try {
      if (demoTxIds.length) await supabase.from('transactions').delete().in('id', demoTxIds);
      if (demoScenIds.length) await supabase.from('scenarios').delete().in('id', demoScenIds);
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

  localStorage.setItem(STORAGE_KEYS.transactions, JSON.stringify(remainingTransactions));
  localStorage.setItem(STORAGE_KEYS.scenarios, JSON.stringify(remainingScenarios));
  localStorage.setItem(STORAGE_KEYS.accounts, JSON.stringify(remainingAccounts));
  localStorage.setItem(STORAGE_KEYS.cards, JSON.stringify(remainingCards));
  localStorage.removeItem('financas_demo_loaded');
  localStorage.setItem('financas_initialized', 'true');

  return {
    transactions: remainingTransactions,
    scenarios: remainingScenarios,
    accounts: remainingAccounts,
    cards: remainingCards,
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
  localStorage.setItem(STORAGE_KEYS.cards, JSON.stringify([]));
  localStorage.setItem(STORAGE_KEYS.monthlyEnvelopes, JSON.stringify([]));
  localStorage.removeItem('financas_demo_loaded');
  localStorage.setItem('financas_initialized', 'true');

  return {
    transactions: [],
    scenarios: [],
    accounts: [],
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
    const targetTable = (entity === 'monthlyEnvelopes' || entity === 'monthly_envelopes') ? 'monthly_envelopes' : entity;

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

  const healedTransactions = txList.map((t) => {
    const baseDueDate = t.dueDate || t.date;
    const basePurchaseDate = t.purchaseDate || t.date;

    // Apenas compras normais de cartão de crédito ativas (ignora pagamentos técnicos de fatura e cancelados)
    if (!t.cardId || t.isInvoicePayment || t.status === 'CANCELADO') {
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

    // 4. Fallback: calcular via purchaseDate + closing/due day
    if (!expectedDueDate && basePurchaseDate) {
      const calcDue = calculateCardDueDate(basePurchaseDate, safeClosing, safeDue);
      if (instNum && instNum > 1) {
        // Se a data de compra já é posterior ao vencimento atual, a data de compra foi registrada como mês da parcela
        if (baseDueDate && basePurchaseDate > baseDueDate) {
          expectedDueDate = calcDue;
        } else {
          expectedDueDate = addMonthsToIso(calcDue, instNum - 1);
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
