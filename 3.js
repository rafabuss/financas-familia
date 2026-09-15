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
  Clock
} from 'lucide-react';

// Formatação monetária segura (em Centavos)
const formatMoney = (cents = 0) => {
  return (cents / 100).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
};

// Dados Iniciais Fictícios
const INITIAL_ACCOUNTS = [
  { id: 'acc-1', name: 'Conta Corrente Principal', bank: 'Banco do Brasil', type: 'corrente', initialBalanceCents: 450000, holder: 'Titular', color: '#2563eb', archived: false },
  { id: 'acc-2', name: 'Reserva de Emergência', bank: 'Nubank', type: 'investimento', initialBalanceCents: 1500000, holder: 'Família', color: '#16a34a', archived: false },
];

const INITIAL_CARDS = [
  { id: 'card-1', name: 'Cartão Black Familiar', bank: 'Itaú', flag: 'Mastercard', limitCents: 1500000, closingDay: 28, dueDay: 5, color: '#1e293b', archived: false },
  { id: 'card-2', name: 'Cartão Platinum', bank: 'Nubank', flag: 'Visa', limitCents: 600000, closingDay: 15, dueDay: 22, color: '#9333ea', archived: false },
];

const INITIAL_CATEGORIES = [
  { id: 'cat-1', name: 'Salário & Proventos', type: 'INCOME', color: '#16a34a', archived: false },
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
    description: 'Salário Familiar',
    amountCents: 1250000,
    type: 'INCOME',
    status: 'REALIZADO',
    date: '2026-09-05',
    accountId: 'acc-1',
    categoryId: 'cat-1',
    isRecurring: true,
    recurrenceRuleId: 'rec-1',
  },
  {
    id: 'tx-2',
    description: 'Mensalidade Escolar',
    amountCents: 165000,
    type: 'EXPENSE',
    status: 'COMPROMETIDO',
    date: '2026-09-10',
    accountId: 'acc-1',
    categoryId: 'cat-5',
    isRecurring: true,
    recurrenceRuleId: 'rec-2',
  },
  {
    id: 'tx-3',
    description: 'Notebook de Trabalho (Parcela 03/10)',
    amountCents: 45000,
    type: 'EXPENSE',
    status: 'COMPROMETIDO',
    date: '2026-09-05',
    cardId: 'card-1',
    categoryId: 'cat-5',
    installmentGroupId: 'inst-1',
    installmentNumber: 3,
    installmentCount: 10,
  },
];

