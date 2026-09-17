import React, { useState, useMemo, useEffect, useCallback } from 'react';
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
  ChevronRight,
  ChevronDown,
  FileText,
  Check,
  Filter,
  Search,
  Target,
  Mail
} from 'lucide-react';
import { parseInvoicePdf } from './services/pdfParser';
import AuthModal from './components/AuthModal';
import {
  loadInitialAppData,
  syncItem,
  syncBatchTransactions,
  saveToLocalStorage,
  clearDemoDataOnly,
  resetEntireSystem,
  loadDemoPresentationData,
  healMigratedInvoiceTransactions,
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

// Formatação de Data Segura no padrão brasileiro (dd/mm/aaaa) sem deslocamento de fuso horário
const formatDateBR = (dateStr) => {
  if (!dateStr) return '';
  if (typeof dateStr !== 'string') return String(dateStr);
  const clean = dateStr.trim().slice(0, 10);
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(clean)) return clean;
  const parts = clean.split('-');
  if (parts.length === 3) {
    const [y, m, d] = parts;
    if (y && m && d && y.length === 4) {
      return `${d.padStart(2, '0')}/${m.padStart(2, '0')}/${y}`;
    }
  }
  return dateStr;
};

// Cálculo inteligente do vencimento da fatura do cartão a partir da data da compra e datas de corte
const calculateCardDueDate = (dateStr, closingDay = 1, dueDay = 10) => {
  if (!dateStr || typeof dateStr !== 'string') return dateStr;
  const clean = dateStr.trim().slice(0, 10);
  const parts = clean.split('-');
  if (parts.length !== 3) return dateStr;

  let year = parseInt(parts[0], 10);
  let month = parseInt(parts[1], 10);
  const day = parseInt(parts[2], 10);

  const safeClosing = Math.min(Math.max(closingDay || 1, 1), 28);
  const safeDue = Math.min(Math.max(dueDay || 10, 1), 28);

  let monthsToAdd = 0;
  if (safeDue < safeClosing) {
    // Ex: Fecha dia 28, vence dia 10 do mês seguinte
    monthsToAdd = day > safeClosing ? 2 : 1;
  } else {
    // Ex: Fecha dia 1, vence dia 10 do mesmo mês
    monthsToAdd = day > safeClosing ? 1 : 0;
  }

  month += monthsToAdd;
  while (month > 12) {
    month -= 12;
    year += 1;
  }

  return `${year}-${String(month).padStart(2, '0')}-${String(safeDue).padStart(2, '0')}`;
};

