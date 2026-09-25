import React, { useState, useMemo } from 'react';
import {
  Plus,
  Edit2,
  Trash2,
  Receipt,
  PiggyBank,
  TrendingUp,
  ArrowDownLeft,
  ArrowUpRight,
  ShieldCheck,
  Target,
  Sparkles,
  Search,
  CheckCircle2,
} from 'lucide-react';
import { formatMoney } from '../../utils/formatters';
import { FAMILY_MEMBERS } from '../../data/constants';
import { useFinance } from '../../contexts/FinanceContext';
import {
  SavingsGoalModal,
  SavingsGoalAporteModal,
  SavingsGoalResgateModal,
  SavingsGoalYieldModal,
  SavingsGoalStatementModal,
  SAVINGS_GOAL_ICONS,
} from '../modals/SavingsGoalModals';

export default function SavingsGoalsTab({
  visibleSavingsGoals: propVisibleSavingsGoals,
  savingsGoalBalances: propSavingsGoalBalances,
  handleSaveSavingsGoal: propHandleSaveSavingsGoal,
  handleDeleteSavingsGoal: propHandleDeleteSavingsGoal,
  handleSavingsGoalAporte: propHandleSavingsGoalAporte,
  handleSavingsGoalResgate: propHandleSavingsGoalResgate,
  handleSavingsGoalYield: propHandleSavingsGoalYield,
  accounts: propAccounts,
  accountBalances: propAccountBalances,
  transactions: propTransactions,
  currentMemberId: propCurrentMemberId,
}) {
  const finance = useFinance ? useFinance() : {};

  const visibleSavingsGoals = propVisibleSavingsGoals || finance.visibleSavingsGoals || [];
  const savingsGoalBalances = propSavingsGoalBalances || finance.savingsGoalBalances || {};
  const handleSaveSavingsGoal = propHandleSaveSavingsGoal || finance.handleSaveSavingsGoal;
  const handleDeleteSavingsGoal = propHandleDeleteSavingsGoal || finance.handleDeleteSavingsGoal;
  const handleSavingsGoalAporte = propHandleSavingsGoalAporte || finance.handleSavingsGoalAporte;
  const handleSavingsGoalResgate = propHandleSavingsGoalResgate || finance.handleSavingsGoalResgate;
  const handleSavingsGoalYield = propHandleSavingsGoalYield || finance.handleSavingsGoalYield;
  const accounts = propAccounts || finance.accounts || [];
  const accountBalances = propAccountBalances || finance.accountBalances || {};
  const transactions = propTransactions || finance.transactions || [];
  const currentMemberId = propCurrentMemberId || finance.currentMemberId || 'user-all';

  // Estados dos Modais
  const [goalModalState, setGoalModalState] = useState({ isOpen: false, mode: 'create', data: null });
  const [aporteModalGoal, setAporteModalGoal] = useState(null);
  const [resgateModalGoal, setResgateModalGoal] = useState(null);
  const [yieldModalGoal, setYieldModalGoal] = useState(null);
  const [statementModalGoal, setStatementModalGoal] = useState(null);

  // Filtros locais
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL' | 'IN_PROGRESS' | 'REACHED'

  // Cálculos de Totais Consolidados
  const totalSavedCents = useMemo(() => {
    return visibleSavingsGoals.reduce((sum, g) => sum + (savingsGoalBalances[g.id] || 0), 0);
  }, [visibleSavingsGoals, savingsGoalBalances]);

  const totalTargetCents = useMemo(() => {
    return visibleSavingsGoals.reduce((sum, g) => sum + (g.targetCents || 0), 0);
  }, [visibleSavingsGoals]);

  const averageProgress = useMemo(() => {
    if (totalTargetCents <= 0) return 0;
    return Math.min(100, Math.round((totalSavedCents / totalTargetCents) * 100));
  }, [totalSavedCents, totalTargetCents]);

  // Lista filtrada
  const filteredGoals = useMemo(() => {
    return visibleSavingsGoals.filter((goal) => {
      // Busca por nome
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchesName = goal.name?.toLowerCase().includes(term);
        const matchesRate = goal.yieldRate?.toLowerCase().includes(term);
        if (!matchesName && !matchesRate) return false;
      }

      // Filtro de status
      const bal = savingsGoalBalances[goal.id] || 0;
      const isReached = goal.targetCents > 0 && bal >= goal.targetCents;

      if (statusFilter === 'REACHED') return isReached;
      if (statusFilter === 'IN_PROGRESS') return !isReached;

      return true;
    });
  }, [visibleSavingsGoals, savingsGoalBalances, searchTerm, statusFilter]);

  return (
    <div className="space-y-6">
      {/* ===================== CABEÇALHO DA SUB-ABA ===================== */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-start space-x-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-md shadow-emerald-600/20 shrink-0">
            <PiggyBank className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-xl font-bold text-slate-900">Cofrinhos & Metas de Reserva</h2>
              <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                100% CDI Liquidez
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1 max-w-2xl">
              Caixinhas Nubank, Cofrinhos Inter e reservas protegidas com rendimento diário. O dinheiro fica separado das contas correntes e pronto para resgate imediato quando necessário.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setGoalModalState({ isOpen: true, mode: 'create', data: null })}
          className="bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center space-x-1.5 cursor-pointer shadow-sm transition active:scale-95 whitespace-nowrap self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Novo Cofrinho / Meta</span>
        </button>
      </div>

      {/* ===================== CARDS DE RESUMO CONSOLIDADO ===================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Guardado */}
        <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 text-white p-5 rounded-2xl shadow-sm border border-slate-700/80 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-slate-300 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">Total Guardado</span>
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
            </div>
            <div className="text-2xl font-black text-emerald-300">
              {formatMoney(totalSavedCents)}
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-700/60 text-[11px] text-slate-300 flex justify-between">
            <span>{visibleSavingsGoals.length} {visibleSavingsGoals.length === 1 ? 'cofrinho ativo' : 'cofrinhos ativos'}</span>
            <span className="text-emerald-400 font-semibold">Reserva Protegida</span>
          </div>
        </div>

        {/* Card 2: Metas Planejadas */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Metas Planejadas</span>
              <Target className="w-5 h-5 text-blue-500" />
            </div>
            <div className="text-2xl font-bold text-slate-900">
              {formatMoney(totalTargetCents)}
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-100 text-[11px] text-slate-500 flex justify-between">
            <span>Objetivo estipulado</span>
            <span className="font-semibold text-blue-600">
              {totalTargetCents > totalSavedCents ? `Faltam ${formatMoney(totalTargetCents - totalSavedCents)}` : 'Meta Coberta'}
            </span>
          </div>
        </div>

        {/* Card 3: Progresso Médio */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Progresso Geral</span>
              <Sparkles className="w-5 h-5 text-amber-500" />
            </div>
            <div className="text-2xl font-bold text-slate-900">
              {totalTargetCents > 0 ? `${averageProgress}%` : 'Sem teto'}
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-100">
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                style={{ width: `${totalTargetCents > 0 ? averageProgress : 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* Card 4: Rendimento de Referência */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Rendimento Médio</span>
              <TrendingUp className="w-5 h-5 text-emerald-500" />
            </div>
            <div className="text-2xl font-bold text-emerald-600">
              100% CDI
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-100 text-[11px] text-slate-500 flex justify-between">
            <span>Liquidez diária</span>
            <span className="text-emerald-700 font-semibold">Crédito mensal</span>
          </div>
        </div>
      </div>

      {/* ===================== FILTROS E BUSCA ===================== */}
      {visibleSavingsGoals.length > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/80 p-3 rounded-xl border border-slate-200/80">
          <div className="flex items-center space-x-1.5 flex-wrap">
            <span className="text-xs font-semibold text-slate-500 mr-1">Filtrar:</span>
            <button
              type="button"
              onClick={() => setStatusFilter('ALL')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                statusFilter === 'ALL'
                  ? 'bg-white text-emerald-700 shadow-xs border border-emerald-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Todos ({visibleSavingsGoals.length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('IN_PROGRESS')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                statusFilter === 'IN_PROGRESS'
                  ? 'bg-white text-emerald-700 shadow-xs border border-emerald-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Em Andamento
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('REACHED')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                statusFilter === 'REACHED'
                  ? 'bg-white text-emerald-700 shadow-xs border border-emerald-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              🎉 Metas Atingidas
            </button>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por nome ou taxa..."
              className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
            />
          </div>
        </div>
      )}

      {/* ===================== GRID DE COFRINHOS ===================== */}
      {visibleSavingsGoals.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center flex flex-col items-center justify-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-inner">
            <PiggyBank className="w-8 h-8" />
          </div>
          <div className="max-w-md">
            <h3 className="font-bold text-slate-900 text-base">Nenhum cofrinho ou caixinha cadastrado ainda</h3>
            <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
              Crie seu primeiro cofrinho (como a <strong>Reserva de Emergência 100% CDI</strong>, <strong>Caixinha Nubank Férias</strong> ou <strong>Cofrinho Inter IPVA</strong>) para acumular recursos com rendimento imediato sem misturar com o saldo das contas do dia a dia.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setGoalModalState({ isOpen: true, mode: 'create', data: null })}
            className="bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-semibold px-5 py-2.5 rounded-xl transition cursor-pointer flex items-center space-x-1.5 shadow-sm"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Criar Primeiro Cofrinho</span>
          </button>
        </div>
      ) : filteredGoals.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-xs text-slate-500">
          Nenhum cofrinho corresponde aos filtros selecionados.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredGoals.map((goal) => {
            const balance = savingsGoalBalances[goal.id] || 0;
            const hasTarget = goal.targetCents > 0;
            const pct = hasTarget ? Math.min(100, Math.round((balance / goal.targetCents) * 100)) : 0;
            const isGoalReached = hasTarget && balance >= goal.targetCents;
            const linkedAcc = accounts.find((a) => a.id === goal.linkedAccountId);
            const IconComp = SAVINGS_GOAL_ICONS[goal.icon] || PiggyBank;
            const ownerMember = FAMILY_MEMBERS.find((m) => m.id === goal.ownerId);

            return (
              <div
                key={goal.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
              >
                <div>
                  {/* Cabeçalho do Card */}
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center space-x-3">
                      <div
                        className="w-11 h-11 rounded-xl flex items-center justify-center text-white shadow-xs shrink-0"
                        style={{ backgroundColor: goal.color || '#10b981' }}
                      >
                        <IconComp className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 text-base leading-snug">{goal.name}</h3>
                        <div className="flex items-center space-x-1.5 flex-wrap text-xs text-slate-500 mt-0.5">
                          {linkedAcc ? (
                            <span>{linkedAcc.name}</span>
                          ) : (
                            <span>Geral da Família</span>
                          )}
                          {goal.ownerId && goal.ownerId !== 'user-all' && (
                            <>
                              <span>•</span>
                              <span className="bg-slate-100 text-slate-700 px-1.5 py-0.2 rounded text-[10px] font-bold">
                                {ownerMember?.name || 'Membro'}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/80 px-2 py-0.5 rounded-full whitespace-nowrap">
                      {goal.yieldRate || '100% CDI'}
                    </span>
                  </div>

                  {/* Saldo Atual */}
                  <div className="mt-4 pt-3 border-t border-slate-100">
                    <div className="flex justify-between items-baseline">
                      <span className="text-[10px] uppercase font-bold text-slate-400">Saldo Acumulado</span>
                      {isGoalReached && (
                        <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full flex items-center space-x-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                          <span>Meta Atingida!</span>
                        </span>
                      )}
                    </div>
                    <div className="text-2xl font-black text-slate-900 mt-0.5">
                      {formatMoney(balance)}
                    </div>
                  </div>

                  {/* Barra de Progresso em relação à Meta */}
                  <div className="mt-3 space-y-1.5">
                    {hasTarget ? (
                      <>
                        <div className="flex justify-between text-xs text-slate-500 font-medium">
                          <span>Meta: <strong>{formatMoney(goal.targetCents)}</strong></span>
                          <span className="font-bold text-emerald-700">{pct}%</span>
                        </div>
                        <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${pct}%`,
                              backgroundColor: isGoalReached ? '#10b981' : goal.color || '#10b981',
                            }}
                          />
                        </div>
                      </>
                    ) : (
                      <div className="text-[11px] text-slate-400 italic">
                        Reserva livre sem teto estipulado (rendendo {goal.yieldRate || '100% CDI'})
                      </div>
                    )}
                  </div>
                </div>

                {/* Ações Rápidas */}
                <div className="mt-5 pt-3 border-t border-slate-100">
                  <div className="flex flex-wrap items-center justify-between gap-1.5">
                    <div className="flex items-center space-x-1.5 flex-wrap gap-y-1">
                      {/* Aportar */}
                      <button
                        type="button"
                        onClick={() => setAporteModalGoal(goal)}
                        className="px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 flex items-center space-x-1 transition active:scale-95 cursor-pointer shadow-2xs"
                        title={`Guardar dinheiro em ${goal.name}`}
                      >
                        <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Aportar</span>
                      </button>

                      {/* Resgatar */}
                      <button
                        type="button"
                        onClick={() => setResgateModalGoal(goal)}
                        className="px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-sky-50 text-sky-700 hover:bg-sky-100 border border-sky-200 flex items-center space-x-1 transition active:scale-95 cursor-pointer shadow-2xs"
                        title={`Resgatar saldo de ${goal.name} para Conta Corrente`}
                      >
                        <ArrowUpRight className="w-3.5 h-3.5 text-sky-600" />
                        <span>Resgatar</span>
                      </button>

                      {/* Ver Extrato */}
                      <button
                        type="button"
                        onClick={() => setStatementModalGoal(goal)}
                        className="px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200 flex items-center space-x-1 transition active:scale-95 cursor-pointer shadow-2xs"
                        title="Ver Extrato completo com saldo progressivo e linha do tempo"
                      >
                        <Receipt className="w-3.5 h-3.5 text-slate-600" />
                        <span>Extrato</span>
                      </button>

                      {/* + Rendimento */}
                      <button
                        type="button"
                        onClick={() => setYieldModalGoal(goal)}
                        className="px-2 py-1.5 text-xs font-semibold rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200 flex items-center space-x-1 transition active:scale-95 cursor-pointer shadow-2xs"
                        title={`Lançar rendimento mensal CDI para ${goal.name}`}
                      >
                        <TrendingUp className="w-3.5 h-3.5 text-amber-600" />
                        <span>+ CDI</span>
                      </button>
                    </div>

                    {/* Editar & Excluir */}
                    <div className="flex items-center space-x-1 ml-auto">
                      <button
                        type="button"
                        onClick={() => setGoalModalState({ isOpen: true, mode: 'edit', data: goal })}
                        className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition cursor-pointer"
                        title="Editar Metas e Configurações"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteSavingsGoal(goal)}
                        className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                        title="Excluir Cofrinho"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ===================== MODAIS DE COFRINHOS ===================== */}
      <SavingsGoalModal
        isOpen={goalModalState.isOpen}
        onClose={() => setGoalModalState({ isOpen: false, mode: 'create', data: null })}
        mode={goalModalState.mode}
        initialData={goalModalState.data}
        accounts={accounts}
        onSave={handleSaveSavingsGoal}
        currentMemberId={currentMemberId}
      />

      <SavingsGoalAporteModal
        isOpen={!!aporteModalGoal}
        onClose={() => setAporteModalGoal(null)}
        goal={aporteModalGoal}
        accounts={accounts}
        accountBalances={accountBalances}
        onConfirmAporte={handleSavingsGoalAporte}
      />

      <SavingsGoalResgateModal
        isOpen={!!resgateModalGoal}
        onClose={() => setResgateModalGoal(null)}
        goal={resgateModalGoal}
        accounts={accounts}
        onConfirmResgate={handleSavingsGoalResgate}
      />

      <SavingsGoalYieldModal
        isOpen={!!yieldModalGoal}
        onClose={() => setYieldModalGoal(null)}
        goal={yieldModalGoal}
        onConfirmYield={handleSavingsGoalYield}
      />

      <SavingsGoalStatementModal
        isOpen={!!statementModalGoal}
        onClose={() => setStatementModalGoal(null)}
        goal={statementModalGoal}
        accounts={accounts}
        transactions={transactions}
        onOpenAporte={(g) => {
          setStatementModalGoal(null);
          setAporteModalGoal(g);
        }}
        onOpenResgate={(g) => {
          setStatementModalGoal(null);
          setResgateModalGoal(g);
        }}
        onOpenYield={(g) => {
          setStatementModalGoal(null);
          setYieldModalGoal(g);
        }}
      />
    </div>
  );
}
