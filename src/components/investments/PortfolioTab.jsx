import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  Landmark,
  Building2,
  Coins,
  ShieldCheck,
  Plus,
  Search,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Edit2,
  Trash2,
  PieChart,
  Sparkles,
  DollarSign,
  CheckCircle2,
} from 'lucide-react';
import { formatMoney } from '../../utils/formatters';
import { FAMILY_MEMBERS } from '../../data/constants';
import { useFinance } from '../../contexts/FinanceContext';
import {
  AssetModal,
  QuickUpdatePriceModal,
  DeleteAssetModal,
} from '../modals/AssetModal';

export default function PortfolioTab({
  visiblePortfolioAssets: propVisiblePortfolioAssets,
  portfolioSummary: propPortfolioSummary,
  handleSavePortfolioAsset: propHandleSavePortfolioAsset,
  handleDeletePortfolioAsset: propHandleDeletePortfolioAsset,
  handleUpdateAssetPrice: propHandleUpdateAssetPrice,
  visibleSavingsGoals: propVisibleSavingsGoals,
  savingsGoalBalances: propSavingsGoalBalances,
  currentMemberId: propCurrentMemberId,
  setActiveTab: propSetActiveTab,
}) {
  const finance = useFinance();

  const visiblePortfolioAssets = propVisiblePortfolioAssets || finance.visiblePortfolioAssets || [];
  const portfolioSummary = propPortfolioSummary || finance.portfolioSummary || {
    totalInvestedCents: 0,
    currentValueCents: 0,
    profitLossCents: 0,
    profitLossPercent: 0,
    byType: {},
    totalAssetsCount: 0,
  };
  const handleSavePortfolioAsset = propHandleSavePortfolioAsset || finance.handleSavePortfolioAsset;
  const handleDeletePortfolioAsset = propHandleDeletePortfolioAsset || finance.handleDeletePortfolioAsset;
  const handleUpdateAssetPrice = propHandleUpdateAssetPrice || finance.handleUpdateAssetPrice;
  const visibleSavingsGoals = propVisibleSavingsGoals || finance.visibleSavingsGoals || [];
  const savingsGoalBalances = propSavingsGoalBalances || finance.savingsGoalBalances || {};
  const currentMemberId = propCurrentMemberId || finance.currentMemberId || 'user-all';
  const setActiveTab = propSetActiveTab || finance.setActiveTab;

  // Estados dos modais
  const [modalState, setModalState] = useState({ isOpen: false, mode: 'create', data: null });
  const [quickPriceAsset, setQuickPriceAsset] = useState(null);
  const [deleteAsset, setDeleteAsset] = useState(null);

  // Filtros
  const [categoryFilter, setCategoryFilter] = useState('ALL'); // 'ALL' | 'CRYPTO' | 'STOCK' | 'FII' | 'TREASURY_FIXED'
  const [searchTerm, setSearchTerm] = useState('');

  // Total de Cofrinhos & Reservas (Fase 6.1)
  const totalSavingsBalanceCents = useMemo(() => {
    return visibleSavingsGoals.reduce((sum, g) => sum + (savingsGoalBalances[g.id] || 0), 0);
  }, [visibleSavingsGoals, savingsGoalBalances]);

  // Alocação Consolidada de Patrimônio (Carteira + Cofrinhos CDI da Fase 6.1)
  const allocation = useMemo(() => {
    let cryptoCents = 0;
    let stocksFiisCents = 0;
    let treasuryFixedIncomeCents = 0;

    visiblePortfolioAssets.forEach((a) => {
      const curVal = Math.round(Number(a.quantity || 0) * Number(a.currentPriceCents || 0));
      if (a.assetType === 'CRYPTO') {
        cryptoCents += curVal;
      } else if (a.assetType === 'STOCK' || a.assetType === 'FII') {
        stocksFiisCents += curVal;
      } else {
        treasuryFixedIncomeCents += curVal;
      }
    });

    const totalPortfolioCents = cryptoCents + stocksFiisCents + treasuryFixedIncomeCents;
    const totalAllocatedCents = totalPortfolioCents + totalSavingsBalanceCents;

    const getPct = (val) => (totalAllocatedCents > 0 ? (val / totalAllocatedCents) * 100 : 0);

    return {
      cryptoCents,
      stocksFiisCents,
      treasuryFixedIncomeCents,
      savingsCents: totalSavingsBalanceCents,
      totalPortfolioCents,
      totalAllocatedCents,
      cryptoPct: getPct(cryptoCents),
      stocksFiisPct: getPct(stocksFiisCents),
      treasuryFixedIncomePct: getPct(treasuryFixedIncomeCents),
      savingsPct: getPct(totalSavingsBalanceCents),
    };
  }, [visiblePortfolioAssets, totalSavingsBalanceCents]);

  // Filtragem dos ativos
  const filteredAssets = useMemo(() => {
    return visiblePortfolioAssets.filter((asset) => {
      // Filtro de busca
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchesTicker = asset.ticker?.toLowerCase().includes(term);
        const matchesName = asset.name?.toLowerCase().includes(term);
        const matchesInstitution = asset.institution?.toLowerCase().includes(term);
        if (!matchesTicker && !matchesName && !matchesInstitution) return false;
      }

      // Filtro de categoria
      if (categoryFilter === 'CRYPTO') return asset.assetType === 'CRYPTO';
      if (categoryFilter === 'STOCK') return asset.assetType === 'STOCK';
      if (categoryFilter === 'FII') return asset.assetType === 'FII';
      if (categoryFilter === 'TREASURY_FIXED') return asset.assetType === 'TREASURY' || asset.assetType === 'FIXED_INCOME';

      return true;
    });
  }, [visiblePortfolioAssets, categoryFilter, searchTerm]);

  // Auxiliar para ícones de tipo de ativo
  const getAssetBadge = (type) => {
    switch (type) {
      case 'CRYPTO':
        return {
          icon: Coins,
          label: 'Criptomoeda',
          badgeClass: 'bg-amber-100 text-amber-800 border-amber-200',
          iconColor: 'text-amber-500',
          bgIcon: 'bg-amber-50',
        };
      case 'STOCK':
        return {
          icon: TrendingUp,
          label: 'Ações B3',
          badgeClass: 'bg-blue-100 text-blue-800 border-blue-200',
          iconColor: 'text-blue-500',
          bgIcon: 'bg-blue-50',
        };
      case 'FII':
        return {
          icon: Building2,
          label: 'Fundo Imobiliário',
          badgeClass: 'bg-purple-100 text-purple-800 border-purple-200',
          iconColor: 'text-purple-500',
          bgIcon: 'bg-purple-50',
        };
      case 'TREASURY':
        return {
          icon: Landmark,
          label: 'Tesouro Direto',
          badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-200',
          iconColor: 'text-emerald-500',
          bgIcon: 'bg-emerald-50',
        };
      default:
        return {
          icon: ShieldCheck,
          label: 'Renda Fixa',
          badgeClass: 'bg-indigo-100 text-indigo-800 border-indigo-200',
          iconColor: 'text-indigo-500',
          bgIcon: 'bg-indigo-50',
        };
    }
  };

  return (
    <div className="space-y-6">
      {/* ===================== BANNER PRINCIPAL COM BOTÃO DE NOVO ATIVO ===================== */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 text-white p-6 sm:p-8 rounded-3xl shadow-md border border-slate-700/80 relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-10 -translate-y-10 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-2xl">
            <div className="flex items-center space-x-2.5 mb-2.5">
              <span className="p-1.5 bg-blue-500/20 text-blue-400 border border-blue-400/30 rounded-lg">
                <TrendingUp className="w-5 h-5" />
              </span>
              <span className="text-xs font-bold uppercase tracking-wider text-blue-300">
                Módulo de Investimentos • Fase 6.2
              </span>
              <span className="text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full flex items-center space-x-1">
                <CheckCircle2 className="w-3 h-3" />
                <span>Ativa & Funcional</span>
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Carteira de Ativos & Renda Variável
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 mt-2 leading-relaxed">
              Acompanhe suas Criptomoedas, Ações da B3, Fundos Imobiliários e Tesouro Direto com preço médio, valor de mercado atualizado e rentabilidade em tempo real.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 self-start md:self-auto">
            <button
              type="button"
              onClick={() => setModalState({ isOpen: true, mode: 'create', data: null })}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 active:scale-95 text-white font-bold text-xs sm:text-sm rounded-xl transition shadow-md flex items-center space-x-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Novo Ativo</span>
            </button>
          </div>
        </div>
      </div>

      {/* ===================== CARDS DE RESUMO NO TOPO ===================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Aplicado */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Aplicado</span>
            <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900">
              {formatMoney(portfolioSummary.totalInvestedCents)}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              Custo histórico de aquisição
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-100 text-[11px] text-slate-500 flex justify-between">
            <span>Ativos em carteira:</span>
            <strong className="text-slate-800">{visiblePortfolioAssets.length}</strong>
          </div>
        </div>

        {/* Card 2: Valor Atual de Mercado */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Patrimônio em Carteira</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-blue-700">
              {formatMoney(portfolioSummary.currentValueCents)}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              Valor de mercado consolidado hoje
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-100 text-[11px] text-slate-500 flex justify-between">
            <span>Última cotação:</span>
            <span className="text-emerald-700 font-medium">Tempo real</span>
          </div>
        </div>

        {/* Card 3: Lucro / Prejuízo Total */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Rentabilidade Total</span>
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
              portfolioSummary.profitLossCents >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
            }`}>
              {portfolioSummary.profitLossCents >= 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
            </div>
          </div>
          <div>
            <div className={`text-2xl font-bold flex items-baseline space-x-1.5 ${
              portfolioSummary.profitLossCents >= 0 ? 'text-emerald-600' : 'text-rose-600'
            }`}>
              <span>{portfolioSummary.profitLossCents >= 0 ? '+' : ''}{formatMoney(portfolioSummary.profitLossCents)}</span>
            </div>
            <div className="mt-1">
              <span className={`inline-flex items-center space-x-1 text-xs font-bold px-2 py-0.5 rounded-full ${
                portfolioSummary.profitLossCents >= 0
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-rose-100 text-rose-800'
              }`}>
                {portfolioSummary.profitLossCents >= 0 ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                <span>{portfolioSummary.profitLossPercent >= 0 ? '+' : ''}{portfolioSummary.profitLossPercent.toFixed(2)}%</span>
              </span>
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-100 text-[11px] text-slate-500 flex justify-between">
            <span>Retorno sobre o investido</span>
            <span className="font-semibold text-slate-700">Nominal / %</span>
          </div>
        </div>

        {/* Card 4: Patrimônio Total da Família */}
        <div className="bg-gradient-to-br from-slate-900 to-indigo-950 text-white p-5 rounded-2xl border border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-300 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">Patrimônio Investido</span>
            <Sparkles className="w-4 h-4 text-amber-400" />
          </div>
          <div>
            <div className="text-2xl font-black text-white">
              {formatMoney(allocation.totalAllocatedCents)}
            </div>
            <div className="text-[11px] text-slate-300 mt-1">
              Carteira + Cofrinhos CDI (100%)
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-800 text-[11px] text-slate-300 flex justify-between">
            <span>🛡️ Reserva em Cofrinhos:</span>
            <span className="font-bold text-emerald-300">{formatMoney(allocation.savingsCents)}</span>
          </div>
        </div>
      </div>

      {/* ===================== PAINEL DE ALOCAÇÃO PATRIMONIAL ===================== */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
              <PieChart className="w-5 h-5 text-indigo-600" />
              <span>Alocação de Ativos da Família (Asset Allocation)</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Distribuição percentual consolidada entre Cofrinhos/Reserva CDI, Renda Fixa, Ações/FIIs e Criptoativos
            </p>
          </div>
          <span className="text-[11px] bg-slate-100 text-slate-700 px-3 py-1 rounded-full font-semibold border border-slate-200 self-start sm:self-auto">
            Total Alocado: {formatMoney(allocation.totalAllocatedCents)}
          </span>
        </div>

        {/* Barra Proporcional Multi-Segmento */}
        <div className="w-full bg-slate-100 h-4 rounded-full overflow-hidden flex shadow-inner">
          {allocation.savingsPct > 0 && (
            <div
              className="bg-emerald-500 hover:bg-emerald-600 transition relative group"
              style={{ width: `${allocation.savingsPct}%` }}
              title={`Cofrinhos & Reserva: ${allocation.savingsPct.toFixed(1)}% (${formatMoney(allocation.savingsCents)})`}
            />
          )}
          {allocation.treasuryFixedIncomePct > 0 && (
            <div
              className="bg-sky-500 hover:bg-sky-600 transition relative group"
              style={{ width: `${allocation.treasuryFixedIncomePct}%` }}
              title={`Tesouro & Renda Fixa: ${allocation.treasuryFixedIncomePct.toFixed(1)}% (${formatMoney(allocation.treasuryFixedIncomeCents)})`}
            />
          )}
          {allocation.stocksFiisPct > 0 && (
            <div
              className="bg-indigo-600 hover:bg-indigo-700 transition relative group"
              style={{ width: `${allocation.stocksFiisPct}%` }}
              title={`Ações & FIIs: ${allocation.stocksFiisPct.toFixed(1)}% (${formatMoney(allocation.stocksFiisCents)})`}
            />
          )}
          {allocation.cryptoPct > 0 && (
            <div
              className="bg-amber-500 hover:bg-amber-600 transition relative group"
              style={{ width: `${allocation.cryptoPct}%` }}
              title={`Criptoativos: ${allocation.cryptoPct.toFixed(1)}% (${formatMoney(allocation.cryptoCents)})`}
            />
          )}
        </div>

        {/* Legendas e Cards das 4 Fatias */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-5 pt-4 border-t border-slate-100">
          {/* Fatia 1: Cofrinhos & Reserva */}
          <div className="p-3 bg-emerald-50/50 rounded-xl border border-emerald-100 flex flex-col justify-between">
            <div className="flex items-center space-x-2">
              <span className="w-3 h-3 rounded-full bg-emerald-500 shrink-0" />
              <span className="text-xs font-bold text-slate-800">Cofrinhos & Reserva CDI</span>
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-sm font-bold text-emerald-800">{formatMoney(allocation.savingsCents)}</span>
              <span className="text-xs font-extrabold text-emerald-600">{allocation.savingsPct.toFixed(1)}%</span>
            </div>
            <div className="mt-1 text-[10px] text-slate-500 flex items-center justify-between">
              <span>Liquidez Diária</span>
              {setActiveTab && (
                <button
                  type="button"
                  onClick={() => setActiveTab('savings')}
                  className="text-emerald-700 underline font-semibold hover:text-emerald-900 cursor-pointer"
                >
                  Ver Cofrinhos
                </button>
              )}
            </div>
          </div>

          {/* Fatia 2: Tesouro & Renda Fixa */}
          <div className="p-3 bg-sky-50/50 rounded-xl border border-sky-100 flex flex-col justify-between">
            <div className="flex items-center space-x-2">
              <span className="w-3 h-3 rounded-full bg-sky-500 shrink-0" />
              <span className="text-xs font-bold text-slate-800">Tesouro & Renda Fixa</span>
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-sm font-bold text-sky-800">{formatMoney(allocation.treasuryFixedIncomeCents)}</span>
              <span className="text-xs font-extrabold text-sky-600">{allocation.treasuryFixedIncomePct.toFixed(1)}%</span>
            </div>
            <div className="mt-1 text-[10px] text-slate-500">
              Médio e longo prazo
            </div>
          </div>

          {/* Fatia 3: Ações & FIIs */}
          <div className="p-3 bg-indigo-50/50 rounded-xl border border-indigo-100 flex flex-col justify-between">
            <div className="flex items-center space-x-2">
              <span className="w-3 h-3 rounded-full bg-indigo-600 shrink-0" />
              <span className="text-xs font-bold text-slate-800">Ações B3 & FIIs</span>
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-sm font-bold text-indigo-900">{formatMoney(allocation.stocksFiisCents)}</span>
              <span className="text-xs font-extrabold text-indigo-600">{allocation.stocksFiisPct.toFixed(1)}%</span>
            </div>
            <div className="mt-1 text-[10px] text-slate-500">
              Proventos & Valorização
            </div>
          </div>

          {/* Fatia 4: Criptoativos */}
          <div className="p-3 bg-amber-50/50 rounded-xl border border-amber-100 flex flex-col justify-between">
            <div className="flex items-center space-x-2">
              <span className="w-3 h-3 rounded-full bg-amber-500 shrink-0" />
              <span className="text-xs font-bold text-slate-800">Criptoativos</span>
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-sm font-bold text-amber-900">{formatMoney(allocation.cryptoCents)}</span>
              <span className="text-xs font-extrabold text-amber-600">{allocation.cryptoPct.toFixed(1)}%</span>
            </div>
            <div className="mt-1 text-[10px] text-slate-500">
              Reserva global descentralizada
            </div>
          </div>
        </div>
      </div>

      {/* ===================== FILTROS E BUSCA ===================== */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Barra de Busca */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por código (PETR4, BTC...), nome ou corretora..."
            className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
          />
        </div>

        {/* Filtros por Categoria de Ativo */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => setCategoryFilter('ALL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
              categoryFilter === 'ALL'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            Todos ({visiblePortfolioAssets.length})
          </button>
          <button
            type="button"
            onClick={() => setCategoryFilter('CRYPTO')}
            className={`flex items-center space-x-1 px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
              categoryFilter === 'CRYPTO'
                ? 'bg-amber-500 text-white shadow-xs'
                : 'bg-amber-50 hover:bg-amber-100 text-amber-800'
            }`}
          >
            <Coins className="w-3.5 h-3.5" />
            <span>Cripto</span>
          </button>
          <button
            type="button"
            onClick={() => setCategoryFilter('STOCK')}
            className={`flex items-center space-x-1 px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
              categoryFilter === 'STOCK'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-blue-50 hover:bg-blue-100 text-blue-800'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Ações</span>
          </button>
          <button
            type="button"
            onClick={() => setCategoryFilter('FII')}
            className={`flex items-center space-x-1 px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
              categoryFilter === 'FII'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'bg-purple-50 hover:bg-purple-100 text-purple-800'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>FIIs</span>
          </button>
          <button
            type="button"
            onClick={() => setCategoryFilter('TREASURY_FIXED')}
            className={`flex items-center space-x-1 px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
              categoryFilter === 'TREASURY_FIXED'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800'
            }`}
          >
            <Landmark className="w-3.5 h-3.5" />
            <span>Tesouro & Renda Fixa</span>
          </button>
        </div>
      </div>

      {/* ===================== LISTA / TABELA DE ATIVOS ===================== */}
      {filteredAssets.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center shadow-sm">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-3">
            <TrendingUp className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-slate-900">
            {searchTerm || categoryFilter !== 'ALL'
              ? 'Nenhum ativo encontrado para os filtros aplicados'
              : 'Sua carteira de ativos ainda está vazia'}
          </h3>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
            {searchTerm || categoryFilter !== 'ALL'
              ? 'Tente remover a busca ou selecionar outra categoria.'
              : 'Cadastre suas ações, cotas de FIIs, títulos públicos do Tesouro ou Criptomoedas para acompanhar o patrimônio da família.'}
          </p>
          <button
            type="button"
            onClick={() => {
              if (searchTerm || categoryFilter !== 'ALL') {
                setSearchTerm('');
                setCategoryFilter('ALL');
              } else {
                setModalState({ isOpen: true, mode: 'create', data: null });
              }
            }}
            className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-semibold text-xs rounded-xl transition inline-flex items-center space-x-1.5 cursor-pointer shadow-xs"
          >
            {searchTerm || categoryFilter !== 'ALL' ? (
              <span>Limpar Filtros</span>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                <span>Cadastrar Primeiro Ativo</span>
              </>
            )}
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/80 text-slate-500 font-semibold border-b border-slate-200 uppercase tracking-wider">
                  <th className="py-3.5 px-4">Ativo / Código</th>
                  <th className="py-3.5 px-3">Instituição & Titular</th>
                  <th className="py-3.5 px-3 text-right">Cotas / Qtd</th>
                  <th className="py-3.5 px-3 text-right">Preço Médio</th>
                  <th className="py-3.5 px-3 text-right">Cotação Atual</th>
                  <th className="py-3.5 px-3 text-right">Valor em Carteira</th>
                  <th className="py-3.5 px-3 text-right">Rentabilidade</th>
                  <th className="py-3.5 px-4 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredAssets.map((asset) => {
                  const badge = getAssetBadge(asset.assetType);
                  const Icon = badge.icon;
                  const qty = Number(asset.quantity || 0);
                  const avgPrice = Number(asset.averagePriceCents || 0);
                  const curPrice = Number(asset.currentPriceCents || 0);

                  const totalInvested = Math.round(qty * avgPrice);
                  const currentValue = Math.round(qty * curPrice);
                  const profitLoss = currentValue - totalInvested;
                  const profitLossPercent = totalInvested > 0
                    ? ((currentValue - totalInvested) / totalInvested) * 100
                    : 0;

                  const ownerMember = FAMILY_MEMBERS.find((m) => m.id === asset.ownerId);

                  return (
                    <tr
                      key={asset.id}
                      className="hover:bg-slate-50/70 transition group"
                    >
                      {/* Ativo / Código */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center space-x-3">
                          <div className={`w-9 h-9 rounded-xl ${badge.bgIcon} ${badge.iconColor} flex items-center justify-center shrink-0 border border-slate-200/60`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="flex items-center space-x-1.5">
                              <span className="font-mono font-bold text-sm text-slate-900">
                                {asset.ticker}
                              </span>
                              <span className={`text-[10px] font-semibold px-1.5 py-0.2 rounded border ${badge.badgeClass}`}>
                                {badge.label}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-500 font-medium truncate max-w-[180px]" title={asset.name}>
                              {asset.name}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Instituição & Titular */}
                      <td className="py-3.5 px-3">
                        <div className="font-semibold text-slate-800">
                          {asset.institution || '—'}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {ownerMember ? ownerMember.name.replace(/👑|👤|🏠/g, '').trim() : 'Família'}
                        </div>
                      </td>

                      {/* Quantidade */}
                      <td className="py-3.5 px-3 text-right">
                        <span className="font-mono font-bold text-slate-800">
                          {Number.isInteger(qty) ? qty : qty.toLocaleString('pt-BR', { maximumFractionDigits: 6 })}
                        </span>
                        <div className="text-[10px] text-slate-400">unidades</div>
                      </td>

                      {/* Preço Médio */}
                      <td className="py-3.5 px-3 text-right font-medium text-slate-600">
                        {formatMoney(asset.averagePriceCents)}
                        <div className="text-[10px] text-slate-400">
                          Total: {formatMoney(totalInvested)}
                        </div>
                      </td>

                      {/* Cotação Atual com Botão Ágil */}
                      <td className="py-3.5 px-3 text-right">
                        <button
                          type="button"
                          onClick={() => setQuickPriceAsset(asset)}
                          className="inline-flex items-center space-x-1 px-2 py-1 rounded-lg bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-800 font-bold transition cursor-pointer group-hover:border-blue-300 border border-transparent"
                          title="Clique para atualizar a cotação rapidamente"
                        >
                          <span>{formatMoney(asset.currentPriceCents)}</span>
                          <RefreshCw className="w-3 h-3 text-slate-400 group-hover:text-blue-600" />
                        </button>
                        <div className="text-[10px] text-slate-400 mt-0.5">Clique p/ alterar</div>
                      </td>

                      {/* Valor em Carteira */}
                      <td className="py-3.5 px-3 text-right">
                        <span className="font-bold text-sm text-slate-900">
                          {formatMoney(currentValue)}
                        </span>
                        <div className="text-[10px] text-slate-400">saldo atual</div>
                      </td>

                      {/* Rentabilidade */}
                      <td className="py-3.5 px-3 text-right">
                        <div className={`font-bold flex items-center justify-end space-x-0.5 ${
                          profitLoss >= 0 ? 'text-emerald-600' : 'text-rose-600'
                        }`}>
                          {profitLoss >= 0 ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                          <span>{profitLoss >= 0 ? '+' : ''}{formatMoney(profitLoss)}</span>
                        </div>
                        <span className={`inline-block text-[10px] font-bold px-1.5 py-0.2 rounded ${
                          profitLoss >= 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                        }`}>
                          {profitLossPercent >= 0 ? '+' : ''}{profitLossPercent.toFixed(2)}%
                        </span>
                      </td>

                      {/* Ações */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center space-x-1">
                          <button
                            type="button"
                            onClick={() => setQuickPriceAsset(asset)}
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition cursor-pointer"
                            title="Atualizar cotação"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setModalState({ isOpen: true, mode: 'edit', data: asset })}
                            className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                            title="Editar ativo"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteAsset(asset)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                            title="Excluir ativo"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ===================== MODAIS DE ATIVOS ===================== */}
      {modalState.isOpen && (
        <AssetModal
          isOpen={modalState.isOpen}
          onClose={() => setModalState({ isOpen: false, mode: 'create', data: null })}
          mode={modalState.mode}
          initialData={modalState.data}
          onSave={handleSavePortfolioAsset}
          currentMemberId={currentMemberId}
        />
      )}

      {quickPriceAsset && (
        <QuickUpdatePriceModal
          isOpen={Boolean(quickPriceAsset)}
          onClose={() => setQuickPriceAsset(null)}
          asset={quickPriceAsset}
          onUpdatePrice={handleUpdateAssetPrice}
        />
      )}

      {deleteAsset && (
        <DeleteAssetModal
          isOpen={Boolean(deleteAsset)}
          onClose={() => setDeleteAsset(null)}
          asset={deleteAsset}
          onConfirmDelete={handleDeletePortfolioAsset}
        />
      )}
    </div>
  );
}
