import React, { useState, useEffect } from 'react';
import {
  X,
  CheckCircle2,
  Info,
  RefreshCw,
  ArrowLeftRight,
  ArrowDownRight,
  ArrowUpRight,
  AlertCircle,
  ArrowRight,
} from 'lucide-react';
import { formatMoney } from '../../utils/formatters';

export default function TransactionModal({
  modalState,
  setModalState,
  modalSourceType,
  setModalSourceType,
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
  isSubmittingTx = false,
  handleSaveTransaction,
  handleQuickPayTransaction,
  accounts = [],
  cards = [],
  categories = [],
  currentUser,
  currentMemberId = 'user-all',
}) {
  if (!modalState.isOpen || modalState.type !== 'transaction') return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        <TransactionModalForm
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
      </div>
    </div>
  );
}

function TransactionModalForm({
  modalState,
  setModalState,
  modalSourceType,
  setModalSourceType,
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
  handleQuickPayTransaction,
  accounts = [],
  cards = [],
  categories = [],
  currentMemberId = 'user-all',
}) {
  const initialType = modalState.data?.type || 'EXPENSE';
  const [currentType, setCurrentType] = useState(initialType);

  // Contas de Origem e Destino para Transferência
  const [originAccountId, setOriginAccountId] = useState(() => {
    return modalState.data?.accountId || accounts[0]?.id || '';
  });

  const [destinationAccountId, setDestinationAccountId] = useState(() => {
    if (modalState.data?.destinationAccountId) return modalState.data.destinationAccountId;
    const initialOrigin = modalState.data?.accountId || accounts[0]?.id || '';
    const otherAcc = accounts.find((a) => a.id !== initialOrigin);
    return otherAcc?.id || '';
  });

  // Atualiza tipo e contas caso mude modalState.data
  useEffect(() => {
    if (modalState.data?.type) {
      setCurrentType(modalState.data.type);
    }
    if (modalState.data?.accountId) {
      setOriginAccountId(modalState.data.accountId);
    }
    if (modalState.data?.destinationAccountId) {
      setDestinationAccountId(modalState.data.destinationAccountId);
    }
  }, [modalState.data]);

  const isActualRecurrence = Boolean(
    modalState.data?.recurrenceRuleId &&
    !String(modalState.data.recurrenceRuleId).startsWith('PURCHASE_DATE:') &&
    !String(modalState.data.recurrenceRuleId).startsWith('INVOICE_PAY:') &&
    !String(modalState.data.recurrenceRuleId).startsWith('TRANSFER_DEST:')
  );

  const remainingInstallmentsCount = formInstallments - formStartInstallment + 1;
  const isTransfer = currentType === 'TRANSFER';
  const isSameAccountTransfer = isTransfer && originAccountId === destinationAccountId;

  const handleTypeSelect = (type) => {
    setCurrentType(type);
    if (type === 'TRANSFER') {
      setModalSourceType('ACCOUNT');
      setFormIsRecurring(false);
      setFormInstallments(1);
      // Se a conta de destino for igual à de origem, tenta ajustar automaticamente
      if (originAccountId === destinationAccountId) {
        const other = accounts.find((a) => a.id !== originAccountId);
        if (other) setDestinationAccountId(other.id);
      }
    }
  };

  const transferCategory = categories.find((c) => c.id === 'cat-transferencia' || c.type === 'TRANSFER');
  const transferCatId = transferCategory?.id || 'cat-transferencia';

  return (
    <>
      {/* Header do Modal */}
      <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
        <div>
          <h3 className="font-bold text-base text-slate-900">
            {modalState.mode === 'edit' ? 'Editar' : 'Cadastrar'}{' '}
            {isTransfer ? 'Transferência entre Contas' : 'Lançamento'}
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            {isTransfer
              ? 'Movimente recursos entre contas (Pix ou TED) sem distorcer o DRE familiar'
              : 'Registre despesas ou receitas financeiras'}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setModalState({ isOpen: false, type: null, mode: 'create', data: null })}
          className="text-slate-400 hover:text-slate-700 p-1 rounded-md cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <form
        key={modalState.data?.id || modalState.mode || 'new'}
        onSubmit={handleSaveTransaction}
        className="p-6 space-y-4 overflow-y-auto"
      >
        {/* ==================================================================== */}
        {/* SELETOR DE TIPO (ABAS): DESPESA x RECEITA x TRANSFERÊNCIA            */}
        {/* ==================================================================== */}
        <div className="flex rounded-xl bg-slate-100 p-1 gap-1">
          <button
            type="button"
            onClick={() => handleTypeSelect('EXPENSE')}
            className={`flex-1 flex items-center justify-center space-x-1.5 py-2 px-3 rounded-lg text-xs sm:text-sm font-semibold transition cursor-pointer ${
              currentType === 'EXPENSE'
                ? 'bg-white text-rose-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ArrowDownRight className="w-4 h-4 text-rose-600" />
            <span>Despesa</span>
          </button>

          <button
            type="button"
            onClick={() => handleTypeSelect('INCOME')}
            className={`flex-1 flex items-center justify-center space-x-1.5 py-2 px-3 rounded-lg text-xs sm:text-sm font-semibold transition cursor-pointer ${
              currentType === 'INCOME'
                ? 'bg-white text-emerald-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ArrowUpRight className="w-4 h-4 text-emerald-600" />
            <span>Receita</span>
          </button>

          <button
            type="button"
            onClick={() => handleTypeSelect('TRANSFER')}
            className={`flex-1 flex items-center justify-center space-x-1.5 py-2 px-3 rounded-lg text-xs sm:text-sm font-semibold transition cursor-pointer ${
              currentType === 'TRANSFER'
                ? 'bg-white text-sky-700 shadow-xs ring-1 ring-sky-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ArrowLeftRight className="w-4 h-4 text-sky-600" />
            <span>Transferência</span>
          </button>
        </div>

        <input type="hidden" name="type" value={currentType} />

        {/* ==================================================================== */}
        {/* FLUXO ESPECÍFICO DE TRANSFERÊNCIA ENTRE CONTAS (PIX / TED)            */}
        {/* ==================================================================== */}
        {isTransfer ? (
          <div className="space-y-4">
            {/* Descrição Amigável */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Descrição Amigável (opcional)
              </label>
              <input
                type="text"
                name="description"
                defaultValue={modalState.data?.description || ''}
                placeholder="Ex: Pix para Nubank, Transferência p/ Poupança"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            {/* Valor e Data da Transferência */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Valor da Transferência (R$)
                </label>
                <input
                  type="number"
                  step="0.01"
                  name="amount"
                  required
                  value={formAmount}
                  onChange={(e) => setFormAmount(e.target.value)}
                  placeholder="0,00"
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Data da Transferência
                </label>
                <input
                  type="date"
                  name="date"
                  required
                  defaultValue={
                    modalState.data?.dueDate ||
                    modalState.data?.date ||
                    new Date().toISOString().slice(0, 10)
                  }
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Seletores: Conta de Origem ➔ Conta de Destino */}
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Conta de Origem (Sai o dinheiro)
                  </label>
                  <select
                    name="accountId"
                    required
                    value={originAccountId}
                    onChange={(e) => {
                      const newOrigin = e.target.value;
                      setOriginAccountId(newOrigin);
                      if (newOrigin === destinationAccountId) {
                        const other = accounts.find((a) => a.id !== newOrigin);
                        if (other) setDestinationAccountId(other.id);
                      }
                    }}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs font-semibold bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    {accounts.length === 0 ? (
                      <option value="">Nenhuma conta cadastrada</option>
                    ) : (
                      accounts.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.name} ({a.bank})
                        </option>
                      ))
                    )}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Conta de Destino (Entra o dinheiro)
                  </label>
                  <select
                    name="destinationAccountId"
                    required
                    value={destinationAccountId}
                    onChange={(e) => setDestinationAccountId(e.target.value)}
                    className={`w-full border rounded-lg px-3 py-2 text-xs font-semibold bg-white focus:ring-2 focus:outline-none ${
                      isSameAccountTransfer
                        ? 'border-rose-400 focus:ring-rose-500'
                        : 'border-slate-300 focus:ring-blue-500'
                    }`}
                  >
                    {accounts.length === 0 ? (
                      <option value="">Nenhuma conta cadastrada</option>
                    ) : (
                      accounts.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.name} ({a.bank}) {a.id === originAccountId ? '(Mesma conta)' : ''}
                        </option>
                      ))
                    )}
                  </select>
                </div>
              </div>

              {/* Alerta de Validação: Mesma Conta */}
              {isSameAccountTransfer ? (
                <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 font-semibold flex items-center space-x-1.5 animate-pulse">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>A conta de origem e a conta de destino devem ser contas bancárias diferentes.</span>
                </div>
              ) : (
                <div className="flex items-center justify-between p-2.5 bg-sky-50/80 border border-sky-200/80 rounded-lg text-xs text-sky-900">
                  <div className="flex items-center space-x-2 font-medium">
                    <span className="font-bold text-sky-950">
                      {accounts.find((a) => a.id === originAccountId)?.name || 'Origem'}
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                    <span className="font-bold text-emerald-800">
                      {accounts.find((a) => a.id === destinationAccountId)?.name || 'Destino'}
                    </span>
                  </div>
                  <span className="text-[11px] text-sky-700 font-semibold">
                    Movimentação interna (DRE protegido)
                  </span>
                </div>
              )}
            </div>

            {/* Situação & Responsável */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Situação
                </label>
                <select
                  name="status"
                  defaultValue={modalState.data?.status || 'REALIZADO'}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="REALIZADO">Realizado (Efetivado)</option>
                  <option value="PREVISTO">Previsto (Agendado)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Responsável
                </label>
                <select
                  name="ownerId"
                  defaultValue={
                    modalState.data?.ownerId ||
                    (currentMemberId === 'user-all' ? 'user-1' : currentMemberId)
                  }
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="user-1">Rafael</option>
                  <option value="user-2">Ana Débora</option>
                  <option value="user-all">Família (Geral)</option>
                </select>
              </div>
            </div>

            {/* Metadados Técnicos Ocultos */}
            <input type="hidden" name="categoryId" value={transferCatId} />
            <input type="hidden" name="sourceType" value="ACCOUNT" />
            <input type="hidden" name="scope" value="FAMILY" />
            <input type="hidden" name="visibility" value="FAMILY" />
          </div>
        ) : (
          /* ==================================================================== */
          /* FLUXO TRADICIONAL DE DESPESAS E RECEITAS                             */
          /* ==================================================================== */
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Descrição</label>
              <input
                type="text"
                name="description"
                required
                defaultValue={modalState.data?.description || ''}
                placeholder="Ex: Salário da Família, Supermercado, Combustível"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {modalState.mode === 'create' && formInstallments > 1
                    ? installmentValueMode === 'TOTAL'
                      ? 'Valor Total da Compra (R$)'
                      : 'Valor de Cada Parcela (R$)'
                    : 'Valor (R$)'}
                </label>
                <input
                  type="number"
                  step="0.01"
                  name="amount"
                  required
                  value={formAmount}
                  onChange={(e) => setFormAmount(e.target.value)}
                  placeholder="0,00"
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {modalSourceType === 'CARD' ? 'Vencimento da Fatura' : 'Data Vencimento/Recebimento'}
                </label>
                <input
                  type="date"
                  name="date"
                  required
                  defaultValue={
                    modalState.data?.dueDate ||
                    modalState.data?.date ||
                    new Date().toISOString().slice(0, 10)
                  }
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>

            {modalSourceType === 'CARD' && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Data da Compra no Cartão
                  </label>
                  <input
                    type="date"
                    name="purchaseDate"
                    defaultValue={
                      modalState.data?.purchaseDate ||
                      modalState.data?.date ||
                      new Date().toISOString().slice(0, 10)
                    }
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div className="flex items-center text-xs text-slate-500 pt-5">
                  <span>* O vencimento define o mês da fatura e se está em atraso.</span>
                </div>
              </div>
            )}

            {/* Seletor de Escopo & Visibilidade (Privacidade / Olho Amigo) */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Titular / Responsável</label>
                  <select
                    name="ownerId"
                    defaultValue={
                      modalState.data?.ownerId ||
                      (currentMemberId === 'user-all' ? 'user-1' : currentMemberId)
                    }
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
                  >
                    <option value="user-1">Rafael</option>
                    <option value="user-2">Ana Débora</option>
                    <option value="user-all">Família (Geral)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Visibilidade & Privacidade</label>
                  <select
                    name="visibility"
                    defaultValue={
                      modalState.data?.visibility ||
                      (modalState.data?.scope === 'PERSONAL' ? 'PERSONAL_PRIVATE' : 'FAMILY')
                    }
                    onChange={(e) => {
                      const scopeInput = document.getElementById('transaction-scope-hidden');
                      if (scopeInput) {
                        scopeInput.value = e.target.value === 'PERSONAL_PRIVATE' ? 'PERSONAL' : 'FAMILY';
                      }
                    }}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
                  >
                    <option value="FAMILY">👨‍👩‍👧‍👦 Compartilhado (Visível para todos)</option>
                    <option value="PERSONAL_PRIVATE">🔒 Pessoal com Impacto Familiar (Privado)</option>
                  </select>
                  <input
                    type="hidden"
                    id="transaction-scope-hidden"
                    name="scope"
                    defaultValue={modalState.data?.scope || 'FAMILY'}
                  />
                </div>
              </div>

              <p className="text-[11px] text-slate-500 leading-relaxed bg-white/70 p-2 rounded-lg border border-slate-200/60">
                💡 <strong>Impacto Familiar:</strong> Mesmo em lançamentos privados, o valor monetário abate o saldo e os envelopes da família com precisão. O cônjuge visualizará apenas um débito neutro (ex: <em>"Gasto Pessoal de Rafael"</em>), preservando a autonomia individual sem romper a transparência financeira.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Situação</label>
                <select
                  name="status"
                  defaultValue={modalState.data?.status || 'COMPROMETIDO'}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="REALIZADO">Realizado (Pago / Recebido)</option>
                  <option value="COMPROMETIDO">Comprometido (Assumido)</option>
                  <option value="PREVISTO">Previsto (Estimativa)</option>
                  <option value="HIPOTETICO">Hipotético (Simulado)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Forma / Origem</label>
                <select
                  name="sourceType"
                  value={modalSourceType}
                  onChange={(e) => setModalSourceType(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="ACCOUNT">Conta Bancária</option>
                  <option value="CARD">Cartão de Crédito</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Categoria</label>
                <select
                  name="categoryId"
                  defaultValue={modalState.data?.categoryId || categories[0]?.id}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  {categories
                    .filter((c) => !c.parentId && !c.archived && c.type !== 'TRANSFER')
                    .map((parent) => {
                      const children = categories.filter(
                        (c) => c.parentId === parent.id && !c.archived && c.type !== 'TRANSFER'
                      );
                      if (children.length === 0) {
                        return (
                          <option key={parent.id} value={parent.id}>
                            {parent.name}
                          </option>
                        );
                      }
                      return (
                        <optgroup key={parent.id} label={`📁 ${parent.name}`}>
                          <option value={parent.id}>{parent.name} (Geral / Principal)</option>
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

              <div>
                {modalSourceType === 'ACCOUNT' ? (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Conta Bancária</label>
                    <select
                      name="accountId"
                      defaultValue={modalState.data?.accountId || accounts[0]?.id || ''}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    >
                      {accounts.length === 0 ? (
                        <option value="">Nenhuma conta cadastrada</option>
                      ) : (
                        accounts.map((a) => (
                          <option key={a.id} value={a.id}>
                            {a.name} ({a.bank})
                          </option>
                        ))
                      )}
                    </select>
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Cartão de Crédito</label>
                    <select
                      name="cardId"
                      defaultValue={modalState.data?.cardId || cards[0]?.id || ''}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    >
                      {cards.length === 0 ? (
                        <option value="">Nenhum cartão cadastrado</option>
                      ) : (
                        cards.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name} ({c.bank})
                          </option>
                        ))
                      )}
                    </select>
                  </div>
                )}
              </div>
            </div>

            {/* Seletor de Escopo de Edição para parcelamentos e recorrências */}
            {modalState.mode === 'edit' && (modalState.data?.installmentGroupId || isActualRecurrence) && (
              <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl space-y-2">
                <label className="block text-xs font-bold text-amber-900">Aplicar alterações em:</label>
                <div className="space-y-1.5 text-xs text-slate-700">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      name="editScopeRadio"
                      checked={editScope === 'single'}
                      onChange={() => setEditScope('single')}
                      className="text-amber-600 focus:ring-amber-500"
                    />
                    <span>Apenas este lançamento</span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      name="editScopeRadio"
                      checked={editScope === 'future'}
                      onChange={() => setEditScope('future')}
                      className="text-amber-600 focus:ring-amber-500"
                    />
                    <span>
                      {modalState.data?.installmentGroupId
                        ? 'Deste lançamento em diante (parcelas futuras)'
                        : 'Deste lançamento em diante (repetições futuras)'}
                    </span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      name="editScopeRadio"
                      checked={editScope === 'all'}
                      onChange={() => setEditScope('all')}
                      className="text-amber-600 focus:ring-amber-500"
                    />
                    <span>
                      {modalState.data?.installmentGroupId
                        ? 'Todas as parcelas deste grupo (desde o início)'
                        : 'Todas as repetições desta recorrência'}
                    </span>
                  </label>
                </div>
              </div>
            )}

            {modalState.mode === 'create' && (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <label className="text-xs font-semibold text-slate-700">Parcelamento:</label>
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-1">
                      <span className="text-xs text-slate-500">Total de Parcelas:</span>
                      <input
                        type="number"
                        min="1"
                        max="72"
                        name="installments"
                        value={formInstallments}
                        onChange={(e) => {
                          const val = Math.max(1, parseInt(e.target.value, 10) || 1);
                          setFormInstallments(val);
                          if (formStartInstallment > val) setFormStartInstallment(val);
                        }}
                        className="w-14 border border-slate-300 rounded px-2 py-1 text-xs text-center font-bold"
                      />
                    </div>

                    {formInstallments > 1 && (
                      <div className="flex items-center space-x-1">
                        <span className="text-xs text-slate-500">Começar na:</span>
                        <input
                          type="number"
                          min="1"
                          max={formInstallments}
                          name="startInstallment"
                          value={formStartInstallment}
                          onChange={(e) => {
                            const val = Math.min(
                              formInstallments,
                              Math.max(1, parseInt(e.target.value, 10) || 1)
                            );
                            setFormStartInstallment(val);
                          }}
                          className="w-12 border border-blue-400 bg-blue-50 text-blue-900 rounded px-1.5 py-1 text-xs text-center font-bold"
                        />
                        <span className="text-xs text-slate-500">ª parcela</span>
                      </div>
                    )}
                  </div>
                </div>

                {formInstallments > 1 && formStartInstallment > 1 && (
                  <div className="p-2.5 bg-amber-50/90 border border-amber-200 rounded-lg text-xs text-amber-900 flex items-start space-x-2">
                    <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div className="leading-snug">
                      <strong className="block font-bold">
                        Parcelamento em andamento ({formStartInstallment}ª a {formInstallments}ª)
                      </strong>
                      <span className="text-[11px] text-amber-800">
                        Serão geradas apenas as <strong>{remainingInstallmentsCount} parcelas restantes</strong> (da {String(formStartInstallment).padStart(2, '0')}/{String(formInstallments).padStart(2, '0')} até {String(formInstallments).padStart(2, '0')}/{String(formInstallments).padStart(2, '0')}). As parcelas 1 a {formStartInstallment - 1} não serão criadas.
                      </span>
                    </div>
                  </div>
                )}

                {formInstallments > 1 && (
                  <div className="p-3 bg-blue-50/80 border border-blue-200 rounded-lg space-y-2.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-blue-950">
                        O valor digitado é:
                      </label>
                      <span className="text-[11px] font-semibold text-blue-700 bg-blue-100/70 px-2 py-0.5 rounded">
                        {formatMoney(Math.round((parseFloat(formAmount) || 0) * 100))}
                      </span>
                    </div>
                    <input type="hidden" name="installmentValueMode" value={installmentValueMode} />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      <label
                        className={`flex items-start space-x-2 p-2.5 rounded-lg border cursor-pointer transition ${
                          installmentValueMode === 'TOTAL'
                            ? 'bg-white border-blue-500 shadow-xs ring-1 ring-blue-500'
                            : 'bg-white/60 border-slate-200 hover:bg-white'
                        }`}
                      >
                        <input
                          type="radio"
                          name="installmentValueModeRadio"
                          checked={installmentValueMode === 'TOTAL'}
                          onChange={() => setInstallmentValueMode('TOTAL')}
                          className="mt-0.5 text-blue-600 focus:ring-blue-500"
                        />
                        <div>
                          <span className="font-bold text-slate-800 block">Total da Compra</span>
                          <span className="text-[11px] text-slate-500 block leading-tight mt-0.5">
                            Divide o valor em {formInstallments}x
                          </span>
                        </div>
                      </label>

                      <label
                        className={`flex items-start space-x-2 p-2.5 rounded-lg border cursor-pointer transition ${
                          installmentValueMode === 'INSTALLMENT'
                            ? 'bg-white border-blue-500 shadow-xs ring-1 ring-blue-500'
                            : 'bg-white/60 border-slate-200 hover:bg-white'
                        }`}
                      >
                        <input
                          type="radio"
                          name="installmentValueModeRadio"
                          checked={installmentValueMode === 'INSTALLMENT'}
                          onChange={() => setInstallmentValueMode('INSTALLMENT')}
                          className="mt-0.5 text-blue-600 focus:ring-blue-500"
                        />
                        <div>
                          <span className="font-bold text-slate-800 block">Valor da Parcela</span>
                          <span className="text-[11px] text-slate-500 block leading-tight mt-0.5">
                            Repete nas {formInstallments} parcelas
                          </span>
                        </div>
                      </label>
                    </div>

                    {/* Pré-visualização transparente do cálculo */}
                    {parseFloat(formAmount) > 0 && (
                      <div className="mt-1 text-xs bg-white rounded-md p-2.5 border border-blue-100 flex flex-wrap items-center justify-between gap-1 shadow-2xs">
                        <span className="text-slate-600">
                          Cada parcela:{' '}
                          <strong className="text-blue-700 font-bold">
                            {installmentValueMode === 'TOTAL'
                              ? formatMoney(Math.floor(Math.round((parseFloat(formAmount) || 0) * 100) / formInstallments))
                              : formatMoney(Math.round((parseFloat(formAmount) || 0) * 100))}
                          </strong>{' '}
                          ({formInstallments}x)
                        </span>
                        <span className="text-slate-600">
                          {formStartInstallment > 1 ? 'A lançar agora:' : 'Total final:'}{' '}
                          <strong className="text-slate-900 font-bold">
                            {installmentValueMode === 'TOTAL'
                              ? (formStartInstallment > 1
                                  ? formatMoney(Math.floor(Math.round((parseFloat(formAmount) || 0) * 100) / formInstallments) * remainingInstallmentsCount)
                                  : formatMoney(Math.round((parseFloat(formAmount) || 0) * 100)))
                              : formatMoney(Math.round((parseFloat(formAmount) || 0) * 100) * (formStartInstallment > 1 ? remainingInstallmentsCount : formInstallments))}
                          </strong>
                          {formStartInstallment > 1 && (
                            <span className="text-[10px] text-slate-400 block font-normal sm:inline sm:ml-1">
                              ({remainingInstallmentsCount} parcelas de {formInstallments})
                            </span>
                          )}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Bloco de Recorrência (Repetir mensalmente) */}
            {((modalState.mode === 'create' && formInstallments === 1) ||
              (modalState.mode === 'edit' && !modalState.data?.installmentGroupId && !isActualRecurrence)) && (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    name="isRecurring"
                    id="isRecurring"
                    checked={formIsRecurring}
                    onChange={(e) => setFormIsRecurring(e.target.checked)}
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="isRecurring" className="text-xs font-semibold text-slate-800 flex items-center space-x-1.5 cursor-pointer select-none">
                    <RefreshCw className="w-3.5 h-3.5 text-blue-600" />
                    <span>Repetir mensalmente (Despesa / Receita Recorrente)</span>
                  </label>
                </div>

                {formIsRecurring && (
                  <div className="p-3 bg-blue-50/80 border border-blue-200 rounded-xl space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-blue-950">Horizonte de repetição:</span>
                      <select
                        name="recurringHorizon"
                        value={formRecurringMonths}
                        onChange={(e) => setFormRecurringMonths(parseInt(e.target.value, 10))}
                        className="border border-blue-300 rounded-lg px-2.5 py-1 text-xs font-bold bg-white text-blue-900 shadow-2xs"
                      >
                        <option value="12">12 meses (1 ano)</option>
                        <option value="24">24 meses (2 anos)</option>
                        <option value="36">36 meses (3 anos)</option>
                      </select>
                    </div>
                    <p className="text-[11px] text-blue-700 leading-tight">
                      {modalSourceType === 'CARD'
                        ? 'Gera as repetições mensais na fatura do cartão (ex: assinaturas, streamings, internet). Cada repetição será agendada para a fatura do mês seguinte.'
                        : 'Gera as repetições mensais para planejar contas fixas (ex: luz, água, aluguel). Você poderá editar ou excluir lançamentos individuais ou futuros em cascata a qualquer momento.'}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ==================================================================== */}
        {/* BOTÕES DE AÇÃO: CANCELAR x SALVAR                                    */}
        {/* ==================================================================== */}
        <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
          {modalState.mode === 'edit' &&
            modalState.data?.status === 'COMPROMETIDO' &&
            !isTransfer && (
              <button
                type="button"
                onClick={() => {
                  handleQuickPayTransaction?.(modalState.data, 'REALIZADO');
                  setModalState({ isOpen: false, type: null, mode: 'create', data: null });
                }}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-semibold flex items-center space-x-1.5 shadow-xs transition active:scale-95"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>
                  {modalState.data?.cardId
                    ? 'Pagar Fatura deste Cartão'
                    : modalState.data?.type === 'INCOME'
                    ? 'Confirmar Recebimento Agora'
                    : 'Quitar / Marcar como Pago Agora'}
                </span>
              </button>
            )}

          <div className="flex space-x-2 ml-auto">
            <button
              type="button"
              disabled={isSubmittingTx}
              onClick={() => setModalState({ isOpen: false, type: null, mode: 'create', data: null })}
              className="px-4 py-2 border border-slate-300 rounded-lg text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={
                isSubmittingTx ||
                (isTransfer && (accounts.length < 2 || isSameAccountTransfer))
              }
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 min-w-[140px] cursor-pointer shadow-sm active:scale-95 transition"
            >
              {isSubmittingTx ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  <span>{modalState.mode === 'create' ? 'Salvando...' : 'Atualizando...'}</span>
                </>
              ) : (
                <span>
                  {modalState.mode === 'create'
                    ? isTransfer
                      ? 'Salvar Transferência'
                      : 'Salvar Lançamento'
                    : isTransfer
                    ? 'Atualizar Transferência'
                    : 'Atualizar Lançamento'}
                </span>
              )}
            </button>
          </div>
        </div>
      </form>
    </>
  );
}
