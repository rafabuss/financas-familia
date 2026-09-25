import React from 'react';
import {
  Calendar,
  Sparkles,
  Plus,
  Trash2,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  Eye,
  EyeOff,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  CreditCard,
  CheckCircle2,
  PieChart,
  ArrowRight,
  Mail,
  Clock,
  PiggyBank,
} from 'lucide-react';
import { formatMoney, formatDateBR, formatMonthLabel, getTxDueDate, isTxOverdue } from '../../utils/formatters';
import { useFinance } from '../../contexts/FinanceContext';

export default function DashboardTab({
  currentMemberId,
  setCurrentMemberId,
  accounts = [],
  transactions = [],
  isDemoModeState,
  handleLoadDemoData,
  handleClearOnlyDemo,
  setModalState,
  dashboardMonth,
  setDashboardMonth,
  changeDashboardMonth,
  currentActualMonth,
  overdueTransactions = [],
  overdueExpensesTotalCents = 0,
  handleNavigateToOverdueTransactions,
  togglePrivacyMode,
  isPrivacyMode,
  monthSummary,
  activeScenariosMonthlyNet = 0,
  setActiveTab,
  dashboardCategoryMode,
  setDashboardCategoryMode,
  dashboardCategoryChartData,
  handleDrillDownToTransactions,
  dashboardEnvelopes,
  setEnvelopeSelectedMonth,
  upcomingCommitments = [],
  cards = [],
  cardStats = {},
  setInvoiceSelectedMonth,
  openInvoicePaymentModal,
  visibleSavingsGoals: propVisibleSavingsGoals,
  savingsGoalBalances: propSavingsGoalBalances,
}) {
  const finance = useFinance ? useFinance() : {};
  const visibleSavingsGoals = propVisibleSavingsGoals || finance.visibleSavingsGoals || [];
  const savingsGoalBalances = propSavingsGoalBalances || finance.savingsGoalBalances || {};
  return (
    <div className="space-y-6">
      {/* Aviso de Visão Ativa */}
      {currentMemberId !== 'user-all' && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-center justify-between">
          <span>
            Você está visualizando a <strong>Visão Pessoal</strong>. Estão inclusos os lançamentos compartilhados da família e os seus exclusivos.
          </span>
          <button
            onClick={() => setCurrentMemberId('user-all')}
            className="font-bold underline text-amber-900 ml-2 cursor-pointer"
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
              className="px-4 py-2 bg-white hover:bg-slate-50 text-blue-700 border border-blue-300 rounded-xl text-xs font-semibold whitespace-nowrap shadow-sm transition active:scale-95 flex items-center space-x-1.5 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>Carregar Exemplos (Demo)</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setModalState({ isOpen: true, type: 'account', mode: 'create', data: null });
              }}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold whitespace-nowrap shadow-sm transition active:scale-95 flex items-center space-x-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Cadastrar 1ª Conta</span>
            </button>
          </div>
        </div>
      )}

      {/* Banner para Dados de Exemplo Residuais no Modo Real */}
      {!isDemoModeState && transactions.some((t) => String(t.id || '').startsWith('demo-')) && (
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
            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold whitespace-nowrap shadow-sm transition active:scale-95 flex items-center justify-center space-x-1.5 self-start sm:self-auto cursor-pointer"
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
                  className="text-[10px] font-bold bg-blue-50 text-blue-600 hover:bg-blue-100 px-2.5 py-0.5 rounded-full transition cursor-pointer"
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
            className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 hover:text-slate-900 transition flex items-center space-x-1 text-xs font-semibold shadow-xs cursor-pointer"
            title="Mês Anterior"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Anterior</span>
          </button>
          <button
            type="button"
            onClick={() => changeDashboardMonth(1)}
            className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 hover:text-slate-900 transition flex items-center space-x-1 text-xs font-semibold shadow-xs cursor-pointer"
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
            onClick={handleNavigateToOverdueTransactions}
            className="bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs px-4 py-2 rounded-xl transition whitespace-nowrap shadow-xs flex items-center space-x-1.5 self-end sm:self-auto cursor-pointer"
          >
            <span>Ver contas em atraso</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* 5 Cards de Métricas Principais */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {/* Card 1: Saldo Consolidado Projetado */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white p-5 rounded-2xl shadow-sm flex flex-col justify-between border border-slate-700">
          <div className="flex items-center justify-between text-slate-300 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-300">Saldo Consolidado</span>
            <div className="flex items-center space-x-1.5">
              <button
                type="button"
                onClick={togglePrivacyMode}
                className="p-1 text-slate-400 hover:text-amber-300 hover:bg-slate-700/60 rounded-lg transition cursor-pointer"
                title={isPrivacyMode ? 'Mostrar valores (Desativar Olho Mágico)' : 'Ocultar valores (Ativar Olho Mágico)'}
              >
                {isPrivacyMode ? <EyeOff className="w-4 h-4 text-amber-400" /> : <Eye className="w-4 h-4 text-slate-400" />}
              </button>
              <Sparkles className="w-5 h-5 text-amber-400" />
            </div>
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
              <span>Em conta (operacional):</span>
              <span className="font-semibold text-white">
                {formatMoney(monthSummary.totalOperationalBalance ?? monthSummary.totalBankBalance)}
              </span>
            </div>
            {monthSummary.totalSavingsBalance > 0 && (
              <div className="flex justify-between text-emerald-300">
                <span>🛡️ Cofrinhos (reserva):</span>
                <span className="font-semibold">+{formatMoney(monthSummary.totalSavingsBalance)}</span>
              </div>
            )}
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
                <span>- Envelopes (teto):</span>
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

        {/* Card 2: Saldo Operacional Livre */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Saldo Operacional Livre</span>
              <div className="flex items-center space-x-1.5">
                <button
                  type="button"
                  onClick={togglePrivacyMode}
                  className="p-1 text-slate-400 hover:text-amber-600 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                  title={isPrivacyMode ? 'Mostrar valores (Desativar Olho Mágico)' : 'Ocultar valores (Ativar Olho Mágico)'}
                >
                  {isPrivacyMode ? <EyeOff className="w-4 h-4 text-amber-500" /> : <Eye className="w-4 h-4 text-slate-400" />}
                </button>
                <Wallet className="w-5 h-5 text-blue-500" />
              </div>
            </div>
            <div className="text-2xl font-bold text-slate-900">
              {formatMoney(monthSummary.totalOperationalBalance ?? monthSummary.totalBankBalance)}
            </div>
            <div className="text-xs text-slate-400 mt-1">Disponível em contas para o dia a dia</div>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-100 text-[11px] text-slate-500 flex flex-col space-y-0.5">
            <div className="flex justify-between">
              <span>💳 Contas Correntes:</span>
              <strong className="text-slate-800">{formatMoney(monthSummary.totalOperationalBalance ?? monthSummary.totalBankBalance)}</strong>
            </div>
            {monthSummary.totalSavingsBalance > 0 && (
              <div className="flex justify-between text-emerald-700">
                <span>🛡️ Cofrinhos / Reserva:</span>
                <strong className="text-emerald-700 font-bold">{formatMoney(monthSummary.totalSavingsBalance)}</strong>
              </div>
            )}
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
          className="bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs sm:text-sm px-5 py-2.5 rounded-xl transition whitespace-nowrap self-start md:self-auto shadow cursor-pointer"
        >
          Explorar Projeção Completa &gt;
        </button>
      </div>

      {/* Seção Cofrinhos & Reserva de Emergência (Renda Fixa / CDI) */}
      {visibleSavingsGoals.length > 0 && (
        <div className="bg-gradient-to-r from-emerald-950 via-teal-900 to-slate-900 text-white rounded-2xl p-6 shadow-md border border-emerald-800/40">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center space-x-2 mb-1">
                <PiggyBank className="w-5 h-5 text-emerald-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-300">
                  Patrimônio Guardado & Reservas de Emergência
                </span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-semibold">
                  100% CDI Liquidez Diária
                </span>
              </div>
              <h2 className="text-xl font-bold flex items-center space-x-2">
                <span>Total Guardado: {formatMoney(monthSummary.totalSavingsBalance || 0)}</span>
              </h2>
              <p className="text-xs text-emerald-200/80 mt-1 max-w-xl">
                Recursos protegidos e rendendo diariamente, separados do saldo operacional das contas correntes.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setActiveTab('accounts')}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs sm:text-sm px-5 py-2.5 rounded-xl transition whitespace-nowrap self-start md:self-auto shadow cursor-pointer flex items-center space-x-1.5"
            >
              <span>Gerenciar Cofrinhos</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Mini preview dos cofrinhos */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-5 pt-4 border-t border-emerald-800/60">
            {visibleSavingsGoals.slice(0, 4).map((goal) => {
              const bal = savingsGoalBalances[goal.id] || 0;
              const pct = goal.targetCents > 0 ? Math.min(100, Math.round((bal / goal.targetCents) * 100)) : null;
              return (
                <div
                  key={goal.id}
                  onClick={() => setActiveTab('accounts')}
                  className="bg-white/10 hover:bg-white/15 p-3 rounded-xl border border-white/10 transition cursor-pointer flex flex-col justify-between"
                  title={`Ver detalhes de ${goal.name}`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-xs text-white truncate max-w-[140px]">{goal.name}</span>
                    <span className="text-[10px] text-emerald-300 font-bold bg-emerald-950/60 px-1.5 py-0.5 rounded">
                      {goal.yieldRate || '100% CDI'}
                    </span>
                  </div>
                  <div className="mt-2">
                    <div className="text-base font-bold text-white">{formatMoney(bal)}</div>
                    {pct !== null ? (
                      <div className="mt-1">
                        <div className="w-full bg-emerald-950/60 h-1.5 rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-400 rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                        <div className="text-[10px] text-emerald-300 mt-0.5 flex justify-between">
                          <span>{pct}% da meta</span>
                          <span>{formatMoney(goal.targetCents)}</span>
                        </div>
                      </div>
                    ) : (
                      <span className="text-[10px] text-emerald-200/60">Reserva livre</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

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
              <div className="flex items-center space-x-2">
                <div className="flex bg-slate-100 p-0.5 rounded-lg text-[10px] font-semibold">
                  <button
                    type="button"
                    onClick={() => setDashboardCategoryMode('parent')}
                    className={`px-2 py-0.5 rounded-md transition cursor-pointer ${dashboardCategoryMode === 'parent' ? 'bg-white text-blue-700 shadow-2xs font-bold' : 'text-slate-500 hover:text-slate-800'}`}
                    title="Agrupar por Categoria Pai (ex: Alimentação)"
                  >
                    Grupos
                  </button>
                  <button
                    type="button"
                    onClick={() => setDashboardCategoryMode('sub')}
                    className={`px-2 py-0.5 rounded-md transition cursor-pointer ${dashboardCategoryMode === 'sub' ? 'bg-white text-blue-700 shadow-2xs font-bold' : 'text-slate-500 hover:text-slate-800'}`}
                    title="Listar subcategorias individuais (ex: Supermercado, Restaurante)"
                  >
                    Subcategorias
                  </button>
                </div>
                <button onClick={() => setActiveTab('charts')} className="text-xs font-semibold text-blue-600 hover:underline cursor-pointer">
                  Ver Análise
                </button>
              </div>
            </div>

            {(!dashboardCategoryChartData || (dashboardCategoryMode === 'parent' ? dashboardCategoryChartData.parentGroups : dashboardCategoryChartData.expensesList).length === 0) ? (
              <p className="text-xs text-slate-400 py-6 text-center">Nenhuma despesa para exibir no mês de {formatMonthLabel(dashboardMonth)}.</p>
            ) : (
              <div className="space-y-3">
                {(dashboardCategoryMode === 'parent' ? dashboardCategoryChartData.parentGroups : dashboardCategoryChartData.expensesList).slice(0, 4).map((item) => (
                  <div
                    key={item.catId}
                    onClick={() => handleDrillDownToTransactions(item.catId, dashboardMonth)}
                    className="group p-2 -mx-1.5 rounded-xl hover:bg-slate-50 transition cursor-pointer space-y-1.5 border border-transparent hover:border-slate-200"
                    title={`Clique para ver os lançamentos de "${item.name}" em ${formatMonthLabel(dashboardMonth)}`}
                  >
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-slate-800 group-hover:text-blue-600 flex items-center space-x-1.5 transition-colors">
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                        <span>{item.name}</span>
                        <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 text-blue-500 transition-opacity" />
                      </span>
                      <span className="text-slate-900">{formatMoney(item.amountCents)} ({item.percentage}%)</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-300" style={{ width: `${item.percentage}%`, backgroundColor: item.color }} />
                    </div>
                    {dashboardCategoryMode === 'parent' && item.subcategories && item.subcategories.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-0.5">
                        {item.subcategories.map((sub) => (
                          <button
                            key={sub.catId}
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDrillDownToTransactions(sub.catId, dashboardMonth);
                            }}
                            className="text-[10px] bg-slate-100 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 text-slate-600 px-2 py-0.5 rounded-md transition flex items-center gap-1 border border-slate-200/60 cursor-pointer"
                            title={`Filtrar apenas lançamentos de "${sub.name}" em ${formatMonthLabel(dashboardMonth)}`}
                          >
                            <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: sub.color }} />
                            <span>{sub.name}:</span>
                            <span className="font-bold text-slate-800">{formatMoney(sub.amountCents)}</span>
                          </button>
                        ))}
                      </div>
                    )}
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
              <button
                onClick={() => {
                  setEnvelopeSelectedMonth(dashboardMonth);
                  setActiveTab('envelopes');
                }}
                className="text-xs font-semibold text-blue-600 hover:underline cursor-pointer"
              >
                Ver Todos {dashboardEnvelopes?.envelopes?.length > 0 ? `(${dashboardEnvelopes.envelopes.length})` : ''}
              </button>
            </div>

            {!dashboardEnvelopes?.hasEnvelopes ? (
              <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-xl text-center space-y-2">
                <p className="text-xs text-slate-600">
                  Você ainda não ativou o método dos envelopes. Destine um teto mensal (ex: R$ 800 para Combustível) para controlar os gastos do dia a dia com tranquilidade.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setEnvelopeSelectedMonth(dashboardMonth);
                    setActiveTab('envelopes');
                  }}
                  className="inline-flex items-center space-x-1.5 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-3 py-1.5 rounded-lg transition cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Definir Teto nos Envelopes</span>
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

                {/* Lista resumida de até 6 envelopes */}
                <div className="space-y-3 pt-1">
                  {dashboardEnvelopes.envelopes.slice(0, 6).map((env) => {
                    const cat = env.category;
                    const barColor = env.isOver ? '#ef4444' : env.percentage >= 80 ? '#f59e0b' : '#10b981';
                    return (
                      <div
                        key={cat.id}
                        onClick={() => handleDrillDownToTransactions(cat.id, dashboardMonth)}
                        className="group p-1.5 -mx-1.5 rounded-lg hover:bg-slate-50 transition cursor-pointer space-y-1"
                        title={`Clique para ver os lançamentos de "${cat.name}" em ${formatMonthLabel(dashboardMonth)}`}
                      >
                        <div className="flex justify-between items-center text-xs font-semibold">
                          <span className="text-slate-800 group-hover:text-blue-600 flex items-center space-x-1.5 transition-colors">
                            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                            <span>{cat.name}</span>
                            <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 text-blue-500 transition-opacity" />
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

                {dashboardEnvelopes.envelopes.length > 6 && (
                  <div className="text-center pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setEnvelopeSelectedMonth(dashboardMonth);
                        setActiveTab('envelopes');
                      }}
                      className="text-[11px] font-bold text-blue-600 hover:text-blue-800 hover:underline inline-flex items-center space-x-1 cursor-pointer"
                    >
                      <span>
                        + {dashboardEnvelopes.envelopes.length - 6}{' '}
                        {dashboardEnvelopes.envelopes.length - 6 === 1 ? 'outro envelope' : 'outros envelopes'}{' '}
                        em Envelopes & Categorias
                      </span>
                      <ArrowRight className="w-3 h-3" />
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
            <button onClick={() => setActiveTab('transactions')} className="text-xs font-semibold text-blue-600 hover:underline cursor-pointer">
              Ver todos
            </button>
          </div>
          <div className="divide-y divide-slate-100">
            {upcomingCommitments.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">Nenhum vencimento pendente para os próximos dias.</p>
            ) : (
              upcomingCommitments.map((tx) => {
                const isOver = isTxOverdue(tx, cards);
                const effectiveDue = getTxDueDate(tx, cards);
                return (
                  <div
                    key={tx.id}
                    className={`py-3 flex items-center justify-between transition-colors ${
                      isOver ? 'bg-rose-50/70 -mx-3 px-3 rounded-xl border border-rose-200/60 my-1' : ''
                    }`}
                  >
                    <div>
                      <div className="flex items-center space-x-2">
                        <p className="font-semibold text-sm text-slate-900">{tx.description}</p>
                        {tx.isMasked ? (
                          <span
                            className="text-[9px] px-1.5 py-0.2 rounded font-bold uppercase bg-purple-100 text-purple-800 border border-purple-200"
                            title={`Lançamento pessoal de ${tx.maskedOwnerName || 'outro membro'} — protegido por privacidade`}
                          >
                            🔒 Privado
                          </span>
                        ) : (
                          <span
                            className={`text-[9px] px-1.5 py-0.2 rounded font-bold uppercase ${
                              tx.scope === 'PERSONAL' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {tx.scope === 'PERSONAL' ? 'Pessoal' : 'Familiar'}
                          </span>
                        )}
                        {tx.type === 'TRANSFER' && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded font-bold uppercase bg-sky-100 text-sky-800 border border-sky-200">
                            Transferência
                          </span>
                        )}
                        {isOver && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded font-bold uppercase bg-rose-100 text-rose-700 border border-rose-200 flex items-center space-x-1">
                            <AlertTriangle className="w-2.5 h-2.5 text-rose-600" />
                            <span>Em Atraso</span>
                          </span>
                        )}
                      </div>
                      <div className="flex items-center space-x-2 text-xs text-slate-400 mt-0.5">
                        <span className={isOver ? 'text-rose-600 font-semibold' : ''}>{formatDateBR(effectiveDue)}</span>
                        {tx.purchaseDate && tx.cardId && tx.purchaseDate !== effectiveDue && (
                          <span className="text-[10px] text-slate-400 font-normal">(Compra: {formatDateBR(tx.purchaseDate)})</span>
                        )}
                        <span>•</span>
                        <span
                          className={`font-semibold ${
                            tx.status === 'REALIZADO'
                              ? 'text-emerald-600'
                              : isOver
                              ? 'text-rose-600'
                              : 'text-blue-600'
                          }`}
                        >
                          ● {isOver ? 'EM ATRASO' : tx.status}
                        </span>
                      </div>
                    </div>
                    <div
                      className={`font-bold text-sm ${
                        tx.type === 'TRANSFER'
                          ? 'text-sky-700'
                          : tx.type === 'INCOME'
                          ? 'text-emerald-600'
                          : isOver
                          ? 'text-rose-600'
                          : 'text-slate-900'
                      }`}
                    >
                      {tx.type === 'TRANSFER' ? '⇄ ' : tx.type === 'INCOME' ? '+ ' : '- '}
                      {formatMoney(tx.amountCents)}
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
              className="text-xs font-semibold text-purple-600 hover:underline flex items-center space-x-1 cursor-pointer"
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
              const pct = Math.min(100, Math.round((stats.committedCents / (card.limitCents || 1)) * 100));
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
                          className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-purple-600 hover:bg-purple-700 text-white flex items-center space-x-1.5 shadow-xs transition active:scale-95 cursor-pointer"
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
                        className="px-2.5 py-1.5 text-xs font-medium rounded-lg text-slate-600 hover:text-purple-600 hover:bg-purple-50 transition cursor-pointer"
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
  );
}
