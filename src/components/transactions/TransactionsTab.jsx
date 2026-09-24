import React from 'react';
import {
  Search,
  X,
  Calendar,
  Filter,
  CreditCard,
  Trash2,
  Plus,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  AlertTriangle,
  Clock,
  RefreshCw,
  Edit2,
  Sparkles,
  Check,
  Receipt,
  FileText,
  Info,
} from 'lucide-react';
import { formatMoney, formatDateBR, getTxDueDate, isTxOverdue } from '../../utils/formatters';

export default function TransactionsTab({
  searchTerm,
  setSearchTerm,
  filterDatePreset,
  setFilterDatePreset,
  handleDatePresetChange,
  filterStartDate,
  setFilterStartDate,
  filterEndDate,
  setFilterEndDate,
  showFilterDrawer,
  setShowFilterDrawer,
  activeFiltersCount,
  cardInvoiceMasters = [],
  filteredTransactions = [],
  expandedInvoices = {},
  setExpandedInvoices,
  transactions = [],
  handleClearOnlyDemo,
  openTransactionModal,
  filterType,
  setFilterType,
  filterStatus,
  setFilterStatus,
  overdueTransactions = [],
  filterSource,
  setFilterSource,
  filterCategory,
  setFilterCategory,
  filterScope,
  setFilterScope,
  categories = [],
  accounts = [],
  accountBalances = {},
  cards = [],
  isAnyFilterActive,
  handleResetFilters,
  filteredTotals = { incomeCents: 0, expenseCents: 0, netCents: 0, count: 0 },
  allDisplayTransactions = [],
  handleSortTransactions,
  txSort = { field: 'date', direction: 'closest' },
  getMatchingInvoiceItems,
  openInvoicePaymentModal,
  handleOpenDeleteInvoiceModal,
  handleDeleteTransaction,
  toggleStatusPaid,
  handleConvertScenarioToReal,
  scenarios = [],
  handleQuickPayTransaction,
}) {
  // Identifica se há uma conta bancária ou cartão específico filtrado
  const selectedAccount = React.useMemo(() => {
    if (!filterSource || filterSource === 'ALL' || filterSource === 'ACCOUNTS_ONLY' || filterSource === 'CARDS_ONLY') {
      return null;
    }
    const cleanId = filterSource.startsWith('acc-') ? filterSource.replace('acc-', '') : filterSource;
    return accounts.find((a) => a.id === cleanId) || null;
  }, [filterSource, accounts]);

  const selectedCard = React.useMemo(() => {
    if (!filterSource || !filterSource.startsWith('card-')) return null;
    const cleanId = filterSource.replace('card-', '');
    return cards.find((c) => c.id === cleanId) || null;
  }, [filterSource, cards]);

  // Saldo Progressivo Linha a Linha:
  // Saldo acumulado que resultou após cada movimentação cronológica
  // (saldo inicial + entradas - saídas = saldo resultante na linha)
  const progressiveBalanceMap = React.useMemo(() => {
    if (!selectedAccount) return {};

    // 1. Coleta todos os lançamentos que afetam esta conta bancária (não cancelados)
    const accountTxs = (allDisplayTransactions || []).filter(
      (t) => t.accountId === selectedAccount.id && t.status !== 'CANCELADO'
    );

    // 2. Ordenação estritamente cronológica (do mais antigo para o mais recente)
    const sortedChronological = [...accountTxs].sort((a, b) => {
      const dateA = a.date || a.dueDate || '';
      const dateB = b.date || b.dueDate || '';
      if (dateA !== dateB) return dateA.localeCompare(dateB);
      const timeA = a._localUpdatedAt || a.createdAt || 0;
      const timeB = b._localUpdatedAt || b.createdAt || 0;
      if (timeA !== timeB) return timeA - timeB;
      return String(a.id).localeCompare(String(b.id));
    });

    // 3. Acumula linha a linha a partir do saldo inicial da conta
    let running = selectedAccount.initialBalanceCents || 0;
    const map = {};

    sortedChronological.forEach((tx) => {
      const delta = tx.type === 'INCOME' ? tx.amountCents : -tx.amountCents;
      running += delta;
      map[tx.id] = running;
    });

    return map;
  }, [selectedAccount, allDisplayTransactions]);

  return (
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
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 rounded-md hover:bg-slate-100 transition cursor-pointer"
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
              className={`flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-medium border transition active:scale-95 shadow-2xs cursor-pointer ${
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
                className="text-xs text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 px-3 py-2 rounded-xl font-medium flex items-center space-x-1.5 transition active:scale-95 shadow-2xs cursor-pointer"
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
                className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 px-2.5 py-2 rounded-xl text-xs font-medium flex items-center space-x-1 transition cursor-pointer"
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
              className="bg-blue-600 hover:bg-blue-700 text-white px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold flex items-center space-x-1.5 shadow-sm transition active:scale-95 cursor-pointer"
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
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition cursor-pointer ${
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
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition cursor-pointer ${
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
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition cursor-pointer ${
              filterType === 'INCOME'
                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 font-semibold'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
            }`}
          >
            💰 Receitas
          </button>

          <button
            type="button"
            onClick={() => {
              if (filterStatus === 'OVERDUE') {
                setFilterStatus('ALL');
              } else {
                setFilterStatus('OVERDUE');
                setFilterDatePreset('ALL');
                setFilterStartDate('');
                setFilterEndDate('');
              }
            }}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium flex items-center space-x-1 transition cursor-pointer ${
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
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition cursor-pointer ${
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
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition cursor-pointer ${
              filterSource === 'ACCOUNTS_ONLY'
                ? 'bg-blue-100 text-blue-800 border border-blue-300 font-semibold'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
            }`}
          >
            🏦 Contas
          </button>

          {/* Filtro Rápido por Categoria no Toolbar */}
          <div className="relative inline-flex items-center">
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition cursor-pointer max-w-[190px] truncate ${
                filterCategory !== 'ALL'
                  ? 'bg-amber-100 text-amber-900 border-amber-300 font-semibold shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-600 border-transparent'
              }`}
              title="Filtrar por Categoria"
            >
              <option value="ALL">🏷️ Categoria: Todas</option>
              {categories
                .filter((c) => !c.parentId && !c.archived)
                .map((parent) => {
                  const children = categories.filter((c) => c.parentId === parent.id && !c.archived);
                  if (children.length === 0) {
                    return (
                      <option key={parent.id} value={parent.id}>
                        {parent.name}
                      </option>
                    );
                  }
                  return (
                    <optgroup key={parent.id} label={`📁 ${parent.name}`}>
                      <option value={parent.id}>{parent.name} (Todos)</option>
                      {children.map((child) => (
                        <option key={child.id} value={child.id}>
                          &nbsp;&nbsp;↳ {child.name}
                        </option>
                      ))}
                    </optgroup>
                  );
                })}
            </select>
          </div>

          {/* Badges de filtros ativos com remoção rápida (X) */}
          {selectedAccount && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-blue-100 text-blue-900 border border-blue-300 animate-in fade-in shadow-2xs">
              <Receipt className="w-3.5 h-3.5 text-blue-700" />
              <span>Filtrado por: <strong>{selectedAccount.name}</strong></span>
              <button
                type="button"
                onClick={() => setFilterSource('ALL')}
                className="hover:text-rose-700 p-0.5 rounded transition cursor-pointer ml-1"
                title="Limpar Filtro da Conta"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </span>
          )}

          {selectedCard && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-purple-100 text-purple-900 border border-purple-300 animate-in fade-in shadow-2xs">
              <CreditCard className="w-3.5 h-3.5 text-purple-700" />
              <span>Filtrado por: <strong>{selectedCard.name}</strong></span>
              <button
                type="button"
                onClick={() => setFilterSource('ALL')}
                className="hover:text-rose-700 p-0.5 rounded transition cursor-pointer ml-1"
                title="Limpar Filtro do Cartão"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </span>
          )}

          {filterCategory !== 'ALL' && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-amber-100 text-amber-900 border border-amber-300 animate-in fade-in">
              <span>🏷️ {categories.find((c) => c.id === filterCategory)?.name || 'Categoria'}</span>
              <button
                type="button"
                onClick={() => setFilterCategory('ALL')}
                className="hover:text-rose-700 p-0.5 rounded transition cursor-pointer"
                title="Remover filtro de categoria"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {isAnyFilterActive && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="ml-auto text-xs text-rose-600 hover:text-rose-800 font-semibold flex items-center space-x-1 transition py-1 cursor-pointer"
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
                    className="text-xs text-rose-600 hover:underline font-medium cursor-pointer"
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
                    {categories
                      .filter((c) => !c.parentId && !c.archived)
                      .map((parent) => {
                        const children = categories.filter((c) => c.parentId === parent.id && !c.archived);
                        if (children.length === 0) {
                          return (
                            <option key={parent.id} value={parent.id}>
                              {parent.name}
                            </option>
                          );
                        }
                        return (
                          <optgroup key={parent.id} label={`📁 ${parent.name}`}>
                            <option value={parent.id}>{parent.name} (Todos)</option>
                            {children.map((child) => (
                              <option key={child.id} value={child.id}>
                                &nbsp;&nbsp;↳ {child.name}
                              </option>
                            ))}
                          </optgroup>
                        );
                      })}
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

      {/* Banner Executivo de Extrato Dedicado da Conta Bancária */}
      {selectedAccount && (
        <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white rounded-2xl p-5 shadow-sm border border-blue-800 animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-3.5">
              <div className="w-11 h-11 rounded-xl bg-white/10 flex items-center justify-center text-white border border-white/20 shrink-0">
                <Receipt className="w-6 h-6 text-blue-300" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-blue-300">
                    Extrato Dedicado da Conta
                  </span>
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: selectedAccount.color || '#3b82f6' }}
                  />
                </div>
                <h3 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                  {selectedAccount.name}
                  <span className="text-xs font-normal text-blue-200">
                    ({selectedAccount.bank} • Titular: <strong>{selectedAccount.holder}</strong>)
                  </span>
                </h3>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4 sm:gap-6 justify-between sm:justify-end">
              <div className="text-left sm:text-right">
                <span className="text-[10px] uppercase tracking-wider text-blue-300 font-semibold block">
                  Saldo Inicial Cadastrado
                </span>
                <span className="text-sm font-semibold text-blue-100">
                  {formatMoney(selectedAccount.initialBalanceCents || 0)}
                </span>
              </div>

              <div className="text-left sm:text-right">
                <span className="text-[10px] uppercase tracking-wider text-blue-300 font-semibold block">
                  Saldo Atual em Conta
                </span>
                <span className="text-2xl font-bold text-white">
                  {formatMoney(accountBalances[selectedAccount.id] ?? selectedAccount.initialBalanceCents ?? 0)}
                </span>
              </div>

              <button
                type="button"
                onClick={() => setFilterSource('ALL')}
                className="bg-white/10 hover:bg-white/20 text-white text-xs font-semibold px-3 py-2 rounded-xl flex items-center space-x-1.5 transition active:scale-95 border border-white/20 cursor-pointer shadow-2xs"
                title="Limpar Filtro e ver todas as contas"
              >
                <X className="w-4 h-4" />
                <span>Limpar Filtro</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tabela de Lançamentos */}
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

                {/* 6.1 Saldo Resultante (Exclusivo do Extrato da Conta) */}
                {selectedAccount && (
                  <th className="py-3 px-4 text-right whitespace-nowrap bg-blue-50/70 text-blue-900 border-l border-blue-100 text-xs font-bold">
                    <div className="flex items-center justify-end space-x-1">
                      <span>Saldo Resultante</span>
                      <Info className="w-3.5 h-3.5 text-blue-500" title="Saldo acumulado da conta após este lançamento cronológico" />
                    </div>
                  </th>
                )}

                {/* 7. Ações */}
                <th className="py-3 px-4 text-center text-xs">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={selectedAccount ? 8 : 7} className="text-center py-12 text-slate-400 space-y-2">
                    <p className="text-sm">Nenhum lançamento encontrado para os filtros selecionados.</p>
                    {isAnyFilterActive && (
                      <button
                        type="button"
                        onClick={handleResetFilters}
                        className="text-xs text-blue-600 hover:underline font-semibold cursor-pointer"
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
                    const isExpanded = Boolean(expandedInvoices[tx.id]) || (filterCategory !== 'ALL') || Boolean(searchTerm.trim()) || (filterStatus === 'OVERDUE');
                    const isCategoryOrSearchActive = filterCategory !== 'ALL' || Boolean(searchTerm && searchTerm.trim());

                    const itemsToDisplay = getMatchingInvoiceItems ? getMatchingInvoiceItems(tx) : tx.items || [];
                    const matchingAmountCents = itemsToDisplay.reduce((acc, it) => acc + (it.amountCents || 0), 0);

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
                                className="flex items-center space-x-1.5 text-left hover:text-purple-700 transition group focus:outline-none cursor-pointer"
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
                                className="text-[10px] bg-purple-100 hover:bg-purple-200 text-purple-800 font-semibold px-2 py-0.5 rounded-full transition cursor-pointer"
                                title="Clique para expandir/recolher"
                              >
                                {isCategoryOrSearchActive
                                  ? `${itemsToDisplay.length} de ${tx.items.length} ${tx.items.length === 1 ? 'item' : 'itens'}`
                                  : `${tx.items.length} ${tx.items.length === 1 ? 'item' : 'itens'}`}{' '}
                                {isExpanded ? '▲' : '▼'}
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
                              <CreditCard className="w-3.5 h-3.5 text-purple-600" />
                              <span>Fatura Consolidada</span>
                            </span>
                          </td>

                          {/* 4. Conta / Cartão */}
                          <td className="py-3 px-4 text-slate-600 whitespace-nowrap">
                            <span className="text-purple-700 font-bold block text-xs sm:text-sm">
                              💳 {tx.card?.name}
                            </span>
                            {tx.isPaid ? (
                              <div className="flex items-center space-x-1 mt-0.5">
                                <span className="text-[11px] text-emerald-700 font-medium">
                                  {tx.paymentTx ? (
                                    <>
                                      Pago via <strong>{accounts.find((a) => a.id === tx.paymentTx.accountId)?.name || 'Conta bancária'}</strong>
                                      {tx.paymentTx.date && ` (${formatDateBR(tx.paymentTx.date)})`}
                                    </>
                                  ) : (
                                    'Fatura Quitada'
                                  )}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => openInvoicePaymentModal(tx.card, tx.monthKey, 'edit')}
                                  className="text-slate-400 hover:text-blue-600 p-0.5 rounded transition cursor-pointer"
                                  title="Editar pagamento desta fatura"
                                >
                                  <Edit2 className="w-3 h-3 inline" />
                                </button>
                              </div>
                            ) : (
                              <span className="text-[11px] text-slate-400 block mt-0.5">
                                Aguardando pagamento
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
                          <td className="py-3 px-4 text-right whitespace-nowrap">
                            {isCategoryOrSearchActive ? (
                              <div>
                                <div className="font-bold text-purple-900 text-sm sm:text-base">
                                  - {formatMoney(matchingAmountCents)}
                                </div>
                                <div className="text-[10px] text-slate-500 font-normal">
                                  de {formatMoney(tx.amountCents)} total da fatura
                                </div>
                              </div>
                            ) : (
                              <div className="font-bold text-purple-900 text-sm sm:text-base">
                                - {formatMoney(tx.amountCents)}
                              </div>
                            )}
                          </td>

                          {/* 6.1 Saldo Resultante (se extrato por conta) */}
                          {selectedAccount && (
                            <td className="py-3 px-4 text-right whitespace-nowrap bg-blue-50/20 border-l border-blue-100">
                              {progressiveBalanceMap[tx.id] !== undefined ? (
                                <span
                                  className={`font-bold text-xs sm:text-sm ${
                                    progressiveBalanceMap[tx.id] >= 0 ? 'text-slate-900' : 'text-rose-600'
                                  }`}
                                >
                                  {formatMoney(progressiveBalanceMap[tx.id])}
                                </span>
                              ) : (
                                <span className="text-slate-400 text-xs">-</span>
                              )}
                            </td>
                          )}

                          {/* 7. Ações */}
                          <td className="py-3 px-4 text-center">
                            <div className="flex items-center justify-center space-x-1.5">
                              {tx.isPaid ? (
                                <button
                                  type="button"
                                  onClick={() => openInvoicePaymentModal(tx.card, tx.monthKey, 'edit')}
                                  className="px-2 py-1 text-xs font-semibold rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 flex items-center space-x-1 transition active:scale-95 shadow-2xs cursor-pointer"
                                  title="Editar pagamento da fatura (trocar conta bancária, data ou valor)"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                  <span>Editar Pgto</span>
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => openInvoicePaymentModal(tx.card, tx.monthKey, 'create')}
                                  className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 flex items-center space-x-1 transition active:scale-95 shadow-2xs cursor-pointer"
                                  title="Pagar e quitar esta fatura debitando de uma conta bancária"
                                >
                                  <CreditCard className="w-3.5 h-3.5" />
                                  <span>Pagar</span>
                                </button>
                              )}

                              <button
                                type="button"
                                onClick={() => handleOpenDeleteInvoiceModal(tx.card, tx.monthKey)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition cursor-pointer"
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
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setFilterCategory(itemCat.id);
                                      }}
                                      title={`Filtrar lançamentos por "${itemCat.name}"`}
                                      className="inline-flex items-center space-x-1.5 px-2 py-0.5 rounded-md hover:bg-purple-100 transition-colors text-left group cursor-pointer"
                                    >
                                      <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: itemCat.color }} />
                                      <span className="group-hover:underline group-hover:text-purple-700 font-medium">{itemCat.name}</span>
                                    </button>
                                  ) : (
                                    <span className="text-slate-400 italic text-[11px]">Sem Categoria</span>
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

                                {/* 6.1 Saldo Resultante (se extrato por conta) */}
                                {selectedAccount && (
                                  <td className="py-2.5 px-4 text-right text-slate-400 text-xs italic bg-blue-50/15 border-l border-blue-50">
                                    -
                                  </td>
                                )}

                                {/* 7. Ações */}
                                <td className="py-2.5 px-4 text-center">
                                  <div className="flex items-center justify-center space-x-1">
                                    <button
                                      type="button"
                                      onClick={() => openTransactionModal('edit', item)}
                                      className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition cursor-pointer"
                                      title="Editar esta compra"
                                    >
                                      <Edit2 className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteTransaction(item)}
                                      className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition cursor-pointer"
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
                  const isOverdue = isTxOverdue(tx, cards);
                  const effectiveDue = getTxDueDate(tx, cards);

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
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setFilterCategory(cat.id);
                            }}
                            title={`Filtrar lançamentos por "${cat.name}"`}
                            className="inline-flex items-center space-x-1.5 px-2 py-0.5 rounded-md hover:bg-slate-100 transition-colors text-left group cursor-pointer"
                          >
                            <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                            <span className="group-hover:underline group-hover:text-blue-600 font-medium">{cat.name}</span>
                          </button>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">Sem Categoria</span>
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
                            className={`text-[11px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider flex items-center space-x-1 transition cursor-pointer ${
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

                      {/* 6.1 Saldo Resultante (se extrato por conta) */}
                      {selectedAccount && (
                        <td className="py-3 px-4 text-right whitespace-nowrap bg-blue-50/20 border-l border-blue-100">
                          {progressiveBalanceMap[tx.id] !== undefined ? (
                            <span
                              className={`font-bold text-xs sm:text-sm ${
                                progressiveBalanceMap[tx.id] >= 0 ? 'text-slate-900' : 'text-rose-600'
                              }`}
                            >
                              {formatMoney(progressiveBalanceMap[tx.id])}
                            </span>
                          ) : (
                            <span className="text-slate-400 text-xs">-</span>
                          )}
                        </td>
                      )}

                      {/* 7. Ações */}
                      <td className="py-3 px-4 text-center">
                        {tx.isHypothetical ? (
                          <button
                            type="button"
                            onClick={() => handleConvertScenarioToReal(tx.scenarioData || scenarios.find((s) => s.id === tx.scenarioId))}
                            className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 flex items-center space-x-1 transition active:scale-95 mx-auto shadow-2xs cursor-pointer"
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
                                    const monthKey = (getTxDueDate(tx, cards) || tx.date).slice(0, 7);
                                    openInvoicePaymentModal(c, monthKey);
                                  }}
                                  className="px-2 py-1 text-xs font-semibold rounded-lg bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200 flex items-center space-x-1 transition active:scale-95 shadow-2xs cursor-pointer"
                                  title="Pagar Fatura deste Cartão"
                                >
                                  <CreditCard className="w-3.5 h-3.5 text-purple-600" />
                                  <span>Pagar Fatura</span>
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleQuickPayTransaction(tx, 'REALIZADO')}
                                  className={`px-2 py-1 text-xs font-semibold rounded-lg flex items-center space-x-1 transition active:scale-95 shadow-2xs cursor-pointer ${
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
                              className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-md transition cursor-pointer"
                              title="Editar"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteTransaction(tx)}
                              className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-md transition cursor-pointer"
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
  );
}
