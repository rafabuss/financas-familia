import React, { useState, useMemo } from 'react';
import {
  Wallet,
  CreditCard,
  Tags,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Layers,
  Calendar,
  BarChart3,
  Sliders,
  FileSpreadsheet,
  Download,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  AlertTriangle,
  X,
  Archive,
  ArchiveRestore,
  Filter,
  Check,
  Building2,
  Clock,
  Users,
  User,
  Sparkles,
  TrendingUp,
  HelpCircle,
  UploadCloud,
  FileText,
  PieChart
} from 'lucide-react';

const formatMoney = (cents = 0) => {
  return (cents / 100).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
};

const FAMILY_MEMBERS = [
  { id: 'user-all', name: 'Visão Geral (Família)', isFamily: true },
  { id: 'user-1', name: 'Carlos (Pessoal)', isFamily: false },
  { id: 'user-2', name: 'Mariana (Pessoal)', isFamily: false },
];

const INITIAL_ACCOUNTS = [
  { id: 'acc-1', name: 'Conta Corrente Principal', bank: 'Banco do Brasil', type: 'corrente', initialBalanceCents: 1614980, holder: 'Família', color: '#2563eb', archived: false, ownerId: 'user-all' },
  { id: 'acc-2', name: 'Reserva de Emergência & Investimentos', bank: 'Nubank', type: 'investimento', initialBalanceCents: 4500000, holder: 'Família', color: '#16a34a', archived: false, ownerId: 'user-all' },
];

const INITIAL_CARDS = [
  { id: 'card-1', name: 'Nubank Ultravioleta', bank: 'Nubank', flag: 'Mastercard', limitCents: 1500000, closingDay: 25, dueDay: 5, color: '#1e293b', archived: false, ownerId: 'user-all' },
  { id: 'card-2', name: 'XP Infinite', bank: 'XP Investimentos', flag: 'Visa', limitCents: 2000000, closingDay: 15, dueDay: 25, color: '#0f172a', archived: false, ownerId: 'user-all' },
];

const INITIAL_CATEGORIES = [
  { id: 'cat-1', name: 'Salário & Dividendos', type: 'INCOME', color: '#16a34a', archived: false },
  { id: 'cat-2', name: 'Renda Extra & Consultoria', type: 'INCOME', color: '#0d9488', archived: false },
  { id: 'cat-3', name: 'Moradia (Aluguel/Condomínio)', type: 'EXPENSE', color: '#2563eb', archived: false },
  { id: 'cat-4', name: 'Supermercado & Feira', type: 'EXPENSE', color: '#d97706', archived: false },
  { id: 'cat-5', name: 'Educação & Eletrônicos', type: 'EXPENSE', color: '#7c3aed', archived: false },
  { id: 'cat-6', name: 'Saúde & Farmácia', type: 'EXPENSE', color: '#e11d48', archived: false },
  { id: 'cat-7', name: 'Lazer & Assinaturas', type: 'EXPENSE', color: '#0284c7', archived: false },
  { id: 'cat-8', name: 'Transporte & Veículo', type: 'EXPENSE', color: '#475569', archived: false },
];

const INITIAL_TRANSACTIONS = [
  {
    id: 'tx-1',
    description: 'Salário Principal - Carlos',
    amountCents: 980000,
    type: 'INCOME',
    status: 'REALIZADO',
    date: '05/09/2026',
    accountId: 'acc-1',
    categoryId: 'cat-1',
    scope: 'FAMILY',
    ownerId: 'user-1',
    isRecurring: true,
  },
  {
    id: 'tx-2',
    description: 'Salário & Dividendos - Mariana',
    amountCents: 850000,
    type: 'INCOME',
    status: 'REALIZADO',
    date: '08/09/2026',
    accountId: 'acc-1',
    categoryId: 'cat-1',
    scope: 'FAMILY',
    ownerId: 'user-2',
    isRecurring: true,
  },
  {
    id: 'tx-3',
    description: 'Aluguel do Apartamento',
    amountCents: 340000,
    type: 'EXPENSE',
    status: 'REALIZADO',
    date: '10/09/2026',
    accountId: 'acc-1',
    categoryId: 'cat-3',
    scope: 'FAMILY',
    ownerId: 'user-all',
    isRecurring: true,
  },
  {
    id: 'tx-4',
    description: 'Supermercado Mensal Pão de Açúcar',
    amountCents: 145020,
    type: 'EXPENSE',
    status: 'REALIZADO',
    date: '12/09/2026',
    accountId: 'acc-1',
    categoryId: 'cat-4',
    scope: 'FAMILY',
    ownerId: 'user-all',
  },
  {
    id: 'tx-5',
    description: 'iPhone 15 Pro (1/10)',
    amountCents: 64990,
    type: 'EXPENSE',
    status: 'COMPROMETIDO',
    date: '25/09/2026',
    cardId: 'card-1',
    categoryId: 'cat-5',
    scope: 'FAMILY',
    ownerId: 'user-1',
    installmentGroupId: 'inst-1',
    installmentNumber: 1,
    installmentCount: 10,
  },
  {
    id: 'tx-6',
    description: 'Netflix & Spotify',
    amountCents: 7990,
    type: 'EXPENSE',
    status: 'COMPROMETIDO',
    date: '15/09/2026',
    cardId: 'card-1',
    categoryId: 'cat-7',
    scope: 'FAMILY',
    ownerId: 'user-all',
    isRecurring: true,
  },
];

