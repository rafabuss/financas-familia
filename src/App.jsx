import React from 'react';
import {
  Wallet,
  CreditCard,
  Tags,
  Calendar,
  Sliders,
  Mail,
} from 'lucide-react';
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
import { formatDateBR } from './utils/formatters';
import { FinanceProvider, useFinance } from './contexts/FinanceContext';

export default function App() {
  return (
    <FinanceProvider>
      <AppContent />
    </FinanceProvider>
  );
}

function AppContent() {
  const finance = useFinance();
  const {
    currentUser,
    handleLoginSuccess,
    isPrivacyMode,
    isDemoModeState,
    isCloudConnected,
    togglePrivacyMode,
    handleResetDemoSandbox,
    handleExitDemo,
    handleLogout,
    isAIChatOpen,
    setIsAIChatOpen,
    currentMemberId,
    setCurrentMemberId,
    openTransactionModal,
    activeTab,
    setActiveTab,
    accounts,
    transactions,
    handleLoadDemoData,
    handleClearOnlyDemo,
    setModalState,
    dashboardMonth,
    setDashboardMonth,
    changeDashboardMonth,
    currentActualMonth,
    overdueTransactions,
    overdueExpensesTotalCents,
    handleNavigateToOverdueTransactions,
    monthSummary,
    activeScenariosMonthlyNet,
    dashboardCategoryMode,
    setDashboardCategoryMode,
    dashboardCategoryChartData,
    handleDrillDownToTransactions,
    dashboardEnvelopes,
    setEnvelopeSelectedMonth,
    upcomingCommitments,
    cards,
    cardStats,
    setInvoiceSelectedMonth,
    openInvoicePaymentModal,
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
    cardInvoiceMasters,
    filteredTransactions,
    expandedInvoices,
    setExpandedInvoices,
    filterType,
    setFilterType,
    filterStatus,
    setFilterStatus,
    filterSource,
    setFilterSource,
    filterCategory,
    setFilterCategory,
    filterScope,
    setFilterScope,
    categories,
    accountBalances,
    isAnyFilterActive,
    handleResetFilters,
    filteredTotals,
    allDisplayTransactions,
    handleSortTransactions,
    txSort,
    getMatchingInvoiceItems,
    handleOpenDeleteInvoiceModal,
    handleDeleteTransaction,
    toggleStatusPaid,
    handleConvertScenarioToReal,
    scenarios,
    handleQuickPayTransaction,
    chartFlowFilter,
    setChartFlowFilter,
    chartIncludeScenarios,
    setChartIncludeScenarios,
    chartPeriodFilter,
    setChartPeriodFilter,
    chartSpecificMonth,
    setChartSpecificMonth,
    availableInvoiceMonths,
    categoryChartData,
    chartCategoryViewMode,
    setChartCategoryViewMode,
    activeChartMonth,
    getChartDateRange,
    visibleAccounts,
    visibleCards,
    toggleArchiveAccount,
    handleDeleteAccount,
    toggleArchiveCard,
    handleDeleteCard,
    handleNavigateToAccountStatement,
    handleNavigateToCardStatement,
    faturasCardsData,
    invoiceSelectedMonth,
    changeInvoiceSelectedMonth,
    handleRevertInvoicePayment,
    envelopeSelectedMonth,
    changeEnvelopeSelectedMonth,
    getEnvelopesForMonth,
    setEnvelopeModalState,
    setDeleteEnvelopeModalState,
    toggleArchiveCategory,
    handleDeleteCategory,
    projectionHorizon,
    setProjectionHorizon,
    whatIfSimulation,
    setWhatIfSimulation,
    whatIfSummary,
    showWhatIfDrawer,
    setShowWhatIfDrawer,
    availableWhatIfStreams,
    handleSaveWhatIfAsScenario,
    visibleTransactions,
    monthlyEnvelopes,
    projectionSort,
    setProjectionSort,
    setScenarios,
    setModalSourceType,
    handleDeleteScenario,
    importSelectedCard,
    setImportSelectedCard,
    importPreviewData,
    setImportPreviewData,
    importMetadata,
    setImportMetadata,
    isImportLoading,
    handleFileUpload,
    importSummary,
    importFilterTab,
    setImportFilterTab,
    importDefaultStatus,
    setImportDefaultStatus,
    handleSelectAllImport,
    handleDeselectDuplicates,
    handleUpdateImportItem,
    handleConfirmImport,
    exportData,
    handleResetEntireSystem,
    modalState,
    handleSaveScenario,
    handleSaveAccount,
    handleSaveCard,
    handleSaveCategory,
    modalSourceType,
    editScope,
    setEditScope,
    formAmount,
    setFormAmount,
    installmentValueMode,
    setInstallmentValueMode,
    formInstallments,
    setFormInstallments,
    formStartInstallment,
    setFormStartInstallment,
    formIsRecurring,
    setFormIsRecurring,
    formRecurringMonths,
    setFormRecurringMonths,
    isSubmittingTx,
    handleSaveTransaction,
    deleteModalState,
    setDeleteModalState,
    handleConfirmDeleteTransaction,
    deleteInvoiceModalState,
    setDeleteInvoiceModalState,
    handleConfirmDeleteInvoice,
    invoicePaymentModal,
    setInvoicePaymentModal,
    handleConfirmInvoicePayment,
    cardPaymentPromptModal,
    setCardPaymentPromptModal,
    envelopeModalState,
    handleSaveEnvelopeSchedule,
    deleteEnvelopeModalState,
    handleConfirmDeleteEnvelope,
    categoryConflictModal,
    setCategoryConflictModal,
    handleResolveCategoryConflict,
    isAuthModalOpen,
    setIsAuthModalOpen,
    handleAICreateTransaction,
    handleAICreateScenario,
  } = finance;
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
            accountBalances={accountBalances}
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
            onNavigateToAccountStatement={handleNavigateToAccountStatement}
            onNavigateToCardStatement={handleNavigateToCardStatement}
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
            handleDrillDownToTransactions={handleDrillDownToTransactions}
          />
        )}

        {/* ===================== ABA: CATEGORIAS ===================== */}
        {activeTab === 'categories' && (
          <CategoriesTab
            categories={categories}
            setModalState={setModalState}
            toggleArchiveCategory={toggleArchiveCategory}
            handleDeleteCategory={handleDeleteCategory}
            handleDrillDownToTransactions={handleDrillDownToTransactions}
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
            currentMemberId={currentMemberId}
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
        currentMemberId={currentMemberId}
        modalSourceType={modalSourceType}
        setModalSourceType={setModalSourceType}
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
        handleQuickPayTransaction={handleQuickPayTransaction}
        accounts={accounts}
        cards={cards}
        categories={categories}
        currentUser={currentUser}
        currentMemberId={currentMemberId}
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
        isDemo={Boolean(isDemoModeState)}
        onCreateTransaction={handleAICreateTransaction}
        onCreateScenario={handleAICreateScenario}
        onNavigateTab={(tab) => setActiveTab(tab)}
      />
    </div>
  );
}

