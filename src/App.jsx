import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import {
  Wallet,
  CreditCard,
  Tags,
  ArrowUpRight,
  ArrowDownRight,
  ArrowRight,
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
  Mail,
  MoreHorizontal,
  Eye,
  EyeOff,
  Info
} from 'lucide-react';
import { parseInvoicePdf } from './services/pdfParser';
import AuthModal from './components/AuthModal';
import AIChatDrawer from './components/AIChatDrawer';
import Navbar from './components/layout/Navbar';
import DashboardTab from './components/dashboard/DashboardTab';
import TransactionsTab from './components/transactions/TransactionsTab';
import AccountsTab from './components/accounts/AccountsTab';
import CardsInvoicesTab from './components/cards/CardsInvoicesTab';
import EnvelopesTab from './components/envelopes/EnvelopesTab';
import CategoriesTab from './components/categories/CategoriesTab';
import ProjectionsTab from './components/projections/ProjectionsTab';
import ScenariosTab from './components/scenarios/ScenariosTab';
import ChartsTab from './components/charts/ChartsTab';
import ImportTab from './components/import/ImportTab';
import ExportsTab from './components/exports/ExportsTab';
import EntityModal from './components/modals/EntityModal';
import TransactionModal from './components/modals/TransactionModal';
import { DeleteTransactionModal, DeleteInvoiceModal } from './components/modals/DeleteModals';
import { InvoicePaymentModal, CardPaymentPromptModal } from './components/modals/InvoicePaymentModal';
import { EnvelopeScheduleModal, DeleteEnvelopeModal, CategoryConflictModal } from './components/modals/EnvelopeModals';
import {
  formatMoney,
  formatDateBR,
  calculateCardDueDate,
  addMonthsToIso,
  getTxDueDate,
  isTxOverdue,
  formatMonthLabel,
  setGlobalPrivacyActive,
} from './utils/formatters';
import { FAMILY_MEMBERS, DEFAULT_CATEGORIES } from './data/constants';

import {
  loadInitialAppData,
  syncItem,
  syncBatchTransactions,
  syncBatchMonthlyEnvelopes,
  saveToLocalStorage,
  clearDemoDataOnly,
  resetEntireSystem,
  loadDemoPresentationData,
  healMigratedInvoiceTransactions,
  markCategoryPending,
  clearCategoryPending,
  markTransactionPending,
  clearTransactionPending,
  getPendingTransactions,
  isDemoMode,
  clearDemoSandbox,
  STORAGE_KEYS,
} from './services/financeService';
import {
  DEMO_ACCOUNTS,
  DEMO_CARDS,
  DEMO_CATEGORIES,
  DEMO_TRANSACTIONS,
  DEMO_SCENARIOS,
  DEMO_MONTHLY_ENVELOPES,
} from './data/demoData';
import {
  signOutUser,
  isSupabaseConfigured,
  supabase,
  getUserProfile,
  subscribeToCloudChanges,
} from './services/supabase';

