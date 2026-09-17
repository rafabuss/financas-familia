import { supabase, isSupabaseConfigured } from './supabase.js';

export const STORAGE_KEYS = {
  accounts: 'financas_accounts_v1',
  cards: 'financas_cards_v1',
  categories: 'financas_categories_v1',
  transactions: 'financas_transactions_v1',
  scenarios: 'financas_scenarios_v1',
  monthlyEnvelopes: 'financas_monthly_envelopes_v1',
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
  budgetLimitCents: Number(row.budget_limit_cents ?? row.budgetLimitCents ?? 0),
});

export const categoryToDb = (cat) => ({
  id: cat.id,
  name: cat.name,
  type: cat.type,
  color: cat.color,
  archived: cat.archived,
  budget_limit_cents: Number(cat.budgetLimitCents || 0),
});

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

  return {
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
    owner_id: tx.ownerId,
    installment_group_id: tx.installmentGroupId || null,
    installment_number: tx.installmentNumber || null,
    installment_count: tx.installmentCount || null,
    is_recurring: Boolean(tx.isRecurring),
    recurrence_rule_id: recurrenceRuleId,
  };
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

export const monthlyEnvelopeToClient = (row) => ({
  id: row.id,
  categoryId: row.category_id || row.categoryId,
  monthKey: row.month_key || row.monthKey,
  amountCents: Number(row.amount_cents ?? row.amountCents ?? 0),
  ruleId: row.rule_id || row.ruleId || null,
  createdAt: row.created_at || row.createdAt || new Date().toISOString(),
});

export const monthlyEnvelopeToDb = (env) => ({
  id: env.id,
  category_id: env.categoryId,
  month_key: env.monthKey,
  amount_cents: env.amountCents,
  rule_id: env.ruleId || null,
});

// ==========================================
// CARREGAMENTO INICIAL UNIFICADO
// ==========================================

export const loadInitialAppData = async (defaults = {}) => {
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
      const [accRes, cardRes, catRes, txRes, scenRes] = await Promise.all([
        supabase.from('accounts').select('*').order('created_at', { ascending: true }),
        supabase.from('cards').select('*').order('created_at', { ascending: true }),
        supabase.from('categories').select('*').order('name', { ascending: true }),
        supabase.from('transactions').select('*').order('date', { ascending: false }),
        supabase.from('scenarios').select('*').order('created_at', { ascending: true }),
      ]);

      // Se as categorias estiverem vazias, faz o seed apenas de categorias essenciais
      if (!catRes.data || catRes.data.length === 0) {
        if (defaults.categories?.length) {
          try {
            await supabase.from('categories').upsert(defaults.categories.map(categoryToDb));
          } catch (e) {
            console.warn('Erro ao inserir categorias padrão:', e);
          }
        }
      }

      // Retorna exatamente os dados reais do banco (SEM injetar transações ou simulações fictícias)
      return {
        isCloud: true,
        accounts: (accRes.data || []).map(accountToClient),
        cards: (cardRes.data || []).map(cardToClient),
        categories: ((catRes.data?.length ? catRes.data : defaults.categories) || []).map(categoryToClient),
        transactions: (txRes.data || []).map(transactionToClient),
        scenarios: (scenRes.data || []).map(scenarioToClient),
        monthlyEnvelopes: getLocal(STORAGE_KEYS.monthlyEnvelopes, []).map(monthlyEnvelopeToClient),
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
      else if (entity === 'monthlyEnvelopes' || entity === 'monthly_envelopes') dbData = monthlyEnvelopeToDb(item);

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

export const syncBatchMonthlyEnvelopes = async (envList, isDelete = false) => {
  const isCloud = isSupabaseConfigured() && supabase;
  if (!isCloud || !envList?.length) return;

  try {
    if (isDelete) {
      const ids = envList.map((e) => e.id);
      await supabase.from('monthly_envelopes').delete().in('id', ids);
    } else {
      const dbList = envList.map(monthlyEnvelopeToDb);
      await supabase.from('monthly_envelopes').upsert(dbList);
    }
  } catch (err) {
    console.error('Erro ao sincronizar lote de envelopes no Supabase:', err);
  }
};


export const saveToLocalStorage = (key, data) => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.warn('Erro ao salvar no localStorage:', e);
  }
};