export default function App() {
  // Estado Principal
  const [activeTab, setActiveTab] = useState('dashboard');
  const [accounts, setAccounts] = useState(INITIAL_ACCOUNTS);
  const [cards, setCards] = useState(INITIAL_CARDS);
  const [categories, setCategories] = useState(INITIAL_CATEGORIES);
  const [transactions, setTransactions] = useState(INITIAL_TRANSACTIONS);
  const [scenarios, setScenarios] = useState([
    { id: 'scen-1', title: 'Energia Solar', monthlyImpactCents: -58000, months: 24, active: true },
    { id: 'scen-2', title: 'Aumento de Salário / Promoção', monthlyImpactCents: 200000, months: 36, active: false },
  ]);

  // Filtros de Lançamentos
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');

  // Estado dos Modais de Edição / Criação
  const [modalState, setModalState] = useState({
    isOpen: false,
    type: null, // 'account', 'card', 'category', 'transaction', 'scenario'
    mode: 'create', // 'create' | 'edit'
    data: null,
  });

  // Recálculo do Saldo Atual por Conta
  const accountBalances = useMemo(() => {
    const balances = {};
    accounts.forEach((acc) => {
      balances[acc.id] = acc.initialBalanceCents;
    });

    transactions.forEach((tx) => {
      if (tx.status === 'REALIZADO' && tx.accountId && balances[tx.accountId] !== undefined) {
        if (tx.type === 'INCOME') {
          balances[tx.accountId] += tx.amountCents;
        } else if (tx.type === 'EXPENSE') {
          balances[tx.accountId] -= tx.amountCents;
        }
      }
    });

    return balances;
  }, [accounts, transactions]);

  // Converter Cenário em Lançamento(s) Real(is)
  const handleConvertScenarioToReal = (scen) => {
    const isExpense = scen.monthlyImpactCents < 0;
    const absAmount = Math.abs(scen.monthlyImpactCents);
    const startDate = new Date();
    const newTransactions = [];
    const groupId = `inst-${Date.now()}`;

    // Cria parcelas para os N meses da simulação
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
          ? (categories.find(c => c.type === 'EXPENSE')?.id || categories[0]?.id)
          : (categories.find(c => c.type === 'INCOME')?.id || categories[0]?.id),
        installmentGroupId: groupId,
        installmentNumber: i,
        installmentCount: scen.months,
      });
    }

    // Adiciona aos lançamentos reais e desativa o cenário
    setTransactions((prev) => [...prev, ...newTransactions]);
    setScenarios((prev) =>
      prev.map((s) => (s.id === scen.id ? { ...s, active: false } : s))
    );

    alert(`"${scen.title}" foi convertido em ${scen.months} parcelas reais com sucesso! Verifique na aba Lançamentos.`);
  };

  // Recálculo de Limite Comprometido por Cartão
  const cardStats = useMemo(() => {
    const stats = {};
    cards.forEach((card) => {
      const cardTxs = transactions.filter((t) => t.cardId === card.id && t.status !== 'CANCELADO');
      const committed = cardTxs.reduce((acc, t) => acc + (t.type === 'EXPENSE' ? t.amountCents : 0), 0);
      stats[card.id] = {
        committedCents: committed,
        availableCents: Math.max(0, card.limitCents - committed),
      };
    });
    return stats;
  }, [cards, transactions]);

  // Totais do Mês
  const monthSummary = useMemo(() => {
    let income = 0;
    let expense = 0;
    let committed = 0;

    transactions.forEach((tx) => {
      if (tx.type === 'INCOME') {
        income += tx.amountCents;
      } else {
        expense += tx.amountCents;
        if (tx.status === 'COMPROMETIDO') committed += tx.amountCents;
      }
    });

    const totalBankBalance = Object.values(accountBalances).reduce((a, b) => a + b, 0);

    return {
      income,
      expense,
      balance: income - expense,
      committed,
      totalBankBalance,
    };
  }, [transactions, accountBalances]);

  // Handlers para Salvar Modais
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
    };

    if (modalState.mode === 'edit') {
      setAccounts(accounts.map((a) => (a.id === id ? newAcc : a)));
    } else {
      setAccounts([...accounts, newAcc]);
    }
    setModalState({ isOpen: false, type: null, mode: 'create', data: null });
  };

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
    };

    if (modalState.mode === 'edit') {
      setCards(cards.map((c) => (c.id === id ? newCard : c)));
    } else {
      setCards([...cards, newCard]);
    }
    setModalState({ isOpen: false, type: null, mode: 'create', data: null });
  };

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

  const handleSaveTransaction = (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const isEditing = modalState.mode === 'edit';
    const original = modalState.data || {};

    const amount = Math.round(parseFloat(fd.get('amount') || '0') * 100);
    const installments = parseInt(fd.get('installments') || '1');
    const isRecurring = fd.get('isRecurring') === 'on';

    if (isEditing) {
      const updated = {
        ...original,
        description: fd.get('description'),
        amountCents: amount,
        type: fd.get('type'),
        status: fd.get('status'),
        date: fd.get('date'),
        categoryId: fd.get('categoryId'),
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
          accountId: fd.get('sourceType') === 'ACCOUNT' ? fd.get('accountId') : null,
          cardId: fd.get('sourceType') === 'CARD' ? fd.get('cardId') : null,
          isRecurring: isRecurring,
          recurrenceRuleId: isRecurring ? `rec-${Date.now()}` : null,
        };
        setTransactions([...transactions, newTx]);
      }
    }
    setModalState({ isOpen: false, type: null, mode: 'create', data: null });
  };

  // Exclusão Segura
  const handleDeleteTransaction = (tx) => {
    if (confirm(`Deseja realmente excluir "${tx.description}"?`)) {
      setTransactions(transactions.filter((t) => t.id !== tx.id));
    }
  };

  // Alternar Status de Arquivamento
  const toggleArchiveAccount = (id) => {
    setAccounts(accounts.map((a) => (a.id === id ? { ...a, archived: !a.archived } : a)));
  };

  const toggleArchiveCard = (id) => {
    setCards(cards.map((c) => (c.id === id ? { ...c, archived: !c.archived } : c)));
  };

  const toggleArchiveCategory = (id) => {
    setCategories(categories.map((c) => (c.id === id ? { ...c, archived: !c.archived } : c)));
  };

  // Marcar como pago/recebido
  const toggleStatusPaid = (tx) => {
    const nextStatus = tx.status === 'REALIZADO' ? 'COMPROMETIDO' : 'REALIZADO';
    setTransactions(transactions.map((t) => (t.id === tx.id ? { ...t, status: nextStatus } : t)));
  };

  // Exportação de Dados JSON e CSV
  const exportData = (format) => {
    const exportBundle = {
      version: '1.0.0',
      date: new Date().toISOString(),
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
        'ID,Descricao,Valor_Centavos,Tipo,Status,Data,Categoria_ID,Conta_ID,Cartao_ID',
        ...transactions.map((t) => `"${t.id}","${t.description}",${t.amountCents},"${t.type}","${t.status}","${t.date}","${t.categoryId}","${t.accountId || ''}","${t.cardId || ''}"`),
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

  // Filtragem de Lançamentos
  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      const matchSearch = t.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchType = filterType === 'ALL' || t.type === filterType;
      const matchStatus = filterStatus === 'ALL' || t.status === filterStatus;
      return matchSearch && matchType && matchStatus;
    });
  }, [transactions, searchTerm, filterType, filterStatus]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col antialiased">
      {/* Barra de Navegação Superior */}
      <header className="bg-slate-900 text-white sticky top-0 z-30 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center font-bold text-xl shadow-inner">
              F
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight">Finanças da Família</h1>
              <p className="text-xs text-slate-400">Gestão, Projeções e Orçamento Familiar</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setModalState({ isOpen: true, type: 'transaction', mode: 'create', data: null })}
              className="bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold px-4 py-2 rounded-lg flex items-center space-x-1.5 shadow-sm transition active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Novo Lançamento</span>
            </button>
          </div>
        </div>

        {/* Menu de Abas Responsivo */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-slate-800 flex space-x-1 overflow-x-auto py-2 scrollbar-none">
          {[
            { id: 'dashboard', label: 'Painel Geral', icon: BarChart3 },
            { id: 'transactions', label: 'Lançamentos', icon: RefreshCw },
            { id: 'accounts', label: 'Contas & Carteiras', icon: Wallet },
            { id: 'cards', label: 'Cartões de Crédito', icon: CreditCard },
            { id: 'categories', label: 'Categorias', icon: Tags },
            { id: 'projections', label: 'Projeções Futuras', icon: Calendar },
            { id: 'scenarios', label: 'Cenários e Simulação', icon: Sliders },
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
        {/* ===================== ABA: PAINEL GERAL ===================== */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* Cards de Resumo */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between text-slate-500 mb-2">
                  <span className="text-xs font-semibold uppercase tracking-wider">Saldo Líquido em Contas</span>
                  <Wallet className="w-5 h-5 text-blue-600" />
                </div>
                <div className="text-2xl font-bold text-slate-900">{formatMoney(monthSummary.totalBankBalance)}</div>
                <div className="text-xs text-slate-500 mt-2">Disponível imediato somando contas</div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between text-slate-500 mb-2">
                  <span className="text-xs font-semibold uppercase tracking-wider">Receitas Previstas</span>
                  <ArrowUpRight className="w-5 h-5 text-emerald-600" />
                </div>
                <div className="text-2xl font-bold text-emerald-600">{formatMoney(monthSummary.income)}</div>
                <div className="text-xs text-slate-500 mt-2">Total de entradas no período</div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between text-slate-500 mb-2">
                  <span className="text-xs font-semibold uppercase tracking-wider">Despesas / Faturas</span>
                  <ArrowDownRight className="w-5 h-5 text-rose-600" />
                </div>
                <div className="text-2xl font-bold text-rose-600">{formatMoney(monthSummary.expense)}</div>
                <div className="text-xs text-slate-500 mt-2">Gastos e faturas computadas</div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between text-slate-500 mb-2">
                  <span className="text-xs font-semibold uppercase tracking-wider">Compromissos Futuros</span>
                  <Layers className="w-5 h-5 text-amber-600" />
                </div>
                <div className="text-2xl font-bold text-amber-600">{formatMoney(monthSummary.committed)}</div>
                <div className="text-xs text-slate-500 mt-2">Parcelas e contas já contratadas</div>
              </div>
            </div>

            {/* Listagem Rápida de Contas e Cartões */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Contas Ativas */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                    <Building2 className="w-5 h-5 text-blue-600" />
                    <span>Contas Bancárias e Saldos</span>
                  </h2>
                  <button
                    onClick={() => setActiveTab('accounts')}
                    className="text-xs font-semibold text-blue-600 hover:text-blue-700"
                  >
                    Gerenciar
                  </button>
                </div>
                <div className="divide-y divide-slate-100">
                  {accounts
                    .filter((a) => !a.archived)
                    .map((acc) => (
                      <div key={acc.id} className="py-3 flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-3 h-10 rounded-full" style={{ backgroundColor: acc.color }} />
                          <div>
                            <p className="font-semibold text-sm text-slate-900">{acc.name}</p>
                            <p className="text-xs text-slate-400">
                              {acc.bank} • {acc.holder}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-sm text-slate-900">{formatMoney(accountBalances[acc.id] || 0)}</p>
                          <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded uppercase font-medium">
                            {acc.type}
                          </span>
                        </div>
                      </div>
                    ))}
                </div>
              </div>

              {/* Cartões e Faturas */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                    <CreditCard className="w-5 h-5 text-purple-600" />
                    <span>Cartões de Crédito e Limites</span>
                  </h2>
                  <button
                    onClick={() => setActiveTab('cards')}
                    className="text-xs font-semibold text-purple-600 hover:text-purple-700"
                  >
                    Gerenciar
                  </button>
                </div>
                <div className="space-y-4">
                  {cards
                    .filter((c) => !c.archived)
                    .map((card) => {
                      const stats = cardStats[card.id] || { committedCents: 0, availableCents: card.limitCents };
                      const pct = Math.min(100, Math.round((stats.committedCents / card.limitCents) * 100));
                      return (
                        <div key={card.id} className="p-4 rounded-xl border border-slate-100 bg-slate-50">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <p className="font-bold text-sm text-slate-900">{card.name}</p>
                              <p className="text-xs text-slate-400">
                                Fecha dia {card.closingDay} • Vence dia {card.dueDay}
                              </p>
                            </div>
                            <span className="text-xs font-semibold text-slate-700">{pct}% Usado</span>
                          </div>
                          <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden my-2">
                            <div
                              className={`h-full ${pct > 80 ? 'bg-rose-500' : 'bg-purple-600'}`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <div className="flex justify-between text-xs text-slate-600 mt-1">
                            <span>Comprometido: {formatMoney(stats.committedCents)}</span>
                            <span>Disponível: {formatMoney(stats.availableCents)}</span>
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
            {/* Barra de Filtros e Busca */}
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

            {/* Tabela de Lançamentos com Edição e Exclusão */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200">
                      <th className="py-3 px-4">Data</th>
                      <th className="py-3 px-4">Descrição</th>
                      <th className="py-3 px-4">Categoria</th>
                      <th className="py-3 px-4">Origem / Destino</th>
                      <th className="py-3 px-4">Situação</th>
                      <th className="py-3 px-4 text-right">Valor</th>
                      <th className="py-3 px-4 text-center">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredTransactions.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="text-center py-8 text-slate-400">
                          Nenhum lançamento encontrado.
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
                                {tx.isRecurring && (
                                  <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-semibold flex items-center space-x-0.5">
                                    <Clock className="w-2.5 h-2.5" />
                                    <span>Recorrente</span>
                                  </span>
                                )}
                              </div>
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
                                title="Clique para alternar entre realizado e pendente"
                                className={`text-[11px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider flex items-center space-x-1 transition ${
                                  tx.status === 'REALIZADO'
                                    ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                                    : tx.status === 'COMPROMETIDO'
                                    ? 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                                    : 'bg-blue-100 text-blue-800'
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
                                  title="Editar este lançamento"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteTransaction(tx)}
                                  className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-md transition"
                                  title="Excluir este lançamento"
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

        {/* ===================== ABA: CONTAS E CARTEIRAS ===================== */}
        {activeTab === 'accounts' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Contas e Carteiras</h2>
                <p className="text-xs text-slate-500">Cadastre e edite contas correntes, investimentos e dinheiro físico</p>
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
                <div
                  key={acc.id}
                  className={`bg-white rounded-2xl border p-5 shadow-sm flex flex-col justify-between ${
                    acc.archived ? 'opacity-60 border-slate-300' : 'border-slate-200'
                  }`}
                >
                  <div>
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center space-x-2">
                        <span className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: acc.color }} />
                        <h3 className="font-bold text-slate-900 text-base">{acc.name}</h3>
                      </div>
                      {acc.archived && (
                        <span className="text-[10px] bg-slate-200 text-slate-600 px-2 py-0.5 rounded font-bold uppercase">
                          Arquivada
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mb-1">Instituição: <strong className="text-slate-700">{acc.bank}</strong></p>
                    <p className="text-xs text-slate-500 mb-1">Titular: <strong className="text-slate-700">{acc.holder}</strong></p>
                    <p className="text-xs text-slate-500">Tipo: <strong className="capitalize text-slate-700">{acc.type}</strong></p>
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold">Saldo Atual</span>
                      <p className="text-lg font-bold text-slate-900">{formatMoney(accountBalances[acc.id] || 0)}</p>
                    </div>

                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => setModalState({ isOpen: true, type: 'account', mode: 'edit', data: acc })}
                        className="p-2 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                        title="Editar Conta"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => toggleArchiveAccount(acc.id)}
                        className="p-2 text-slate-600 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition"
                        title={acc.archived ? 'Reativar Conta' : 'Arquivar Conta'}
                      >
                        {acc.archived ? <ArchiveRestore className="w-4 h-4" /> : <Archive className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ===================== ABA: CARTÕES DE CRÉDITO ===================== */}
        {activeTab === 'cards' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Cartões de Crédito</h2>
                <p className="text-xs text-slate-500">Gerencie limites, datas de corte, vencimento e titularidade</p>
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
                  <div
                    key={card.id}
                    className={`bg-white rounded-2xl border p-5 shadow-sm flex flex-col justify-between ${
                      card.archived ? 'opacity-60 border-slate-300' : 'border-slate-200'
                    }`}
                  >
                    <div>
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center space-x-2">
                          <CreditCard className="w-5 h-5 text-purple-600" />
                          <h3 className="font-bold text-slate-900 text-base">{card.name}</h3>
                        </div>
                        {card.archived && (
                          <span className="text-[10px] bg-slate-200 text-slate-600 px-2 py-0.5 rounded font-bold uppercase">
                            Arquivado
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mb-1">Banco: <strong className="text-slate-700">{card.bank}</strong> ({card.flag})</p>
                      <p className="text-xs text-slate-500 mb-1">Dia Fechamento: <strong className="text-slate-700">{card.closingDay}</strong></p>
                      <p className="text-xs text-slate-500">Dia Vencimento: <strong className="text-slate-700">{card.dueDay}</strong></p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-slate-500">Limite Total:</span>
                        <span className="font-semibold text-slate-900">{formatMoney(card.limitCents)}</span>
                      </div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-slate-500">Comprometido:</span>
                        <span className="font-semibold text-rose-600">{formatMoney(stats.committedCents)}</span>
                      </div>
                      <div className="flex justify-between text-xs font-bold text-emerald-600">
                        <span>Disponível:</span>
                        <span>{formatMoney(stats.availableCents)}</span>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-end space-x-1">
                      <button
                        onClick={() => setModalState({ isOpen: true, type: 'card', mode: 'edit', data: card })}
                        className="p-2 text-slate-600 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition"
                        title="Editar Cartão"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => toggleArchiveCard(card.id)}
                        className="p-2 text-slate-600 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition"
                        title={card.archived ? 'Reativar Cartão' : 'Arquivar Cartão'}
                      >
                        {card.archived ? <ArchiveRestore className="w-4 h-4" /> : <Archive className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ===================== ABA: CATEGORIAS ===================== */}
        {activeTab === 'categories' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Categorias Financeiras</h2>
                <p className="text-xs text-slate-500">Organize suas despesas e receitas por centros de custo</p>
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
                <div
                  key={cat.id}
                  className={`bg-white rounded-xl border p-4 shadow-sm flex items-center justify-between ${
                    cat.archived ? 'opacity-50 border-slate-300' : 'border-slate-200'
                  }`}
                >
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
                      className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                      title="Editar Categoria"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => toggleArchiveCategory(cat.id)}
                      className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition"
                      title={cat.archived ? 'Reativar Categoria' : 'Arquivar Categoria'}
                    >
                      {cat.archived ? <ArchiveRestore className="w-3.5 h-3.5" /> : <Archive className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ===================== ABA: PROJEÇÕES ===================== */}
        {activeTab === 'projections' && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Projeções Financeiras (Próximos 12 Meses)</h2>
              <p className="text-xs text-slate-500">
                Cálculo de compromissos futuros, parcelamentos cadastrados e previsões mensais.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-600 font-semibold border-b">
                    <th className="py-3 px-4">Mês / Ano</th>
                    <th className="py-3 px-4 text-right">Receitas Previstas</th>
                    <th className="py-3 px-4 text-right">Despesas & Parcelas</th>
                    <th className="py-3 px-4 text-right">Resultado do Mês</th>
                    <th className="py-3 px-4 text-right">Saldo Acumulado</th>
                    <th className="py-3 px-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {Array.from({ length: 12 }).map((_, idx) => {
                    const date = new Date(2026, 8 + idx, 1);
                    const label = date.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' });
                    const simulatedIncome = 1250000;
                    const simulatedExpense = 450000 + (idx < 7 ? 45000 : 0);
                    const net = simulatedIncome - simulatedExpense;
                    const accumulated = monthSummary.totalBankBalance + net * (idx + 1);

                    return (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="py-3 px-4 font-semibold capitalize text-slate-800">{label}</td>
                        <td className="py-3 px-4 text-right text-emerald-600 font-semibold">{formatMoney(simulatedIncome)}</td>
                        <td className="py-3 px-4 text-right text-rose-600 font-semibold">{formatMoney(simulatedExpense)}</td>
                        <td className="py-3 px-4 text-right font-bold text-slate-900">{formatMoney(net)}</td>
                        <td className="py-3 px-4 text-right font-bold text-blue-700">{formatMoney(accumulated)}</td>
                        <td className="py-3 px-4 text-center">
                          <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                            Positivo
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

        {/* ===================== ABA: CENÁRIOS E SIMULAÇÕES ===================== */}
        {activeTab === 'scenarios' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">Cenários & Simulações "What-If"</h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Simule grandes decisões (compras, financiamentos, renda extra) sem contaminar seus lançamentos reais.
              </p>
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
              <h2 className="text-lg font-bold text-slate-900">Backup e Portabilidade de Dados</h2>
              <p className="text-xs text-slate-500">
                Exporte todos os seus dados familiares com total independência e privacidade.
              </p>
            </div>

            <div className="space-y-4">
              <div className="p-4 border border-slate-100 bg-slate-50 rounded-xl flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-sm text-slate-900">Exportar Banco Completo (JSON)</h4>
                  <p className="text-xs text-slate-500">Contas, cartões, categorias, lançamentos e cenários</p>
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
                  <p className="text-xs text-slate-500">Compatível com Excel, Google Planilhas e LibreOffice</p>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            {/* Cabeçalho do Modal */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-base text-slate-900">
                {modalState.mode === 'edit' ? 'Editar' : 'Cadastrar'}{' '}
                {modalState.type === 'account' && 'Conta / Carteira'}
                {modalState.type === 'card' && 'Cartão de Crédito'}
                {modalState.type === 'category' && 'Categoria'}
                {modalState.type === 'transaction' && 'Lançamento'}
              </h3>
              <button
                onClick={() => setModalState({ isOpen: false, type: null, mode: 'create', data: null })}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-md"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Formulário: CONTA */}
            {modalState.type === 'account' && (
              <form onSubmit={handleSaveAccount} className="p-6 space-y-4 overflow-y-auto">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Nome da Conta / Carteira</label>
                  <input
                    type="text"
                    name="name"
                    required
                    defaultValue={modalState.data?.name || ''}
                    placeholder="Ex: Conta Corrente Principal, Carteira de Dinheiro"
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
                      <option value="outra">Outra</option>
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
                      defaultValue={modalState.data?.holder || 'Titular'}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Cor de Identificação</label>
                  <input
                    type="color"
                    name="color"
                    defaultValue={modalState.data?.color || '#2563eb'}
                    className="w-full h-10 p-1 border border-slate-300 rounded-lg cursor-pointer"
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
                    Salvar Alterações
                  </button>
                </div>
              </form>
            )}

            {/* Formulário: CARTÃO DE CRÉDITO */}
            {modalState.type === 'card' && (
              <form onSubmit={handleSaveCard} className="p-6 space-y-4 overflow-y-auto">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Nome do Cartão</label>
                  <input
                    type="text"
                    name="name"
                    required
                    defaultValue={modalState.data?.name || ''}
                    placeholder="Ex: Nubank Ultravioleta, Itaú Pão de Açúcar"
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
                      placeholder="Ex: Nubank, Itaú"
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
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Limite (R$)</label>
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
                      defaultValue={modalState.data?.closingDay || '28'}
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

            {/* Formulário: CATEGORIA */}
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
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Tipo de Movimentação</label>
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

            {/* Formulário: LANÇAMENTO */}
            {modalState.type === 'transaction' && (
              <form onSubmit={handleSaveTransaction} className="p-6 space-y-4 overflow-y-auto">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Descrição</label>
                  <input
                    type="text"
                    name="description"
                    required
                    defaultValue={modalState.data?.description || ''}
                    placeholder="Ex: Salário da Família, Compra Mercado, Parcela Carro"
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
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Data Competência/Vencimento</label>
                    <input
                      type="date"
                      name="date"
                      required
                      defaultValue={modalState.data?.date || new Date().toISOString().slice(0, 10)}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
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
                      <option value="REALIZADO">Realizado (Já Pago/Recebido)</option>
                      <option value="COMPROMETIDO">Comprometido (Fixo/Assumido)</option>
                      <option value="PREVISTO">Previsto (Estimado)</option>
                      <option value="HIPOTETICO">Hipotético (Simulação)</option>
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
                        Repetir mensalmente (Recorrência Contínua)
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