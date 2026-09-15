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
  TrendingUp
} from 'lucide-react';

// Formatação Monetária Segura (em Centavos)
const formatMoney = (cents = 0) => {
  return (cents / 100).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
};

// Usuários da Família
const FAMILY_MEMBERS = [
  { id: 'user-all', name: 'Visão Geral (Família)', isFamily: true },
  { id: 'user-1', name: 'Rafael (Pessoal)', isFamily: false },
  { id: 'user-2', name: 'Ana Débora (Pessoal)', isFamily: false },
];

// Dados Iniciais Fictícios
const INITIAL_ACCOUNTS = [
  { id: 'acc-1', name: 'Conta Corrente Principal', bank: 'Banco do Brasil', type: 'corrente', initialBalanceCents: 450000, holder: 'Família', color: '#2563eb', archived: false, ownerId: 'user-all' },
  { id: 'acc-2', name: 'Reserva de Emergência', bank: 'Nubank', type: 'investimento', initialBalanceCents: 1500000, holder: 'Família', color: '#16a34a', archived: false, ownerId: 'user-all' },
  { id: 'acc-3', name: 'Conta Pessoal Rafael', bank: 'Inter', type: 'corrente', initialBalanceCents: 180000, holder: 'Rafael', color: '#f97316', archived: false, ownerId: 'user-1' },
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
  { id: 'cat-5', name: 'Educação & Cursos', type: 'EXPENSE', color: '#7c3aed', archived: false },
  { id: 'cat-6', name: 'Saúde & Farmácia', type: 'EXPENSE', color: '#e11d48', archived: false },
  { id: 'cat-7', name: 'Lazer & Restaurantes', type: 'EXPENSE', color: '#0284c7', archived: false },
  { id: 'cat-8', name: 'Transporte & Combustível', type: 'EXPENSE', color: '#475569', archived: false },
];

const INITIAL_TRANSACTIONS = [
  {
    id: 'tx-1',
    description: 'Salário Principal - Rafael',
    amountCents: 980000,
    type: 'INCOME',
    status: 'REALIZADO',
    date: '2026-09-05',
    accountId: 'acc-1',
    categoryId: 'cat-1',
    scope: 'FAMILY', // 'FAMILY' | 'PERSONAL'
    ownerId: 'user-1',
    isRecurring: true,
  },
  {
    id: 'tx-2',
    description: 'Salário & Proventos - Ana Débora',
    amountCents: 850000,
    type: 'INCOME',
    status: 'REALIZADO',
    date: '2026-09-08',
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
    date: '2026-09-10',
    accountId: 'acc-1',
    categoryId: 'cat-3',
    scope: 'FAMILY',
    ownerId: 'user-all',
    isRecurring: true,
  },
  {
    id: 'tx-4',
    description: 'Supermercado Mensal',
    amountCents: 145020,
    type: 'EXPENSE',
    status: 'REALIZADO',
    date: '2026-09-12',
    accountId: 'acc-1',
    categoryId: 'cat-4',
    scope: 'FAMILY',
    ownerId: 'user-all',
  },
  {
    id: 'tx-5',
    description: 'iPhone 15 Pro (Parcela 01/10)',
    amountCents: 64990,
    type: 'EXPENSE',
    status: 'COMPROMETIDO',
    date: '2026-09-25',
    cardId: 'card-1',
    categoryId: 'cat-5',
    scope: 'PERSONAL',
    ownerId: 'user-1',
    installmentGroupId: 'inst-1',
    installmentNumber: 1,
    installmentCount: 10,
  },
];

const INITIAL_SCENARIOS = [
  { id: 'scen-1', title: 'Troca de Carro (Financiamento)', monthlyImpactCents: -185000, months: 24, active: false },
  { id: 'scen-2', title: 'Consultoria Nova (Renda Extra)', monthlyImpactCents: 300000, months: 6, active: true },
];

