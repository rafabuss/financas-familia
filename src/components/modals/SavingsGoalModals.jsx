import React, { useState, useMemo } from 'react';
import {
  X,
  PiggyBank,
  ShieldCheck,
  Plane,
  Car,
  GraduationCap,
  Coins,
  TrendingUp,
  Target,
  Home,
  Heart,
  ArrowDownLeft,
  ArrowUpRight,
  Sparkles,
  Calendar,
  Wallet,
  Receipt,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import { formatMoney, formatDateBR } from '../../utils/formatters';
import { FAMILY_MEMBERS } from '../../data/constants';

// Mapeamento de Ícones Disponíveis para Cofrinhos
export const SAVINGS_GOAL_ICONS = {
  PiggyBank: PiggyBank,
  ShieldCheck: ShieldCheck,
  Plane: Plane,
  Car: Car,
  GraduationCap: GraduationCap,
  Coins: Coins,
  TrendingUp: TrendingUp,
  Target: Target,
  Home: Home,
  Heart: Heart,
};

export const SAVINGS_GOAL_COLORS = [
  '#10b981', // emerald
  '#0ea5e9', // sky
  '#2563eb', // blue
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#f59e0b', // amber
  '#f97316', // orange
  '#14b8a6', // teal
  '#64748b', // slate
];

/**
 * Modal de Criação / Edição de Cofrinho ou Caixinha
 */
export function SavingsGoalModal({
  isOpen,
  onClose,
  mode = 'create',
  initialData = null,
  accounts = [],
  onSave,
  currentMemberId = 'user-all',
}) {
  const [name, setName] = useState('');
  const [linkedAccountId, setLinkedAccountId] = useState('');
  const [target, setTarget] = useState('');
  const [initialBalance, setInitialBalance] = useState('');
  const [yieldRate, setYieldRate] = useState('100% CDI');
  const [color, setColor] = useState('#10b981');
  const [icon, setIcon] = useState('PiggyBank');
  const [ownerId, setOwnerId] = useState('user-all');

  // Inicializa os campos ao abrir o modal
  React.useEffect(() => {
    if (isOpen) {
      if (mode === 'edit' && initialData) {
        setName(initialData.name || '');
        setLinkedAccountId(initialData.linkedAccountId || '');
        setTarget(initialData.targetCents ? (initialData.targetCents / 100).toFixed(2) : '');
        setInitialBalance(initialData.currentBalanceCents ? (initialData.currentBalanceCents / 100).toFixed(2) : '0.00');
        setYieldRate(initialData.yieldRate || '100% CDI');
        setColor(initialData.color || '#10b981');
        setIcon(initialData.icon || 'PiggyBank');
        setOwnerId(initialData.ownerId || 'user-all');
      } else {
        setName('');
        setLinkedAccountId(accounts[0]?.id || '');
        setTarget('');
        setInitialBalance('0.00');
        setYieldRate('100% CDI');
        setColor('#10b981');
        setIcon('PiggyBank');
        setOwnerId(currentMemberId === 'user-all' ? 'user-all' : currentMemberId);
      }
    }
  }, [isOpen, mode, initialData, accounts, currentMemberId]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Informe o nome do cofrinho');
      return;
    }

    const targetCents = target ? Math.max(0, Math.round(parseFloat(target.replace(',', '.')) * 100)) : 0;
    const currentBalanceCents = initialBalance ? Math.max(0, Math.round(parseFloat(initialBalance.replace(',', '.')) * 100)) : 0;

    onSave({
      id: mode === 'edit' ? initialData.id : undefined,
      name: name.trim(),
      linkedAccountId: linkedAccountId || null,
      targetCents,
      currentBalanceCents,
      yieldRate: yieldRate.trim() || '100% CDI',
      color,
      icon,
      ownerId,
    });
    onClose();
  };

  const SelectedIconComponent = SAVINGS_GOAL_ICONS[icon] || PiggyBank;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center space-x-2.5">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-xs"
              style={{ backgroundColor: color }}
            >
              <SelectedIconComponent className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900">
                {mode === 'edit' ? 'Editar Cofrinho / Meta' : 'Novo Cofrinho / Meta de Reserva'}
              </h3>
              <p className="text-xs text-slate-500">
                Guarde dinheiro com rendimento imediato e metas financeiras
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1 rounded-md cursor-pointer transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
          {/* Nome */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Nome do Cofrinho / Caixinha <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Cofrinho Inter - Reserva, Caixinha Férias - Nubank"
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          {/* Conta Bancária Vinculada & Rendimento */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Conta Bancária Vinculada
              </label>
              <select
                value={linkedAccountId}
                onChange={(e) => setLinkedAccountId(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              >
                <option value="">Nenhuma / Geral</option>
                {accounts.filter((a) => !a.archived).map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name} ({acc.bank})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Rendimento Estimado
              </label>
              <input
                type="text"
                value={yieldRate}
                onChange={(e) => setYieldRate(e.target.value)}
                placeholder="Ex: 100% CDI, 102% CDI, Poupança"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Meta Total & Saldo Inicial */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Meta Total Estipulada (R$)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                placeholder="Ex: 10000.00 (Opcional)"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
              <span className="text-[10px] text-slate-400">Deixe em branco se for reserva livre</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {mode === 'edit' ? 'Saldo Base / Atual (R$)' : 'Saldo Inicial Guardado (R$)'}
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={initialBalance}
                onChange={(e) => setInitialBalance(e.target.value)}
                placeholder="0.00"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Seletor de Ícones */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Ícone Visual
            </label>
            <div className="flex flex-wrap gap-2">
              {Object.keys(SAVINGS_GOAL_ICONS).map((iconKey) => {
                const IconComp = SAVINGS_GOAL_ICONS[iconKey];
                const isSelected = icon === iconKey;
                return (
                  <button
                    key={iconKey}
                    type="button"
                    onClick={() => setIcon(iconKey)}
                    className={`p-2 rounded-xl border transition flex items-center justify-center cursor-pointer ${
                      isSelected
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-700 ring-2 ring-emerald-200'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                    }`}
                    title={iconKey}
                  >
                    <IconComp className="w-5 h-5" />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Seletor de Cores */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Cor do Card
            </label>
            <div className="flex items-center space-x-2">
              {SAVINGS_GOAL_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-7 h-7 rounded-full transition cursor-pointer border-2 ${
                    color === c ? 'border-slate-900 scale-110 shadow-xs' : 'border-white hover:scale-105'
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          {/* Titular Responsável */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Titular Responsável
            </label>
            <select
              value={ownerId}
              onChange={(e) => setOwnerId(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            >
              <option value="user-all">Família (Compartilhado)</option>
              {Object.entries(FAMILY_MEMBERS).map(([key, member]) => (
                <option key={key} value={key}>
                  {member.name}
                </option>
              ))}
            </select>
          </div>

          {/* Botões de Ação */}
          <div className="pt-4 border-t border-slate-100 flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 rounded-lg text-sm text-slate-700 hover:bg-slate-50 transition cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-semibold shadow-sm transition active:scale-95 cursor-pointer"
            >
              {mode === 'edit' ? 'Salvar Alterações' : 'Criar Cofrinho'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/**
 * Modal de Aporte: Guardar dinheiro da Conta Corrente no Cofrinho
 */
export function SavingsGoalAporteModal({
  isOpen,
  onClose,
  goal,
  accounts = [],
  accountBalances = {},
  onConfirmAporte,
}) {
  const [originAccountId, setOriginAccountId] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  React.useEffect(() => {
    if (isOpen) {
      // Pré-seleciona a conta vinculada se houver, ou a primeira conta com saldo positivo
      const defaultAcc = accounts.find((a) => a.id === goal?.linkedAccountId) || accounts[0];
      setOriginAccountId(defaultAcc?.id || '');
      setAmount('');
      setDate(new Date().toISOString().slice(0, 10));
      setDescription('');
      setIsSubmitting(false);
    }
  }, [isOpen, goal, accounts]);

  if (!isOpen || !goal) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!originAccountId) {
      alert('Selecione a Conta de Origem');
      return;
    }
    const amountVal = parseFloat(amount.replace(',', '.'));
    if (isNaN(amountVal) || amountVal <= 0) {
      alert('Informe um valor de aporte válido');
      return;
    }

    const amountCents = Math.round(amountVal * 100);
    setIsSubmitting(true);
    try {
      await onConfirmAporte({
        goalId: goal.id,
        originAccountId,
        amountCents,
        date,
        description: description.trim() || undefined,
      });
      onClose();
    } catch (err) {
      alert(err.message || 'Erro ao realizar aporte');
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedAcc = accounts.find((a) => a.id === originAccountId);
  const selectedBalance = originAccountId ? (accountBalances[originAccountId] || 0) : 0;
  const GoalIcon = SAVINGS_GOAL_ICONS[goal.icon] || PiggyBank;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-emerald-50/70">
          <div className="flex items-center space-x-2.5">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-xs"
              style={{ backgroundColor: goal.color || '#10b981' }}
            >
              <GoalIcon className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">Aporte / Guardar</span>
              <h3 className="font-bold text-base text-slate-900 leading-tight">{goal.name}</h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1 rounded-md cursor-pointer transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs">
            <span className="text-slate-500 font-medium">Saldo Atual no Cofrinho:</span>
            <span className="font-bold text-slate-900 text-sm">{formatMoney(goal.currentBalanceCents || 0)}</span>
          </div>

          {/* Selecionar Conta de Origem */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Conta de Origem (Sai o dinheiro da Conta Corrente) <span className="text-rose-500">*</span>
            </label>
            <select
              required
              value={originAccountId}
              onChange={(e) => setOriginAccountId(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            >
              {accounts.filter((a) => !a.archived).map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.name} ({acc.bank}) — Saldo: {formatMoney(accountBalances[acc.id] || 0)}
                </option>
              ))}
            </select>
            {selectedAcc && (
              <p className="text-[11px] text-slate-500 mt-1 flex justify-between">
                <span>Saldo livre na conta selecionada:</span>
                <strong className={selectedBalance >= 0 ? 'text-slate-900' : 'text-rose-600'}>
                  {formatMoney(selectedBalance)}
                </strong>
              </p>
            )}
          </div>

          {/* Valor do Aporte e Data */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Valor do Aporte (R$) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0,00"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm font-bold text-emerald-700 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Data do Aporte
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Descrição Opcional */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Descrição (opcional)
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={`Ex: Guardar sobra do salário no ${goal.name}`}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <div className="p-3 bg-emerald-50/50 border border-emerald-100 rounded-xl text-[11px] text-emerald-800">
            💡 Este aporte é registrado como uma <strong>Transferência</strong>. Ele deduz o saldo da conta corrente e aumenta a reserva, <strong>sem afetar suas despesas do mês</strong>.
          </div>

          {/* Botões */}
          <div className="pt-2 border-t border-slate-100 flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 rounded-lg text-sm text-slate-700 hover:bg-slate-50 transition cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-semibold shadow-sm transition active:scale-95 cursor-pointer flex items-center space-x-1.5"
            >
              <ArrowDownLeft className="w-4 h-4" />
              <span>{isSubmitting ? 'Aportando...' : 'Confirmar Aporte'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/**
 * Modal de Resgate: Devolver dinheiro do Cofrinho para a Conta Corrente
 */
export function SavingsGoalResgateModal({
  isOpen,
  onClose,
  goal,
  accounts = [],
  onConfirmResgate,
}) {
  const [destinationAccountId, setDestinationAccountId] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  React.useEffect(() => {
    if (isOpen) {
      const defaultAcc = accounts.find((a) => a.id === goal?.linkedAccountId) || accounts[0];
      setDestinationAccountId(defaultAcc?.id || '');
      setAmount('');
      setDate(new Date().toISOString().slice(0, 10));
      setDescription('');
      setIsSubmitting(false);
    }
  }, [isOpen, goal, accounts]);

  if (!isOpen || !goal) return null;

  const currentGoalBalance = goal.currentBalanceCents || 0;

  const handleResgateTudo = () => {
    setAmount((currentGoalBalance / 100).toFixed(2));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!destinationAccountId) {
      alert('Selecione a Conta de Destino');
      return;
    }
    const amountVal = parseFloat(amount.replace(',', '.'));
    if (isNaN(amountVal) || amountVal <= 0) {
      alert('Informe um valor de resgate válido');
      return;
    }

    const amountCents = Math.round(amountVal * 100);
    if (amountCents > currentGoalBalance) {
      if (!confirm(`O valor informado (${formatMoney(amountCents)}) é maior que o saldo acumulado (${formatMoney(currentGoalBalance)}). Deseja prosseguir mesmo assim?`)) {
        return;
      }
    }

    setIsSubmitting(true);
    try {
      await onConfirmResgate({
        goalId: goal.id,
        destinationAccountId,
        amountCents,
        date,
        description: description.trim() || undefined,
      });
      onClose();
    } catch (err) {
      alert(err.message || 'Erro ao realizar resgate');
    } finally {
      setIsSubmitting(false);
    }
  };

  const GoalIcon = SAVINGS_GOAL_ICONS[goal.icon] || PiggyBank;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-sky-50/70">
          <div className="flex items-center space-x-2.5">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-xs"
              style={{ backgroundColor: goal.color || '#0ea5e9' }}
            >
              <GoalIcon className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-sky-700 uppercase tracking-wider">Resgatar / Liberar</span>
              <h3 className="font-bold text-base text-slate-900 leading-tight">{goal.name}</h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1 rounded-md cursor-pointer transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="p-3 bg-sky-50/60 border border-sky-200 rounded-xl flex items-center justify-between text-xs">
            <span className="text-slate-600 font-medium">Disponível no Cofrinho:</span>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-sky-900 text-sm">{formatMoney(currentGoalBalance)}</span>
              {currentGoalBalance > 0 && (
                <button
                  type="button"
                  onClick={handleResgateTudo}
                  className="px-2 py-0.5 text-[10px] font-bold bg-white text-sky-700 border border-sky-300 rounded hover:bg-sky-50 transition cursor-pointer"
                >
                  Tudo
                </button>
              )}
            </div>
          </div>

          {/* Selecionar Conta de Destino */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Conta de Destino (Para onde volta o dinheiro livre) <span className="text-rose-500">*</span>
            </label>
            <select
              required
              value={destinationAccountId}
              onChange={(e) => setDestinationAccountId(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none"
            >
              {accounts.filter((a) => !a.archived).map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.name} ({acc.bank})
                </option>
              ))}
            </select>
          </div>

          {/* Valor do Resgate e Data */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Valor a Resgatar (R$) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0,00"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm font-bold text-sky-800 focus:ring-2 focus:ring-sky-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Data do Resgate
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Descrição Opcional */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Motivo / Descrição (opcional)
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ex: Resgate para cobrir despesas de viagem"
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-sky-500 focus:outline-none"
            />
          </div>

          <div className="p-3 bg-sky-50/50 border border-sky-100 rounded-xl text-[11px] text-sky-900">
            ℹ️ O valor resgatado fica <strong>imediatamente disponível na sua conta corrente</strong> para pagar boletos ou compras do mês.
          </div>

          {/* Botões */}
          <div className="pt-2 border-t border-slate-100 flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 rounded-lg text-sm text-slate-700 hover:bg-slate-50 transition cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-sm font-semibold shadow-sm transition active:scale-95 cursor-pointer flex items-center space-x-1.5"
            >
              <ArrowUpRight className="w-4 h-4" />
              <span>{isSubmitting ? 'Resgatando...' : 'Confirmar Resgate'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/**
 * Modal de Registro de Rendimentos (CDI / Juros)
 */
export function SavingsGoalYieldModal({
  isOpen,
  onClose,
  goal,
  onConfirmYield,
}) {
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  React.useEffect(() => {
    if (isOpen) {
      setAmount('');
      setDate(new Date().toISOString().slice(0, 10));
      setDescription(`Rendimento ${goal?.yieldRate || 'CDI'}: ${goal?.name || ''}`);
      setIsSubmitting(false);
    }
  }, [isOpen, goal]);

  if (!isOpen || !goal) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const amountVal = parseFloat(amount.replace(',', '.'));
    if (isNaN(amountVal) || amountVal <= 0) {
      alert('Informe o valor do rendimento');
      return;
    }

    const amountCents = Math.round(amountVal * 100);
    setIsSubmitting(true);
    try {
      await onConfirmYield({
        goalId: goal.id,
        amountCents,
        date,
        description: description.trim() || undefined,
      });
      onClose();
    } catch (err) {
      alert(err.message || 'Erro ao registrar rendimento');
    } finally {
      setIsSubmitting(false);
    }
  };

  const GoalIcon = SAVINGS_GOAL_ICONS[goal.icon] || PiggyBank;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-amber-50/70">
          <div className="flex items-center space-x-2.5">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-xs">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">
                {goal.yieldRate || 'Rendimento CDI'}
              </span>
              <h3 className="font-bold text-base text-slate-900 leading-tight">Registrar Rendimento</h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1 rounded-md cursor-pointer transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <p className="text-xs text-slate-600">
            Informe os juros ou rendimento do CDI creditados pelo banco no cofrinho <strong>{goal.name}</strong>.
          </p>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Valor do Rendimento (R$) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0,00"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm font-bold text-amber-700 focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Data do Crédito
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Descrição
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
            />
          </div>

          <div className="pt-2 border-t border-slate-100 flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 rounded-lg text-sm text-slate-700 hover:bg-slate-50 transition cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-sm font-semibold shadow-sm transition active:scale-95 cursor-pointer flex items-center space-x-1.5"
            >
              <Sparkles className="w-4 h-4" />
              <span>{isSubmitting ? 'Registrando...' : 'Creditar Rendimento'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/**
 * Modal de Extrato Dedicado do Cofrinho (Linha do Tempo com Saldo Progressivo)
 */
export function SavingsGoalStatementModal({
  isOpen,
  onClose,
  goal,
  accounts = [],
  transactions = [],
  onOpenAporte,
  onOpenResgate,
  onOpenYield,
}) {
  const [filterType, setFilterType] = useState('ALL'); // 'ALL' | 'APORTE' | 'RESGATE' | 'YIELD'

  const statementData = useMemo(() => {
    if (!goal) return { items: [], totalAportes: 0, totalResgates: 0, totalYields: 0, currentBalance: 0 };

    // 1. Filtrar transações relacionadas a este cofrinho
    const goalTxs = transactions.filter(
      (t) => t.status !== 'CANCELADO' && t.savingsGoalId === goal.id
    );

    // 2. Ordenar cronologicamente do mais antigo para o mais recente para calcular saldo progressivo
    const sortedAsc = [...goalTxs].sort((a, b) => {
      const dateA = a.date || a.dueDate || '';
      const dateB = b.date || b.dueDate || '';
      return dateA.localeCompare(dateB);
    });

    let running = Number(goal.currentBalanceCents || 0); // Base inicial
    let totalAportes = 0;
    let totalResgates = 0;
    let totalYields = 0;

    const calculatedItems = sortedAsc.map((tx) => {
      let delta = 0;
      let movType = 'OUTRO';

      if (tx.type === 'TRANSFER') {
        if (tx.accountId) {
          // Aporte: entrou no cofrinho
          movType = 'APORTE';
          delta = tx.amountCents;
          totalAportes += tx.amountCents;
        } else if (tx.destinationAccountId) {
          // Resgate: saiu do cofrinho
          movType = 'RESGATE';
          delta = -tx.amountCents;
          totalResgates += tx.amountCents;
        }
      } else if (tx.type === 'INCOME') {
        movType = 'YIELD';
        delta = tx.amountCents;
        totalYields += tx.amountCents;
      } else if (tx.type === 'EXPENSE') {
        movType = 'RESGATE';
        delta = -tx.amountCents;
        totalResgates += tx.amountCents;
      }

      running += delta;

      const originAcc = accounts.find((a) => a.id === tx.accountId);
      const destAcc = accounts.find((a) => a.id === tx.destinationAccountId);

      return {
        ...tx,
        movType,
        delta,
        runningBalance: running,
        originAccName: originAcc?.name,
        destAccName: destAcc?.name,
      };
    });

    // 3. Inverter para exibição (mais recente no topo)
    const reversed = [...calculatedItems].reverse();

    return {
      items: reversed,
      totalAportes,
      totalResgates,
      totalYields,
      currentBalance: running,
    };
  }, [goal, transactions, accounts]);

  if (!isOpen || !goal) return null;

  const GoalIcon = SAVINGS_GOAL_ICONS[goal.icon] || PiggyBank;
  const linkedAcc = accounts.find((a) => a.id === goal.linkedAccountId);
  const targetCents = Number(goal.targetCents || 0);
  const progressPercent = targetCents > 0
    ? Math.min(100, Math.round((statementData.currentBalance / targetCents) * 100))
    : 0;

  const filteredItems = statementData.items.filter((item) => {
    if (filterType === 'APORTE') return item.movType === 'APORTE';
    if (filterType === 'RESGATE') return item.movType === 'RESGATE';
    if (filterType === 'YIELD') return item.movType === 'YIELD';
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header do Cofrinho */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-start justify-between bg-gradient-to-r from-slate-50 via-slate-100/60 to-white">
          <div className="flex items-start space-x-3.5">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-sm shrink-0"
              style={{ backgroundColor: goal.color || '#10b981' }}
            >
              <GoalIcon className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-bold text-lg text-slate-900 leading-tight">{goal.name}</h3>
                <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                  {goal.yieldRate || '100% CDI'}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {linkedAcc ? `Vinculado à conta: ${linkedAcc.name} (${linkedAcc.bank})` : 'Reserva Familiar Independente'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1 rounded-md cursor-pointer transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Resumo Financeiro do Cofrinho */}
        <div className="p-6 border-b border-slate-100 bg-white space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Saldo Acumulado Atual</span>
              <div className="text-2xl sm:text-3xl font-black text-slate-900">
                {formatMoney(statementData.currentBalance)}
              </div>
            </div>

            <div className="flex items-center space-x-2 flex-wrap gap-y-2">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenAporte && onOpenAporte(goal);
                }}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white flex items-center space-x-1.5 transition active:scale-95 cursor-pointer shadow-xs"
              >
                <ArrowDownLeft className="w-3.5 h-3.5" />
                <span>Aportar</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenResgate && onOpenResgate(goal);
                }}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-sky-600 hover:bg-sky-700 text-white flex items-center space-x-1.5 transition active:scale-95 cursor-pointer shadow-xs"
              >
                <ArrowUpRight className="w-3.5 h-3.5" />
                <span>Resgatar</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenYield && onOpenYield(goal);
                }}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-amber-500 hover:bg-amber-600 text-white flex items-center space-x-1.5 transition active:scale-95 cursor-pointer shadow-xs"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>+ Rendimento</span>
              </button>
            </div>
          </div>

          {/* Barra de Progresso em Relação à Meta */}
          {targetCents > 0 && (
            <div className="space-y-1.5 pt-1">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500">
                  Progresso da Meta: <strong>{formatMoney(statementData.currentBalance)}</strong> de{' '}
                  <strong>{formatMoney(targetCents)}</strong>
                </span>
                <span className="font-bold text-emerald-700">{progressPercent}%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${progressPercent}%`,
                    backgroundColor: goal.color || '#10b981',
                  }}
                />
              </div>
            </div>
          )}

          {/* Cards de Métricas do Extrato */}
          <div className="grid grid-cols-3 gap-2.5 pt-1 text-center">
            <div className="bg-emerald-50/70 border border-emerald-100 rounded-xl p-2.5">
              <span className="text-[10px] uppercase font-bold text-emerald-700 block">Total Aportado</span>
              <span className="text-sm font-bold text-emerald-900">+{formatMoney(statementData.totalAportes)}</span>
            </div>
            <div className="bg-sky-50/70 border border-sky-100 rounded-xl p-2.5">
              <span className="text-[10px] uppercase font-bold text-sky-700 block">Total Resgatado</span>
              <span className="text-sm font-bold text-sky-900">-{formatMoney(statementData.totalResgates)}</span>
            </div>
            <div className="bg-amber-50/70 border border-amber-100 rounded-xl p-2.5">
              <span className="text-[10px] uppercase font-bold text-amber-700 block">Rendimentos</span>
              <span className="text-sm font-bold text-amber-900">+{formatMoney(statementData.totalYields)}</span>
            </div>
          </div>

          {/* Abas de Filtro do Extrato */}
          <div className="flex items-center space-x-1.5 pt-1">
            <button
              type="button"
              onClick={() => setFilterType('ALL')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                filterType === 'ALL'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
              }`}
            >
              Todos ({statementData.items.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterType('APORTE')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center space-x-1 ${
                filterType === 'APORTE'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
              }`}
            >
              <ArrowDownLeft className="w-3 h-3" />
              <span>Aportes</span>
            </button>
            <button
              type="button"
              onClick={() => setFilterType('RESGATE')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center space-x-1 ${
                filterType === 'RESGATE'
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
              }`}
            >
              <ArrowUpRight className="w-3 h-3" />
              <span>Resgates</span>
            </button>
            <button
              type="button"
              onClick={() => setFilterType('YIELD')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center space-x-1 ${
                filterType === 'YIELD'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
              }`}
            >
              <Sparkles className="w-3 h-3" />
              <span>Rendimentos</span>
            </button>
          </div>
        </div>

        {/* Linha do Tempo / Extrato das Movimentações */}
        <div className="p-6 overflow-y-auto space-y-3 flex-1 bg-slate-50/50">
          {filteredItems.length === 0 ? (
            <div className="text-center py-10 px-4 bg-white rounded-2xl border border-slate-200 shadow-2xs">
              <Receipt className="w-10 h-10 text-slate-300 mx-auto mb-2.5" />
              <h4 className="font-bold text-sm text-slate-800">Nenhuma movimentação registrada</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                Realize um aporte a partir de uma conta corrente para começar a ver a linha do tempo deste cofrinho.
              </p>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenAporte && onOpenAporte(goal);
                }}
                className="mt-3.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold inline-flex items-center space-x-1.5 transition active:scale-95 cursor-pointer shadow-xs"
              >
                <ArrowDownLeft className="w-3.5 h-3.5" />
                <span>Fazer Primeiro Aporte</span>
              </button>
            </div>
          ) : (
            filteredItems.map((tx) => {
              const isAporte = tx.movType === 'APORTE';
              const isResgate = tx.movType === 'RESGATE';
              const isYield = tx.movType === 'YIELD';

              return (
                <div
                  key={tx.id}
                  className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between gap-3 hover:border-slate-300 transition"
                >
                  <div className="flex items-center space-x-3 min-w-0">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                        isAporte
                          ? 'bg-emerald-100 text-emerald-700'
                          : isResgate
                          ? 'bg-sky-100 text-sky-700'
                          : 'bg-amber-100 text-amber-700'
                      }`}
                    >
                      {isAporte && <ArrowDownLeft className="w-4 h-4" />}
                      {isResgate && <ArrowUpRight className="w-4 h-4" />}
                      {isYield && <Sparkles className="w-4 h-4" />}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center space-x-1.5 flex-wrap">
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                            isAporte
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                              : isResgate
                              ? 'bg-sky-50 text-sky-800 border border-sky-200'
                              : 'bg-amber-50 text-amber-800 border border-amber-200'
                          }`}
                        >
                          {isAporte ? 'Aporte' : isResgate ? 'Resgate' : 'Rendimento CDI'}
                        </span>
                        <span className="text-xs text-slate-400">{formatDateBR(tx.date || tx.dueDate)}</span>
                      </div>

                      <p className="text-sm font-semibold text-slate-900 truncate mt-0.5">
                        {tx.description}
                      </p>

                      <p className="text-[11px] text-slate-500 truncate">
                        {isAporte && tx.originAccName && `Saiu da conta: ${tx.originAccName}`}
                        {isResgate && tx.destAccName && `Creditado na conta: ${tx.destAccName}`}
                        {isYield && `Creditado diretamente no ${goal.name}`}
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span
                      className={`text-sm font-bold block ${
                        tx.delta >= 0 ? 'text-emerald-600' : 'text-slate-900'
                      }`}
                    >
                      {tx.delta > 0 ? '+' : ''}{formatMoney(tx.delta)}
                    </span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">
                      Saldo: <strong>{formatMoney(tx.runningBalance)}</strong>
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-100 flex items-center justify-between bg-slate-50 text-xs text-slate-500">
          <span>{filteredItems.length} movimentação(ões) listada(s)</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-100 transition cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
