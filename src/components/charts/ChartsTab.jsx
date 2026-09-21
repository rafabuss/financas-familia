import React from 'react';
import {
  Calendar,
  ArrowDownRight,
  ArrowUpRight,
  ArrowRight,
} from 'lucide-react';
import { FAMILY_MEMBERS } from '../../data/constants';
import { formatMoney, formatMonthLabel } from '../../utils/formatters';

export default function ChartsTab({
  currentMemberId = 'user-all',
  chartFlowFilter = 'ALL',
  setChartFlowFilter,
  chartIncludeScenarios = true,
  setChartIncludeScenarios,
  chartPeriodFilter = 'DASHBOARD_MONTH',
  setChartPeriodFilter,
  dashboardMonth,
  chartSpecificMonth,
  setChartSpecificMonth,
  availableInvoiceMonths = [],
  categoryChartData = {
    totalExpensesCents: 0,
    totalIncomeCents: 0,
    hierarchicalExpenses: [],
    expensesList: [],
    incomesList: [],
  },
  chartCategoryViewMode = 'hierarchical',
  setChartCategoryViewMode,
  handleDrillDownToTransactions,
  activeChartMonth,
  getChartDateRange,
}) {
  return (
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
                    <div className="flex bg-slate-100 p-0.5 rounded-lg text-xs font-semibold">
                      <button
                        type="button"
                        onClick={() => setChartCategoryViewMode('hierarchical')}
                        className={`px-2.5 py-1 rounded-md transition ${chartCategoryViewMode === 'hierarchical' ? 'bg-white text-blue-700 shadow-2xs font-bold' : 'text-slate-500 hover:text-slate-800'}`}
                        title="Agrupar categorias pai e subcategorias"
                      >
                        📁 Grupos & Sub
                      </button>
                      <button
                        type="button"
                        onClick={() => setChartCategoryViewMode('flat')}
                        className={`px-2.5 py-1 rounded-md transition ${chartCategoryViewMode === 'flat' ? 'bg-white text-blue-700 shadow-2xs font-bold' : 'text-slate-500 hover:text-slate-800'}`}
                        title="Lista de todas as categorias sem agrupamento"
                      >
                        🏷️ Lista Plana
                      </button>
                    </div>
                  </div>

                  {(chartCategoryViewMode === 'hierarchical' ? categoryChartData.hierarchicalExpenses : categoryChartData.expensesList).length === 0 ? (
                    <p className="text-xs text-slate-400 py-8 text-center">Nenhuma despesa para exibir nesta visão.</p>
                  ) : chartCategoryViewMode === 'hierarchical' ? (
                    <div className="space-y-3 pt-2">
                      {categoryChartData.hierarchicalExpenses.map((group) => {
                        const hasEnvelope = Boolean(group.hasExplicitEnvelope && group.envelopeCap > 0);
                        return (
                          <div
                            key={group.catId}
                            className="p-3 rounded-xl border border-slate-200/70 bg-white hover:border-slate-300 transition-all space-y-2.5 shadow-2xs"
                          >
                            {/* Cabeçalho da Categoria Pai */}
                            <div
                              onClick={() => handleDrillDownToTransactions(group.catId, activeChartMonth || getChartDateRange())}
                              className="group/parent cursor-pointer flex justify-between items-start text-xs gap-2"
                              title={`Clique para filtrar todos os lançamentos de "${group.name}" e suas subcategorias`}
                            >
                              <div className="flex items-center space-x-2">
                                <span className="w-3.5 h-3.5 rounded-full shrink-0 shadow-xs" style={{ backgroundColor: group.color }} />
                                <div>
                                  <div className="font-bold text-slate-900 group-hover/parent:text-blue-600 transition-colors flex items-center gap-1.5 text-sm">
                                    <span>{group.name}</span>
                                    <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover/parent:opacity-100 text-blue-500 transition-opacity" />
                                    {group.hasSubcategories && (
                                      <span className="text-[10px] font-normal bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded-full">
                                        {group.subcategories.length} sub
                                      </span>
                                    )}
                                  </div>
                                  {hasEnvelope ? (
                                    <span className="text-[11px] text-slate-400 block font-normal">
                                      ✉️ Teto do grupo: {formatMoney(group.envelopeCap)}
                                    </span>
                                  ) : group.plannedSubcategoriesCap > 0 ? (
                                    <span className="text-[11px] text-slate-400 block font-normal">
                                      ✉️ Subcategorias planejadas: {formatMoney(group.plannedSubcategoriesCap)} (sem teto global no grupo)
                                    </span>
                                  ) : null}
                                </div>
                              </div>

                              <div className="text-right">
                                <div className="text-slate-700">
                                  <strong className="text-slate-900 font-bold text-sm">{formatMoney(group.totalAmountCents)}</strong>
                                  <span className="text-slate-400 text-[11px] ml-1">({group.percentageOfTotal}% do total)</span>
                                </div>
                                {hasEnvelope && (
                                  <div className="mt-0.5">
                                    {group.isOverBudget ? (
                                      <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                                        ⚠️ +{formatMoney(group.totalAmountCents - group.envelopeCap)} ({group.envelopePercentage}%)
                                      </span>
                                    ) : group.totalAmountCents === 0 ? (
                                      <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[10px] font-medium bg-blue-50 text-blue-700 border border-blue-200">
                                        Envelope intacto (100% livre)
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[10px] font-medium bg-slate-100 text-slate-700">
                                        {group.envelopePercentage}% consumido
                                      </span>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Barra de Progresso Principal do Grupo */}
                            {hasEnvelope ? (
                              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all duration-300 ${
                                    group.isOverBudget
                                      ? 'bg-rose-500'
                                      : (group.envelopePercentage || 0) >= 80
                                      ? 'bg-amber-500'
                                      : 'bg-blue-600'
                                  }`}
                                  style={{ width: `${Math.min(100, group.envelopePercentage || 0)}%` }}
                                />
                              </div>
                            ) : (
                              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                                <div
                                  className="h-full rounded-full transition-all duration-300"
                                  style={{ width: `${group.percentageOfTotal}%`, backgroundColor: group.color }}
                                />
                              </div>
                            )}

                            {/* Subcategorias Detalhadas */}
                            {group.hasSubcategories && (
                              <div className="pt-2 mt-1 border-t border-slate-100 space-y-1.5 pl-3 border-l-2 border-slate-200/80">
                                {group.subcategories.map((sub) => {
                                  const hasSubEnv = sub.envelopeCap > 0;
                                  return (
                                    <div
                                      key={sub.catId + (sub.isDirect ? '-direct' : '')}
                                      onClick={() => handleDrillDownToTransactions(sub.catId, activeChartMonth || getChartDateRange())}
                                      className="group/sub p-1.5 rounded-lg hover:bg-slate-50 transition cursor-pointer space-y-1"
                                      title={`Clique para filtrar lançamentos específicos de "${sub.name}"`}
                                    >
                                      <div className="flex justify-between items-center text-xs">
                                        <div className="flex items-center space-x-1.5">
                                          <span className="text-slate-300 font-mono text-[11px]">↳</span>
                                          <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: sub.color }} />
                                          <span className="font-semibold text-slate-700 group-hover/sub:text-blue-600 transition-colors flex items-center gap-1">
                                            <span>{sub.name}</span>
                                            <ArrowRight className="w-2.5 h-2.5 opacity-0 group-hover/sub:opacity-100 text-blue-500 transition-opacity" />
                                          </span>
                                          {hasSubEnv && (
                                            <span className="text-[10px] text-slate-400 font-normal">
                                              (Teto: {formatMoney(sub.envelopeCap)})
                                            </span>
                                          )}
                                        </div>

                                        <div className="text-right flex items-center space-x-2">
                                          <span className="font-bold text-slate-800">{formatMoney(sub.amountCents)}</span>
                                          <span className="text-[10px] text-slate-400">
                                            {sub.percentageOfParent}% de {group.name}
                                          </span>
                                          {hasSubEnv && (
                                            sub.isOverBudget ? (
                                              <span className="text-[9px] font-bold px-1 py-0.2 rounded bg-rose-100 text-rose-700">
                                                +{formatMoney(sub.amountCents - sub.envelopeCap)}
                                              </span>
                                            ) : (
                                              <span className="text-[9px] font-medium px-1 py-0.2 rounded bg-slate-100 text-slate-600">
                                                {sub.envelopePercentage}%
                                              </span>
                                            )
                                          )}
                                        </div>
                                      </div>

                                      {/* Micro barra da subcategoria */}
                                      {hasSubEnv ? (
                                        <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                                          <div
                                            className={`h-full rounded-full transition-all duration-300 ${
                                              sub.isOverBudget ? 'bg-rose-500' : (sub.envelopePercentage || 0) >= 80 ? 'bg-amber-500' : 'bg-blue-500'
                                            }`}
                                            style={{ width: `${Math.min(100, sub.envelopePercentage || 0)}%` }}
                                          />
                                        </div>
                                      ) : (
                                        <div className="w-full bg-slate-100 h-1 rounded-full overflow-hidden">
                                          <div
                                            className="h-full rounded-full transition-all duration-300"
                                            style={{ width: `${sub.percentageOfParent}%`, backgroundColor: sub.color }}
                                          />
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="space-y-3 pt-2">
                      {categoryChartData.expensesList.map((item) => {
                        const hasEnvelope = item.envelopeCap > 0;
                        return (
                          <div
                            key={item.catId}
                            onClick={() => handleDrillDownToTransactions(item.catId, activeChartMonth || getChartDateRange())}
                            className="group p-2.5 rounded-xl border border-transparent hover:border-slate-200 hover:bg-slate-50 transition-all cursor-pointer space-y-2"
                            title={`Clique para filtrar lançamentos de "${item.name}" neste período`}
                          >
                            <div className="flex justify-between items-start text-xs gap-2">
                              <div className="flex items-center space-x-2">
                                <span className="w-3 h-3 rounded-full shrink-0 shadow-xs" style={{ backgroundColor: item.color }} />
                                <div>
                                  <span className="font-semibold text-slate-800 group-hover:text-blue-600 transition-colors flex items-center gap-1.5">
                                    <span>{item.name}</span>
                                    <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 text-blue-500 transition-opacity" />
                                  </span>
                                  {hasEnvelope && (
                                    <span className="text-[10px] text-slate-400 block font-normal">
                                      ✉️ Teto planejado: {formatMoney(item.envelopeCap)}
                                    </span>
                                  )}
                                </div>
                              </div>

                              <div className="text-right">
                                <div className="text-slate-700">
                                  <strong className="text-slate-900 font-bold">{formatMoney(item.amountCents)}</strong>
                                  <span className="text-slate-400 text-[11px] ml-1">({item.percentage}% do total)</span>
                                </div>
                                {hasEnvelope && (
                                  <div className="mt-0.5">
                                    {item.isOverBudget ? (
                                      <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                                        ⚠️ +{formatMoney(item.amountCents - item.envelopeCap)} ({item.envelopePercentage}%)
                                      </span>
                                    ) : item.amountCents === 0 ? (
                                      <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[10px] font-medium bg-blue-50 text-blue-700 border border-blue-200">
                                        Envelope intacto (100% livre)
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[10px] font-medium bg-slate-100 text-slate-700">
                                        {item.envelopePercentage}% consumido
                                      </span>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Barra de Progresso Inteligente */}
                            {hasEnvelope ? (
                              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all duration-300 ${
                                    item.isOverBudget
                                      ? 'bg-rose-500'
                                      : (item.envelopePercentage || 0) >= 80
                                      ? 'bg-amber-500'
                                      : 'bg-blue-600'
                                  }`}
                                  style={{ width: `${Math.min(100, item.envelopePercentage || 0)}%` }}
                                />
                              </div>
                            ) : (
                              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                                <div
                                  className="h-full rounded-full transition-all duration-300"
                                  style={{ width: `${item.percentage}%`, backgroundColor: item.color }}
                                />
                              </div>
                            )}
                          </div>
                        );
                      })}
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
                    <div className="space-y-3 pt-2">
                      {categoryChartData.incomesList.map((item) => (
                        <div
                          key={item.catId}
                          onClick={() => handleDrillDownToTransactions(item.catId, activeChartMonth || getChartDateRange())}
                          className="group p-2.5 rounded-xl border border-transparent hover:border-slate-200 hover:bg-slate-50 transition-all cursor-pointer space-y-1.5"
                          title={`Clique para filtrar lançamentos de "${item.name}" neste período`}
                        >
                          <div className="flex justify-between items-center text-xs">
                            <span className="font-semibold text-slate-800 group-hover:text-emerald-600 flex items-center space-x-2 transition-colors">
                              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                              <span>{item.name}</span>
                              <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 text-emerald-500 transition-opacity" />
                            </span>
                            <span className="text-slate-600">
                              <strong className="text-slate-900">{formatMoney(item.amountCents)}</strong> ({item.percentage}%)
                            </span>
                          </div>

                          <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
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

  );
}
