import React, { useState, useMemo, useEffect } from 'react';
import {
  Wallet,
  CreditCard,
  Tags,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
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
  Clock,
  Users,
  Sparkles,
  PieChart,
  UploadCloud,
  LogOut,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import AuthModal from './components/AuthModal';
import {
  loadInitialAppData,
  syncItem,
  syncBatchTransactions,
  saveToLocalStorage,
  clearDemoDataOnly,
  resetEntireSystem,
  loadDemoPresentationData,
  STORAGE_KEYS,
} from './services/financeService';
import {
  DEMO_ACCOUNTS,
  DEMO_CARDS,
  DEMO_CATEGORIES,
  DEMO_TRANSACTIONS,
  DEMO_SCENARIOS,
} from './data/demoData';
import {
  signOutUser,
  isSupabaseConfigured,
  supabase,
  getUserProfile,
} from './services/supabase';

// Formatação Monetária Segura (em Centavos)
const formatMoney = (cents = 0) => {
  return (cents / 100).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
};

// Usuários da Família e Visões
const FAMILY_MEMBERS = [
  { id: 'user-all', name: '👑 Visão Admin (Toda a Família)', isFamily: true },
  { id: 'family-shared', name: '🏠 Gastos Compartilhados (Família)', isFamily: true },
  { id: 'user-1', name: '👤 Rafael (Apenas Pessoal / Membro)', isFamily: false },
  { id: 'user-2', name: '👤 Ana Débora (Apenas Pessoal / Membro)', isFamily: false },
];

// Categorias Padrão Essenciais do Sistema
const DEFAULT_CATEGORIES = [
  { id: 'cat-1', name: 'Salário & Dividendos', type: 'INCOME', color: '#16a34a', archived: false },
  { id: 'cat-2', name: 'Renda Extra & Consultoria', type: 'INCOME', color: '#0d9488', archived: false },
  { id: 'cat-3', name: 'Moradia (Aluguel/Condomínio)', type: 'EXPENSE', color: '#2563eb', archived: false },
  { id: 'cat-4', name: 'Supermercado & Feira', type: 'EXPENSE', color: '#d97706', archived: false },
  { id: 'cat-5', name: 'Educação & Cursos', type: 'EXPENSE', color: '#7c3aed', archived: false },
  { id: 'cat-6', name: 'Saúde & Farmácia', type: 'EXPENSE', color: '#e11d48', archived: false },
  { id: 'cat-7', name: 'Lazer & Restaurantes', type: 'EXPENSE', color: '#0284c7', archived: false },
  { id: 'cat-8', name: 'Transporte & Combustível', type: 'EXPENSE', color: '#475569', archived: false },
];

export default function App() {
  // Estado Principal (Inicia 100% limpo, sem dados mockados)
  const [activeTab, setActiveTab] = useState('dashboard');
  const [currentMemberId, setCurrentMemberId] = useState('user-all');

  const [accounts, setAccounts] = useState([]);
  const [cards, setCards] = useState([]);
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
  const [transactions, setTransactions] = useState([]);
  const [scenarios, setScenarios] = useState([]);

  // Controle de Nuvem e Sessão de Usuário
  const [isCloudConnected, setIsCloudConnected] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('financas_session');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Restaurar sessão do Supabase Auth caso exista
  useEffect(() => {
    if (isSupabaseConfigured() && supabase) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) {
          getUserProfile(session.user.id).then((profile) => {
            const role =
              profile?.role ||
              session.user.user_metadata?.role ||
              (session.user.email?.includes('anadebora') ? 'member' : 'admin');
            const memberKey =
              profile?.member_key ||
              session.user.user_metadata?.memberKey ||
              (role === 'admin' ? 'user-1' : 'user-2');
            const userName =
              profile?.name ||
              session.user.user_metadata?.name ||
              (memberKey === 'user-1' ? 'Rafael' : 'Ana Débora');
            const userObj = {
              id: session.user.id,
              email: session.user.email,
              name: userName,
              role,
              memberKey,
            };
            setCurrentUser(userObj);
            saveToLocalStorage('financas_session', userObj);
          });
        }
      });

      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((_event, session) => {
        if (!session) {
          setCurrentUser(null);
          try {
            localStorage.removeItem('financas_session');
          } catch {
            // ignore
          }
        }
      });

      return () => subscription.unsubscribe();
    }
  }, []);

  // Carregamento inicial de dados (executado quando há usuário logado)
  useEffect(() => {
    if (!currentUser) return;

    loadInitialAppData({
      categories: DEFAULT_CATEGORIES,
    }).then((res) => {
      if (res) {
        setIsCloudConnected(res.isCloud);
        if (res.accounts) setAccounts(res.accounts);
        if (res.cards) setCards(res.cards);
        if (res.categories) setCategories(res.categories);
        if (res.transactions) setTransactions(res.transactions);
        if (res.scenarios) setScenarios(res.scenarios);
      }
    });
  }, [currentUser]);

  const handleLoginSuccess = (user) => {
    setCurrentUser(user);
    try {
      localStorage.setItem('financas_session', JSON.stringify(user));
    } catch (e) {
      console.warn(e);
    }
    if (user.role === 'member') {
      setCurrentMemberId(user.memberKey || 'user-2');
    }
  };

  const handleLogout = async () => {
    await signOutUser();
    setCurrentUser(null);
    try {
      localStorage.removeItem('financas_session');
    } catch (e) {
      console.warn(e);
    }
  };

  // Carregar dados de demonstração sob demanda para apresentar a aplicação
  const handleLoadDemoData = async () => {
    if (confirm('Deseja carregar os dados de demonstração/apresentação? Isso criará contas, cartões, lançamentos e simulações de exemplo para você demonstrar a plataforma.')) {
      const res = await loadDemoPresentationData({
        accounts: DEMO_ACCOUNTS,
        cards: DEMO_CARDS,
        categories: DEMO_CATEGORIES,
        transactions: DEMO_TRANSACTIONS,
        scenarios: DEMO_SCENARIOS,
      });
      setAccounts(res.accounts);
      setCards(res.cards);
      setCategories(res.categories);
      setTransactions(res.transactions);
      setScenarios(res.scenarios);
      alert('Dados de demonstração carregados com sucesso! Você pode zerar tudo a qualquer momento.');
    }
  };

  // Limpeza estritamente segura apenas de registros de exemplo (prefixo demo-)
  // NUNCA exclui lançamentos reais (tx-...) nem altera saldos de contas reais do usuário
  const handleClearOnlyDemo = async () => {
    const demoTxs = transactions.filter((t) => String(t.id || '').startsWith('demo-'));
    const demoAccs = accounts.filter((a) => String(a.id || '').startsWith('demo-'));
    const demoCards = cards.filter((c) => String(c.id || '').startsWith('demo-'));
    const demoScens = scenarios.filter((s) => String(s.id || '').startsWith('demo-'));

    const totalDemoItems = demoTxs.length + demoAccs.length + demoCards.length + demoScens.length;

    if (totalDemoItems === 0) {
      alert('Não há dados de demonstração pendentes. Todos os seus lançamentos e contas atuais são dados reais!');
      return;
    }

    if (
      confirm(
        `Deseja realmente remover os dados de demonstração (${demoTxs.length} lançamento(s) de exemplo)?\n\n` +
        `ATENÇÃO: Todos os seus lançamentos e contas reais cadastrados serão 100% PRESERVADOS intactos.`
      )
    ) {
      const res = await clearDemoDataOnly({
        transactions,
        scenarios,
        accounts,
        cards,
      });
      setTransactions(res.transactions);
      setScenarios(res.scenarios);
      setAccounts(res.accounts);
      setCards(res.cards);
      alert('Dados fictícios de exemplo removidos com sucesso! Seus dados reais permanecem intactos.');
    }
  };

  // Reset Geral do Sistema (Apenas mediante confirmação textual em Configurações Avançadas)
  const handleResetEntireSystem = async () => {
    const confirmInput = prompt(
      '⚠️ ATENÇÃO MÁXIMA: Esta ação apagará TODOS os dados cadastrados (todas as suas contas, cartões, lançamentos e simulações).\n\nPara confirmar a exclusão TOTAL definitiva, digite ZERAR abaixo:'
    );

    if (confirmInput === 'ZERAR') {
      const res = await resetEntireSystem();
      setTransactions(res.transactions);
      setScenarios(res.scenarios);
      setAccounts(res.accounts);
      setCards(res.cards);
      alert('Sistema resetado com sucesso.');
    } else if (confirmInput !== null) {
      alert('Operação cancelada. A palavra "ZERAR" não foi digitada corretamente.');
    }
  };

  // Filtros e Ordenação de Lançamentos
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');
  // Ordenação de Lançamentos (padrão: data mais próxima da data atual)
  const [txSort, setTxSort] = useState({ field: 'date', direction: 'closest' }); // 'closest' | 'asc' | 'desc'

  // Ordenação de Projeções
  const [projectionSort, setProjectionSort] = useState({ field: 'month', direction: 'asc' });

  // Horizonte de Projeções (12, 24 ou 36 meses)
  const [projectionHorizon, setProjectionHorizon] = useState(12);

  // Mês de Referência para o Dashboard (padrão: mês atual 'YYYY-MM')
  const [dashboardMonth, setDashboardMonth] = useState(() => new Date().toISOString().slice(0, 7));
  const currentActualMonth = useMemo(() => new Date().toISOString().slice(0, 7), []);

  const formatMonthLabel = (yearMonthStr) => {
    try {
      const [y, m] = yearMonthStr.split('-');
      const d = new Date(parseInt(y, 10), parseInt(m, 10) - 1, 1);
      return d.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
    } catch {
      return yearMonthStr;
    }
  };

  const changeDashboardMonth = (offset) => {
    const [y, m] = dashboardMonth.split('-').map(Number);
    const nextDate = new Date(y, m - 1 + offset, 1);
    const nextStr = `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, '0')}`;
    setDashboardMonth(nextStr);
  };

  // Controles dos Gráficos
  const [chartIncludeScenarios, setChartIncludeScenarios] = useState(true);
  const [chartFlowFilter, setChartFlowFilter] = useState('ALL'); // 'ALL' | 'EXPENSE' | 'INCOME'

  // Controles da Importação de Faturas
  const [importSelectedCard, setImportSelectedCard] = useState('card-1');
  const [importPreviewData, setImportPreviewData] = useState(null);

  // Controle de Campos Condicionais do Modal (Conta vs Cartão)
  const [modalSourceType, setModalSourceType] = useState('ACCOUNT');

  // Controle de Escopo de Edição (Apenas esta parcela vs Todas vs Futuras)
  const [editScope, setEditScope] = useState('single'); // 'single' | 'all' | 'future'

  // Controle de Modo do Valor no Parcelamento (Total da Compra vs Valor da Parcela)
  const [installmentValueMode, setInstallmentValueMode] = useState('TOTAL'); // 'TOTAL' | 'INSTALLMENT'
  const [formAmount, setFormAmount] = useState('');
  const [formInstallments, setFormInstallments] = useState(1);

  // Estado do Modal de Confirmação de Exclusão
  const [deleteModalState, setDeleteModalState] = useState({
    isOpen: false,
    transaction: null,
    scope: 'single', // 'single' | 'future' | 'all'
  });

  // Estado dos Modais
  const [modalState, setModalState] = useState({
    isOpen: false,
    type: null, // 'account' | 'card' | 'category' | 'transaction' | 'scenario'
    mode: 'create', // 'create' | 'edit'
    data: null,
    scenarioIdToConvert: null,
  });

  // Função auxiliar para abrir o modal de lançamento inicializando os campos
  const openTransactionModal = (mode = 'create', data = null, scenarioId = null) => {
    const sType = data?.sourceType || (data?.cardId ? 'CARD' : 'ACCOUNT');
    setModalSourceType(sType);
    setEditScope('single');
    setFormAmount(data?.amountCents ? (data.amountCents / 100).toFixed(2) : '');
    setFormInstallments(data?.installments || 1);
    setInstallmentValueMode('TOTAL');
    setModalState({
      isOpen: true,
      type: 'transaction',
      mode,
      data,
      scenarioIdToConvert: scenarioId,
    });
  };

  // Lançamentos Visíveis de acordo com a Visão selecionada (Admin x Família x Membro)
  const visibleTransactions = useMemo(() => {
    return transactions.filter((t) => {
      if (currentMemberId === 'user-all') {
        // Na Visão Admin (Toda a Família): exibe absolutamente TUDO (familiar + pessoal de todos)
        return true;
      }
      if (currentMemberId === 'family-shared') {
        // Apenas lançamentos de escopo familiar compartilhado
        return t.scope === 'FAMILY';
      }
      if (currentMemberId === 'user-1') {
        // Apenas lançamentos pessoais do membro Rafael
        return t.ownerId === 'user-1';
      }
      if (currentMemberId === 'user-2') {
        // Apenas lançamentos pessoais da membra Ana Débora
        return t.ownerId === 'user-2';
      }
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

  // Contas filtradas pelo titular selecionado
  const visibleAccounts = useMemo(() => {
    return accounts.filter((acc) => {
      if (currentMemberId === 'user-all') return true; // Admin vê todas as contas
      if (currentMemberId === 'family-shared') return acc.ownerId === 'user-all' || !acc.ownerId;
      return acc.ownerId === 'user-all' || acc.ownerId === currentMemberId;
    });
  }, [accounts, currentMemberId]);

  // Cartões filtrados pelo titular selecionado
  const visibleCards = useMemo(() => {
    return cards.filter((c) => {
      if (currentMemberId === 'user-all') return true; // Admin vê todos os cartões
      if (currentMemberId === 'family-shared') return c.ownerId === 'user-all' || !c.ownerId;
      return c.ownerId === 'user-all' || c.ownerId === currentMemberId;
    });
  }, [cards, currentMemberId]);

  // Lançamentos dos cenários ativos como Hipotéticos (para lançamentos, gráficos e projeções)
  const hypotheticalTransactions = useMemo(() => {
    const list = [];
    scenarios.filter((s) => s.active).forEach((scen) => {
      const isExpense = scen.type === 'EXPENSE' || scen.monthlyImpactCents < 0;
      const absAmount = Math.abs(scen.monthlyImpactCents);
      const months = scen.months || 12;
      const baseDate = scen.startDate ? new Date(scen.startDate + 'T12:00:00') : new Date();

      // Visibilidade de acordo com o membro selecionado
      const isVisibleInMemberView =
        currentMemberId === 'user-all'
          ? (scen.scope === 'FAMILY' || !scen.scope)
          : (scen.scope === 'FAMILY' || scen.ownerId === currentMemberId);

      if (!isVisibleInMemberView) return;

      for (let i = 1; i <= Math.min(months, 36); i++) {
        const d = new Date(baseDate);
        d.setMonth(baseDate.getMonth() + (i - 1));

        list.push({
          id: `hypo-${scen.id}-${i}`,
          scenarioId: scen.id,
          description: `${scen.title} (Simulação ${String(i).padStart(2, '0')}/${String(months).padStart(2, '0')})`,
          amountCents: absAmount,
          type: isExpense ? 'EXPENSE' : 'INCOME',
          status: 'HIPOTETICO',
          date: d.toISOString().slice(0, 10),
          categoryId: scen.categoryId || categories[0]?.id,
          sourceType: scen.sourceType || 'ACCOUNT',
          accountId: scen.sourceType === 'ACCOUNT' ? (scen.accountId || accounts[0]?.id) : null,
          cardId: scen.sourceType === 'CARD' ? (scen.cardId || cards[0]?.id) : null,
          scope: scen.scope || 'FAMILY',
          ownerId: scen.ownerId || (currentMemberId === 'user-all' ? 'user-1' : currentMemberId),
          installmentNumber: i,
          installmentCount: months,
          isHypothetical: true,
          scenarioData: scen,
        });
      }
    });
    return list;
  }, [scenarios, categories, accounts, cards, currentMemberId]);

  // Junção de lançamentos reais com simulações hipotéticas ativas
  const allDisplayTransactions = useMemo(() => {
    return [...visibleTransactions, ...hypotheticalTransactions];
  }, [visibleTransactions, hypotheticalTransactions]);

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

  // Faturas dos Cartões de Crédito (Detalhamento, Itens e Limites)
  const cardInvoices = useMemo(() => {
    const todayTime = new Date(new Date().toISOString().slice(0, 10) + 'T12:00:00').getTime();
    const map = {};
    cards.forEach((card) => {
      const cardTxs = visibleTransactions.filter((t) => t.cardId === card.id && t.status !== 'CANCELADO');
      cardTxs.sort((a, b) => {
        const diffA = Math.abs(new Date(a.date + 'T12:00:00').getTime() - todayTime);
        const diffB = Math.abs(new Date(b.date + 'T12:00:00').getTime() - todayTime);
        if (diffA !== diffB) return diffA - diffB;
        return new Date(a.date + 'T12:00:00') - new Date(b.date + 'T12:00:00');
      });
      // Limite comprometido total (soma de todas as parcelas ativas)
      const committed = cardTxs.reduce((acc, t) => acc + (t.type === 'EXPENSE' ? t.amountCents : 0), 0);
      // Fatura do mês selecionado: apenas despesas com vencimento no mês do dashboard
      const currentMonthExpenses = cardTxs
        .filter((t) => t.type === 'EXPENSE' && t.date && t.date.startsWith(dashboardMonth))
        .reduce((acc, t) => acc + t.amountCents, 0);

      map[card.id] = {
        card,
        items: cardTxs,
        invoiceTotalCents: currentMonthExpenses,
        committedCents: committed,
        availableCents: Math.max(0, card.limitCents - committed),
      };
    });
    return map;
  }, [cards, visibleTransactions, dashboardMonth]);

  // Retrocompatibilidade para cardStats
  const cardStats = cardInvoices;

  // Totais do Mês Selecionado (Dashboard)
  const monthSummary = useMemo(() => {
    let income = 0;
    let expense = 0;
    let committed = 0;

    visibleTransactions.forEach((tx) => {
      // Filtrar estritamente pelo mês de referência (ex: '2026-09') e ignorar cancelados
      if (tx.status === 'CANCELADO') return;
      if (!tx.date || !tx.date.startsWith(dashboardMonth)) return;

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
  }, [visibleTransactions, accountBalances, cardStats, dashboardMonth]);

  // Maiores Gastos por Categoria no Mês do Dashboard
  const dashboardCategoryChartData = useMemo(() => {
    const expenseMap = {};
    let totalExpensesCents = 0;

    visibleTransactions.forEach((tx) => {
      if (tx.status === 'CANCELADO') return;
      if (!tx.date || !tx.date.startsWith(dashboardMonth)) return;
      if (tx.type !== 'EXPENSE') return;

      expenseMap[tx.categoryId] = (expenseMap[tx.categoryId] || 0) + tx.amountCents;
      totalExpensesCents += tx.amountCents;
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

    return {
      expensesList,
      totalExpensesCents,
    };
  }, [visibleTransactions, dashboardMonth, categories]);

  // Próximos Vencimentos & Compromissos para o Dashboard (Ordem cronológica crescente a partir de hoje)
  const upcomingCommitments = useMemo(() => {
    const todayStr = new Date().toISOString().slice(0, 10);
    const todayTime = new Date(todayStr + 'T12:00:00').getTime();

    // Filtra transações não canceladas: vencimentos futuros ou pendentes/atrasados
    const pendingOrUpcoming = visibleTransactions.filter((tx) => {
      if (tx.status === 'CANCELADO') return false;
      if (tx.date >= todayStr) return true;
      return tx.status === 'COMPROMETIDO';
    });

    // Ordenação cronológica a partir de hoje:
    // Compromissos futuros/de hoje em diante: do mais imediato ao mais distante (hoje, amanhã, próximo mês...)
    // Parcelas de 2031 ficam lá no final da fila!
    pendingOrUpcoming.sort((a, b) => {
      const timeA = new Date(a.date + 'T12:00:00').getTime();
      const timeB = new Date(b.date + 'T12:00:00').getTime();

      const isUpcomingA = timeA >= todayTime;
      const isUpcomingB = timeB >= todayTime;

      if (isUpcomingA && isUpcomingB) {
        return timeA - timeB;
      }
      if (isUpcomingA && !isUpcomingB) return -1;
      if (!isUpcomingA && isUpcomingB) return 1;

      return timeB - timeA;
    });

    return pendingOrUpcoming.slice(0, 6);
  }, [visibleTransactions]);

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
    const type = fd.get('type') || 'EXPENSE';
    const isExpense = type === 'EXPENSE';
    const signedAmount = isExpense ? -Math.abs(amount) : Math.abs(amount);
    const months = parseInt(fd.get('months') || '12');
    const sType = fd.get('sourceType') || modalSourceType || 'ACCOUNT';

    const newScen = {
      id: modalState.mode === 'edit' ? modalState.data.id : `scen-${Date.now()}`,
      title: fd.get('title'),
      type,
      monthlyImpactCents: signedAmount,
      months,
      startDate: fd.get('startDate') || new Date().toISOString().slice(0, 10),
      categoryId: fd.get('categoryId') || categories[0]?.id,
      sourceType: sType,
      accountId: sType === 'ACCOUNT' ? (fd.get('accountId') || accounts[0]?.id) : null,
      cardId: sType === 'CARD' ? (fd.get('cardId') || cards[0]?.id) : null,
      scope: fd.get('scope') || 'FAMILY',
      ownerId: fd.get('ownerId') || (currentMemberId === 'user-all' ? 'user-1' : currentMemberId),
      active: modalState.mode === 'edit' ? modalState.data.active : true,
    };

    let updatedScenarios;
    if (modalState.mode === 'edit') {
      updatedScenarios = scenarios.map((s) => (s.id === newScen.id ? newScen : s));
    } else {
      updatedScenarios = [...scenarios, newScen];
    }
    setScenarios(updatedScenarios);
    saveToLocalStorage('financas_scenarios_v1', updatedScenarios);
    syncItem('scenarios', newScen);

    setModalState({ isOpen: false, type: null, mode: 'create', data: null, scenarioIdToConvert: null });
  };

  // Converter Cenário em Lançamentos Reais abrindo o modal de lançamento pré-preenchido
  const handleConvertScenarioToReal = (scen) => {
    if (!scen) return;
    const isExpense = scen.type === 'EXPENSE' || scen.monthlyImpactCents < 0;
    const absAmount = Math.abs(scen.monthlyImpactCents);
    const months = scen.months || 1;
    const sType = scen.sourceType || 'ACCOUNT';

    const prefilledData = {
      description: scen.title,
      amountCents: absAmount * months,
      monthlyAmountCents: absAmount,
      type: isExpense ? 'EXPENSE' : 'INCOME',
      status: 'COMPROMETIDO',
      date: scen.startDate || new Date().toISOString().slice(0, 10),
      categoryId: scen.categoryId || categories[0]?.id,
      sourceType: sType,
      accountId: scen.accountId || accounts[0]?.id,
      cardId: scen.cardId || cards[0]?.id,
      scope: scen.scope || 'FAMILY',
      ownerId: scen.ownerId || (currentMemberId === 'user-all' ? 'user-1' : currentMemberId),
      installments: months,
      isRecurring: false,
    };

    openTransactionModal('create', prefilledData, scen.id);
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

    let updatedAccounts;
    if (modalState.mode === 'edit') {
      updatedAccounts = accounts.map((a) => (a.id === id ? newAcc : a));
    } else {
      updatedAccounts = [...accounts, newAcc];
    }
    setAccounts(updatedAccounts);
    saveToLocalStorage('financas_accounts_v1', updatedAccounts);
    syncItem('accounts', newAcc);

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

    let updatedCards;
    if (modalState.mode === 'edit') {
      updatedCards = cards.map((c) => (c.id === id ? newCard : c));
    } else {
      updatedCards = [...cards, newCard];
    }
    setCards(updatedCards);
    saveToLocalStorage('financas_cards_v1', updatedCards);
    syncItem('cards', newCard);

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

    let updatedCategories;
    if (modalState.mode === 'edit') {
      updatedCategories = categories.map((c) => (c.id === id ? newCat : c));
    } else {
      updatedCategories = [...categories, newCat];
    }
    setCategories(updatedCategories);
    saveToLocalStorage('financas_categories_v1', updatedCategories);
    syncItem('categories', newCat);

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
      if (editScope === 'all' && (original.installmentGroupId || original.recurrenceRuleId)) {
        const matched = [];
        const updated = transactions.map((t) => {
          const isMatch =
            (original.installmentGroupId && t.installmentGroupId === original.installmentGroupId) ||
            (original.recurrenceRuleId && t.recurrenceRuleId === original.recurrenceRuleId);
          if (!isMatch) return t;
          const u = {
            ...t,
            description: t.installmentNumber
              ? `${fd.get('description').replace(/\s*\(\d+\/\d+\)/, '')} (${String(t.installmentNumber).padStart(2, '0')}/${String(t.installmentCount).padStart(2, '0')})`
              : fd.get('description'),
            amountCents: amount,
            type: fd.get('type'),
            categoryId: fd.get('categoryId'),
            scope,
            ownerId,
            accountId: modalSourceType === 'ACCOUNT' ? (fd.get('accountId') || null) : null,
            cardId: modalSourceType === 'CARD' ? (fd.get('cardId') || null) : null,
          };
          matched.push(u);
          return u;
        });
        setTransactions(updated);
        saveToLocalStorage('financas_transactions_v1', updated);
        syncBatchTransactions(matched);
      } else if (editScope === 'future' && (original.installmentGroupId || original.recurrenceRuleId)) {
        const matched = [];
        const updated = transactions.map((t) => {
          const isMatch =
            (original.installmentGroupId &&
              t.installmentGroupId === original.installmentGroupId &&
              (t.installmentNumber || 0) >= (original.installmentNumber || 0)) ||
            (original.recurrenceRuleId &&
              t.recurrenceRuleId === original.recurrenceRuleId &&
              t.date >= original.date);
          if (!isMatch) return t;
          const u = {
            ...t,
            description: t.installmentNumber
              ? `${fd.get('description').replace(/\s*\(\d+\/\d+\)/, '')} (${String(t.installmentNumber).padStart(2, '0')}/${String(t.installmentCount).padStart(2, '0')})`
              : fd.get('description'),
            amountCents: amount,
            type: fd.get('type'),
            categoryId: fd.get('categoryId'),
            scope,
            ownerId,
            accountId: modalSourceType === 'ACCOUNT' ? (fd.get('accountId') || null) : null,
            cardId: modalSourceType === 'CARD' ? (fd.get('cardId') || null) : null,
          };
          matched.push(u);
          return u;
        });
        setTransactions(updated);
        saveToLocalStorage('financas_transactions_v1', updated);
        syncBatchTransactions(matched);
      } else {
        const updatedTx = {
          ...original,
          description: fd.get('description'),
          amountCents: amount,
          type: fd.get('type'),
          status: fd.get('status'),
          date: fd.get('date'),
          categoryId: fd.get('categoryId'),
          scope,
          ownerId,
          accountId: modalSourceType === 'ACCOUNT' ? (fd.get('accountId') || null) : null,
          cardId: modalSourceType === 'CARD' ? (fd.get('cardId') || null) : null,
        };

        const updated = transactions.map((t) => (t.id === original.id ? updatedTx : t));
        setTransactions(updated);
        saveToLocalStorage('financas_transactions_v1', updated);
        syncItem('transactions', updatedTx);
      }
    } else {
      const installmentValueMode = fd.get('installmentValueMode') || 'TOTAL';
      if (installments > 1) {
        let installmentAmounts = [];
        if (installmentValueMode === 'INSTALLMENT') {
          // Repete o valor informado em todas as parcelas
          installmentAmounts = Array(installments).fill(amount);
        } else {
          // Divide o valor total pelo número de parcelas
          const baseCents = Math.floor(amount / installments);
          const remainder = amount % installments;
          installmentAmounts = Array.from({ length: installments }, (_, idx) =>
            baseCents + (idx === 0 ? remainder : 0)
          );
        }

        const groupId = `inst-${Date.now()}`;
        const newTxs = [];

        const baseDate = new Date(fd.get('date') + 'T12:00:00');
        for (let i = 1; i <= installments; i++) {
          const installmentDate = new Date(baseDate);
          installmentDate.setMonth(baseDate.getMonth() + (i - 1));

          newTxs.push({
            id: `tx-${Date.now()}-${i}`,
            description: `${fd.get('description')} (${String(i).padStart(2, '0')}/${String(installments).padStart(2, '0')})`,
            amountCents: installmentAmounts[i - 1],
            type: fd.get('type'),
            status: fd.get('status') || 'COMPROMETIDO',
            date: installmentDate.toISOString().slice(0, 10),
            categoryId: fd.get('categoryId'),
            scope,
            ownerId,
            accountId: modalSourceType === 'ACCOUNT' ? (fd.get('accountId') || null) : null,
            cardId: modalSourceType === 'CARD' ? (fd.get('cardId') || null) : null,
            installmentGroupId: groupId,
            installmentNumber: i,
            installmentCount: installments,
          });
        }
        const updated = [...transactions, ...newTxs];
        setTransactions(updated);
        saveToLocalStorage('financas_transactions_v1', updated);
        syncBatchTransactions(newTxs);
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
          accountId: modalSourceType === 'ACCOUNT' ? (fd.get('accountId') || null) : null,
          cardId: modalSourceType === 'CARD' ? (fd.get('cardId') || null) : null,
          isRecurring,
          recurrenceRuleId: isRecurring ? `rec-${Date.now()}` : null,
        };
        const updated = [...transactions, newTx];
        setTransactions(updated);
        saveToLocalStorage('financas_transactions_v1', updated);
        syncItem('transactions', newTx);
      }
    }

    if (modalState.scenarioIdToConvert) {
      const updatedScens = scenarios.map((s) =>
        s.id === modalState.scenarioIdToConvert ? { ...s, active: false } : s
      );
      setScenarios(updatedScens);
      saveToLocalStorage('financas_scenarios_v1', updatedScens);
      const convertedScen = scenarios.find((s) => s.id === modalState.scenarioIdToConvert);
      if (convertedScen) {
        syncItem('scenarios', { ...convertedScen, active: false });
      }
      alert('Cenário convertido em lançamento real com sucesso!');
    }

    setModalState({ isOpen: false, type: null, mode: 'create', data: null, scenarioIdToConvert: null });
    setEditScope('single');
  };

  const handleDeleteTransaction = (tx) => {
    setDeleteModalState({
      isOpen: true,
      transaction: tx,
      scope: 'single',
    });
  };

  const handleConfirmDeleteTransaction = () => {
    if (!deleteModalState.transaction) return;
    const tx = deleteModalState.transaction;
    const scope = deleteModalState.scope;

    let toDelete = [tx];

    if (scope === 'all') {
      toDelete = transactions.filter(
        (t) =>
          (tx.installmentGroupId && t.installmentGroupId === tx.installmentGroupId) ||
          (tx.recurrenceRuleId && t.recurrenceRuleId === tx.recurrenceRuleId)
      );
    } else if (scope === 'future') {
      toDelete = transactions.filter((t) => {
        if (tx.installmentGroupId && t.installmentGroupId === tx.installmentGroupId) {
          return (t.installmentNumber || 0) >= (tx.installmentNumber || 0);
        }
        if (tx.recurrenceRuleId && t.recurrenceRuleId === tx.recurrenceRuleId) {
          return t.date >= tx.date;
        }
        return t.id === tx.id;
      });
    }

    const deleteIds = new Set(toDelete.map((t) => t.id));
    const updated = transactions.filter((t) => !deleteIds.has(t.id));

    setTransactions(updated);
    saveToLocalStorage('financas_transactions_v1', updated);

    if (toDelete.length === 1) {
      syncItem('transactions', toDelete[0], true);
    } else if (toDelete.length > 1) {
      syncBatchTransactions(toDelete, true);
    }

    setDeleteModalState({ isOpen: false, transaction: null, scope: 'single' });
  };

  const handleDeleteAccount = (acc) => {
    const tiedCount = transactions.filter((t) => t.accountId === acc.id).length;
    const warning =
      tiedCount > 0
        ? `\n\nAtenção: Esta conta possui ${tiedCount} lançamento(s) associado(s). Eles ficarão sem conta vinculada.`
        : '';
    if (confirm(`Deseja realmente EXCLUIR DEFINITIVAMENTE a conta "${acc.name}"?${warning}`)) {
      const updatedAccounts = accounts.filter((a) => a.id !== acc.id);
      setAccounts(updatedAccounts);
      saveToLocalStorage(STORAGE_KEYS.accounts, updatedAccounts);
      syncItem('accounts', acc, true);

      if (tiedCount > 0) {
        const updatedTxs = transactions.map((t) => (t.accountId === acc.id ? { ...t, accountId: null } : t));
        setTransactions(updatedTxs);
        saveToLocalStorage(STORAGE_KEYS.transactions, updatedTxs);
      }
    }
  };

  const toggleArchiveAccount = (id) => {
    const target = accounts.find((a) => a.id === id);
    if (!target) return;
    const updatedAcc = { ...target, archived: !target.archived };
    const updated = accounts.map((a) => (a.id === id ? updatedAcc : a));
    setAccounts(updated);
    saveToLocalStorage(STORAGE_KEYS.accounts, updated);
    syncItem('accounts', updatedAcc);
  };

  const handleDeleteCard = (card) => {
    const tiedCount = transactions.filter((t) => t.cardId === card.id).length;
    const warning =
      tiedCount > 0
        ? `\n\nAtenção: Este cartão possui ${tiedCount} lançamento(s) associado(s). Eles ficarão sem cartão vinculado.`
        : '';
    if (confirm(`Deseja realmente EXCLUIR DEFINITIVAMENTE o cartão "${card.name}"?${warning}`)) {
      const updatedCards = cards.filter((c) => c.id !== card.id);
      setCards(updatedCards);
      saveToLocalStorage(STORAGE_KEYS.cards, updatedCards);
      syncItem('cards', card, true);

      if (tiedCount > 0) {
        const updatedTxs = transactions.map((t) => (t.cardId === card.id ? { ...t, cardId: null } : t));
        setTransactions(updatedTxs);
        saveToLocalStorage(STORAGE_KEYS.transactions, updatedTxs);
      }
    }
  };

  const toggleArchiveCard = (id) => {
    const target = cards.find((c) => c.id === id);
    if (!target) return;
    const updatedCard = { ...target, archived: !target.archived };
    const updated = cards.map((c) => (c.id === id ? updatedCard : c));
    setCards(updated);
    saveToLocalStorage(STORAGE_KEYS.cards, updated);
    syncItem('cards', updatedCard);
  };

  const handleDeleteCategory = (cat) => {
    const tiedCount = transactions.filter((t) => t.categoryId === cat.id).length;
    const warning =
      tiedCount > 0
        ? `\n\nAtenção: Esta categoria possui ${tiedCount} lançamento(s) associado(s). Eles ficarão sem categoria vinculada.`
        : '';
    if (confirm(`Deseja realmente EXCLUIR DEFINITIVAMENTE a categoria "${cat.name}"?${warning}`)) {
      const updatedCats = categories.filter((c) => c.id !== cat.id);
      setCategories(updatedCats);
      saveToLocalStorage(STORAGE_KEYS.categories, updatedCats);
      syncItem('categories', cat, true);

      if (tiedCount > 0) {
        const updatedTxs = transactions.map((t) => (t.categoryId === cat.id ? { ...t, categoryId: null } : t));
        setTransactions(updatedTxs);
        saveToLocalStorage(STORAGE_KEYS.transactions, updatedTxs);
      }
    }
  };

  const toggleArchiveCategory = (id) => {
    const target = categories.find((c) => c.id === id);
    if (!target) return;
    const updatedCat = { ...target, archived: !target.archived };
    const updated = categories.map((c) => (c.id === id ? updatedCat : c));
    setCategories(updated);
    saveToLocalStorage(STORAGE_KEYS.categories, updated);
    syncItem('categories', updatedCat);
  };

  const handleDeleteScenario = (scen) => {
    if (confirm(`Deseja realmente excluir o cenário "${scen.title}"?`)) {
      const updated = scenarios.filter((s) => s.id !== scen.id);
      setScenarios(updated);
      saveToLocalStorage(STORAGE_KEYS.scenarios, updated);
      syncItem('scenarios', scen, true);
    }
  };

  const toggleStatusPaid = (tx) => {
    const nextStatus = tx.status === 'REALIZADO' ? 'COMPROMETIDO' : 'REALIZADO';
    const updatedTx = { ...tx, status: nextStatus };
    const updated = transactions.map((t) => (t.id === tx.id ? updatedTx : t));
    setTransactions(updated);
    saveToLocalStorage('financas_transactions_v1', updated);
    syncItem('transactions', updatedTx);
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

  // Handlers para Importação de Faturas e Extratos
  const handleSimulatePdfImport = () => {
    const sampleItems = [
      { id: `imp-${Date.now()}-1`, description: 'Netflix & Spotify', amountCents: 7990, date: new Date().toISOString().slice(0, 10), categoryId: 'cat-7' },
      { id: `imp-${Date.now()}-2`, description: 'Posto Ipiranga Combustível', amountCents: 21050, date: new Date().toISOString().slice(0, 10), categoryId: 'cat-8' },
      { id: `imp-${Date.now()}-3`, description: 'Farmácia Panvel Medicamentos', amountCents: 14520, date: new Date().toISOString().slice(0, 10), categoryId: 'cat-6' },
      { id: `imp-${Date.now()}-4`, description: 'Almoço Restaurante SC-401', amountCents: 18500, date: new Date().toISOString().slice(0, 10), categoryId: 'cat-7' },
    ];

    const analyzed = sampleItems.map((item) => {
      const isDuplicate = transactions.some(
        (t) =>
          t.cardId === importSelectedCard &&
          t.amountCents === item.amountCents &&
          t.description.toLowerCase().trim() === item.description.toLowerCase().trim()
      );
      return { ...item, isDuplicate, selected: !isDuplicate };
    });

    setImportPreviewData(analyzed);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const text = evt.target.result;
        const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
        const parsedItems = [];

        lines.forEach((line, idx) => {
          if (idx === 0 && (line.toLowerCase().includes('data') || line.toLowerCase().includes('desc'))) {
            return;
          }
          const parts = line.split(/[;,\t]/);
          if (parts.length >= 2) {
            const datePart = parts[0]?.trim() || new Date().toISOString().slice(0, 10);
            const descPart = parts[1]?.trim() || `Item ${idx}`;
            let valRaw = parts[2]?.trim() || '0';
            valRaw = valRaw.replace('R$', '').replace(/\s/g, '');
            if (valRaw.includes(',') && valRaw.includes('.')) {
              valRaw = valRaw.replace(/\./g, '').replace(',', '.');
            } else if (valRaw.includes(',')) {
              valRaw = valRaw.replace(',', '.');
            }
            const valNum = Math.abs(parseFloat(valRaw) || 0);
            const amountCents = Math.round(valNum * 100);

            if (amountCents > 0) {
              parsedItems.push({
                id: `imp-file-${Date.now()}-${idx}`,
                description: descPart,
                amountCents,
                date: datePart.includes('/') ? datePart.split('/').reverse().join('-') : datePart,
                categoryId: categories[0]?.id || 'cat-1',
              });
            }
          }
        });

        if (parsedItems.length === 0) {
          alert('Não foi possível identificar lançamentos no arquivo. Use o formato Data; Descrição; Valor (CSV) ou clique em Simular Leitura.');
          return;
        }

        const analyzed = parsedItems.map((item) => {
          const isDuplicate = transactions.some(
            (t) =>
              t.cardId === importSelectedCard &&
              t.amountCents === item.amountCents &&
              t.description.toLowerCase().trim() === item.description.toLowerCase().trim()
          );
          return { ...item, isDuplicate, selected: !isDuplicate };
        });

        setImportPreviewData(analyzed);
      } catch {
        alert('Erro ao processar arquivo.');
      }
    };
    reader.readAsText(file);
  };

  const handleConfirmImport = () => {
    if (!importPreviewData || importPreviewData.length === 0) return;
    const toImport = importPreviewData.filter((i) => i.selected);
    if (toImport.length === 0) {
      alert('Nenhum lançamento selecionado para importação.');
      return;
    }

    const newTxs = toImport.map((item, idx) => ({
      id: `tx-imp-${Date.now()}-${idx}`,
      description: item.description,
      amountCents: item.amountCents,
      type: 'EXPENSE',
      status: 'REALIZADO',
      date: item.date,
      cardId: importSelectedCard,
      categoryId: item.categoryId || categories[0]?.id,
      scope: 'FAMILY',
      ownerId: currentMemberId === 'user-all' ? 'user-1' : currentMemberId,
    }));

    setTransactions((prev) => {
      const updated = [...prev, ...newTxs];
      saveToLocalStorage('financas_transactions_v1', updated);
      return updated;
    });
    syncBatchTransactions(newTxs);

    alert(`${toImport.length} lançamento(s) importado(s) e vinculado(s) à fatura com sucesso!`);
    setImportPreviewData(null);
    setActiveTab('faturas');
  };

  // Filtragem e Ordenação de Lançamentos na tabela (incluindo simulações hipotéticas ativas)
  const filteredTransactions = useMemo(() => {
    const list = allDisplayTransactions.filter((t) => {
      const matchSearch = t.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchType = filterType === 'ALL' || t.type === filterType;
      const matchStatus = filterStatus === 'ALL' || t.status === filterStatus;
      return matchSearch && matchType && matchStatus;
    });

    const todayDate = new Date().toISOString().slice(0, 10);
    const todayTime = new Date(todayDate + 'T12:00:00').getTime();

    return list.sort((a, b) => {
      if (txSort.field === 'date') {
        if (txSort.direction === 'closest') {
          // Ordenação padrão: data mais próxima da data atual
          const diffA = Math.abs(new Date(a.date + 'T12:00:00').getTime() - todayTime);
          const diffB = Math.abs(new Date(b.date + 'T12:00:00').getTime() - todayTime);
          if (diffA !== diffB) return diffA - diffB;
          // Em caso de mesmo distanciamento, data futura tem precedência
          return new Date(a.date + 'T12:00:00') - new Date(b.date + 'T12:00:00');
        }
        if (txSort.direction === 'asc') {
          return new Date(a.date + 'T12:00:00') - new Date(b.date + 'T12:00:00');
        }
        return new Date(b.date + 'T12:00:00') - new Date(a.date + 'T12:00:00');
      }

      if (txSort.field === 'description') {
        const cmp = a.description.localeCompare(b.description, 'pt-BR');
        return txSort.direction === 'asc' ? cmp : -cmp;
      }

      if (txSort.field === 'scope') {
        const scA = a.scope || 'FAMILY';
        const scB = b.scope || 'FAMILY';
        const cmp = scA.localeCompare(scB, 'pt-BR');
        return txSort.direction === 'asc' ? cmp : -cmp;
      }

      if (txSort.field === 'category') {
        const nameA = categories.find((c) => c.id === a.categoryId)?.name || '';
        const nameB = categories.find((c) => c.id === b.categoryId)?.name || '';
        const cmp = nameA.localeCompare(nameB, 'pt-BR');
        return txSort.direction === 'asc' ? cmp : -cmp;
      }

      if (txSort.field === 'source') {
        const nameA =
          accounts.find((acc) => acc.id === a.accountId)?.name ||
          cards.find((c) => c.id === a.cardId)?.name ||
          '';
        const nameB =
          accounts.find((acc) => acc.id === b.accountId)?.name ||
          cards.find((c) => c.id === b.cardId)?.name ||
          '';
        const cmp = nameA.localeCompare(nameB, 'pt-BR');
        return txSort.direction === 'asc' ? cmp : -cmp;
      }

      if (txSort.field === 'status') {
        const cmp = (a.status || '').localeCompare(b.status || '', 'pt-BR');
        return txSort.direction === 'asc' ? cmp : -cmp;
      }

      if (txSort.field === 'amount') {
        return txSort.direction === 'asc'
          ? a.amountCents - b.amountCents
          : b.amountCents - a.amountCents;
      }

      return 0;
    });
  }, [allDisplayTransactions, searchTerm, filterType, filterStatus, txSort, categories, accounts, cards]);

  // Alternador de ordenação de colunas da tabela de lançamentos
  const handleSortTransactions = (field) => {
    if (field === 'date') {
      if (txSort.field !== 'date') {
        setTxSort({ field: 'date', direction: 'closest' });
      } else if (txSort.direction === 'closest') {
        setTxSort({ field: 'date', direction: 'asc' });
      } else if (txSort.direction === 'asc') {
        setTxSort({ field: 'date', direction: 'desc' });
      } else {
        setTxSort({ field: 'date', direction: 'closest' });
      }
    } else {
      if (txSort.field === field) {
        setTxSort({ field, direction: txSort.direction === 'asc' ? 'desc' : 'asc' });
      } else {
        setTxSort({ field, direction: field === 'amount' ? 'desc' : 'asc' });
      }
    }
  };

  if (!currentUser) {
    return (
      <AuthModal
        isOpen={true}
        isMandatory={true}
        onLoginSuccess={handleLoginSuccess}
      />
    );
  }

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
          <div className="flex items-center space-x-2.5">
            {/* Indicador de Nuvem / Local */}
            {isCloudConnected ? (
              <div className="hidden lg:flex items-center space-x-1.5 text-[11px] font-semibold text-emerald-300 bg-emerald-950/60 border border-emerald-700/50 px-2.5 py-1 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>Nuvem Conectada</span>
              </div>
            ) : (
              <div className="hidden lg:flex items-center space-x-1.5 text-[11px] font-semibold text-slate-300 bg-slate-800 border border-slate-700 px-2.5 py-1 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                <span>Modo Local / Demo</span>
              </div>
            )}

            {/* Perfil do Usuário Logado */}
            <div className="flex items-center space-x-2 bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 shadow-sm">
              <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
                {currentUser?.name?.[0] || 'U'}
              </div>
              <div className="hidden sm:block text-left leading-tight">
                <div className="text-xs font-bold text-white leading-none">{currentUser?.name}</div>
                <span className="text-[9px] uppercase font-bold text-blue-400">
                  {currentUser?.role === 'admin' ? 'Administrador' : 'Membro'}
                </span>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="text-slate-400 hover:text-rose-400 hover:bg-slate-700 p-1 rounded transition flex items-center space-x-1 ml-1"
                title="Sair da conta"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="text-[11px] font-medium hidden md:inline">Sair</span>
              </button>
            </div>

            {/* Seletor de Visão (Filtrado pelo Perfil do Usuário) */}
            <div className="flex items-center bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 shadow-sm">
              <Users className="w-4 h-4 text-slate-400 mr-2" />
              <select
                value={currentMemberId}
                onChange={(e) => setCurrentMemberId(e.target.value)}
                className="bg-transparent text-xs font-semibold text-white focus:outline-none cursor-pointer"
              >
                {FAMILY_MEMBERS.filter((m) => {
                  if (currentUser?.role === 'admin') return true;
                  return m.id === 'family-shared' || m.id === currentUser?.memberKey;
                }).map((m) => (
                  <option key={m.id} value={m.id} className="bg-slate-900 text-white">
                    {m.name}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={() => openTransactionModal('create')}
              className="bg-blue-600 hover:bg-blue-500 text-white text-xs sm:text-sm font-semibold px-3 py-2 rounded-lg flex items-center space-x-1.5 shadow-sm transition active:scale-95"
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
            { id: 'charts', label: 'Gráficos & Análise', icon: PieChart },
            { id: 'accounts', label: 'Contas & Cartões', icon: Wallet },
            { id: 'faturas', label: 'Faturas', icon: CreditCard },
            { id: 'categories', label: 'Categorias', icon: Tags },
            { id: 'projections', label: 'Planejamento & Projeções', icon: Calendar },
            { id: 'scenarios', label: 'Cenários & Simulações', icon: Sliders },
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

            {/* Card de Boas-vindas para Sistema Limpo (0 Contas e 0 Lançamentos) */}
            {accounts.length === 0 && transactions.length === 0 && (
              <div className="p-6 bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 border border-blue-200 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm">
                <div className="flex items-start space-x-3">
                  <span className="text-3xl">👋</span>
                  <div>
                    <h3 className="font-bold text-base text-slate-900">Bem-vindo ao Finanças da Família!</h3>
                    <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-xl">
                      Seu sistema está pronto para você cadastrar as contas, cartões e movimentações reais da sua família.
                      Se preferir explorar a ferramenta primeiro com dados de simulação ou apresentá-la a alguém, você pode carregar os dados de demonstração com um clique.
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2 self-stretch sm:self-auto">
                  <button
                    type="button"
                    onClick={handleLoadDemoData}
                    className="px-4 py-2 bg-white hover:bg-slate-50 text-blue-700 border border-blue-300 rounded-xl text-xs font-semibold whitespace-nowrap shadow-sm transition active:scale-95 flex items-center space-x-1.5"
                  >
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    <span>Carregar Exemplos (Demo)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setModalState({ isOpen: true, type: 'account', mode: 'create', data: null });
                    }}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold whitespace-nowrap shadow-sm transition active:scale-95 flex items-center space-x-1.5"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Cadastrar 1ª Conta</span>
                  </button>
                </div>
              </div>
            )}

            {/* Banner para Modo Demonstração / Apresentação Ativo */}
            {transactions.some((t) => String(t.id || '').startsWith('demo-')) && (
              <div className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">✨</span>
                  <div>
                    <h4 className="font-bold text-sm text-amber-950">Dados de Demonstração Detectados</h4>
                    <p className="text-xs text-amber-800">
                      Existem lançamentos de exemplo carregados no sistema. Você pode removê-los com segurança sem afetar seus lançamentos reais.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleClearOnlyDemo}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold whitespace-nowrap shadow-sm transition active:scale-95 flex items-center justify-center space-x-1.5 self-start sm:self-auto"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Remover Apenas Exemplos</span>
                </button>
              </div>
            )}

            {/* Seletor de Mês de Referência do Dashboard */}
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Mês de Referência:</span>
                    <span className="text-base font-bold text-slate-900 capitalize">{formatMonthLabel(dashboardMonth)}</span>
                    {dashboardMonth === currentActualMonth ? (
                      <span className="text-[10px] font-bold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">
                        Mês Atual
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setDashboardMonth(currentActualMonth)}
                        className="text-[10px] font-bold bg-blue-50 text-blue-600 hover:bg-blue-100 px-2.5 py-0.5 rounded-full transition"
                      >
                        Voltar para Mês Atual
                      </button>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Os totais de receitas, despesas e faturas abaixo refletem apenas os lançamentos e parcelas deste mês.
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2 self-end sm:self-auto">
                <button
                  type="button"
                  onClick={() => changeDashboardMonth(-1)}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 hover:text-slate-900 transition flex items-center space-x-1 text-xs font-semibold shadow-xs"
                  title="Mês Anterior"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Anterior</span>
                </button>
                <button
                  type="button"
                  onClick={() => changeDashboardMonth(1)}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 hover:text-slate-900 transition flex items-center space-x-1 text-xs font-semibold shadow-xs"
                  title="Próximo Mês"
                >
                  <span>Próximo</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

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
                <div className="text-xs text-slate-400 mt-2">Previsto + Realizado ({formatMonthLabel(dashboardMonth)})</div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between text-slate-400 mb-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Despesas Mês</span>
                  <ArrowDownRight className="w-5 h-5 text-rose-500" />
                </div>
                <div className="text-2xl font-bold text-rose-600">{formatMoney(monthSummary.expense)}</div>
                <div className="text-xs text-slate-400 mt-2">Fixas, Cartões & Parcelas ({formatMonthLabel(dashboardMonth)})</div>
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

            {/* Widget Resumo de Gráficos na Visão Geral */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                    <PieChart className="w-4 h-4 text-blue-600" />
                    <span>Maiores Gastos por Categoria ({formatMonthLabel(dashboardMonth)})</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">Onde o orçamento deste mês está concentrado</p>
                </div>
                <button onClick={() => setActiveTab('charts')} className="text-xs font-semibold text-blue-600 hover:underline">
                  Ver Análise Completa
                </button>
              </div>

              {dashboardCategoryChartData.expensesList.length === 0 ? (
                <p className="text-xs text-slate-400 py-3 text-center">Nenhuma despesa para exibir no mês de {formatMonthLabel(dashboardMonth)}.</p>
              ) : (
                <div className="space-y-3">
                  {dashboardCategoryChartData.expensesList.slice(0, 3).map((item) => (
                    <div key={item.catId} className="space-y-1">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-slate-700 flex items-center space-x-1.5">
                          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                          <span>{item.name}</span>
                        </span>
                        <span className="text-slate-900">{formatMoney(item.amountCents)} ({item.percentage}%)</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-300" style={{ width: `${item.percentage}%`, backgroundColor: item.color }} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
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
                  {upcomingCommitments.length === 0 ? (
                    <p className="text-xs text-slate-400 py-6 text-center">Nenhum vencimento pendente para os próximos dias.</p>
                  ) : (
                    upcomingCommitments.map((tx) => (
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
                    ))
                  )}
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

                {transactions.some((t) => String(t.id || '').startsWith('demo-')) && (
                  <button
                    type="button"
                    onClick={handleClearOnlyDemo}
                    className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 px-3 py-2 rounded-lg text-sm font-semibold flex items-center space-x-1 transition ml-auto"
                    title="Excluir apenas lançamentos fictícios de exemplo (seus dados reais são preservados)"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span className="hidden sm:inline">Limpar Exemplos</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => openTransactionModal('create')}
                  className={`bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center space-x-1 ${
                    transactions.some((t) => t.id.startsWith('demo-')) ? '' : 'ml-auto'
                  }`}
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
                      <th
                        onClick={() => handleSortTransactions('date')}
                        className="py-3 px-4 cursor-pointer hover:bg-slate-200/80 transition select-none group"
                        title="Clique para alternar ordenação por data (Mais próxima / Antiga / Futura)"
                      >
                        <div className="flex items-center space-x-1">
                          <span>Data</span>
                          {txSort.field === 'date' ? (
                            txSort.direction === 'closest' ? (
                              <span className="text-[10px] bg-blue-100 text-blue-800 font-bold px-1.5 py-0.5 rounded ml-1 whitespace-nowrap">
                                Mais próxima
                              </span>
                            ) : txSort.direction === 'asc' ? (
                              <ArrowUp className="w-3.5 h-3.5 text-blue-600 ml-1" />
                            ) : (
                              <ArrowDown className="w-3.5 h-3.5 text-blue-600 ml-1" />
                            )
                          ) : (
                            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 opacity-40 group-hover:opacity-100 transition ml-1" />
                          )}
                        </div>
                      </th>
                      <th
                        onClick={() => handleSortTransactions('description')}
                        className="py-3 px-4 cursor-pointer hover:bg-slate-200/80 transition select-none group"
                        title="Clique para ordenar por descrição"
                      >
                        <div className="flex items-center space-x-1">
                          <span>Descrição</span>
                          {txSort.field === 'description' ? (
                            txSort.direction === 'asc' ? (
                              <ArrowUp className="w-3.5 h-3.5 text-blue-600 ml-1" />
                            ) : (
                              <ArrowDown className="w-3.5 h-3.5 text-blue-600 ml-1" />
                            )
                          ) : (
                            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 opacity-40 group-hover:opacity-100 transition ml-1" />
                          )}
                        </div>
                      </th>
                      <th
                        onClick={() => handleSortTransactions('scope')}
                        className="py-3 px-4 cursor-pointer hover:bg-slate-200/80 transition select-none group"
                        title="Clique para ordenar por escopo"
                      >
                        <div className="flex items-center space-x-1">
                          <span>Escopo</span>
                          {txSort.field === 'scope' ? (
                            txSort.direction === 'asc' ? (
                              <ArrowUp className="w-3.5 h-3.5 text-blue-600 ml-1" />
                            ) : (
                              <ArrowDown className="w-3.5 h-3.5 text-blue-600 ml-1" />
                            )
                          ) : (
                            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 opacity-40 group-hover:opacity-100 transition ml-1" />
                          )}
                        </div>
                      </th>
                      <th
                        onClick={() => handleSortTransactions('category')}
                        className="py-3 px-4 cursor-pointer hover:bg-slate-200/80 transition select-none group"
                        title="Clique para ordenar por categoria"
                      >
                        <div className="flex items-center space-x-1">
                          <span>Categoria</span>
                          {txSort.field === 'category' ? (
                            txSort.direction === 'asc' ? (
                              <ArrowUp className="w-3.5 h-3.5 text-blue-600 ml-1" />
                            ) : (
                              <ArrowDown className="w-3.5 h-3.5 text-blue-600 ml-1" />
                            )
                          ) : (
                            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 opacity-40 group-hover:opacity-100 transition ml-1" />
                          )}
                        </div>
                      </th>
                      <th
                        onClick={() => handleSortTransactions('source')}
                        className="py-3 px-4 cursor-pointer hover:bg-slate-200/80 transition select-none group"
                        title="Clique para ordenar por conta ou cartão"
                      >
                        <div className="flex items-center space-x-1">
                          <span>Conta / Cartão</span>
                          {txSort.field === 'source' ? (
                            txSort.direction === 'asc' ? (
                              <ArrowUp className="w-3.5 h-3.5 text-blue-600 ml-1" />
                            ) : (
                              <ArrowDown className="w-3.5 h-3.5 text-blue-600 ml-1" />
                            )
                          ) : (
                            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 opacity-40 group-hover:opacity-100 transition ml-1" />
                          )}
                        </div>
                      </th>
                      <th
                        onClick={() => handleSortTransactions('status')}
                        className="py-3 px-4 cursor-pointer hover:bg-slate-200/80 transition select-none group"
                        title="Clique para ordenar por situação"
                      >
                        <div className="flex items-center space-x-1">
                          <span>Situação</span>
                          {txSort.field === 'status' ? (
                            txSort.direction === 'asc' ? (
                              <ArrowUp className="w-3.5 h-3.5 text-blue-600 ml-1" />
                            ) : (
                              <ArrowDown className="w-3.5 h-3.5 text-blue-600 ml-1" />
                            )
                          ) : (
                            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 opacity-40 group-hover:opacity-100 transition ml-1" />
                          )}
                        </div>
                      </th>
                      <th
                        onClick={() => handleSortTransactions('amount')}
                        className="py-3 px-4 cursor-pointer hover:bg-slate-200/80 transition select-none group text-right"
                        title="Clique para ordenar por valor"
                      >
                        <div className="flex items-center justify-end space-x-1">
                          <span>Valor</span>
                          {txSort.field === 'amount' ? (
                            txSort.direction === 'asc' ? (
                              <ArrowUp className="w-3.5 h-3.5 text-blue-600 ml-1" />
                            ) : (
                              <ArrowDown className="w-3.5 h-3.5 text-blue-600 ml-1" />
                            )
                          ) : (
                            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 opacity-40 group-hover:opacity-100 transition ml-1" />
                          )}
                        </div>
                      </th>
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
                          <tr
                            key={tx.id}
                            className={`transition-colors ${
                              tx.isHypothetical
                                ? 'bg-purple-50/20 hover:bg-purple-50/40 border-l-2 border-purple-500'
                                : 'hover:bg-slate-50'
                            }`}
                          >
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
                              {tx.isHypothetical ? (
                                <span className="text-[11px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider flex items-center space-x-1 bg-purple-100 text-purple-800 border border-purple-200">
                                  <Sparkles className="w-3 h-3 text-purple-600" />
                                  <span>Hipotético</span>
                                </span>
                              ) : (
                                <button
                                  type="button"
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
                              )}
                            </td>
                            <td
                              className={`py-3 px-4 text-right font-bold whitespace-nowrap ${
                                tx.type === 'INCOME' ? 'text-emerald-600' : 'text-slate-900'
                              }`}
                            >
                              {tx.type === 'INCOME' ? '+' : '-'} {formatMoney(tx.amountCents)}
                            </td>
                            <td className="py-3 px-4 text-center">
                              {tx.isHypothetical ? (
                                <button
                                  type="button"
                                  onClick={() => handleConvertScenarioToReal(tx.scenarioData || scenarios.find((s) => s.id === tx.scenarioId))}
                                  className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 flex items-center space-x-1 transition active:scale-95 mx-auto shadow-xs"
                                  title="Converter esta simulação em lançamento real"
                                >
                                  <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                                  <span>Tornar Real</span>
                                </button>
                              ) : (
                                <div className="flex items-center justify-center space-x-2">
                                  <button
                                    type="button"
                                    onClick={() => openTransactionModal('edit', tx)}
                                    className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-md transition"
                                    title="Editar"
                                  >
                                    <Edit2 className="w-4 h-4" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteTransaction(tx)}
                                    className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-md transition"
                                    title="Excluir"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              )}
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

        {/* ===================== ABA: GRÁFICOS & ANÁLISE VISUAL ===================== */}
        {activeTab === 'charts' && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <div>
                <h2 className="text-xl font-bold text-slate-900 tracking-tight">Análise Gráfica por Categorias</h2>
                <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                  Visualização percentual de onde vem e para onde vai o orçamento (visão: <strong>{FAMILY_MEMBERS.find((m) => m.id === currentMemberId)?.name}</strong>).
                </p>
              </div>

              {/* Filtros da Análise */}
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center bg-slate-100 p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setChartFlowFilter('ALL')}
                    className={`text-xs font-bold px-3 py-1.5 rounded-lg transition ${chartFlowFilter === 'ALL' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'}`}
                  >
                    Ambos
                  </button>
                  <button
                    type="button"
                    onClick={() => setChartFlowFilter('EXPENSE')}
                    className={`text-xs font-bold px-3 py-1.5 rounded-lg transition ${chartFlowFilter === 'EXPENSE' ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-600'}`}
                  >
                    Apenas Despesas
                  </button>
                  <button
                    type="button"
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
                {visibleAccounts.map((acc) => (
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
                          title={acc.archived ? 'Desarquivar' : 'Arquivar'}
                        >
                          <Archive className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteAccount(acc)}
                          className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                          title="Excluir Definitivamente"
                        >
                          <Trash2 className="w-4 h-4" />
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
                {visibleCards.map((card) => {
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
                          title={card.archived ? 'Desarquivar' : 'Arquivar'}
                        >
                          <Archive className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteCard(card)}
                          className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                          title="Excluir Definitivamente"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ===================== ABA: FATURAS & PARCELAS ===================== */}
        {activeTab === 'faturas' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <div>
                <h2 className="text-xl font-bold text-slate-900 tracking-tight">Faturas & Parcelas de Cartões</h2>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">
                  Acompanhe o valor da fatura atual e o impacto das compras parceladas futuras de cada cartão.
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('import')}
                  className="bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-200 text-xs sm:text-sm font-semibold px-4 py-2 rounded-lg flex items-center space-x-1.5 transition"
                >
                  <UploadCloud className="w-4 h-4" />
                  <span>Importar Fatura</span>
                </button>
                <button
                  type="button"
                  onClick={() => setModalState({ isOpen: true, type: 'card', mode: 'create', data: null })}
                  className="bg-purple-600 hover:bg-purple-700 text-white text-xs sm:text-sm font-semibold px-4 py-2 rounded-lg flex items-center space-x-1.5 transition shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                  <span>Novo Cartão</span>
                </button>
              </div>
            </div>

            <div className="space-y-6">
              {cards.map((card) => {
                const info = cardInvoices[card.id] || { items: [], invoiceTotalCents: 0, availableCents: card.limitCents };
                return (
                  <div key={card.id} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center pb-4 border-b border-slate-100 gap-2">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="w-3 h-3 rounded-full" style={{ backgroundColor: card.color || '#1e293b' }} />
                          <h3 className="text-base font-bold text-slate-900">{card.name}</h3>
                          <span className="text-xs text-slate-500">({card.bank} • {card.flag})</span>
                        </div>
                        <p className="text-xs text-slate-400 mt-1">
                          Fechamento todo dia <strong>{card.closingDay}</strong> • Vencimento todo dia <strong>{card.dueDay}</strong>
                        </p>
                      </div>

                      <div className="text-left sm:text-right">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                          VALOR DA FATURA ATUAL
                        </span>
                        <span className="text-2xl font-bold text-slate-900">{formatMoney(info.invoiceTotalCents)}</span>
                        <span className="text-xs text-emerald-600 font-semibold block mt-0.5">
                          Disponível: {formatMoney(info.availableCents)} (de {formatMoney(card.limitCents)})
                        </span>
                      </div>
                    </div>

                    <div className="mt-4">
                      <div className="flex justify-between items-center mb-3">
                        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                          LANÇAMENTOS E PARCELAS VINCULADAS A ESTE CARTÃO ({info.items.length}):
                        </h4>
                        <button
                          type="button"
                          onClick={() => openTransactionModal('create', { cardId: card.id, sourceType: 'CARD' })}
                          className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center space-x-1"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Adicionar na Fatura</span>
                        </button>
                      </div>

                      {info.items.length === 0 ? (
                        <p className="text-xs text-slate-400 py-3">Nenhuma despesa ativa vinculada a esta fatura.</p>
                      ) : (
                        <div className="divide-y divide-slate-100">
                          {info.items.map((item) => {
                            const cat = categories.find((c) => c.id === item.categoryId);
                            return (
                              <div key={item.id} className="py-3 flex items-center justify-between hover:bg-slate-50 px-2 rounded-lg transition">
                                <div>
                                  <div className="flex items-center space-x-2">
                                    <span className="font-semibold text-sm text-slate-900">{item.description}</span>
                                    {item.installmentCount && (
                                      <span className="text-[10px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded font-semibold">
                                        {item.installmentNumber}/{item.installmentCount}
                                      </span>
                                    )}
                                    {cat && (
                                      <span className="text-[10px] px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: `${cat.color}20`, color: cat.color }}>
                                        {cat.name}
                                      </span>
                                    )}
                                  </div>
                                  <span className="text-xs text-slate-400 block mt-0.5">Vencimento: {item.date}</span>
                                </div>
                                <div className="flex items-center space-x-3">
                                  <span className="font-bold text-sm text-slate-900">{formatMoney(item.amountCents)}</span>
                                  <button
                                    type="button"
                                    onClick={() => openTransactionModal('edit', item)}
                                    className="p-1 text-slate-400 hover:text-blue-600 rounded transition"
                                    title="Editar lançamento"
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
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
                      className="p-1.5 text-slate-500 hover:text-blue-600 rounded-lg transition"
                      title="Editar"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => toggleArchiveCategory(cat.id)}
                      className="p-1.5 text-slate-500 hover:text-amber-600 rounded-lg transition"
                      title={cat.archived ? 'Desarquivar' : 'Arquivar'}
                    >
                      <Archive className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteCategory(cat)}
                      className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                      title="Excluir Definitivamente"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
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
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900 tracking-tight">Projeção do Fluxo de Caixa</h2>
                <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                  Previsão acumulada considerando receitas, despesas/parcelas e o impacto dos cenários ativos.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {activeScenariosMonthlyNet !== 0 ? (
                  <div className="text-xs font-semibold bg-blue-50 text-blue-800 border border-blue-200 px-3 py-1.5 rounded-lg flex items-center space-x-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                    <span>Cenários Ativos ({formatMoney(activeScenariosMonthlyNet)}/mês)</span>
                  </div>
                ) : (
                  <div className="text-xs text-slate-400 bg-slate-100 px-3 py-1.5 rounded-lg">
                    Nenhum cenário ativo
                  </div>
                )}

                <div className="flex items-center space-x-1.5 bg-slate-100 p-1 rounded-xl">
                  <span className="text-xs font-semibold text-slate-500 pl-2 pr-1">Horizonte:</span>
                  {[12, 24, 36].map((m) => (
                    <button
                      key={m}
                      type="button"
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
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 text-xs font-bold uppercase tracking-wider border-b">
                    <th
                      onClick={() => setProjectionSort((prev) => ({ field: 'month', direction: prev.field === 'month' && prev.direction === 'asc' ? 'desc' : 'asc' }))}
                      className="py-3 px-4 cursor-pointer hover:bg-slate-200/70 transition select-none group"
                      title="Clique para ordenar por mês"
                    >
                      <div className="flex items-center space-x-1">
                        <span>MÊS</span>
                        {projectionSort.field === 'month' ? (
                          projectionSort.direction === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-blue-600" /> : <ArrowDown className="w-3.5 h-3.5 text-blue-600" />
                        ) : (
                          <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 opacity-40 group-hover:opacity-100 transition" />
                        )}
                      </div>
                    </th>
                    <th
                      onClick={() => setProjectionSort((prev) => ({ field: 'income', direction: prev.field === 'income' && prev.direction === 'desc' ? 'asc' : 'desc' }))}
                      className="py-3 px-4 text-right text-emerald-600 cursor-pointer hover:bg-slate-200/70 transition select-none group"
                      title="Clique para ordenar por receitas previstas"
                    >
                      <div className="flex items-center justify-end space-x-1">
                        <span>RECEITAS PREVISTAS</span>
                        {projectionSort.field === 'income' ? (
                          projectionSort.direction === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-emerald-600" /> : <ArrowDown className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 opacity-40 group-hover:opacity-100 transition" />
                        )}
                      </div>
                    </th>
                    <th
                      onClick={() => setProjectionSort((prev) => ({ field: 'expense', direction: prev.field === 'expense' && prev.direction === 'desc' ? 'asc' : 'desc' }))}
                      className="py-3 px-4 text-right text-rose-600 cursor-pointer hover:bg-slate-200/70 transition select-none group"
                      title="Clique para ordenar por despesas e parcelas"
                    >
                      <div className="flex items-center justify-end space-x-1">
                        <span>DESPESAS & PARCELAS</span>
                        {projectionSort.field === 'expense' ? (
                          projectionSort.direction === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-rose-600" /> : <ArrowDown className="w-3.5 h-3.5 text-rose-600" />
                        ) : (
                          <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 opacity-40 group-hover:opacity-100 transition" />
                        )}
                      </div>
                    </th>
                    <th
                      onClick={() => setProjectionSort((prev) => ({ field: 'net', direction: prev.field === 'net' && prev.direction === 'desc' ? 'asc' : 'desc' }))}
                      className="py-3 px-4 text-right cursor-pointer hover:bg-slate-200/70 transition select-none group"
                      title="Clique para ordenar por resultado do mês"
                    >
                      <div className="flex items-center justify-end space-x-1">
                        <span>RESULTADO DO MÊS</span>
                        {projectionSort.field === 'net' ? (
                          projectionSort.direction === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-blue-600" /> : <ArrowDown className="w-3.5 h-3.5 text-blue-600" />
                        ) : (
                          <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 opacity-40 group-hover:opacity-100 transition" />
                        )}
                      </div>
                    </th>
                    <th
                      onClick={() => setProjectionSort((prev) => ({ field: 'balance', direction: prev.field === 'balance' && prev.direction === 'desc' ? 'asc' : 'desc' }))}
                      className="py-3 px-4 text-right cursor-pointer hover:bg-slate-200/70 transition select-none group"
                      title="Clique para ordenar por saldo acumulado projetado"
                    >
                      <div className="flex items-center justify-end space-x-1">
                        <span>SALDO ACUMULADO PROJETADO</span>
                        {projectionSort.field === 'balance' ? (
                          projectionSort.direction === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-blue-600" /> : <ArrowDown className="w-3.5 h-3.5 text-blue-600" />
                        ) : (
                          <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 opacity-40 group-hover:opacity-100 transition" />
                        )}
                      </div>
                    </th>
                    <th
                      onClick={() => setProjectionSort((prev) => ({ field: 'risk', direction: prev.field === 'risk' && prev.direction === 'asc' ? 'desc' : 'asc' }))}
                      className="py-3 px-4 text-center cursor-pointer hover:bg-slate-200/70 transition select-none group"
                      title="Clique para ordenar por risco"
                    >
                      <div className="flex items-center justify-center space-x-1">
                        <span>RISCO</span>
                        {projectionSort.field === 'risk' ? (
                          projectionSort.direction === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-blue-600" /> : <ArrowDown className="w-3.5 h-3.5 text-blue-600" />
                        ) : (
                          <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 opacity-40 group-hover:opacity-100 transition" />
                        )}
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {(() => {
                    let runningBalance = monthSummary.totalBankBalance;
                    const rows = [];
                    const now = new Date();
                    const startYear = now.getFullYear();
                    const startMonth = now.getMonth();
                    const currentYearMonth = `${startYear}-${String(startMonth + 1).padStart(2, '0')}`;

                    // Despesas e receitas habituais base (sem parcelamentos futuros embutidos)
                    const baseIncomesCents = visibleTransactions
                      .filter(
                        (t) =>
                          t.type === 'INCOME' &&
                          t.status !== 'CANCELADO' &&
                          (!t.installmentGroupId || t.installmentNumber === 1) &&
                          (t.isRecurring || (t.date && t.date.startsWith(currentYearMonth)))
                      )
                      .reduce((acc, t) => acc + t.amountCents, 0);

                    const baseExpensesCents = visibleTransactions
                      .filter(
                        (t) =>
                          t.type === 'EXPENSE' &&
                          t.status !== 'CANCELADO' &&
                          !t.installmentGroupId &&
                          (t.isRecurring || (t.date && t.date.startsWith(currentYearMonth)))
                      )
                      .reduce((acc, t) => acc + t.amountCents, 0);

                    for (let idx = 0; idx < projectionHorizon; idx++) {
                      const targetDate = new Date(startYear, startMonth + idx, 1);
                      const monthKey = `${targetDate.getFullYear()}-${String(targetDate.getMonth() + 1).padStart(2, '0')}`;
                      const label = targetDate.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' });

                      // Impacto dos cenários ativos para este mês
                      let scenInc = 0;
                      let scenExp = 0;
                      scenarios
                        .filter((s) => s.active)
                        .forEach((s) => {
                          if (idx < (s.months || 12)) {
                            if (s.monthlyImpactCents > 0) scenInc += s.monthlyImpactCents;
                            else scenExp += Math.abs(s.monthlyImpactCents);
                          }
                        });

                      let totalIncome = 0;
                      let totalExpense = 0;

                      if (idx === 0) {
                        // Mês atual: soma exata de todos os lançamentos ativos deste mês
                        const currentTxs = visibleTransactions.filter(
                          (t) => t.status !== 'CANCELADO' && t.date && t.date.startsWith(monthKey)
                        );
                        totalIncome = currentTxs.filter((t) => t.type === 'INCOME').reduce((a, t) => a + t.amountCents, 0) + scenInc;
                        totalExpense = currentTxs.filter((t) => t.type === 'EXPENSE').reduce((a, t) => a + t.amountCents, 0) + scenExp;
                      } else {
                        // Meses futuros:
                        // 1. Parcelas programadas que vencem especificamente neste mês
                        const monthInstallmentExpense = visibleTransactions
                          .filter(
                            (t) =>
                              t.status !== 'CANCELADO' &&
                              t.type === 'EXPENSE' &&
                              t.installmentGroupId &&
                              t.date &&
                              t.date.startsWith(monthKey)
                          )
                          .reduce((a, t) => a + t.amountCents, 0);

                        const monthInstallmentIncome = visibleTransactions
                          .filter(
                            (t) =>
                              t.status !== 'CANCELADO' &&
                              t.type === 'INCOME' &&
                              t.installmentGroupId &&
                              t.date &&
                              t.date.startsWith(monthKey)
                          )
                          .reduce((a, t) => a + t.amountCents, 0);

                        // 2. Lançamentos pontuais já agendados para este mês futuro
                        const scheduledExpense = visibleTransactions
                          .filter(
                            (t) =>
                              t.status !== 'CANCELADO' &&
                              t.type === 'EXPENSE' &&
                              !t.installmentGroupId &&
                              t.date &&
                              t.date.startsWith(monthKey)
                          )
                          .reduce((a, t) => a + t.amountCents, 0);

                        const scheduledIncome = visibleTransactions
                          .filter(
                            (t) =>
                              t.status !== 'CANCELADO' &&
                              t.type === 'INCOME' &&
                              !t.installmentGroupId &&
                              t.date &&
                              t.date.startsWith(monthKey)
                          )
                          .reduce((a, t) => a + t.amountCents, 0);

                        const finalBaseExpense = Math.max(baseExpensesCents, scheduledExpense);
                        const finalBaseIncome = Math.max(baseIncomesCents, scheduledIncome);

                        totalIncome = finalBaseIncome + monthInstallmentIncome + scenInc;
                        totalExpense = finalBaseExpense + monthInstallmentExpense + scenExp;
                      }

                      const netMonth = totalIncome - totalExpense;
                      runningBalance += netMonth;
                      const isHealthy = runningBalance >= 0;

                      rows.push({
                        idx,
                        label,
                        totalIncome,
                        totalExpense,
                        netMonth,
                        runningBalance,
                        isHealthy,
                      });
                    }

                    const sortedRows = [...rows].sort((a, b) => {
                      if (projectionSort.field === 'month') {
                        return projectionSort.direction === 'asc' ? a.idx - b.idx : b.idx - a.idx;
                      }
                      if (projectionSort.field === 'income') {
                        return projectionSort.direction === 'asc' ? a.totalIncome - b.totalIncome : b.totalIncome - a.totalIncome;
                      }
                      if (projectionSort.field === 'expense') {
                        return projectionSort.direction === 'asc' ? a.totalExpense - b.totalExpense : b.totalExpense - a.totalExpense;
                      }
                      if (projectionSort.field === 'net') {
                        return projectionSort.direction === 'asc' ? a.netMonth - b.netMonth : b.netMonth - a.netMonth;
                      }
                      if (projectionSort.field === 'balance') {
                        return projectionSort.direction === 'asc' ? a.runningBalance - b.runningBalance : b.runningBalance - a.runningBalance;
                      }
                      if (projectionSort.field === 'risk') {
                        return projectionSort.direction === 'asc'
                          ? (a.isHealthy === b.isHealthy ? 0 : a.isHealthy ? 1 : -1)
                          : (a.isHealthy === b.isHealthy ? 0 : a.isHealthy ? -1 : 1);
                      }
                      return 0;
                    });

                    return sortedRows.map((row) => (
                      <tr key={row.idx} className="hover:bg-slate-50 transition">
                        <td className="py-3.5 px-4 font-semibold capitalize text-slate-900">{row.label}</td>
                        <td className="py-3.5 px-4 text-right font-bold text-emerald-600">{formatMoney(row.totalIncome)}</td>
                        <td className="py-3.5 px-4 text-right font-bold text-rose-600">{formatMoney(row.totalExpense)}</td>
                        <td className="py-3.5 px-4 text-right font-bold text-blue-600">
                          {row.netMonth >= 0 ? `+${formatMoney(row.netMonth)}` : formatMoney(row.netMonth)}
                        </td>
                        <td className="py-3.5 px-4 text-right font-bold text-slate-900">{formatMoney(row.runningBalance)}</td>
                        <td className="py-3.5 px-4 text-center">
                          <span
                            className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${
                              row.isHealthy ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                            }`}
                          >
                            {row.isHealthy ? 'Saudável' : 'Atenção'}
                          </span>
                        </td>
                      </tr>
                    ));
                  })()}
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
                onClick={() => {
                  setModalSourceType('ACCOUNT');
                  setModalState({ isOpen: true, type: 'scenario', mode: 'create', data: null });
                }}
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
                        <div className="flex items-center space-x-1.5">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded tracking-wider uppercase ${
                              isExpense ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'
                            }`}
                          >
                            {isExpense ? 'Despesa' : 'Receita'}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setModalSourceType(scen.sourceType || (scen.cardId ? 'CARD' : 'ACCOUNT'));
                              setModalState({ isOpen: true, type: 'scenario', mode: 'edit', data: scen });
                            }}
                            className="p-1 text-slate-400 hover:text-blue-600 rounded transition"
                            title="Editar Cenário"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteScenario(scen)}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded transition"
                            title="Excluir Cenário"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
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
                          <strong className="text-slate-900 font-semibold">
                            {scen.startDate
                              ? new Date(scen.startDate + 'T12:00:00').toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })
                              : 'set de 2026'}
                          </strong>
                        </div>
                        {scen.categoryId && (
                          <div className="flex justify-between">
                            <span>Categoria:</span>
                            <strong className="text-slate-900 font-semibold">
                              {categories.find((c) => c.id === scen.categoryId)?.name || '-'}
                            </strong>
                          </div>
                        )}
                        <div className="flex justify-between">
                          <span>Origem Prevista:</span>
                          <strong className="text-slate-900 font-semibold">
                            {scen.cardId
                              ? `Cartão: ${cards.find((c) => c.id === scen.cardId)?.name || 'Cartão'}`
                              : `Conta: ${accounts.find((a) => a.id === scen.accountId)?.name || 'Conta Corrente'}`}
                          </strong>
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

        {/* ===================== ABA: IMPORTAÇÃO DE FATURAS E EXTRATOS ===================== */}
        {activeTab === 'import' && (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm max-w-3xl mx-auto space-y-6">
            <div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">Importação de Faturas & Extratos</h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Faça upload de extratos bancários ou faturas de cartão (PDF, CSV, TXT). O sistema detecta duplicidades e permite revisar cada item antes de salvar.
              </p>
            </div>

            <div className="border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-2xl p-8 text-center space-y-4 bg-slate-50/50 transition">
              <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
                <UploadCloud className="w-8 h-8" />
              </div>

              <div>
                <h3 className="font-bold text-base text-slate-900">Arraste seu arquivo ou escolha uma opção abaixo</h3>
                <p className="text-xs text-slate-400 mt-1">Suporta arquivos CSV/TXT ou simulação direta de leitura de fatura</p>
              </div>

              <div className="max-w-xs mx-auto text-left">
                <label className="block text-xs font-semibold text-slate-600 mb-1 text-center">Vincular a qual cartão:</label>
                <select
                  value={importSelectedCard}
                  onChange={(e) => setImportSelectedCard(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {cards.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.bank})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleSimulatePdfImport}
                  className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm px-6 py-2.5 rounded-xl shadow-sm transition active:scale-95 flex items-center justify-center space-x-2"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>Simular Leitura de Fatura PDF</span>
                </button>

                <label className="w-full sm:w-auto bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm px-6 py-2.5 rounded-xl cursor-pointer transition active:scale-95 flex items-center justify-center space-x-2 border border-slate-300">
                  <UploadCloud className="w-4 h-4" />
                  <span>Carregar Arquivo (CSV/TXT)</span>
                  <input
                    type="file"
                    accept=".csv,.txt,.ofx"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            {importPreviewData && (
              <div className="space-y-4 pt-4 border-t border-slate-200">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="font-bold text-base text-slate-900">Conferência dos Lançamentos</h3>
                    <p className="text-xs text-slate-500">
                      {importPreviewData.filter((i) => i.selected).length} de {importPreviewData.length} selecionados para importação.
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => setImportPreviewData(null)}
                      className="px-4 py-2 border border-slate-300 text-slate-600 hover:bg-slate-50 rounded-lg text-xs sm:text-sm font-semibold transition"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={handleConfirmImport}
                      className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs sm:text-sm font-semibold shadow-sm transition active:scale-95"
                    >
                      Confirmar e Gravar na Fatura
                    </button>
                  </div>
                </div>

                <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100 text-sm">
                  {importPreviewData.map((item) => (
                    <div key={item.id} className={`p-3.5 flex items-center justify-between ${item.isDuplicate ? 'bg-amber-50/40' : 'hover:bg-slate-50'}`}>
                      <div className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          checked={item.selected}
                          onChange={() => {
                            setImportPreviewData(
                              importPreviewData.map((p) => (p.id === item.id ? { ...p, selected: !p.selected } : p))
                            );
                          }}
                          className="rounded text-blue-600 w-4 h-4 cursor-pointer"
                        />
                        <div>
                          <p className="font-semibold text-slate-900">{item.description}</p>
                          <span className="text-xs text-slate-400">{item.date}</span>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3">
                        {item.isDuplicate && (
                          <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full flex items-center space-x-1">
                            <AlertTriangle className="w-3 h-3 text-amber-600" />
                            <span>Possível Duplicidade</span>
                          </span>
                        )}
                        <span className="font-bold text-slate-900">{formatMoney(item.amountCents)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
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

              {/* Seção Modo Demonstração e Gerenciamento de Dados */}
              <div className="pt-4 border-t border-slate-200 space-y-4">
                <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-1.5">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span>Modo Demonstração & Gerenciamento de Dados</span>
                </h3>

                <div className="p-4 border border-blue-100 bg-blue-50/60 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h4 className="font-bold text-sm text-blue-900">Carregar Dados de Demonstração</h4>
                    <p className="text-xs text-blue-700">
                      Insere contas, cartões, lançamentos e simulações de exemplo para você testar ou apresentar a plataforma.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleLoadDemoData}
                    className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2 rounded-lg flex items-center space-x-1 shadow-sm transition active:scale-95 whitespace-nowrap self-start sm:self-auto"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Carregar Exemplos</span>
                  </button>
                </div>

                <div className="p-4 border border-amber-100 bg-amber-50/60 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h4 className="font-bold text-sm text-amber-900">Remover Apenas Dados de Exemplo</h4>
                    <p className="text-xs text-amber-700">
                      Remove somente lançamentos e registros fictícios de demonstração, mantendo 100% intactos seus lançamentos reais, contas e saldos.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleClearOnlyDemo}
                    className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold px-4 py-2 rounded-lg flex items-center space-x-1 shadow-sm transition active:scale-95 whitespace-nowrap self-start sm:self-auto"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Limpar Exemplos</span>
                  </button>
                </div>

                <div className="p-4 border border-rose-100 bg-rose-50/60 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h4 className="font-bold text-sm text-rose-900">Zerar Todo o Sistema (Reset Completo)</h4>
                    <p className="text-xs text-rose-600">
                      Exclui todas as contas, cartões, lançamentos e cenários, deixando a aplicação 100% vazia para iniciar do zero.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleResetEntireSystem}
                    className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold px-4 py-2 rounded-lg flex items-center space-x-1 shadow-sm transition active:scale-95 whitespace-nowrap self-start sm:self-auto"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Reset Completo</span>
                  </button>
                </div>
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

            {/* FORMULÁRIO: NOVO / EDITAR CENÁRIO */}
            {modalState.type === 'scenario' && (
              <form onSubmit={handleSaveScenario} className="p-6 space-y-4 overflow-y-auto">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Título do Cenário / Simulação</label>
                  <input
                    type="text"
                    name="title"
                    required
                    defaultValue={modalState.data?.title || ''}
                    placeholder="Ex: Reforma da Cozinha, Compra de Celular, Nova Consultoria"
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Tipo de Impacto</label>
                    <select
                      name="type"
                      defaultValue={modalState.data?.type || (modalState.data?.monthlyImpactCents < 0 ? 'EXPENSE' : 'EXPENSE')}
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
                      defaultValue={modalState.data ? (Math.abs(modalState.data.monthlyImpactCents) / 100).toFixed(2) : ''}
                      placeholder="0,00"
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Duração (Meses)</label>
                    <input
                      type="number"
                      min="1"
                      max="60"
                      name="months"
                      defaultValue={modalState.data?.months || 12}
                      required
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Data de Início</label>
                    <input
                      type="date"
                      name="startDate"
                      required
                      defaultValue={modalState.data?.startDate || new Date().toISOString().slice(0, 10)}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Categoria Prevista</label>
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
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Forma / Origem Prevista</label>
                    <select
                      name="sourceType"
                      value={modalSourceType}
                      onChange={(e) => setModalSourceType(e.target.value)}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    >
                      <option value="ACCOUNT">Conta Bancária</option>
                      <option value="CARD">Cartão de Crédito</option>
                    </select>
                  </div>
                </div>

                <div>
                  {modalSourceType === 'ACCOUNT' ? (
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Conta Bancária Prevista</label>
                      <select
                        name="accountId"
                        defaultValue={modalState.data?.accountId || accounts[0]?.id || ''}
                        className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      >
                        {accounts.length === 0 ? (
                          <option value="">Nenhuma conta cadastrada</option>
                        ) : (
                          accounts.map((a) => (
                            <option key={a.id} value={a.id}>
                              {a.name} ({a.bank})
                            </option>
                          ))
                        )}
                      </select>
                    </div>
                  ) : (
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Cartão de Crédito Previsto</label>
                      <select
                        name="cardId"
                        defaultValue={modalState.data?.cardId || cards[0]?.id || ''}
                        className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      >
                        {cards.length === 0 ? (
                          <option value="">Nenhum cartão cadastrado</option>
                        ) : (
                          cards.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name} ({c.bank})
                            </option>
                          ))
                        )}
                      </select>
                    </div>
                  )}
                </div>

                {/* Seletor de Escopo: Familiar vs Pessoal */}
                <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Escopo do Cenário</label>
                    <select
                      name="scope"
                      defaultValue={modalState.data?.scope || 'FAMILY'}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
                    >
                      <option value="FAMILY">Familiar (Visível a todos)</option>
                      <option value="PERSONAL">Individual / Pessoal (Privado)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Responsável / Titular</label>
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

                <div className="pt-4 border-t border-slate-100 flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setModalState({ isOpen: false, type: null, mode: 'create', data: null, scenarioIdToConvert: null })}
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
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      {modalState.mode === 'create' && formInstallments > 1
                        ? (installmentValueMode === 'TOTAL' ? 'Valor Total da Compra (R$)' : 'Valor de Cada Parcela (R$)')
                        : 'Valor (R$)'}
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      name="amount"
                      required
                      value={formAmount}
                      onChange={(e) => setFormAmount(e.target.value)}
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
                      value={modalSourceType}
                      onChange={(e) => setModalSourceType(e.target.value)}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    >
                      <option value="ACCOUNT">Conta Bancária</option>
                      <option value="CARD">Cartão de Crédito</option>
                    </select>
                  </div>
                </div>

                <div>
                  {modalSourceType === 'ACCOUNT' ? (
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Conta Bancária</label>
                      <select
                        name="accountId"
                        defaultValue={modalState.data?.accountId || accounts[0]?.id || ''}
                        className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      >
                        {accounts.length === 0 ? (
                          <option value="">Nenhuma conta cadastrada</option>
                        ) : (
                          accounts.map((a) => (
                            <option key={a.id} value={a.id}>
                              {a.name} ({a.bank})
                            </option>
                          ))
                        )}
                      </select>
                    </div>
                  ) : (
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Cartão de Crédito</label>
                      <select
                        name="cardId"
                        defaultValue={modalState.data?.cardId || cards[0]?.id || ''}
                        className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      >
                        {cards.length === 0 ? (
                          <option value="">Nenhum cartão cadastrado</option>
                        ) : (
                          cards.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name} ({c.bank})
                            </option>
                          ))
                        )}
                      </select>
                    </div>
                  )}
                </div>

                {/* Seletor de Escopo de Edição para parcelamentos e recorrências */}
                {modalState.mode === 'edit' && (modalState.data?.installmentGroupId || modalState.data?.recurrenceRuleId) && (
                  <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl space-y-2">
                    <label className="block text-xs font-bold text-amber-900">Aplicar alterações em:</label>
                    <div className="space-y-1.5 text-xs text-slate-700">
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="radio"
                          name="editScopeRadio"
                          checked={editScope === 'single'}
                          onChange={() => setEditScope('single')}
                          className="text-amber-600 focus:ring-amber-500"
                        />
                        <span>Apenas este lançamento</span>
                      </label>
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="radio"
                          name="editScopeRadio"
                          checked={editScope === 'future'}
                          onChange={() => setEditScope('future')}
                          className="text-amber-600 focus:ring-amber-500"
                        />
                        <span>
                          {modalState.data?.installmentGroupId
                            ? 'Deste lançamento em diante (parcelas futuras)'
                            : 'Deste lançamento em diante (repetições futuras)'}
                        </span>
                      </label>
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="radio"
                          name="editScopeRadio"
                          checked={editScope === 'all'}
                          onChange={() => setEditScope('all')}
                          className="text-amber-600 focus:ring-amber-500"
                        />
                        <span>
                          {modalState.data?.installmentGroupId
                            ? 'Todas as parcelas deste grupo (desde o início)'
                            : 'Todas as repetições desta recorrência'}
                        </span>
                      </label>
                    </div>
                  </div>
                )}

                {modalState.mode === 'create' && (
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-slate-700">Parcelamento:</label>
                      <div className="flex items-center space-x-1">
                        <span className="text-xs text-slate-500">Número de Parcelas:</span>
                        <input
                          type="number"
                          min="1"
                          max="72"
                          name="installments"
                          value={formInstallments}
                          onChange={(e) => setFormInstallments(Math.max(1, parseInt(e.target.value) || 1))}
                          className="w-16 border border-slate-300 rounded px-2 py-1 text-xs text-center font-bold"
                        />
                      </div>
                    </div>

                    {formInstallments > 1 && (
                      <div className="p-3 bg-blue-50/80 border border-blue-200 rounded-lg space-y-2.5">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-bold text-blue-950">
                            O valor digitado é:
                          </label>
                          <span className="text-[11px] font-semibold text-blue-700 bg-blue-100/70 px-2 py-0.5 rounded">
                            {formatMoney(Math.round((parseFloat(formAmount) || 0) * 100))}
                          </span>
                        </div>
                        <input type="hidden" name="installmentValueMode" value={installmentValueMode} />
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                          <label
                            className={`flex items-start space-x-2 p-2.5 rounded-lg border cursor-pointer transition ${
                              installmentValueMode === 'TOTAL'
                                ? 'bg-white border-blue-500 shadow-xs ring-1 ring-blue-500'
                                : 'bg-white/60 border-slate-200 hover:bg-white'
                            }`}
                          >
                            <input
                              type="radio"
                              name="installmentValueModeRadio"
                              checked={installmentValueMode === 'TOTAL'}
                              onChange={() => setInstallmentValueMode('TOTAL')}
                              className="mt-0.5 text-blue-600 focus:ring-blue-500"
                            />
                            <div>
                              <span className="font-bold text-slate-800 block">Total da Compra</span>
                              <span className="text-[11px] text-slate-500 block leading-tight mt-0.5">
                                Divide o valor em {formInstallments}x
                              </span>
                            </div>
                          </label>

                          <label
                            className={`flex items-start space-x-2 p-2.5 rounded-lg border cursor-pointer transition ${
                              installmentValueMode === 'INSTALLMENT'
                                ? 'bg-white border-blue-500 shadow-xs ring-1 ring-blue-500'
                                : 'bg-white/60 border-slate-200 hover:bg-white'
                            }`}
                          >
                            <input
                              type="radio"
                              name="installmentValueModeRadio"
                              checked={installmentValueMode === 'INSTALLMENT'}
                              onChange={() => setInstallmentValueMode('INSTALLMENT')}
                              className="mt-0.5 text-blue-600 focus:ring-blue-500"
                            />
                            <div>
                              <span className="font-bold text-slate-800 block">Valor da Parcela</span>
                              <span className="text-[11px] text-slate-500 block leading-tight mt-0.5">
                                Repete nas {formInstallments} parcelas
                              </span>
                            </div>
                          </label>
                        </div>

                        {/* Pré-visualização transparente do cálculo */}
                        {parseFloat(formAmount) > 0 && (
                          <div className="mt-1 text-xs bg-white rounded-md p-2.5 border border-blue-100 flex flex-wrap items-center justify-between gap-1 shadow-2xs">
                            <span className="text-slate-600">
                              Cada parcela:{' '}
                              <strong className="text-blue-700 font-bold">
                                {installmentValueMode === 'TOTAL'
                                  ? formatMoney(Math.floor(Math.round((parseFloat(formAmount) || 0) * 100) / formInstallments))
                                  : formatMoney(Math.round((parseFloat(formAmount) || 0) * 100))}
                              </strong>{' '}
                              ({formInstallments}x)
                            </span>
                            <span className="text-slate-600">
                              Total final:{' '}
                              <strong className="text-slate-900 font-bold">
                                {installmentValueMode === 'TOTAL'
                                  ? formatMoney(Math.round((parseFloat(formAmount) || 0) * 100))
                                  : formatMoney(Math.round((parseFloat(formAmount) || 0) * 100) * formInstallments)}
                              </strong>
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="flex items-center space-x-2 pt-2 border-t border-slate-200">
                      <input
                        type="checkbox"
                        name="isRecurring"
                        id="isRecurring"
                        defaultChecked={modalState.data?.isRecurring || false}
                        className="rounded text-blue-600"
                      />
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

      {/* Modal de Exclusão de Lançamentos com Escopo (Apenas este, Deste em diante, Todos) */}
      {deleteModalState.isOpen && deleteModalState.transaction && (() => {
        const tx = deleteModalState.transaction;
        const isGrouped = Boolean(tx.installmentGroupId || tx.recurrenceRuleId);
        const futureCount = transactions.filter((t) => {
          if (tx.installmentGroupId && t.installmentGroupId === tx.installmentGroupId) {
            return (t.installmentNumber || 0) >= (tx.installmentNumber || 0);
          }
          if (tx.recurrenceRuleId && t.recurrenceRuleId === tx.recurrenceRuleId) {
            return t.date >= tx.date;
          }
          return t.id === tx.id;
        }).length;

        const allCount = transactions.filter((t) =>
          (tx.installmentGroupId && t.installmentGroupId === tx.installmentGroupId) ||
          (tx.recurrenceRuleId && t.recurrenceRuleId === tx.recurrenceRuleId)
        ).length;

        const countToDelete =
          deleteModalState.scope === 'all'
            ? allCount
            : deleteModalState.scope === 'future'
            ? futureCount
            : 1;

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center space-x-2.5">
                  <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                    <Trash2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-800">Excluir Lançamento</h3>
                    <p className="text-xs text-slate-500">Confirmação de exclusão</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setDeleteModalState({ isOpen: false, transaction: null, scope: 'single' })}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="py-4 space-y-3">
                {/* Cartão de Detalhes do Lançamento */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-semibold text-sm text-slate-800">{tx.description}</h4>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Data: {new Date(tx.date + 'T12:00:00').toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                    <span className={`text-sm font-bold ${tx.type === 'INCOME' ? 'text-emerald-600' : 'text-slate-900'}`}>
                      {tx.type === 'INCOME' ? '+' : '-'} {formatMoney(tx.amountCents)}
                    </span>
                  </div>
                </div>

                {isGrouped ? (
                  <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-xl space-y-2.5">
                    <div className="flex items-center space-x-1.5 text-amber-900">
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                      <span className="text-xs font-bold">
                        {tx.installmentGroupId
                          ? `Este lançamento faz parte de um parcelamento (${tx.installmentNumber || '?'}/${tx.installmentCount || '?'})`
                          : 'Este lançamento faz parte de uma recorrência'}
                      </span>
                    </div>
                    <p className="text-xs text-amber-800">
                      Escolha como deseja prosseguir com a exclusão:
                    </p>

                    <div className="space-y-2 text-xs">
                      <label
                        className={`flex items-start space-x-2.5 p-2.5 rounded-lg border cursor-pointer transition ${
                          deleteModalState.scope === 'single'
                            ? 'bg-white border-rose-500 shadow-xs ring-1 ring-rose-500'
                            : 'bg-white/60 border-slate-200 hover:bg-white'
                        }`}
                      >
                        <input
                          type="radio"
                          name="deleteScopeRadio"
                          value="single"
                          checked={deleteModalState.scope === 'single'}
                          onChange={() => setDeleteModalState((prev) => ({ ...prev, scope: 'single' }))}
                          className="mt-0.5 text-rose-600 focus:ring-rose-500"
                        />
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-slate-800">Apenas este lançamento</span>
                            <span className="text-[10px] font-bold px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded">
                              1 lançamento
                            </span>
                          </div>
                          <span className="text-[11px] text-slate-500 block mt-0.5">
                            {tx.installmentGroupId
                              ? `Exclui apenas a parcela ${tx.installmentNumber || ''}. As demais parcelas continuam ativas.`
                              : 'Exclui apenas esta ocorrência da recorrência.'}
                          </span>
                        </div>
                      </label>

                      <label
                        className={`flex items-start space-x-2.5 p-2.5 rounded-lg border cursor-pointer transition ${
                          deleteModalState.scope === 'future'
                            ? 'bg-white border-rose-500 shadow-xs ring-1 ring-rose-500'
                            : 'bg-white/60 border-slate-200 hover:bg-white'
                        }`}
                      >
                        <input
                          type="radio"
                          name="deleteScopeRadio"
                          value="future"
                          checked={deleteModalState.scope === 'future'}
                          onChange={() => setDeleteModalState((prev) => ({ ...prev, scope: 'future' }))}
                          className="mt-0.5 text-rose-600 focus:ring-rose-500"
                        />
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-slate-800">Deste lançamento em diante</span>
                            <span className="text-[10px] font-bold px-1.5 py-0.5 bg-rose-50 text-rose-700 rounded">
                              {futureCount} {futureCount === 1 ? 'lançamento' : 'lançamentos'}
                            </span>
                          </div>
                          <span className="text-[11px] text-slate-500 block mt-0.5">
                            {tx.installmentGroupId
                              ? `Exclui a partir da parcela ${tx.installmentNumber || ''} até a última parcela.`
                              : 'Exclui este lançamento e todas as repetições futuras.'}
                          </span>
                        </div>
                      </label>

                      <label
                        className={`flex items-start space-x-2.5 p-2.5 rounded-lg border cursor-pointer transition ${
                          deleteModalState.scope === 'all'
                            ? 'bg-white border-rose-500 shadow-xs ring-1 ring-rose-500'
                            : 'bg-white/60 border-slate-200 hover:bg-white'
                        }`}
                      >
                        <input
                          type="radio"
                          name="deleteScopeRadio"
                          value="all"
                          checked={deleteModalState.scope === 'all'}
                          onChange={() => setDeleteModalState((prev) => ({ ...prev, scope: 'all' }))}
                          className="mt-0.5 text-rose-600 focus:ring-rose-500"
                        />
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-slate-800">
                              {tx.installmentGroupId ? 'Todas as parcelas' : 'Todas as repetições'}
                            </span>
                            <span className="text-[10px] font-bold px-1.5 py-0.5 bg-rose-50 text-rose-700 rounded">
                              {allCount} {allCount === 1 ? 'lançamento' : 'lançamentos'}
                            </span>
                          </div>
                          <span className="text-[11px] text-slate-500 block mt-0.5">
                            {tx.installmentGroupId
                              ? `Exclui todas as ${allCount} parcelas deste grupo desde o início.`
                              : 'Exclui todas as repetições desta recorrência.'}
                          </span>
                        </div>
                      </label>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-slate-600 px-1">
                    Tem certeza de que deseja excluir este lançamento? Esta ação não poderá ser desfeita.
                  </p>
                )}
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setDeleteModalState({ isOpen: false, transaction: null, scope: 'single' })}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-sm text-slate-700 hover:bg-slate-50 transition"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDeleteTransaction}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-sm font-semibold transition active:scale-95 shadow-xs"
                >
                  Excluir {countToDelete > 1 ? `(${countToDelete})` : ''}
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Modal de Autenticação e Gestão de Perfis */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />
    </div>
  );
}