// Adiciona N meses a uma data ISO YYYY-MM-DD mantendo o dia seguro (máx 28 para fev/outros)
const addMonthsToIso = (isoDateStr, monthsToAdd) => {
  if (!isoDateStr || typeof isoDateStr !== 'string') return isoDateStr;
  const parts = isoDateStr.trim().slice(0, 10).split('-');
  if (parts.length !== 3) return isoDateStr;
  const y = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10);
  const d = parseInt(parts[2], 10);
  const target = new Date(y, m - 1 + monthsToAdd, Math.min(d, 28));
  const newY = target.getFullYear();
  const newM = String(target.getMonth() + 1).padStart(2, '0');
  const newD = String(target.getDate()).padStart(2, '0');
  return `${newY}-${newM}-${newD}`;
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

  // Carregamento inicial de dados unificado com auto-cura de faturas e preservação de datas
  useEffect(() => {
    loadInitialAppData({
      categories: DEFAULT_CATEGORIES,
    }).then((res) => {
      if (res) {
        setIsCloudConnected(res.isCloud);
        if (res.accounts) setAccounts(res.accounts);
        if (res.cards) setCards(res.cards);
        if (res.categories) setCategories(res.categories);
        if (res.transactions) {
          const activeCards = res.cards || [];
          const { healedTransactions, hasChanges, changedTxs } = healMigratedInvoiceTransactions(res.transactions, activeCards);
          setTransactions(healedTransactions);
          saveToLocalStorage('financas_transactions_v1', healedTransactions);
          if (hasChanges && changedTxs.length > 0) {
            syncBatchTransactions(changedTxs);
          }
        }
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
  const [filterType, setFilterType] = useState('ALL'); // 'ALL' | 'INCOME' | 'EXPENSE'
  const [filterStatus, setFilterStatus] = useState('ALL'); // 'ALL' | 'OVERDUE' | 'REALIZADO' | 'COMPROMETIDO' | 'PREVISTO' | 'HIPOTETICO' | 'CANCELADO'
  const [filterSource, setFilterSource] = useState('ALL'); // 'ALL' | 'ACCOUNTS_ONLY' | 'CARDS_ONLY' | 'acc-${id}' | 'card-${id}'
  const [filterCategory, setFilterCategory] = useState('ALL'); // 'ALL' | catId
  const [filterScope, setFilterScope] = useState('ALL'); // 'ALL' | 'FAMILY' | 'PERSONAL'
  const [filterDatePreset, setFilterDatePreset] = useState('ALL'); // 'ALL' | 'THIS_MONTH' | 'LAST_MONTH' | 'NEXT_MONTH' | 'CUSTOM'
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  const [showFilterDrawer, setShowFilterDrawer] = useState(false);

  // Ordenação de Lançamentos (padrão: data mais próxima da data atual)
  const [txSort, setTxSort] = useState({ field: 'date', direction: 'closest' }); // 'closest' | 'asc' | 'desc'

  // Ordenação de Projeções
  const [projectionSort, setProjectionSort] = useState({ field: 'month', direction: 'asc' });

  // Horizonte de Projeções (12, 24 ou 36 meses)
  const [projectionHorizon, setProjectionHorizon] = useState(12);

  // Mês de Referência para o Dashboard (padrão: mês atual 'YYYY-MM')
  const [dashboardMonth, setDashboardMonth] = useState(() => new Date().toISOString().slice(0, 7));
  const currentActualMonth = useMemo(() => new Date().toISOString().slice(0, 7), []);

  // Mês de Referência para a aba Faturas & Parcelas de Cartões (padrão: mês atual 'YYYY-MM')
  const [invoiceSelectedMonth, setInvoiceSelectedMonth] = useState(() => new Date().toISOString().slice(0, 7));

  // Modal de Pagamento de Fatura de Cartão
  const [invoicePaymentModal, setInvoicePaymentModal] = useState({
    isOpen: false,
    card: null,
    monthKey: '',
    totalCents: 0,
    monthItems: [],
    dueDateIso: '',
  });

  // Modal informativo para tentativa de quitação avulsa de compra de cartão
  const [cardPaymentPromptModal, setCardPaymentPromptModal] = useState({
    isOpen: false,
    transaction: null,
    card: null,
    monthKey: '',
    dueDateIso: '',
  });

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

  const changeInvoiceSelectedMonth = (offset) => {
    const [y, m] = invoiceSelectedMonth.split('-').map(Number);
    const nextDate = new Date(y, m - 1 + offset, 1);
    const nextStr = `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, '0')}`;
    setInvoiceSelectedMonth(nextStr);
  };

  // Mês de Referência para Envelopes & Metas de Gastos (padrão: mês atual 'YYYY-MM')
  const [envelopeSelectedMonth, setEnvelopeSelectedMonth] = useState(() => new Date().toISOString().slice(0, 7));

  const changeEnvelopeSelectedMonth = (offset) => {
    const [y, m] = envelopeSelectedMonth.split('-').map(Number);
    const nextDate = new Date(y, m - 1 + offset, 1);
    const nextStr = `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, '0')}`;
    setEnvelopeSelectedMonth(nextStr);
  };

  // Estado de expansão das Faturas Mestres na tabela de lançamentos
  const [expandedInvoices, setExpandedInvoices] = useState({});

  // Modal de Exclusão de Toda uma Fatura e seus lançamentos
  const [deleteInvoiceModalState, setDeleteInvoiceModalState] = useState({
    isOpen: false,
    card: null,
    monthKey: '',
    items: [],
    includeFutureInstallments: false,
  });

  // Controles dos Gráficos com Filtro de Período
  const [chartIncludeScenarios, setChartIncludeScenarios] = useState(true);
  const [chartFlowFilter, setChartFlowFilter] = useState('ALL'); // 'ALL' | 'EXPENSE' | 'INCOME'
  const [chartPeriodFilter, setChartPeriodFilter] = useState('DASHBOARD_MONTH'); // 'DASHBOARD_MONTH' | 'SPECIFIC_MONTH' | 'LAST_3_MONTHS' | 'LAST_6_MONTHS' | 'CURRENT_YEAR' | 'ALL'
  const [chartSpecificMonth, setChartSpecificMonth] = useState(dashboardMonth);

  // Controles da Importação de Faturas
  const [importSelectedCard, setImportSelectedCard] = useState('card-1');
  const [importPreviewData, setImportPreviewData] = useState(null);
  const [importMetadata, setImportMetadata] = useState(null);
  const [isImportLoading, setIsImportLoading] = useState(false);
  const [importFilterTab, setImportFilterTab] = useState('ALL'); // 'ALL' | 'SELECTED' | 'DUPLICATES'
  const [importDefaultStatus, setImportDefaultStatus] = useState('COMPROMETIDO'); // 'COMPROMETIDO' | 'REALIZADO'

  // Controle de Campos Condicionais do Modal (Conta vs Cartão)
  const [modalSourceType, setModalSourceType] = useState('ACCOUNT');

  // Controle de Escopo de Edição (Apenas esta parcela vs Todas vs Futuras)
  const [editScope, setEditScope] = useState('single'); // 'single' | 'all' | 'future'

  // Controle de Modo do Valor no Parcelamento (Total da Compra vs Valor da Parcela)
  const [installmentValueMode, setInstallmentValueMode] = useState('TOTAL'); // 'TOTAL' | 'INSTALLMENT'
  const [formAmount, setFormAmount] = useState('');
  const [formInstallments, setFormInstallments] = useState(1);
  const [formStartInstallment, setFormStartInstallment] = useState(1);
  const [formIsRecurring, setFormIsRecurring] = useState(false);
  const [formRecurringMonths, setFormRecurringMonths] = useState(12);

  // Estado do Modal de Confirmação de Exclusão
  const [deleteModalState, setDeleteModalState] = useState({
    isOpen: false,
    transaction: null,
    scope: 'single', // 'single' | 'future' | 'past_only' | 'past_inclusive' | 'all'
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
    const isActualRec = Boolean(
      data?.isRecurring ||
      (data?.recurrenceRuleId &&
        !String(data.recurrenceRuleId).startsWith('PURCHASE_DATE:') &&
        !String(data.recurrenceRuleId).startsWith('INVOICE_PAY:'))
    );
    setModalSourceType(sType);
    setEditScope('single');
    setFormAmount(data?.amountCents ? (data.amountCents / 100).toFixed(2) : '');
    setFormInstallments(data?.installmentCount || data?.installments || 1);
    setFormStartInstallment(data?.installmentNumber || 1);
    setInstallmentValueMode('TOTAL');
    setFormIsRecurring(isActualRec);
    setFormRecurringMonths(12);
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

  // Retorna a data efetiva de vencimento financeiro de um lançamento (usada para fluxo de caixa, mês e atrasos)
  const getTxDueDate = useCallback((tx) => {
    if (!tx) return '';
    if (tx.dueDate) return tx.dueDate;
    if (tx.cardId && tx.purchaseDate && tx.purchaseDate !== tx.date) {
      const card = cards.find((c) => c.id === tx.cardId);
      if (card && card.closingDay && card.dueDay) {
        return calculateCardDueDate(tx.purchaseDate, card.closingDay, card.dueDay);
      }
    }
    return tx.date;
  }, [cards]);

  // Verifica se um lançamento está de fato em atraso (comprometido com vencimento anterior a hoje)
  const isTxOverdue = useCallback((tx, todayStr = new Date().toISOString().slice(0, 10)) => {
    if (!tx || tx.isHypothetical || tx.status !== 'COMPROMETIDO') return false;
    const dueDate = getTxDueDate(tx);
    return Boolean(dueDate && dueDate < todayStr);
  }, [getTxDueDate]);

  // Lançamentos Mestres de Faturas dos Cartões de Crédito
  // Agrupa compras de cartão por (cartão, mês de vencimento) gerando o Lançamento Mestre da Fatura
  const cardInvoiceMasters = useMemo(() => {
    const todayStr = new Date().toISOString().slice(0, 10);
    const masters = [];

    cards.forEach((card) => {
      const allCardTxs = visibleTransactions.filter((t) => t.cardId === card.id && t.status !== 'CANCELADO');

      // Agrupar itens por mês de vencimento da fatura
      const monthGroups = {};
      allCardTxs.forEach((t) => {
        const due = getTxDueDate(t) || t.date;
        if (!due) return;
        const monthKey = due.slice(0, 7);
        if (!monthGroups[monthKey]) {
          monthGroups[monthKey] = [];
        }
        monthGroups[monthKey].push(t);
      });

      // Também verificar se existe pagamento registrado para meses onde não há mais itens avulsos
      visibleTransactions.forEach((t) => {
        if (t.isInvoicePayment && t.targetCardId === card.id && t.status !== 'CANCELADO') {
          const monthKey = t.invoiceMonth;
          if (monthKey && !monthGroups[monthKey]) {
            monthGroups[monthKey] = [];
          }
        }
      });

      Object.entries(monthGroups).forEach(([monthKey, items]) => {
        items.sort((a, b) => {
          const dateA = a.purchaseDate || getTxDueDate(a) || a.date;
          const dateB = b.purchaseDate || getTxDueDate(b) || b.date;
          return dateA.localeCompare(dateB);
        });

        const paymentTx = visibleTransactions.find(
          (t) => t.isInvoicePayment && t.targetCardId === card.id && t.invoiceMonth === monthKey && t.status !== 'CANCELADO'
        );

        const totalExpensesCents = items
          .filter((t) => t.type === 'EXPENSE')
          .reduce((acc, t) => acc + t.amountCents, 0);

        const allItemsRealizado = items.length > 0 && items.every((t) => t.status === 'REALIZADO');
        const isPaid = Boolean(paymentTx || (items.length > 0 && allItemsRealizado));

        const dueDayPadded = String(Math.min(28, card.dueDay || 10)).padStart(2, '0');
        const dueDateIso = `${monthKey}-${dueDayPadded}`;

        let status = 'COMPROMETIDO';
        if (isPaid) {
          status = 'REALIZADO';
        } else if (todayStr > dueDateIso) {
          status = 'EM ATRASO';
        } else {
          status = 'COMPROMETIDO';
        }

        masters.push({
          id: `invoice-master-${card.id}-${monthKey}`,
          isInvoiceMaster: true,
          cardId: card.id,
          card,
          monthKey,
          description: `Fatura ${card.name} (${formatMonthLabel(monthKey)})`,
          amountCents: totalExpensesCents,
          type: 'EXPENSE',
          status,
          date: dueDateIso,
          dueDate: dueDateIso,
          items,
          isPaid,
          paymentTx,
          accountId: paymentTx?.accountId || null,
          scope: card.scope || 'FAMILY',
          ownerId: card.ownerId || (currentMemberId === 'user-all' ? 'user-1' : currentMemberId),
        });
      });
    });

    return masters;
  }, [cards, visibleTransactions, getTxDueDate, currentMemberId]);

  // Junção de lançamentos reais (contas bancárias e faturas mestres consolidadas) com simulações hipotéticas
  const allDisplayTransactions = useMemo(() => {
    // 1. Lançamentos regulares de conta corrente / dinheiro (não cartão e não pagamento técnico de fatura)
    const regularTxs = visibleTransactions.filter((t) => !t.cardId && !t.isInvoicePayment);
    // 2. Faturas Mestres dos cartões (cada uma já engloba suas compras aninhadas em .items)
    // 3. Simulações hipotéticas ativas
    return [...regularTxs, ...cardInvoiceMasters, ...hypotheticalTransactions];
  }, [visibleTransactions, cardInvoiceMasters, hypotheticalTransactions]);

  // Transações base para os Gráficos (com filtro de período e toggle de simulações)
  const chartTransactions = useMemo(() => {
    const today = new Date();
    const currentYear = today.getFullYear().toString();
    const getMonthOffset = (offset) => {
      const d = new Date(today.getFullYear(), today.getMonth() + offset, 1);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    };
    const last3Start = getMonthOffset(-2);
    const last6Start = getMonthOffset(-5);
    const thisMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;

    let list = visibleTransactions.filter((tx) => {
      if (tx.status === 'CANCELADO') return false;
      const effectiveDate = getTxDueDate(tx) || tx.date || '';
      if (!effectiveDate) return false;

      if (chartPeriodFilter === 'DASHBOARD_MONTH') {
        return effectiveDate.startsWith(dashboardMonth);
      }
      if (chartPeriodFilter === 'SPECIFIC_MONTH') {
        return effectiveDate.startsWith(chartSpecificMonth);
      }
      if (chartPeriodFilter === 'LAST_3_MONTHS') {
        return effectiveDate >= last3Start && effectiveDate.slice(0, 7) <= thisMonth;
      }
      if (chartPeriodFilter === 'LAST_6_MONTHS') {
        return effectiveDate >= last6Start && effectiveDate.slice(0, 7) <= thisMonth;
      }
      if (chartPeriodFilter === 'CURRENT_YEAR') {
        return effectiveDate.startsWith(currentYear);
      }
      return true; // 'ALL'
    });

    if (chartIncludeScenarios) {
      const activeHypos = hypotheticalTransactions.filter((t) => {
        const isMemberMatch = currentMemberId === 'user-all' ? t.scope === 'FAMILY' : (t.scope === 'FAMILY' || t.ownerId === currentMemberId);
        if (!isMemberMatch) return false;
        const effectiveDate = t.date || '';
        if (chartPeriodFilter === 'DASHBOARD_MONTH') return effectiveDate.startsWith(dashboardMonth);
        if (chartPeriodFilter === 'SPECIFIC_MONTH') return effectiveDate.startsWith(chartSpecificMonth);
        if (chartPeriodFilter === 'LAST_3_MONTHS') return effectiveDate >= last3Start && effectiveDate.slice(0, 7) <= thisMonth;
        if (chartPeriodFilter === 'LAST_6_MONTHS') return effectiveDate >= last6Start && effectiveDate.slice(0, 7) <= thisMonth;
        if (chartPeriodFilter === 'CURRENT_YEAR') return effectiveDate.startsWith(currentYear);
        return true;
      });
      list = [...list, ...activeHypos];
    }

    return list;
  }, [visibleTransactions, hypotheticalTransactions, chartIncludeScenarios, chartPeriodFilter, chartSpecificMonth, dashboardMonth, currentMemberId, getTxDueDate]);

  // Dados consolidados por categoria para os Gráficos
  const categoryChartData = useMemo(() => {
    const expenseMap = {};
    const incomeMap = {};
    let totalExpensesCents = 0;
    let totalIncomesCents = 0;

    chartTransactions.forEach((tx) => {
      // Ignora o lançamento consolidado de fatura para não duplicar com os itens individuais de compras do cartão
      if (tx.isInvoiceMaster || tx.isInvoicePayment) return;

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

  // Faturas dos Cartões de Crédito (Detalhamento, Itens, Status e Limites para o Mês do Dashboard)
  const cardInvoices = useMemo(() => {
    const todayStr = new Date().toISOString().slice(0, 10);
    const todayTime = new Date(todayStr + 'T12:00:00').getTime();
    const map = {};
    cards.forEach((card) => {
      const cardTxs = visibleTransactions.filter((t) => t.cardId === card.id && t.status !== 'CANCELADO');
      cardTxs.sort((a, b) => {
        const dateA = getTxDueDate(a) || a.date;
        const dateB = getTxDueDate(b) || b.date;
        const diffA = Math.abs(new Date(dateA + 'T12:00:00').getTime() - todayTime);
        const diffB = Math.abs(new Date(dateB + 'T12:00:00').getTime() - todayTime);
        if (diffA !== diffB) return diffA - diffB;
        return new Date(dateA + 'T12:00:00') - new Date(dateB + 'T12:00:00');
      });
      // Limite comprometido total (soma de todas as parcelas ativas)
      const committed = cardTxs.reduce((acc, t) => acc + (t.type === 'EXPENSE' ? t.amountCents : 0), 0);

      // Itens da fatura do mês selecionado no dashboard
      const monthItems = cardTxs.filter((t) => {
        const due = getTxDueDate(t) || t.date;
        return due && due.startsWith(dashboardMonth);
      });

      const currentMonthExpenses = monthItems
        .filter((t) => t.type === 'EXPENSE')
        .reduce((acc, t) => acc + t.amountCents, 0);

      // Procura pagamento registrado para este cartão nesta fatura
      const paymentTx = visibleTransactions.find(
        (t) => t.isInvoicePayment && t.targetCardId === card.id && t.invoiceMonth === dashboardMonth && t.status !== 'CANCELADO'
      );

      const paidItemsCents = monthItems
        .filter((t) => t.type === 'EXPENSE' && t.status === 'REALIZADO')
        .reduce((acc, t) => acc + t.amountCents, 0);

      const allItemsRealizado = monthItems.length > 0 && monthItems.every((t) => t.status === 'REALIZADO');
      const isPaid = Boolean(paymentTx || (monthItems.length > 0 && allItemsRealizado));

      // Datas nominais de vencimento e fechamento
      const dueDayPadded = String(Math.min(28, card.dueDay || 10)).padStart(2, '0');
      const closingDayPadded = String(Math.min(28, card.closingDay || 3)).padStart(2, '0');
      const dueDateIso = `${dashboardMonth}-${dueDayPadded}`;
      const closingDateIso = `${dashboardMonth}-${closingDayPadded}`;

      let invoiceStatus = 'ABERTA';
      if (isPaid) {
        invoiceStatus = 'PAGA';
      } else if (todayStr > dueDateIso) {
        invoiceStatus = 'EM ATRASO';
      } else if (todayStr > closingDateIso) {
        invoiceStatus = 'FECHADA';
      } else {
        invoiceStatus = 'ABERTA';
      }

      map[card.id] = {
        card,
        items: cardTxs,
        monthItems,
        invoiceTotalCents: currentMonthExpenses,
        committedCents: committed,
        availableCents: Math.max(0, card.limitCents - committed),
        isPaid,
        paidCents: paymentTx ? paymentTx.amountCents : paidItemsCents,
        paymentTx,
        invoiceStatus,
        dueDateIso,
        closingDateIso,
      };
    });
    return map;
  }, [cards, visibleTransactions, dashboardMonth, getTxDueDate]);

  // Retrocompatibilidade para cardStats
  const cardStats = cardInvoices;

  // Meses disponíveis com atividade de cartão (passado, presente e futuro até o horizonte de parcelas)
  const availableInvoiceMonths = useMemo(() => {
    const monthsSet = new Set();
    const now = new Date();
    // Garante presença do mês atual e meses ao redor (-3 a +12)
    for (let i = -3; i <= 12; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
      monthsSet.add(d.toISOString().slice(0, 7));
    }
    // Inclui todos os meses em que há qualquer vencimento de cartão registrado (inclusive financiamentos longos)
    visibleTransactions.forEach((t) => {
      if (t.cardId && t.status !== 'CANCELADO') {
        const due = getTxDueDate(t) || t.date;
        if (due && due.length >= 7) {
          monthsSet.add(due.slice(0, 7));
        }
      }
    });
    return Array.from(monthsSet).sort();
  }, [visibleTransactions, getTxDueDate]);

  // Faturas dos Cartões de Crédito calculadas para o mês selecionado na aba Faturas
  const faturasCardsData = useMemo(() => {
    const todayStr = new Date().toISOString().slice(0, 10);
    const map = {};

    cards.forEach((card) => {
      const allCardTxs = visibleTransactions.filter((t) => t.cardId === card.id && t.status !== 'CANCELADO');

      // Limite total comprometido (soma de todas as parcelas ativas de qualquer época)
      const committedTotalCents = allCardTxs.reduce((acc, t) => acc + (t.type === 'EXPENSE' ? t.amountCents : 0), 0);
      const availableCents = Math.max(0, card.limitCents - committedTotalCents);

      // Itens que vencem estritamente no mês selecionado
      const monthItems = allCardTxs.filter((t) => {
        const due = getTxDueDate(t) || t.date;
        return due && due.startsWith(invoiceSelectedMonth);
      });

      monthItems.sort((a, b) => {
        const dateA = a.purchaseDate || getTxDueDate(a) || a.date;
        const dateB = b.purchaseDate || getTxDueDate(b) || b.date;
        return dateA.localeCompare(dateB);
      });

      const invoiceExpensesCents = monthItems
        .filter((t) => t.type === 'EXPENSE')
        .reduce((acc, t) => acc + t.amountCents, 0);

      // Procura pagamento registrado para este cartão nesta fatura
      const paymentTx = visibleTransactions.find(
        (t) => t.isInvoicePayment && t.targetCardId === card.id && t.invoiceMonth === invoiceSelectedMonth && t.status !== 'CANCELADO'
      );

      const paidItemsCents = monthItems
        .filter((t) => t.type === 'EXPENSE' && t.status === 'REALIZADO')
        .reduce((acc, t) => acc + t.amountCents, 0);

      const allItemsRealizado = monthItems.length > 0 && monthItems.every((t) => t.status === 'REALIZADO');
      const isPaid = Boolean(paymentTx || (monthItems.length > 0 && allItemsRealizado));

      // Datas nominais de vencimento e fechamento
      const dueDayPadded = String(Math.min(28, card.dueDay || 10)).padStart(2, '0');
      const closingDayPadded = String(Math.min(28, card.closingDay || 3)).padStart(2, '0');
      const dueDateIso = `${invoiceSelectedMonth}-${dueDayPadded}`;
      const closingDateIso = `${invoiceSelectedMonth}-${closingDayPadded}`;

      let invoiceStatus = 'ABERTA';
      if (isPaid) {
        invoiceStatus = 'PAGA';
      } else if (todayStr > dueDateIso) {
        invoiceStatus = 'EM ATRASO';
      } else if (todayStr > closingDateIso) {
        invoiceStatus = 'FECHADA';
      } else {
        invoiceStatus = 'ABERTA';
      }

      map[card.id] = {
        card,
        monthItems,
        invoiceTotalCents: invoiceExpensesCents,
        committedTotalCents,
        availableCents,
        isPaid,
        paidCents: paymentTx ? paymentTx.amountCents : paidItemsCents,
        paymentTx,
        invoiceStatus,
        dueDateIso,
        closingDateIso,
      };
    });

    return map;
  }, [cards, visibleTransactions, invoiceSelectedMonth, getTxDueDate]);

  // Função que calcula os envelopes e o comprometimento virtual para qualquer mês (Método dos Envelopes)
  const getEnvelopesForMonth = useCallback(
    (targetMonth) => {
      const spentByCat = {};
      visibleTransactions.forEach((tx) => {
        if (tx.status === 'CANCELADO') return;
        if (tx.type !== 'EXPENSE') return;
        // Não duplica transações técnicas de pagamento de fatura
        if (tx.isInvoicePayment) return;

        const effectiveDate = getTxDueDate(tx) || tx.date;
        if (!effectiveDate || !effectiveDate.startsWith(targetMonth)) return;

        const catId = tx.categoryId || '__none__';
        spentByCat[catId] = (spentByCat[catId] || 0) + tx.amountCents;
      });

      const envelopeList = categories
        .filter((cat) => !cat.archived && cat.type === 'EXPENSE' && (cat.budgetLimitCents || 0) > 0)
        .map((cat) => {
          const allocatedCents = cat.budgetLimitCents || 0;
          const spentCents = spentByCat[cat.id] || 0;
          const remainingCents = Math.max(0, allocatedCents - spentCents);
          const overspentCents = Math.max(0, spentCents - allocatedCents);
          const percentage = allocatedCents > 0 ? (spentCents / allocatedCents) * 100 : 0;
          const isOver = spentCents > allocatedCents;

          let status = 'healthy';
          if (isOver) status = 'over';
          else if (spentCents === allocatedCents) status = 'limit';
          else if (percentage >= 80) status = 'warning';

          return {
            category: cat,
            allocatedCents,
            spentCents,
            remainingCents,
            overspentCents,
            percentage,
            isOver,
            status,
          };
        })
        .sort((a, b) => b.allocatedCents - a.allocatedCents);

      const totalAllocatedCents = envelopeList.reduce((acc, e) => acc + e.allocatedCents, 0);
      const totalSpentCents = envelopeList.reduce((acc, e) => acc + e.spentCents, 0);
      const totalResidualCommittedCents = envelopeList.reduce((acc, e) => acc + e.remainingCents, 0);
      const totalOverspentCents = envelopeList.reduce((acc, e) => acc + e.overspentCents, 0);

      return {
        targetMonth,
        envelopes: envelopeList,
        totalAllocatedCents,
        totalSpentCents,
        totalResidualCommittedCents,
        totalOverspentCents,
        hasEnvelopes: envelopeList.length > 0,
      };
    },
    [visibleTransactions, categories, getTxDueDate]
  );

  const dashboardEnvelopes = useMemo(() => {
    return getEnvelopesForMonth(dashboardMonth);
  }, [getEnvelopesForMonth, dashboardMonth]);

  // Totais do Mês Selecionado (Dashboard) e Projeção Consolidada
  const monthSummary = useMemo(() => {
    let incomeRealized = 0;
    let incomePending = 0;
    let bankExpenseRealized = 0;
    let bankExpensePending = 0;

    visibleTransactions.forEach((tx) => {
      if (tx.status === 'CANCELADO') return;
      // Ignora lançamentos de cartão e lançamentos técnicos de pagamento de fatura,
      // pois as faturas de cartão são contabilizadas de forma consolidada abaixo
      if (tx.cardId || tx.isInvoicePayment) return;

      const effectiveDate = getTxDueDate(tx) || tx.date;
      if (!effectiveDate || !effectiveDate.startsWith(dashboardMonth)) return;

      if (tx.type === 'INCOME') {
        if (tx.status === 'REALIZADO') {
          incomeRealized += tx.amountCents;
        } else {
          incomePending += tx.amountCents;
        }
      } else if (tx.type === 'EXPENSE') {
        if (tx.status === 'REALIZADO') {
          bankExpenseRealized += tx.amountCents;
        } else {
          bankExpensePending += tx.amountCents;
        }
      }
    });

    // Faturas de Cartão de Crédito do mês selecionado
    let cardInvoicesRealized = 0;
    let cardInvoicesPending = 0;

    cards.forEach((card) => {
      const stats = cardStats[card.id];
      if (!stats) return;
      const invTotal = stats.invoiceTotalCents || 0;
      if (invTotal <= 0) return;

      if (stats.isPaid) {
        cardInvoicesRealized += invTotal;
      } else {
        cardInvoicesPending += invTotal;
      }
    });

    const incomeTotal = incomeRealized + incomePending;
    const expenseRealized = bankExpenseRealized + cardInvoicesRealized;
    const expensePending = bankExpensePending + cardInvoicesPending;
    const expenseTotal = expenseRealized + expensePending;

    const totalBankBalance = Object.values(accountBalances).reduce((a, b) => a + b, 0);
    const totalCardsAvailable = Object.values(cardStats).reduce((a, b) => a + b.availableCents, 0);
    const projectedEndBalance = totalBankBalance + incomePending - expensePending;
    const envelopesCommitted = dashboardEnvelopes.totalResidualCommittedCents;
    const freeProjectedBalance = projectedEndBalance - envelopesCommitted;

    return {
      income: incomeTotal,
      incomeTotal,
      incomeRealized,
      incomePending,
      expense: expenseTotal,
      expenseTotal,
      expenseRealized,
      expensePending,
      balance: incomeTotal - expenseTotal,
      committed: expensePending,
      envelopesCommitted,
      freeProjectedBalance,
      totalBankBalance,
      totalCardsAvailable,
      projectedEndBalance,
    };
  }, [visibleTransactions, accountBalances, cardStats, cards, dashboardMonth, getTxDueDate, dashboardEnvelopes]);

  // Maiores Gastos por Categoria no Mês do Dashboard
  const dashboardCategoryChartData = useMemo(() => {
    const expenseMap = {};
    let totalExpensesCents = 0;

    visibleTransactions.forEach((tx) => {
      if (tx.status === 'CANCELADO') return;
      const effectiveDate = getTxDueDate(tx) || tx.date;
      if (!effectiveDate || !effectiveDate.startsWith(dashboardMonth)) return;
      if (tx.type !== 'EXPENSE') return;
      // Não duplica a transação de pagamento de fatura no gráfico analítico de categorias de consumo
      if (tx.isInvoicePayment) return;

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
  }, [visibleTransactions, dashboardMonth, categories, getTxDueDate]);

  // Lançamentos em atraso (comprometidos com vencimento anterior a hoje)
  const overdueTransactions = useMemo(() => {
    const todayStr = new Date().toISOString().slice(0, 10);
    return visibleTransactions.filter((tx) => isTxOverdue(tx, todayStr));
  }, [visibleTransactions, isTxOverdue]);

  const overdueExpensesTotalCents = useMemo(() => {
    return overdueTransactions
      .filter((tx) => tx.type === 'EXPENSE')
      .reduce((acc, tx) => acc + tx.amountCents, 0);
  }, [overdueTransactions]);

  // Próximos Vencimentos & Compromissos para o Dashboard (Ordem cronológica com atrasos prioritários no topo)
  const upcomingCommitments = useMemo(() => {
    const todayStr = new Date().toISOString().slice(0, 10);

    // Filtra transações não canceladas: vencimentos futuros ou pendentes/atrasados
    const pendingOrUpcoming = visibleTransactions.filter((tx) => {
      if (tx.status === 'CANCELADO') return false;
      const due = getTxDueDate(tx);
      if (due >= todayStr) return true;
      return tx.status === 'COMPROMETIDO';
    });

    // Ordenação: contas em atraso no topo (da mais antiga para a mais recente),
    // seguidas pelos compromissos a partir de hoje em ordem cronológica crescente.
    pendingOrUpcoming.sort((a, b) => {
      const isOverdueA = isTxOverdue(a, todayStr);
      const isOverdueB = isTxOverdue(b, todayStr);

      if (isOverdueA && !isOverdueB) return -1;
      if (!isOverdueA && isOverdueB) return 1;

      const dueA = getTxDueDate(a) || '';
      const dueB = getTxDueDate(b) || '';
      return dueA.localeCompare(dueB);
    });

    return pendingOrUpcoming.slice(0, 6);
  }, [visibleTransactions, getTxDueDate, isTxOverdue]);

  // Resumo de dados da importação de fatura em conferência
  const importSummary = useMemo(() => {
    if (!importPreviewData) return { selectedCount: 0, selectedTotalCents: 0, duplicateCount: 0, unselectedCount: 0 };
    const selected = importPreviewData.filter((i) => i.selected);
    const duplicates = importPreviewData.filter((i) => i.isDuplicate);
    const selectedTotalCents = selected.reduce((acc, i) => acc + i.amountCents, 0);
    return {
      selectedCount: selected.length,
      selectedTotalCents,
      duplicateCount: duplicates.length,
      unselectedCount: importPreviewData.length - selected.length,
    };
  }, [importPreviewData]);

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
    const budgetRaw = fd.get('budgetLimit');
    const budgetLimitCents = budgetRaw !== null && budgetRaw !== '' ? Math.max(0, Math.round(parseFloat(budgetRaw || '0') * 100)) : 0;

    const newCat = {
      id,
      name: fd.get('name'),
      type: fd.get('type'),
      color: fd.get('color') || '#475569',
      archived: modalState.mode === 'edit' ? modalState.data.archived : false,
      budgetLimitCents,
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
    const installments = parseInt(fd.get('installments') || '1', 10);
    const isRecurring = formIsRecurring || fd.get('isRecurring') === 'on';
    const scope = fd.get('scope') || 'FAMILY';
    const ownerId = fd.get('ownerId') || (currentMemberId === 'user-all' ? 'user-1' : currentMemberId);

    const isActualRecurrence = Boolean(
      original.recurrenceRuleId &&
      !String(original.recurrenceRuleId).startsWith('PURCHASE_DATE:') &&
      !String(original.recurrenceRuleId).startsWith('INVOICE_PAY:')
    );

    if (isEditing) {
      if (editScope === 'all' && (original.installmentGroupId || isActualRecurrence)) {
        const matched = [];
        setTransactions((prev) => {
          const updated = prev.map((t) => {
            const isMatch =
              (original.installmentGroupId && t.installmentGroupId === original.installmentGroupId) ||
              (isActualRecurrence && t.recurrenceRuleId === original.recurrenceRuleId);
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
          saveToLocalStorage('financas_transactions_v1', updated);
          return updated;
        });
        syncBatchTransactions(matched);
      } else if (editScope === 'future' && (original.installmentGroupId || isActualRecurrence)) {
        const matched = [];
        setTransactions((prev) => {
          const updated = prev.map((t) => {
            const isMatch =
              (original.installmentGroupId &&
                t.installmentGroupId === original.installmentGroupId &&
                (t.installmentNumber || 0) >= (original.installmentNumber || 0)) ||
              (isActualRecurrence &&
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
          saveToLocalStorage('financas_transactions_v1', updated);
          return updated;
        });
        syncBatchTransactions(matched);
      } else {
        if (isRecurring && !isActualRecurrence && !original.installmentGroupId) {
          // Converter um lançamento avulso existente em recorrente
          const recurringHorizon = parseInt(fd.get('recurringHorizon') || String(formRecurringMonths) || '12', 10);
          const ruleId = `rec-${Date.now()}`;
          const baseDueDate = fd.get('date');
          const basePurchaseDate = modalSourceType === 'CARD' ? (fd.get('purchaseDate') || original.purchaseDate || baseDueDate) : baseDueDate;

          const updatedTx = {
            ...original,
            description: fd.get('description'),
            amountCents: amount,
            type: fd.get('type'),
            status: fd.get('status'),
            date: baseDueDate,
            dueDate: baseDueDate,
            purchaseDate: basePurchaseDate,
            categoryId: fd.get('categoryId'),
            scope,
            ownerId,
            accountId: modalSourceType === 'ACCOUNT' ? (fd.get('accountId') || null) : null,
            cardId: modalSourceType === 'CARD' ? (fd.get('cardId') || original.cardId || null) : null,
            isRecurring: true,
            recurrenceRuleId: ruleId,
          };

          const newFutureTxs = [];
          for (let i = 1; i < recurringHorizon; i++) {
            const recDueDate = addMonthsToIso(baseDueDate, i);
            const recPurchaseDate = modalSourceType === 'CARD' ? addMonthsToIso(basePurchaseDate, i) : recDueDate;

            newFutureTxs.push({
              id: `tx-${Date.now()}-${i + 1}`,
              description: fd.get('description'),
              amountCents: amount,
              type: fd.get('type'),
              status: 'COMPROMETIDO',
              date: recDueDate,
              dueDate: recDueDate,
              purchaseDate: recPurchaseDate,
              categoryId: fd.get('categoryId'),
              scope,
              ownerId,
              accountId: modalSourceType === 'ACCOUNT' ? (fd.get('accountId') || null) : null,
              cardId: modalSourceType === 'CARD' ? (fd.get('cardId') || original.cardId || null) : null,
              isRecurring: true,
              recurrenceRuleId: ruleId,
            });
          }

          setTransactions((prev) => {
            const updated = [...prev.map((t) => (t.id === original.id ? updatedTx : t)), ...newFutureTxs];
            saveToLocalStorage('financas_transactions_v1', updated);
            return updated;
          });
          syncBatchTransactions([updatedTx, ...newFutureTxs]);
        } else {
          const baseDueDate = fd.get('date');
          const basePurchaseDate = modalSourceType === 'CARD' ? (fd.get('purchaseDate') || original.purchaseDate || baseDueDate) : baseDueDate;

          const updatedTx = {
            ...original,
            description: fd.get('description'),
            amountCents: amount,
            type: fd.get('type'),
            status: fd.get('status'),
            date: baseDueDate,
            dueDate: baseDueDate,
            purchaseDate: basePurchaseDate,
            categoryId: fd.get('categoryId'),
            scope,
            ownerId,
            accountId: modalSourceType === 'ACCOUNT' ? (fd.get('accountId') || null) : null,
            cardId: modalSourceType === 'CARD' ? (fd.get('cardId') || null) : null,
          };

          setTransactions((prev) => {
            const updated = prev.map((t) => (t.id === original.id ? updatedTx : t));
            saveToLocalStorage('financas_transactions_v1', updated);
            return updated;
          });
          syncItem('transactions', updatedTx);
        }
      }
    } else {
      const installmentValueMode = fd.get('installmentValueMode') || 'TOTAL';
      if (installments > 1) {
        const startNum = Math.min(installments, Math.max(1, parseInt(fd.get('startInstallment') || String(formStartInstallment) || '1', 10)));
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
        const baseDueDate = fd.get('date');
        const basePurchaseDate = modalSourceType === 'CARD' ? (fd.get('purchaseDate') || fd.get('date')) : fd.get('date');

        for (let i = startNum; i <= installments; i++) {
          const offset = i - startNum;
          const installmentDueDate = addMonthsToIso(baseDueDate, offset);
          const installmentPurchaseDate = addMonthsToIso(basePurchaseDate, offset);

          newTxs.push({
            id: `tx-${Date.now()}-${i}`,
            description: `${fd.get('description')} (${String(i).padStart(2, '0')}/${String(installments).padStart(2, '0')})`,
            amountCents: installmentAmounts[i - 1],
            type: fd.get('type'),
            status: fd.get('status') || 'COMPROMETIDO',
            date: installmentDueDate,
            dueDate: installmentDueDate,
            purchaseDate: modalSourceType === 'CARD' ? installmentPurchaseDate : installmentDueDate,
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
        setTransactions((prev) => {
          const updated = [...prev, ...newTxs];
          saveToLocalStorage('financas_transactions_v1', updated);
          return updated;
        });
        syncBatchTransactions(newTxs);
      } else if (isRecurring) {
        // Lançamento com repetição mensal (Recorrência) gerado para o horizonte escolhido (ex: 12, 24 ou 36 meses)
        const recurringHorizon = parseInt(fd.get('recurringHorizon') || String(formRecurringMonths) || '12', 10);
        const ruleId = `rec-${Date.now()}`;
        const baseDueDate = fd.get('date');
        const basePurchaseDate = modalSourceType === 'CARD' ? (fd.get('purchaseDate') || fd.get('date')) : fd.get('date');
        const newTxs = [];

        for (let i = 0; i < recurringHorizon; i++) {
          const recDueDate = addMonthsToIso(baseDueDate, i);
          const recPurchaseDate = modalSourceType === 'CARD' ? addMonthsToIso(basePurchaseDate, i) : recDueDate;

          newTxs.push({
            id: `tx-${Date.now()}-${i + 1}`,
            description: fd.get('description'),
            amountCents: amount,
            type: fd.get('type'),
            // O 1º mês recebe o status selecionado pelo usuário; os meses futuros nascem como COMPROMETIDO
            status: i === 0 ? (fd.get('status') || 'COMPROMETIDO') : 'COMPROMETIDO',
            date: recDueDate,
            dueDate: recDueDate,
            purchaseDate: recPurchaseDate,
            categoryId: fd.get('categoryId'),
            scope,
            ownerId,
            accountId: modalSourceType === 'ACCOUNT' ? (fd.get('accountId') || null) : null,
            cardId: modalSourceType === 'CARD' ? (fd.get('cardId') || null) : null,
            isRecurring: true,
            recurrenceRuleId: ruleId,
          });
        }

        setTransactions((prev) => {
          const updated = [...prev, ...newTxs];
          saveToLocalStorage('financas_transactions_v1', updated);
          return updated;
        });
        syncBatchTransactions(newTxs);
      } else {
        const baseDueDate = fd.get('date');
        const basePurchaseDate = modalSourceType === 'CARD' ? (fd.get('purchaseDate') || fd.get('date')) : fd.get('date');
        const newTx = {
          id: `tx-${Date.now()}`,
          description: fd.get('description'),
          amountCents: amount,
          type: fd.get('type'),
          status: fd.get('status'),
          date: baseDueDate,
          dueDate: baseDueDate,
          purchaseDate: basePurchaseDate,
          categoryId: fd.get('categoryId'),
          scope,
          ownerId,
          accountId: modalSourceType === 'ACCOUNT' ? (fd.get('accountId') || null) : null,
          cardId: modalSourceType === 'CARD' ? (fd.get('cardId') || null) : null,
          isRecurring: false,
          recurrenceRuleId: null,
        };
        setTransactions((prev) => {
          const updated = [...prev, newTx];
          saveToLocalStorage('financas_transactions_v1', updated);
          return updated;
        });
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
    } else if (scope === 'past_only') {
      toDelete = transactions.filter((t) => {
        if (tx.installmentGroupId && t.installmentGroupId === tx.installmentGroupId) {
          return (t.installmentNumber || 0) < (tx.installmentNumber || 0);
        }
        if (tx.recurrenceRuleId && t.recurrenceRuleId === tx.recurrenceRuleId) {
          return t.date < tx.date;
        }
        return false;
      });
    } else if (scope === 'past_inclusive') {
      toDelete = transactions.filter((t) => {
        if (tx.installmentGroupId && t.installmentGroupId === tx.installmentGroupId) {
          return (t.installmentNumber || 0) <= (tx.installmentNumber || 0);
        }
        if (tx.recurrenceRuleId && t.recurrenceRuleId === tx.recurrenceRuleId) {
          return t.date <= tx.date;
        }
        return t.id === tx.id;
      });
    }

    const deleteIds = new Set(toDelete.map((t) => t.id));
    setTransactions((prev) => {
      const updated = prev.filter((t) => !deleteIds.has(t.id));
      saveToLocalStorage('financas_transactions_v1', updated);
      return updated;
    });

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

  // Abre o modal de pagamento da fatura consolidada de um cartão para um determinado mês
  const openInvoicePaymentModal = (card, monthKey) => {
    if (!card) return;
    const allCardTxs = visibleTransactions.filter((t) => t.cardId === card.id && t.status !== 'CANCELADO');
    const monthItems = allCardTxs.filter((t) => {
      const due = getTxDueDate(t) || t.date;
      return due && due.startsWith(monthKey);
    });

    const totalCents = monthItems
      .filter((t) => t.type === 'EXPENSE')
      .reduce((acc, t) => acc + t.amountCents, 0);

    const dueDayPadded = String(Math.min(28, card.dueDay || 10)).padStart(2, '0');
    const dueDateIso = `${monthKey}-${dueDayPadded}`;

    setInvoicePaymentModal({
      isOpen: true,
      card,
      monthKey,
      totalCents,
      monthItems,
      dueDateIso,
    });
  };

  // Confirmação do pagamento da fatura com débito da conta bancária e quitação dos lançamentos
  const handleConfirmInvoicePayment = (e) => {
    e.preventDefault();
    const card = invoicePaymentModal.card;
    if (!card) return;

    const fd = new FormData(e.target);
    const accountId = fd.get('accountId');
    if (!accountId) {
      alert('Selecione a conta bancária de onde o pagamento será debitado.');
      return;
    }

    const paidAmount = parseFloat(fd.get('paidAmount') || '0');
    const paidAmountCents = Math.round(paidAmount * 100);
    if (paidAmountCents <= 0) {
      alert('Informe um valor válido para o pagamento da fatura.');
      return;
    }

    const paymentDate = fd.get('paymentDate') || new Date().toISOString().slice(0, 10);
    const description =
      fd.get('description') ||
      `Pagamento Fatura ${card.name} (${formatMonthLabel(invoicePaymentModal.monthKey)})`;

    // 1. Quitar todos os lançamentos vinculados a esta fatura
    const monthItemIds = new Set(invoicePaymentModal.monthItems.map((i) => i.id));
    const updatedMonthItems = [];

    // 2. Transação de saída bancária para quitar a fatura
    const paymentTx = {
      id: `tx-invoice-pay-${card.id}-${invoicePaymentModal.monthKey}-${Date.now()}`,
      description,
      amountCents: paidAmountCents,
      type: 'EXPENSE',
      status: 'REALIZADO',
      date: paymentDate,
      dueDate: paymentDate,
      accountId,
      cardId: null,
      targetCardId: card.id,
      isInvoicePayment: true,
      invoiceMonth: invoicePaymentModal.monthKey,
      categoryId:
        categories.find(
          (c) =>
            c.name.toLowerCase().includes('cart') ||
            c.name.toLowerCase().includes('pagamento') ||
            c.name.toLowerCase().includes('financ')
        )?.id || categories[0]?.id || null,
      scope: card.scope || 'FAMILY',
      ownerId: card.ownerId || (currentMemberId === 'user-all' ? 'user-1' : currentMemberId),
    };

    const updatedTransactions = transactions.map((t) => {
      if (monthItemIds.has(t.id)) {
        const u = { ...t, status: 'REALIZADO' };
        updatedMonthItems.push(u);
        return u;
      }
      return t;
    });

    updatedTransactions.unshift(paymentTx);

    setTransactions(updatedTransactions);
    saveToLocalStorage('financas_transactions_v1', updatedTransactions);

    // Sincronização
    syncBatchTransactions([...updatedMonthItems, paymentTx]);

    setInvoicePaymentModal({
      isOpen: false,
      card: null,
      monthKey: '',
      totalCents: 0,
      monthItems: [],
      dueDateIso: '',
    });
  };

  // Alternador de situação do lançamento individual
  const toggleStatusPaid = (tx) => {
    // Se o lançamento for de cartão de crédito, não permite quitação avulsa isolada
    if (tx.cardId) {
      const card = cards.find((c) => c.id === tx.cardId);
      const effectiveDue = getTxDueDate(tx) || tx.date;
      const monthKey = effectiveDue ? effectiveDue.slice(0, 7) : invoiceSelectedMonth;
      setCardPaymentPromptModal({
        isOpen: true,
        transaction: tx,
        card: card || { name: 'Cartão de Crédito', id: tx.cardId },
        monthKey,
        dueDateIso: effectiveDue,
      });
      return;
    }

    // Lançamentos normais de conta corrente / dinheiro
    const nextStatus = tx.status === 'REALIZADO' ? 'COMPROMETIDO' : 'REALIZADO';
    const updatedTx = { ...tx, status: nextStatus };
    const updated = transactions.map((t) => (t.id === tx.id ? updatedTx : t));
    setTransactions(updated);
    saveToLocalStorage('financas_transactions_v1', updated);
    syncItem('transactions', updatedTx);
  };

  // Quitação ou confirmação explícita de lançamento (1 clique)
  const handleQuickPayTransaction = (tx, targetStatus = 'REALIZADO') => {
    if (!tx) return;
    if (tx.cardId) {
      const card = cards.find((c) => c.id === tx.cardId);
      const effectiveDue = getTxDueDate(tx) || tx.date;
      const monthKey = effectiveDue ? effectiveDue.slice(0, 7) : invoiceSelectedMonth;
      openInvoicePaymentModal(card, monthKey);
      return;
    }

    const updatedTx = { ...tx, status: targetStatus };
    const updated = transactions.map((t) => (t.id === tx.id ? updatedTx : t));
    setTransactions(updated);
    saveToLocalStorage('financas_transactions_v1', updated);
    syncItem('transactions', updatedTx);
  };

  // Abrir modal de exclusão de toda uma fatura e compras vinculadas
  const handleOpenDeleteInvoiceModal = (card, monthKey) => {
    if (!card || !monthKey) return;
    const items = transactions.filter(
      (t) => t.cardId === card.id && (getTxDueDate(t) || t.date || '').startsWith(monthKey) && t.status !== 'CANCELADO'
    );
    const paymentTx = transactions.find(
      (t) => t.isInvoicePayment && t.targetCardId === card.id && t.invoiceMonth === monthKey && t.status !== 'CANCELADO'
    );
    const totalCents = items.filter((t) => t.type === 'EXPENSE').reduce((acc, t) => acc + t.amountCents, 0);

    setDeleteInvoiceModalState({
      isOpen: true,
      card,
      monthKey,
      items,
      paymentTx,
      totalCents,
      includeFutureInstallments: false,
    });
  };

  // Confirmar exclusão de toda a fatura e opcionalmente parcelas futuras
  const handleConfirmDeleteInvoice = () => {
    const { card, monthKey, items, paymentTx, includeFutureInstallments } = deleteInvoiceModalState;
    if (!card || !monthKey) return;

    let toDelete = [...items];
    if (paymentTx) {
      toDelete.push(paymentTx);
    }

    if (includeFutureInstallments) {
      items.forEach((item) => {
        if (item.installmentGroupId) {
          const futureInstallments = transactions.filter(
            (t) =>
              t.installmentGroupId === item.installmentGroupId &&
              (t.installmentNumber || 0) > (item.installmentNumber || 0)
          );
          toDelete.push(...futureInstallments);
        } else if (item.recurrenceRuleId) {
          const futureRecurrences = transactions.filter(
            (t) =>
              t.recurrenceRuleId === item.recurrenceRuleId &&
              t.date > item.date
          );
          toDelete.push(...futureRecurrences);
        }
      });
    }

    const deleteIds = new Set(toDelete.map((t) => t.id));
    const uniqueToDelete = toDelete.filter((t, idx, arr) => arr.findIndex((x) => x.id === t.id) === idx);
    const updated = transactions.filter((t) => !deleteIds.has(t.id));

    setTransactions(updated);
    saveToLocalStorage('financas_transactions_v1', updated);

    if (uniqueToDelete.length > 0) {
      syncBatchTransactions(uniqueToDelete, true);
    }

    setDeleteInvoiceModalState({
      isOpen: false,
      card: null,
      monthKey: '',
      items: [],
      paymentTx: null,
      totalCents: 0,
      includeFutureInstallments: false,
    });
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
        'ID,Descricao,Valor_Centavos,Tipo,Status,Data_Vencimento,Data_Compra,Escopo,Responsavel,Categoria_ID,Conta_ID,Cartao_ID',
        ...transactions.map(
          (t) =>
            `"${t.id}","${t.description}",${t.amountCents},"${t.type}","${t.status}","${formatDateBR(getTxDueDate(t) || t.date)}","${formatDateBR(t.purchaseDate || t.date)}","${t.scope}","${t.ownerId}","${t.categoryId}","${t.accountId || ''}","${t.cardId || ''}"`
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

  // Handlers para Importação Real de Faturas e Extratos (PDF, CSV, TXT)
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImportLoading(true);

    try {
      const isPdf = file.name.toLowerCase().endsWith('.pdf') || file.type === 'application/pdf';

      if (isPdf) {
        const arrayBuffer = await file.arrayBuffer();
        const parsed = await parseInvoicePdf(new Uint8Array(arrayBuffer), categories, FAMILY_MEMBERS);

        if (!parsed.items || parsed.items.length === 0) {
          alert('Não foi possível identificar lançamentos de compras nesta fatura em PDF. Verifique se o arquivo não está corrompido ou protegido por senha.');
          setIsImportLoading(false);
          return;
        }

        // Tenta associar automaticamente o cartão correto pelo final (ex: 8557) ou nome
        let targetCardId = importSelectedCard;
        if (parsed.cardLast4) {
          const matchedCard = cards.find(
            (c) =>
              (c.name && c.name.includes(parsed.cardLast4)) ||
              (c.bank && c.bank.toLowerCase().includes('itau')) ||
              (c.name && c.name.toLowerCase().includes('itau'))
          );
          if (matchedCard) {
            targetCardId = matchedCard.id;
            setImportSelectedCard(matchedCard.id);
          }
        }

        const todayStr = new Date().toISOString().slice(0, 10);
        const suggestedStatus = (parsed.dueDateIso && parsed.dueDateIso >= todayStr) ? 'COMPROMETIDO' : 'REALIZADO';
        setImportDefaultStatus(suggestedStatus);

        // Verificação inteligente de duplicidade contra os lançamentos já existentes
        const analyzed = parsed.items.map((item) => {
          const isDuplicate = transactions.some(
            (t) =>
              t.cardId === targetCardId &&
              t.amountCents === item.amountCents &&
              (t.purchaseDate === item.purchaseDate ||
                t.date === item.date ||
                t.description.toLowerCase().trim() === item.description.toLowerCase().trim())
          );
          return {
            ...item,
            status: suggestedStatus,
            isDuplicate,
            selected: !isDuplicate,
          };
        });

        setImportMetadata({
          fileName: file.name,
          cardholder: parsed.cardholder,
          cardLast4: parsed.cardLast4,
          dueDate: parsed.dueDate,
          dueDateIso: parsed.dueDateIso,
          closingDate: parsed.closingDate,
          totalInvoiceCents: parsed.totalInvoiceCents,
          isReconciled: parsed.isReconciled,
        });
        setImportPreviewData(analyzed);
      } else {
        // Leitura de CSV / TXT
        const text = await file.text();
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
              const isoDate = datePart.includes('/') ? datePart.split('/').reverse().join('-') : datePart;
              parsedItems.push({
                id: `imp-file-${Date.now()}-${idx}-${Math.random().toString(36).slice(2, 5)}`,
                description: descPart,
                amountCents,
                date: isoDate,
                dateDisplay: formatDateBR(isoDate),
                categoryId: categories[0]?.id || 'cat-1',
                scope: 'FAMILY',
                ownerId: currentMemberId === 'user-all' ? 'user-1' : currentMemberId,
                installmentNumber: null,
                installmentCount: null,
                selected: true,
              });
            }
          }
        });

        if (parsedItems.length === 0) {
          alert('Não foi possível identificar lançamentos no arquivo. Use o formato Data; Descrição; Valor (CSV) ou envie uma fatura PDF.');
          setIsImportLoading(false);
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

        setImportMetadata({
          fileName: file.name,
          cardholder: '',
          cardLast4: '',
          dueDate: '',
          closingDate: '',
          totalInvoiceCents: analyzed.reduce((a, b) => a + b.amountCents, 0),
          isReconciled: true,
        });
        setImportPreviewData(analyzed);
      }
    } catch (err) {
      console.error('Erro na leitura da fatura:', err);
      alert('Ocorreu um erro ao ler o arquivo. Certifique-se de que é uma fatura PDF ou arquivo CSV válido.');
    } finally {
      setIsImportLoading(false);
      if (e.target) e.target.value = '';
    }
  };

  // Atualização em tempo real de campos de um item proposto na importação
  const handleUpdateImportItem = (id, fields) => {
    setImportPreviewData((prev) =>
      prev ? prev.map((item) => (item.id === id ? { ...item, ...fields } : item)) : prev
    );
  };

  // Seleção e deseleção em massa
  const handleSelectAllImport = (select) => {
    setImportPreviewData((prev) => (prev ? prev.map((i) => ({ ...i, selected: select })) : prev));
  };

  const handleDeselectDuplicates = () => {
    setImportPreviewData((prev) =>
      prev ? prev.map((i) => ({ ...i, selected: i.isDuplicate ? false : i.selected })) : prev
    );
  };

  const handleConfirmImport = () => {
    if (!importPreviewData || importPreviewData.length === 0) return;
    const toImport = importPreviewData.filter((i) => i.selected);
    if (toImport.length === 0) {
      alert('Nenhum lançamento selecionado para importação.');
      return;
    }

    const todayStr = new Date().toISOString().slice(0, 10);
    const targetCard = cards.find((c) => c.id === importSelectedCard);
    const newTxs = [];
    let futureInstallmentsCount = 0;

    toImport.forEach((item, idx) => {
      const purchaseIso = item.purchaseDate || item.date;
      let dueIso = item.dueDate || importMetadata?.dueDateIso;
      if (!dueIso && targetCard && targetCard.closingDay && targetCard.dueDay) {
        dueIso = calculateCardDueDate(purchaseIso, targetCard.closingDay, targetCard.dueDay);
      }
      if (!dueIso) dueIso = purchaseIso;

      const isFuture = dueIso >= todayStr;
      const defaultStatus = isFuture ? 'COMPROMETIDO' : 'REALIZADO';
      const status = item.status || importDefaultStatus || defaultStatus;
      const installmentGroupId =
        item.installmentCount && item.installmentCount > 1
          ? `group-imp-${Date.now()}-${idx}-${Math.random().toString(36).slice(2, 6)}`
          : null;

      // 1. Parcela referente a esta fatura
      const currentTx = {
        id: `tx-imp-${Date.now()}-${idx}-${Math.random().toString(36).slice(2, 6)}`,
        description: item.description,
        amountCents: item.amountCents,
        type: 'EXPENSE',
        status,
        date: dueIso, // Vencimento contábil da fatura para conciliação e caixa
        dueDate: dueIso, // Vencimento explícito do cartão
        purchaseDate: purchaseIso, // Data em que a compra ocorreu fisicamente
        cardId: importSelectedCard,
        categoryId: item.categoryId || categories[0]?.id,
        scope: item.scope || 'FAMILY',
        ownerId: item.ownerId || (currentMemberId === 'user-all' ? 'user-1' : currentMemberId),
        installmentNumber: item.installmentNumber || null,
        installmentCount: item.installmentCount || null,
        installmentGroupId,
      };
      newTxs.push(currentTx);

      // 2. Geração automática das parcelas futuras restantes
      const instNum = item.installmentNumber ? parseInt(item.installmentNumber, 10) : null;
      const instTotal = item.installmentCount ? parseInt(item.installmentCount, 10) : null;
      if (instNum && instTotal && instNum < instTotal) {
        for (let nextK = instNum + 1; nextK <= instTotal; nextK++) {
          const monthOffset = nextK - instNum;
          const nextDueIso = addMonthsToIso(dueIso, monthOffset);

          // Ajustar descrição da parcela futura de forma legível
          let futureDesc = item.description;
          if (/parcela\s+\d+\s+de\s+\d+/i.test(futureDesc)) {
            futureDesc = futureDesc.replace(/parcela\s+\d+\s+de\s+\d+/i, `Parcela ${nextK} de ${instTotal}`);
          } else if (/\(\d+\/\d+\)/.test(futureDesc)) {
            futureDesc = futureDesc.replace(/\(\d+\/\d+\)/, `(${String(nextK).padStart(2, '0')}/${String(instTotal).padStart(2, '0')})`);
          } else {
            futureDesc = `${futureDesc} (${nextK}/${instTotal})`;
          }

          const futureTx = {
            id: `tx-imp-${Date.now()}-${idx}-p${nextK}-${Math.random().toString(36).slice(2, 6)}`,
            description: futureDesc,
            amountCents: item.amountCents,
            type: 'EXPENSE',
            status: 'COMPROMETIDO',
            date: nextDueIso,
            dueDate: nextDueIso,
            purchaseDate: purchaseIso,
            cardId: importSelectedCard,
            categoryId: item.categoryId || categories[0]?.id,
            scope: item.scope || 'FAMILY',
            ownerId: item.ownerId || (currentMemberId === 'user-all' ? 'user-1' : currentMemberId),
            installmentNumber: nextK,
            installmentCount: instTotal,
            installmentGroupId,
          };
          newTxs.push(futureTx);
          futureInstallmentsCount++;
        }
      }
    });

    setTransactions((prev) => {
      const updated = [...prev, ...newTxs];
      saveToLocalStorage('financas_transactions_v1', updated);
      return updated;
    });
    syncBatchTransactions(newTxs);

    const futureMsg = futureInstallmentsCount > 0 ? ` e ${futureInstallmentsCount} parcela(s) futura(s) agendada(s) automaticamente` : '';
    alert(`${toImport.length} lançamento(s) importado(s)${futureMsg} com sucesso!`);
    setImportPreviewData(null);
    setImportMetadata(null);
    setActiveTab('faturas');
  };

  // Manipulador de preset de intervalo de datas dos lançamentos
  const handleDatePresetChange = (preset) => {
    setFilterDatePreset(preset);
    const now = new Date();
    if (preset === 'ALL') {
      setFilterStartDate('');
      setFilterEndDate('');
    } else if (preset === 'THIS_MONTH') {
      const y = now.getFullYear();
      const m = now.getMonth();
      const start = new Date(y, m, 1).toISOString().slice(0, 10);
      const end = new Date(y, m + 1, 0).toISOString().slice(0, 10);
      setFilterStartDate(start);
      setFilterEndDate(end);
    } else if (preset === 'LAST_MONTH') {
      const y = now.getFullYear();
      const m = now.getMonth() - 1;
      const start = new Date(y, m, 1).toISOString().slice(0, 10);
      const end = new Date(y, m + 1, 0).toISOString().slice(0, 10);
      setFilterStartDate(start);
      setFilterEndDate(end);
    } else if (preset === 'NEXT_MONTH') {
      const y = now.getFullYear();
      const m = now.getMonth() + 1;
      const start = new Date(y, m, 1).toISOString().slice(0, 10);
      const end = new Date(y, m + 1, 0).toISOString().slice(0, 10);
      setFilterStartDate(start);
      setFilterEndDate(end);
    }
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setFilterType('ALL');
    setFilterStatus('ALL');
    setFilterSource('ALL');
    setFilterCategory('ALL');
    setFilterScope('ALL');
    setFilterDatePreset('ALL');
    setFilterStartDate('');
    setFilterEndDate('');
  };

  const isAnyFilterActive =
    Boolean(searchTerm.trim()) ||
    filterType !== 'ALL' ||
    filterStatus !== 'ALL' ||
    filterSource !== 'ALL' ||
    filterCategory !== 'ALL' ||
    filterScope !== 'ALL' ||
    filterDatePreset !== 'ALL' ||
    Boolean(filterStartDate) ||
    Boolean(filterEndDate);

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (searchTerm.trim()) count++;
    if (filterType !== 'ALL') count++;
    if (filterStatus !== 'ALL') count++;
    if (filterSource !== 'ALL') count++;
    if (filterCategory !== 'ALL') count++;
    if (filterScope !== 'ALL') count++;
    if (filterDatePreset !== 'ALL' || filterStartDate || filterEndDate) count++;
    return count;
  }, [searchTerm, filterType, filterStatus, filterSource, filterCategory, filterScope, filterDatePreset, filterStartDate, filterEndDate]);

  // Filtragem e Ordenação de Lançamentos na tabela (incluindo simulações hipotéticas ativas)
  const filteredTransactions = useMemo(() => {
    const todayDate = new Date().toISOString().slice(0, 10);
    const todayTime = new Date(todayDate + 'T12:00:00').getTime();

    const list = allDisplayTransactions.filter((t) => {
      const effectiveDate = getTxDueDate(t) || t.date || '';

      // Tratamento especial para Fatura Mestre (Consolidada)
      if (t.isInvoiceMaster) {
        // 1. Busca por texto livre (verifica a fatura e todos os itens aninhados nela)
        if (searchTerm.trim()) {
          const term = searchTerm.toLowerCase();
          const masterMatch = (t.description || '').toLowerCase().includes(term) || (t.card?.name || '').toLowerCase().includes(term);
          const hasItemMatch = t.items.some((item) => {
            const desc = (item.description || '').toLowerCase();
            const catName = categories.find((c) => c.id === item.categoryId)?.name?.toLowerCase() || '';
            const purchaseBR = item.purchaseDate ? formatDateBR(item.purchaseDate).toLowerCase() : '';
            return desc.includes(term) || catName.includes(term) || purchaseBR.includes(term);
          });
          if (!masterMatch && !hasItemMatch) return false;
        }

        // 2. Tipo (Fatura é saída/despesa contábil de caixa)
        if (filterType === 'INCOME') return false;

        // 3. Situação
        if (filterStatus === 'OVERDUE') {
          if (t.status !== 'EM ATRASO') return false;
        } else if (filterStatus !== 'ALL') {
          if (t.status !== filterStatus) return false;
        }

        // 4. Conta / Cartão
        if (filterSource === 'ACCOUNTS_ONLY') return false;
        if (filterSource.startsWith('card-')) {
          if (t.cardId !== filterSource.replace('card-', '')) return false;
        } else if (filterSource.startsWith('acc-')) {
          if (t.accountId !== filterSource.replace('acc-', '')) return false;
        }

        // 5. Categoria (fatura é exibida se contiver compras da categoria filtrada)
        if (filterCategory !== 'ALL') {
          const hasCatMatch = t.items.some((item) => item.categoryId === filterCategory);
          if (!hasCatMatch) return false;
        }

        // 6. Escopo
        if (filterScope !== 'ALL' && t.scope !== filterScope) {
          return false;
        }

        // 7. Intervalo de Datas
        if (filterStartDate && effectiveDate < filterStartDate) return false;
        if (filterEndDate && effectiveDate > filterEndDate) return false;

        return true;
      }

      // 1. Busca por texto livre (descrição, categorias, contas, cartões, datas)
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const catName = categories.find((c) => c.id === t.categoryId)?.name?.toLowerCase() || '';
        const accName = accounts.find((a) => a.id === t.accountId)?.name?.toLowerCase() || '';
        const cardName = cards.find((c) => c.id === t.cardId)?.name?.toLowerCase() || '';
        const desc = (t.description || '').toLowerCase();
        const dateBR = formatDateBR(effectiveDate).toLowerCase();
        const purchaseBR = t.purchaseDate ? formatDateBR(t.purchaseDate).toLowerCase() : '';

        const match =
          desc.includes(term) ||
          catName.includes(term) ||
          accName.includes(term) ||
          cardName.includes(term) ||
          effectiveDate.includes(term) ||
          dateBR.includes(term) ||
          purchaseBR.includes(term);

        if (!match) return false;
      }

      // 2. Tipo (Receita / Despesa)
      if (filterType !== 'ALL' && t.type !== filterType) {
        return false;
      }

      // 3. Situação
      if (filterStatus === 'OVERDUE') {
        if (!isTxOverdue(t, todayDate)) return false;
      } else if (filterStatus !== 'ALL') {
        if (t.status !== filterStatus) return false;
      }

      // 4. Conta / Cartão
      if (filterSource === 'ACCOUNTS_ONLY') {
        if (!t.accountId || t.cardId) return false;
      } else if (filterSource === 'CARDS_ONLY') {
        if (!t.cardId) return false;
      } else if (filterSource.startsWith('acc-')) {
        const targetAccId = filterSource.replace('acc-', '');
        if (t.accountId !== targetAccId) return false;
      } else if (filterSource.startsWith('card-')) {
        const targetCardId = filterSource.replace('card-', '');
        if (t.cardId !== targetCardId) return false;
      }

      // 5. Categoria
      if (filterCategory !== 'ALL' && t.categoryId !== filterCategory) {
        return false;
      }

      // 6. Escopo (Familiar / Pessoal)
      if (filterScope !== 'ALL' && t.scope !== filterScope) {
        return false;
      }

      // 7. Filtro por Data Inicial / Final
      if (filterStartDate && effectiveDate < filterStartDate) {
        return false;
      }
      if (filterEndDate && effectiveDate > filterEndDate) {
        return false;
      }

      return true;
    });

    return list.sort((a, b) => {
      if (txSort.field === 'date') {
        const getSortDate = (t) => getTxDueDate(t) || t.date;
        const dateA = getSortDate(a);
        const dateB = getSortDate(b);
        if (txSort.direction === 'closest') {
          // Ordenação padrão: data mais próxima da data atual
          const diffA = Math.abs(new Date(dateA + 'T12:00:00').getTime() - todayTime);
          const diffB = Math.abs(new Date(dateB + 'T12:00:00').getTime() - todayTime);
          if (diffA !== diffB) return diffA - diffB;
          // Em caso de mesmo distanciamento, data futura tem precedência
          return new Date(dateA + 'T12:00:00') - new Date(dateB + 'T12:00:00');
        }
        if (txSort.direction === 'asc') {
          return new Date(dateA + 'T12:00:00') - new Date(dateB + 'T12:00:00');
        }
        return new Date(dateB + 'T12:00:00') - new Date(dateA + 'T12:00:00');
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
  }, [
    allDisplayTransactions,
    searchTerm,
    filterType,
    filterStatus,
    filterSource,
    filterCategory,
    filterScope,
    filterStartDate,
    filterEndDate,
    txSort,
    categories,
    accounts,
    cards,
    getTxDueDate,
    isTxOverdue,
  ]);

  // Totais consolidados dos lançamentos filtrados para o mini-resumo
  const filteredTotals = useMemo(() => {
    let incomeCents = 0;
    let expenseCents = 0;
    filteredTransactions.forEach((tx) => {
      if (tx.status === 'CANCELADO') return;
      if (tx.type === 'INCOME') {
        incomeCents += tx.amountCents;
      } else if (tx.type === 'EXPENSE') {
        expenseCents += tx.amountCents;
      }
    });
    return {
      incomeCents,
      expenseCents,
      netCents: incomeCents - expenseCents,
      count: filteredTransactions.length,
    };
  }, [filteredTransactions]);

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
            { id: 'import', label: 'Importar Fatura / Extrato', icon: UploadCloud },
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

            {/* Alerta de Contas em Atraso */}
            {overdueTransactions.length > 0 && (
              <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center text-rose-600 shrink-0">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-rose-900">
                      Atenção: {overdueTransactions.length} {overdueTransactions.length === 1 ? 'conta em atraso' : 'contas em atraso'}
                    </h4>
                    <p className="text-xs text-rose-700 mt-0.5">
                      Total pendente de <span className="font-bold">{formatMoney(overdueExpensesTotalCents)}</span> com vencimento anterior à data de hoje.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setFilterStatus('OVERDUE');
                    setActiveTab('transactions');
                  }}
                  className="bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs px-4 py-2 rounded-xl transition whitespace-nowrap shadow-xs flex items-center space-x-1.5 self-end sm:self-auto"
                >
                  <span>Ver contas em atraso</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* 5 Cards de Métricas Principais (Identidade Visual da Família com Saldo Consolidado e Detalhamento) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
              {/* Card 1: Saldo Consolidado Projetado */}
              <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white p-5 rounded-2xl shadow-sm flex flex-col justify-between border border-slate-700">
                <div className="flex items-center justify-between text-slate-300 mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-blue-300">Saldo Consolidado</span>
                  <Sparkles className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <div className={`text-2xl font-black ${monthSummary.projectedEndBalance >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {formatMoney(monthSummary.projectedEndBalance)}
                  </div>
                  <div className="text-[11px] text-slate-300 mt-1 leading-tight">
                    Projetado fim de {formatMonthLabel(dashboardMonth)}
                  </div>
                </div>
                <div className="mt-3 pt-2 border-t border-slate-700/60 text-[10px] text-slate-300 space-y-0.5">
                  <div className="flex justify-between">
                    <span>Em conta:</span>
                    <span className="font-semibold text-white">{formatMoney(monthSummary.totalBankBalance)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-emerald-300">+ A receber:</span>
                    <span className="font-semibold text-emerald-300">+{formatMoney(monthSummary.incomePending)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-rose-300">- A pagar:</span>
                    <span className="font-semibold text-rose-300">-{formatMoney(monthSummary.expensePending)}</span>
                  </div>
                  {monthSummary.envelopesCommitted > 0 && (
                    <div className="flex justify-between pt-1 border-t border-slate-700/40 text-amber-300 font-medium">
                      <span>- Envelopes (reserva):</span>
                      <span>-{formatMoney(monthSummary.envelopesCommitted)}</span>
                    </div>
                  )}
                  {monthSummary.envelopesCommitted > 0 && (
                    <div className="flex justify-between text-blue-200 font-bold">
                      <span>= Saldo Livre Real:</span>
                      <span>{formatMoney(monthSummary.freeProjectedBalance)}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Card 2: Saldo em Contas */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between text-slate-400 mb-2">
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Saldo em Contas</span>
                    <Wallet className="w-5 h-5 text-blue-500" />
                  </div>
                  <div className="text-2xl font-bold text-slate-900">{formatMoney(monthSummary.totalBankBalance)}</div>
                  <div className="text-xs text-slate-400 mt-1">Soma atual de todas as contas</div>
                </div>
                <div className="mt-3 pt-2 border-t border-slate-100 text-[11px] text-slate-500">
                  Disponível agora nos bancos
                </div>
              </div>

              {/* Card 3: Receitas Mês */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between text-slate-400 mb-2">
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Receitas Mês</span>
                    <ArrowUpRight className="w-5 h-5 text-emerald-500" />
                  </div>
                  <div className="text-2xl font-bold text-emerald-600">{formatMoney(monthSummary.incomeTotal)}</div>
                  <div className="text-xs text-slate-400 mt-1">Total do mês</div>
                </div>
                <div className="mt-3 pt-2 border-t border-slate-100 flex flex-col space-y-0.5 text-[11px]">
                  <div className="flex justify-between text-emerald-700 font-medium">
                    <span>✓ Já Recebido:</span>
                    <span>{formatMoney(monthSummary.incomeRealized)}</span>
                  </div>
                  <div className="flex justify-between text-amber-700 font-medium">
                    <span>⏳ A Receber:</span>
                    <span>{formatMoney(monthSummary.incomePending)}</span>
                  </div>
                </div>
              </div>

              {/* Card 4: Despesas Mês */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between text-slate-400 mb-2">
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Despesas Mês</span>
                    <ArrowDownRight className="w-5 h-5 text-rose-500" />
                  </div>
                  <div className="text-2xl font-bold text-rose-600">{formatMoney(monthSummary.expenseTotal)}</div>
                  <div className="text-xs text-slate-400 mt-1">Contas e faturas de cartão</div>
                </div>
                <div className="mt-3 pt-2 border-t border-slate-100 flex flex-col space-y-0.5 text-[11px]">
                  <div className="flex justify-between text-slate-600 font-medium">
                    <span>✓ Já Pago:</span>
                    <span className="text-slate-900">{formatMoney(monthSummary.expenseRealized)}</span>
                  </div>
                  <div className="flex justify-between text-rose-700 font-medium">
                    <span>⏳ A Pagar:</span>
                    <span>{formatMoney(monthSummary.expensePending)}</span>
                  </div>
                </div>
              </div>

              {/* Card 5: Limite Cartões */}
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

            {/* Grid de Widgets do Dashboard: Gráficos por Categoria & Envelopes de Orçamento */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Widget 1: Maiores Gastos por Categoria */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                        <PieChart className="w-4 h-4 text-blue-600" />
                        <span>Maiores Gastos por Categoria ({formatMonthLabel(dashboardMonth)})</span>
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">Onde o orçamento deste mês está concentrado</p>
                    </div>
                    <button onClick={() => setActiveTab('charts')} className="text-xs font-semibold text-blue-600 hover:underline">
                      Ver Análise
                    </button>
                  </div>

                  {dashboardCategoryChartData.expensesList.length === 0 ? (
                    <p className="text-xs text-slate-400 py-6 text-center">Nenhuma despesa para exibir no mês de {formatMonthLabel(dashboardMonth)}.</p>
                  ) : (
                    <div className="space-y-3">
                      {dashboardCategoryChartData.expensesList.slice(0, 4).map((item) => (
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
              </div>

              {/* Widget 2: Envelopes de Gastos (Método dos Envelopes) */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                        <Mail className="w-4 h-4 text-blue-600" />
                        <span>Envelopes & Metas de Gastos ({formatMonthLabel(dashboardMonth)})</span>
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">Acompanhe o consumo dos valores destinados por categoria</p>
                    </div>
                    <button onClick={() => setActiveTab('projections')} className="text-xs font-semibold text-blue-600 hover:underline">
                      Ver Todos
                    </button>
                  </div>

                  {!dashboardEnvelopes.hasEnvelopes ? (
                    <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-xl text-center space-y-2">
                      <p className="text-xs text-slate-600">
                        Você ainda não ativou o método dos envelopes. Destine um teto mensal (ex: R$ 800 para Combustível) para controlar os gastos do dia a dia com tranquilidade.
                      </p>
                      <button
                        type="button"
                        onClick={() => setActiveTab('categories')}
                        className="inline-flex items-center space-x-1.5 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-3 py-1.5 rounded-lg transition"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Definir Teto nas Categorias</span>
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {/* Faixa resumo */}
                      <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 bg-slate-50 border border-slate-100 rounded-xl text-[11px]">
                        <div>
                          <span className="text-slate-500">Destinado:</span>{' '}
                          <strong className="text-slate-900">{formatMoney(dashboardEnvelopes.totalAllocatedCents)}</strong>
                        </div>
                        <div>
                          <span className="text-slate-500">Gasto:</span>{' '}
                          <strong className="text-slate-900">{formatMoney(dashboardEnvelopes.totalSpentCents)}</strong>
                        </div>
                        <div>
                          <span className="text-slate-500">Disponível:</span>{' '}
                          <strong className="text-emerald-700 font-bold">{formatMoney(dashboardEnvelopes.totalResidualCommittedCents)}</strong>
                        </div>
                        {dashboardEnvelopes.totalOverspentCents > 0 && (
                          <div>
                            <span className="text-rose-600 font-bold">🚨 Estouro:</span>{' '}
                            <strong className="text-rose-700 font-bold">+{formatMoney(dashboardEnvelopes.totalOverspentCents)}</strong>
                          </div>
                        )}
                      </div>

                      {/* Lista resumida de até 3 envelopes */}
                      <div className="space-y-3 pt-1">
                        {dashboardEnvelopes.envelopes.slice(0, 3).map((env) => {
                          const cat = env.category;
                          const barColor = env.isOver ? '#ef4444' : env.percentage >= 80 ? '#f59e0b' : '#10b981';
                          return (
                            <div key={cat.id} className="space-y-1">
                              <div className="flex justify-between items-center text-xs font-semibold">
                                <span className="text-slate-800 flex items-center space-x-1.5">
                                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                                  <span>{cat.name}</span>
                                </span>
                                <div className="flex items-center space-x-2">
                                  <span className="text-slate-500 font-medium">
                                    {formatMoney(env.spentCents)} de {formatMoney(env.allocatedCents)}
                                  </span>
                                  {env.isOver ? (
                                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200">
                                      + {formatMoney(env.overspentCents)}
                                    </span>
                                  ) : (
                                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                                      {formatMoney(env.remainingCents)} livres
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                                <div
                                  className="h-full rounded-full transition-all duration-300"
                                  style={{
                                    width: `${Math.min(100, env.percentage)}%`,
                                    backgroundColor: barColor,
                                  }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {dashboardEnvelopes.envelopes.length > 3 && (
                        <div className="text-center pt-1">
                          <button
                            type="button"
                            onClick={() => setActiveTab('projections')}
                            className="text-[11px] font-bold text-blue-600 hover:underline"
                          >
                            + {dashboardEnvelopes.envelopes.length - 3} outros envelopes em Planejamento & Projeções &gt;
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
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
                    upcomingCommitments.map((tx) => {
                      const isOverdue = isTxOverdue(tx);
                      const effectiveDue = getTxDueDate(tx);
                      return (
                        <div
                          key={tx.id}
                          className={`py-3 flex items-center justify-between transition-colors ${
                            isOverdue ? 'bg-rose-50/70 -mx-3 px-3 rounded-xl border border-rose-200/60 my-1' : ''
                          }`}
                        >
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
                              {isOverdue && (
                                <span className="text-[9px] px-1.5 py-0.5 rounded font-bold uppercase bg-rose-100 text-rose-700 border border-rose-200 flex items-center space-x-1">
                                  <AlertTriangle className="w-2.5 h-2.5 text-rose-600" />
                                  <span>Em Atraso</span>
                                </span>
                              )}
                            </div>
                            <div className="flex items-center space-x-2 text-xs text-slate-400 mt-0.5">
                              <span className={isOverdue ? 'text-rose-600 font-semibold' : ''}>{formatDateBR(effectiveDue)}</span>
                              {tx.purchaseDate && tx.cardId && tx.purchaseDate !== effectiveDue && (
                                <span className="text-[10px] text-slate-400 font-normal">(Compra: {formatDateBR(tx.purchaseDate)})</span>
                              )}
                              <span>•</span>
                              <span
                                className={`font-semibold ${
                                  tx.status === 'REALIZADO'
                                    ? 'text-emerald-600'
                                    : isOverdue
                                    ? 'text-rose-600'
                                    : 'text-blue-600'
                                }`}
                              >
                                ● {isOverdue ? 'EM ATRASO' : tx.status}
                              </span>
                            </div>
                          </div>
                          <div className={`font-bold text-sm ${tx.type === 'INCOME' ? 'text-emerald-600' : isOverdue ? 'text-rose-600' : 'text-slate-900'}`}>
                            {tx.type === 'INCOME' ? '+' : '-'} {formatMoney(tx.amountCents)}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Status dos Cartões de Crédito (Sincronizado com o Mês do Dashboard) */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                      <CreditCard className="w-4 h-4 text-purple-600" />
                      <span>Faturas & Limites dos Cartões</span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Faturas sincronizadas com {formatMonthLabel(dashboardMonth)}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setInvoiceSelectedMonth(dashboardMonth);
                      setActiveTab('faturas');
                    }}
                    className="text-xs font-semibold text-purple-600 hover:underline flex items-center space-x-1"
                  >
                    <span>Ver todas as faturas</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="space-y-4">
                  {cards.map((card) => {
                    const stats = cardStats[card.id] || {
                      committedCents: 0,
                      availableCents: card.limitCents,
                      invoiceTotalCents: 0,
                      invoiceStatus: 'ABERTA',
                      isPaid: false,
                    };
                    const pct = Math.min(100, Math.round((stats.committedCents / card.limitCents) * 100));
                    return (
                      <div key={card.id} className="p-4 rounded-xl border border-slate-100 bg-slate-50 space-y-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center space-x-2">
                            <span className="font-bold text-sm text-slate-900">{card.name}</span>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                                stats.invoiceStatus === 'PAGA'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : stats.invoiceStatus === 'EM ATRASO'
                                  ? 'bg-rose-100 text-rose-800'
                                  : stats.invoiceStatus === 'FECHADA'
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-blue-100 text-blue-800'
                              }`}
                            >
                              Fatura {stats.invoiceStatus}
                            </span>
                          </div>
                          <div className="text-xs text-slate-500 flex items-center space-x-2">
                            <span>Vence dia {card.dueDay}</span>
                            <span>•</span>
                            <span>Fecha dia {card.closingDay}</span>
                          </div>
                        </div>

                        {/* Valor da fatura no mês selecionado e botão de ação */}
                        <div className="p-3 bg-white rounded-lg border border-slate-200 flex flex-wrap items-center justify-between gap-2">
                          <div>
                            <span className="text-xs text-slate-500 block">
                              Fatura de {formatMonthLabel(dashboardMonth)}:
                            </span>
                            <span className="text-lg font-bold text-slate-900">
                              {formatMoney(stats.invoiceTotalCents || 0)}
                            </span>
                            {stats.isPaid && (
                              <span className="text-xs text-emerald-600 font-semibold block flex items-center space-x-1 mt-0.5">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Quitada</span>
                              </span>
                            )}
                          </div>
                          <div className="flex items-center space-x-2">
                            {!stats.isPaid && (stats.invoiceTotalCents || 0) > 0 && (
                              <button
                                type="button"
                                onClick={() => openInvoicePaymentModal(card, dashboardMonth)}
                                className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-purple-600 hover:bg-purple-700 text-white flex items-center space-x-1.5 shadow-xs transition active:scale-95"
                              >
                                <CreditCard className="w-3.5 h-3.5" />
                                <span>Pagar Fatura</span>
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => {
                                setInvoiceSelectedMonth(dashboardMonth);
                                setActiveTab('faturas');
                              }}
                              className="px-2.5 py-1.5 text-xs font-medium rounded-lg text-slate-600 hover:text-purple-600 hover:bg-purple-50 transition"
                            >
                              Detalhar
                            </button>
                          </div>
                        </div>

                        {/* Barra de Limite Global */}
                        <div className="space-y-1">
                          <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                            <div
                              className={`h-full ${pct > 75 ? 'bg-rose-500' : 'bg-blue-600'}`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <div className="flex justify-between text-xs text-slate-500">
                            <span>Comprometido Total: {formatMoney(stats.committedCents)} ({pct}%)</span>
                            <span className="font-semibold text-slate-800">Disponível: {formatMoney(stats.availableCents)}</span>
                          </div>
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
            {/* Barra de Ferramentas Superior: Busca, Período, Filtros e Ações */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
              <div className="flex flex-col md:flex-row gap-2.5 items-stretch md:items-center justify-between">
                {/* Campo de Busca Rápida */}
                <div className="relative flex-1 min-w-[240px]">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Buscar lançamentos, compras, faturas..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-9 py-2 bg-slate-50/70 hover:bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-all placeholder:text-slate-400"
                  />
                  {searchTerm && (
                    <button
                      type="button"
                      onClick={() => setSearchTerm('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 rounded-md hover:bg-slate-100 transition"
                      title="Limpar busca"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Controles de Período, Filtros e Botões */}
                <div className="flex flex-wrap items-center gap-2">
                  {/* Seletor de Período */}
                  <div className="flex items-center space-x-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 shadow-2xs">
                    <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                    <select
                      value={filterDatePreset}
                      onChange={(e) => handleDatePresetChange(e.target.value)}
                      className="bg-transparent text-xs sm:text-sm font-medium text-slate-700 focus:outline-none cursor-pointer pr-1"
                    >
                      <option value="ALL">Todo o Período</option>
                      <option value="THIS_MONTH">Este Mês</option>
                      <option value="LAST_MONTH">Mês Passado</option>
                      <option value="NEXT_MONTH">Próximo Mês</option>
                      <option value="CUSTOM">Personalizado</option>
                    </select>
                  </div>

                  {/* Campos de Data De/Até (quando CUSTOM ou datas preenchidas) */}
                  {(filterDatePreset === 'CUSTOM' || filterStartDate || filterEndDate) && (
                    <div className="flex items-center space-x-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1 text-xs text-slate-600">
                      <span className="text-slate-400">De:</span>
                      <input
                        type="date"
                        value={filterStartDate}
                        onChange={(e) => {
                          setFilterDatePreset('CUSTOM');
                          setFilterStartDate(e.target.value);
                        }}
                        className="bg-transparent text-xs text-slate-700 focus:outline-none"
                      />
                      <span className="text-slate-400">Até:</span>
                      <input
                        type="date"
                        value={filterEndDate}
                        onChange={(e) => {
                          setFilterDatePreset('CUSTOM');
                          setFilterEndDate(e.target.value);
                        }}
                        className="bg-transparent text-xs text-slate-700 focus:outline-none"
                      />
                    </div>
                  )}

                  {/* Botão de Gaveta de Filtros */}
                  <button
                    type="button"
                    onClick={() => setShowFilterDrawer((prev) => !prev)}
                    className={`flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-medium border transition active:scale-95 shadow-2xs ${
                      showFilterDrawer || activeFiltersCount > 0
                        ? 'bg-blue-50 border-blue-300 text-blue-700 font-semibold'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                    title="Abrir filtros avançados"
                  >
                    <Filter className="w-3.5 h-3.5" />
                    <span>Filtros</span>
                    {activeFiltersCount > 0 && (
                      <span className="bg-blue-600 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full min-w-[18px] text-center">
                        {activeFiltersCount}
                      </span>
                    )}
                  </button>

                  {/* Botão Expandir / Recolher Faturas */}
                  {cardInvoiceMasters.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        const allMasters = filteredTransactions.filter((t) => t.isInvoiceMaster);
                        const anyExpanded = allMasters.some((m) => expandedInvoices[m.id]);
                        const nextState = {};
                        allMasters.forEach((m) => {
                          nextState[m.id] = !anyExpanded;
                        });
                        setExpandedInvoices(nextState);
                      }}
                      className="text-xs text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 px-3 py-2 rounded-xl font-medium flex items-center space-x-1.5 transition active:scale-95 shadow-2xs"
                      title="Expandir ou recolher as compras de todas as faturas exibidas"
                    >
                      <CreditCard className="w-3.5 h-3.5 text-purple-600" />
                      <span className="hidden sm:inline">
                        {Object.values(expandedInvoices).some(Boolean) ? 'Recolher Faturas' : 'Expandir Faturas'}
                      </span>
                      <span className="sm:hidden">Faturas</span>
                    </button>
                  )}

                  {/* Limpar Exemplos (se houver demos) */}
                  {transactions.some((t) => String(t.id || '').startsWith('demo-')) && (
                    <button
                      type="button"
                      onClick={handleClearOnlyDemo}
                      className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 px-2.5 py-2 rounded-xl text-xs font-medium flex items-center space-x-1 transition"
                      title="Excluir apenas lançamentos fictícios de exemplo"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Limpar Exemplos</span>
                    </button>
                  )}

                  {/* Botão Novo Lançamento (CTA Principal) */}
                  <button
                    type="button"
                    onClick={() => openTransactionModal('create')}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold flex items-center space-x-1.5 shadow-sm transition active:scale-95"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Novo Lançamento</span>
                  </button>
                </div>
              </div>

              {/* Chips Rápidos de Filtro */}
              <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-100">
                <span className="text-[11px] font-semibold text-slate-400 mr-1 hidden sm:inline">
                  Atalhos:
                </span>

                <button
                  type="button"
                  onClick={() => {
                    setFilterType('ALL');
                    setFilterStatus('ALL');
                    setFilterSource('ALL');
                  }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition ${
                    filterType === 'ALL' && filterStatus === 'ALL' && filterSource === 'ALL'
                      ? 'bg-slate-800 text-white font-semibold shadow-xs'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                  }`}
                >
                  Todos
                </button>

                <button
                  type="button"
                  onClick={() => setFilterType(filterType === 'EXPENSE' ? 'ALL' : 'EXPENSE')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition ${
                    filterType === 'EXPENSE'
                      ? 'bg-rose-100 text-rose-800 border border-rose-300 font-semibold'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                  }`}
                >
                  💸 Despesas
                </button>

                <button
                  type="button"
                  onClick={() => setFilterType(filterType === 'INCOME' ? 'ALL' : 'INCOME')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition ${
                    filterType === 'INCOME'
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 font-semibold'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                  }`}
                >
                  💰 Receitas
                </button>

                <button
                  type="button"
                  onClick={() => setFilterStatus(filterStatus === 'OVERDUE' ? 'ALL' : 'OVERDUE')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium flex items-center space-x-1 transition ${
                    filterStatus === 'OVERDUE'
                      ? 'bg-rose-600 text-white font-semibold'
                      : overdueTransactions.length > 0
                      ? 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                  }`}
                >
                  <span>🚨 Em Atraso</span>
                  {overdueTransactions.length > 0 && (
                    <span className="text-[10px] bg-rose-200 text-rose-900 font-bold px-1.5 py-0.2 rounded-full">
                      {overdueTransactions.length}
                    </span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setFilterSource(filterSource === 'CARDS_ONLY' ? 'ALL' : 'CARDS_ONLY')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition ${
                    filterSource === 'CARDS_ONLY'
                      ? 'bg-purple-100 text-purple-800 border border-purple-300 font-semibold'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                  }`}
                >
                  💳 Cartões
                </button>

                <button
                  type="button"
                  onClick={() => setFilterSource(filterSource === 'ACCOUNTS_ONLY' ? 'ALL' : 'ACCOUNTS_ONLY')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition ${
                    filterSource === 'ACCOUNTS_ONLY'
                      ? 'bg-blue-100 text-blue-800 border border-blue-300 font-semibold'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                  }`}
                >
                  🏦 Contas
                </button>

                {isAnyFilterActive && (
                  <button
                    type="button"
                    onClick={handleResetFilters}
                    className="ml-auto text-xs text-rose-600 hover:text-rose-800 font-semibold flex items-center space-x-1 transition py-1"
                    title="Limpar todos os filtros aplicados"
                  >
                    <X className="w-3 h-3" />
                    <span>Limpar Filtros</span>
                  </button>
                )}
              </div>

              {/* Gaveta de Filtros Detalhados (Expansível) */}
              {showFilterDrawer && (
                <div className="pt-3 border-t border-slate-100">
                  <div className="p-3.5 bg-slate-50/80 rounded-xl border border-slate-200/80 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                        Filtros Específicos
                      </span>
                      {isAnyFilterActive && (
                        <button
                          type="button"
                          onClick={handleResetFilters}
                          className="text-xs text-rose-600 hover:underline font-medium"
                        >
                          Resetar Filtros
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                      {/* Conta / Cartão */}
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                          Conta / Cartão
                        </label>
                        <select
                          value={filterSource}
                          onChange={(e) => setFilterSource(e.target.value)}
                          className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs bg-white text-slate-700 focus:ring-2 focus:ring-blue-500 focus:outline-none truncate"
                        >
                          <option value="ALL">Todas as Contas & Cartões</option>
                          <option value="ACCOUNTS_ONLY">🏦 Apenas Contas</option>
                          <option value="CARDS_ONLY">💳 Apenas Cartões</option>
                          <optgroup label="Contas Bancárias">
                            {accounts.map((a) => (
                              <option key={a.id} value={`acc-${a.id}`}>
                                Conta: {a.name}
                              </option>
                            ))}
                          </optgroup>
                          <optgroup label="Cartões de Crédito">
                            {cards.map((c) => (
                              <option key={c.id} value={`card-${c.id}`}>
                                Cartão: {c.name}
                              </option>
                            ))}
                          </optgroup>
                        </select>
                      </div>

                      {/* Situação */}
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                          Situação
                        </label>
                        <select
                          value={filterStatus}
                          onChange={(e) => setFilterStatus(e.target.value)}
                          className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs bg-white text-slate-700 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        >
                          <option value="ALL">Todas as Situações</option>
                          <option value="OVERDUE">🚨 Em Atraso ({overdueTransactions.length})</option>
                          <option value="REALIZADO">✅ Realizado</option>
                          <option value="COMPROMETIDO">⏳ Comprometido</option>
                          <option value="PREVISTO">📅 Previsto</option>
                          <option value="HIPOTETICO">✨ Hipotético</option>
                          <option value="CANCELADO">🚫 Cancelado</option>
                        </select>
                      </div>

                      {/* Categoria */}
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                          Categoria
                        </label>
                        <select
                          value={filterCategory}
                          onChange={(e) => setFilterCategory(e.target.value)}
                          className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs bg-white text-slate-700 focus:ring-2 focus:ring-blue-500 focus:outline-none truncate"
                        >
                          <option value="ALL">Todas as Categorias</option>
                          {categories.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Escopo */}
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                          Escopo
                        </label>
                        <select
                          value={filterScope}
                          onChange={(e) => setFilterScope(e.target.value)}
                          className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs bg-white text-slate-700 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        >
                          <option value="ALL">Todos os Escopos</option>
                          <option value="FAMILY">Familiar</option>
                          <option value="PERSONAL">Pessoal / Individual</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Mini Faixa de Resumo Financeiro da Seleção Atual */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 px-4 py-2.5 bg-white rounded-xl border border-slate-200/80 text-xs shadow-2xs">
              <div className="flex items-center space-x-2 text-slate-600">
                <span className="font-semibold text-slate-800">
                  {filteredTotals.count} {filteredTotals.count === 1 ? 'lançamento' : 'lançamentos'}
                </span>
                {allDisplayTransactions.length !== filteredTotals.count && (
                  <span className="text-slate-400 text-[11px]">
                    (de {allDisplayTransactions.length})
                  </span>
                )}
                {isAnyFilterActive && (
                  <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                    Filtros aplicados
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center space-x-1 text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-md">
                  <span className="text-[11px] font-normal text-emerald-600">Entradas:</span>
                  <span>+{formatMoney(filteredTotals.incomeCents)}</span>
                </div>
                <div className="flex items-center space-x-1 text-rose-700 font-semibold bg-rose-50 px-2 py-0.5 rounded-md">
                  <span className="text-[11px] font-normal text-rose-600">Saídas:</span>
                  <span>-{formatMoney(filteredTotals.expenseCents)}</span>
                </div>
                <div className="flex items-center space-x-1 text-slate-800 font-bold bg-slate-100 px-2 py-0.5 rounded-md">
                  <span className="text-[11px] font-normal text-slate-500">Saldo:</span>
                  <span className={filteredTotals.netCents >= 0 ? 'text-emerald-700' : 'text-rose-700'}>
                    {formatMoney(filteredTotals.netCents)}
                  </span>
                </div>
              </div>
            </div>

            {/* Tabela de Lançamentos Desentulhada (7 Colunas) */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="bg-slate-50/80 text-slate-600 font-semibold border-b border-slate-200 text-xs">
                      {/* 1. Data */}
                      <th
                        onClick={() => handleSortTransactions('date')}
                        className="py-3 px-4 cursor-pointer hover:bg-slate-100 transition select-none group whitespace-nowrap"
                        title="Ordenar por data"
                      >
                        <div className="flex items-center space-x-1">
                          <span>Data</span>
                          {txSort.field === 'date' ? (
                            txSort.direction === 'closest' ? (
                              <span className="text-[9px] bg-blue-100 text-blue-800 font-bold px-1.5 py-0.5 rounded">
                                Próxima
                              </span>
                            ) : txSort.direction === 'asc' ? (
                              <ArrowUp className="w-3.5 h-3.5 text-blue-600" />
                            ) : (
                              <ArrowDown className="w-3.5 h-3.5 text-blue-600" />
                            )
                          ) : (
                            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 opacity-40 group-hover:opacity-100 transition" />
                          )}
                        </div>
                      </th>

                      {/* 2. Descrição */}
                      <th
                        onClick={() => handleSortTransactions('description')}
                        className="py-3 px-4 cursor-pointer hover:bg-slate-100 transition select-none group"
                        title="Ordenar por descrição"
                      >
                        <div className="flex items-center space-x-1">
                          <span>Descrição</span>
                          {txSort.field === 'description' ? (
                            txSort.direction === 'asc' ? (
                              <ArrowUp className="w-3.5 h-3.5 text-blue-600" />
                            ) : (
                              <ArrowDown className="w-3.5 h-3.5 text-blue-600" />
                            )
                          ) : (
                            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 opacity-40 group-hover:opacity-100 transition" />
                          )}
                        </div>
                      </th>

                      {/* 3. Categoria */}
                      <th
                        onClick={() => handleSortTransactions('category')}
                        className="py-3 px-4 cursor-pointer hover:bg-slate-100 transition select-none group"
                        title="Ordenar por categoria"
                      >
                        <div className="flex items-center space-x-1">
                          <span>Categoria</span>
                          {txSort.field === 'category' ? (
                            txSort.direction === 'asc' ? (
                              <ArrowUp className="w-3.5 h-3.5 text-blue-600" />
                            ) : (
                              <ArrowDown className="w-3.5 h-3.5 text-blue-600" />
                            )
                          ) : (
                            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 opacity-40 group-hover:opacity-100 transition" />
                          )}
                        </div>
                      </th>

                      {/* 4. Conta / Cartão */}
                      <th
                        onClick={() => handleSortTransactions('source')}
                        className="py-3 px-4 cursor-pointer hover:bg-slate-100 transition select-none group whitespace-nowrap"
                        title="Ordenar por conta ou cartão"
                      >
                        <div className="flex items-center space-x-1">
                          <span>Conta / Cartão</span>
                          {txSort.field === 'source' ? (
                            txSort.direction === 'asc' ? (
                              <ArrowUp className="w-3.5 h-3.5 text-blue-600" />
                            ) : (
                              <ArrowDown className="w-3.5 h-3.5 text-blue-600" />
                            )
                          ) : (
                            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 opacity-40 group-hover:opacity-100 transition" />
                          )}
                        </div>
                      </th>

                      {/* 5. Situação */}
                      <th
                        onClick={() => handleSortTransactions('status')}
                        className="py-3 px-4 cursor-pointer hover:bg-slate-100 transition select-none group"
                        title="Ordenar por situação"
                      >
                        <div className="flex items-center space-x-1">
                          <span>Situação</span>
                          {txSort.field === 'status' ? (
                            txSort.direction === 'asc' ? (
                              <ArrowUp className="w-3.5 h-3.5 text-blue-600" />
                            ) : (
                              <ArrowDown className="w-3.5 h-3.5 text-blue-600" />
                            )
                          ) : (
                            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 opacity-40 group-hover:opacity-100 transition" />
                          )}
                        </div>
                      </th>

                      {/* 6. Valor */}
                      <th
                        onClick={() => handleSortTransactions('amount')}
                        className="py-3 px-4 cursor-pointer hover:bg-slate-100 transition select-none group text-right whitespace-nowrap"
                        title="Ordenar por valor"
                      >
                        <div className="flex items-center justify-end space-x-1">
                          <span>Valor</span>
                          {txSort.field === 'amount' ? (
                            txSort.direction === 'asc' ? (
                              <ArrowUp className="w-3.5 h-3.5 text-blue-600" />
                            ) : (
                              <ArrowDown className="w-3.5 h-3.5 text-blue-600" />
                            )
                          ) : (
                            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 opacity-40 group-hover:opacity-100 transition" />
                          )}
                        </div>
                      </th>

                      {/* 7. Ações */}
                      <th className="py-3 px-4 text-center text-xs">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredTransactions.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="text-center py-12 text-slate-400 space-y-2">
                          <p className="text-sm">Nenhum lançamento encontrado para os filtros selecionados.</p>
                          {isAnyFilterActive && (
                            <button
                              type="button"
                              onClick={handleResetFilters}
                              className="text-xs text-blue-600 hover:underline font-semibold"
                            >
                              Limpar todos os filtros
                            </button>
                          )}
                        </td>
                      </tr>
                    ) : (
                      filteredTransactions.map((tx) => {
                        if (tx.isInvoiceMaster) {
                          const isOverdue = tx.status === 'EM ATRASO';
                          const isExpanded = Boolean(expandedInvoices[tx.id]);

                          // Filtra os itens exibidos dentro da fatura respeitando os filtros ativos
                          const itemsToDisplay = tx.items.filter((item) => {
                            if (filterCategory !== 'ALL' && item.categoryId !== filterCategory) return false;
                            if (searchTerm.trim()) {
                              const term = searchTerm.toLowerCase();
                              const desc = (item.description || '').toLowerCase();
                              const catName = categories.find((c) => c.id === item.categoryId)?.name?.toLowerCase() || '';
                              const purchaseBR = item.purchaseDate ? formatDateBR(item.purchaseDate).toLowerCase() : '';
                              const matchesItem = desc.includes(term) || catName.includes(term) || purchaseBR.includes(term);
                              const matchesMaster = (tx.description || '').toLowerCase().includes(term) || (tx.card?.name || '').toLowerCase().includes(term);
                              return matchesItem || matchesMaster;
                            }
                            return true;
                          });

                          return (
                            <React.Fragment key={tx.id}>
                              {/* Linha Mestre da Fatura Consolidada */}
                              <tr
                                className={`transition-colors border-l-4 ${
                                  tx.isPaid
                                    ? 'bg-emerald-50/30 hover:bg-emerald-50/50 border-emerald-500'
                                    : isOverdue
                                    ? 'bg-rose-50/50 hover:bg-rose-50/80 border-rose-500'
                                    : 'bg-purple-50/30 hover:bg-purple-50/60 border-purple-500'
                                }`}
                              >
                                {/* 1. Data */}
                                <td className="py-3 px-4 whitespace-nowrap">
                                  <div className="flex flex-col">
                                    <div className="flex items-center space-x-1.5">
                                      <CreditCard className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                                      <span className="font-bold text-slate-900">{formatDateBR(tx.dueDate)}</span>
                                    </div>
                                    <span className="text-[10px] text-purple-700 font-medium">
                                      Vencimento Fatura
                                    </span>
                                  </div>
                                </td>

                                {/* 2. Descrição com Chevron de Expansão */}
                                <td className="py-3 px-4 font-medium text-slate-900">
                                  <div className="flex items-center space-x-2">
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setExpandedInvoices((prev) => ({
                                          ...prev,
                                          [tx.id]: !prev[tx.id],
                                        }))
                                      }
                                      className="flex items-center space-x-1.5 text-left hover:text-purple-700 transition group focus:outline-none"
                                      title={isExpanded ? 'Recolher compras desta fatura' : 'Expandir e ver compras desta fatura'}
                                    >
                                      {isExpanded ? (
                                        <ChevronDown className="w-4 h-4 text-purple-600 shrink-0 group-hover:scale-110 transition" />
                                      ) : (
                                        <ChevronRight className="w-4 h-4 text-purple-600 shrink-0 group-hover:scale-110 transition" />
                                      )}
                                      <span className="font-bold text-slate-900 group-hover:text-purple-700 transition">
                                        {tx.description}
                                      </span>
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() =>
                                        setExpandedInvoices((prev) => ({
                                          ...prev,
                                          [tx.id]: !prev[tx.id],
                                        }))
                                      }
                                      className="text-[10px] bg-purple-100 hover:bg-purple-200 text-purple-800 font-semibold px-2 py-0.5 rounded-full transition"
                                      title="Clique para expandir/recolher"
                                    >
                                      {tx.items.length} {tx.items.length === 1 ? 'item' : 'itens'} {isExpanded ? '▲' : '▼'}
                                    </button>

                                    {tx.isPaid && (
                                      <span className="text-[10px] bg-emerald-100 text-emerald-800 font-semibold px-2 py-0.5 rounded-full flex items-center space-x-1">
                                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                        <span>Quitada</span>
                                      </span>
                                    )}

                                    {isOverdue && (
                                      <span className="text-[10px] bg-rose-100 text-rose-700 border border-rose-200 px-1.5 py-0.5 rounded font-bold flex items-center space-x-1">
                                        <AlertTriangle className="w-2.5 h-2.5 text-rose-600" />
                                        <span>Em Atraso</span>
                                      </span>
                                    )}
                                  </div>
                                </td>

                                {/* 3. Categoria */}
                                <td className="py-3 px-4 text-slate-600">
                                  <span className="inline-flex items-center space-x-1 text-xs font-semibold text-purple-700 bg-purple-100/70 border border-purple-200 px-2 py-0.5 rounded-md">
                                    <CreditCard className="w-3 h-3 text-purple-600" />
                                    <span>Fatura Consolidada</span>
                                  </span>
                                </td>

                                {/* 4. Conta / Cartão */}
                                <td className="py-3 px-4 text-slate-600 whitespace-nowrap">
                                  <span className="text-purple-700 font-bold block text-xs sm:text-sm">
                                    💳 {tx.card?.name}
                                  </span>
                                  {tx.isPaid && tx.paymentTx && (
                                    <span className="text-[11px] text-emerald-600 block">
                                      Pago via {accounts.find((a) => a.id === tx.paymentTx.accountId)?.name || 'Conta bancária'}
                                    </span>
                                  )}
                                </td>

                                {/* 5. Situação */}
                                <td className="py-3 px-4">
                                  <span
                                    className={`text-[11px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider flex items-center space-x-1 w-fit ${
                                      tx.status === 'REALIZADO'
                                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                        : isOverdue
                                        ? 'bg-rose-100 text-rose-800 border border-rose-300'
                                        : 'bg-purple-100 text-purple-800 border border-purple-300'
                                    }`}
                                  >
                                    {tx.status === 'REALIZADO' ? (
                                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                    ) : isOverdue ? (
                                      <AlertTriangle className="w-3 h-3 text-rose-600" />
                                    ) : (
                                      <Clock className="w-3 h-3 text-purple-600" />
                                    )}
                                    <span>{tx.status === 'REALIZADO' ? 'PAGA' : tx.status}</span>
                                  </span>
                                </td>

                                {/* 6. Valor */}
                                <td className="py-3 px-4 text-right font-bold whitespace-nowrap text-purple-900 text-sm sm:text-base">
                                  - {formatMoney(tx.amountCents)}
                                </td>

                                {/* 7. Ações */}
                                <td className="py-3 px-4 text-center">
                                  <div className="flex items-center justify-center space-x-1.5">
                                    {!tx.isPaid && (
                                      <button
                                        type="button"
                                        onClick={() => openInvoicePaymentModal(tx.card, tx.monthKey)}
                                        className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 flex items-center space-x-1 transition active:scale-95 shadow-2xs"
                                        title="Pagar e quitar esta fatura debitando de uma conta bancária"
                                      >
                                        <CreditCard className="w-3.5 h-3.5" />
                                        <span>Pagar</span>
                                      </button>
                                    )}

                                    <button
                                      type="button"
                                      onClick={() => handleOpenDeleteInvoiceModal(tx.card, tx.monthKey)}
                                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition"
                                      title="Excluir toda esta fatura e seus lançamentos vinculados"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                </td>
                              </tr>

                              {/* Linhas Aninhadas das Compras Pertencentes a Esta Fatura */}
                              {isExpanded &&
                                itemsToDisplay.map((item) => {
                                  const itemCat = categories.find((c) => c.id === item.categoryId);
                                  return (
                                    <tr
                                      key={`sub-${item.id}`}
                                      className="bg-purple-50/20 hover:bg-purple-50/40 border-l-4 border-purple-300 text-xs transition-colors"
                                    >
                                      {/* 1. Data da Compra */}
                                      <td className="py-2.5 px-4 pl-7 whitespace-nowrap text-slate-500">
                                        <div className="flex items-center space-x-1.5">
                                          <span className="text-purple-400 font-bold">↳</span>
                                          <span className="font-medium text-slate-700">
                                            {formatDateBR(item.purchaseDate || item.date)}
                                          </span>
                                          <span className="text-[9px] bg-slate-100 text-slate-500 px-1 py-0.2 rounded font-medium">
                                            Compra
                                          </span>
                                        </div>
                                      </td>

                                      {/* 2. Descrição da Compra */}
                                      <td className="py-2.5 px-4 font-normal text-slate-800">
                                        <div className="flex items-center space-x-2">
                                          <span>{item.description}</span>
                                          {item.installmentCount && (
                                            <span className="text-[10px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded font-semibold">
                                              {item.installmentNumber}/{item.installmentCount}
                                            </span>
                                          )}
                                          {!item.installmentCount && (item.recurrenceRuleId || item.isRecurring) && (
                                            <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-semibold flex items-center space-x-1">
                                              <RefreshCw className="w-2.5 h-2.5" />
                                              <span>Recorrente</span>
                                            </span>
                                          )}
                                          {item.scope === 'PERSONAL' && (
                                            <span className="text-[9px] bg-amber-50 text-amber-700 border border-amber-200 px-1.5 py-0.2 rounded font-semibold">
                                              👤 Pessoal
                                            </span>
                                          )}
                                        </div>
                                      </td>

                                      {/* 3. Categoria */}
                                      <td className="py-2.5 px-4 text-slate-600">
                                        {itemCat ? (
                                          <span className="inline-flex items-center space-x-1.5">
                                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: itemCat.color }} />
                                            <span>{itemCat.name}</span>
                                          </span>
                                        ) : (
                                          <span className="text-slate-400 italic">Sem Categoria</span>
                                        )}
                                      </td>

                                      {/* 4. Conta / Cartão */}
                                      <td className="py-2.5 px-4 text-slate-500 whitespace-nowrap">
                                        <span className="text-[11px] text-purple-600 font-medium">Item do Cartão</span>
                                      </td>

                                      {/* 5. Situação */}
                                      <td className="py-2.5 px-4">
                                        <span
                                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                                            tx.isPaid || item.status === 'REALIZADO'
                                              ? 'bg-emerald-50 text-emerald-700'
                                              : 'bg-slate-100 text-slate-600'
                                          }`}
                                        >
                                          {tx.isPaid || item.status === 'REALIZADO' ? '✓ Quitado na Fatura' : 'Na Fatura'}
                                        </span>
                                      </td>

                                      {/* 6. Valor */}
                                      <td className="py-2.5 px-4 text-right font-medium whitespace-nowrap text-slate-700">
                                        - {formatMoney(item.amountCents)}
                                      </td>

                                      {/* 7. Ações */}
                                      <td className="py-2.5 px-4 text-center">
                                        <div className="flex items-center justify-center space-x-1">
                                          <button
                                            type="button"
                                            onClick={() => openTransactionModal('edit', item)}
                                            className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition"
                                            title="Editar esta compra"
                                          >
                                            <Edit2 className="w-3.5 h-3.5" />
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => handleDeleteTransaction(item)}
                                            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition"
                                            title="Excluir esta compra da fatura"
                                          >
                                            <Trash2 className="w-3.5 h-3.5" />
                                          </button>
                                        </div>
                                      </td>
                                    </tr>
                                  );
                                })}
                            </React.Fragment>
                          );
                        }

                        // Lançamento normal de conta corrente ou dinheiro
                        const cat = categories.find((c) => c.id === tx.categoryId);
                        const acc = accounts.find((a) => a.id === tx.accountId);
                        const card = cards.find((c) => c.id === tx.cardId);
                        const isOverdue = isTxOverdue(tx);
                        const effectiveDue = getTxDueDate(tx);

                        return (
                          <tr
                            key={tx.id}
                            className={`transition-colors ${
                              tx.isHypothetical
                                ? 'bg-purple-50/20 hover:bg-purple-50/40 border-l-2 border-purple-500'
                                : isOverdue
                                ? 'bg-rose-50/40 hover:bg-rose-50/70 border-l-4 border-rose-500'
                                : 'hover:bg-slate-50/80'
                            }`}
                          >
                            {/* 1. Data */}
                            <td className={`py-3 px-4 whitespace-nowrap ${isOverdue ? 'text-rose-600 font-semibold' : 'text-slate-600'}`}>
                              <div className="flex flex-col">
                                {tx.purchaseDate && tx.cardId ? (
                                  <>
                                    <div className="flex items-center space-x-1.5">
                                      <span className="font-semibold text-slate-900">{formatDateBR(tx.purchaseDate)}</span>
                                      <span className="text-[9px] bg-slate-100 text-slate-600 px-1 py-0.2 rounded font-medium" title="Data em que a compra foi realizada">
                                        Compra
                                      </span>
                                    </div>
                                    <div className="text-[11px] mt-0.5 flex items-center space-x-1" title="Data de vencimento da fatura do cartão">
                                      <CreditCard className="w-3 h-3 text-purple-600 shrink-0" />
                                      <span className={isOverdue ? 'text-rose-600 font-bold' : 'text-purple-700 font-medium'}>
                                        Venc: {formatDateBR(effectiveDue)}
                                      </span>
                                    </div>
                                  </>
                                ) : (
                                  <span className="font-medium text-slate-900">{formatDateBR(tx.date)}</span>
                                )}
                              </div>
                            </td>

                            {/* 2. Descrição */}
                            <td className="py-3 px-4 font-medium text-slate-900">
                              <div className="flex items-center space-x-2">
                                <span>{tx.description}</span>
                                {tx.scope === 'PERSONAL' && (
                                  <span className="text-[9px] bg-amber-50 text-amber-700 border border-amber-200 px-1.5 py-0.2 rounded font-semibold whitespace-nowrap">
                                    👤 Pessoal
                                  </span>
                                )}
                                {isOverdue && (
                                  <span className="text-[10px] bg-rose-100 text-rose-700 border border-rose-200 px-1.5 py-0.5 rounded font-bold flex items-center space-x-1" title="Lançamento com vencimento em atraso">
                                    <AlertTriangle className="w-2.5 h-2.5 text-rose-600" />
                                    <span>Em Atraso</span>
                                  </span>
                                )}
                                {tx.installmentCount && (
                                  <span className="text-[10px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded font-semibold whitespace-nowrap">
                                    {tx.installmentNumber}/{tx.installmentCount}
                                  </span>
                                )}
                                {!tx.installmentCount && (tx.recurrenceRuleId || tx.isRecurring) && (
                                  <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-semibold flex items-center space-x-1 whitespace-nowrap" title="Lançamento com repetição mensal recorrente">
                                    <RefreshCw className="w-2.5 h-2.5" />
                                    <span>Recorrente</span>
                                  </span>
                                )}
                              </div>
                            </td>

                            {/* 3. Categoria */}
                            <td className="py-3 px-4 text-slate-600">
                              {cat ? (
                                <span className="inline-flex items-center space-x-1.5">
                                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }} />
                                  <span>{cat.name}</span>
                                </span>
                              ) : (
                                <span className="text-slate-400 italic">Sem Categoria</span>
                              )}
                            </td>

                            {/* 4. Conta / Cartão */}
                            <td className="py-3 px-4 text-slate-600 whitespace-nowrap">
                              {acc && <span className="text-blue-700 font-medium">{acc.name}</span>}
                              {card && <span className="text-purple-700 font-medium">💳 {card.name}</span>}
                              {!acc && !card && <span className="text-slate-400">-</span>}
                            </td>

                            {/* 5. Situação */}
                            <td className="py-3 px-4">
                              {tx.isHypothetical ? (
                                <span className="text-[11px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider flex items-center space-x-1 bg-purple-100 text-purple-800 border border-purple-200 w-fit">
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
                                      : isOverdue
                                      ? 'bg-rose-100 text-rose-800 hover:bg-rose-200 border border-rose-300'
                                      : 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                                  }`}
                                  title={isOverdue ? 'Conta em atraso! Clique para marcar como Realizado' : 'Clique para alternar situação'}
                                >
                                  {tx.status === 'REALIZADO' ? (
                                    <CheckCircle2 className="w-3 h-3" />
                                  ) : isOverdue ? (
                                    <AlertTriangle className="w-3 h-3 text-rose-600" />
                                  ) : (
                                    <Clock className="w-3 h-3" />
                                  )}
                                  <span>{isOverdue ? 'EM ATRASO' : tx.status}</span>
                                </button>
                              )}
                            </td>

                            {/* 6. Valor */}
                            <td
                              className={`py-3 px-4 text-right font-bold whitespace-nowrap ${
                                tx.type === 'INCOME' ? 'text-emerald-600' : isOverdue ? 'text-rose-600' : 'text-slate-900'
                              }`}
                            >
                              {tx.type === 'INCOME' ? '+' : '-'} {formatMoney(tx.amountCents)}
                            </td>

                            {/* 7. Ações */}
                            <td className="py-3 px-4 text-center">
                              {tx.isHypothetical ? (
                                <button
                                  type="button"
                                  onClick={() => handleConvertScenarioToReal(tx.scenarioData || scenarios.find((s) => s.id === tx.scenarioId))}
                                  className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 flex items-center space-x-1 transition active:scale-95 mx-auto shadow-2xs"
                                  title="Converter esta simulação em lançamento real"
                                >
                                  <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                                  <span>Tornar Real</span>
                                </button>
                              ) : (
                                <div className="flex items-center justify-center space-x-1.5">
                                  {/* Ação Explícita de Quitação / Pagamento / Recebimento */}
                                  {tx.status === 'COMPROMETIDO' && (
                                    tx.cardId ? (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const c = cards.find((card) => card.id === tx.cardId);
                                          const monthKey = (getTxDueDate(tx) || tx.date).slice(0, 7);
                                          openInvoicePaymentModal(c, monthKey);
                                        }}
                                        className="px-2 py-1 text-xs font-semibold rounded-lg bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200 flex items-center space-x-1 transition active:scale-95 shadow-2xs"
                                        title="Pagar Fatura deste Cartão"
                                      >
                                        <CreditCard className="w-3.5 h-3.5 text-purple-600" />
                                        <span>Pagar Fatura</span>
                                      </button>
                                    ) : (
                                      <button
                                        type="button"
                                        onClick={() => handleQuickPayTransaction(tx, 'REALIZADO')}
                                        className={`px-2 py-1 text-xs font-semibold rounded-lg flex items-center space-x-1 transition active:scale-95 shadow-2xs ${
                                          isOverdue
                                            ? 'bg-rose-100 text-rose-800 hover:bg-rose-200 border border-rose-300 animate-pulse'
                                            : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                                        }`}
                                        title={
                                          tx.type === 'INCOME'
                                            ? 'Confirmar recebimento deste valor'
                                            : 'Quitar e marcar esta despesa como paga'
                                        }
                                      >
                                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                                        <span>{tx.type === 'INCOME' ? 'Receber' : 'Pagar'}</span>
                                      </button>
                                    )
                                  )}

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

            {/* Seletor de Período dos Gráficos */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mr-1 flex items-center space-x-1">
                  <Calendar className="w-3.5 h-3.5 text-blue-600" />
                  <span>Período:</span>
                </span>
                {[
                  { id: 'DASHBOARD_MONTH', label: `Mês Atual (${formatMonthLabel(dashboardMonth)})` },
                  { id: 'SPECIFIC_MONTH', label: 'Mês Específico' },
                  { id: 'LAST_3_MONTHS', label: 'Últimos 3 Meses' },
                  { id: 'LAST_6_MONTHS', label: 'Últimos 6 Meses' },
                  { id: 'CURRENT_YEAR', label: 'Ano Atual' },
                  { id: 'ALL', label: 'Todo o Histórico' },
                ].map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setChartPeriodFilter(p.id)}
                    className={`text-xs font-semibold px-3 py-1.5 rounded-xl transition active:scale-95 ${
                      chartPeriodFilter === p.id
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>

              {chartPeriodFilter === 'SPECIFIC_MONTH' && (
                <div className="flex items-center space-x-2 w-full sm:w-auto">
                  <span className="text-xs text-slate-500 font-medium">Selecionar Mês:</span>
                  <select
                    value={chartSpecificMonth}
                    onChange={(e) => setChartSpecificMonth(e.target.value)}
                    className="border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs font-bold bg-white text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none capitalize"
                  >
                    {availableInvoiceMonths.map((mKey) => (
                      <option key={mKey} value={mKey}>
                        {formatMonthLabel(mKey)}
                      </option>
                    ))}
                  </select>
                </div>
              )}
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
                  Acompanhe o valor da fatura de qualquer mês e confira o impacto de compras parceladas futuras.
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

            {/* Seletor Cronológico de Mês das Faturas */}
            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center space-x-2 w-full sm:w-auto justify-between sm:justify-start">
                <button
                  type="button"
                  onClick={() => changeInvoiceSelectedMonth(-1)}
                  className="p-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl transition active:scale-95 shadow-2xs"
                  title="Ver fatura do mês anterior"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>

                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4 text-purple-600 hidden sm:inline" />
                  <select
                    value={invoiceSelectedMonth}
                    onChange={(e) => setInvoiceSelectedMonth(e.target.value)}
                    className="border border-slate-300 rounded-xl px-3 py-2 text-sm sm:text-base font-bold text-slate-800 bg-white focus:ring-2 focus:ring-purple-500 focus:outline-none cursor-pointer capitalize"
                  >
                    {availableInvoiceMonths.map((mKey) => (
                      <option key={mKey} value={mKey}>
                        {formatMonthLabel(mKey)} {mKey === currentActualMonth ? '★ (MÊS ATUAL)' : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  type="button"
                  onClick={() => changeInvoiceSelectedMonth(1)}
                  className="p-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl transition active:scale-95 shadow-2xs"
                  title="Ver fatura do próximo mês"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>

              <div className="flex items-center space-x-3 text-xs">
                {invoiceSelectedMonth !== currentActualMonth && (
                  <button
                    type="button"
                    onClick={() => setInvoiceSelectedMonth(currentActualMonth)}
                    className="font-semibold px-3 py-1.5 rounded-lg bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200 transition"
                  >
                    Voltar para Mês Atual
                  </button>
                )}
                <span className="text-slate-500">
                  Fatura de competência: <strong className="text-slate-800 capitalize">{formatMonthLabel(invoiceSelectedMonth)}</strong>
                </span>
              </div>
            </div>

            <div className="space-y-6">
              {cards.map((card) => {
                const info = faturasCardsData[card.id] || {
                  monthItems: [],
                  invoiceTotalCents: 0,
                  availableCents: card.limitCents,
                  committedTotalCents: 0,
                  isPaid: false,
                  invoiceStatus: 'ABERTA',
                  dueDateIso: '',
                  closingDateIso: '',
                };

                return (
                  <div key={card.id} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                    <div className="flex flex-col md:flex-row justify-between md:items-center pb-4 border-b border-slate-100 gap-4">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: card.color || '#1e293b' }} />
                          <h3 className="text-base font-bold text-slate-900">{card.name}</h3>
                          <span className="text-xs text-slate-500">({card.bank} • {card.flag})</span>
                          {/* Badge de Situação da Fatura */}
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase flex items-center space-x-1 border ${
                              info.invoiceStatus === 'PAGA'
                                ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                : info.invoiceStatus === 'EM ATRASO'
                                ? 'bg-rose-100 text-rose-800 border-rose-300'
                                : info.invoiceStatus === 'FECHADA'
                                ? 'bg-amber-100 text-amber-800 border-amber-300'
                                : 'bg-blue-100 text-blue-800 border-blue-300'
                            }`}
                          >
                            {info.invoiceStatus === 'PAGA' && <CheckCircle2 className="w-3 h-3" />}
                            {info.invoiceStatus === 'EM ATRASO' && <AlertTriangle className="w-3 h-3 text-rose-600" />}
                            {info.invoiceStatus === 'FECHADA' && <Clock className="w-3 h-3 text-amber-600" />}
                            {info.invoiceStatus === 'ABERTA' && <Clock className="w-3 h-3 text-blue-600" />}
                            <span>FATURA {info.invoiceStatus}</span>
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-1">
                          Fechamento todo dia <strong>{card.closingDay}</strong> • Vencimento todo dia <strong>{card.dueDay}</strong>
                          {info.dueDateIso && (
                            <span className="ml-2 font-medium text-slate-600">
                              (Vence em: {formatDateBR(info.dueDateIso)})
                            </span>
                          )}
                        </p>
                      </div>

                      <div className="flex items-center space-x-4">
                        <div className="text-left md:text-right">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                            VALOR DESTA FATURA
                          </span>
                          <span className="text-2xl font-bold text-slate-900">{formatMoney(info.invoiceTotalCents)}</span>
                          {info.isPaid ? (
                            <span className="text-xs text-emerald-600 font-semibold block mt-0.5">
                              ✓ Paga ({formatMoney(info.paidCents)})
                            </span>
                          ) : (
                            <span className="text-xs text-slate-500 font-medium block mt-0.5">
                              Disponível: {formatMoney(info.availableCents)} (de {formatMoney(card.limitCents)})
                            </span>
                          )}
                        </div>

                        {info.invoiceTotalCents > 0 && (
                          <button
                            type="button"
                            onClick={() => openInvoicePaymentModal(card, invoiceSelectedMonth)}
                            className={`text-xs sm:text-sm font-semibold px-4 py-2 rounded-xl flex items-center space-x-1.5 transition active:scale-95 shadow-sm whitespace-nowrap ${
                              info.isPaid
                                ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
                                : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                            }`}
                            title="Efetuar débito na conta bancária e quitar faturas"
                          >
                            <CreditCard className="w-4 h-4" />
                            <span>{info.isPaid ? 'Novo Pagamento' : 'Pagar Fatura'}</span>
                          </button>
                        )}

                        {(info.monthItems.length > 0 || info.paymentTx) && (
                          <button
                            type="button"
                            onClick={() => handleOpenDeleteInvoiceModal(card, invoiceSelectedMonth)}
                            className="text-xs sm:text-sm font-semibold px-3 py-2 rounded-xl flex items-center space-x-1.5 transition active:scale-95 shadow-sm whitespace-nowrap bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200"
                            title="Excluir todos os lançamentos desta fatura"
                          >
                            <Trash2 className="w-4 h-4 text-rose-600" />
                            <span className="hidden sm:inline">Excluir Fatura</span>
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="mt-4">
                      <div className="flex justify-between items-center mb-3">
                        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                          LANÇAMENTOS E PARCELAS DESTA FATURA ({info.monthItems.length}):
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

                      {info.monthItems.length === 0 ? (
                        <p className="text-xs text-slate-400 py-4 bg-slate-50/60 rounded-xl text-center">
                          Nenhuma despesa ou parcela vinculada a este cartão na fatura de {formatMonthLabel(invoiceSelectedMonth)}.
                        </p>
                      ) : (
                        <div className="divide-y divide-slate-100">
                          {info.monthItems.map((item) => {
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
                                    <span
                                      className={`text-[9px] font-bold px-1.5 py-0.2 rounded uppercase ${
                                        item.status === 'REALIZADO'
                                          ? 'bg-emerald-100 text-emerald-800'
                                          : 'bg-blue-100 text-blue-800'
                                      }`}
                                    >
                                      {item.status === 'REALIZADO' ? 'Quitado' : 'Comprometido'}
                                    </span>
                                  </div>
                                  <span className="text-xs text-slate-400 block mt-0.5">
                                    Vencimento: <strong className="text-slate-600 font-medium">{formatDateBR(getTxDueDate(item))}</strong>
                                    {item.purchaseDate && item.purchaseDate !== getTxDueDate(item) && (
                                      <span className="ml-2 text-slate-400 font-normal">• Compra: {formatDateBR(item.purchaseDate)}</span>
                                    )}
                                  </span>
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

                      {/* Rodapé informativo de limites do cartão */}
                      <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between text-xs text-slate-500 gap-2">
                        <span>
                          Limite Total: <strong>{formatMoney(card.limitCents)}</strong>
                        </span>
                        <span>
                          Total Comprometido (Todas as Parcelas): <strong className="text-slate-700">{formatMoney(info.committedTotalCents)}</strong>
                        </span>
                        <span className="text-emerald-600 font-semibold">
                          Disponível Atual: {formatMoney(info.availableCents)}
                        </span>
                      </div>
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
                    <span className="w-4 h-4 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                    <div>
                      <h4 className="font-semibold text-sm text-slate-900">{cat.name}</h4>
                      <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                        <span className="text-[10px] uppercase font-bold text-slate-400">
                          {cat.type === 'INCOME' ? 'Receita' : 'Despesa'}
                        </span>
                        {cat.budgetLimitCents > 0 && (
                          <span className="text-[10px] font-bold px-1.5 py-0.2 bg-blue-50 text-blue-700 border border-blue-200 rounded">
                            ✉️ {formatMoney(cat.budgetLimitCents)}/mês
                          </span>
                        )}
                      </div>
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

        {/* ===================== ABA: PLANEJAMENTO & PROJEÇÕES COM IMPACTO DOS CENÁRIOS E ENVELOPES ===================== */}
        {activeTab === 'projections' && (
          <div className="space-y-6">
            {/* ===================== SEÇÃO 1: ENVELOPES & METAS DE GASTOS (MÉTODO DOS ENVELOPES) ===================== */}
            {(() => {
              const currentEnvelopesData = getEnvelopesForMonth(envelopeSelectedMonth);

              return (
                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
                  {/* Topo: Título, Navegador de Mês e Ações */}
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xl">✉️</span>
                        <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                          Envelopes de Gastos & Orçamento Mensal
                        </h2>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full">
                          Método dos Envelopes
                        </span>
                      </div>
                      <p className="text-xs sm:text-sm text-slate-500 mt-1">
                        Destine limites de renda para categorias (ex: Combustível: R$ 800). O valor fica virtualmente comprometido e é consumido conforme você registra suas compras no mês.
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {/* Navegador de Mês do Envelope */}
                      <div className="flex items-center space-x-1.5 bg-slate-50 border border-slate-200 p-1 rounded-xl">
                        <button
                          type="button"
                          onClick={() => changeEnvelopeSelectedMonth(-1)}
                          className="p-1 text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 rounded-lg transition"
                          title="Mês Anterior"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        <span className="text-xs font-bold text-slate-800 px-2 capitalize min-w-[120px] text-center">
                          {formatMonthLabel(envelopeSelectedMonth)}
                        </span>
                        <button
                          type="button"
                          onClick={() => changeEnvelopeSelectedMonth(1)}
                          className="p-1 text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 rounded-lg transition"
                          title="Próximo Mês"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>

                      {envelopeSelectedMonth !== currentActualMonth && (
                        <button
                          type="button"
                          onClick={() => setEnvelopeSelectedMonth(currentActualMonth)}
                          className="text-[11px] font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 px-2.5 py-1.5 rounded-xl border border-blue-200 transition"
                        >
                          Mês Atual
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => setModalState({ isOpen: true, type: 'category', mode: 'create', data: null })}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs px-3.5 py-2 rounded-xl flex items-center space-x-1.5 shadow-xs transition active:scale-95"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Novo Envelope</span>
                      </button>
                    </div>
                  </div>

                  {/* Faixa com 4 Métricas Consolidadas do Mês */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70">
                      <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                        Total Destinado
                      </span>
                      <div className="text-lg font-bold text-slate-900 mt-0.5">
                        {formatMoney(currentEnvelopesData.totalAllocatedCents)}
                      </div>
                      <span className="text-[10px] text-slate-400">Soma dos tetos mensais</span>
                    </div>

                    <div className="p-3.5 rounded-xl bg-blue-50/60 border border-blue-100">
                      <span className="text-[11px] font-semibold text-blue-700 uppercase tracking-wider block">
                        Gasto Realizado
                      </span>
                      <div className="text-lg font-bold text-blue-900 mt-0.5">
                        {formatMoney(currentEnvelopesData.totalSpentCents)}
                      </div>
                      <span className="text-[10px] text-blue-600">Lançamentos em conta/cartão</span>
                    </div>

                    <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200/80">
                      <span className="text-[11px] font-semibold text-emerald-800 uppercase tracking-wider block">
                        Reserva Restante
                      </span>
                      <div className="text-lg font-bold text-emerald-700 mt-0.5">
                        {formatMoney(currentEnvelopesData.totalResidualCommittedCents)}
                      </div>
                      <span className="text-[10px] text-emerald-600">Disponível nos envelopes</span>
                    </div>

                    <div
                      className={`p-3.5 rounded-xl border ${
                        currentEnvelopesData.totalOverspentCents > 0
                          ? 'bg-rose-50 border-rose-200'
                          : 'bg-slate-50 border-slate-200/70'
                      }`}
                    >
                      <span
                        className={`text-[11px] font-semibold uppercase tracking-wider block ${
                          currentEnvelopesData.totalOverspentCents > 0 ? 'text-rose-700' : 'text-slate-500'
                        }`}
                      >
                        {currentEnvelopesData.totalOverspentCents > 0 ? '🚨 Total Extrapolado' : 'Estouro / Excesso'}
                      </span>
                      <div
                        className={`text-lg font-bold mt-0.5 ${
                          currentEnvelopesData.totalOverspentCents > 0 ? 'text-rose-700' : 'text-slate-400'
                        }`}
                      >
                        {currentEnvelopesData.totalOverspentCents > 0
                          ? `+${formatMoney(currentEnvelopesData.totalOverspentCents)}`
                          : 'R$ 0,00'}
                      </div>
                      <span
                        className={`text-[10px] ${
                          currentEnvelopesData.totalOverspentCents > 0 ? 'text-rose-600 font-medium' : 'text-slate-400'
                        }`}
                      >
                        {currentEnvelopesData.totalOverspentCents > 0 ? 'Além do teto planejado' : 'Dentro do orçamento'}
                      </span>
                    </div>
                  </div>

                  {/* Grade de Cards de Envelopes */}
                  {!currentEnvelopesData.hasEnvelopes ? (
                    <div className="p-8 border-2 border-dashed border-slate-200 rounded-2xl text-center space-y-3 bg-slate-50/50">
                      <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mx-auto text-2xl">
                        ✉️
                      </div>
                      <h3 className="font-bold text-slate-800 text-base">Nenhum envelope configurado</h3>
                      <p className="text-xs sm:text-sm text-slate-500 max-w-lg mx-auto">
                        O método dos envelopes permite destinar valores mensais para despesas frequentes (ex: Combustível: R$ 800, Supermercado: R$ 1.500, Lazer: R$ 400).
                        O valor fica virtualmente reservado no saldo e diminui automaticamente conforme você insere compras em conta ou cartão.
                      </p>
                      <button
                        type="button"
                        onClick={() => setActiveTab('categories')}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow-sm transition inline-flex items-center space-x-1.5"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Definir Teto nas Categorias</span>
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {currentEnvelopesData.envelopes.map((env) => {
                        const cat = env.category;
                        const barColor = env.isOver ? '#ef4444' : env.percentage >= 80 ? '#f59e0b' : '#10b981';

                        return (
                          <div
                            key={cat.id}
                            className={`p-4 rounded-2xl border transition shadow-xs flex flex-col justify-between space-y-3 ${
                              env.isOver
                                ? 'bg-rose-50/40 border-rose-200 ring-1 ring-rose-200'
                                : 'bg-white border-slate-200 hover:border-slate-300'
                            }`}
                          >
                            {/* Topo do Card: Categoria e Botão de Editar Teto */}
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                <span className="w-3.5 h-3.5 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                                <h4 className="font-bold text-sm text-slate-900">{cat.name}</h4>
                              </div>
                              <button
                                type="button"
                                onClick={() => setModalState({ isOpen: true, type: 'category', mode: 'edit', data: cat })}
                                className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                                title="Ajustar teto mensal do envelope"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            {/* Barra de Progresso */}
                            <div className="space-y-1.5">
                              <div className="flex justify-between text-xs font-semibold">
                                <span className="text-slate-600">
                                  Gasto: <strong className="text-slate-900">{formatMoney(env.spentCents)}</strong>
                                </span>
                                <span className="text-slate-500">
                                  Teto: <strong className="text-slate-800">{formatMoney(env.allocatedCents)}</strong>
                                </span>
                              </div>
                              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                                <div
                                  className="h-full rounded-full transition-all duration-300"
                                  style={{
                                    width: `${Math.min(100, env.percentage)}%`,
                                    backgroundColor: barColor,
                                  }}
                                />
                              </div>
                            </div>

                            {/* Rodapé do Card: Situação / Restante / Alerta de Estouro */}
                            <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                              <span className="text-[11px] font-bold text-slate-500">
                                {env.percentage.toFixed(0)}% consumido
                              </span>
                              {env.isOver ? (
                                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-300">
                                  🚨 Ultrapassou {formatMoney(env.overspentCents)}
                                </span>
                              ) : env.remainingCents === 0 ? (
                                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                                  Teto Atingido
                                </span>
                              ) : (
                                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                                  ✓ {formatMoney(env.remainingCents)} disponíveis
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })()}

            {/* ===================== SEÇÃO 2: PROJEÇÃO DO FLUXO DE CAIXA COM CENÁRIOS E ENVELOPES ===================== */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 tracking-tight">Projeção do Fluxo de Caixa</h2>
                  <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                    Previsão acumulada considerando receitas, despesas/parcelas, envelopes e o impacto dos cenários ativos.
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

                    // Despesas e receitas habituais base do mês atual (sem parcelamentos futuros embutidos)
                    const baseIncomesCents = visibleTransactions
                      .filter(
                        (t) =>
                          t.type === 'INCOME' &&
                          t.status !== 'CANCELADO' &&
                          !t.installmentGroupId &&
                          t.date &&
                          t.date.startsWith(currentYearMonth)
                      )
                      .reduce((acc, t) => acc + t.amountCents, 0);

                    const baseExpensesCents = visibleTransactions
                      .filter(
                        (t) =>
                          t.type === 'EXPENSE' &&
                          t.status !== 'CANCELADO' &&
                          !t.installmentGroupId &&
                          t.date &&
                          t.date.startsWith(currentYearMonth)
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
                        // Mês atual: soma exata de todos os lançamentos ativos deste mês + reserva residual dos envelopes + cenários ativos
                        const currentTxs = visibleTransactions.filter(
                          (t) => t.status !== 'CANCELADO' && t.date && t.date.startsWith(monthKey)
                        );
                        const curMonthEnvelopes = getEnvelopesForMonth(monthKey);
                        totalIncome = currentTxs.filter((t) => t.type === 'INCOME').reduce((a, t) => a + t.amountCents, 0) + scenInc;
                        totalExpense = currentTxs.filter((t) => t.type === 'EXPENSE').reduce((a, t) => a + t.amountCents, 0) + curMonthEnvelopes.totalResidualCommittedCents + scenExp;
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

                        // 3. Orçamento planejado dos envelopes das categorias
                        const envelopeAllocatedTotal = categories
                          .filter((c) => !c.archived && c.type === 'EXPENSE' && (c.budgetLimitCents || 0) > 0)
                          .reduce((acc, c) => acc + (c.budgetLimitCents || 0), 0);

                        const finalBaseExpense = Math.max(baseExpensesCents, scheduledExpense, envelopeAllocatedTotal);
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
          <div className="space-y-6 max-w-6xl mx-auto">
            {!importPreviewData ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm max-w-3xl mx-auto space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center space-x-2">
                    <FileText className="w-5 h-5 text-blue-600" />
                    <span>Importação de Faturas em PDF & Extratos</span>
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-500 mt-1">
                    Envie a fatura original do seu cartão de crédito (PDF do Itaú, Nubank ou extrato bancário CSV).
                    O leitor inteligente extrai todas as compras, parcelamentos e datas para você aprovar item por item.
                  </p>
                </div>

                <div className="border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-2xl p-8 sm:p-12 text-center space-y-5 bg-slate-50/60 transition group">
                  <div className="w-16 h-16 bg-blue-100/70 text-blue-600 rounded-2xl flex items-center justify-center mx-auto shadow-inner group-hover:scale-105 transition">
                    <UploadCloud className="w-8 h-8" />
                  </div>

                  <div>
                    <h3 className="font-bold text-base text-slate-900">Selecione sua fatura PDF ou extrato CSV</h3>
                    <p className="text-xs text-slate-400 mt-1">
                      Compatível com faturas PDF do Itaú (Black, Platinum, Visa/Mastercard) e arquivos bancários (.pdf, .csv, .txt)
                    </p>
                  </div>

                  <div className="max-w-xs mx-auto text-left">
                    <label className="block text-xs font-semibold text-slate-600 mb-1 text-center">
                      Cartão de destino padrão:
                    </label>
                    <select
                      value={importSelectedCard}
                      onChange={(e) => setImportSelectedCard(e.target.value)}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-xs"
                    >
                      {cards.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} ({c.bank})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                    <label className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm px-8 py-3 rounded-xl cursor-pointer transition active:scale-95 flex items-center justify-center space-x-2 shadow-sm">
                      <FileText className="w-4 h-4" />
                      <span>Selecionar Fatura (PDF / CSV)</span>
                      <input
                        type="file"
                        accept=".pdf,.csv,.txt,.ofx"
                        onChange={handleFileUpload}
                        className="hidden"
                        disabled={isImportLoading}
                      />
                    </label>
                  </div>

                  {isImportLoading && (
                    <div className="p-4 bg-blue-50 rounded-xl border border-blue-200 text-blue-800 text-xs font-semibold flex items-center justify-center space-x-2 animate-pulse">
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Lendo e analisando fatura com inteligência de conciliação...</span>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* TELA DE CONFERÊNCIA E APROVAÇÃO ITEM POR ITEM */
              <div className="space-y-6">
                {/* Cabeçalho com Metadados da Fatura e Indicadores de Conciliação */}
                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-5">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-bold uppercase tracking-wider bg-blue-100 text-blue-800 px-2 py-0.5 rounded-md">
                          Fatura Identificada
                        </span>
                        {importMetadata?.fileName && (
                          <span className="text-xs text-slate-500 font-mono truncate max-w-xs">
                            {importMetadata.fileName}
                          </span>
                        )}
                      </div>
                      <h2 className="text-xl font-bold text-slate-900 mt-1">Conferência & Aprovação de Lançamentos</h2>
                      <div className="flex flex-wrap items-center gap-y-1 gap-x-3 text-xs text-slate-500 mt-1">
                        {importMetadata?.cardholder && <span>Titular: <strong className="text-slate-700">{importMetadata.cardholder}</strong></span>}
                        {importMetadata?.cardLast4 && <span>• Cartão Final: <strong className="text-slate-700">{importMetadata.cardLast4}</strong></span>}
                        {importMetadata?.dueDate && <span>• Vencimento: <strong className="text-slate-700">{importMetadata.dueDate}</strong></span>}
                        {importMetadata?.closingDate && <span>• Fechamento: <strong className="text-slate-700">{importMetadata.closingDate}</strong></span>}
                      </div>
                    </div>

                    {/* Seletor de Cartão de Destino */}
                    <div className="flex items-center space-x-2 bg-slate-50 p-2 rounded-xl border border-slate-200">
                      <label className="text-xs font-bold text-slate-600 whitespace-nowrap">Cartão de Destino:</label>
                      <select
                        value={importSelectedCard}
                        onChange={(e) => setImportSelectedCard(e.target.value)}
                        className="bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        {cards.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name} ({c.bank})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Cards de Métricas e Status de Conciliação */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="p-4 rounded-xl border border-slate-100 bg-slate-50 flex flex-col justify-between">
                      <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Lido na Fatura (PDF)</span>
                      <div className="text-xl font-bold text-slate-900 mt-1">
                        {formatMoney(importMetadata?.totalInvoiceCents || 0)}
                      </div>
                      <span className="text-[11px] text-slate-500 mt-0.5">Valor estampado no extrato oficial</span>
                    </div>

                    <div className="p-4 rounded-xl border border-blue-100 bg-blue-50/50 flex flex-col justify-between">
                      <span className="text-xs font-semibold uppercase tracking-wider text-blue-600">Total Selecionado para Gravar</span>
                      <div className="text-xl font-bold text-blue-700 mt-1">
                        {formatMoney(importSummary.selectedTotalCents)}
                      </div>
                      <span className="text-[11px] text-blue-600/80 mt-0.5">
                        {importSummary.selectedCount} de {importPreviewData.length} compras aprovadas
                      </span>
                    </div>

                    <div
                      className={`p-4 rounded-xl border flex flex-col justify-between ${
                        importSummary.selectedTotalCents === (importMetadata?.totalInvoiceCents || 0)
                          ? 'border-emerald-200 bg-emerald-50/60 text-emerald-900'
                          : 'border-amber-200 bg-amber-50/60 text-amber-900'
                      }`}
                    >
                      <span className="text-xs font-semibold uppercase tracking-wider">Status da Conciliação</span>
                      <div className="text-sm font-bold flex items-center space-x-1.5 mt-1">
                        {importSummary.selectedTotalCents === (importMetadata?.totalInvoiceCents || 0) ? (
                          <>
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            <span className="text-emerald-700">100% Conciliado com a Fatura</span>
                          </>
                        ) : (
                          <>
                            <AlertTriangle className="w-4 h-4 text-amber-600" />
                            <span className="text-amber-700">
                              Diferença: {formatMoney(Math.abs(importSummary.selectedTotalCents - (importMetadata?.totalInvoiceCents || 0)))}
                            </span>
                          </>
                        )}
                      </div>
                      <span className="text-[11px] opacity-80 mt-0.5">
                        {importSummary.selectedTotalCents === (importMetadata?.totalInvoiceCents || 0)
                          ? 'A soma exata dos itens aprovados bate com o total da fatura.'
                          : 'Revise os itens desmarcados ou despesas extras.'}
                      </span>
                    </div>
                  </div>

                  {/* Barra de Ações em Massa e Filtros */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-2 border-t border-slate-100">
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleSelectAllImport(true)}
                        className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 transition"
                      >
                        Aprovar Todos ({importPreviewData.length})
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSelectAllImport(false)}
                        className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 transition"
                      >
                        Desmarcar Todos
                      </button>
                      {importSummary.duplicateCount > 0 && (
                        <button
                          type="button"
                          onClick={handleDeselectDuplicates}
                          className="px-3 py-1.5 rounded-lg border border-amber-200 bg-amber-50 hover:bg-amber-100 text-xs font-semibold text-amber-800 transition flex items-center space-x-1"
                        >
                          <AlertTriangle className="w-3 h-3 text-amber-600" />
                          <span>Desmarcar Duplicidades ({importSummary.duplicateCount})</span>
                        </button>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
                        <span className="text-slate-500 px-1 text-[11px]">Situação padrão:</span>
                        <button
                          type="button"
                          onClick={() => {
                            setImportDefaultStatus('COMPROMETIDO');
                            setImportPreviewData((prev) => prev ? prev.map((i) => ({ ...i, status: 'COMPROMETIDO' })) : prev);
                          }}
                          className={`px-2.5 py-1 rounded-lg transition ${
                            importDefaultStatus === 'COMPROMETIDO' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          A Vencer (Comprometido)
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setImportDefaultStatus('REALIZADO');
                            setImportPreviewData((prev) => prev ? prev.map((i) => ({ ...i, status: 'REALIZADO' })) : prev);
                          }}
                          className={`px-2.5 py-1 rounded-lg transition ${
                            importDefaultStatus === 'REALIZADO' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          Fatura Paga (Realizado)
                        </button>
                      </div>

                      <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold text-slate-600">
                        <button
                          type="button"
                          onClick={() => setImportFilterTab('ALL')}
                          className={`px-3 py-1 rounded-lg transition ${importFilterTab === 'ALL' ? 'bg-white text-slate-900 shadow-xs' : 'hover:text-slate-900'}`}
                        >
                          Todos ({importPreviewData.length})
                        </button>
                        <button
                          type="button"
                          onClick={() => setImportFilterTab('SELECTED')}
                          className={`px-3 py-1 rounded-lg transition ${importFilterTab === 'SELECTED' ? 'bg-white text-emerald-700 shadow-xs' : 'hover:text-slate-900'}`}
                        >
                          Aprovados ({importSummary.selectedCount})
                        </button>
                        {importSummary.duplicateCount > 0 && (
                          <button
                            type="button"
                            onClick={() => setImportFilterTab('DUPLICATES')}
                            className={`px-3 py-1 rounded-lg transition ${importFilterTab === 'DUPLICATES' ? 'bg-white text-amber-700 shadow-xs' : 'hover:text-slate-900'}`}
                          >
                            Duplicidades ({importSummary.duplicateCount})
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Tabela Interativa de Proposta e Aprovação Item por Item */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm border-collapse">
                      <thead>
                        <tr className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200 text-xs">
                          <th className="py-3 px-3 w-12 text-center">Status</th>
                          <th className="py-3 px-3 w-32">Data Compra</th>
                          <th className="py-3 px-3">Estabelecimento / Descrição</th>
                          <th className="py-3 px-3 w-28">Parcela</th>
                          <th className="py-3 px-3 w-32">Situação</th>
                          <th className="py-3 px-3 w-40">Categoria</th>
                          <th className="py-3 px-3 w-28">Escopo</th>
                          <th className="py-3 px-3 w-32">Membro</th>
                          <th className="py-3 px-4 text-right w-32">Valor (R$)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-xs">
                        {importPreviewData
                          .filter((item) => {
                            if (importFilterTab === 'SELECTED') return item.selected;
                            if (importFilterTab === 'DUPLICATES') return item.isDuplicate;
                            return true;
                          })
                          .map((item) => {
                            return (
                              <tr
                                key={item.id}
                                className={`transition-colors ${
                                  !item.selected
                                    ? 'bg-slate-50/50 opacity-60 hover:opacity-100'
                                    : item.isDuplicate
                                    ? 'bg-amber-50/50 hover:bg-amber-50/80 border-l-4 border-amber-400'
                                    : 'hover:bg-blue-50/30'
                                }`}
                              >
                                {/* Checkbox Aprovar */}
                                <td className="py-3 px-3 text-center">
                                  <input
                                    type="checkbox"
                                    checked={item.selected}
                                    onChange={() =>
                                      handleUpdateImportItem(item.id, { selected: !item.selected })
                                    }
                                    className="w-4 h-4 rounded text-blue-600 cursor-pointer focus:ring-blue-500"
                                    title={item.selected ? 'Aprovado para importar' : 'Ignorado (não será importado)'}
                                  />
                                </td>

                                {/* Data da Compra */}
                                <td className="py-3 px-3 whitespace-nowrap">
                                  <input
                                    type="date"
                                    value={item.purchaseDate || item.date}
                                    onChange={(e) =>
                                      handleUpdateImportItem(item.id, {
                                        date: e.target.value,
                                        purchaseDate: e.target.value,
                                        dateDisplay: formatDateBR(e.target.value),
                                      })
                                    }
                                    className="border border-slate-200 rounded-lg px-2 py-1 text-xs text-slate-700 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                                  />
                                  {importMetadata?.dueDate && (
                                    <span className="text-[10px] text-purple-600 block mt-0.5" title="Vencimento na fatura do cartão">
                                      Venc: {importMetadata.dueDate}
                                    </span>
                                  )}
                                </td>

                                {/* Descrição / Estabelecimento */}
                                <td className="py-3 px-3">
                                  <div className="space-y-1">
                                    <input
                                      type="text"
                                      value={item.description}
                                      onChange={(e) =>
                                        handleUpdateImportItem(item.id, { description: e.target.value })
                                      }
                                      className="w-full font-medium border border-slate-200 rounded-lg px-2 py-1 text-xs text-slate-900 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    />
                                    {item.categoryHint && (
                                      <span className="text-[10px] text-slate-400 block truncate" title={item.categoryHint}>
                                        Dica extrato: {item.categoryHint}
                                      </span>
                                    )}
                                    {item.isDuplicate && (
                                      <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded inline-flex items-center space-x-1">
                                        <AlertTriangle className="w-2.5 h-2.5 text-amber-600" />
                                        <span>Possível duplicidade no extrato</span>
                                      </span>
                                    )}
                                  </div>
                                </td>

                                {/* Parcela */}
                                <td className="py-3 px-3 whitespace-nowrap">
                                  {item.installmentCount ? (
                                    <div className="flex flex-col space-y-1">
                                      <div className="flex items-center space-x-1">
                                        <input
                                          type="number"
                                          min="1"
                                          max={item.installmentCount || 1}
                                          value={item.installmentNumber || 1}
                                          onChange={(e) =>
                                            handleUpdateImportItem(item.id, {
                                              installmentNumber: parseInt(e.target.value, 10) || 1,
                                            })
                                          }
                                          className="w-10 border border-slate-200 rounded px-1 py-0.5 text-center text-xs font-semibold"
                                        />
                                        <span className="text-slate-400">/</span>
                                        <input
                                          type="number"
                                          min="1"
                                          max="120"
                                          value={item.installmentCount || 1}
                                          onChange={(e) =>
                                            handleUpdateImportItem(item.id, {
                                              installmentCount: parseInt(e.target.value, 10) || 1,
                                            })
                                          }
                                          className="w-10 border border-slate-200 rounded px-1 py-0.5 text-center text-xs font-semibold"
                                        />
                                      </div>
                                      {item.installmentNumber < item.installmentCount && (
                                        <span
                                          className="text-[10px] bg-purple-100 text-purple-700 font-bold px-1.5 py-0.5 rounded text-center inline-block"
                                          title="As parcelas restantes dos meses seguintes serão agendadas automaticamente no sistema"
                                        >
                                          +{item.installmentCount - item.installmentNumber} futuras
                                        </span>
                                      )}
                                    </div>
                                  ) : (
                                    <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-semibold">
                                      À Vista
                                    </span>
                                  )}
                                </td>

                                {/* Situação: Comprometido vs Realizado */}
                                <td className="py-3 px-3 whitespace-nowrap">
                                  <select
                                    value={item.status || importDefaultStatus}
                                    onChange={(e) =>
                                      handleUpdateImportItem(item.id, { status: e.target.value })
                                    }
                                    className={`border rounded-lg px-2 py-1 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                                      (item.status || importDefaultStatus) === 'REALIZADO'
                                        ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                                        : 'bg-blue-50 text-blue-700 border-blue-300'
                                    }`}
                                  >
                                    <option value="COMPROMETIDO">Comprometido</option>
                                    <option value="REALIZADO">Realizado</option>
                                  </select>
                                </td>

                                {/* Categoria */}
                                <td className="py-3 px-3">
                                  <select
                                    value={item.categoryId || ''}
                                    onChange={(e) =>
                                      handleUpdateImportItem(item.id, { categoryId: e.target.value })
                                    }
                                    className="w-full border border-slate-200 rounded-lg px-2 py-1 text-xs text-slate-800 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                                  >
                                    {categories
                                      .filter((c) => !c.archived && c.type === 'EXPENSE')
                                      .map((cat) => (
                                        <option key={cat.id} value={cat.id}>
                                          {cat.name}
                                        </option>
                                      ))}
                                  </select>
                                </td>

                                {/* Escopo (Familiar vs Pessoal) */}
                                <td className="py-3 px-3 whitespace-nowrap">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleUpdateImportItem(item.id, {
                                        scope: item.scope === 'FAMILY' ? 'PERSONAL' : 'FAMILY',
                                      })
                                    }
                                    className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase transition ${
                                      item.scope === 'PERSONAL'
                                        ? 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                                        : 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                                    }`}
                                  >
                                    {item.scope === 'PERSONAL' ? 'Pessoal' : 'Familiar'}
                                  </button>
                                </td>

                                {/* Membro Familiar */}
                                <td className="py-3 px-3">
                                  <select
                                    value={item.ownerId || 'user-1'}
                                    onChange={(e) =>
                                      handleUpdateImportItem(item.id, { ownerId: e.target.value })
                                    }
                                    className="w-full border border-slate-200 rounded-lg px-2 py-1 text-xs text-slate-800 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                                  >
                                    {FAMILY_MEMBERS.filter((m) => m.id !== 'user-all').map((m) => (
                                      <option key={m.id} value={m.id}>
                                        {m.name.replace(/^[👑🏠👤]\s*/u, '')}
                                      </option>
                                    ))}
                                  </select>
                                </td>

                                {/* Valor */}
                                <td className="py-3 px-4 text-right font-bold whitespace-nowrap">
                                  <span className={item.amountCents < 0 ? 'text-emerald-600' : 'text-slate-900'}>
                                    {item.amountCents < 0 ? '+ ' : ''}
                                    {formatMoney(Math.abs(item.amountCents))}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Barra Fixa / Rodapé de Confirmação e Gravação */}
                <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="text-xs text-slate-500 text-center sm:text-left">
                    <span>Lançamentos selecionados: </span>
                    <strong className="text-slate-900 font-bold">
                      {importSummary.selectedCount} de {importPreviewData.length}
                    </strong>
                    <span className="mx-2">•</span>
                    <span>Total a gravar: </span>
                    <strong className="text-blue-700 font-bold text-sm">
                      {formatMoney(importSummary.selectedTotalCents)}
                    </strong>
                  </div>

                  <div className="flex items-center space-x-3 w-full sm:w-auto">
                    <button
                      type="button"
                      onClick={() => {
                        setImportPreviewData(null);
                        setImportMetadata(null);
                      }}
                      className="w-full sm:w-auto px-5 py-2.5 border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-semibold transition"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={handleConfirmImport}
                      disabled={importSummary.selectedCount === 0}
                      className="w-full sm:w-auto px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-sm transition active:scale-95 flex items-center justify-center space-x-1.5"
                    >
                      <Check className="w-4 h-4" />
                      <span>
                        Confirmar e Gravar {importSummary.selectedCount} Lançamento(s)
                      </span>
                    </button>
                  </div>
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

                <div className="p-3 bg-blue-50/70 border border-blue-100 rounded-xl space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-slate-800">
                      Teto Mensal do Envelope (Orçamento)
                    </label>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 bg-blue-100/80 px-2 py-0.5 rounded-full">
                      ✉️ Método dos Envelopes
                    </span>
                  </div>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-sm text-slate-500 font-bold">R$</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      name="budgetLimit"
                      defaultValue={modalState.data?.budgetLimitCents ? (modalState.data.budgetLimitCents / 100).toFixed(2) : ''}
                      placeholder="0,00 (Sem teto definido)"
                      className="w-full border border-slate-300 rounded-lg pl-9 pr-3 py-2 text-sm font-semibold text-slate-900 bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                  <p className="text-[11px] text-slate-600 leading-tight">
                    Destine um valor mensal para esta categoria (ex: 800 para Combustível). Conforme registrar compras na conta ou no cartão de crédito, o saldo disponível reduzirá automaticamente.
                  </p>
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
            {modalState.type === 'transaction' && (() => {
              const isActualRecurrence = Boolean(
                modalState.data?.recurrenceRuleId &&
                !String(modalState.data.recurrenceRuleId).startsWith('PURCHASE_DATE:') &&
                !String(modalState.data.recurrenceRuleId).startsWith('INVOICE_PAY:')
              );
              const remainingInstallmentsCount = formInstallments - formStartInstallment + 1;

              return (
              <form key={modalState.data?.id || modalState.mode || 'new'} onSubmit={handleSaveTransaction} className="p-6 space-y-4 overflow-y-auto">
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
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      {modalSourceType === 'CARD' ? 'Vencimento da Fatura' : 'Data Vencimento/Recebimento'}
                    </label>
                    <input
                      type="date"
                      name="date"
                      required
                      defaultValue={modalState.data?.dueDate || modalState.data?.date || new Date().toISOString().slice(0, 10)}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                </div>

                {modalSourceType === 'CARD' && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Data da Compra no Cartão</label>
                      <input
                        type="date"
                        name="purchaseDate"
                        defaultValue={modalState.data?.purchaseDate || modalState.data?.date || new Date().toISOString().slice(0, 10)}
                        className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>
                    <div className="flex items-center text-xs text-slate-500 pt-5">
                      <span>* O vencimento define o mês da fatura e se está em atraso.</span>
                    </div>
                  </div>
                )}

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
                {modalState.mode === 'edit' && (modalState.data?.installmentGroupId || isActualRecurrence) && (
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
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <label className="text-xs font-semibold text-slate-700">Parcelamento:</label>
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center space-x-1">
                          <span className="text-xs text-slate-500">Total de Parcelas:</span>
                          <input
                            type="number"
                            min="1"
                            max="72"
                            name="installments"
                            value={formInstallments}
                            onChange={(e) => {
                              const val = Math.max(1, parseInt(e.target.value) || 1);
                              setFormInstallments(val);
                              if (formStartInstallment > val) setFormStartInstallment(val);
                            }}
                            className="w-14 border border-slate-300 rounded px-2 py-1 text-xs text-center font-bold"
                          />
                        </div>

                        {formInstallments > 1 && (
                          <div className="flex items-center space-x-1">
                            <span className="text-xs text-slate-500">Começar na:</span>
                            <input
                              type="number"
                              min="1"
                              max={formInstallments}
                              name="startInstallment"
                              value={formStartInstallment}
                              onChange={(e) => {
                                const val = Math.min(formInstallments, Math.max(1, parseInt(e.target.value) || 1));
                                setFormStartInstallment(val);
                              }}
                              className="w-12 border border-blue-400 bg-blue-50 text-blue-900 rounded px-1.5 py-1 text-xs text-center font-bold"
                            />
                            <span className="text-xs text-slate-500">ª parcela</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {formInstallments > 1 && formStartInstallment > 1 && (
                      <div className="p-2.5 bg-amber-50/90 border border-amber-200 rounded-lg text-xs text-amber-900 flex items-start space-x-2">
                        <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                        <div className="leading-snug">
                          <strong className="block font-bold">Parcelamento em andamento ({formStartInstallment}ª a {formInstallments}ª)</strong>
                          <span className="text-[11px] text-amber-800">
                            Serão geradas apenas as <strong>{remainingInstallmentsCount} parcelas restantes</strong> (da {String(formStartInstallment).padStart(2, '0')}/{String(formInstallments).padStart(2, '0')} até {String(formInstallments).padStart(2, '0')}/{String(formInstallments).padStart(2, '0')}). As parcelas 1 a {formStartInstallment - 1} não serão criadas.
                          </span>
                        </div>
                      </div>
                    )}

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
                              {formStartInstallment > 1 ? 'A lançar agora:' : 'Total final:'}{' '}
                              <strong className="text-slate-900 font-bold">
                                {installmentValueMode === 'TOTAL'
                                  ? (formStartInstallment > 1
                                      ? formatMoney(Math.floor(Math.round((parseFloat(formAmount) || 0) * 100) / formInstallments) * remainingInstallmentsCount)
                                      : formatMoney(Math.round((parseFloat(formAmount) || 0) * 100)))
                                  : formatMoney(Math.round((parseFloat(formAmount) || 0) * 100) * (formStartInstallment > 1 ? remainingInstallmentsCount : formInstallments))}
                              </strong>
                              {formStartInstallment > 1 && (
                                <span className="text-[10px] text-slate-400 block font-normal sm:inline sm:ml-1">
                                  ({remainingInstallmentsCount} parcelas de {formInstallments})
                                </span>
                              )}
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                  </div>
                )}

                {/* Bloco de Recorrência (Repetir mensalmente) */}
                {((modalState.mode === 'create' && formInstallments === 1) ||
                  (modalState.mode === 'edit' && !modalState.data?.installmentGroupId && !isActualRecurrence)) && (
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        name="isRecurring"
                        id="isRecurring"
                        checked={formIsRecurring}
                        onChange={(e) => setFormIsRecurring(e.target.checked)}
                        className="rounded text-blue-600 focus:ring-blue-500"
                      />
                      <label htmlFor="isRecurring" className="text-xs font-semibold text-slate-800 flex items-center space-x-1.5 cursor-pointer select-none">
                        <RefreshCw className="w-3.5 h-3.5 text-blue-600" />
                        <span>Repetir mensalmente (Despesa / Receita Recorrente)</span>
                      </label>
                    </div>

                    {formIsRecurring && (
                      <div className="p-3 bg-blue-50/80 border border-blue-200 rounded-xl space-y-2 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-blue-950">Horizonte de repetição:</span>
                          <select
                            name="recurringHorizon"
                            value={formRecurringMonths}
                            onChange={(e) => setFormRecurringMonths(parseInt(e.target.value, 10))}
                            className="border border-blue-300 rounded-lg px-2.5 py-1 text-xs font-bold bg-white text-blue-900 shadow-2xs"
                          >
                            <option value="12">12 meses (1 ano)</option>
                            <option value="24">24 meses (2 anos)</option>
                            <option value="36">36 meses (3 anos)</option>
                          </select>
                        </div>
                        <p className="text-[11px] text-blue-700 leading-tight">
                          {modalSourceType === 'CARD'
                            ? 'Gera as repetições mensais na fatura do cartão (ex: assinaturas, streamings, internet). Cada repetição será agendada para a fatura do mês seguinte.'
                            : 'Gera as repetições mensais para planejar contas fixas (ex: luz, água, aluguel). Você poderá editar ou excluir lançamentos individuais ou futuros em cascata a qualquer momento.'}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                  {modalState.mode === 'edit' && modalState.data?.status === 'COMPROMETIDO' && (
                    <button
                      type="button"
                      onClick={() => {
                        handleQuickPayTransaction(modalState.data, 'REALIZADO');
                        setModalState({ isOpen: false, type: null, mode: 'create', data: null });
                      }}
                      className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-semibold flex items-center space-x-1.5 shadow-xs transition active:scale-95"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>
                        {modalState.data?.cardId
                          ? 'Pagar Fatura deste Cartão'
                          : modalState.data?.type === 'INCOME'
                          ? 'Confirmar Recebimento Agora'
                          : 'Quitar / Marcar como Pago Agora'}
                      </span>
                    </button>
                  )}
                  <div className="flex space-x-2 ml-auto">
                    <button
                      type="button"
                      onClick={() => setModalState({ isOpen: false, type: null, mode: 'create', data: null })}
                      className="px-4 py-2 border border-slate-300 rounded-lg text-sm text-slate-700 hover:bg-slate-50"
                    >
                      Cancelar
                    </button>
                    <button type="submit" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold">
                      {modalState.mode === 'create' ? 'Salvar Lançamento' : 'Atualizar Lançamento'}
                    </button>
                  </div>
                </div>
              </form>
            );
          })()}
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

        const pastOnlyCount = transactions.filter((t) => {
          if (tx.installmentGroupId && t.installmentGroupId === tx.installmentGroupId) {
            return (t.installmentNumber || 0) < (tx.installmentNumber || 0);
          }
          if (tx.recurrenceRuleId && t.recurrenceRuleId === tx.recurrenceRuleId) {
            return t.date < tx.date;
          }
          return false;
        }).length;

        const pastInclusiveCount = transactions.filter((t) => {
          if (tx.installmentGroupId && t.installmentGroupId === tx.installmentGroupId) {
            return (t.installmentNumber || 0) <= (tx.installmentNumber || 0);
          }
          if (tx.recurrenceRuleId && t.recurrenceRuleId === tx.recurrenceRuleId) {
            return t.date <= tx.date;
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
            : deleteModalState.scope === 'past_only'
            ? pastOnlyCount
            : deleteModalState.scope === 'past_inclusive'
            ? pastInclusiveCount
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
                        Data: {formatDateBR(tx.date)}
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

                      {pastOnlyCount > 0 && (
                        <label
                          className={`flex items-start space-x-2.5 p-2.5 rounded-lg border cursor-pointer transition ${
                            deleteModalState.scope === 'past_only'
                              ? 'bg-white border-rose-500 shadow-xs ring-1 ring-rose-500'
                              : 'bg-white/60 border-slate-200 hover:bg-white'
                          }`}
                        >
                          <input
                            type="radio"
                            name="deleteScopeRadio"
                            value="past_only"
                            checked={deleteModalState.scope === 'past_only'}
                            onChange={() => setDeleteModalState((prev) => ({ ...prev, scope: 'past_only' }))}
                            className="mt-0.5 text-rose-600 focus:ring-rose-500"
                          />
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-slate-800">Apenas parcelas anteriores</span>
                              <span className="text-[10px] font-bold px-1.5 py-0.5 bg-rose-50 text-rose-700 rounded">
                                {pastOnlyCount} {pastOnlyCount === 1 ? 'lançamento' : 'lançamentos'}
                              </span>
                            </div>
                            <span className="text-[11px] text-slate-500 block mt-0.5">
                              {tx.installmentGroupId
                                ? `Exclui as ${pastOnlyCount} parcela(s) anteriores (1 a ${Math.max(1, (tx.installmentNumber || 1) - 1)}). Mantém esta parcela ${tx.installmentNumber || ''} e as futuras ativas.`
                                : 'Exclui as repetições passadas anteriores a esta data.'}
                            </span>
                          </div>
                        </label>
                      )}

                      {pastInclusiveCount > 1 && (
                        <label
                          className={`flex items-start space-x-2.5 p-2.5 rounded-lg border cursor-pointer transition ${
                            deleteModalState.scope === 'past_inclusive'
                              ? 'bg-white border-rose-500 shadow-xs ring-1 ring-rose-500'
                              : 'bg-white/60 border-slate-200 hover:bg-white'
                          }`}
                        >
                          <input
                            type="radio"
                            name="deleteScopeRadio"
                            value="past_inclusive"
                            checked={deleteModalState.scope === 'past_inclusive'}
                            onChange={() => setDeleteModalState((prev) => ({ ...prev, scope: 'past_inclusive' }))}
                            className="mt-0.5 text-rose-600 focus:ring-rose-500"
                          />
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-slate-800">Deste lançamento para trás</span>
                              <span className="text-[10px] font-bold px-1.5 py-0.5 bg-rose-50 text-rose-700 rounded">
                                {pastInclusiveCount} {pastInclusiveCount === 1 ? 'lançamento' : 'lançamentos'}
                              </span>
                            </div>
                            <span className="text-[11px] text-slate-500 block mt-0.5">
                              {tx.installmentGroupId
                                ? `Exclui desde a parcela 1 até esta parcela (${tx.installmentNumber || ''}). Mantém apenas as parcelas seguintes.`
                                : 'Exclui esta repetição e todas as anteriores.'}
                            </span>
                          </div>
                        </label>
                      )}

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

      {/* Modal de Pagamento de Fatura de Cartão de Crédito */}
      {invoicePaymentModal.isOpen && invoicePaymentModal.card && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-4 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Pagamento de Fatura do Cartão</h3>
                  <p className="text-xs text-slate-500">
                    {invoicePaymentModal.card.name} • Competência: {formatMonthLabel(invoicePaymentModal.monthKey)}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() =>
                  setInvoicePaymentModal({
                    isOpen: false,
                    card: null,
                    monthKey: '',
                    totalCents: 0,
                    monthItems: [],
                    dueDateIso: '',
                  })
                }
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmInvoicePayment} className="space-y-4 pt-4">
              {/* Box resumo da fatura */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500">Total da Fatura:</span>
                  <span className="text-base font-bold text-slate-900">
                    {formatMoney(invoicePaymentModal.totalCents)}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500">Vencimento da Fatura:</span>
                  <span className="font-semibold text-slate-700">
                    {formatDateBR(invoicePaymentModal.dueDateIso)}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500">Lançamentos Vinculados:</span>
                  <span className="font-semibold text-slate-700">
                    {invoicePaymentModal.monthItems.length} compras / parcelas
                  </span>
                </div>
              </div>

              {/* Conta Bancária para Débito */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Conta Bancária para Débito do Pagamento *
                </label>
                <select
                  name="accountId"
                  required
                  defaultValue={accounts[0]?.id || ''}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  {accounts.length === 0 ? (
                    <option value="">Nenhuma conta cadastrada</option>
                  ) : (
                    accounts.map((acc) => (
                      <option key={acc.id} value={acc.id}>
                        {acc.name} ({acc.bank}) — Saldo Atual: {formatMoney(accountBalances[acc.id] || 0)}
                      </option>
                    ))
                  )}
                </select>
              </div>

              {/* Data e Valor do Pagamento */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Data do Pagamento *
                  </label>
                  <input
                    type="date"
                    name="paymentDate"
                    required
                    defaultValue={new Date().toISOString().slice(0, 10)}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Valor Pago (R$) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    name="paidAmount"
                    required
                    defaultValue={(invoicePaymentModal.totalCents / 100).toFixed(2)}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>
              <p className="text-[11px] text-slate-400">
                * Por padrão, traz o valor total da fatura. Você pode informar um valor menor para registrar um pagamento parcial.
              </p>

              {/* Descrição do Pagamento */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Descrição / Identificação do Pagamento
                </label>
                <input
                  type="text"
                  name="description"
                  defaultValue={`Pagamento Fatura ${invoicePaymentModal.card.name} (${formatMonthLabel(invoicePaymentModal.monthKey)})`}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl text-xs text-emerald-800 space-y-1">
                <p className="font-semibold">Ao confirmar o pagamento:</p>
                <ul className="list-disc list-inside space-y-0.5 text-[11px]">
                  <li>O valor informado será debitado da conta bancária selecionada.</li>
                  <li>Todos os {invoicePaymentModal.monthItems.length} lançamentos desta fatura serão marcados como <strong>Realizado</strong>.</li>
                  <li>A fatura passará para a situação <strong>Paga</strong>.</li>
                </ul>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() =>
                    setInvoicePaymentModal({
                      isOpen: false,
                      card: null,
                      monthKey: '',
                      totalCents: 0,
                      monthItems: [],
                      dueDateIso: '',
                    })
                  }
                  className="px-4 py-2 border border-slate-300 rounded-xl text-sm text-slate-700 hover:bg-slate-50 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold transition active:scale-95 shadow-sm"
                >
                  Confirmar Pagamento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Exclusão de Toda uma Fatura e Compras Vinculadas */}
      {deleteInvoiceModalState.isOpen && deleteInvoiceModalState.card && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-4 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-rose-50 text-rose-600 rounded-xl">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Excluir Toda a Fatura</h3>
                  <p className="text-xs text-slate-500">
                    {deleteInvoiceModalState.card.name} • Competência: {formatMonthLabel(deleteInvoiceModalState.monthKey)}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() =>
                  setDeleteInvoiceModalState({
                    isOpen: false,
                    card: null,
                    monthKey: '',
                    items: [],
                    paymentTx: null,
                    totalCents: 0,
                    includeFutureInstallments: false,
                  })
                }
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 pt-4">
              <div className="p-4 bg-rose-50/70 border border-rose-200 rounded-xl space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-rose-700">Total da Fatura:</span>
                  <span className="text-base font-bold text-rose-900">
                    {formatMoney(deleteInvoiceModalState.totalCents)}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-rose-700">Lançamentos Vinculados:</span>
                  <span className="font-semibold text-rose-900">
                    {deleteInvoiceModalState.items.length} compras / parcelas neste mês
                  </span>
                </div>
                {deleteInvoiceModalState.paymentTx && (
                  <div className="text-[11px] text-rose-800 font-medium bg-rose-100/60 p-2 rounded-lg">
                    ⚠️ Esta fatura possui um pagamento registrado no valor de {formatMoney(deleteInvoiceModalState.paymentTx.amountCents)}. O lançamento do pagamento também será excluído.
                  </div>
                )}
              </div>

              <div className="text-xs text-slate-600 space-y-2">
                <p>
                  Esta ação excluirá <strong>todos os {deleteInvoiceModalState.items.length} lançamentos</strong> pertencentes a esta fatura de <strong>{formatMonthLabel(deleteInvoiceModalState.monthKey)}</strong>.
                </p>
              </div>

              {/* Opção para parcelas futuras / recorrências */}
              {deleteInvoiceModalState.items.some((i) => i.installmentGroupId || i.recurrenceRuleId) && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-2">
                  <label className="flex items-start space-x-2.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={deleteInvoiceModalState.includeFutureInstallments}
                      onChange={(e) =>
                        setDeleteInvoiceModalState((prev) => ({
                          ...prev,
                          includeFutureInstallments: e.target.checked,
                        }))
                      }
                      className="mt-0.5 rounded text-rose-600 focus:ring-rose-500"
                    />
                    <div className="text-xs">
                      <span className="font-bold text-amber-950 block">
                        Excluir também parcelas futuras e repetições vinculadas
                      </span>
                      <span className="text-[11px] text-amber-800 leading-tight block mt-0.5">
                        Algumas compras desta fatura fazem parte de parcelamentos ou repetições. Marque para apagar também as parcelas dos meses futuros geradas por elas.
                      </span>
                    </div>
                  </label>
                </div>
              )}

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() =>
                    setDeleteInvoiceModalState({
                      isOpen: false,
                      card: null,
                      monthKey: '',
                      items: [],
                      paymentTx: null,
                      totalCents: 0,
                      includeFutureInstallments: false,
                    })
                  }
                  className="px-4 py-2 border border-slate-300 rounded-xl text-sm text-slate-700 hover:bg-slate-50 transition"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDeleteInvoice}
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-sm font-semibold transition active:scale-95 shadow-sm flex items-center space-x-1.5"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Confirmar Exclusão da Fatura</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Informativo para Quitação de Lançamentos de Cartão */}
      {cardPaymentPromptModal.isOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-100">
            <div className="flex items-start space-x-3">
              <div className="p-2.5 bg-purple-50 text-purple-600 rounded-xl">
                <CreditCard className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-bold text-slate-900">
                  Pagamento de Despesa no Cartão
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Lançamento vinculado à fatura de cartão de crédito
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  setCardPaymentPromptModal({
                    isOpen: false,
                    transaction: null,
                    card: null,
                    monthKey: '',
                    dueDateIso: '',
                  })
                }
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 space-y-3">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-500">Lançamento:</span>
                  <span className="font-semibold text-slate-800">
                    {cardPaymentPromptModal.transaction?.description}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Valor:</span>
                  <span className="font-bold text-slate-900">
                    {formatMoney(cardPaymentPromptModal.transaction?.amountCents || 0)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Cartão:</span>
                  <span className="font-semibold text-purple-700">
                    {cardPaymentPromptModal.card?.name}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Vencimento da Fatura:</span>
                  <span className="font-semibold text-slate-800">
                    {formatDateBR(cardPaymentPromptModal.dueDateIso)}
                  </span>
                </div>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                Compras no cartão de crédito não são debitadas individualmente de uma conta bancária. Elas são quitadas através do <strong>pagamento da fatura consolidada</strong> do mês correspondente.
              </p>
            </div>

            <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row gap-2 justify-end">
              <button
                type="button"
                onClick={() =>
                  setCardPaymentPromptModal({
                    isOpen: false,
                    transaction: null,
                    card: null,
                    monthKey: '',
                    dueDateIso: '',
                  })
                }
                className="px-4 py-2 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-700 hover:bg-slate-50 transition"
              >
                Fechar
              </button>
              <button
                type="button"
                onClick={() => {
                  const card = cardPaymentPromptModal.card;
                  const monthKey = cardPaymentPromptModal.monthKey;
                  setCardPaymentPromptModal({
                    isOpen: false,
                    transaction: null,
                    card: null,
                    monthKey: '',
                    dueDateIso: '',
                  });
                  openInvoicePaymentModal(card, monthKey);
                }}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs sm:text-sm font-semibold transition active:scale-95 shadow-sm flex items-center justify-center space-x-1.5"
              >
                <CreditCard className="w-4 h-4" />
                <span>Pagar Fatura deste Cartão</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Autenticação e Gestão de Perfis */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />
    </div>
  );
}