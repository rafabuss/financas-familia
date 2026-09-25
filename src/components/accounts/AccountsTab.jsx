import React, { useState } from 'react';
import {
  Plus,
  Edit2,
  Archive,
  Trash2,
  Receipt,
  CreditCard,
  ArrowLeftRight,
  PiggyBank,
  TrendingUp,
  ArrowDownLeft,
  ArrowUpRight,
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

export default function AccountsTab({
  visibleAccounts: propVisibleAccounts,
  accountBalances: propAccountBalances,
  visibleCards: propVisibleCards,
  cardStats: propCardStats,
  setModalState,
  openTransactionModal,
  toggleArchiveAccount,
  handleDeleteAccount,
  toggleArchiveCard,
  handleDeleteCard,
  onNavigateToAccountStatement,
  onNavigateToCardStatement,
  visibleSavingsGoals: propVisibleSavingsGoals,
  savingsGoalBalances: propSavingsGoalBalances,
  handleSaveSavingsGoal: propHandleSaveSavingsGoal,
  handleDeleteSavingsGoal: propHandleDeleteSavingsGoal,
  handleSavingsGoalAporte: propHandleSavingsGoalAporte,
  handleSavingsGoalResgate: propHandleSavingsGoalResgate,
  handleSavingsGoalYield: propHandleSavingsGoalYield,
  transactions: propTransactions,
  currentMemberId: propCurrentMemberId,
}) {
  // Consome via hook com fallback para as props passadas
  const finance = useFinance ? useFinance() : {};

  const visibleAccounts = propVisibleAccounts || finance.visibleAccounts || [];
  const accounts = finance.accounts || visibleAccounts || [];
  const accountBalances = propAccountBalances || finance.accountBalances || {};
  const visibleCards = propVisibleCards || finance.visibleCards || [];
  const cardStats = propCardStats || finance.cardStats || {};
  const visibleSavingsGoals = propVisibleSavingsGoals || finance.visibleSavingsGoals || [];
  const savingsGoalBalances = propSavingsGoalBalances || finance.savingsGoalBalances || {};
  const handleSaveSavingsGoal = propHandleSaveSavingsGoal || finance.handleSaveSavingsGoal;
  const handleDeleteSavingsGoal = propHandleDeleteSavingsGoal || finance.handleDeleteSavingsGoal;
  const handleSavingsGoalAporte = propHandleSavingsGoalAporte || finance.handleSavingsGoalAporte;
  const handleSavingsGoalResgate = propHandleSavingsGoalResgate || finance.handleSavingsGoalResgate;
  const handleSavingsGoalYield = propHandleSavingsGoalYield || finance.handleSavingsGoalYield;
  const transactions = propTransactions || finance.transactions || [];
  const currentMemberId = propCurrentMemberId || finance.currentMemberId || 'user-all';

  // Estados dos Modais de Cofrinhos
  const [goalModalState, setGoalModalState] = useState({ isOpen: false, mode: 'create', data: null });
  const [aporteModalGoal, setAporteModalGoal] = useState(null);
  const [resgateModalGoal, setResgateModalGoal] = useState(null);
  const [yieldModalGoal, setYieldModalGoal] = useState(null);
  const [statementModalGoal, setStatementModalGoal] = useState(null);

  return (
    <div className="space-y-10">
      {/* ===================== CONTAS BANCÁRIAS E CARTEIRAS ===================== */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Contas Bancárias e Carteiras</h2>
            <p className="text-xs text-slate-500">Cadastre e edite contas correntes e carteiras operacionais</p>
          </div>
          <div className="flex items-center space-x-2">
            {openTransactionModal && (
              <button
                type="button"
                onClick={() => openTransactionModal(null, 'TRANSFER')}
                className="bg-sky-600 hover:bg-sky-700 text-white px-3.5 py-2 rounded-lg text-sm font-semibold flex items-center space-x-1.5 cursor-pointer shadow-sm transition active:scale-95"
                title="Transferir saldo entre contas (Pix / TED)"
              >
                <ArrowLeftRight className="w-4 h-4" />
                <span>Transferir / Pix</span>
              </button>
            )}
            <button
              onClick={() => setModalState({ isOpen: true, type: 'account', mode: 'create', data: null })}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center space-x-1 cursor-pointer shadow-sm transition active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Nova Conta</span>
            </button>
          </div>
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

              <div className="mt-5 pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Saldo Atual</span>
                  <p className="text-lg font-bold text-slate-900">{formatMoney(accountBalances[acc.id] || 0)}</p>
                </div>
                <div className="flex items-center space-x-1.5 flex-wrap gap-y-1">
                  {openTransactionModal && (
                    <button
                      type="button"
                      onClick={() => openTransactionModal({ accountId: acc.id }, 'TRANSFER')}
                      className="px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-sky-50 text-sky-700 hover:bg-sky-100 border border-sky-200 flex items-center space-x-1 transition active:scale-95 cursor-pointer shadow-2xs"
                      title={`Fazer transferência / Pix a partir de ${acc.name}`}
                    >
                      <ArrowLeftRight className="w-3.5 h-3.5 text-sky-600" />
                      <span>Pix</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => onNavigateToAccountStatement && onNavigateToAccountStatement(acc.id)}
                    className="px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 flex items-center space-x-1 transition active:scale-95 cursor-pointer shadow-2xs"
                    title="Ver Extrato completo com saldo progressivo"
                  >
                    <Receipt className="w-3.5 h-3.5 text-blue-600" />
                    <span>Extrato</span>
                  </button>
                  <button
                    onClick={() => setModalState({ isOpen: true, type: 'account', mode: 'edit', data: acc })}
                    className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition cursor-pointer"
                    title="Editar"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => toggleArchiveAccount(acc.id)}
                    className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition cursor-pointer"
                    title={acc.archived ? 'Desarquivar' : 'Arquivar'}
                  >
                    <Archive className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteAccount(acc)}
                    className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
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

      {/* ===================== COFRINHOS, CAIXINHAS & RESERVA DE EMERGÊNCIA ===================== */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center space-x-2">
              <span className="p-1.5 bg-emerald-100 text-emerald-700 rounded-lg">
                <PiggyBank className="w-5 h-5" />
              </span>
              <h2 className="text-lg font-bold text-slate-900">Cofrinhos & Metas de Reserva</h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Caixinhas Nubank, Cofrinhos Inter e reservas com liquidez diária e rendimento CDI
            </p>
          </div>
          <button
            type="button"
            onClick={() => setGoalModalState({ isOpen: true, mode: 'create', data: null })}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center space-x-1 cursor-pointer shadow-sm transition active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Cofrinho / Meta</span>
          </button>
        </div>

        {/* Resumo consolidado dos cofrinhos */}
        {visibleSavingsGoals.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-emerald-50/60 border border-emerald-200/70 p-4 rounded-2xl">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">Total Guardado em Cofrinhos</span>
              <div className="text-xl font-black text-emerald-950">
                {formatMoney(
                  visibleSavingsGoals.reduce((sum, g) => sum + (savingsGoalBalances[g.id] || 0), 0)
                )}
              </div>
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">Total de Metas Planejadas</span>
              <div className="text-xl font-bold text-emerald-900">
                {formatMoney(
                  visibleSavingsGoals.reduce((sum, g) => sum + (g.targetCents || 0), 0)
                )}
              </div>
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">Progresso Médio Geral</span>
              <div className="text-xl font-bold text-emerald-900">
                {(() => {
                  const totalSaved = visibleSavingsGoals.reduce((sum, g) => sum + (savingsGoalBalances[g.id] || 0), 0);
                  const totalTarget = visibleSavingsGoals.reduce((sum, g) => sum + (g.targetCents || 0), 0);
                  return totalTarget > 0 ? `${Math.min(100, Math.round((totalSaved / totalTarget) * 100))}%` : 'Livre';
                })()}
              </div>
            </div>
          </div>
        )}

        {/* Grid dos Cofrinhos */}
        {visibleSavingsGoals.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-8 text-center flex flex-col items-center justify-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <PiggyBank className="w-6 h-6" />
            </div>
            <div className="max-w-md">
              <h3 className="font-bold text-slate-800 text-sm">Nenhum cofrinho ou caixinha cadastrado ainda</h3>
              <p className="text-xs text-slate-500 mt-1">
                Separe dinheiro para a Reserva de Emergência, férias, IPVA ou metas futuras com rendimento CDI sem misturar com o saldo das contas do dia a dia.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setGoalModalState({ isOpen: true, mode: 'create', data: null })}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-4 py-2 rounded-xl transition cursor-pointer flex items-center space-x-1.5 shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Criar Primeiro Cofrinho</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {visibleSavingsGoals.map((goal) => {
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
                    {/* Header do Card */}
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center space-x-3">
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-xs shrink-0"
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
                          <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                            🎉 Meta Atingida!
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
      </div>

      {/* ===================== CARTÕES DE CRÉDITO ===================== */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Cartões de Crédito</h2>
            <p className="text-xs text-slate-500">Gerencie limites totais, disponíveis e datas de vencimento</p>
          </div>
          <button
            onClick={() => setModalState({ isOpen: true, type: 'card', mode: 'create', data: null })}
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center space-x-1 cursor-pointer shadow-sm transition active:scale-95"
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

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => onNavigateToCardStatement && onNavigateToCardStatement(card.id)}
                    className="px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200 flex items-center space-x-1 transition active:scale-95 cursor-pointer shadow-2xs"
                    title="Ver Fatura deste Cartão"
                  >
                    <CreditCard className="w-3.5 h-3.5 text-purple-600" />
                    <span>Ver Fatura</span>
                  </button>
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => setModalState({ isOpen: true, type: 'card', mode: 'edit', data: card })}
                      className="p-1.5 text-slate-500 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition cursor-pointer"
                      title="Editar"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => toggleArchiveCard(card.id)}
                      className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition cursor-pointer"
                      title={card.archived ? 'Desarquivar' : 'Arquivar'}
                    >
                      <Archive className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteCard(card)}
                      className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                      title="Excluir Definitivamente"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

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
