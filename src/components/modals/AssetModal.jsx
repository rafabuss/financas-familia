import React, { useState, useEffect } from 'react';
import {
  X,
  Coins,
  TrendingUp,
  Building2,
  Landmark,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  Trash2,
  DollarSign,
} from 'lucide-react';
import { formatMoney } from '../../utils/formatters';
import { FAMILY_MEMBERS } from '../../data/constants';

export const ASSET_TYPES = [
  {
    id: 'CRYPTO',
    label: 'Criptomoeda',
    description: 'Bitcoin, Ethereum, Solana, stablecoins custodiadas',
    icon: Coins,
    color: 'amber',
  },
  {
    id: 'STOCK',
    label: 'Ações da B3',
    description: 'Empresas listadas na bolsa de valores brasileira',
    icon: TrendingUp,
    color: 'blue',
  },
  {
    id: 'FII',
    label: 'Fundo Imobiliário (FII)',
    description: 'Tijolo, papel ou fundos com proventos mensais isentos',
    icon: Building2,
    color: 'purple',
  },
  {
    id: 'TREASURY',
    label: 'Tesouro Direto',
    description: 'Tesouro Selic, IPCA+ ou Prefixado garantido pelo Tesouro',
    icon: Landmark,
    color: 'emerald',
  },
  {
    id: 'FIXED_INCOME',
    label: 'Renda Fixa Longa',
    description: 'CDB, LCI, LCA, Debêntures e títulos de médio/longo prazo',
    icon: ShieldCheck,
    color: 'indigo',
  },
];

export const COMMON_INSTITUTIONS = [
  'Nubank',
  'Inter',
  'XP Investimentos',
  'BTG Pactual',
  'Banco do Brasil',
  'Itaú',
  'Bradesco',
  'Binance',
  'Mercado Bitcoin',
  'Carteira Fria (Ledger/Trezor)',
];

/**
 * Modal Completo de Cadastro / Edição de Ativo
 */