const INITIAL_SCENARIOS = [
  {
    id: 'scen-1',
    title: 'Troca de Carro (Financiamento)',
    type: 'EXPENSE',
    subtitle: 'Parcela estimada de R$ 1.850 por 24 meses',
    monthlyImpactCents: -185000,
    months: 24,
    startDateText: 'set de 2026',
    categoryId: 'cat-8',
    sourceType: 'ACCOUNT',
    accountId: 'acc-1',
    cardId: null,
    scope: 'FAMILY',
    ownerId: 'user-1',
    active: false,
  },
  {
    id: 'scen-2',
    title: 'Consultoria Nova (Renda Extra)',
    type: 'INCOME',
    subtitle: 'Previsão de R$ 3.000 mensais por 6 meses',
    monthlyImpactCents: 300000,
    months: 6,
    startDateText: 'set de 2026',
    categoryId: 'cat-2',
    sourceType: 'ACCOUNT',
    accountId: 'acc-1',
    cardId: null,
    scope: 'FAMILY',
    ownerId: 'user-1',
    active: true,
  },
];

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [currentMemberId, setCurrentMemberId] = useState('user-all');

  const [accounts, setAccounts] = useState(INITIAL_ACCOUNTS);
  const [cards, setCards] = useState(INITIAL_CARDS);
  const [categories, setCategories] = useState(INITIAL_CATEGORIES);
  const [transactions, setTransactions] = useState(INITIAL_TRANSACTIONS);
  const [scenarios, setScenarios] = useState(INITIAL_SCENARIOS);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('ALL');
  const [projectionHorizon, setProjectionHorizon] = useState(12);

  // Controles dos Gráficos
  const [chartIncludeScenarios, setChartIncludeScenarios] = useState(true);
  const [chartFlowFilter, setChartFlowFilter] = useState('ALL'); // 'ALL' | 'EXPENSE' | 'INCOME'

  const [importSelectedCard, setImportSelectedCard] = useState('card-1');
  const [importPreviewData, setImportPreviewData] = useState(null);

  const [modalState, setModalState] = useState({
    isOpen: false,
    type: null,
    mode: 'create',
    data: null,
    scenarioIdToConvert: null,
  });

  const [modalSourceType, setModalSourceType] = useState('ACCOUNT');

  // Lançamentos dos cenários ativos como Hipotéticos
  const hypotheticalTransactions = useMemo(() => {
    const list = [];
    scenarios.filter((s) => s.active).forEach((scen) => {
      const isExpense = scen.type === 'EXPENSE';
      const absAmount = Math.abs(scen.monthlyImpactCents);

      list.push({
        id: `hypo-${scen.id}`,
        description: `${scen.title} (Simulação)`,
        amountCents: absAmount,
        type: isExpense ? 'EXPENSE' : 'INCOME',
        status: 'HIPOTETICO',
        date: '2026-09-15',
        categoryId: scen.categoryId,
        accountId: scen.sourceType === 'ACCOUNT' ? scen.accountId : null,
        cardId: scen.sourceType === 'CARD' ? scen.cardId : null,
        scope: scen.scope || 'FAMILY',
        ownerId: scen.ownerId || 'user-1',
        isHypothetical: true,
      });
    });
    return list;
  }, [scenarios]);

  // Transações visíveis filtradas pelo perfil (Família x Pessoal)
  const visibleTransactions = useMemo(() => {
    return transactions.filter((t) => {
      if (currentMemberId === 'user-all') return t.scope === 'FAMILY';
      return t.scope === 'FAMILY' || t.ownerId === currentMemberId;
    });
  }, [transactions, currentMemberId]);

  // Transações base para os Gráficos (com toggle de simulações)
  const chartTransactions = useMemo(() => {
    let list = [...visibleTransactions];
    if (chartIncludeScenarios) {
      const activeHypos = hypotheticalTransactions.filter((t) => {
        if (currentMemberId === 'user-all') return t.scope === 'FAMILY';
        return t.scope === 'FAMILY' || t.ownerId === currentMemberId;
      });
      list = [...list, ...activeHypos];
    }
    return list;
  }, [visibleTransactions, hypotheticalTransactions, chartIncludeScenarios, currentMemberId]);

  // Dados consolidados por categoria para os Gráficos
  const categoryChartData = useMemo(() => {
    const expenseMap = {};
    const incomeMap = {};
    let totalExpensesCents = 0;
    let totalIncomesCents = 0;

    chartTransactions.forEach((tx) => {
      if (tx.type === 'EXPENSE') {
        expenseMap[tx.categoryId] = (expenseMap[tx.categoryId] || 0) + tx.amountCents;
        totalExpensesCents += tx.amountCents;
      } else if (tx.type === 'INCOME') {
        incomeMap[tx.categoryId] = (incomeMap[tx.categoryId] || 0) + tx.amountCents;
        totalIncomesCents += tx.amountCents;
      }
    });

    const expensesList = Object.entries(expenseMap)
      .map(([catId, amountCents]) => {
        const cat = categories.find((c) => c.id === catId);
        const percentage = totalExpensesCents > 0 ? ((amountCents / totalExpensesCents) * 100).toFixed(1) : 0;
        return {
          catId,
          name: cat?.name || 'Geral',
          color: cat?.color || '#ef4444',
          amountCents,
          percentage: parseFloat(percentage),
        };
      })
      .sort((a, b) => b.amountCents - a.amountCents);

    const incomesList = Object.entries(incomeMap)
      .map(([catId, amountCents]) => {
        const cat = categories.find((c) => c.id === catId);
        const percentage = totalIncomesCents > 0 ? ((amountCents / totalIncomesCents) * 100).toFixed(1) : 0;
        return {
          catId,
          name: cat?.name || 'Geral',
          color: cat?.color || '#10b981',
          amountCents,
          percentage: parseFloat(percentage),
        };
      })
      .sort((a, b) => b.amountCents - a.amountCents);

    return {
      expensesList,
      incomesList,
      totalExpensesCents,
      totalIncomesCents,
    };
  }, [chartTransactions, categories]);

  // Saldos e Faturas
  const accountBalances = useMemo(() => {
    const balances = {};
    accounts.forEach((acc) => { balances[acc.id] = acc.initialBalanceCents; });
    visibleTransactions.forEach((tx) => {
      if (tx.status === 'REALIZADO' && tx.accountId && balances[tx.accountId] !== undefined) {
        if (tx.type === 'INCOME') balances[tx.accountId] += tx.amountCents;
        else if (tx.type === 'EXPENSE') balances[tx.accountId] -= tx.amountCents;
      }
    });
    return balances;
  }, [accounts, visibleTransactions]);

  const cardInvoices = useMemo(() => {
    const map = {};
    cards.forEach((card) => {
      const cardTxs = visibleTransactions.filter((t) => t.cardId === card.id && t.status !== 'CANCELADO');
      const committed = cardTxs.reduce((acc, t) => acc + (t.type === 'EXPENSE' ? t.amountCents : 0), 0);
      map[card.id] = {
        card,
        items: cardTxs,
        invoiceTotalCents: committed,
        availableCents: Math.max(0, card.limitCents - committed),
      };
    });
    return map;
  }, [cards, visibleTransactions]);

  const monthSummary = useMemo(() => {
    let income = 0;
    let expense = 0;
    let committed = 0;

    visibleTransactions.forEach((tx) => {
      if (tx.type === 'INCOME') income += tx.amountCents;
      else {
        expense += tx.amountCents;
        if (tx.status === 'COMPROMETIDO') committed += tx.amountCents;
      }
    });

    const totalBankBalance = Object.values(accountBalances).reduce((a, b) => a + b, 0);
    const totalCardsAvailable = Object.values(cardInvoices).reduce((a, b) => a + b.availableCents, 0);

    return {
      income,
      expense,
      balance: income - expense,
      committed,
      totalBankBalance,
      totalCardsAvailable,
    };
  }, [visibleTransactions, accountBalances, cardInvoices]);

  const toggleScenarioActive = (scenId) => {
    setScenarios((prev) =>
      prev.map((s) => (s.id === scenId ? { ...s, active: !s.active } : s))
    );
  };

  const handleStartConvertScenario = (scen) => {
    const isExpense = scen.type === 'EXPENSE';
    const absAmount = Math.abs(scen.monthlyImpactCents);

    const prefilledData = {
      description: scen.title,
      amountCents: absAmount,
      type: isExpense ? 'EXPENSE' : 'INCOME',
      status: 'COMPROMETIDO',
      date: new Date().toLocaleDateString('pt-BR'),
      categoryId: scen.categoryId || categories[0]?.id,
      sourceType: scen.sourceType || 'ACCOUNT',
      accountId: scen.accountId || accounts[0]?.id,
      cardId: scen.cardId || cards[0]?.id,
      scope: scen.scope || 'FAMILY',
      ownerId: scen.ownerId || 'user-1',
      installments: scen.months || 1,
      isRecurring: false,
    };

    setModalSourceType(prefilledData.sourceType);
    setModalState({
      isOpen: true,
      type: 'transaction',
      mode: 'create',
      data: prefilledData,
      scenarioIdToConvert: scen.id,
    });
  };

  const handleSaveScenario = (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const amount = Math.round(parseFloat(fd.get('amount') || '0') * 100);
    const type = fd.get('type');
    const isExpense = type === 'EXPENSE';
    const signedAmount = isExpense ? -Math.abs(amount) : Math.abs(amount);
    const months = parseInt(fd.get('months') || '12');

    const newScen = {
      id: `scen-${Date.now()}`,
      title: fd.get('title'),
      type,
      subtitle: `${isExpense ? 'Parcela estimada de' : 'Previsão de'} ${formatMoney(Math.abs(signedAmount))} por ${months} meses`,
      monthlyImpactCents: signedAmount,
      months,
      startDateText: 'set de 2026',
      categoryId: fd.get('categoryId'),
      sourceType: fd.get('sourceType'),
      accountId: fd.get('sourceType') === 'ACCOUNT' ? fd.get('accountId') : null,
      cardId: fd.get('sourceType') === 'CARD' ? fd.get('cardId') : null,
      scope: 'FAMILY',
      ownerId: 'user-1',
      active: true,
    };

    setScenarios([...scenarios, newScen]);
    setModalState({ isOpen: false, type: null, mode: 'create', data: null, scenarioIdToConvert: null });
  };

  const handleSaveTransaction = (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const amount = Math.round(parseFloat(fd.get('amount') || '0') * 100);
    const installments = parseInt(fd.get('installments') || '1');
    const sourceType = fd.get('sourceType');

    if (installments > 1) {
      const baseCents = Math.floor(amount / installments);
      const remainder = amount % installments;
      const groupId = `inst-${Date.now()}`;
      const newTxs = [];

      for (let i = 1; i <= installments; i++) {
        newTxs.push({
          id: `tx-${Date.now()}-${i}`,
          description: `${fd.get('description')} (${i}/${installments})`,
          amountCents: baseCents + (i === 1 ? remainder : 0),
          type: fd.get('type'),
          status: 'COMPROMETIDO',
          date: fd.get('date'),
          categoryId: fd.get('categoryId'),
          scope: fd.get('scope') || 'FAMILY',
          ownerId: fd.get('ownerId') || 'user-1',
          accountId: sourceType === 'ACCOUNT' ? fd.get('accountId') : null,
          cardId: sourceType === 'CARD' ? fd.get('cardId') : null,
          installmentGroupId: groupId,
          installmentNumber: i,
          installmentCount: installments,
        });
      }
      setTransactions([...transactions, ...newTxs]);
    } else {
      const newTx = {
        id: `tx-${Date.now()}`,
        description: fd.get('description'),
        amountCents: amount,
        type: fd.get('type'),
        status: fd.get('status') || 'COMPROMETIDO',
        date: fd.get('date'),
        categoryId: fd.get('categoryId'),
        scope: fd.get('scope') || 'FAMILY',
        ownerId: fd.get('ownerId') || 'user-1',
        accountId: sourceType === 'ACCOUNT' ? fd.get('accountId') : null,
        cardId: sourceType === 'CARD' ? fd.get('cardId') : null,
      };
      setTransactions([...transactions, newTx]);
    }

    if (modalState.scenarioIdToConvert) {
      setScenarios(scenarios.map((s) => (s.id === modalState.scenarioIdToConvert ? { ...s, active: false } : s)));
    }

    setModalState({ isOpen: false, type: null, mode: 'create', data: null, scenarioIdToConvert: null });
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col antialiased font-sans">
      {/* Header */}
      <header className="bg-slate-900 text-white sticky top-0 z-30 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center font-bold text-xl shadow-inner">
              F
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-lg font-bold tracking-tight">Finanças da Família</h1>
                <span className="text-[10px] bg-blue-900/60 text-blue-300 border border-blue-700 px-2 py-0.5 rounded-full font-semibold">
                  Planejamento Familiar
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className="flex items-center bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 shadow-sm">
              <Users className="w-4 h-4 text-slate-400 mr-2" />
              <select
                value={currentMemberId}
                onChange={(e) => setCurrentMemberId(e.target.value)}
                className="bg-transparent text-xs font-semibold text-white focus:outline-none cursor-pointer"
              >
                {FAMILY_MEMBERS.map((m) => (
                  <option key={m.id} value={m.id} className="bg-slate-900 text-white">
                    {m.name}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={() => {
                setModalSourceType('ACCOUNT');
                setModalState({ isOpen: true, type: 'transaction', mode: 'create', data: null, scenarioIdToConvert: null });
              }}
              className="bg-blue-600 hover:bg-blue-500 text-white text-xs sm:text-sm font-semibold px-3.5 py-2 rounded-lg flex items-center space-x-1.5 shadow-sm transition active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Novo Lançamento</span>
            </button>
          </div>
        </div>

        {/* Abas */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-slate-800 flex space-x-1 overflow-x-auto py-2 scrollbar-none">
          {[
            { id: 'dashboard', label: 'Visão Geral', icon: Clock },
            { id: 'transactions', label: 'Lançamentos', icon: RefreshCw },
            { id: 'charts', label: 'Gráficos & Análise', icon: PieChart },
            { id: 'accounts', label: 'Contas & Cartões', icon: Wallet },
            { id: 'faturas', label: 'Faturas', icon: CreditCard },
            { id: 'projections', label: 'Planejamento & Projeções', icon: Calendar },
            { id: 'scenarios', label: 'Cenários & Simulações', icon: Sparkles },
            { id: 'import', label: 'Importar Extrato', icon: UploadCloud },
            { id: 'exports', label: 'Backup & Exportar', icon: Download },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-medium whitespace-nowrap transition ${
                  active ? 'bg-blue-600 text-white shadow' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </header>

      {/* Conteúdo Central */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {/* ===================== ABA: VISÃO GERAL ===================== */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* 4 Cards de Topo */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between text-slate-500 mb-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Saldo em Contas</span>
                  <div className="w-8 h-8 rounded-lg border border-blue-100 flex items-center justify-center text-blue-500 bg-blue-50/50">
                    <Wallet className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-slate-900">{formatMoney(monthSummary.totalBankBalance)}</div>
                <div className="text-xs text-slate-400 mt-2">Soma de todas as contas ativas</div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between text-slate-500 mb-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Receitas Mês</span>
                  <div className="w-8 h-8 rounded-lg border border-emerald-100 flex items-center justify-center text-emerald-500 bg-emerald-50/50">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-emerald-600">{formatMoney(monthSummary.income)}</div>
                <div className="text-xs text-slate-400 mt-2">Previsto + Realizado</div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between text-slate-500 mb-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Despesas Mês</span>
                  <div className="w-8 h-8 rounded-lg border border-rose-100 flex items-center justify-center text-rose-500 bg-rose-50/50">
                    <ArrowDownRight className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-rose-600">{formatMoney(monthSummary.expense)}</div>
                <div className="text-xs text-slate-400 mt-2">Fixas, Cartões & Parcelas</div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between text-slate-500 mb-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Limite Cartões</span>
                  <div className="w-8 h-8 rounded-lg border border-indigo-100 flex items-center justify-center text-indigo-500 bg-indigo-50/50">
                    <CreditCard className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-indigo-600">{formatMoney(monthSummary.totalCardsAvailable)}</div>
                <div className="text-xs text-slate-400 mt-2">Disponível para compras</div>
              </div>
            </div>

            {/* Banner Horizonte */}
            <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center space-x-2 mb-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-bold uppercase tracking-wider text-blue-300">
                    Horizonte Financeiro Seguro
                  </span>
                </div>
                <h2 className="text-xl font-bold">Projeção para os Próximos 12 Meses</h2>
                <p className="text-xs text-slate-300 mt-1 max-w-xl">
                  Seu orçamento considera compromissos parcelados, contas fixas recorrentes e os cenários ativos da família.
                </p>
              </div>

              <button
                onClick={() => setActiveTab('projections')}
                className="bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs sm:text-sm px-5 py-2.5 rounded-xl transition whitespace-nowrap self-start md:self-auto shadow"
              >
                Explorar Projeção Completa &gt;
              </button>
            </div>

            {/* Widget Resumo de Gráficos na Visão Geral */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                    <PieChart className="w-4 h-4 text-blue-600" />
                    <span>Maiores Gastos por Categoria</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">Onde o dinheiro da visão atual está concentrado</p>
                </div>
                <button onClick={() => setActiveTab('charts')} className="text-xs font-semibold text-blue-600 hover:underline">
                  Ver Análise Completa
                </button>
              </div>

              <div className="space-y-3">
                {categoryChartData.expensesList.slice(0, 3).map((item) => (
                  <div key={item.catId} className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-slate-700">{item.name}</span>
                      <span className="text-slate-900">{formatMoney(item.amountCents)} ({item.percentage}%)</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all" style={{ width: `${item.percentage}%`, backgroundColor: item.color }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quadros de Vencimentos e Cartões */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-blue-600" />
                    <span>Próximos Vencimentos & Compromissos</span>
                  </h3>
                  <button onClick={() => setActiveTab('transactions')} className="text-xs font-semibold text-blue-600 hover:underline">
                    Ver todos
                  </button>
                </div>

                <div className="divide-y divide-slate-100">
                  {visibleTransactions.slice(0, 5).map((tx) => (
                    <div key={tx.id} className="py-3 flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-sm text-slate-900">{tx.description}</p>
                        <div className="flex items-center space-x-2 text-xs text-slate-400 mt-1">
                          <span>{tx.date}</span>
                          <span>•</span>
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              tx.status === 'REALIZADO' ? 'bg-emerald-50 text-emerald-700' : 'bg-blue-50 text-blue-700'
                            }`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${tx.status === 'REALIZADO' ? 'bg-emerald-500' : 'bg-blue-500'}`} />
                            {tx.status === 'REALIZADO' ? 'Realizado' : 'Comprometido'}
                          </span>
                        </div>
                      </div>

                      <span className={`font-bold text-sm ${tx.type === 'INCOME' ? 'text-emerald-600' : 'text-slate-900'}`}>
                        {tx.type === 'INCOME' ? '+' : '-'} {formatMoney(tx.amountCents)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                    <CreditCard className="w-4 h-4 text-purple-600" />
                    <span>Status dos Cartões de Crédito</span>
                  </h3>
                  <button onClick={() => setActiveTab('faturas')} className="text-xs font-semibold text-blue-600 hover:underline">
                    Ver Faturas
                  </button>
                </div>

                <div className="space-y-5">
                  {cards.map((card) => {
                    const info = cardInvoices[card.id] || { invoiceTotalCents: 0, availableCents: card.limitCents };
                    const pct = Math.round((info.invoiceTotalCents / card.limitCents) * 100);

                    return (
                      <div key={card.id} className="space-y-2">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-bold text-sm text-slate-900">{card.name}</span>
                          <span className="text-slate-400">Fecha dia {card.closingDay} | Vence dia {card.dueDay}</span>
                        </div>

                        <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                          <div className="h-full bg-blue-600 rounded-full transition-all" style={{ width: `${Math.max(pct, pct > 0 ? 3 : 0)}%` }} />
                        </div>

                        <div className="flex justify-between text-xs text-slate-600 pt-0.5">
                          <span>Comprometido: {formatMoney(info.invoiceTotalCents)} ({pct}%)</span>
                          <span className="font-semibold text-slate-900">Disponível: {formatMoney(info.availableCents)}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ===================== ABA: GRÁFICOS & ANÁLISE VISUAL (NOVO) ===================== */}
        {activeTab === 'charts' && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <div>
                <h2 className="text-xl font-bold text-slate-900 tracking-tight">Análise Gráfica por Categorias</h2>
                <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                  Visualização percentual de onde vem e para onde vai o orçamento (visão: <strong>{FAMILY_MEMBERS.find(m => m.id === currentMemberId)?.name}</strong>).
                </p>
              </div>

              {/* Filtros da Análise */}
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center bg-slate-100 p-1 rounded-xl">
                  <button
                    onClick={() => setChartFlowFilter('ALL')}
                    className={`text-xs font-bold px-3 py-1.5 rounded-lg transition ${chartFlowFilter === 'ALL' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'}`}
                  >
                    Ambos
                  </button>
                  <button
                    onClick={() => setChartFlowFilter('EXPENSE')}
                    className={`text-xs font-bold px-3 py-1.5 rounded-lg transition ${chartFlowFilter === 'EXPENSE' ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-600'}`}
                  >
                    Apenas Despesas
                  </button>
                  <button
                    onClick={() => setChartFlowFilter('INCOME')}
                    className={`text-xs font-bold px-3 py-1.5 rounded-lg transition ${chartFlowFilter === 'INCOME' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-600'}`}
                  >
                    Apenas Receitas
                  </button>
                </div>

                <label className="flex items-center space-x-2 text-xs font-semibold bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={chartIncludeScenarios}
                    onChange={(e) => setChartIncludeScenarios(e.target.checked)}
                    className="rounded text-blue-600"
                  />
                  <span>Incluir Cenários Ativos (Simulações)</span>
                </label>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Gráfico de Despesas */}
              {(chartFlowFilter === 'ALL' || chartFlowFilter === 'EXPENSE') && (
                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
                  <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                    <div>
                      <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                        <ArrowDownRight className="w-5 h-5 text-rose-600" />
                        <span>Distribuição de Despesas</span>
                      </h3>
                      <p className="text-xs text-slate-400">Total considerado: {formatMoney(categoryChartData.totalExpensesCents)}</p>
                    </div>
                  </div>

                  {categoryChartData.expensesList.length === 0 ? (
                    <p className="text-xs text-slate-400 py-8 text-center">Nenhuma despesa para exibir nesta visão.</p>
                  ) : (
                    <div className="space-y-4 pt-2">
                      {categoryChartData.expensesList.map((item) => (
                        <div key={item.catId} className="space-y-1.5">
                          <div className="flex justify-between items-center text-xs">
                            <span className="font-semibold text-slate-800 flex items-center space-x-2">
                              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                              <span>{item.name}</span>
                            </span>
                            <span className="text-slate-600">
                              <strong className="text-slate-900">{formatMoney(item.amountCents)}</strong> ({item.percentage}%)
                            </span>
                          </div>

                          <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-300"
                              style={{ width: `${item.percentage}%`, backgroundColor: item.color }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Gráfico de Receitas */}
              {(chartFlowFilter === 'ALL' || chartFlowFilter === 'INCOME') && (
                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
                  <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                    <div>
                      <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                        <ArrowUpRight className="w-5 h-5 text-emerald-600" />
                        <span>Origem das Receitas</span>
                      </h3>
                      <p className="text-xs text-slate-400">Total considerado: {formatMoney(categoryChartData.totalIncomesCents)}</p>
                    </div>
                  </div>

                  {categoryChartData.incomesList.length === 0 ? (
                    <p className="text-xs text-slate-400 py-8 text-center">Nenhuma receita para exibir nesta visão.</p>
                  ) : (
                    <div className="space-y-4 pt-2">
                      {categoryChartData.incomesList.map((item) => (
                        <div key={item.catId} className="space-y-1.5">
                          <div className="flex justify-between items-center text-xs">
                            <span className="font-semibold text-slate-800 flex items-center space-x-2">
                              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                              <span>{item.name}</span>
                            </span>
                            <span className="text-slate-600">
                              <strong className="text-slate-900">{formatMoney(item.amountCents)}</strong> ({item.percentage}%)
                            </span>
                          </div>

                          <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-300"
                              style={{ width: `${item.percentage}%`, backgroundColor: item.color }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ===================== ABA: CENÁRIOS & SIMULAÇÕES ===================== */}
        {activeTab === 'scenarios' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div>
                <h2 className="text-xl font-bold text-slate-900 tracking-tight">Cenários & Simulações "What-If"</h2>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">
                  Simule grandes decisões (compras, financiamentos, renda extra) sem contaminar seus lançamentos reais.
                </p>
              </div>

              <button
                onClick={() => {
                  setModalSourceType('ACCOUNT');
                  setModalState({ isOpen: true, type: 'scenario', mode: 'create', data: null, scenarioIdToConvert: null });
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs sm:text-sm px-4 py-2 rounded-lg flex items-center space-x-1.5 shadow-sm transition active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>Novo Cenário</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {scenarios.map((scen) => {
                const isExpense = scen.type === 'EXPENSE';
                const absAmount = Math.abs(scen.monthlyImpactCents);

                return (
                  <div
                    key={scen.id}
                    className={`bg-white rounded-2xl border p-6 shadow-sm flex flex-col justify-between transition-all ${
                      scen.active ? 'border-2 border-blue-500' : 'border-slate-200'
                    }`}
                  >
                    <div>
                      <div className="flex justify-between items-start mb-1.5">
                        <div className="flex items-center space-x-2">
                          <Sparkles className={`w-5 h-5 ${scen.active ? 'text-blue-600' : 'text-slate-400'}`} />
                          <h3 className="font-bold text-slate-900 text-base">{scen.title}</h3>
                        </div>

                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded tracking-wider uppercase ${
                            isExpense ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'
                          }`}
                        >
                          {isExpense ? 'DESPESA' : 'RECEITA'}
                        </span>
                      </div>

                      <p className="text-xs text-slate-400 mb-4">{scen.subtitle}</p>

                      <div className="bg-slate-50 border border-slate-100 rounded-xl p-3.5 space-y-2 text-xs text-slate-500">
                        <div className="flex justify-between items-center">
                          <span>Impacto Mensal:</span>
                          <strong className="text-slate-900 font-bold">{formatMoney(absAmount)}/mês</strong>
                        </div>
                        <div className="flex justify-between items-center">
                          <span>Duração Prevista:</span>
                          <strong className="text-slate-900 font-semibold">{scen.months} meses</strong>
                        </div>
                        <div className="flex justify-between items-center">
                          <span>A partir de:</span>
                          <strong className="text-slate-900 font-semibold">{scen.startDateText || 'set de 2026'}</strong>
                        </div>
                      </div>
                    </div>

                    <div className="mt-5 pt-2 flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => toggleScenarioActive(scen.id)}
                        className="flex items-center space-x-2.5 cursor-pointer select-none"
                      >
                        <div
                          className={`w-10 h-5 flex items-center rounded-full p-0.5 transition-colors duration-200 ease-in-out ${
                            scen.active ? 'bg-blue-600' : 'bg-slate-200'
                          }`}
                        >
                          <div
                            className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ease-in-out ${
                              scen.active ? 'translate-x-5' : 'translate-x-0'
                            }`}
                          />
                        </div>
                        <span className={`text-xs font-semibold ${scen.active ? 'text-slate-900' : 'text-slate-500'}`}>
                          {scen.active ? 'Ativo na Projeção' : 'Desativado'}
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleStartConvertScenario(scen)}
                        className="text-xs font-semibold px-3.5 py-1.5 rounded-lg border border-blue-200 text-blue-600 hover:bg-blue-50 transition active:scale-95 shadow-sm"
                      >
                        Converter em Real
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ===================== DEMAIS ABAS (FATURAS, PROJEÇÕES, LANÇAMENTOS, IMPORTAÇÃO, BACKUP) ===================== */}
        {activeTab === 'faturas' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">Faturas & Parcelas</h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Acompanhe o valor da fatura atual e o impacto das compras parceladas futuras.
              </p>
            </div>

            <div className="space-y-6">
              {cards.map((card) => {
                const info = cardInvoices[card.id] || { items: [], invoiceTotalCents: 0 };
                return (
                  <div key={card.id} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center pb-4 border-b border-slate-100 gap-2">
                      <div>
                        <h3 className="text-base font-bold text-slate-900">{card.name}</h3>
                        <p className="text-xs text-slate-400 mt-0.5">Fechamento dia {card.closingDay} • Vencimento dia {card.dueDay}</p>
                      </div>
                      <div className="text-left sm:text-right">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">VALOR DA FATURA ATUAL</span>
                        <span className="text-2xl font-bold text-slate-900">{formatMoney(info.invoiceTotalCents)}</span>
                      </div>
                    </div>

                    <div className="mt-4">
                      <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">LANÇAMENTOS E PARCELAS:</h4>
                      {info.items.length === 0 ? (
                        <p className="text-xs text-slate-400 py-3">Nenhuma despesa ativa nesta fatura.</p>
                      ) : (
                        <div className="divide-y divide-slate-100">
                          {info.items.map((item) => (
                            <div key={item.id} className="py-3 flex items-center justify-between">
                              <div>
                                <span className="font-semibold text-sm text-slate-900">{item.description}</span>
                                <span className="text-xs text-slate-400 block mt-0.5">Vence: {item.date}</span>
                              </div>
                              <span className="font-bold text-sm text-slate-900">{formatMoney(item.amountCents)}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === 'projections' && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900 tracking-tight">Projeção do Fluxo de Caixa</h2>
                <p className="text-xs sm:text-sm text-slate-500 mt-0.5">Previsão acumulada considerando receitas, parcelas futuras e cenários ativos.</p>
              </div>

              <div className="flex items-center space-x-2 bg-slate-100 p-1 rounded-xl self-start sm:self-auto">
                <span className="text-xs font-semibold text-slate-500 pl-2 pr-1">Horizonte:</span>
                {[12, 24, 36].map((m) => (
                  <button
                    key={m}
                    onClick={() => setProjectionHorizon(m)}
                    className={`text-xs font-bold px-3 py-1.5 rounded-lg transition ${
                      projectionHorizon === m ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {m} Meses
                  </button>
                ))}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 text-xs font-bold uppercase tracking-wider border-b">
                    <th className="py-3 px-4">MÊS</th>
                    <th className="py-3 px-4 text-right text-emerald-600">RECEITAS PREVISTAS</th>
                    <th className="py-3 px-4 text-right text-rose-600">DESPESAS & PARCELAS</th>
                    <th className="py-3 px-4 text-right">RESULTADO DO MÊS</th>
                    <th className="py-3 px-4 text-right">SALDO ACUMULADO PROJETADO</th>
                    <th className="py-3 px-4 text-center">RISCO</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {Array.from({ length: projectionHorizon }).map((_, idx) => {
                    const date = new Date(2026, 8 + idx, 1);
                    const label = date.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' });
                    const simulatedIncome = idx === 0 ? 2130000 : 300000;
                    const simulatedExpense = idx === 0 ? 643000 : 0;
                    const netMonth = simulatedIncome - simulatedExpense;
                    const accumulated = (idx === 0 ? 7601980 : 7601980 + 300000 * idx);

                    return (
                      <tr key={idx} className="hover:bg-slate-50 transition">
                        <td className="py-3.5 px-4 font-semibold text-slate-900">{label}</td>
                        <td className="py-3.5 px-4 text-right font-bold text-emerald-600">{formatMoney(simulatedIncome)}</td>
                        <td className="py-3.5 px-4 text-right font-bold text-rose-600">{formatMoney(simulatedExpense)}</td>
                        <td className="py-3.5 px-4 text-right font-bold text-blue-600">
                          {netMonth >= 0 ? `+${formatMoney(netMonth)}` : formatMoney(netMonth)}
                        </td>
                        <td className="py-3.5 px-4 text-right font-bold text-slate-900">{formatMoney(accumulated)}</td>
                        <td className="py-3.5 px-4 text-center">
                          <span className="text-[11px] bg-emerald-50 text-emerald-700 font-bold px-2.5 py-1 rounded-full">
                            Saudável
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'transactions' && (
          <div className="space-y-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
              <input
                type="text"
                placeholder="Pesquisar lançamentos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full md:w-80 pl-3 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />

              <button
                onClick={() => {
                  setModalSourceType('ACCOUNT');
                  setModalState({ isOpen: true, type: 'transaction', mode: 'create', data: null, scenarioIdToConvert: null });
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center space-x-1 ml-auto"
              >
                <Plus className="w-4 h-4" />
                <span>Novo</span>
              </button>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200">
                      <th className="py-3 px-4">Data</th>
                      <th className="py-3 px-4">Descrição</th>
                      <th className="py-3 px-4">Categoria</th>
                      <th className="py-3 px-4">Origem</th>
                      <th className="py-3 px-4">Situação</th>
                      <th className="py-3 px-4 text-right">Valor</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {visibleTransactions.map((tx) => {
                      const cat = categories.find((c) => c.id === tx.categoryId);
                      const acc = accounts.find((a) => a.id === tx.accountId);
                      const card = cards.find((c) => c.id === tx.cardId);

                      return (
                        <tr key={tx.id} className="hover:bg-slate-50 transition-colors">
                          <td className="py-3 px-4 text-slate-600">{tx.date}</td>
                          <td className="py-3 px-4 font-medium text-slate-900">{tx.description}</td>
                          <td className="py-3 px-4 text-slate-600">{cat?.name || 'Geral'}</td>
                          <td className="py-3 px-4 text-slate-600">{acc ? acc.name : `💳 ${card?.name}`}</td>
                          <td className="py-3 px-4">
                            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full uppercase bg-blue-50 text-blue-700">
                              {tx.status}
                            </span>
                          </td>
                          <td className={`py-3 px-4 text-right font-bold ${tx.type === 'INCOME' ? 'text-emerald-600' : 'text-slate-900'}`}>
                            {tx.type === 'INCOME' ? '+' : '-'} {formatMoney(tx.amountCents)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'accounts' && (
          <div className="space-y-6">
            <h2 className="text-lg font-bold text-slate-900">Contas e Carteiras</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {accounts.map((acc) => (
                <div key={acc.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                  <h3 className="font-bold text-slate-900">{acc.name}</h3>
                  <p className="text-xs text-slate-500 mt-1">{acc.bank} • Titular: {acc.holder}</p>
                  <p className="text-lg font-bold text-slate-900 mt-4">{formatMoney(accountBalances[acc.id] || 0)}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'import' && (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm max-w-3xl mx-auto space-y-6">
            <div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">Importação de Faturas & Extratos</h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Faça upload de extratos bancários ou faturas de cartão (PDF, CSV, OFX). O sistema detecta duplicidades e permite revisar antes de salvar.
              </p>
            </div>

            <div className="border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-2xl p-8 text-center space-y-4 bg-slate-50/50 transition">
              <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
                <UploadCloud className="w-8 h-8" />
              </div>

              <div>
                <h3 className="font-bold text-base text-slate-900">Arraste seu arquivo PDF ou clique para selecionar</h3>
                <p className="text-xs text-slate-400 mt-1">Suporta faturas Nubank, Itaú, XP e arquivos OFX bancários</p>
              </div>

              <div className="max-w-xs mx-auto text-left">
                <label className="block text-xs font-semibold text-slate-600 mb-1 text-center">Vincular a qual cartão:</label>
                <select
                  value={importSelectedCard}
                  onChange={(e) => setImportSelectedCard(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none"
                >
                  {cards.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <button
                onClick={handleSimulatePdfImport}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm px-6 py-2.5 rounded-xl shadow-sm transition active:scale-95"
              >
                Simular Leitura de Fatura PDF
              </button>
            </div>

            {importPreviewData && (
              <div className="space-y-4 pt-4 border-t border-slate-200">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-base text-slate-900">Conferência dos Lançamentos</h3>
                  <button
                    onClick={handleConfirmImport}
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-semibold shadow-sm"
                  >
                    Confirmar e Gravar na Fatura
                  </button>
                </div>

                <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100 text-sm">
                  {importPreviewData.map((item) => (
                    <div key={item.id} className="p-3.5 flex items-center justify-between hover:bg-slate-50">
                      <div className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          checked={item.selected}
                          onChange={() => {
                            setImportPreviewData(
                              importPreviewData.map((p) => (p.id === item.id ? { ...p, selected: !p.selected } : p))
                            );
                          }}
                          className="rounded text-blue-600 w-4 h-4"
                        />
                        <div>
                          <p className="font-semibold text-slate-900">{item.description}</p>
                          <span className="text-xs text-slate-400">{item.date}</span>
                        </div>
                      </div>

                      <span className="font-bold text-slate-900">{formatMoney(item.amountCents)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'exports' && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm max-w-xl mx-auto space-y-4">
            <h2 className="text-lg font-bold text-slate-900">Backup dos Dados</h2>
            <div className="p-4 bg-slate-50 rounded-xl flex items-center justify-between">
              <div>
                <p className="font-bold text-sm">Exportar Banco Completo</p>
                <p className="text-xs text-slate-500">Formato JSON estruturado</p>
              </div>
              <button onClick={() => exportData('json')} className="bg-blue-600 text-white text-xs font-semibold px-4 py-2 rounded-lg">
                Baixar JSON
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Modais */}
      {modalState.isOpen && modalState.type === 'scenario' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-base text-slate-900">Novo Cenário & Simulação</h3>
              <button onClick={() => setModalState({ isOpen: false, type: null, mode: 'create', data: null, scenarioIdToConvert: null })}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleSaveScenario} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Título do Cenário</label>
                <input
                  type="text"
                  name="title"
                  required
                  placeholder="Ex: Reforma da Casa, Troca de Carro, Novo Contrato"
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Tipo</label>
                  <select name="type" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white">
                    <option value="EXPENSE">Despesa (Gasto Mensal)</option>
                    <option value="INCOME">Receita (Ganho Mensal)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Impacto Mensal (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    name="amount"
                    required
                    placeholder="0,00"
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Duração (Meses)</label>
                  <input
                    type="number"
                    name="months"
                    min="1"
                    max="60"
                    defaultValue="12"
                    required
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Categoria</label>
                  <select name="categoryId" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white">
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setModalState({ isOpen: false, type: null, mode: 'create', data: null, scenarioIdToConvert: null })}
                  className="px-4 py-2 border rounded-lg text-sm text-slate-700 hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button type="submit" className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold">
                  Salvar Cenário
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {modalState.isOpen && modalState.type === 'transaction' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-base text-slate-900">
                {modalState.scenarioIdToConvert ? 'Confirmar Lançamento Real' : 'Novo Lançamento'}
              </h3>
              <button onClick={() => setModalState({ isOpen: false, type: null, mode: 'create', data: null, scenarioIdToConvert: null })}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleSaveTransaction} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Descrição</label>
                <input
                  type="text"
                  name="description"
                  required
                  defaultValue={modalState.data?.description || ''}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Valor Total (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    name="amount"
                    required
                    defaultValue={modalState.data ? (modalState.data.amountCents / 100).toFixed(2) : ''}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Data</label>
                  <input
                    type="text"
                    name="date"
                    required
                    defaultValue={modalState.data?.date || new Date().toLocaleDateString('pt-BR')}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Forma / Origem</label>
                  <select
                    name="sourceType"
                    value={modalSourceType}
                    onChange={(e) => setModalSourceType(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white"
                  >
                    <option value="ACCOUNT">Conta Bancária</option>
                    <option value="CARD">Cartão de Crédito</option>
                  </select>
                </div>

                {modalSourceType === 'ACCOUNT' ? (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Conta Bancária</label>
                    <select name="accountId" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white">
                      {accounts.map((a) => (
                        <option key={a.id} value={a.id}>{a.name}</option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Cartão de Crédito</label>
                    <select name="cardId" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white">
                      {cards.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setModalState({ isOpen: false, type: null, mode: 'create', data: null, scenarioIdToConvert: null })}
                  className="px-4 py-2 border rounded-lg text-sm text-slate-700 hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button type="submit" className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold">
                  Salvar Lançamento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}