export default function App() {
  // Estado Principal
  const [activeTab, setActiveTab] = useState('dashboard');
  const [currentMemberId, setCurrentMemberId] = useState('user-all');

  const [accounts, setAccounts] = useState(INITIAL_ACCOUNTS);
  const [cards, setCards] = useState(INITIAL_CARDS);
  const [categories, setCategories] = useState(INITIAL_CATEGORIES);
  const [transactions, setTransactions] = useState(INITIAL_TRANSACTIONS);
  const [scenarios, setScenarios] = useState(INITIAL_SCENARIOS);

  // Filtros de Lançamentos
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');

  // Estado dos Modais
  const [modalState, setModalState] = useState({
    isOpen: false,
    type: null, // 'account' | 'card' | 'category' | 'transaction' | 'scenario'
    mode: 'create', // 'create' | 'edit'
    data: null,
  });

  // Lançamentos Visíveis de acordo com a Visão selecionada (Família x Pessoal)
  const visibleTransactions = useMemo(() => {
    return transactions.filter((t) => {
      if (currentMemberId === 'user-all') {
        // Na visão da família, exibe os lançamentos familiares
        return t.scope === 'FAMILY';
      }
      // Na visão pessoal do usuário: exibe o que é dele (pessoal) E o que é familiar
      return t.scope === 'FAMILY' || t.ownerId === currentMemberId;
    });
  }, [transactions, currentMemberId]);

  // Recálculo do Saldo Atual por Conta (filtrado)
  const accountBalances = useMemo(() => {
    const balances = {};
    accounts.forEach((acc) => {
      balances[acc.id] = acc.initialBalanceCents;
    });

    visibleTransactions.forEach((tx) => {
      if (tx.status === 'REALIZADO' && tx.accountId && balances[tx.accountId] !== undefined) {
        if (tx.type === 'INCOME') {
          balances[tx.accountId] += tx.amountCents;
        } else if (tx.type === 'EXPENSE') {
          balances[tx.accountId] -= tx.amountCents;
        }
      }
    });

    return balances;
  }, [accounts, visibleTransactions]);

  // Recálculo de Limite Comprometido por Cartão (filtrado)
  const cardStats = useMemo(() => {
    const stats = {};
    cards.forEach((card) => {
      const cardTxs = visibleTransactions.filter((t) => t.cardId === card.id && t.status !== 'CANCELADO');
      const committed = cardTxs.reduce((acc, t) => acc + (t.type === 'EXPENSE' ? t.amountCents : 0), 0);
      stats[card.id] = {
        committedCents: committed,
        availableCents: Math.max(0, card.limitCents - committed),
      };
    });
    return stats;
  }, [cards, visibleTransactions]);

  // Totais do Mês Atual
  const monthSummary = useMemo(() => {
    let income = 0;
    let expense = 0;
    let committed = 0;

    visibleTransactions.forEach((tx) => {
      if (tx.type === 'INCOME') {
        income += tx.amountCents;
      } else {
        expense += tx.amountCents;
        if (tx.status === 'COMPROMETIDO') committed += tx.amountCents;
      }
    });

    const totalBankBalance = Object.values(accountBalances).reduce((a, b) => a + b, 0);
    const totalCardsAvailable = Object.values(cardStats).reduce((a, b) => a + b.availableCents, 0);

    return {
      income,
      expense,
      balance: income - expense,
      committed,
      totalBankBalance,
      totalCardsAvailable,
    };
  }, [visibleTransactions, accountBalances, cardStats]);

  // Impacto mensal consolidado dos cenários ATIVOS
  const activeScenariosMonthlyNet = useMemo(() => {
    return scenarios
      .filter((s) => s.active)
      .reduce((acc, s) => acc + s.monthlyImpactCents, 0);
  }, [scenarios]);

  // Handlers para Cadastrar/Editar Cenários
  const handleSaveScenario = (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const amount = Math.round(parseFloat(fd.get('amount') || '0') * 100);
    const isExpense = fd.get('type') === 'EXPENSE';
    const signedAmount = isExpense ? -Math.abs(amount) : Math.abs(amount);

    const newScen = {
      id: modalState.mode === 'edit' ? modalState.data.id : `scen-${Date.now()}`,
      title: fd.get('title'),
      monthlyImpactCents: signedAmount,
      months: parseInt(fd.get('months') || '12'),
      active: true,
    };

    if (modalState.mode === 'edit') {
      setScenarios(scenarios.map((s) => (s.id === newScen.id ? newScen : s)));
    } else {
      setScenarios([...scenarios, newScen]);
    }
    setModalState({ isOpen: false, type: null, mode: 'create', data: null });
  };

  // Converter Cenário em Lançamentos Reais
  const handleConvertScenarioToReal = (scen) => {
    const isExpense = scen.monthlyImpactCents < 0;
    const absAmount = Math.abs(scen.monthlyImpactCents);
    const startDate = new Date();
    const newTransactions = [];
    const groupId = `inst-${Date.now()}`;

    for (let i = 1; i <= scen.months; i++) {
      const d = new Date(startDate.getFullYear(), startDate.getMonth() + (i - 1), 5);
      newTransactions.push({
        id: `tx-scen-${Date.now()}-${i}`,
        description: `${scen.title} (${String(i).padStart(2, '0')}/${String(scen.months).padStart(2, '0')})`,
        amountCents: absAmount,
        type: isExpense ? 'EXPENSE' : 'INCOME',
        status: 'COMPROMETIDO',
        date: d.toISOString().slice(0, 10),
        accountId: accounts[0]?.id || null,
        categoryId: isExpense
          ? (categories.find((c) => c.type === 'EXPENSE')?.id || categories[0]?.id)
          : (categories.find((c) => c.type === 'INCOME')?.id || categories[0]?.id),
        scope: 'FAMILY',
        ownerId: currentMemberId === 'user-all' ? 'user-1' : currentMemberId,
        installmentGroupId: groupId,
        installmentNumber: i,
        installmentCount: scen.months,
      });
    }

    setTransactions((prev) => [...prev, ...newTransactions]);
    setScenarios((prev) =>
      prev.map((s) => (s.id === scen.id ? { ...s, active: false } : s))
    );

    alert(`"${scen.title}" foi convertido em ${scen.months} parcelas reais com sucesso! Verifique na aba Lançamentos.`);
  };

  // Salvar Contas
  const handleSaveAccount = (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const id = modalState.mode === 'edit' ? modalState.data.id : `acc-${Date.now()}`;
    const newAcc = {
      id,
      name: fd.get('name'),
      bank: fd.get('bank'),
      type: fd.get('type'),
      initialBalanceCents: Math.round(parseFloat(fd.get('initialBalance') || '0') * 100),
      holder: fd.get('holder'),
      color: fd.get('color') || '#2563eb',
      archived: modalState.mode === 'edit' ? modalState.data.archived : false,
      ownerId: fd.get('ownerId') || 'user-all',
    };

    if (modalState.mode === 'edit') {
      setAccounts(accounts.map((a) => (a.id === id ? newAcc : a)));
    } else {
      setAccounts([...accounts, newAcc]);
    }
    setModalState({ isOpen: false, type: null, mode: 'create', data: null });
  };

  // Salvar Cartões
  const handleSaveCard = (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const id = modalState.mode === 'edit' ? modalState.data.id : `card-${Date.now()}`;
    const newCard = {
      id,
      name: fd.get('name'),
      bank: fd.get('bank'),
      flag: fd.get('flag'),
      limitCents: Math.round(parseFloat(fd.get('limit') || '0') * 100),
      closingDay: parseInt(fd.get('closingDay') || '1'),
      dueDay: parseInt(fd.get('dueDay') || '10'),
      color: fd.get('color') || '#1e293b',
      archived: modalState.mode === 'edit' ? modalState.data.archived : false,
      ownerId: fd.get('ownerId') || 'user-all',
    };

    if (modalState.mode === 'edit') {
      setCards(cards.map((c) => (c.id === id ? newCard : c)));
    } else {
      setCards([...cards, newCard]);
    }
    setModalState({ isOpen: false, type: null, mode: 'create', data: null });
  };

  // Salvar Categorias
  const handleSaveCategory = (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const id = modalState.mode === 'edit' ? modalState.data.id : `cat-${Date.now()}`;
    const newCat = {
      id,
      name: fd.get('name'),
      type: fd.get('type'),
      color: fd.get('color') || '#475569',
      archived: modalState.mode === 'edit' ? modalState.data.archived : false,
    };

    if (modalState.mode === 'edit') {
      setCategories(categories.map((c) => (c.id === id ? newCat : c)));
    } else {
      setCategories([...categories, newCat]);
    }
    setModalState({ isOpen: false, type: null, mode: 'create', data: null });
  };

  // Salvar Lançamentos
  const handleSaveTransaction = (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const isEditing = modalState.mode === 'edit';
    const original = modalState.data || {};

    const amount = Math.round(parseFloat(fd.get('amount') || '0') * 100);
    const installments = parseInt(fd.get('installments') || '1');
    const isRecurring = fd.get('isRecurring') === 'on';
    const scope = fd.get('scope') || 'FAMILY';
    const ownerId = fd.get('ownerId') || (currentMemberId === 'user-all' ? 'user-1' : currentMemberId);

    if (isEditing) {
      const updated = {
        ...original,
        description: fd.get('description'),
        amountCents: amount,
        type: fd.get('type'),
        status: fd.get('status'),
        date: fd.get('date'),
        categoryId: fd.get('categoryId'),
        scope,
        ownerId,
        accountId: fd.get('sourceType') === 'ACCOUNT' ? fd.get('accountId') : null,
        cardId: fd.get('sourceType') === 'CARD' ? fd.get('cardId') : null,
      };

      setTransactions(transactions.map((t) => (t.id === original.id ? updated : t)));
    } else {
      if (installments > 1) {
        const baseCents = Math.floor(amount / installments);
        const remainder = amount % installments;
        const groupId = `inst-${Date.now()}`;
        const newTxs = [];

        const baseDate = new Date(fd.get('date') + 'T12:00:00');
        for (let i = 1; i <= installments; i++) {
          const installmentDate = new Date(baseDate);
          installmentDate.setMonth(baseDate.getMonth() + (i - 1));

          newTxs.push({
            id: `tx-${Date.now()}-${i}`,
            description: `${fd.get('description')} (${String(i).padStart(2, '0')}/${String(installments).padStart(2, '0')})`,
            amountCents: baseCents + (i === 1 ? remainder : 0),
            type: fd.get('type'),
            status: 'COMPROMETIDO',
            date: installmentDate.toISOString().slice(0, 10),
            categoryId: fd.get('categoryId'),
            scope,
            ownerId,
            accountId: fd.get('sourceType') === 'ACCOUNT' ? fd.get('accountId') : null,
            cardId: fd.get('sourceType') === 'CARD' ? fd.get('cardId') : null,
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
          status: fd.get('status'),
          date: fd.get('date'),
          categoryId: fd.get('categoryId'),
          scope,
          ownerId,
          accountId: fd.get('sourceType') === 'ACCOUNT' ? fd.get('accountId') : null,
          cardId: fd.get('sourceType') === 'CARD' ? fd.get('cardId') : null,
          isRecurring,
          recurrenceRuleId: isRecurring ? `rec-${Date.now()}` : null,
        };
        setTransactions([...transactions, newTx]);
      }
    }
    setModalState({ isOpen: false, type: null, mode: 'create', data: null });
  };

  const handleDeleteTransaction = (tx) => {
    if (confirm(`Deseja realmente excluir "${tx.description}"?`)) {
      setTransactions(transactions.filter((t) => t.id !== tx.id));
    }
  };

  const toggleArchiveAccount = (id) => {
    setAccounts(accounts.map((a) => (a.id === id ? { ...a, archived: !a.archived } : a)));
  };

  const toggleArchiveCard = (id) => {
    setCards(cards.map((c) => (c.id === id ? { ...c, archived: !c.archived } : c)));
  };

  const toggleArchiveCategory = (id) => {
    setCategories(categories.map((c) => (c.id === id ? { ...c, archived: !c.archived } : c)));
  };

  const toggleStatusPaid = (tx) => {
    const nextStatus = tx.status === 'REALIZADO' ? 'COMPROMETIDO' : 'REALIZADO';
    setTransactions(transactions.map((t) => (t.id === tx.id ? { ...t, status: nextStatus } : t)));
  };

  // Exportação de Dados JSON e CSV
  const exportData = (format) => {
    const exportBundle = {
      version: '1.2.0',
      date: new Date().toISOString(),
      currentView: currentMemberId,
      accounts,
      cards,
      categories,
      transactions,
      scenarios,
    };

    let blob, filename;
    if (format === 'json') {
      blob = new Blob([JSON.stringify(exportBundle, null, 2)], { type: 'application/json' });
      filename = `financas-da-familia-${new Date().toISOString().slice(0, 10)}.json`;
    } else {
      const csvRows = [
        'ID,Descricao,Valor_Centavos,Tipo,Status,Data,Escopo,Responsavel,Categoria_ID,Conta_ID,Cartao_ID',
        ...transactions.map(
          (t) =>
            `"${t.id}","${t.description}",${t.amountCents},"${t.type}","${t.status}","${t.date}","${t.scope}","${t.ownerId}","${t.categoryId}","${t.accountId || ''}","${t.cardId || ''}"`
        ),
      ];
      blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
      filename = `lancamentos-${new Date().toISOString().slice(0, 10)}.csv`;
    }

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Filtragem de Lançamentos na tabela
  const filteredTransactions = useMemo(() => {
    return visibleTransactions.filter((t) => {
      const matchSearch = t.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchType = filterType === 'ALL' || t.type === filterType;
      const matchStatus = filterStatus === 'ALL' || t.status === filterStatus;
      return matchSearch && matchType && matchStatus;
    });
  }, [visibleTransactions, searchTerm, filterType, filterStatus]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col antialiased font-sans">
      {/* Barra de Navegação Superior com Seletor de Perfil / Login Familiar */}
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
              <p className="text-xs text-slate-400 hidden sm:block">Gestão, Projeções e Orçamento Compartilhado</p>
            </div>
          </div>

          {/* Seletor de Visão / Usuário & Botão Novo Lançamento */}
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
              onClick={() => setModalState({ isOpen: true, type: 'transaction', mode: 'create', data: null })}
              className="bg-blue-600 hover:bg-blue-500 text-white text-xs sm:text-sm font-semibold px-3.5 py-2 rounded-lg flex items-center space-x-1.5 shadow-sm transition active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Novo Lançamento</span>
            </button>
          </div>
        </div>

        {/* Abas Principais */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-slate-800 flex space-x-1 overflow-x-auto py-2 scrollbar-none">
          {[
            { id: 'dashboard', label: 'Visão Geral', icon: BarChart3 },
            { id: 'transactions', label: 'Lançamentos', icon: RefreshCw },
            { id: 'accounts', label: 'Contas & Cartões', icon: Wallet },
            { id: 'categories', label: 'Categorias', icon: Tags },
            { id: 'projections', label: 'Planejamento & Projeções', icon: Calendar },
            { id: 'scenarios', label: 'Cenários & Simulações', icon: Sliders },
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

      {/* Conteúdo Principal */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {/* ===================== ABA: VISÃO GERAL ===================== */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* Aviso de Visão Ativa */}
            {currentMemberId !== 'user-all' && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-center justify-between">
                <span>
                  Você está visualizando a <strong>Visão Pessoal</strong>. Estão inclusos os lançamentos compartilhados da família e os seus exclusivos.
                </span>
                <button
                  onClick={() => setCurrentMemberId('user-all')}
                  className="font-bold underline text-amber-900 ml-2"
                >
                  Voltar para Visão Geral da Família
                </button>
              </div>
            )}

            {/* 4 Cards de Métricas Principais (Identidade Visual da Imagem) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between text-slate-400 mb-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Saldo em Contas</span>
                  <Wallet className="w-5 h-5 text-blue-500" />
                </div>
                <div className="text-2xl font-bold text-slate-900">{formatMoney(monthSummary.totalBankBalance)}</div>
                <div className="text-xs text-slate-400 mt-2">Soma de todas as contas ativas</div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between text-slate-400 mb-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Receitas Mês</span>
                  <ArrowUpRight className="w-5 h-5 text-emerald-500" />
                </div>
                <div className="text-2xl font-bold text-emerald-600">{formatMoney(monthSummary.income)}</div>
                <div className="text-xs text-slate-400 mt-2">Previsto + Realizado</div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between text-slate-400 mb-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Despesas Mês</span>
                  <ArrowDownRight className="w-5 h-5 text-rose-500" />
                </div>
                <div className="text-2xl font-bold text-rose-600">{formatMoney(monthSummary.expense)}</div>
                <div className="text-xs text-slate-400 mt-2">Fixas, Cartões & Parcelas</div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between text-slate-400 mb-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Limite Cartões</span>
                  <CreditCard className="w-5 h-5 text-indigo-500" />
                </div>
                <div className="text-2xl font-bold text-indigo-600">{formatMoney(monthSummary.totalCardsAvailable)}</div>
                <div className="text-xs text-slate-400 mt-2">Disponível para compras</div>
              </div>
            </div>

            {/* Banner Horizonte Financeiro Seguro */}
            <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center space-x-2 mb-1">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-bold uppercase tracking-wider text-blue-300">
                    Horizonte Financeiro Seguro
                  </span>
                </div>
                <h2 className="text-xl font-bold">Projeção para os Próximos 12 Meses</h2>
                <p className="text-xs text-slate-300 mt-1 max-w-xl">
                  Seu orçamento considera compromissos parcelados, contas fixas recorrentes e os cenários ativos da família.
                  {activeScenariosMonthlyNet !== 0 && (
                    <span className="text-amber-300 font-semibold block mt-0.5">
                      ✨ Impacto dos cenários ativos: {activeScenariosMonthlyNet > 0 ? '+' : ''}
                      {formatMoney(activeScenariosMonthlyNet)}/mês
                    </span>
                  )}
                </p>
              </div>

              <button
                onClick={() => setActiveTab('projections')}
                className="bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs sm:text-sm px-5 py-2.5 rounded-xl transition whitespace-nowrap self-start md:self-auto shadow"
              >
                Explorar Projeção Completa &gt;
              </button>
            </div>

            {/* Listas do Dashboard: Próximos Vencimentos e Cartões */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Próximos Vencimentos */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
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
                        <div className="flex items-center space-x-2">
                          <p className="font-semibold text-sm text-slate-900">{tx.description}</p>
                          <span
                            className={`text-[9px] px-1.5 py-0.2 rounded font-bold uppercase ${
                              tx.scope === 'PERSONAL' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {tx.scope === 'PERSONAL' ? 'Pessoal' : 'Familiar'}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2 text-xs text-slate-400 mt-0.5">
                          <span>{tx.date}</span>
                          <span>•</span>
                          <span
                            className={`font-semibold ${
                              tx.status === 'REALIZADO' ? 'text-emerald-600' : 'text-blue-600'
                            }`}
                          >
                            ● {tx.status}
                          </span>
                        </div>
                      </div>
                      <div className={`font-bold text-sm ${tx.type === 'INCOME' ? 'text-emerald-600' : 'text-slate-900'}`}>
                        {tx.type === 'INCOME' ? '+' : '-'} {formatMoney(tx.amountCents)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Status dos Cartões de Crédito */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                    <CreditCard className="w-4 h-4 text-purple-600" />
                    <span>Status dos Cartões de Crédito</span>
                  </h3>
                  <button onClick={() => setActiveTab('accounts')} className="text-xs font-semibold text-purple-600 hover:underline">
                    Ver detalhes
                  </button>
                </div>
                <div className="space-y-4">
                  {cards.map((card) => {
                    const stats = cardStats[card.id] || { committedCents: 0, availableCents: card.limitCents };
                    const pct = Math.min(100, Math.round((stats.committedCents / card.limitCents) * 100));
                    return (
                      <div key={card.id} className="p-4 rounded-xl border border-slate-100 bg-slate-50 space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-sm text-slate-900">{card.name}</span>
                          <span className="text-xs text-slate-400">
                            Fecha dia {card.closingDay} | Vence dia {card.dueDay}
                          </span>
                        </div>
                        <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${pct > 75 ? 'bg-rose-500' : 'bg-blue-600'}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-xs text-slate-600">
                          <span>Comprometido: {formatMoney(stats.committedCents)} ({pct}%)</span>
                          <span className="font-semibold text-slate-900">Disponível: {formatMoney(stats.availableCents)}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ===================== ABA: LANÇAMENTOS ===================== */}
        {activeTab === 'transactions' && (
          <div className="space-y-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
              <div className="relative w-full md:w-80">
                <input
                  type="text"
                  placeholder="Pesquisar lançamentos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-3 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="flex flex-wrap gap-2 w-full md:w-auto">
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="ALL">Todos os Tipos</option>
                  <option value="INCOME">Receitas</option>
                  <option value="EXPENSE">Despesas</option>
                </select>

                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="ALL">Todas as Situações</option>
                  <option value="REALIZADO">Realizado</option>
                  <option value="COMPROMETIDO">Comprometido</option>
                  <option value="PREVISTO">Previsto</option>
                  <option value="HIPOTETICO">Hipotético</option>
                </select>

                <button
                  onClick={() => setModalState({ isOpen: true, type: 'transaction', mode: 'create', data: null })}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center space-x-1 ml-auto"
                >
                  <Plus className="w-4 h-4" />
                  <span>Novo</span>
                </button>
              </div>
            </div>

            {/* Tabela de Lançamentos */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200">
                      <th className="py-3 px-4">Data</th>
                      <th className="py-3 px-4">Descrição</th>
                      <th className="py-3 px-4">Escopo</th>
                      <th className="py-3 px-4">Categoria</th>
                      <th className="py-3 px-4">Conta / Cartão</th>
                      <th className="py-3 px-4">Situação</th>
                      <th className="py-3 px-4 text-right">Valor</th>
                      <th className="py-3 px-4 text-center">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredTransactions.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="text-center py-8 text-slate-400">
                          Nenhum lançamento encontrado para esta visão.
                        </td>
                      </tr>
                    ) : (
                      filteredTransactions.map((tx) => {
                        const cat = categories.find((c) => c.id === tx.categoryId);
                        const acc = accounts.find((a) => a.id === tx.accountId);
                        const card = cards.find((c) => c.id === tx.cardId);

                        return (
                          <tr key={tx.id} className="hover:bg-slate-50 transition-colors">
                            <td className="py-3 px-4 text-slate-600 whitespace-nowrap">{tx.date}</td>
                            <td className="py-3 px-4 font-medium text-slate-900">
                              <div className="flex items-center space-x-2">
                                <span>{tx.description}</span>
                                {tx.installmentCount && (
                                  <span className="text-[10px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded font-semibold">
                                    {tx.installmentNumber}/{tx.installmentCount}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <span
                                className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                                  tx.scope === 'PERSONAL'
                                    ? 'bg-amber-100 text-amber-800'
                                    : 'bg-blue-100 text-blue-800'
                                }`}
                              >
                                {tx.scope === 'PERSONAL' ? 'Pessoal' : 'Familiar'}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-slate-600">
                              {cat ? (
                                <span className="inline-flex items-center space-x-1.5">
                                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }} />
                                  <span>{cat.name}</span>
                                </span>
                              ) : (
                                'Sem Categoria'
                              )}
                            </td>
                            <td className="py-3 px-4 text-slate-600 whitespace-nowrap">
                              {acc && <span className="text-blue-700 font-medium">{acc.name}</span>}
                              {card && <span className="text-purple-700 font-medium">💳 {card.name}</span>}
                              {!acc && !card && <span className="text-slate-400">-</span>}
                            </td>
                            <td className="py-3 px-4">
                              <button
                                onClick={() => toggleStatusPaid(tx)}
                                className={`text-[11px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider flex items-center space-x-1 transition ${
                                  tx.status === 'REALIZADO'
                                    ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                                    : 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                                }`}
                              >
                                {tx.status === 'REALIZADO' ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                                <span>{tx.status}</span>
                              </button>
                            </td>
                            <td
                              className={`py-3 px-4 text-right font-bold whitespace-nowrap ${
                                tx.type === 'INCOME' ? 'text-emerald-600' : 'text-slate-900'
                              }`}
                            >
                              {tx.type === 'INCOME' ? '+' : '-'} {formatMoney(tx.amountCents)}
                            </td>
                            <td className="py-3 px-4 text-center">
                              <div className="flex items-center justify-center space-x-2">
                                <button
                                  onClick={() => setModalState({ isOpen: true, type: 'transaction', mode: 'edit', data: tx })}
                                  className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-md transition"
                                  title="Editar"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteTransaction(tx)}
                                  className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-md transition"
                                  title="Excluir"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ===================== ABA: CONTAS & CARTÕES ===================== */}
        {activeTab === 'accounts' && (
          <div className="space-y-8">
            {/* Contas */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Contas Bancárias e Carteiras</h2>
                  <p className="text-xs text-slate-500">Cadastre e edite contas correntes e reservas</p>
                </div>
                <button
                  onClick={() => setModalState({ isOpen: true, type: 'account', mode: 'create', data: null })}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center space-x-1"
                >
                  <Plus className="w-4 h-4" />
                  <span>Nova Conta</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {accounts.map((acc) => (
                  <div key={acc.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center space-x-2">
                          <span className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: acc.color }} />
                          <h3 className="font-bold text-slate-900 text-base">{acc.name}</h3>
                        </div>
                        {acc.archived && <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded font-bold uppercase">Arquivada</span>}
                      </div>
                      <p className="text-xs text-slate-500">{acc.bank} • Titular: <strong>{acc.holder}</strong></p>
                    </div>

                    <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-semibold">Saldo Atual</span>
                        <p className="text-lg font-bold text-slate-900">{formatMoney(accountBalances[acc.id] || 0)}</p>
                      </div>
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => setModalState({ isOpen: true, type: 'account', mode: 'edit', data: acc })}
                          className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                          title="Editar"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => toggleArchiveAccount(acc.id)}
                          className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition"
                          title="Arquivar"
                        >
                          <Archive className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Cartões */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Cartões de Crédito</h2>
                  <p className="text-xs text-slate-500">Gerencie limites totais, disponíveis e datas de vencimento</p>
                </div>
                <button
                  onClick={() => setModalState({ isOpen: true, type: 'card', mode: 'create', data: null })}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center space-x-1"
                >
                  <Plus className="w-4 h-4" />
                  <span>Novo Cartão</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {cards.map((card) => {
                  const stats = cardStats[card.id] || { committedCents: 0, availableCents: card.limitCents };
                  return (
                    <div key={card.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-bold text-slate-900 text-base">{card.name}</h3>
                          <span className="text-xs text-slate-400">Fecha dia {card.closingDay} | Vence dia {card.dueDay}</span>
                        </div>
                        <p className="text-xs text-slate-500">{card.bank} ({card.flag})</p>
                      </div>

                      <div className="mt-4 pt-3 border-t border-slate-100 space-y-1 text-xs">
                        <div className="flex justify-between text-slate-500">
                          <span>Limite Total:</span>
                          <strong>{formatMoney(card.limitCents)}</strong>
                        </div>
                        <div className="flex justify-between text-rose-600">
                          <span>Comprometido:</span>
                          <strong>{formatMoney(stats.committedCents)}</strong>
                        </div>
                        <div className="flex justify-between text-emerald-600 font-bold">
                          <span>Disponível:</span>
                          <span>{formatMoney(stats.availableCents)}</span>
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-end space-x-1">
                        <button
                          onClick={() => setModalState({ isOpen: true, type: 'card', mode: 'edit', data: card })}
                          className="p-1.5 text-slate-500 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition"
                          title="Editar"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => toggleArchiveCard(card.id)}
                          className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition"
                          title="Arquivar"
                        >
                          <Archive className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ===================== ABA: CATEGORIAS ===================== */}
        {activeTab === 'categories' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Categorias Financeiras</h2>
                <p className="text-xs text-slate-500">Centros de custo da família</p>
              </div>
              <button
                onClick={() => setModalState({ isOpen: true, type: 'category', mode: 'create', data: null })}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center space-x-1"
              >
                <Plus className="w-4 h-4" />
                <span>Nova Categoria</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {categories.map((cat) => (
                <div key={cat.id} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="w-4 h-4 rounded-full" style={{ backgroundColor: cat.color }} />
                    <div>
                      <h4 className="font-semibold text-sm text-slate-900">{cat.name}</h4>
                      <span className="text-[10px] uppercase font-bold text-slate-400">{cat.type === 'INCOME' ? 'Receita' : 'Despesa'}</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => setModalState({ isOpen: true, type: 'category', mode: 'edit', data: cat })}
                      className="p-1.5 text-slate-500 hover:text-blue-600 rounded-lg"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => toggleArchiveCategory(cat.id)}
                      className="p-1.5 text-slate-500 hover:text-amber-600 rounded-lg"
                    >
                      <Archive className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ===================== ABA: PLANEJAMENTO & PROJEÇÕES COM IMPACTO DOS CENÁRIOS ===================== */}
        {activeTab === 'projections' && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Planejamento Orçamentário (12 Meses)</h2>
                <p className="text-xs text-slate-500">
                  Veja a projeção normal comparada à projeção com os cenários simulados ativos.
                </p>
              </div>

              {activeScenariosMonthlyNet !== 0 ? (
                <div className="text-xs font-semibold bg-blue-50 text-blue-800 border border-blue-200 px-3 py-1.5 rounded-lg flex items-center space-x-1">
                  <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                  <span>Cenários Ativos Alterando a Projeção ({formatMoney(activeScenariosMonthlyNet)}/mês)</span>
                </div>
              ) : (
                <div className="text-xs text-slate-400 bg-slate-100 px-3 py-1.5 rounded-lg">
                  Nenhum cenário ativo influenciando a projeção
                </div>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-600 font-semibold border-b">
                    <th className="py-3 px-4">Mês / Ano</th>
                    <th className="py-3 px-4 text-right">Receitas Base</th>
                    <th className="py-3 px-4 text-right">Despesas Base</th>
                    <th className="py-3 px-4 text-right text-blue-600">Impacto Cenários</th>
                    <th className="py-3 px-4 text-right">Saldo do Mês</th>
                    <th className="py-3 px-4 text-right font-bold text-slate-900">Saldo Acumulado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {Array.from({ length: 12 }).map((_, idx) => {
                    const date = new Date(2026, 8 + idx, 1);
                    const label = date.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' });
                    const baseIncome = monthSummary.income;
                    const baseExpense = monthSummary.expense;
                    const scenarioImpact = activeScenariosMonthlyNet;
                    const netMonth = baseIncome - baseExpense + scenarioImpact;
                    const accumulated = monthSummary.totalBankBalance + netMonth * (idx + 1);

                    return (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="py-3 px-4 font-semibold capitalize text-slate-800">{label}</td>
                        <td className="py-3 px-4 text-right text-emerald-600 font-semibold">{formatMoney(baseIncome)}</td>
                        <td className="py-3 px-4 text-right text-rose-600 font-semibold">{formatMoney(baseExpense)}</td>
                        <td className="py-3 px-4 text-right font-semibold text-blue-600">
                          {scenarioImpact !== 0 ? (scenarioImpact > 0 ? `+${formatMoney(scenarioImpact)}` : formatMoney(scenarioImpact)) : '-'}
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-slate-900">{formatMoney(netMonth)}</td>
                        <td className="py-3 px-4 text-right font-bold text-blue-700">{formatMoney(accumulated)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ===================== ABA: CENÁRIOS & SIMULAÇÕES (COM CADASTRO E CONVERSÃO) ===================== */}
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
                onClick={() => setModalState({ isOpen: true, type: 'scenario', mode: 'create', data: null })}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs sm:text-sm px-4 py-2 rounded-lg flex items-center space-x-1.5 shadow-sm transition active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>Novo Cenário</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {scenarios.map((scen) => {
                const isExpense = scen.monthlyImpactCents < 0;
                const absAmount = Math.abs(scen.monthlyImpactCents);

                return (
                  <div
                    key={scen.id}
                    className={`bg-white rounded-2xl border-2 p-6 shadow-sm flex flex-col justify-between transition-all ${
                      scen.active ? 'border-blue-500 shadow-blue-50' : 'border-slate-200'
                    }`}
                  >
                    <div>
                      {/* Topo do Card */}
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center space-x-2">
                          <span className="text-blue-600 font-bold text-lg">✨</span>
                          <h3 className="font-bold text-slate-900 text-base">{scen.title}</h3>
                        </div>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded tracking-wider uppercase ${
                            isExpense ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'
                          }`}
                        >
                          {isExpense ? 'Despesa' : 'Receita'}
                        </span>
                      </div>

                      <p className="text-xs text-slate-400 mb-5">
                        {isExpense ? 'Parcela estimada de' : 'Previsão de'} {formatMoney(absAmount)} por {scen.months} meses
                      </p>

                      {/* Informações Centrais */}
                      <div className="space-y-2 text-xs text-slate-500 py-3 border-y border-slate-100">
                        <div className="flex justify-between">
                          <span>Impacto Mensal:</span>
                          <strong className="text-slate-900 font-semibold">{formatMoney(absAmount)}/mês</strong>
                        </div>
                        <div className="flex justify-between">
                          <span>Duração Prevista:</span>
                          <strong className="text-slate-900 font-semibold">{scen.months} meses</strong>
                        </div>
                        <div className="flex justify-between">
                          <span>A partir de:</span>
                          <strong className="text-slate-900 font-semibold">set de 2026</strong>
                        </div>
                      </div>
                    </div>

                    {/* Rodapé com Toggle e Botão de Conversão */}
                    <div className="mt-5 pt-2 flex items-center justify-between">
                      <label className="flex items-center space-x-2 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={scen.active}
                          onChange={() => {
                            setScenarios((prev) =>
                              prev.map((s) => (s.id === scen.id ? { ...s, active: !s.active } : s))
                            );
                          }}
                          className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4"
                        />
                        <span className={`text-xs font-semibold ${scen.active ? 'text-blue-600' : 'text-slate-500'}`}>
                          {scen.active ? 'Ativo na Projeção' : 'Desativado'}
                        </span>
                      </label>

                      <button
                        type="button"
                        onClick={() => handleConvertScenarioToReal(scen)}
                        className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-blue-200 text-blue-600 hover:bg-blue-50 transition active:scale-95 shadow-sm"
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

        {/* ===================== ABA: EXPORTAÇÃO E BACKUP ===================== */}
        {activeTab === 'exports' && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm max-w-xl mx-auto space-y-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Backup e Portabilidade Familiar</h2>
              <p className="text-xs text-slate-500">
                Exporte todos os lançamentos com marcação de titularidade familiar ou individual.
              </p>
            </div>

            <div className="space-y-4">
              <div className="p-4 border border-slate-100 bg-slate-50 rounded-xl flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-sm text-slate-900">Exportar Banco Completo (JSON)</h4>
                  <p className="text-xs text-slate-500">Contas, cartões, lançamentos e simulações</p>
                </div>
                <button
                  onClick={() => exportData('json')}
                  className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2 rounded-lg flex items-center space-x-1"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Baixar JSON</span>
                </button>
              </div>

              <div className="p-4 border border-slate-100 bg-slate-50 rounded-xl flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-sm text-slate-900">Planilha de Lançamentos (CSV)</h4>
                  <p className="text-xs text-slate-500">Compatível com Excel e Google Planilhas</p>
                </div>
                <button
                  onClick={() => exportData('csv')}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-4 py-2 rounded-lg flex items-center space-x-1"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>Baixar CSV</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ===================== MODAIS DE CRIAÇÃO E EDIÇÃO ===================== */}
      {modalState.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-base text-slate-900">
                {modalState.mode === 'edit' ? 'Editar' : 'Cadastrar'}{' '}
                {modalState.type === 'account' && 'Conta / Carteira'}
                {modalState.type === 'card' && 'Cartão de Crédito'}
                {modalState.type === 'category' && 'Categoria'}
                {modalState.type === 'transaction' && 'Lançamento'}
                {modalState.type === 'scenario' && 'Cenário de Simulação'}
              </h3>
              <button
                onClick={() => setModalState({ isOpen: false, type: null, mode: 'create', data: null })}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-md"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* FORMULÁRIO: NOVO CENÁRIO */}
            {modalState.type === 'scenario' && (
              <form onSubmit={handleSaveScenario} className="p-6 space-y-4 overflow-y-auto">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Título do Cenário / Simulação</label>
                  <input
                    type="text"
                    name="title"
                    required
                    placeholder="Ex: Reforma da Cozinha, Compra de Celular, Nova Consultoria"
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Tipo de Impacto</label>
                    <select
                      name="type"
                      defaultValue="EXPENSE"
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    >
                      <option value="EXPENSE">Despesa (Gasto Mensal)</option>
                      <option value="INCOME">Receita (Ganho Mensal)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Valor Mensal (R$)</label>
                    <input
                      type="number"
                      step="0.01"
                      name="amount"
                      required
                      placeholder="0,00"
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Duração Estimada (em Meses)</label>
                  <input
                    type="number"
                    min="1"
                    max="60"
                    name="months"
                    defaultValue="12"
                    required
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div className="pt-4 border-t border-slate-100 flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setModalState({ isOpen: false, type: null, mode: 'create', data: null })}
                    className="px-4 py-2 border border-slate-300 rounded-lg text-sm text-slate-700 hover:bg-slate-50"
                  >
                    Cancelar
                  </button>
                  <button type="submit" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold">
                    Salvar Cenário
                  </button>
                </div>
              </form>
            )}

            {/* FORMULÁRIO: CONTA */}
            {modalState.type === 'account' && (
              <form onSubmit={handleSaveAccount} className="p-6 space-y-4 overflow-y-auto">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Nome da Conta / Carteira</label>
                  <input
                    type="text"
                    name="name"
                    required
                    defaultValue={modalState.data?.name || ''}
                    placeholder="Ex: Conta Corrente Principal, Reserva"
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Instituição Bancária</label>
                    <input
                      type="text"
                      name="bank"
                      required
                      defaultValue={modalState.data?.bank || ''}
                      placeholder="Ex: Nubank, Itaú, Banco do Brasil"
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Tipo de Conta</label>
                    <select
                      name="type"
                      defaultValue={modalState.data?.type || 'corrente'}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    >
                      <option value="corrente">Conta Corrente</option>
                      <option value="poupanca">Poupança</option>
                      <option value="investimento">Investimento</option>
                      <option value="dinheiro">Carteira / Dinheiro Físico</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Saldo Inicial (R$)</label>
                    <input
                      type="number"
                      step="0.01"
                      name="initialBalance"
                      required
                      defaultValue={modalState.data ? (modalState.data.initialBalanceCents / 100).toFixed(2) : '0.00'}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Titular Responsável</label>
                    <input
                      type="text"
                      name="holder"
                      defaultValue={modalState.data?.holder || 'Família'}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setModalState({ isOpen: false, type: null, mode: 'create', data: null })}
                    className="px-4 py-2 border border-slate-300 rounded-lg text-sm text-slate-700 hover:bg-slate-50"
                  >
                    Cancelar
                  </button>
                  <button type="submit" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold">
                    Salvar Conta
                  </button>
                </div>
              </form>
            )}

            {/* FORMULÁRIO: CARTÃO */}
            {modalState.type === 'card' && (
              <form onSubmit={handleSaveCard} className="p-6 space-y-4 overflow-y-auto">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Nome do Cartão</label>
                  <input
                    type="text"
                    name="name"
                    required
                    defaultValue={modalState.data?.name || ''}
                    placeholder="Ex: Nubank Ultravioleta, XP Infinite"
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Banco Emissor</label>
                    <input
                      type="text"
                      name="bank"
                      required
                      defaultValue={modalState.data?.bank || ''}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Bandeira</label>
                    <input
                      type="text"
                      name="flag"
                      defaultValue={modalState.data?.flag || 'Mastercard'}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Limite Total (R$)</label>
                    <input
                      type="number"
                      step="0.01"
                      name="limit"
                      required
                      defaultValue={modalState.data ? (modalState.data.limitCents / 100).toFixed(2) : '5000.00'}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Dia Fechamento</label>
                    <input
                      type="number"
                      min="1"
                      max="31"
                      name="closingDay"
                      required
                      defaultValue={modalState.data?.closingDay || '25'}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Dia Vencimento</label>
                    <input
                      type="number"
                      min="1"
                      max="31"
                      name="dueDay"
                      required
                      defaultValue={modalState.data?.dueDay || '5'}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setModalState({ isOpen: false, type: null, mode: 'create', data: null })}
                    className="px-4 py-2 border border-slate-300 rounded-lg text-sm text-slate-700 hover:bg-slate-50"
                  >
                    Cancelar
                  </button>
                  <button type="submit" className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-semibold">
                    Salvar Cartão
                  </button>
                </div>
              </form>
            )}

            {/* FORMULÁRIO: CATEGORIA */}
            {modalState.type === 'category' && (
              <form onSubmit={handleSaveCategory} className="p-6 space-y-4 overflow-y-auto">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Nome da Categoria</label>
                  <input
                    type="text"
                    name="name"
                    required
                    defaultValue={modalState.data?.name || ''}
                    placeholder="Ex: Supermercado, Educação, Aluguel"
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Tipo</label>
                    <select
                      name="type"
                      defaultValue={modalState.data?.type || 'EXPENSE'}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    >
                      <option value="EXPENSE">Despesa</option>
                      <option value="INCOME">Receita</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Cor</label>
                    <input
                      type="color"
                      name="color"
                      defaultValue={modalState.data?.color || '#2563eb'}
                      className="w-full h-10 p-1 border border-slate-300 rounded-lg cursor-pointer"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setModalState({ isOpen: false, type: null, mode: 'create', data: null })}
                    className="px-4 py-2 border border-slate-300 rounded-lg text-sm text-slate-700 hover:bg-slate-50"
                  >
                    Cancelar
                  </button>
                  <button type="submit" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold">
                    Salvar Categoria
                  </button>
                </div>
              </form>
            )}

            {/* FORMULÁRIO: LANÇAMENTO COM ESCOPO FAMILIAR OU INDIVIDUAL */}
            {modalState.type === 'transaction' && (
              <form onSubmit={handleSaveTransaction} className="p-6 space-y-4 overflow-y-auto">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Descrição</label>
                  <input
                    type="text"
                    name="description"
                    required
                    defaultValue={modalState.data?.description || ''}
                    placeholder="Ex: Salário da Família, Supermercado, Combustível"
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
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
                      placeholder="0,00"
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Data Vencimento/Recebimento</label>
                    <input
                      type="date"
                      name="date"
                      required
                      defaultValue={modalState.data?.date || new Date().toISOString().slice(0, 10)}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Seletor de Escopo: Familiar vs Pessoal */}
                <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Escopo do Lançamento</label>
                    <select
                      name="scope"
                      defaultValue={modalState.data?.scope || 'FAMILY'}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
                    >
                      <option value="FAMILY">Familiar (Padrão - Todos Veem)</option>
                      <option value="PERSONAL">Individual / Pessoal (Privado)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Titular / Responsável</label>
                    <select
                      name="ownerId"
                      defaultValue={modalState.data?.ownerId || (currentMemberId === 'user-all' ? 'user-1' : currentMemberId)}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
                    >
                      <option value="user-1">Rafael</option>
                      <option value="user-2">Ana Débora</option>
                      <option value="user-all">Família (Geral)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Tipo</label>
                    <select
                      name="type"
                      defaultValue={modalState.data?.type || 'EXPENSE'}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    >
                      <option value="EXPENSE">Despesa</option>
                      <option value="INCOME">Receita</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Situação</label>
                    <select
                      name="status"
                      defaultValue={modalState.data?.status || 'COMPROMETIDO'}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    >
                      <option value="REALIZADO">Realizado (Pago / Recebido)</option>
                      <option value="COMPROMETIDO">Comprometido (Assumido)</option>
                      <option value="PREVISTO">Previsto (Estimativa)</option>
                      <option value="HIPOTETICO">Hipotético (Simulado)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Categoria</label>
                    <select
                      name="categoryId"
                      defaultValue={modalState.data?.categoryId || categories[0]?.id}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    >
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Forma / Origem</label>
                    <select
                      name="sourceType"
                      defaultValue={modalState.data?.cardId ? 'CARD' : 'ACCOUNT'}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    >
                      <option value="ACCOUNT">Conta Bancária</option>
                      <option value="CARD">Cartão de Crédito</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Se Conta: Selecione</label>
                    <select
                      name="accountId"
                      defaultValue={modalState.data?.accountId || accounts[0]?.id}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    >
                      {accounts.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Se Cartão: Selecione</label>
                    <select
                      name="cardId"
                      defaultValue={modalState.data?.cardId || cards[0]?.id}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    >
                      {cards.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {modalState.mode === 'create' && (
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-slate-700">Parcelamento:</label>
                      <div className="flex items-center space-x-1">
                        <span className="text-xs text-slate-500">Número de Parcelas:</span>
                        <input
                          type="number"
                          min="1"
                          max="72"
                          name="installments"
                          defaultValue="1"
                          className="w-16 border border-slate-300 rounded px-2 py-1 text-xs text-center"
                        />
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 pt-2 border-t border-slate-200">
                      <input type="checkbox" name="isRecurring" id="isRecurring" className="rounded text-blue-600" />
                      <label htmlFor="isRecurring" className="text-xs font-medium text-slate-700">
                        Repetir mensalmente (Recorrência)
                      </label>
                    </div>
                  </div>
                )}

                <div className="pt-4 border-t border-slate-100 flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setModalState({ isOpen: false, type: null, mode: 'create', data: null })}
                    className="px-4 py-2 border border-slate-300 rounded-lg text-sm text-slate-700 hover:bg-slate-50"
                  >
                    Cancelar
                  </button>
                  <button type="submit" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold">
                    Salvar Lançamento
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}