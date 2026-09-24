import React from 'react';
import {
  Sparkles,
  Calendar,
  ChevronDown,
  Sliders,
  Save,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Check,
  X,
} from 'lucide-react';
import { formatMoney, formatMonthLabel } from '../../utils/formatters';

export default function ProjectionsTab({
  scenarios = [],
  projectionHorizon = 12,
  setProjectionHorizon,
  whatIfSimulation = { active: false, ignoredStreamIds: [], categoryReductions: {}, startMonth: '' },
  setWhatIfSimulation,
  whatIfSummary = { totalAdjustmentsCount: 0, monthlyNetImpactCents: 0, activeIncomesCount: 0, activeExpensesCount: 0 },
  showWhatIfDrawer = false,
  setShowWhatIfDrawer,
  currentActualMonth,
  availableWhatIfStreams = { incomes: [], expenses: [] },
  categories = [],
  handleSaveWhatIfAsScenario,
  visibleTransactions = [],
  monthSummary = {},
  monthlyEnvelopes = [],
  projectionSort = { field: 'month', direction: 'asc' },
  setProjectionSort,
  currentMemberId = 'user-all',
}) {
  return (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 tracking-tight">Projeção do Fluxo de Caixa</h2>
                  <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                    Previsão acumulada considerando receitas, despesas/parcelas, envelopes e o impacto dos cenários ativos.
                  </p>
                </div>

              <div className="flex flex-wrap items-center gap-3">
                {scenarios.filter((s) => s.active).length > 0 ? (
                  <div className="text-xs font-semibold bg-blue-50 text-blue-800 border border-blue-200 px-3 py-1.5 rounded-lg flex items-center space-x-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                    <span>
                      {scenarios.filter((s) => s.active).length} Cenário{scenarios.filter((s) => s.active).length > 1 ? 's' : ''} Ativo{scenarios.filter((s) => s.active).length > 1 ? 's' : ''}
                    </span>
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

            {/* ===================== SIMULADOR WHAT-IF INTERATIVO (OPÇÃO 2) ===================== */}
            <div className={`rounded-2xl border transition-all ${
              whatIfSimulation.active
                ? 'bg-gradient-to-br from-amber-50/80 via-blue-50/60 to-indigo-50/70 border-amber-300 shadow-sm'
                : 'bg-slate-50 border-slate-200'
            }`}>
              {/* Barra Resumo / Gatilho */}
              <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg shadow-xs shrink-0 ${
                    whatIfSimulation.active ? 'bg-amber-500 text-white' : 'bg-slate-200 text-slate-700'
                  }`}>
                    ⚡
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-sm sm:text-base font-bold text-slate-900">
                        Simulador What-If: Testar Cortes & Ajustes Futuros
                      </h3>
                      {whatIfSimulation.active ? (
                        <span className="text-[10px] font-extrabold uppercase tracking-wider bg-amber-500 text-white px-2 py-0.5 rounded-full animate-pulse">
                          Simulação Ativa ({whatIfSummary.totalAdjustmentsCount} corte{whatIfSummary.totalAdjustmentsCount !== 1 ? 's' : ''})
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full">
                          Inativo (Realidade Padrão)
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Desconsidere receitas (ex: saída do emprego) ou corte despesas futuras para simular o saldo sem alterar seu passado real.
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      const nextActive = !whatIfSimulation.active;
                      setWhatIfSimulation((prev) => ({ ...prev, active: nextActive }));
                      if (nextActive && !showWhatIfDrawer) setShowWhatIfDrawer(true);
                    }}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 shadow-xs ${
                      whatIfSimulation.active
                        ? 'bg-amber-500 text-white hover:bg-amber-600'
                        : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-300'
                    }`}
                  >
                    <span>{whatIfSimulation.active ? 'Desativar Simulação' : 'Ativar Simulação'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowWhatIfDrawer((prev) => !prev)}
                    className="px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 transition flex items-center space-x-1 shadow-xs"
                  >
                    <span>{showWhatIfDrawer ? 'Recolher' : 'Configurar Cortes'}</span>
                    <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showWhatIfDrawer ? 'rotate-180' : ''}`} />
                  </button>
                </div>
              </div>

              {/* Gaveta de Configuração dos Cortes */}
              {showWhatIfDrawer && (
                <div className="border-t border-slate-200/80 p-4 sm:p-5 space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3 bg-white/70 p-3 rounded-xl border border-slate-200">
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4 text-blue-600" />
                      <span className="text-xs font-bold text-slate-700">Aplicar cortes a partir de:</span>
                      <select
                        value={whatIfSimulation.startMonth || currentActualMonth}
                        onChange={(e) => setWhatIfSimulation((prev) => ({ ...prev, startMonth: e.target.value }))}
                        className="text-xs font-semibold bg-white border border-slate-300 rounded-lg px-2.5 py-1 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      >
                        {[0, 1, 2, 3, 4, 5, 6].map((i) => {
                          const [y, m] = currentActualMonth.split('-').map(Number);
                          const d = new Date(y, m - 1 + i, 1);
                          const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
                          return (
                            <option key={k} value={k}>
                              {formatMonthLabel(k)} {i === 0 ? '(Mês Atual)' : ''}
                            </option>
                          );
                        })}
                      </select>
                    </div>

                    <div className="text-[11px] text-slate-500">
                      💡 Marque/desmarque os itens abaixo. A tabela abaixo recalcula automaticamente.
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {/* Coluna 1: Receitas Mapeadas */}
                    <div className="bg-white/80 p-3.5 rounded-xl border border-slate-200 space-y-2.5">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                        <span className="text-xs font-bold text-slate-800 flex items-center space-x-1.5">
                          <span className="text-emerald-600">🟢</span>
                          <span>Receitas da Família ({availableWhatIfStreams.incomes.length})</span>
                        </span>
                        <span className="text-[10px] text-slate-400">Desmarque para retirar</span>
                      </div>

                      {availableWhatIfStreams.incomes.length === 0 ? (
                        <p className="text-xs text-slate-400 py-3 text-center">Nenhuma receita identificada.</p>
                      ) : (
                        <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                          {availableWhatIfStreams.incomes.map((inc) => {
                            const isChecked = !whatIfSimulation.ignoredIncomes.includes(inc.key);
                            return (
                              <label
                                key={inc.key}
                                className={`flex items-center justify-between p-2.5 rounded-lg border text-xs cursor-pointer transition select-none ${
                                  isChecked
                                    ? 'bg-white border-slate-200 hover:border-blue-300'
                                    : 'bg-rose-50/70 border-rose-200 text-rose-900'
                                }`}
                              >
                                <div className="flex items-center space-x-2.5 truncate mr-2">
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={() => {
                                      setWhatIfSimulation((prev) => {
                                        const set = new Set(prev.ignoredIncomes);
                                        if (isChecked) set.add(inc.key);
                                        else set.delete(inc.key);
                                        return { ...prev, active: true, ignoredIncomes: Array.from(set) };
                                      });
                                    }}
                                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 shrink-0"
                                  />
                                  <div className="truncate">
                                    <div className="font-semibold text-slate-900 truncate flex items-center space-x-1.5">
                                      <span className="truncate">{inc.description}</span>
                                      {inc.ownerId === 'user-1' && (
                                        <span className="text-[10px] bg-blue-50 text-blue-700 px-1 py-0.2 rounded font-semibold shrink-0">
                                          Rafael
                                        </span>
                                      )}
                                      {inc.ownerId === 'user-2' && (
                                        <span className="text-[10px] bg-purple-50 text-purple-700 px-1 py-0.2 rounded font-semibold shrink-0">
                                          Ana Débora
                                        </span>
                                      )}
                                    </div>
                                    <div className="text-[10px] text-slate-400 mt-0.5">
                                      {isChecked ? 'Mantido no fluxo projetado' : '🔴 Retirado da projeção'}
                                    </div>
                                  </div>
                                </div>
                                <span className={`font-bold shrink-0 ${isChecked ? 'text-emerald-600' : 'text-slate-400 line-through'}`}>
                                  +{formatMoney(inc.amountCents)}
                                </span>
                              </label>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Coluna 2: Despesas e Cortes Mapeados */}
                    <div className="bg-white/80 p-3.5 rounded-xl border border-slate-200 space-y-2.5">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                        <span className="text-xs font-bold text-slate-800 flex items-center space-x-1.5">
                          <span className="text-rose-600">🔴</span>
                          <span>Despesas & Parcelamentos ({availableWhatIfStreams.expenses.length})</span>
                        </span>
                        <span className="text-[10px] text-slate-400">Desmarque para cortar</span>
                      </div>

                      {availableWhatIfStreams.expenses.length === 0 ? (
                        <p className="text-xs text-slate-400 py-3 text-center">Nenhuma despesa fixa/parcela mapeada.</p>
                      ) : (
                        <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                          {availableWhatIfStreams.expenses.map((exp) => {
                            const isChecked = !whatIfSimulation.ignoredExpenses.includes(exp.key);
                            return (
                              <label
                                key={exp.key}
                                className={`flex items-center justify-between p-2.5 rounded-lg border text-xs cursor-pointer transition select-none ${
                                  isChecked
                                    ? 'bg-white border-slate-200 hover:border-blue-300'
                                    : 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
                                }`}
                              >
                                <div className="flex items-center space-x-2.5 truncate mr-2">
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={() => {
                                      setWhatIfSimulation((prev) => {
                                        const set = new Set(prev.ignoredExpenses);
                                        if (isChecked) set.add(exp.key);
                                        else set.delete(exp.key);
                                        return { ...prev, active: true, ignoredExpenses: Array.from(set) };
                                      });
                                    }}
                                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 shrink-0"
                                  />
                                  <div className="truncate">
                                    <div className="font-semibold text-slate-900 truncate flex items-center space-x-1.5">
                                      <span className="truncate">{exp.description}</span>
                                      {exp.isInstallment && (
                                        <span className="text-[10px] bg-amber-50 text-amber-700 px-1 py-0.2 rounded font-semibold shrink-0">
                                          Parcelamento
                                        </span>
                                      )}
                                    </div>
                                    <div className="text-[10px] text-slate-400 mt-0.5">
                                      {isChecked ? 'Mantido nas despesas' : '🟢 Cortado na simulação'}
                                    </div>
                                  </div>
                                </div>
                                <span className={`font-bold shrink-0 ${isChecked ? 'text-rose-600' : 'text-slate-400 line-through'}`}>
                                  -{formatMoney(exp.amountCents)}
                                </span>
                              </label>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Redução de Teto de Gastos em Categorias */}
                  <div className="bg-white/70 p-3 rounded-xl border border-slate-200 space-y-2">
                    <span className="text-xs font-bold text-slate-700 flex items-center space-x-1">
                      <Sliders className="w-3 h-3 text-blue-600" />
                      <span>Cortes Opcionais em Tetos de Categorias (R$/mês):</span>
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {categories.filter((c) => !c.parentId && !c.archived && c.type === 'EXPENSE').slice(0, 4).map((cat) => {
                        const currentRed = whatIfSimulation.categoryReductions?.[cat.id] || 0;
                        return (
                          <div key={cat.id} className="p-2 bg-white border border-slate-200 rounded-lg flex items-center justify-between gap-1">
                            <span className="text-[11px] font-semibold text-slate-700 truncate" title={cat.name}>{cat.name}</span>
                            <div className="flex items-center space-x-1 shrink-0">
                              <span className="text-[10px] text-slate-400">-R$</span>
                              <input
                                type="number"
                                step="50"
                                placeholder="0"
                                value={currentRed > 0 ? currentRed / 100 : ''}
                                onChange={(e) => {
                                  const val = Math.max(0, Math.round(parseFloat(e.target.value || '0') * 100));
                                  setWhatIfSimulation((prev) => ({
                                    ...prev,
                                    active: true,
                                    categoryReductions: { ...prev.categoryReductions, [cat.id]: val },
                                  }));
                                }}
                                className="w-16 border border-slate-200 rounded px-1 py-0.5 text-xs text-right font-bold text-indigo-700 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Barra de Impacto Líquido e Ações */}
                  <div className="p-3 bg-white border border-slate-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-3 text-xs">
                      <div>
                        <span className="text-slate-500">Receitas Retiradas:</span>{' '}
                        <strong className="text-rose-600 font-bold">-{formatMoney(whatIfSummary.incomeCutsTotalCents)}/mês</strong>
                      </div>
                      <div className="h-4 w-px bg-slate-200 hidden sm:block" />
                      <div>
                        <span className="text-slate-500">Despesas Cortadas:</span>{' '}
                        <strong className="text-emerald-600 font-bold">-{formatMoney(whatIfSummary.expenseCutsTotalCents)}/mês</strong>
                      </div>
                      <div className="h-4 w-px bg-slate-200 hidden sm:block" />
                      <div>
                        <span className="text-slate-500">Efeito Líquido:</span>{' '}
                        <strong className={`font-bold ${whatIfSummary.netMonthlyImpactCents >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                          {whatIfSummary.netMonthlyImpactCents >= 0 ? '+' : ''}{formatMoney(whatIfSummary.netMonthlyImpactCents)}/mês
                        </strong>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 self-end sm:self-auto">
                      <button
                        type="button"
                        onClick={() => {
                          setWhatIfSimulation({
                            active: false,
                            startMonth: currentActualMonth,
                            ignoredIncomes: [],
                            ignoredExpenses: [],
                            categoryReductions: {},
                          });
                        }}
                        className="text-xs font-semibold px-3 py-1.5 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 transition"
                      >
                        Restaurar Padrão
                      </button>

                      <button
                        type="button"
                        onClick={handleSaveWhatIfAsScenario}
                        className="text-xs font-bold px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm transition flex items-center space-x-1.5 active:scale-95"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Salvar como Cenário</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Aviso quando simulação What-If estiver ativa */}
            {whatIfSimulation.active && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-900 flex items-center justify-between shadow-2xs">
                <div className="flex items-center space-x-2">
                  <span className="text-base">⚡</span>
                  <span>
                    <strong>Simulação What-If Ativa:</strong> Os valores da tabela abaixo refletem os cortes selecionados a partir de {formatMonthLabel(whatIfSimulation.startMonth || currentActualMonth)}. Seus lançamentos reais e histórico passado continuam 100% protegidos.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setWhatIfSimulation((prev) => ({ ...prev, active: false }))}
                  className="text-amber-900 font-bold hover:underline shrink-0 ml-3"
                >
                  Desativar
                </button>
              </div>
            )}

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
                    let runningBalance = 0;
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

                    for (let idx = 0; idx < projectionHorizon; idx++) {
                      const targetDate = new Date(startYear, startMonth + idx, 1);
                      const monthKey = `${targetDate.getFullYear()}-${String(targetDate.getMonth() + 1).padStart(2, '0')}`;
                      const label = targetDate.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' });

                      // Verifica se a simulação What-If se aplica a este mês
                      const isWhatIfActiveForMonth =
                        whatIfSimulation.active &&
                        (!whatIfSimulation.startMonth || monthKey >= whatIfSimulation.startMonth);

                      // Cenários ativos para este mês (respeita data de início do cenário e duração)
                      const activeScenariosThisMonth = scenarios
                        .filter((s) => {
                          if (!s.active) return false;
                          if (currentMemberId === 'user-all') return true;
                          return s.scope === 'FAMILY' || s.ownerId === currentMemberId;
                        })
                        .filter((s) => {
                          const sStartMonth = s.startDate ? s.startDate.slice(0, 7) : currentYearMonth;
                          const [tY, tM] = monthKey.split('-').map(Number);
                          const [sY, sM] = sStartMonth.split('-').map(Number);
                          const monthDiff = (tY - sY) * 12 + (tM - sM);
                          return monthDiff >= 0 && monthDiff < (s.months || 12);
                        });

                      let scenInc = 0;
                      let scenExp = 0;
                      activeScenariosThisMonth.forEach((s) => {
                        if (s.monthlyImpactCents > 0) scenInc += s.monthlyImpactCents;
                        else scenExp += Math.abs(s.monthlyImpactCents);
                      });

                      // Identificadores de supressão e cortes para este mês (What-If + Cenários)
                      const ignoredIncomesSet = new Set();
                      const ignoredExpensesSet = new Set();
                      const categoryReductionsMap = {};

                      if (isWhatIfActiveForMonth) {
                        (whatIfSimulation.ignoredIncomes || []).forEach((k) => ignoredIncomesSet.add(k));
                        (whatIfSimulation.ignoredExpenses || []).forEach((k) => ignoredExpensesSet.add(k));
                        Object.entries(whatIfSimulation.categoryReductions || {}).forEach(([cid, cents]) => {
                          if (cents > 0) categoryReductionsMap[cid] = (categoryReductionsMap[cid] || 0) + cents;
                        });
                      }

                      activeScenariosThisMonth.forEach((s) => {
                        if (s.adjustments) {
                          (s.adjustments.ignoredIncomes || []).forEach((item) => {
                            const k = typeof item === 'string' ? item : item.key || item.id || item.description;
                            if (k) ignoredIncomesSet.add(k);
                          });
                          (s.adjustments.ignoredExpenses || []).forEach((item) => {
                            const k = typeof item === 'string' ? item : item.key || item.id || item.description;
                            if (k) ignoredExpensesSet.add(k);
                          });
                          (s.adjustments.categoryReductions || []).forEach((red) => {
                            if (red.categoryId && red.amountCents > 0) {
                              categoryReductionsMap[red.categoryId] = (categoryReductionsMap[red.categoryId] || 0) + red.amountCents;
                            }
                          });
                        }
                      });

                      const isIgnoredIncomeTx = (tx) => {
                        if (ignoredIncomesSet.size === 0) return false;
                        if (tx.id && ignoredIncomesSet.has(tx.id)) return true;
                        if (tx.recurrenceRuleId && (ignoredIncomesSet.has(tx.recurrenceRuleId) || ignoredIncomesSet.has(`rec:${tx.recurrenceRuleId}`))) return true;
                        if (tx.description) {
                          const dLower = tx.description.trim().toLowerCase();
                          if (ignoredIncomesSet.has(tx.description) || ignoredIncomesSet.has(`desc:${dLower}`)) return true;
                        }
                        return false;
                      };

                      const isIgnoredExpenseTx = (tx) => {
                        if (ignoredExpensesSet.size === 0) return false;
                        if (tx.id && ignoredExpensesSet.has(tx.id)) return true;
                        if (tx.installmentGroupId && (ignoredExpensesSet.has(tx.installmentGroupId) || ignoredExpensesSet.has(`group:${tx.installmentGroupId}`))) return true;
                        if (tx.recurrenceRuleId && (ignoredExpensesSet.has(tx.recurrenceRuleId) || ignoredExpensesSet.has(`rec:${tx.recurrenceRuleId}`))) return true;
                        if (tx.description) {
                          const cleanDesc = tx.description.replace(/\s*\(\d+\/\d+\)/, '').trim().toLowerCase();
                          if (ignoredExpensesSet.has(tx.description) || ignoredExpensesSet.has(`desc:${cleanDesc}`)) return true;
                        }
                        return false;
                      };

                      let totalIncome = 0;
                      let totalExpense = 0;

                      if (idx === 0) {
                        // Mês atual:
                        let month0IncomeDeduction = 0;
                        let month0ExpenseDeduction = 0;
                        if (isWhatIfActiveForMonth || activeScenariosThisMonth.length > 0) {
                          month0IncomeDeduction = visibleTransactions
                            .filter((t) => t.type === 'INCOME' && t.status !== 'CANCELADO' && !t.installmentGroupId && t.date && t.date.startsWith(currentYearMonth) && isIgnoredIncomeTx(t))
                            .reduce((acc, t) => acc + t.amountCents, 0);

                          month0ExpenseDeduction = visibleTransactions
                            .filter((t) => t.type === 'EXPENSE' && t.status !== 'CANCELADO' && t.date && t.date.startsWith(currentYearMonth) && isIgnoredExpenseTx(t))
                            .reduce((acc, t) => acc + t.amountCents, 0);

                          Object.values(categoryReductionsMap).forEach((cents) => {
                            month0ExpenseDeduction += cents;
                          });
                        }

                        totalIncome = Math.max(0, monthSummary.incomeTotal - month0IncomeDeduction) + scenInc;
                        totalExpense = Math.max(0, monthSummary.expenseTotal + monthSummary.envelopesCommitted - month0ExpenseDeduction) + scenExp;
                        runningBalance = monthSummary.freeProjectedBalance - month0IncomeDeduction + month0ExpenseDeduction + scenInc - scenExp;
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
                              t.date.startsWith(monthKey) &&
                              !isIgnoredExpenseTx(t)
                          )
                          .reduce((a, t) => a + t.amountCents, 0);

                        const monthInstallmentIncome = visibleTransactions
                          .filter(
                            (t) =>
                              t.status !== 'CANCELADO' &&
                              t.type === 'INCOME' &&
                              t.installmentGroupId &&
                              t.date &&
                              t.date.startsWith(monthKey) &&
                              !isIgnoredIncomeTx(t)
                          )
                          .reduce((a, t) => a + t.amountCents, 0);

                        // 2. Lançamentos pontuais já agendados para este mês futuro agrupados por categoria
                        const scheduledExpensesByCat = {};
                        visibleTransactions
                          .filter(
                            (t) =>
                              t.status !== 'CANCELADO' &&
                              t.type === 'EXPENSE' &&
                              !t.installmentGroupId &&
                              t.date &&
                              t.date.startsWith(monthKey) &&
                              !isIgnoredExpenseTx(t)
                          )
                          .forEach((t) => {
                            const cid = t.categoryId || '__none__';
                            scheduledExpensesByCat[cid] = (scheduledExpensesByCat[cid] || 0) + t.amountCents;
                          });

                        const scheduledIncome = visibleTransactions
                          .filter(
                            (t) =>
                              t.status !== 'CANCELADO' &&
                              t.type === 'INCOME' &&
                              !t.installmentGroupId &&
                              t.date &&
                              t.date.startsWith(monthKey) &&
                              !isIgnoredIncomeTx(t)
                          )
                          .reduce((a, t) => a + t.amountCents, 0);

                        // 3. Orçamento planejado base categoria a categoria:
                        let finalBaseExpense = 0;

                        const rootCategories = categories.filter((c) => !c.parentId && !c.archived && c.type === 'EXPENSE');
                        const childCategories = categories.filter((c) => c.parentId && !c.archived && c.type === 'EXPENSE');
                        const processedChildIds = new Set();

                        rootCategories.forEach((parent) => {
                          const children = childCategories.filter((ch) => ch.parentId === parent.id);
                          const parentEnv = monthlyEnvelopes.find(
                            (m) => m.categoryId === parent.id && m.monthKey === monthKey
                          );
                          const rawParentCap = parentEnv ? parentEnv.amountCents : (parent.budgetLimitCents || 0);
                          const parentRed = categoryReductionsMap[parent.id] || 0;
                          const parentCap = Math.max(0, rawParentCap - parentRed);
                          const schedParent = scheduledExpensesByCat[parent.id] || 0;

                          if (children.length > 0) {
                            children.forEach((ch) => processedChildIds.add(ch.id));

                            if (parentCap > 0) {
                              // Categoria Pai com teto próprio representa o limite macro do grupo familiar
                              const schedGroup = schedParent + children.reduce((acc, ch) => acc + (scheduledExpensesByCat[ch.id] || 0), 0);
                              finalBaseExpense += Math.max(parentCap, schedGroup);
                            } else {
                              // Categoria Pai sem teto próprio soma os tetos/agendamentos individuais de cada subcategoria
                              children.forEach((ch) => {
                                const chEnv = monthlyEnvelopes.find(
                                  (m) => m.categoryId === ch.id && m.monthKey === monthKey
                                );
                                const rawChCap = chEnv ? chEnv.amountCents : (ch.budgetLimitCents || 0);
                                const chRed = categoryReductionsMap[ch.id] || 0;
                                const chCap = Math.max(0, rawChCap - chRed);
                                const chSched = scheduledExpensesByCat[ch.id] || 0;
                                finalBaseExpense += Math.max(chCap, chSched);
                              });
                              finalBaseExpense += schedParent;
                            }
                          } else {
                            // Categoria independente (sem subcategorias)
                            finalBaseExpense += Math.max(parentCap, schedParent);
                          }
                        });

                        // Processa eventuais subcategorias órfãs
                        childCategories.forEach((ch) => {
                          if (!processedChildIds.has(ch.id)) {
                            const chEnv = monthlyEnvelopes.find(
                              (m) => m.categoryId === ch.id && m.monthKey === monthKey
                            );
                            const rawChCap = chEnv ? chEnv.amountCents : (ch.budgetLimitCents || 0);
                            const chRed = categoryReductionsMap[ch.id] || 0;
                            const chCap = Math.max(0, rawChCap - chRed);
                            const chSched = scheduledExpensesByCat[ch.id] || 0;
                            finalBaseExpense += Math.max(chCap, chSched);
                          }
                        });

                        // Lançamentos sem categoria definida
                        const uncatSched = scheduledExpensesByCat['__none__'] || 0;
                        finalBaseExpense += uncatSched;

                        // Despesas e receitas habituais base deduzindo eventuais receitas suprimidas
                        const activeBaseIncomesCents = visibleTransactions
                          .filter(
                            (t) =>
                              t.type === 'INCOME' &&
                              t.status !== 'CANCELADO' &&
                              !t.installmentGroupId &&
                              t.date &&
                              t.date.startsWith(currentYearMonth) &&
                              !isIgnoredIncomeTx(t)
                          )
                          .reduce((acc, t) => acc + t.amountCents, 0);

                        const finalBaseIncome = Math.max(activeBaseIncomesCents, scheduledIncome);

                        totalIncome = finalBaseIncome + monthInstallmentIncome + scenInc;
                        totalExpense = finalBaseExpense + monthInstallmentExpense + scenExp;

                        const netMonth = totalIncome - totalExpense;
                        runningBalance += netMonth;
                      }

                      const netMonth = totalIncome - totalExpense;
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

  );
}