export default function App() {
  // Detecção e Estado do Modo Demonstração (Sandbox 100% em Memória/Sessão)
  const [isDemoModeState, setIsDemoModeState] = useState(() => {
    const demo = isDemoMode();
    if (demo && typeof window !== 'undefined') {
      try {
        sessionStorage.setItem('financas_is_demo', 'true');
      } catch {}
    }
    return demo;
  });

  // Estado do Modo Privacidade ("Olho Mágico") com persistência no LocalStorage
  const [isPrivacyMode, setIsPrivacyMode] = useState(() => {
    try {
      const active = localStorage.getItem('financas_privacy_mode') === 'true';
      setGlobalPrivacyActive(active);
      return active;
    } catch {
      return false;
    }
  });

  // Mantém a flag global de formatação monetária sincronizada com o estado
  useEffect(() => {
    setGlobalPrivacyActive(isPrivacyMode);
  }, [isPrivacyMode]);

  const togglePrivacyMode = () => {
    setIsPrivacyMode((prev) => {
      const next = !prev;
      setGlobalPrivacyActive(next);
      try {
        localStorage.setItem('financas_privacy_mode', String(next));
      } catch (e) {
        console.warn('Erro ao salvar preferência de privacidade:', e);
      }
      return next;
    });
  };

  // Estado Principal (No modo real inicia limpo; no modo demo inicia com dados ricos em memória)
  const [activeTab, setActiveTab] = useState('dashboard');
  const [currentMemberId, setCurrentMemberId] = useState('user-all');

  const [accounts, setAccounts] = useState(() => {
    try {
      if (isDemoMode()) {
        const stored = sessionStorage.getItem('demo_' + STORAGE_KEYS.accounts);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
        return DEMO_ACCOUNTS;
      }
      const stored = localStorage.getItem(STORAGE_KEYS.accounts);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return isDemoMode() ? DEMO_ACCOUNTS : [];
    }
  });
  const [cards, setCards] = useState(() => {
    try {
      if (isDemoMode()) {
        const stored = sessionStorage.getItem('demo_' + STORAGE_KEYS.cards);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
        return DEMO_CARDS;
      }
      const stored = localStorage.getItem(STORAGE_KEYS.cards);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return isDemoMode() ? DEMO_CARDS : [];
    }
  });
  const [categories, setCategories] = useState(() => {
    try {
      if (isDemoMode()) {
        const stored = sessionStorage.getItem('demo_' + STORAGE_KEYS.categories);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
        return DEMO_CATEGORIES;
      }
      const stored = localStorage.getItem(STORAGE_KEYS.categories);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // ignore
    }
    return isDemoMode() ? DEMO_CATEGORIES : DEFAULT_CATEGORIES;
  });
  const [transactions, setTransactions] = useState(() => {
    try {
      if (isDemoMode()) {
        const stored = sessionStorage.getItem('demo_' + STORAGE_KEYS.transactions);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
        return DEMO_TRANSACTIONS;
      }
      const stored = localStorage.getItem(STORAGE_KEYS.transactions);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return isDemoMode() ? DEMO_TRANSACTIONS : [];
    }
  });
  const [scenarios, setScenarios] = useState(() => {
    try {
      if (isDemoMode()) {
        const stored = sessionStorage.getItem('demo_' + STORAGE_KEYS.scenarios);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
        return DEMO_SCENARIOS;
      }
      const stored = localStorage.getItem(STORAGE_KEYS.scenarios);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return isDemoMode() ? DEMO_SCENARIOS : [];
    }
  });
  const [monthlyEnvelopes, setMonthlyEnvelopes] = useState(() => {
    try {
      if (isDemoMode()) {
        const stored = sessionStorage.getItem('demo_' + STORAGE_KEYS.monthlyEnvelopes);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
        return DEMO_MONTHLY_ENVELOPES;
      }
      const local = localStorage.getItem(STORAGE_KEYS.monthlyEnvelopes);
      return local ? JSON.parse(local) : [];
    } catch {
      return isDemoMode() ? DEMO_MONTHLY_ENVELOPES : [];
    }
  });

  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);

  const [envelopeModalState, setEnvelopeModalState] = useState({
    isOpen: false,
    mode: 'create',
    category: null,
    monthKey: '',
    existingEnvelope: null,
    scope: 'all',
  });

  const [deleteEnvelopeModalState, setDeleteEnvelopeModalState] = useState({
    isOpen: false,
    envelope: null,
    scope: 'this_only',
  });

  // Modal de validação e conflito de teto de envelopes (Pai vs Subcategoria)
  const [categoryConflictModal, setCategoryConflictModal] = useState({
    isOpen: false,
    childName: '',
    parentName: '',
    parentId: '',
    childId: '',
    childAttemptedCents: 0,
    currentSiblingsSum: 0,
    parentCurrentCents: 0,
    suggestedParentCents: 0,
    maxAvailableChildCents: 0,
    pendingCatData: null,
  });

  // Controle de Nuvem e Sessão de Usuário
  const [isCloudConnected, setIsCloudConnected] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isAIChatOpen, setIsAIChatOpen] = useState(false);
  const [isSubmittingTx, setIsSubmittingTx] = useState(false);
  const isSavingRef = useRef(false);
  const cloudSyncCooldownUntilRef = useRef(0);
  const recentlyDeletedTxIdsRef = useRef(new Set());
  const [currentUser, setCurrentUser] = useState(() => {
    if (isDemoMode()) {
      return {
        id: 'demo-user-1',
        name: 'Família Silva (Demo)',
        email: 'demo@financasdafamilia.app',
        role: 'admin',
        memberKey: 'user-all',
      };
    }
    try {
      const saved = localStorage.getItem('financas_session');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Restaurar sessão do Supabase Auth caso exista (ignorado em modo demonstração)
  useEffect(() => {
    if (isDemoModeState || isDemoMode()) return;
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
  }, [isDemoModeState]);

  // Função unificada para carregar e sincronizar dados da nuvem
  const reloadDataFromCloud = useCallback(async () => {
    if (isDemoModeState || isDemoMode()) {
      return;
    }
    // Evita sobrescrever edições locais em andamento ou durante período de carência (cooldown)
    if (isSavingRef.current || Date.now() < cloudSyncCooldownUntilRef.current) {
      return;
    }

    try {
      const res = await loadInitialAppData({
        categories: DEFAULT_CATEGORIES,
      });
      if (res) {
        setIsCloudConnected(res.isCloud);
        if (res.accounts) setAccounts(res.accounts);
        if (res.cards) setCards(res.cards);
        if (res.categories) setCategories(res.categories);
        if (res.transactions) {
          const activeCards = res.cards || [];
          // Ignora da nuvem transações que foram excluídas recentemente no cliente local (evita que roundtrip ressuscite itens)
          const nonDeletedResTxs = res.transactions.filter(
            (t) => !recentlyDeletedTxIdsRef.current.has(t.id)
          );
          const { healedTransactions, hasChanges, changedTxs } = healMigratedInvoiceTransactions(nonDeletedResTxs, activeCards);
          const changedMap = new Map(changedTxs.map((t) => [t.id, t]));
          
          // Preserva edições locais recentes e pendentes para evitar race conditions com o Supabase
          setTransactions((prevLocalTxs) => {
            const pendingTxIds = new Set(getPendingTransactions());
            const localMap = new Map((prevLocalTxs || []).map((t) => [t.id, t]));
            const now = Date.now();
            const merged = healedTransactions
              .filter((cloudTx) => !recentlyDeletedTxIdsRef.current.has(cloudTx.id))
              .map((cloudTx) => {
                // Se a transação foi corrigida por cura, a versão curada tem precedência sobre o cache local antigo
                if (changedMap.has(cloudTx.id)) {
                  return cloudTx;
                }
                const localTx = localMap.get(cloudTx.id);
                if (localTx) {
                  const isPending = pendingTxIds.has(localTx.id);
                  const isRecent = localTx._localUpdatedAt && (now - localTx._localUpdatedAt < 15000);
                  if (isPending || isRecent) {
                    return { ...cloudTx, ...localTx };
                  }
                }
                return cloudTx;
              });

            // Preserva transações locais que ainda não foram sincronizadas com a nuvem (exceto as deletadas recentemente)
            const cloudIds = new Set(healedTransactions.map((t) => t.id));
            (prevLocalTxs || []).forEach((lt) => {
              if (
                !cloudIds.has(lt.id) &&
                !recentlyDeletedTxIdsRef.current.has(lt.id) &&
                (pendingTxIds.has(lt.id) || (lt._localUpdatedAt && now - lt._localUpdatedAt < 60000))
              ) {
                merged.push(lt);
              }
            });

            saveToLocalStorage(STORAGE_KEYS.transactions, merged);
            return merged;
          });

          if (hasChanges && changedTxs.length > 0) {
            syncBatchTransactions(changedTxs).catch(console.warn);
          }
        }
        if (res.scenarios) setScenarios(res.scenarios);
        if (res.monthlyEnvelopes) setMonthlyEnvelopes(res.monthlyEnvelopes);
      }
    } catch (err) {
      console.warn('Erro ao recarregar dados da nuvem:', err);
    }
  }, [isDemoModeState]);

  // 1. Carregamento inicial de dados (ignorado no modo demo pois os dados já estão em memória)
  useEffect(() => {
    if (isDemoModeState || isDemoMode()) return;
    reloadDataFromCloud();
  }, [currentUser, reloadDataFromCloud, isDemoModeState]);

  // Auto-cura preventiva de parcelas de cartão com competência distorcida ao carregar a aplicação
  useEffect(() => {
    if (cards.length > 0 && transactions.length > 0) {
      const { healedTransactions, hasChanges, changedTxs } = healMigratedInvoiceTransactions(transactions, cards);
      if (hasChanges && changedTxs.length > 0) {
        console.log(`[Auto-Repair] Reparadas ${changedTxs.length} parcelas de cartão com competência incorreta.`);
        setTransactions(healedTransactions);
        saveToLocalStorage(STORAGE_KEYS.transactions, healedTransactions);
        if (isSupabaseConfigured() && supabase && !isDemoMode() && !isDemoModeState) {
          syncBatchTransactions(changedTxs).catch(console.warn);
        }
      }
    }
  }, [cards]);

  // 2. Sincronização multi-dispositivo automática: ao trocar de aba ou desbloquear o celular (ignorado em modo demo)
  useEffect(() => {
    if (isDemoModeState || isDemoMode() || !isSupabaseConfigured() || !supabase) return;

    let lastSyncTime = Date.now();
    const handleVisibilityOrFocus = () => {
      if (document.visibilityState === 'visible') {
        const now = Date.now();
        // Não recarrega se houver salvamento local recente ou ativo
        if (now < cloudSyncCooldownUntilRef.current || isSavingRef.current) {
          return;
        }
        // Debounce de 3 segundos para evitar re-fetch repetitivo
        if (now - lastSyncTime > 3000) {
          lastSyncTime = now;
          reloadDataFromCloud();
        }
      }
    };

    window.addEventListener('focus', handleVisibilityOrFocus);
    document.addEventListener('visibilitychange', handleVisibilityOrFocus);

    // 3. Inscrição em Realtime para atualizações instantâneas entre aparelhos
    let debounceTimer = null;
    const channel = subscribeToCloudChanges(() => {
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        if (!isSavingRef.current && Date.now() >= cloudSyncCooldownUntilRef.current) {
          reloadDataFromCloud();
        }
      }, 1000);
    });

    return () => {
      window.removeEventListener('focus', handleVisibilityOrFocus);
      document.removeEventListener('visibilitychange', handleVisibilityOrFocus);
      if (debounceTimer) clearTimeout(debounceTimer);
      if (channel) supabase.removeChannel(channel);
    };
  }, [reloadDataFromCloud, isDemoModeState]);

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

  // Sair do Modo Demonstração e restaurar a aplicação normal
  const handleExitDemo = () => {
    clearDemoSandbox();
    try {
      sessionStorage.removeItem('financas_is_demo');
    } catch {}
    window.location.href = window.location.pathname === '/demo' ? '/' : (window.location.pathname || '/');
  };

  // Restaurar dados padrão da demonstração (reset do sandbox em memória)
  const handleResetDemoSandbox = () => {
    if (confirm('Deseja restaurar os dados originais da demonstração? Suas alterações de teste nesta sessão serão resetadas.')) {
      clearDemoSandbox();
      try {
        sessionStorage.setItem('financas_is_demo', 'true');
      } catch {}
      saveToLocalStorage(STORAGE_KEYS.accounts, DEMO_ACCOUNTS);
      saveToLocalStorage(STORAGE_KEYS.cards, DEMO_CARDS);
      saveToLocalStorage(STORAGE_KEYS.categories, DEMO_CATEGORIES);
      saveToLocalStorage(STORAGE_KEYS.transactions, DEMO_TRANSACTIONS);
      saveToLocalStorage(STORAGE_KEYS.scenarios, DEMO_SCENARIOS);
      saveToLocalStorage(STORAGE_KEYS.monthlyEnvelopes, DEMO_MONTHLY_ENVELOPES);
      setAccounts(DEMO_ACCOUNTS);
      setCards(DEMO_CARDS);
      setCategories(DEMO_CATEGORIES);
      setTransactions(DEMO_TRANSACTIONS);
      setScenarios(DEMO_SCENARIOS);
      setMonthlyEnvelopes(DEMO_MONTHLY_ENVELOPES);
      alert('Dados de demonstração restaurados para o padrão com sucesso!');
    }
  };

  // Ativar Modo Demonstração Seguro
  const handleEnterDemoMode = () => {
    try {
      sessionStorage.setItem('financas_is_demo', 'true');
    } catch {}
    saveToLocalStorage(STORAGE_KEYS.accounts, DEMO_ACCOUNTS);
    saveToLocalStorage(STORAGE_KEYS.cards, DEMO_CARDS);
    saveToLocalStorage(STORAGE_KEYS.categories, DEMO_CATEGORIES);
    saveToLocalStorage(STORAGE_KEYS.transactions, DEMO_TRANSACTIONS);
    saveToLocalStorage(STORAGE_KEYS.scenarios, DEMO_SCENARIOS);
    saveToLocalStorage(STORAGE_KEYS.monthlyEnvelopes, DEMO_MONTHLY_ENVELOPES);

    setIsDemoModeState(true);
    setAccounts(DEMO_ACCOUNTS);
    setCards(DEMO_CARDS);
    setCategories(DEMO_CATEGORIES);
    setTransactions(DEMO_TRANSACTIONS);
    setScenarios(DEMO_SCENARIOS);
    setMonthlyEnvelopes(DEMO_MONTHLY_ENVELOPES);
    setCurrentUser({
      id: 'demo-user-1',
      name: 'Família Silva (Demo)',
      email: 'demo@financasdafamilia.app',
      role: 'admin',
      memberKey: 'user-all',
    });
    setCurrentMemberId('user-all');
    setActiveTab('dashboard');

    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      if (url.searchParams.get('demo') !== 'true') {
        url.searchParams.set('demo', 'true');
        window.history.pushState(null, '', url.toString());
      }
    }
  };

  // Carregar modo de demonstração sob demanda para apresentar a aplicação
  const handleLoadDemoData = () => {
    handleEnterDemoMode();
  };

  // Limpeza estritamente segura apenas de registros de exemplo (prefixo demo-)
  // NUNCA exclui lançamentos reais (tx-...) nem altera saldos de contas reais do usuário
  const handleClearOnlyDemo = async () => {
    if (isDemoModeState) {
      handleResetDemoSandbox();
      return;
    }
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

  // Simulação Interativa What-If (para a aba de Projeção do Fluxo de Caixa)
  const [whatIfSimulation, setWhatIfSimulation] = useState({
    active: false,
    startMonth: new Date().toISOString().slice(0, 7),
    ignoredIncomes: [],
    ignoredExpenses: [],
    categoryReductions: {},
  });
  const [showWhatIfDrawer, setShowWhatIfDrawer] = useState(false);

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
    mode: 'create',
    paymentTx: null,
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
  const [chartCategoryViewMode, setChartCategoryViewMode] = useState('hierarchical'); // 'hierarchical' | 'flat'
  const [dashboardCategoryMode, setDashboardCategoryMode] = useState('parent'); // 'parent' | 'sub'

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
    setEditScope(data?.installmentGroupId || isActualRec ? 'all' : 'single');
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
    if (!tx || tx.isHypothetical) return false;
    if (tx.isInvoiceMaster) {
      return tx.status === 'EM ATRASO' || (!tx.isPaid && Boolean(tx.dueDate && tx.dueDate < todayStr));
    }
    // Compras em cartão de crédito pertencem à fatura do cartão (cardInvoiceMaster), não são contas avulsas de débito em conta
    if (tx.cardId) return false;
    if (tx.status !== 'COMPROMETIDO') return false;
    const dueDate = getTxDueDate(tx);
    return Boolean(dueDate && dueDate < todayStr);
  }, [getTxDueDate]);

  // Extrai fluxos de receitas e despesas para simulação What-If interativa na Projeção
  const availableWhatIfStreams = useMemo(() => {
    // 1. Receitas Mapeadas
    const incomeMap = new Map();
    visibleTransactions.forEach((tx) => {
      if (tx.type !== 'INCOME' || tx.status === 'CANCELADO') return;
      const key = tx.recurrenceRuleId
        ? `rec:${tx.recurrenceRuleId}`
        : `desc:${tx.description.trim().toLowerCase()}`;
      if (!incomeMap.has(key)) {
        incomeMap.set(key, {
          key,
          id: tx.id,
          recurrenceRuleId: tx.recurrenceRuleId,
          description: tx.description,
          amountCents: tx.amountCents,
          ownerId: tx.ownerId,
          categoryId: tx.categoryId,
          isRecurring: Boolean(tx.isRecurring),
        });
      } else {
        const existing = incomeMap.get(key);
        if (tx.isRecurring && !existing.isRecurring) {
          existing.isRecurring = true;
          existing.amountCents = tx.amountCents;
        }
      }
    });

    // 2. Despesas & Parcelamentos Mapeados
    const expenseMap = new Map();
    visibleTransactions.forEach((tx) => {
      if (tx.type !== 'EXPENSE' || tx.status === 'CANCELADO') return;
      if (tx.installmentGroupId) {
        const key = `group:${tx.installmentGroupId}`;
        if (!expenseMap.has(key)) {
          const cleanDesc = tx.description.replace(/\s*\(\d+\/\d+\)/, '');
          expenseMap.set(key, {
            key,
            id: tx.id,
            installmentGroupId: tx.installmentGroupId,
            description: cleanDesc,
            amountCents: tx.amountCents,
            ownerId: tx.ownerId,
            categoryId: tx.categoryId,
            isInstallment: true,
            installmentCount: tx.installmentCount,
          });
        }
      } else if (tx.isRecurring || tx.recurrenceRuleId) {
        const key = tx.recurrenceRuleId
          ? `rec:${tx.recurrenceRuleId}`
          : `desc:${tx.description.trim().toLowerCase()}`;
        if (!expenseMap.has(key)) {
          expenseMap.set(key, {
            key,
            id: tx.id,
            recurrenceRuleId: tx.recurrenceRuleId,
            description: tx.description,
            amountCents: tx.amountCents,
            ownerId: tx.ownerId,
            categoryId: tx.categoryId,
            isRecurring: true,
          });
        }
      } else {
        // Despesas fixas de valor relevante (>= R$ 100) vigentes no mês atual ou futuro
        const effectiveDate = getTxDueDate(tx) || tx.date;
        if (effectiveDate && effectiveDate >= currentActualMonth && tx.amountCents >= 10000) {
          const key = `desc:${tx.description.trim().toLowerCase()}`;
          if (!expenseMap.has(key)) {
            expenseMap.set(key, {
              key,
              id: tx.id,
              description: tx.description,
              amountCents: tx.amountCents,
              ownerId: tx.ownerId,
              categoryId: tx.categoryId,
              isRecurring: false,
            });
          }
        }
      }
    });

    return {
      incomes: Array.from(incomeMap.values()),
      expenses: Array.from(expenseMap.values()),
    };
  }, [visibleTransactions, getTxDueDate, currentActualMonth]);

  // Resumo consolidado do impacto da simulação What-If
  const whatIfSummary = useMemo(() => {
    let incomeCutsTotalCents = 0;
    let expenseCutsTotalCents = 0;

    (availableWhatIfStreams.incomes || []).forEach((inc) => {
      if ((whatIfSimulation.ignoredIncomes || []).includes(inc.key)) {
        incomeCutsTotalCents += inc.amountCents || 0;
      }
    });

    (availableWhatIfStreams.expenses || []).forEach((exp) => {
      if ((whatIfSimulation.ignoredExpenses || []).includes(exp.key)) {
        expenseCutsTotalCents += exp.amountCents || 0;
      }
    });

    Object.values(whatIfSimulation.categoryReductions || {}).forEach((cents) => {
      if (cents > 0) expenseCutsTotalCents += cents;
    });

    const netMonthlyImpactCents = expenseCutsTotalCents - incomeCutsTotalCents;

    return {
      incomeCutsTotalCents,
      expenseCutsTotalCents,
      netMonthlyImpactCents,
      totalAdjustmentsCount:
        (whatIfSimulation.ignoredIncomes || []).length +
        (whatIfSimulation.ignoredExpenses || []).length +
        Object.values(whatIfSimulation.categoryReductions || {}).filter((c) => c > 0).length,
    };
  }, [availableWhatIfStreams, whatIfSimulation]);

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

  // Mês ativo de referência para gráficos quando em modo de mês único
  const activeChartMonth = useMemo(() => {
    if (chartPeriodFilter === 'DASHBOARD_MONTH') return dashboardMonth;
    if (chartPeriodFilter === 'SPECIFIC_MONTH') return chartSpecificMonth;
    return null;
  }, [chartPeriodFilter, dashboardMonth, chartSpecificMonth]);

  // Intervalo de datas calculado para o período do gráfico
  const getChartDateRange = useCallback(() => {
    const today = new Date();
    const currentYear = String(today.getFullYear());

    if (chartPeriodFilter === 'DASHBOARD_MONTH') {
      return dashboardMonth;
    }
    if (chartPeriodFilter === 'SPECIFIC_MONTH') {
      return chartSpecificMonth;
    }
    if (chartPeriodFilter === 'LAST_3_MONTHS') {
      const d3 = new Date(today.getFullYear(), today.getMonth() - 2, 1);
      const last3Start = `${d3.getFullYear()}-${String(d3.getMonth() + 1).padStart(2, '0')}-01`;
      const todayStr = today.toISOString().slice(0, 10);
      return { startDate: last3Start, endDate: todayStr };
    }
    if (chartPeriodFilter === 'LAST_6_MONTHS') {
      const d6 = new Date(today.getFullYear(), today.getMonth() - 5, 1);
      const last6Start = `${d6.getFullYear()}-${String(d6.getMonth() + 1).padStart(2, '0')}-01`;
      const todayStr = today.toISOString().slice(0, 10);
      return { startDate: last6Start, endDate: todayStr };
    }
    if (chartPeriodFilter === 'CURRENT_YEAR') {
      return { startDate: `${currentYear}-01-01`, endDate: `${currentYear}-12-31` };
    }
    return null; // 'ALL'
  }, [chartPeriodFilter, dashboardMonth, chartSpecificMonth]);

  // Dados consolidados por categoria para os Gráficos (com visibilidade de Envelopes e Subcategorias)
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

    const getCatEnvelopeCap = (catId, cat) => {
      if (activeChartMonth) {
        const specificEntry = monthlyEnvelopes.find(
          (m) => m.categoryId === catId && m.monthKey === activeChartMonth
        );
        if (specificEntry) return specificEntry.amountCents;
        if (cat?.budgetLimitCents && cat.budgetLimitCents > 0) return cat.budgetLimitCents;
      } else if (cat?.budgetLimitCents && cat.budgetLimitCents > 0) {
        return cat.budgetLimitCents;
      }
      return 0;
    };

    // Se estiver em mês único (ex: Outubro), garante que categorias com envelope planejado apareçam mesmo com R$ 0,00 de gastos
    if (activeChartMonth) {
      categories
        .filter((c) => !c.archived && c.type === 'EXPENSE')
        .forEach((cat) => {
          const cap = getCatEnvelopeCap(cat.id, cat);
          if (cap > 0 && expenseMap[cat.id] === undefined) {
            expenseMap[cat.id] = 0;
          }
        });
    }

    // Lista plana de despesas (para modo lista)
    const expensesList = Object.entries(expenseMap)
      .map(([catId, amountCents]) => {
        const cat = categories.find((c) => c.id === catId);
        const envelopeCap = getCatEnvelopeCap(catId, cat);
        const percentageOfTotal = totalExpensesCents > 0 ? ((amountCents / totalExpensesCents) * 100).toFixed(1) : '0.0';
        const envelopePercentage = envelopeCap > 0 ? ((amountCents / envelopeCap) * 100).toFixed(1) : null;
        const isOverBudget = envelopeCap > 0 && amountCents > envelopeCap;

        return {
          catId,
          name: cat?.name || 'Geral',
          color: cat?.color || '#ef4444',
          parentId: cat?.parentId || null,
          amountCents,
          percentage: parseFloat(percentageOfTotal),
          envelopeCap,
          envelopePercentage: envelopePercentage !== null ? parseFloat(envelopePercentage) : null,
          isOverBudget,
        };
      })
      .sort((a, b) => {
        if (b.amountCents !== a.amountCents) return b.amountCents - a.amountCents;
        return (b.envelopeCap || 0) - (a.envelopeCap || 0);
      });

    // Construção da Visão Hierárquica (Categorias Pai agrupando suas Subcategorias)
    const activeExpenseCats = categories.filter((c) => !c.archived && c.type === 'EXPENSE');
    const parentCats = activeExpenseCats.filter((c) => !c.parentId || c.parentId === null);
    const parentGroups = [];
    const visitedChildIds = new Set();

    parentCats.forEach((parent) => {
      const childCategories = activeExpenseCats.filter((c) => c.parentId === parent.id);
      const directSpent = expenseMap[parent.id] || 0;
      const parentDirectCap = getCatEnvelopeCap(parent.id, parent);

      const subList = childCategories.map((ch) => {
        visitedChildIds.add(ch.id);
        const chSpent = expenseMap[ch.id] || 0;
        const chCap = getCatEnvelopeCap(ch.id, ch);
        const chEnvPct = chCap > 0 ? ((chSpent / chCap) * 100).toFixed(1) : null;
        return {
          catId: ch.id,
          name: ch.name,
          color: ch.color || parent.color || '#ef4444',
          amountCents: chSpent,
          envelopeCap: chCap,
          envelopePercentage: chEnvPct !== null ? parseFloat(chEnvPct) : null,
          isOverBudget: chCap > 0 && chSpent > chCap,
        };
      });

      const childrenSpentSum = subList.reduce((acc, s) => acc + s.amountCents, 0);
      const totalGroupSpent = directSpent + childrenSpentSum;

      const childrenCapSum = subList.reduce((acc, s) => acc + (s.envelopeCap || 0), 0);
      // O teto do grupo Pai só existe se a categoria Pai possuir um teto explicitamente estabelecido.
      // Se não foi dado teto à categoria pai, ela NÃO deve herdar a soma das filhas como se fosse seu teto nem sofrer avaliação de estouro.
      const hasExplicitParentCap = parentDirectCap > 0;
      const groupEnvelopeCap = hasExplicitParentCap ? parentDirectCap : 0;

      // Se houver gastos diretos no pai E também subcategorias com gastos/tetos, adiciona entrada de gastos diretos
      const finalSubList = [...subList];
      if (directSpent > 0 && subList.length > 0) {
        finalSubList.unshift({
          catId: parent.id,
          name: `${parent.name} (Lançamentos diretos)`,
          color: parent.color,
          amountCents: directSpent,
          envelopeCap: 0,
          envelopePercentage: null,
          isOverBudget: false,
          isDirect: true,
        });
      }

      // Adiciona porcentagens relativas ao grupo Pai e ao Total Geral
      const enrichedSubList = finalSubList
        .map((sub) => ({
          ...sub,
          percentageOfParent: totalGroupSpent > 0 ? parseFloat(((sub.amountCents / totalGroupSpent) * 100).toFixed(1)) : 0,
          percentageOfTotal: totalExpensesCents > 0 ? parseFloat(((sub.amountCents / totalExpensesCents) * 100).toFixed(1)) : 0,
        }))
        .filter((sub) => sub.amountCents > 0 || (sub.envelopeCap && sub.envelopeCap > 0))
        .sort((a, b) => {
          if (b.amountCents !== a.amountCents) return b.amountCents - a.amountCents;
          return (b.envelopeCap || 0) - (a.envelopeCap || 0);
        });

      // Inclui o grupo se houver gasto, se o pai tiver teto ou se alguma subcategoria tiver teto planejado
      if (totalGroupSpent > 0 || hasExplicitParentCap || childrenCapSum > 0) {
        const groupEnvPct = hasExplicitParentCap ? ((totalGroupSpent / groupEnvelopeCap) * 100).toFixed(1) : null;
        parentGroups.push({
          catId: parent.id,
          name: parent.name,
          color: parent.color || '#ef4444',
          totalAmountCents: totalGroupSpent,
          directAmountCents: directSpent,
          percentageOfTotal: totalExpensesCents > 0 ? parseFloat(((totalGroupSpent / totalExpensesCents) * 100).toFixed(1)) : 0,
          envelopeCap: groupEnvelopeCap,
          hasExplicitEnvelope: hasExplicitParentCap,
          plannedSubcategoriesCap: childrenCapSum,
          envelopePercentage: groupEnvPct !== null ? parseFloat(groupEnvPct) : null,
          isOverBudget: hasExplicitParentCap && totalGroupSpent > groupEnvelopeCap,
          subcategories: enrichedSubList,
          hasSubcategories: enrichedSubList.length > 0,
        });
      }
    });

    // Subcategorias órfãs (caso tenham gasto mas o pai não tenha sido encontrado)
    activeExpenseCats
      .filter((c) => c.parentId && !visitedChildIds.has(c.id) && ((expenseMap[c.id] || 0) > 0 || getCatEnvelopeCap(c.id, c) > 0))
      .forEach((orphan) => {
        const orphanSpent = expenseMap[orphan.id] || 0;
        const orphanCap = getCatEnvelopeCap(orphan.id, orphan);
        const orphanEnvPct = orphanCap > 0 ? ((orphanSpent / orphanCap) * 100).toFixed(1) : null;
        parentGroups.push({
          catId: orphan.id,
          name: orphan.name,
          color: orphan.color || '#ef4444',
          totalAmountCents: orphanSpent,
          directAmountCents: orphanSpent,
          percentageOfTotal: totalExpensesCents > 0 ? parseFloat(((orphanSpent / totalExpensesCents) * 100).toFixed(1)) : 0,
          envelopeCap: orphanCap,
          hasExplicitEnvelope: orphanCap > 0,
          plannedSubcategoriesCap: 0,
          envelopePercentage: orphanEnvPct !== null ? parseFloat(orphanEnvPct) : null,
          isOverBudget: orphanCap > 0 && orphanSpent > orphanCap,
          subcategories: [],
          hasSubcategories: false,
        });
      });

    parentGroups.sort((a, b) => {
      if (b.totalAmountCents !== a.totalAmountCents) return b.totalAmountCents - a.totalAmountCents;
      return (b.envelopeCap || 0) - (a.envelopeCap || 0);
    });

    const incomesList = Object.entries(incomeMap)
      .map(([catId, amountCents]) => {
        const cat = categories.find((c) => c.id === catId);
        const percentage = totalIncomesCents > 0 ? ((amountCents / totalIncomesCents) * 100).toFixed(1) : 0;
        return {
          catId,
          name: cat?.name || 'Geral',
          color: cat?.color || '#10b981',
          parentId: cat?.parentId || null,
          amountCents,
          percentage: parseFloat(percentage),
        };
      })
      .sort((a, b) => b.amountCents - a.amountCents);

    return {
      expensesList,
      hierarchicalExpenses: parentGroups,
      incomesList,
      totalExpensesCents,
      totalIncomesCents,
    };
  }, [chartTransactions, categories, activeChartMonth, monthlyEnvelopes]);

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
        .filter((cat) => !cat.archived && cat.type === 'EXPENSE')
        .map((cat) => {
          const specificEntry = monthlyEnvelopes.find(
            (m) => m.categoryId === cat.id && m.monthKey === targetMonth
          );

          let allocatedCents = 0;
          let envelopeEntry = null;

          if (specificEntry) {
            allocatedCents = specificEntry.amountCents;
            envelopeEntry = specificEntry;
          } else if (cat.budgetLimitCents && cat.budgetLimitCents > 0) {
            allocatedCents = cat.budgetLimitCents;
          }

          if (allocatedCents <= 0) return null;

          // Se for categoria Pai, o gasto consolidado inclui os lançamentos diretos e os de todas as suas subcategorias
          const childIds = !cat.parentId
            ? categories.filter((c) => c.parentId === cat.id).map((c) => c.id)
            : [];
          const spentCents = (spentByCat[cat.id] || 0) + childIds.reduce((acc, cid) => acc + (spentByCat[cid] || 0), 0);
          const remainingCents = Math.max(0, allocatedCents - spentCents);
          const overspentCents = Math.max(0, spentCents - allocatedCents);
          const percentage = allocatedCents > 0 ? (spentCents / allocatedCents) * 100 : 0;
          const isOver = spentCents > allocatedCents;

          let status = 'healthy';
          if (isOver) status = 'over';
          else if (spentCents === allocatedCents) status = 'limit';
          else if (percentage >= 80) status = 'warning';

          const hasRecurringSchedule = Boolean(
            envelopeEntry?.ruleId ||
            monthlyEnvelopes.some((m) => m.categoryId === cat.id && m.ruleId)
          );

          return {
            category: cat,
            allocatedCents,
            spentCents,
            remainingCents,
            overspentCents,
            percentage,
            isOver,
            status,
            envelopeEntry,
            hasRecurringSchedule,
            monthKey: targetMonth,
          };
        })
        .filter(Boolean)
        .sort((a, b) => b.allocatedCents - a.allocatedCents);

      // Apenas envelopes de nível raiz entram na soma global do orçamento familiar para não duplicar valores
      const rootEnvelopes = envelopeList.filter((e) => {
        if (!e.category.parentId) return true;
        const parentHasEnvelope = envelopeList.some((p) => p.category.id === e.category.parentId);
        return !parentHasEnvelope;
      });

      const totalAllocatedCents = rootEnvelopes.reduce((acc, e) => acc + e.allocatedCents, 0);
      const totalSpentCents = rootEnvelopes.reduce((acc, e) => acc + e.spentCents, 0);
      const totalResidualCommittedCents = rootEnvelopes.reduce((acc, e) => acc + e.remainingCents, 0);
      const totalOverspentCents = rootEnvelopes.reduce((acc, e) => acc + e.overspentCents, 0);

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
    [visibleTransactions, categories, monthlyEnvelopes, getTxDueDate]
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

    const activeExpenseCats = categories.filter((c) => !c.archived && c.type === 'EXPENSE');
    const parentCats = activeExpenseCats.filter((c) => !c.parentId || c.parentId === null);
    const parentGroups = [];
    const visitedChildIds = new Set();

    parentCats.forEach((parent) => {
      const childCategories = activeExpenseCats.filter((c) => c.parentId === parent.id);
      const directSpent = expenseMap[parent.id] || 0;

      const subList = childCategories
        .map((ch) => {
          visitedChildIds.add(ch.id);
          const chSpent = expenseMap[ch.id] || 0;
          return {
            catId: ch.id,
            name: ch.name,
            color: ch.color || parent.color || '#ef4444',
            amountCents: chSpent,
          };
        })
        .filter((ch) => ch.amountCents > 0)
        .sort((a, b) => b.amountCents - a.amountCents);

      const childrenSpentSum = subList.reduce((acc, s) => acc + s.amountCents, 0);
      const totalGroupSpent = directSpent + childrenSpentSum;

      if (totalGroupSpent > 0) {
        const percentage = totalExpensesCents > 0 ? ((totalGroupSpent / totalExpensesCents) * 100).toFixed(1) : 0;
        parentGroups.push({
          catId: parent.id,
          name: parent.name,
          color: parent.color || '#ef4444',
          amountCents: totalGroupSpent,
          percentage: parseFloat(percentage),
          subcategories: subList,
        });
      }
    });

    // Subcategorias órfãs com gastos
    activeExpenseCats
      .filter((c) => c.parentId && !visitedChildIds.has(c.id) && (expenseMap[c.id] || 0) > 0)
      .forEach((orphan) => {
        const orphanSpent = expenseMap[orphan.id] || 0;
        const percentage = totalExpensesCents > 0 ? ((orphanSpent / totalExpensesCents) * 100).toFixed(1) : 0;
        parentGroups.push({
          catId: orphan.id,
          name: orphan.name,
          color: orphan.color || '#ef4444',
          amountCents: orphanSpent,
          percentage: parseFloat(percentage),
          subcategories: [],
        });
      });

    parentGroups.sort((a, b) => b.amountCents - a.amountCents);

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
      parentGroups,
      totalExpensesCents,
    };
  }, [visibleTransactions, dashboardMonth, categories, getTxDueDate]);

  // Lançamentos em atraso (comprometidos com vencimento anterior a hoje)
  const overdueTransactions = useMemo(() => {
    const todayStr = new Date().toISOString().slice(0, 10);
    return allDisplayTransactions.filter((tx) => isTxOverdue(tx, todayStr));
  }, [allDisplayTransactions, isTxOverdue]);

  const overdueExpensesTotalCents = useMemo(() => {
    return overdueTransactions
      .filter((tx) => tx.type === 'EXPENSE')
      .reduce((acc, tx) => acc + tx.amountCents, 0);
  }, [overdueTransactions]);

  // Próximos Vencimentos & Compromissos para o Dashboard (Ordem cronológica com atrasos prioritários no topo)
  const upcomingCommitments = useMemo(() => {
    const todayStr = new Date().toISOString().slice(0, 10);

    // Filtra transações não canceladas: vencimentos futuros ou pendentes/atrasados
    const pendingOrUpcoming = allDisplayTransactions.filter((tx) => {
      if (tx.status === 'CANCELADO') return false;
      const due = getTxDueDate(tx);
      if (due >= todayStr) return true;
      return isTxOverdue(tx, todayStr);
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
  }, [allDisplayTransactions, getTxDueDate, isTxOverdue]);

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

  // Impacto mensal consolidado dos cenários ATIVOS para o mês selecionado no dashboard
  const activeScenariosMonthlyNet = useMemo(() => {
    return scenarios
      .filter((s) => {
        if (!s.active) return false;
        const sStartMonth = s.startDate ? s.startDate.slice(0, 7) : dashboardMonth;
        const [dY, dM] = dashboardMonth.split('-').map(Number);
        const [sY, sM] = sStartMonth.split('-').map(Number);
        const monthDiff = (dY - sY) * 12 + (dM - sM);
        return monthDiff >= 0 && monthDiff < (s.months || 12);
      })
      .reduce((acc, s) => acc + s.monthlyImpactCents, 0);
  }, [scenarios, dashboardMonth]);

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

    const adjustmentsJson = fd.get('adjustmentsJson');
    let adjustments = modalState.data?.adjustments || { ignoredIncomes: [], ignoredExpenses: [], categoryReductions: [] };
    if (adjustmentsJson) {
      try {
        adjustments = JSON.parse(adjustmentsJson);
      } catch (err) {
        console.warn('Erro ao parsear adjustmentsJson:', err);
      }
    }

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
      adjustments,
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

  // Salva a Simulação What-If interativa atual como um Cenário Permanente
  const handleSaveWhatIfAsScenario = () => {
    const ignoredIncomesList = (availableWhatIfStreams.incomes || [])
      .filter((inc) => (whatIfSimulation.ignoredIncomes || []).includes(inc.key))
      .map((inc) => ({
        key: inc.key,
        id: inc.id,
        description: inc.description,
        amountCents: inc.amountCents,
        ownerId: inc.ownerId,
      }));

    const ignoredExpensesList = (availableWhatIfStreams.expenses || [])
      .filter((exp) => (whatIfSimulation.ignoredExpenses || []).includes(exp.key))
      .map((exp) => ({
        key: exp.key,
        id: exp.id,
        description: exp.description,
        amountCents: exp.amountCents,
        installmentGroupId: exp.installmentGroupId,
        recurrenceRuleId: exp.recurrenceRuleId,
      }));

    const categoryReductionsList = Object.entries(whatIfSimulation.categoryReductions || {})
      .filter(([_, cents]) => cents > 0)
      .map(([catId, amountCents]) => ({ categoryId: catId, amountCents }));

    const adjustments = {
      ignoredIncomes: ignoredIncomesList,
      ignoredExpenses: ignoredExpensesList,
      categoryReductions: categoryReductionsList,
    };

    setModalSourceType('ACCOUNT');
    setModalState({
      isOpen: true,
      type: 'scenario',
      mode: 'create',
      data: {
        title: 'Cenário What-If: Ajustes & Cortes',
        type: 'EXPENSE',
        monthlyImpactCents: 0,
        months: projectionHorizon || 12,
        startDate: `${whatIfSimulation.startMonth || currentActualMonth}-01`,
        scope: 'FAMILY',
        ownerId: currentMemberId === 'user-all' ? 'user-all' : currentMemberId,
        active: true,
        adjustments,
      },
    });
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

  // Salvar Categorias (com suporte a Subcategorias e Validação Inteligente de Teto Pai-Filho)
  const handleSaveCategory = (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const id = modalState.mode === 'edit' ? modalState.data.id : `cat-${Date.now()}`;
    const budgetRaw = fd.get('budgetLimit');
    const budgetLimitCents = budgetRaw !== null && budgetRaw !== '' ? Math.max(0, Math.round(parseFloat(budgetRaw || '0') * 100)) : 0;
    const parentId = fd.get('parentId') || null;

    const newCat = {
      id,
      name: fd.get('name'),
      type: fd.get('type'),
      color: fd.get('color') || '#475569',
      archived: modalState.mode === 'edit' ? modalState.data.archived : false,
      budgetLimitCents,
      parentId,
    };

    // Validação 1: Se for Subcategoria com teto, valida contra o teto da Categoria Pai
    if (parentId && budgetLimitCents > 0) {
      const parentCat = categories.find((c) => c.id === parentId);
      if (parentCat && parentCat.budgetLimitCents > 0) {
        const siblings = categories.filter((c) => c.parentId === parentId && c.id !== id);
        const currentSiblingsSum = siblings.reduce((acc, s) => acc + (s.budgetLimitCents || 0), 0);
        const totalSum = currentSiblingsSum + budgetLimitCents;

        if (totalSum > parentCat.budgetLimitCents) {
          const maxAvailableChildCents = Math.max(0, parentCat.budgetLimitCents - currentSiblingsSum);
          setCategoryConflictModal({
            isOpen: true,
            childName: newCat.name,
            parentName: parentCat.name,
            parentId: parentCat.id,
            childId: id,
            childAttemptedCents: budgetLimitCents,
            currentSiblingsSum,
            parentCurrentCents: parentCat.budgetLimitCents,
            suggestedParentCents: totalSum,
            maxAvailableChildCents,
            pendingCatData: newCat,
          });
          return;
        }
      }
    }

    // Validação 2: Se for Categoria Pai sendo editada para teto menor que a soma das subcategorias
    if (!parentId && modalState.mode === 'edit') {
      const children = categories.filter((c) => c.parentId === id);
      const childrenSum = children.reduce((acc, c) => acc + (c.budgetLimitCents || 0), 0);
      if (children.length > 0 && budgetLimitCents > 0 && budgetLimitCents < childrenSum) {
        if (!confirm(
          `Atenção: O novo teto da categoria pai "${newCat.name}" (${formatMoney(budgetLimitCents)}) é inferior à soma dos tetos de suas subcategorias (${formatMoney(childrenSum)}).\n\nDeseja salvar mesmo assim?`
        )) {
          return;
        }
      }
    }

    let updatedCategories;
    if (modalState.mode === 'edit') {
      updatedCategories = categories.map((c) => (c.id === id ? newCat : c));
    } else {
      updatedCategories = [...categories, newCat];
    }
    markCategoryPending(newCat.id);
    setCategories(updatedCategories);
    saveToLocalStorage(STORAGE_KEYS.categories, updatedCategories);
    syncItem('categories', newCat);

    setModalState({ isOpen: false, type: null, mode: 'create', data: null });
  };

  const handleResolveCategoryConflict = (choice) => {
    const { pendingCatData, parentId, suggestedParentCents, maxAvailableChildCents } = categoryConflictModal;
    if (!pendingCatData) {
      setCategoryConflictModal((prev) => ({ ...prev, isOpen: false }));
      return;
    }

    let finalCat = { ...pendingCatData };
    let parentToUpdate = null;

    if (choice === 'EXPAND_PARENT') {
      const parentCat = categories.find((c) => c.id === parentId);
      if (parentCat) {
        parentToUpdate = { ...parentCat, budgetLimitCents: suggestedParentCents };
      }
    } else if (choice === 'ADJUST_CHILD') {
      finalCat.budgetLimitCents = maxAvailableChildCents;
    } else {
      setCategoryConflictModal((prev) => ({ ...prev, isOpen: false }));
      return;
    }

    let updatedCategories = categories.filter((c) => c.id !== finalCat.id);
    if (parentToUpdate) {
      updatedCategories = updatedCategories.map((c) => (c.id === parentToUpdate.id ? parentToUpdate : c));
      markCategoryPending(parentToUpdate.id);
      syncItem('categories', parentToUpdate);
    }
    updatedCategories.push(finalCat);

    markCategoryPending(finalCat.id);
    setCategories(updatedCategories);
    saveToLocalStorage(STORAGE_KEYS.categories, updatedCategories);
    syncItem('categories', finalCat);

    setCategoryConflictModal((prev) => ({ ...prev, isOpen: false }));
    setModalState({ isOpen: false, type: null, mode: 'create', data: null });
  };

  const moreMenuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (moreMenuRef.current && !moreMenuRef.current.contains(event.target)) {
        setIsMoreMenuOpen(false);
      }
    };
    if (isMoreMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isMoreMenuOpen]);

  const addMonthsToYearMonth = (ym, offset) => {
    if (!ym || !ym.includes('-')) {
      const now = new Date();
      ym = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    }
    const [yearStr, monthStr] = ym.split('-');
    let y = parseInt(yearStr, 10);
    let m = parseInt(monthStr, 10) - 1 + offset;
    const d = new Date(y, m, 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  };

  const handleSaveEnvelopeSchedule = ({
    categoryId,
    amountCents,
    startMonth,
    durationMonths = 1,
    scope = 'all_recurring',
    existingEnvelope = null,
  }) => {
    if (!categoryId) return;
    const cat = categories.find((c) => c.id === categoryId);
    if (!cat) return;

    let updatedList = [...monthlyEnvelopes];
    let ruleIdToUse = existingEnvelope?.envelopeEntry?.ruleId || null;

    // Se a categoria tiver uma Categoria Pai, valida se o teto ultrapassa o da categoria pai
    if (cat.parentId && amountCents > 0) {
      const parentCat = categories.find((c) => c.id === cat.parentId);
      if (parentCat) {
        const parentEnv = monthlyEnvelopes.find((m) => m.categoryId === parentCat.id && m.monthKey === startMonth);
        const parentCap = parentEnv ? parentEnv.amountCents : (parentCat.budgetLimitCents || 0);

        if (parentCap > 0) {
          const siblings = categories.filter((c) => c.parentId === parentCat.id && c.id !== cat.id);
          const siblingsSum = siblings.reduce((acc, sib) => {
            const sibEnv = monthlyEnvelopes.find((m) => m.categoryId === sib.id && m.monthKey === startMonth);
            return acc + (sibEnv ? sibEnv.amountCents : (sib.budgetLimitCents || 0));
          }, 0);

          const totalChildSum = siblingsSum + amountCents;
          if (totalChildSum > parentCap) {
            const expandChoice = confirm(
              `Atenção: O teto de ${formatMoney(amountCents)} para a subcategoria "${cat.name}" no mês ${formatMonthLabel(startMonth)} somado às outras subcategorias (${formatMoney(siblingsSum)}) totaliza ${formatMoney(totalChildSum)}, ultrapassando o teto da categoria pai "${parentCat.name}" (${formatMoney(parentCap)}).\n\n` +
              `• Clique em [OK] para AUMENTAR o teto da categoria pai para ${formatMoney(totalChildSum)} neste mês.\n` +
              `• Clique em [CANCELAR] para AJUSTAR o teto da subcategoria para o saldo disponível de ${formatMoney(Math.max(0, parentCap - siblingsSum))}.`
            );

            if (expandChoice) {
              const parentIdx = updatedList.findIndex((m) => m.categoryId === parentCat.id && m.monthKey === startMonth);
              const parentEntryData = {
                id: parentIdx >= 0 ? updatedList[parentIdx].id : `menv_${Date.now()}_parent`,
                categoryId: parentCat.id,
                monthKey: startMonth,
                amountCents: totalChildSum,
                ruleId: parentIdx >= 0 ? updatedList[parentIdx].ruleId : null,
              };
              if (parentIdx >= 0) updatedList[parentIdx] = parentEntryData;
              else updatedList.push(parentEntryData);
              syncItem('monthlyEnvelopes', parentEntryData);
            } else {
              amountCents = Math.max(0, parentCap - siblingsSum);
            }
          }
        }
      }
    }

    // Se a categoria for Pai e tiver subcategorias com tetos estabelecidos:
    if (!cat.parentId && amountCents > 0) {
      const children = categories.filter((c) => c.parentId === cat.id);
      if (children.length > 0) {
        const childrenSum = children.reduce((acc, sib) => {
          const sibEnv = monthlyEnvelopes.find((m) => m.categoryId === sib.id && m.monthKey === startMonth);
          return acc + (sibEnv ? sibEnv.amountCents : (sib.budgetLimitCents || 0));
        }, 0);

        if (childrenSum > 0 && amountCents < childrenSum) {
          if (!confirm(
            `Atenção: O teto de ${formatMoney(amountCents)} para a categoria pai "${cat.name}" no mês ${formatMonthLabel(startMonth)} é inferior à soma dos tetos das suas subcategorias (${formatMoney(childrenSum)}).\n\nDeseja salvar mesmo assim?`
          )) {
            return;
          }
        }
      }
    }

    if (scope === 'this_only') {
      const existingIdx = updatedList.findIndex(
        (m) => m.categoryId === categoryId && m.monthKey === startMonth
      );
      const entryData = {
        id: existingIdx >= 0 ? updatedList[existingIdx].id : `menv_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        categoryId,
        monthKey: startMonth,
        amountCents,
        ruleId: existingIdx >= 0 ? updatedList[existingIdx].ruleId : (ruleIdToUse || null),
      };

      if (existingIdx >= 0) {
        updatedList[existingIdx] = entryData;
      } else {
        updatedList.push(entryData);
      }
      syncItem('monthlyEnvelopes', entryData);
    } else if (scope === 'from_now_on') {
      if (!ruleIdToUse) {
        ruleIdToUse = `envrule_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
      }

      const count = Math.max(1, durationMonths);
      const monthsToSet = new Set();
      const itemsToSync = [];

      for (let i = 0; i < count; i++) {
        const mKey = addMonthsToYearMonth(startMonth, i);
        monthsToSet.add(mKey);
        const existingIdx = updatedList.findIndex(
          (m) => m.categoryId === categoryId && m.monthKey === mKey
        );
        const entryData = {
          id: existingIdx >= 0 ? updatedList[existingIdx].id : `menv_${Date.now()}_${i}_${Math.random().toString(36).substr(2, 5)}`,
          categoryId,
          monthKey: mKey,
          amountCents,
          ruleId: ruleIdToUse,
        };
        if (existingIdx >= 0) {
          updatedList[existingIdx] = entryData;
        } else {
          updatedList.push(entryData);
        }
        itemsToSync.push(entryData);
      }

      updatedList = updatedList.map((m) => {
        if (
          m.categoryId === categoryId &&
          m.monthKey >= startMonth &&
          !monthsToSet.has(m.monthKey) &&
          (existingEnvelope?.envelopeEntry?.ruleId ? m.ruleId === existingEnvelope.envelopeEntry.ruleId : true)
        ) {
          const upd = { ...m, amountCents, ruleId: ruleIdToUse };
          itemsToSync.push(upd);
          return upd;
        }
        return m;
      });

      syncBatchMonthlyEnvelopes(itemsToSync);
    } else {
      if (!ruleIdToUse) {
        ruleIdToUse = `envrule_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
      }

      const count = Math.max(1, durationMonths);
      const itemsToSync = [];

      for (let i = 0; i < count; i++) {
        const mKey = addMonthsToYearMonth(startMonth, i);
        const existingIdx = updatedList.findIndex(
          (m) => m.categoryId === categoryId && m.monthKey === mKey
        );
        const entryData = {
          id: existingIdx >= 0 ? updatedList[existingIdx].id : `menv_${Date.now()}_${i}_${Math.random().toString(36).substr(2, 5)}`,
          categoryId,
          monthKey: mKey,
          amountCents,
          ruleId: ruleIdToUse,
        };
        if (existingIdx >= 0) {
          updatedList[existingIdx] = entryData;
        } else {
          updatedList.push(entryData);
        }
        itemsToSync.push(entryData);
      }

      if (existingEnvelope?.envelopeEntry?.ruleId) {
        updatedList = updatedList.map((m) => {
          if (m.ruleId === existingEnvelope.envelopeEntry.ruleId) {
            const upd = { ...m, amountCents, ruleId: ruleIdToUse };
            itemsToSync.push(upd);
            return upd;
          }
          return m;
        });
      }

      const updatedCat = { ...cat, budgetLimitCents: amountCents };
      const updatedCats = categories.map((c) => (c.id === categoryId ? updatedCat : c));
      setCategories(updatedCats);
      saveToLocalStorage('financas_categories_v1', updatedCats);
      syncItem('categories', updatedCat);

      syncBatchMonthlyEnvelopes(itemsToSync);
    }

    setMonthlyEnvelopes(updatedList);
    saveToLocalStorage(STORAGE_KEYS.monthlyEnvelopes, updatedList);

    setEnvelopeModalState({
      isOpen: false,
      mode: 'create',
      category: null,
      monthKey: '',
      existingEnvelope: null,
      scope: 'all',
    });
  };

  const handleConfirmDeleteEnvelope = () => {
    const { envelope, scope } = deleteEnvelopeModalState;
    if (!envelope) return;

    const catId = envelope.category.id;
    const targetMonth = envelope.monthKey;
    const ruleId = envelope.envelopeEntry?.ruleId;

    let updatedList = [...monthlyEnvelopes];
    let removedItems = [];

    if (scope === 'this_only') {
      const cat = categories.find((c) => c.id === catId);
      const existingIdx = updatedList.findIndex(
        (m) => m.categoryId === catId && m.monthKey === targetMonth
      );

      if (cat?.budgetLimitCents > 0) {
        const zeroEntry = {
          id: existingIdx >= 0 ? updatedList[existingIdx].id : `menv_${Date.now()}_zero`,
          categoryId: catId,
          monthKey: targetMonth,
          amountCents: 0,
          ruleId: null,
        };
        if (existingIdx >= 0) {
          updatedList[existingIdx] = zeroEntry;
        } else {
          updatedList.push(zeroEntry);
        }
        syncItem('monthlyEnvelopes', zeroEntry);
      } else {
        if (existingIdx >= 0) {
          removedItems.push(updatedList[existingIdx]);
          updatedList.splice(existingIdx, 1);
        }
      }
    } else if (scope === 'from_now_on') {
      removedItems = updatedList.filter((m) => {
        if (m.categoryId !== catId) return false;
        if (m.monthKey < targetMonth) return false;
        if (ruleId && m.ruleId && m.ruleId !== ruleId) return false;
        return true;
      });

      updatedList = updatedList.filter((m) => !removedItems.some((r) => r.id === m.id));

      const cat = categories.find((c) => c.id === catId);
      if (cat?.budgetLimitCents > 0) {
        const updatedCat = { ...cat, budgetLimitCents: 0 };
        const updatedCats = categories.map((c) => (c.id === catId ? updatedCat : c));
        setCategories(updatedCats);
        saveToLocalStorage('financas_categories_v1', updatedCats);
        syncItem('categories', updatedCat);
      }
    } else if (scope === 'before_this') {
      removedItems = updatedList.filter((m) => {
        if (m.categoryId !== catId) return false;
        if (m.monthKey >= targetMonth) return false;
        if (ruleId && m.ruleId && m.ruleId !== ruleId) return false;
        return true;
      });

      updatedList = updatedList.filter((m) => !removedItems.some((r) => r.id === m.id));
    } else {
      // scope === 'all_recurring'
      removedItems = updatedList.filter((m) => {
        if (m.categoryId !== catId) return false;
        if (ruleId) return m.ruleId === ruleId;
        return true;
      });

      updatedList = updatedList.filter((m) => !removedItems.some((r) => r.id === m.id));

      const cat = categories.find((c) => c.id === catId);
      if (cat?.budgetLimitCents > 0) {
        const updatedCat = { ...cat, budgetLimitCents: 0 };
        const updatedCats = categories.map((c) => (c.id === catId ? updatedCat : c));
        setCategories(updatedCats);
        saveToLocalStorage('financas_categories_v1', updatedCats);
        syncItem('categories', updatedCat);
      }
    }

    if (removedItems.length > 0) {
      syncBatchMonthlyEnvelopes(removedItems, true);
    }

    setMonthlyEnvelopes(updatedList);
    saveToLocalStorage(STORAGE_KEYS.monthlyEnvelopes, updatedList);

    setDeleteEnvelopeModalState({
      isOpen: false,
      envelope: null,
      scope: 'this_only',
    });
  };

  // Salvar Lançamentos
  const handleSaveTransaction = async (e) => {
    e.preventDefault();
    setIsSubmittingTx(true);
    isSavingRef.current = true;
    cloudSyncCooldownUntilRef.current = Date.now() + 3000;

    try {
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
          const isMatch = (t) =>
            (original.installmentGroupId && t.installmentGroupId === original.installmentGroupId) ||
            (isActualRecurrence && t.recurrenceRuleId === original.recurrenceRuleId);

          const matched = [];
          const updated = transactions.map((t) => {
            if (!isMatch(t)) return t;
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
              accountId: modalSourceType === 'ACCOUNT' ? (fd.get('accountId') || t.accountId || null) : null,
              cardId: modalSourceType === 'CARD' ? (fd.get('cardId') || t.cardId || null) : null,
              _localUpdatedAt: Date.now(),
            };
            matched.push(u);
            return u;
          });

          matched.forEach((t) => markTransactionPending(t.id));
          setTransactions(updated);
          saveToLocalStorage(STORAGE_KEYS.transactions, updated);
          await syncBatchTransactions(matched);
        } else if (editScope === 'future' && (original.installmentGroupId || isActualRecurrence)) {
          const isMatch = (t) =>
            (original.installmentGroupId &&
              t.installmentGroupId === original.installmentGroupId &&
              (t.installmentNumber || 0) >= (original.installmentNumber || 0)) ||
            (isActualRecurrence &&
              t.recurrenceRuleId === original.recurrenceRuleId &&
              t.date >= original.date);

          const matched = [];
          const updated = transactions.map((t) => {
            if (!isMatch(t)) return t;
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
              accountId: modalSourceType === 'ACCOUNT' ? (fd.get('accountId') || t.accountId || null) : null,
              cardId: modalSourceType === 'CARD' ? (fd.get('cardId') || t.cardId || null) : null,
              _localUpdatedAt: Date.now(),
            };
            matched.push(u);
            return u;
          });

          matched.forEach((t) => markTransactionPending(t.id));
          setTransactions(updated);
          saveToLocalStorage(STORAGE_KEYS.transactions, updated);
          await syncBatchTransactions(matched);
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
              accountId: modalSourceType === 'ACCOUNT' ? (fd.get('accountId') || original.accountId || null) : null,
              cardId: modalSourceType === 'CARD' ? (fd.get('cardId') || original.cardId || null) : null,
              isRecurring: true,
              recurrenceRuleId: ruleId,
              _localUpdatedAt: Date.now(),
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
                _localUpdatedAt: Date.now(),
              });
            }

            const allToSync = [updatedTx, ...newFutureTxs];
            allToSync.forEach((t) => markTransactionPending(t.id));
            const updated = [...transactions.map((t) => (t.id === original.id ? updatedTx : t)), ...newFutureTxs];
            setTransactions(updated);
            saveToLocalStorage(STORAGE_KEYS.transactions, updated);
            await syncBatchTransactions(allToSync);
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
              accountId: modalSourceType === 'ACCOUNT' ? (fd.get('accountId') || original.accountId || null) : null,
              cardId: modalSourceType === 'CARD' ? (fd.get('cardId') || original.cardId || null) : null,
              _localUpdatedAt: Date.now(),
            };

            markTransactionPending(updatedTx.id);
            const updated = transactions.map((t) => (t.id === original.id ? updatedTx : t));
            setTransactions(updated);
            saveToLocalStorage(STORAGE_KEYS.transactions, updated);
            await syncItem('transactions', updatedTx);
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
              _localUpdatedAt: Date.now(),
            });
          }
          setTransactions((prev) => {
            const updated = [...prev, ...newTxs];
            saveToLocalStorage('financas_transactions_v1', updated);
            return updated;
          });
          await syncBatchTransactions(newTxs);
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
              _localUpdatedAt: Date.now(),
            });
          }

          setTransactions((prev) => {
            const updated = [...prev, ...newTxs];
            saveToLocalStorage('financas_transactions_v1', updated);
            return updated;
          });
          await syncBatchTransactions(newTxs);
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
            _localUpdatedAt: Date.now(),
          };
          markTransactionPending(newTx.id);
          setTransactions((prev) => {
            const updated = [...prev, newTx];
            saveToLocalStorage(STORAGE_KEYS.transactions, updated);
            return updated;
          });
          await syncItem('transactions', newTx);
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
          await syncItem('scenarios', { ...convertedScen, active: false });
        }
        alert('Cenário convertido em lançamento real com sucesso!');
      }

      setModalState({ isOpen: false, type: null, mode: 'create', data: null, scenarioIdToConvert: null });
      setEditScope('single');
    } catch (err) {
      console.error('Erro ao salvar lançamento:', err);
    } finally {
      setIsSubmittingTx(false);
      setTimeout(() => {
        isSavingRef.current = false;
      }, 2500);
    }
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
    const children = categories.filter((c) => c.parentId === cat.id);
    const duplicateSibling = categories.find(
      (c) => c.id !== cat.id && c.name.trim().toLowerCase() === cat.name.trim().toLowerCase() && c.type === cat.type
    );

    let warning = '';
    if (tiedCount > 0) {
      if (duplicateSibling) {
        warning = `\n\nIdentificamos outra categoria ativa "${duplicateSibling.name}". Os ${tiedCount} lançamento(s) vinculados a esta categoria serão migrados automaticamente para ela.`;
      } else {
        warning = `\n\nAtenção: Esta categoria possui ${tiedCount} lançamento(s) associado(s). Eles ficarão sem categoria vinculada.`;
      }
    }
    const childWarning =
      children.length > 0
        ? `\n\nAtenção: Esta categoria possui ${children.length} subcategoria(s) associada(s). ${duplicateSibling ? `Elas serão vinculadas à categoria "${duplicateSibling.name}".` : 'Elas se tornarão categorias principais independentes.'}`
        : '';

    if (confirm(`Deseja realmente EXCLUIR DEFINITIVAMENTE a categoria "${cat.name}"?${warning}${childWarning}`)) {
      let updatedCats = categories.filter((c) => c.id !== cat.id);
      if (children.length > 0) {
        updatedCats = updatedCats.map((c) => {
          if (c.parentId === cat.id) {
            const detached = { ...c, parentId: duplicateSibling?.id || null };
            syncItem('categories', detached);
            return detached;
          }
          return c;
        });
      }
      clearCategoryPending(cat.id);
      setCategories(updatedCats);
      saveToLocalStorage(STORAGE_KEYS.categories, updatedCats);
      syncItem('categories', cat, true);

      if (tiedCount > 0) {
        const targetCatId = duplicateSibling ? duplicateSibling.id : null;
        const changedTxs = [];
        const updatedTxs = transactions.map((t) => {
          if (t.categoryId === cat.id) {
            const upd = { ...t, categoryId: targetCatId };
            changedTxs.push(upd);
            return upd;
          }
          return t;
        });
        setTransactions(updatedTxs);
        saveToLocalStorage(STORAGE_KEYS.transactions, updatedTxs);
        if (changedTxs.length > 0) {
          syncBatchTransactions(changedTxs);
        }
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

  // Criação autônoma de transação disparada pelo Assistente IA (Tool Calling)
  const handleAICreateTransaction = async ({
    descricao,
    valor_reais,
    tipo = 'DESPESA',
    categoria_nome,
    conta_ou_cartao_nome,
    data,
  }) => {
    const amountCents = Math.round(Math.abs(Number(valor_reais || 0)) * 100);
    if (amountCents <= 0) {
      throw new Error('O valor da transação deve ser maior que zero.');
    }

    const tipoUpper = String(tipo || '').toUpperCase();
    const isIncome = tipoUpper.includes('REC') || tipoUpper === 'INCOME';
    const txType = isIncome ? 'INCOME' : 'EXPENSE';

    // 1. Identificar a categoria mais próxima
    const activeCats = categories.filter((c) => !c.archived);
    const typeMatchingCats = activeCats.filter((c) => c.type === txType);
    const catQuery = String(categoria_nome || '').trim().toLowerCase();

    let matchedCat = null;
    if (catQuery) {
      matchedCat = typeMatchingCats.find((c) => c.name.toLowerCase() === catQuery);
      if (!matchedCat) {
        matchedCat = typeMatchingCats.find(
          (c) => c.name.toLowerCase().includes(catQuery) || catQuery.includes(c.name.toLowerCase())
        );
      }
      if (!matchedCat) {
        matchedCat = activeCats.find((c) => c.name.toLowerCase() === catQuery);
      }
    }
    if (!matchedCat) {
      matchedCat = typeMatchingCats[0] || activeCats[0] || null;
    }

    // 2. Identificar Conta ou Cartão
    const activeAccounts = accounts.filter((a) => !a.archived);
    const activeCards = cards.filter((c) => !c.archived);
    const sourceQuery = String(conta_ou_cartao_nome || '').trim().toLowerCase();

    let matchedAccount = null;
    let matchedCard = null;

    if (sourceQuery) {
      matchedCard = activeCards.find(
        (c) =>
          c.name.toLowerCase() === sourceQuery ||
          c.name.toLowerCase().includes(sourceQuery) ||
          sourceQuery.includes(c.name.toLowerCase()) ||
          (c.bank && c.bank.toLowerCase().includes(sourceQuery))
      );

      if (!matchedCard) {
        matchedAccount = activeAccounts.find(
          (a) =>
            a.name.toLowerCase() === sourceQuery ||
            a.name.toLowerCase().includes(sourceQuery) ||
            sourceQuery.includes(a.name.toLowerCase()) ||
            (a.bank && a.bank.toLowerCase().includes(sourceQuery))
        );
      }
    }

    if (!matchedCard && !matchedAccount) {
      const isCardHint =
        sourceQuery.includes('cart') ||
        sourceQuery.includes('fatura') ||
        sourceQuery.includes('crédit');

      if (isCardHint && activeCards.length > 0) {
        matchedCard = activeCards[0];
      } else if (activeAccounts.length > 0) {
        matchedAccount = activeAccounts[0];
      } else if (activeCards.length > 0) {
        matchedCard = activeCards[0];
      }
    }

    // 3. Data e Status
    const todayStr = new Date().toISOString().slice(0, 10);
    const txDate = data && /^\d{4}-\d{2}-\d{2}$/.test(data) ? data : todayStr;
    const isFuture = txDate > todayStr;
    const txStatus = matchedCard ? 'COMPROMETIDO' : isFuture ? 'COMPROMETIDO' : 'REALIZADO';

    const newTx = {
      id: `tx-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      description: descricao || (txType === 'INCOME' ? 'Receita' : 'Despesa'),
      amountCents,
      type: txType,
      status: txStatus,
      date: txDate,
      dueDate: txDate,
      purchaseDate: txDate,
      categoryId: matchedCat ? matchedCat.id : null,
      scope: 'FAMILY',
      ownerId: (currentMemberId && currentMemberId !== 'user-all') ? currentMemberId : (currentUser?.id || 'user-1'),
      accountId: matchedAccount ? matchedAccount.id : null,
      cardId: matchedCard ? matchedCard.id : null,
      isRecurring: false,
      recurrenceRuleId: null,
      _localUpdatedAt: Date.now(),
    };

    const isDemo = isDemoModeState || isDemoMode();

    if (isDemo) {
      setTransactions((prev) => {
        const updated = [...prev, newTx];
        saveToLocalStorage(STORAGE_KEYS.transactions, updated);
        return updated;
      });
    } else {
      markTransactionPending(newTx.id);
      setTransactions((prev) => {
        const updated = [...prev, newTx];
        saveToLocalStorage(STORAGE_KEYS.transactions, updated);
        return updated;
      });
      await syncItem('transactions', newTx);
    }

    return {
      success: true,
      transaction: newTx,
      categoryName: matchedCat?.name || 'Geral',
      sourceName: matchedCard?.name || matchedAccount?.name || 'Geral',
    };
  };

  // Criação autônoma de simulação de cenário pelo Assistente IA (Tool Calling)
  const handleAICreateScenario = async ({
    titulo,
    valor_mensal,
    duracao_meses = 12,
    tipo = 'DESPESA',
  }) => {
    const amountCents = Math.round(Math.abs(Number(valor_mensal || 0)) * 100);
    if (amountCents <= 0) {
      throw new Error('O valor mensal do cenário deve ser maior que zero.');
    }

    const tipoUpper = String(tipo || '').toUpperCase();
    const isIncome = tipoUpper.includes('REC') || tipoUpper === 'INCOME';
    const monthlyImpactCents = isIncome ? amountCents : -amountCents;

    const newScen = {
      id: `scen-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      title: titulo || 'Simulação do Assistente IA',
      type: isIncome ? 'INCOME' : 'EXPENSE',
      monthlyImpactCents,
      months: Math.max(1, parseInt(duracao_meses || 12, 10)),
      startDate: new Date().toISOString().slice(0, 10),
      categoryId: categories.find((c) => c.type === (isIncome ? 'INCOME' : 'EXPENSE'))?.id || categories[0]?.id || null,
      sourceType: 'ACCOUNT',
      accountId: accounts[0]?.id || null,
      cardId: null,
      scope: 'FAMILY',
      ownerId: (currentMemberId && currentMemberId !== 'user-all') ? currentMemberId : 'user-1',
      active: true,
      adjustments: { ignoredIncomes: [], ignoredExpenses: [], categoryReductions: [] },
    };

    const isDemo = isDemoModeState || isDemoMode();

    if (isDemo) {
      setScenarios((prev) => {
        const updated = [...prev, newScen];
        saveToLocalStorage(STORAGE_KEYS.scenarios, updated);
        return updated;
      });
    } else {
      setScenarios((prev) => {
        const updated = [...prev, newScen];
        saveToLocalStorage(STORAGE_KEYS.scenarios, updated);
        return updated;
      });
      await syncItem('scenarios', newScen);
    }

    return {
      success: true,
      scenario: newScen,
    };
  };

  // Abre o modal de pagamento da fatura consolidada de um cartão para um determinado mês
  const openInvoicePaymentModal = (card, monthKey, requestedMode = null) => {
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

    const paymentTx = visibleTransactions.find(
      (t) =>
        t.isInvoicePayment &&
        t.targetCardId === card.id &&
        t.invoiceMonth === monthKey &&
        t.status !== 'CANCELADO'
    );

    const mode = requestedMode || (paymentTx ? 'edit' : 'create');

    setInvoicePaymentModal({
      isOpen: true,
      card,
      monthKey,
      totalCents: totalCents || paymentTx?.amountCents || 0,
      monthItems,
      dueDateIso,
      mode,
      paymentTx: paymentTx || null,
    });
  };

  // Confirmação do pagamento da fatura com débito da conta bancária e quitação dos lançamentos (ou edição)
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

    // Cooldown para evitar que Realtime interfira durante a gravação
    cloudSyncCooldownUntilRef.current = Date.now() + 5000;

    const isEditMode = invoicePaymentModal.mode === 'edit';
    const existingPaymentTx =
      invoicePaymentModal.paymentTx ||
      transactions.find(
        (t) =>
          t.isInvoicePayment &&
          t.targetCardId === card.id &&
          t.invoiceMonth === invoicePaymentModal.monthKey &&
          t.status !== 'CANCELADO'
      );

    if (isEditMode && existingPaymentTx) {
      // 1. Atualizar transação de pagamento existente
      const updatedPaymentTx = {
        ...existingPaymentTx,
        accountId,
        amountCents: paidAmountCents,
        date: paymentDate,
        dueDate: paymentDate,
        description,
        _localUpdatedAt: Date.now(),
      };

      // Remover duplicatas de pagamento órfãs caso existam
      const extraPaymentTxs = transactions.filter(
        (t) =>
          t.isInvoicePayment &&
          t.targetCardId === card.id &&
          t.invoiceMonth === invoicePaymentModal.monthKey &&
          t.id !== existingPaymentTx.id
      );
      if (extraPaymentTxs.length > 0) {
        extraPaymentTxs.forEach((ep) => {
          recentlyDeletedTxIdsRef.current.add(ep.id);
          syncItem('transactions', ep, true).catch(console.warn);
        });
      }
      const extraTxIds = new Set(extraPaymentTxs.map((ep) => ep.id));

      const monthItemIds = new Set(invoicePaymentModal.monthItems.map((i) => i.id));
      const updatedMonthItems = [];

      const updatedTransactions = transactions
        .filter((t) => !extraTxIds.has(t.id))
        .map((t) => {
          if (t.id === existingPaymentTx.id) {
            return updatedPaymentTx;
          }
          if (monthItemIds.has(t.id) && t.status !== 'REALIZADO') {
            const u = { ...t, status: 'REALIZADO', _localUpdatedAt: Date.now() };
            updatedMonthItems.push(u);
            return u;
          }
          return t;
        });

      setTransactions(updatedTransactions);
      saveToLocalStorage(STORAGE_KEYS.transactions, updatedTransactions);
      syncBatchTransactions([updatedPaymentTx, ...updatedMonthItems]).catch(console.warn);
    } else {
      // 2. Novo pagamento de fatura
      // Limpar pagamentos pré-existentes caso haja para este cartão e mês
      const oldPaymentTxs = transactions.filter(
        (t) =>
          t.isInvoicePayment &&
          t.targetCardId === card.id &&
          t.invoiceMonth === invoicePaymentModal.monthKey
      );
      if (oldPaymentTxs.length > 0) {
        oldPaymentTxs.forEach((op) => {
          recentlyDeletedTxIdsRef.current.add(op.id);
          syncItem('transactions', op, true).catch(console.warn);
        });
      }
      const oldPaymentTxIds = new Set(oldPaymentTxs.map((op) => op.id));

      const monthItemIds = new Set(invoicePaymentModal.monthItems.map((i) => i.id));
      const updatedMonthItems = [];

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

      const updatedTransactions = transactions
        .filter((t) => !oldPaymentTxIds.has(t.id))
        .map((t) => {
          if (monthItemIds.has(t.id)) {
            const u = { ...t, status: 'REALIZADO' };
            updatedMonthItems.push(u);
            return u;
          }
          return t;
        });

      updatedTransactions.unshift(paymentTx);

      setTransactions(updatedTransactions);
      saveToLocalStorage(STORAGE_KEYS.transactions, updatedTransactions);
      syncBatchTransactions([...updatedMonthItems, paymentTx]).catch(console.warn);
    }

    setInvoicePaymentModal({
      isOpen: false,
      card: null,
      monthKey: '',
      totalCents: 0,
      monthItems: [],
      dueDateIso: '',
      mode: 'create',
      paymentTx: null,
    });
  };

  // Estornar / Desfazer pagamento de uma fatura de cartão
  const handleRevertInvoicePayment = (card, monthKey) => {
    if (!card || !monthKey) return;
    const confirmEstorno = window.confirm(
      `Deseja estornar o pagamento da fatura de "${card.name}" (${formatMonthLabel(monthKey)})?\n\n• O débito na conta bancária será cancelado e o saldo restaurado.\n• As compras vinculadas voltarão para a situação "Comprometido".`
    );
    if (!confirmEstorno) return;

    // 1. Localizar TODAS as transações de pagamento desta fatura
    const paymentTxs = transactions.filter(
      (t) =>
        t.isInvoicePayment &&
        t.targetCardId === card.id &&
        t.invoiceMonth === monthKey &&
        t.status !== 'CANCELADO'
    );
    const paymentTxIds = new Set(paymentTxs.map((p) => p.id));
    paymentTxs.forEach((p) => recentlyDeletedTxIdsRef.current.add(p.id));

    // Cooldown para impedir que Realtime ressuscite o pagamento antes da gravação no Supabase terminar
    cloudSyncCooldownUntilRef.current = Date.now() + 8000;

    // 2. Reverter os lançamentos da fatura para COMPROMETIDO
    const revertedMonthItems = [];
    const updatedTransactions = transactions
      .filter((t) => !paymentTxIds.has(t.id))
      .map((t) => {
        if (t.cardId === card.id && t.status === 'REALIZADO') {
          const due = getTxDueDate(t) || t.date;
          if (due && due.startsWith(monthKey)) {
            const reverted = { ...t, status: 'COMPROMETIDO', _localUpdatedAt: Date.now() };
            revertedMonthItems.push(reverted);
            return reverted;
          }
        }
        return t;
      });

    setTransactions(updatedTransactions);
    saveToLocalStorage(STORAGE_KEYS.transactions, updatedTransactions);

    // Sincronização segura no Supabase
    paymentTxs.forEach((p) => {
      syncItem('transactions', p, true).catch(console.warn);
    });
    if (revertedMonthItems.length > 0) {
      syncBatchTransactions(revertedMonthItems).catch(console.warn);
    }

    // Fechar modal de pagamento se estiver aberto
    setInvoicePaymentModal({
      isOpen: false,
      card: null,
      monthKey: '',
      totalCents: 0,
      monthItems: [],
      dueDateIso: '',
      mode: 'create',
      paymentTx: null,
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
    const updatedTx = { ...tx, status: nextStatus, _localUpdatedAt: Date.now() };
    markTransactionPending(updatedTx.id);
    const updated = transactions.map((t) => (t.id === tx.id ? updatedTx : t));
    setTransactions(updated);
    saveToLocalStorage(STORAGE_KEYS.transactions, updated);
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

    const updatedTx = { ...tx, status: targetStatus, _localUpdatedAt: Date.now() };
    markTransactionPending(updatedTx.id);
    const updated = transactions.map((t) => (t.id === tx.id ? updatedTx : t));
    setTransactions(updated);
    saveToLocalStorage(STORAGE_KEYS.transactions, updated);
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

  const handleNavigateToOverdueTransactions = useCallback(() => {
    setSearchTerm('');
    setFilterType('ALL');
    setFilterStatus('OVERDUE');
    setFilterSource('ALL');
    setFilterCategory('ALL');
    setFilterScope('ALL');
    setFilterDatePreset('ALL');
    setFilterStartDate('');
    setFilterEndDate('');
    setActiveTab('transactions');
  }, []);

  // Navegação interativa com Drill-Down direto para a aba de Lançamentos
  const handleDrillDownToTransactions = useCallback((categoryId, dateRangeOrMonth = null) => {
    setFilterCategory(categoryId);
    if (typeof dateRangeOrMonth === 'string' && dateRangeOrMonth.match(/^\d{4}-\d{2}$/)) {
      const [year, month] = dateRangeOrMonth.split('-').map(Number);
      const lastDay = new Date(year, month, 0).getDate();
      setFilterStartDate(`${dateRangeOrMonth}-01`);
      setFilterEndDate(`${dateRangeOrMonth}-${String(lastDay).padStart(2, '0')}`);
      setFilterDatePreset('CUSTOM');
    } else if (dateRangeOrMonth && typeof dateRangeOrMonth === 'object') {
      if (dateRangeOrMonth.startDate) setFilterStartDate(dateRangeOrMonth.startDate);
      if (dateRangeOrMonth.endDate) setFilterEndDate(dateRangeOrMonth.endDate);
      setFilterDatePreset('CUSTOM');
    } else {
      setFilterDatePreset('ALL');
      setFilterStartDate('');
      setFilterEndDate('');
    }
    setSearchTerm('');
    setFilterType('ALL');
    setFilterStatus('ALL');
    setFilterSource('ALL');
    setActiveTab('transactions');
  }, []);

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

    // Conjunto de IDs de categoria correspondentes (inclui a categoria pai e todas as suas subcategorias)
    const matchingCatIds = filterCategory !== 'ALL'
      ? new Set([filterCategory, ...categories.filter((c) => c.parentId === filterCategory).map((c) => c.id)])
      : null;

    const list = allDisplayTransactions.filter((t) => {
      const effectiveDate = getTxDueDate(t) || t.date || '';

      // Tratamento especial para Fatura Mestre (Consolidada)
      if (t.isInvoiceMaster) {
        // 1. Busca por texto livre (verifica a fatura, conta debitada e todos os itens aninhados nela)
        if (searchTerm.trim()) {
          const term = searchTerm.toLowerCase();
          const masterMatch = (t.description || '').toLowerCase().includes(term) || (t.card?.name || '').toLowerCase().includes(term);
          const debitedAcc = accounts.find((a) => a.id === t.accountId);
          const accMatch = debitedAcc && (debitedAcc.name.toLowerCase().includes(term) || (debitedAcc.bank || '').toLowerCase().includes(term));
          const hasItemMatch = t.items.some((item) => {
            const desc = (item.description || '').toLowerCase();
            const catName = categories.find((c) => c.id === item.categoryId)?.name?.toLowerCase() || '';
            const purchaseBR = item.purchaseDate ? formatDateBR(item.purchaseDate).toLowerCase() : '';
            return desc.includes(term) || catName.includes(term) || purchaseBR.includes(term);
          });
          if (!masterMatch && !accMatch && !hasItemMatch) return false;
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

        // 5. Categoria (fatura é exibida se contiver compras da categoria filtrada ou de suas subcategorias)
        if (matchingCatIds) {
          const hasCatMatch = t.items.some((item) => matchingCatIds.has(item.categoryId));
          if (!hasCatMatch) return false;
        }

        // 6. Escopo
        if (filterScope !== 'ALL' && t.scope !== filterScope) {
          return false;
        }

        // 7. Intervalo de Datas (contas em atraso não devem ser ocultadas por filtros de data)
        if (filterStatus !== 'OVERDUE') {
          if (filterStartDate && effectiveDate < filterStartDate) return false;
          if (filterEndDate && effectiveDate > filterEndDate) return false;
        }

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

      // 5. Categoria (com suporte a subcategorias)
      if (matchingCatIds && !matchingCatIds.has(t.categoryId)) {
        return false;
      }

      // 6. Escopo (Familiar / Pessoal)
      if (filterScope !== 'ALL' && t.scope !== filterScope) {
        return false;
      }

      // 7. Filtro por Data Inicial / Final (contas em atraso não devem ser ocultadas por filtros de data)
      if (filterStatus !== 'OVERDUE') {
        if (filterStartDate && effectiveDate < filterStartDate) {
          return false;
        }
        if (filterEndDate && effectiveDate > filterEndDate) {
          return false;
        }
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

  // Função auxiliar para obter apenas os itens da fatura que atendem aos filtros ativos (categoria, busca, etc.)
  const getMatchingInvoiceItems = useCallback(
    (tx, activeCategory = filterCategory, activeSearch = searchTerm) => {
      if (!tx.isInvoiceMaster || !Array.isArray(tx.items)) return [];
      const hasCatFilter = activeCategory !== 'ALL';
      const hasSearch = Boolean(activeSearch && activeSearch.trim());

      if (!hasCatFilter && !hasSearch) {
        return tx.items;
      }

      const matchingCatIds = hasCatFilter
        ? new Set([activeCategory, ...categories.filter((c) => c.parentId === activeCategory).map((c) => c.id)])
        : null;
      const term = hasSearch ? activeSearch.trim().toLowerCase() : '';

      return tx.items.filter((item) => {
        if (matchingCatIds && !matchingCatIds.has(item.categoryId)) {
          return false;
        }
        if (term) {
          const desc = (item.description || '').toLowerCase();
          const catName = categories.find((c) => c.id === item.categoryId)?.name?.toLowerCase() || '';
          const purchaseBR = item.purchaseDate ? formatDateBR(item.purchaseDate).toLowerCase() : '';
          const matchesItem = desc.includes(term) || catName.includes(term) || purchaseBR.includes(term);
          const matchesMaster = (tx.description || '').toLowerCase().includes(term) || (tx.card?.name || '').toLowerCase().includes(term);
          if (!matchesItem && !matchesMaster) return false;
        }
        return true;
      });
    },
    [filterCategory, searchTerm, categories]
  );

  // Totais consolidados dos lançamentos filtrados para o mini-resumo
  const filteredTotals = useMemo(() => {
    let incomeCents = 0;
    let expenseCents = 0;
    let totalCount = 0;
    const isCategoryOrSearchActive = filterCategory !== 'ALL' || Boolean(searchTerm && searchTerm.trim());

    filteredTransactions.forEach((tx) => {
      if (tx.status === 'CANCELADO') return;

      if (tx.isInvoiceMaster) {
        if (isCategoryOrSearchActive) {
          const matching = getMatchingInvoiceItems(tx);
          const matchingSum = matching.reduce((acc, it) => acc + (it.amountCents || 0), 0);
          expenseCents += matchingSum;
          totalCount += matching.length;
        } else {
          expenseCents += tx.amountCents;
          totalCount += 1;
        }
      } else {
        if (tx.type === 'INCOME') {
          incomeCents += tx.amountCents;
        } else if (tx.type === 'EXPENSE') {
          expenseCents += tx.amountCents;
        }
        totalCount += 1;
      }
    });

    return {
      incomeCents,
      expenseCents,
      netCents: incomeCents - expenseCents,
      count: totalCount,
    };
  }, [filteredTransactions, filterCategory, searchTerm, getMatchingInvoiceItems]);

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
    <div className={`min-h-screen bg-slate-50 text-slate-900 flex flex-col antialiased font-sans ${isPrivacyMode ? 'privacy-mode-active' : ''}`}>
      {/* Barra de Topo Fixa: Banner de Demonstração (se ativo) + Navegação Superior */}
      <Navbar
        isDemoModeState={isDemoModeState}
        isCloudConnected={isCloudConnected}
        isPrivacyMode={isPrivacyMode}
        togglePrivacyMode={togglePrivacyMode}
        handleResetDemoSandbox={handleResetDemoSandbox}
        handleExitDemo={handleExitDemo}
        handleLogout={handleLogout}
        isAIChatOpen={isAIChatOpen}
        setIsAIChatOpen={setIsAIChatOpen}
        currentUser={currentUser}
        currentMemberId={currentMemberId}
        setCurrentMemberId={setCurrentMemberId}
        openTransactionModal={openTransactionModal}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {/* Conteúdo Principal */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {/* ===================== ABA: VISÃO GERAL ===================== */}
        {activeTab === 'dashboard' && (
          <DashboardTab
            currentMemberId={currentMemberId}
            setCurrentMemberId={setCurrentMemberId}
            accounts={accounts}
            transactions={transactions}
            isDemoModeState={isDemoModeState}
            handleLoadDemoData={handleLoadDemoData}
            handleClearOnlyDemo={handleClearOnlyDemo}
            setModalState={setModalState}
            dashboardMonth={dashboardMonth}
            setDashboardMonth={setDashboardMonth}
            changeDashboardMonth={changeDashboardMonth}
            currentActualMonth={currentActualMonth}
            overdueTransactions={overdueTransactions}
            overdueExpensesTotalCents={overdueExpensesTotalCents}
            handleNavigateToOverdueTransactions={handleNavigateToOverdueTransactions}
            togglePrivacyMode={togglePrivacyMode}
            isPrivacyMode={isPrivacyMode}
            monthSummary={monthSummary}
            activeScenariosMonthlyNet={activeScenariosMonthlyNet}
            setActiveTab={setActiveTab}
            dashboardCategoryMode={dashboardCategoryMode}
            setDashboardCategoryMode={setDashboardCategoryMode}
            dashboardCategoryChartData={dashboardCategoryChartData}
            handleDrillDownToTransactions={handleDrillDownToTransactions}
            dashboardEnvelopes={dashboardEnvelopes}
            setEnvelopeSelectedMonth={setEnvelopeSelectedMonth}
            upcomingCommitments={upcomingCommitments}
            cards={cards}
            cardStats={cardStats}
            setInvoiceSelectedMonth={setInvoiceSelectedMonth}
            openInvoicePaymentModal={openInvoicePaymentModal}
          />
        )}

        {/* ===================== ABA: LANÇAMENTOS ===================== */}
        {activeTab === 'transactions' && (
          <TransactionsTab
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            filterDatePreset={filterDatePreset}
            setFilterDatePreset={setFilterDatePreset}
            handleDatePresetChange={handleDatePresetChange}
            filterStartDate={filterStartDate}
            setFilterStartDate={setFilterStartDate}
            filterEndDate={filterEndDate}
            setFilterEndDate={setFilterEndDate}
            showFilterDrawer={showFilterDrawer}
            setShowFilterDrawer={setShowFilterDrawer}
            activeFiltersCount={activeFiltersCount}
            cardInvoiceMasters={cardInvoiceMasters}
            filteredTransactions={filteredTransactions}
            expandedInvoices={expandedInvoices}
            setExpandedInvoices={setExpandedInvoices}
            transactions={transactions}
            handleClearOnlyDemo={handleClearOnlyDemo}
            openTransactionModal={openTransactionModal}
            filterType={filterType}
            setFilterType={setFilterType}
            filterStatus={filterStatus}
            setFilterStatus={setFilterStatus}
            overdueTransactions={overdueTransactions}
            filterSource={filterSource}
            setFilterSource={setFilterSource}
            filterCategory={filterCategory}
            setFilterCategory={setFilterCategory}
            filterScope={filterScope}
            setFilterScope={setFilterScope}
            categories={categories}
            accounts={accounts}
            cards={cards}
            isAnyFilterActive={isAnyFilterActive}
            handleResetFilters={handleResetFilters}
            filteredTotals={filteredTotals}
            allDisplayTransactions={allDisplayTransactions}
            handleSortTransactions={handleSortTransactions}
            txSort={txSort}
            getMatchingInvoiceItems={getMatchingInvoiceItems}
            openInvoicePaymentModal={openInvoicePaymentModal}
            handleOpenDeleteInvoiceModal={handleOpenDeleteInvoiceModal}
            handleDeleteTransaction={handleDeleteTransaction}
            toggleStatusPaid={toggleStatusPaid}
            handleConvertScenarioToReal={handleConvertScenarioToReal}
            scenarios={scenarios}
            handleQuickPayTransaction={handleQuickPayTransaction}
          />
        )}

        {/* ===================== ABA: ANÁLISE GRÁFICA ===================== */}
        {activeTab === 'charts' && (
          <ChartsTab
            currentMemberId={currentMemberId}
            chartFlowFilter={chartFlowFilter}
            setChartFlowFilter={setChartFlowFilter}
            chartIncludeScenarios={chartIncludeScenarios}
            setChartIncludeScenarios={setChartIncludeScenarios}
            chartPeriodFilter={chartPeriodFilter}
            setChartPeriodFilter={setChartPeriodFilter}
            dashboardMonth={dashboardMonth}
            chartSpecificMonth={chartSpecificMonth}
            setChartSpecificMonth={setChartSpecificMonth}
            availableInvoiceMonths={availableInvoiceMonths}
            categoryChartData={categoryChartData}
            chartCategoryViewMode={chartCategoryViewMode}
            setChartCategoryViewMode={setChartCategoryViewMode}
            handleDrillDownToTransactions={handleDrillDownToTransactions}
            activeChartMonth={activeChartMonth}
            getChartDateRange={getChartDateRange}
          />
        )}

        {/* ===================== SUB-ABAS DO MÓDULO: CONTAS & FATURAS ===================== */}
        {['accounts', 'faturas'].includes(activeTab) && (
          <div className="flex items-center space-x-1.5 bg-slate-200/80 p-1 rounded-xl w-fit mb-6 shadow-2xs">
            <button
              type="button"
              onClick={() => setActiveTab('accounts')}
              className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition ${
                activeTab === 'accounts' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Wallet className="w-4 h-4" />
              <span>Contas & Cartões</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('faturas')}
              className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition ${
                activeTab === 'faturas' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <CreditCard className="w-4 h-4" />
              <span>Faturas dos Cartões</span>
            </button>
          </div>
        )}

        {/* ===================== ABA: CONTAS & CARTÕES ===================== */}
        {activeTab === 'accounts' && (
          <AccountsTab
            visibleAccounts={visibleAccounts}
            accountBalances={accountBalances}
            visibleCards={visibleCards}
            cardStats={cardStats}
            setModalState={setModalState}
            toggleArchiveAccount={toggleArchiveAccount}
            handleDeleteAccount={handleDeleteAccount}
            toggleArchiveCard={toggleArchiveCard}
            handleDeleteCard={handleDeleteCard}
          />
        )}

        {/* ===================== ABA: FATURAS DOS CARTÕES ===================== */}
        {activeTab === 'faturas' && (
          <CardsInvoicesTab
            cards={cards}
            faturasCardsData={faturasCardsData}
            invoiceSelectedMonth={invoiceSelectedMonth}
            setInvoiceSelectedMonth={setInvoiceSelectedMonth}
            changeInvoiceSelectedMonth={changeInvoiceSelectedMonth}
            availableInvoiceMonths={availableInvoiceMonths}
            currentActualMonth={currentActualMonth}
            openInvoicePaymentModal={openInvoicePaymentModal}
            handleOpenDeleteInvoiceModal={handleOpenDeleteInvoiceModal}
            handleRevertInvoicePayment={handleRevertInvoicePayment}
            openTransactionModal={openTransactionModal}
            categories={categories}
            accounts={accounts}
            setActiveTab={setActiveTab}
            setModalState={setModalState}
          />
        )}

        {/* ===================== SUB-ABAS DO MÓDULO: ENVELOPES & CATEGORIAS ===================== */}
        {['envelopes', 'categories'].includes(activeTab) && (
          <div className="flex items-center space-x-1.5 bg-slate-200/80 p-1 rounded-xl w-fit mb-6 shadow-2xs">
            <button
              type="button"
              onClick={() => setActiveTab('envelopes')}
              className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition ${
                activeTab === 'envelopes' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Mail className="w-4 h-4" />
              <span>✉️ Envelopes de Gastos</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('categories')}
              className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition ${
                activeTab === 'categories' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Tags className="w-4 h-4" />
              <span>🏷️ Categorias & Tetos</span>
            </button>
          </div>
        )}

        {/* ===================== ABA: ENVELOPES DE GASTOS & ORÇAMENTO ===================== */}
        {activeTab === 'envelopes' && (
          <EnvelopesTab
            envelopeSelectedMonth={envelopeSelectedMonth}
            setEnvelopeSelectedMonth={setEnvelopeSelectedMonth}
            changeEnvelopeSelectedMonth={changeEnvelopeSelectedMonth}
            currentActualMonth={currentActualMonth}
            getEnvelopesForMonth={getEnvelopesForMonth}
            setEnvelopeModalState={setEnvelopeModalState}
            setDeleteEnvelopeModalState={setDeleteEnvelopeModalState}
          />
        )}

        {/* ===================== ABA: CATEGORIAS ===================== */}
        {activeTab === 'categories' && (
          <CategoriesTab
            categories={categories}
            setModalState={setModalState}
            toggleArchiveCategory={toggleArchiveCategory}
            handleDeleteCategory={handleDeleteCategory}
          />
        )}

        {/* ===================== SUB-ABAS DO MÓDULO: PROJEÇÕES & CENÁRIOS ===================== */}
        {['projections', 'scenarios'].includes(activeTab) && (
          <div className="flex items-center space-x-1.5 bg-slate-200/80 p-1 rounded-xl w-fit mb-6 shadow-2xs">
            <button
              type="button"
              onClick={() => setActiveTab('projections')}
              className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition ${
                activeTab === 'projections' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span>📅 Projeção do Fluxo de Caixa</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('scenarios')}
              className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition ${
                activeTab === 'scenarios' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Sliders className="w-4 h-4" />
              <span>✨ Cenários & Simulações</span>
            </button>
          </div>
        )}

        {/* ===================== ABA: PROJEÇÕES DO FLUXO DE CAIXA ===================== */}
        {activeTab === 'projections' && (
          <ProjectionsTab
            scenarios={scenarios}
            projectionHorizon={projectionHorizon}
            setProjectionHorizon={setProjectionHorizon}
            whatIfSimulation={whatIfSimulation}
            setWhatIfSimulation={setWhatIfSimulation}
            whatIfSummary={whatIfSummary}
            showWhatIfDrawer={showWhatIfDrawer}
            setShowWhatIfDrawer={setShowWhatIfDrawer}
            currentActualMonth={currentActualMonth}
            availableWhatIfStreams={availableWhatIfStreams}
            categories={categories}
            handleSaveWhatIfAsScenario={handleSaveWhatIfAsScenario}
            visibleTransactions={visibleTransactions}
            monthSummary={monthSummary}
            monthlyEnvelopes={monthlyEnvelopes}
            projectionSort={projectionSort}
            setProjectionSort={setProjectionSort}
          />
        )}

        {/* ===================== ABA: CENÁRIOS & SIMULAÇÕES ===================== */}
        {activeTab === 'scenarios' && (
          <ScenariosTab
            scenarios={scenarios}
            setScenarios={setScenarios}
            categories={categories}
            accounts={accounts}
            cards={cards}
            setModalSourceType={setModalSourceType}
            setModalState={setModalState}
            handleDeleteScenario={handleDeleteScenario}
            handleConvertScenarioToReal={handleConvertScenarioToReal}
          />
        )}

        {/* ===================== ABA: IMPORTAÇÃO ===================== */}
        {activeTab === 'import' && (
          <ImportTab
            cards={cards}
            categories={categories}
            importSelectedCard={importSelectedCard}
            setImportSelectedCard={setImportSelectedCard}
            importPreviewData={importPreviewData}
            setImportPreviewData={setImportPreviewData}
            importMetadata={importMetadata}
            setImportMetadata={setImportMetadata}
            isImportLoading={isImportLoading}
            handleFileUpload={handleFileUpload}
            importSummary={importSummary}
            importFilterTab={importFilterTab}
            setImportFilterTab={setImportFilterTab}
            importDefaultStatus={importDefaultStatus}
            setImportDefaultStatus={setImportDefaultStatus}
            handleSelectAllImport={handleSelectAllImport}
            handleDeselectDuplicates={handleDeselectDuplicates}
            handleUpdateImportItem={handleUpdateImportItem}
            handleConfirmImport={handleConfirmImport}
          />
        )}

        {/* ===================== ABA: EXPORTAR & BACKUP ===================== */}
        {activeTab === 'exports' && (
          <ExportsTab
            exportData={exportData}
            isPrivacyMode={isPrivacyMode}
            togglePrivacyMode={togglePrivacyMode}
            isDemoModeState={isDemoModeState}
            handleLoadDemoData={handleLoadDemoData}
            handleClearOnlyDemo={handleClearOnlyDemo}
            handleResetEntireSystem={handleResetEntireSystem}
          />
        )}
      </main>

      {/* ===================== MODAIS ===================== */}
      <EntityModal
        modalState={modalState}
        setModalState={setModalState}
        categories={categories}
        accounts={accounts}
        cards={cards}
        handleSaveScenario={handleSaveScenario}
        handleSaveAccount={handleSaveAccount}
        handleSaveCard={handleSaveCard}
        handleSaveCategory={handleSaveCategory}
      />

      <TransactionModal
        modalState={modalState}
        setModalState={setModalState}
        modalSourceType={modalSourceType}
        setModalSourceType={setModalSourceType}
        editScope={editScope}
        setEditScope={setEditScope}
        formAmount={formAmount}
        setFormAmount={setFormAmount}
        installmentValueMode={installmentValueMode}
        setInstallmentValueMode={setInstallmentValueMode}
        formInstallments={formInstallments}
        setFormInstallments={setFormInstallments}
        formStartInstallment={formStartInstallment}
        setFormStartInstallment={setFormStartInstallment}
        formIsRecurring={formIsRecurring}
        setFormIsRecurring={setFormIsRecurring}
        formRecurringMonths={formRecurringMonths}
        setFormRecurringMonths={setFormRecurringMonths}
        isSubmittingTx={isSubmittingTx}
        handleSaveTransaction={handleSaveTransaction}
        accounts={accounts}
        cards={cards}
        categories={categories}
        currentUser={currentUser}
      />

      <DeleteTransactionModal
        deleteModalState={deleteModalState}
        setDeleteModalState={setDeleteModalState}
        handleConfirmDeleteTransaction={handleConfirmDeleteTransaction}
        categories={categories}
        accounts={accounts}
        cards={cards}
        transactions={transactions}
        formatDateBR={formatDateBR}
      />

      <DeleteInvoiceModal
        deleteInvoiceModalState={deleteInvoiceModalState}
        setDeleteInvoiceModalState={setDeleteInvoiceModalState}
        handleConfirmDeleteInvoice={handleConfirmDeleteInvoice}
      />

      <InvoicePaymentModal
        invoicePaymentModal={invoicePaymentModal}
        setInvoicePaymentModal={setInvoicePaymentModal}
        handleConfirmInvoicePayment={handleConfirmInvoicePayment}
        handleRevertInvoicePayment={handleRevertInvoicePayment}
        accounts={accounts}
        accountBalances={accountBalances}
        visibleTransactions={visibleTransactions}
        categories={categories}
      />

      <CardPaymentPromptModal
        cardPaymentPromptModal={cardPaymentPromptModal}
        setCardPaymentPromptModal={setCardPaymentPromptModal}
        openInvoicePaymentModal={openInvoicePaymentModal}
      />

      <EnvelopeScheduleModal
        envelopeModalState={envelopeModalState}
        setEnvelopeModalState={setEnvelopeModalState}
        categories={categories}
        monthlyEnvelopes={monthlyEnvelopes}
        envelopeSelectedMonth={envelopeSelectedMonth}
        currentActualMonth={currentActualMonth}
        handleSaveEnvelopeSchedule={handleSaveEnvelopeSchedule}
      />

      <DeleteEnvelopeModal
        deleteEnvelopeModalState={deleteEnvelopeModalState}
        setDeleteEnvelopeModalState={setDeleteEnvelopeModalState}
        monthlyEnvelopes={monthlyEnvelopes}
        handleConfirmDeleteEnvelope={handleConfirmDeleteEnvelope}
      />

      <CategoryConflictModal
        categoryConflictModal={categoryConflictModal}
        setCategoryConflictModal={setCategoryConflictModal}
        handleResolveCategoryConflict={handleResolveCategoryConflict}
      />

      {/* Modal de Autenticação e Gestão de Perfis */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />

      {/* Assistente de IA Financeiro Conversacional (Google Gemini) */}
      <AIChatDrawer
        isOpen={isAIChatOpen}
        onToggle={setIsAIChatOpen}
        dashboardMonth={dashboardMonth}
        accounts={accounts}
        cards={cards}
        categories={categories}
        transactions={visibleTransactions}
        scenarios={scenarios}
        monthlyEnvelopes={monthlyEnvelopes}
        accountBalances={accountBalances}
        cardStats={cardStats}
        monthSummary={monthSummary}
        dashboardEnvelopes={dashboardEnvelopes}
        isDemo={Boolean(isDemoModeState || isDemoMode())}
        onCreateTransaction={handleAICreateTransaction}
        onCreateScenario={handleAICreateScenario}
        onNavigateTab={(tab) => setActiveTab(tab)}
      />
    </div>
  );
}