/**
 * Auto-recuperação (Self-Healing) de lançamentos de fatura indevidamente migrados para o mês seguinte.
 * Detecta itens de cartão que pertenciam a uma fatura que já possui pagamento registrado no mês anterior
 * e restaura seu vencimento contábil e status para 'REALIZADO'.
 */
export const healMigratedInvoiceTransactions = (txList, cards = []) => {
  if (!Array.isArray(txList) || txList.length === 0) {
    return { healedTransactions: txList || [], hasChanges: false, changedTxs: [] };
  }

  // 1. Localizar pagamentos de fatura
  const paymentTxs = txList.filter(
    (t) => t.isInvoicePayment && t.targetCardId && t.invoiceMonth && t.status !== 'CANCELADO'
  );

  if (paymentTxs.length === 0) {
    let patched = false;
    const normalized = txList.map((t) => {
      let changed = false;
      const u = { ...t };
      if (!u.dueDate) {
        u.dueDate = u.date;
        changed = true;
      }
      if (!u.purchaseDate) {
        u.purchaseDate = u.date;
        changed = true;
      }
      if (changed) patched = true;
      return u;
    });
    return { healedTransactions: normalized, hasChanges: patched, changedTxs: [] };
  }

  let hasChanges = false;
  const changedTxs = [];

  const healedTransactions = txList.map((t) => {
    const baseDueDate = t.dueDate || t.date;
    const basePurchaseDate = t.purchaseDate || t.date;

    // Apenas compras de cartão de crédito ativas
    if (!t.cardId || t.status === 'CANCELADO') {
      if (!t.dueDate || !t.purchaseDate) {
        return { ...t, dueDate: baseDueDate, purchaseDate: basePurchaseDate };
      }
      return t;
    }

    // Parcelas futuras legítimas geradas com -p3, -p4, etc. e installmentNumber > 1 não devem ser retrocedidas
    if (String(t.id).includes('-p') && t.installmentNumber && t.installmentNumber > 1) {
      if (!t.dueDate || !t.purchaseDate) {
        return { ...t, dueDate: baseDueDate, purchaseDate: basePurchaseDate };
      }
      return t;
    }

    // Lançamentos recorrentes agendados para meses futuros nunca devem ser retrocedidos para um mês já pago
    if (t.isRecurring || (t.recurrenceRuleId && !String(t.recurrenceRuleId).startsWith('PURCHASE_DATE:'))) {
      if (!t.dueDate || !t.purchaseDate) {
        return { ...t, dueDate: baseDueDate, purchaseDate: basePurchaseDate };
      }
      return t;
    }

    const currentDueMonth = baseDueDate.slice(0, 7);
    const purchaseMonth = basePurchaseDate.slice(0, 7);

    // Procura se há um pagamento para este cartão referente a um mês anterior ao vencimento atual,
    // onde a compra ocorreu no mês daquele pagamento (ou antes)
    const matchingPayment = paymentTxs.find((p) => {
      if (p.targetCardId !== t.cardId) return false;
      return p.invoiceMonth < currentDueMonth && purchaseMonth <= p.invoiceMonth;
    });

    if (matchingPayment) {
      // O item pertencia à fatura paga em matchingPayment.invoiceMonth!
      const card = cards.find((c) => c.id === t.cardId);
      const safeDueDay = card?.dueDay
        ? String(Math.min(28, card.dueDay)).padStart(2, '0')
        : (matchingPayment.date ? matchingPayment.date.slice(8, 10) : baseDueDate.slice(8, 10));
      const healedDueDate = `${matchingPayment.invoiceMonth}-${safeDueDay}`;

      hasChanges = true;
      const healed = {
        ...t,
        date: healedDueDate,
        dueDate: healedDueDate,
        purchaseDate: basePurchaseDate,
        status: 'REALIZADO',
      };
      changedTxs.push(healed);
      return healed;
    }

    if (!t.dueDate || !t.purchaseDate) {
      return { ...t, dueDate: baseDueDate, purchaseDate: basePurchaseDate };
    }
    return t;
  });

  return { healedTransactions, hasChanges, changedTxs };
};