export function AssetModal({
  isOpen,
  onClose,
  mode = 'create',
  initialData = null,
  onSave,
  currentMemberId = 'user-all',
}) {
  const [name, setName] = useState('');
  const [ticker, setTicker] = useState('');
  const [assetType, setAssetType] = useState('STOCK');
  const [institution, setInstitution] = useState('');
  const [quantity, setQuantity] = useState('');
  const [averagePrice, setAveragePrice] = useState('');
  const [currentPrice, setCurrentPrice] = useState('');
  const [notes, setNotes] = useState('');
  const [ownerId, setOwnerId] = useState('user-all');
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setError('');
      if (mode === 'edit' && initialData) {
        setName(initialData.name || '');
        setTicker(initialData.ticker || '');
        setAssetType(initialData.assetType || 'STOCK');
        setInstitution(initialData.institution || '');
        setQuantity(initialData.quantity !== undefined ? String(initialData.quantity) : '');
        setAveragePrice(initialData.averagePriceCents !== undefined ? (initialData.averagePriceCents / 100).toFixed(2) : '');
        setCurrentPrice(initialData.currentPriceCents !== undefined ? (initialData.currentPriceCents / 100).toFixed(2) : '');
        setNotes(initialData.notes || '');
        setOwnerId(initialData.ownerId || 'user-all');
      } else {
        setName('');
        setTicker('');
        setAssetType('STOCK');
        setInstitution('Inter');
        setQuantity('');
        setAveragePrice('');
        setCurrentPrice('');
        setNotes('');
        setOwnerId(currentMemberId === 'user-all' ? 'user-all' : currentMemberId);
      }
    }
  }, [isOpen, mode, initialData, currentMemberId]);

  // Cálculos prévios dinâmicos
  const numQuantity = parseFloat(quantity.replace(',', '.')) || 0;
  const numAvgPrice = parseFloat(averagePrice.replace(',', '.')) || 0;
  const numCurPrice = parseFloat(currentPrice.replace(',', '.')) || 0;

  const totalInvestedCents = Math.round(numQuantity * Math.round(numAvgPrice * 100));
  const currentValueCents = Math.round(numQuantity * Math.round(numCurPrice * 100));
  const profitLossCents = currentValueCents - totalInvestedCents;
  const profitLossPercent = totalInvestedCents > 0
    ? ((currentValueCents - totalInvestedCents) / totalInvestedCents) * 100
    : 0;

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Por favor, informe o nome do ativo.');
      return;
    }
    if (!ticker.trim()) {
      setError('Por favor, informe o código / ticker do ativo (ex: PETR4, BTC, etc.).');
      return;
    }
    if (numQuantity <= 0) {
      setError('Informe uma quantidade válida maior que zero.');
      return;
    }
    if (numAvgPrice < 0 || numCurPrice < 0) {
      setError('Os preços não podem ser negativos.');
      return;
    }

    const payload = {
      id: mode === 'edit' && initialData?.id ? initialData.id : `asset-${Date.now()}`,
      name: name.trim(),
      ticker: ticker.trim().toUpperCase(),
      assetType,
      institution: institution.trim() || 'Outro',
      quantity: numQuantity,
      averagePriceCents: Math.round(numAvgPrice * 100),
      currentPriceCents: Math.round(numCurPrice * 100),
      notes: notes.trim(),
      ownerId: ownerId || 'user-all',
      createdAt: initialData?.createdAt,
    };

    onSave(payload);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-fade-in">
      <div className="bg-white rounded-3xl max-w-xl w-full p-5 sm:p-7 shadow-2xl border border-slate-200 relative my-8">
        {/* Botão Fechar */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 p-2 rounded-xl hover:bg-slate-100 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Cabeçalho */}
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 shadow-xs">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">
              {mode === 'edit' ? 'Editar Ativo da Carteira' : 'Cadastrar Novo Ativo na Carteira'}
            </h3>
            <p className="text-xs text-slate-500">
              Acompanhe cotas, preço médio e rentabilidade de mercado
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Seletor de Categoria de Ativo */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Tipo de Ativo <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {ASSET_TYPES.map((t) => {
                const Icon = t.icon;
                const isSelected = assetType === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setAssetType(t.id)}
                    className={`flex items-center space-x-2 p-2.5 rounded-xl border text-xs font-medium text-left transition cursor-pointer ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50/70 text-blue-900 font-semibold ring-1 ring-blue-600 shadow-xs'
                        : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-white'
                    }`}
                  >
                    <Icon className={`w-4 h-4 shrink-0 ${isSelected ? 'text-blue-600' : 'text-slate-400'}`} />
                    <span className="truncate">{t.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Nome e Ticker */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nome do Ativo <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="ex: Bitcoin, Petrobras PN, XP Malls"
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Código / Ticker <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={ticker}
                onChange={(e) => setTicker(e.target.value.toUpperCase())}
                placeholder="ex: BTC, PETR4"
                className="w-full px-3 py-2 text-sm font-mono font-bold uppercase rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                required
              />
            </div>
          </div>

          {/* Corretora e Titular */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Instituição / Corretora <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                list="common-institutions"
                value={institution}
                onChange={(e) => setInstitution(e.target.value)}
                placeholder="ex: Nubank, Inter, XP"
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                required
              />
              <datalist id="common-institutions">
                {COMMON_INSTITUTIONS.map((inst) => (
                  <option key={inst} value={inst} />
                ))}
              </datalist>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Titular Responsável
              </label>
              <select
                value={ownerId}
                onChange={(e) => setOwnerId(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition bg-white"
              >
                {FAMILY_MEMBERS.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Quantidade, Preço Médio e Cotação Atual */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Quantidade <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                step="any"
                min="0"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="ex: 100 ou 0.045"
                className="w-full px-3 py-2 text-sm font-medium rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                required
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block">Aceita frações para cripto</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Preço Médio (R$) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                step="any"
                min="0"
                value={averagePrice}
                onChange={(e) => setAveragePrice(e.target.value)}
                placeholder="ex: 34.50"
                className="w-full px-3 py-2 text-sm font-medium rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                required
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block">Custo médio por cota</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Cotação Atual (R$) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                step="any"
                min="0"
                value={currentPrice}
                onChange={(e) => setCurrentPrice(e.target.value)}
                placeholder="ex: 38.20"
                className="w-full px-3 py-2 text-sm font-medium rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                required
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block">Preço de mercado hoje</span>
            </div>
          </div>

          {/* Card de Simulação e Rentabilidade em Tempo Real */}
          {numQuantity > 0 && numAvgPrice > 0 && numCurPrice > 0 && (
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-500 font-semibold uppercase tracking-wider">
                <span className="flex items-center space-x-1">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>Resumo do Ativo em Carteira</span>
                </span>
                <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold flex items-center space-x-1 ${
                  profitLossCents >= 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                }`}>
                  {profitLossCents >= 0 ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                  <span>{profitLossPercent >= 0 ? '+' : ''}{profitLossPercent.toFixed(2)}%</span>
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center pt-1 border-t border-slate-200">
                <div>
                  <span className="text-[10px] text-slate-500 block">Total Investido</span>
                  <span className="text-xs font-bold text-slate-800">{formatMoney(totalInvestedCents)}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">Valor Atual</span>
                  <span className="text-xs font-bold text-slate-900">{formatMoney(currentValueCents)}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">Lucro / Prejuízo</span>
                  <span className={`text-xs font-bold ${profitLossCents >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {profitLossCents >= 0 ? '+' : ''}{formatMoney(profitLossCents)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Anotações */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Anotações / Estratégia (Opcional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="ex: Foco em dividendos para aposentadoria, meta de atingir 500 cotas"
              rows={2}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition resize-none"
            />
          </div>

          {/* Ações */}
          <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 active:scale-95 rounded-xl transition shadow-xs cursor-pointer flex items-center space-x-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{mode === 'edit' ? 'Salvar Alterações' : 'Adicionar à Carteira'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/**
 * Modal Ágil para Atualização Rápida de Cotação
 */
export function QuickUpdatePriceModal({
  isOpen,
  onClose,
  asset,
  onUpdatePrice,
}) {
  const [newPrice, setNewPrice] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen && asset) {
      setError('');
      setNewPrice(asset.currentPriceCents ? (asset.currentPriceCents / 100).toFixed(2) : '');
    }
  }, [isOpen, asset]);

  if (!isOpen || !asset) return null;

  const numQty = Number(asset.quantity || 0);
  const numAvgPrice = Number(asset.averagePriceCents || 0) / 100;
  const numNewPrice = parseFloat(newPrice.replace(',', '.')) || 0;

  const totalInvestedCents = Math.round(numQty * Math.round(numAvgPrice * 100));
  const newCurrentValueCents = Math.round(numQty * Math.round(numNewPrice * 100));
  const newProfitLossCents = newCurrentValueCents - totalInvestedCents;
  const newProfitLossPercent = totalInvestedCents > 0
    ? ((newCurrentValueCents - totalInvestedCents) / totalInvestedCents) * 100
    : 0;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (numNewPrice < 0) {
      setError('A cotação não pode ser negativa.');
      return;
    }
    const newPriceCents = Math.round(numNewPrice * 100);
    onUpdatePrice(asset.id, newPriceCents);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl border border-slate-200 relative">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-2 rounded-xl hover:bg-slate-100 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-3 mb-5">
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100 shadow-xs">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">Atualizar Cotação de Mercado</h3>
            <p className="text-xs text-slate-500">
              {asset.ticker} • {asset.name}
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 text-xs space-y-1">
            <div className="flex justify-between text-slate-600">
              <span>Quantidade em custódia:</span>
              <strong className="text-slate-900">{asset.quantity} {asset.ticker}</strong>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Preço médio de compra:</span>
              <strong className="text-slate-900">{formatMoney(asset.averagePriceCents)}</strong>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Cotação anterior:</span>
              <span className="font-semibold text-slate-700">{formatMoney(asset.currentPriceCents)}</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Nova Cotação Atual (R$) <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-xs font-bold text-slate-400">R$</span>
              <input
                type="number"
                step="any"
                min="0"
                autoFocus
                value={newPrice}
                onChange={(e) => setNewPrice(e.target.value)}
                placeholder="0.00"
                className="w-full pl-8 pr-3 py-2 text-base font-bold text-slate-900 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition"
                required
              />
            </div>
          </div>

          {/* Prévia da nova rentabilidade */}
          {numNewPrice > 0 && (
            <div className="bg-emerald-50/60 border border-emerald-200 rounded-xl p-3 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-600">Novo Saldo Atual:</span>
                <strong className="text-slate-900">{formatMoney(newCurrentValueCents)}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Rentabilidade Estimada:</span>
                <strong className={newProfitLossCents >= 0 ? 'text-emerald-700' : 'text-rose-700'}>
                  {newProfitLossCents >= 0 ? '+' : ''}{formatMoney(newProfitLossCents)} ({newProfitLossPercent >= 0 ? '+' : ''}{newProfitLossPercent.toFixed(2)}%)
                </strong>
              </div>
            </div>
          )}

          <div className="flex items-center justify-end space-x-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-95 rounded-xl transition shadow-xs cursor-pointer flex items-center space-x-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Confirmar Cotação</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/**
 * Modal de Confirmação de Exclusão de Ativo
 */
export function DeleteAssetModal({
  isOpen,
  onClose,
  asset,
  onConfirmDelete,
}) {
  if (!isOpen || !asset) return null;

  const currentValueCents = Math.round(Number(asset.quantity || 0) * Number(asset.currentPriceCents || 0));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl border border-slate-200 relative">
        <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mb-4 border border-rose-100">
          <Trash2 className="w-6 h-6" />
        </div>

        <h3 className="text-base font-bold text-slate-900 mb-1">
          Remover Ativo da Carteira?
        </h3>
        <p className="text-xs text-slate-600 mb-4 leading-relaxed">
          Tem certeza que deseja excluir <strong>{asset.ticker} ({asset.name})</strong> da carteira da família? O saldo de <strong>{formatMoney(currentValueCents)}</strong> deixará de compor o patrimônio consolidado.
        </p>

        <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs space-y-1 mb-5">
          <div className="flex justify-between text-slate-600">
            <span>Ticker / Código:</span>
            <strong className="text-slate-900">{asset.ticker}</strong>
          </div>
          <div className="flex justify-between text-slate-600">
            <span>Quantidade:</span>
            <strong className="text-slate-900">{asset.quantity}</strong>
          </div>
          <div className="flex justify-between text-slate-600">
            <span>Instituição:</span>
            <span className="text-slate-700">{asset.institution || 'Não informada'}</span>
          </div>
        </div>

        <div className="flex items-center justify-end space-x-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirmDelete(asset.id);
              onClose();
            }}
            className="px-5 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 active:scale-95 rounded-xl transition shadow-xs cursor-pointer flex items-center space-x-1.5"
          >
            <Trash2 className="w-4 h-4" />
            <span>Sim, Excluir Ativo</span>
          </button>
        </div>
      </div>
    </div>
  );
}
