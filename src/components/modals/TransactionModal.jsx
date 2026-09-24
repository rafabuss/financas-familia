import React from 'react';
import { X, CheckCircle2, Info, RefreshCw } from 'lucide-react';
import { FAMILY_MEMBERS } from '../../data/constants';
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
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <h3 className="font-bold text-base text-slate-900">
            {modalState.mode === 'edit' ? 'Editar' : 'Cadastrar'} Lançamento
          </h3>
          <button
            onClick={() => setModalState({ isOpen: false, type: null, mode: 'create', data: null })}
            className="text-slate-400 hover:text-slate-700 p-1 rounded-md cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
            {modalState.type === 'transaction' && (() => {
              const isActualRecurrence = Boolean(
                modalState.data?.recurrenceRuleId &&
                !String(modalState.data.recurrenceRuleId).startsWith('PURCHASE_DATE:') &&
                !String(modalState.data.recurrenceRuleId).startsWith('INVOICE_PAY:')
              );
              const remainingInstallmentsCount = formInstallments - formStartInstallment + 1;

              return (
              <form key={modalState.data?.id || modalState.mode || 'new'} onSubmit={handleSaveTransaction} className="p-6 space-y-4 overflow-y-auto">
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
                        ? (installmentValueMode === 'TOTAL' ? 'Valor Total da Compra (R$)' : 'Valor de Cada Parcela (R$)')
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
                      defaultValue={modalState.data?.dueDate || modalState.data?.date || new Date().toISOString().slice(0, 10)}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                </div>

                {modalSourceType === 'CARD' && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Data da Compra no Cartão</label>
                      <input
                        type="date"
                        name="purchaseDate"
                        defaultValue={modalState.data?.purchaseDate || modalState.data?.date || new Date().toISOString().slice(0, 10)}
                        className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>
                    <div className="flex items-center text-xs text-slate-500 pt-5">
                      <span>* O vencimento define o mês da fatura e se está em atraso.</span>
                    </div>
                  </div>
                )}

                {/* Seletor de Escopo: Familiar vs Pessoal */}
                <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Escopo do Lançamento</label>
                    <select
                      name="scope"
                      defaultValue={modalState.data?.scope || 'FAMILY'}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
                    >
                      <option value="FAMILY">Familiar (Padrão - Todos Veem)</option>
                      <option value="PERSONAL">Individual / Pessoal (Privado)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Titular / Responsável</label>
                    <select
                      name="ownerId"
                      defaultValue={modalState.data?.ownerId || (currentMemberId === 'user-all' ? 'user-1' : currentMemberId)}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
                    >
                      <option value="user-1">Rafael</option>
                      <option value="user-2">Ana Débora</option>
                      <option value="user-all">Família (Geral)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Tipo</label>
                    <select
                      name="type"
                      defaultValue={modalState.data?.type || 'EXPENSE'}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    >
                      <option value="EXPENSE">Despesa</option>
                      <option value="INCOME">Receita</option>
                    </select>
                  </div>
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
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Categoria</label>
                    <select
                      name="categoryId"
                      defaultValue={modalState.data?.categoryId || categories[0]?.id}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    >
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
                              const val = Math.max(1, parseInt(e.target.value) || 1);
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
                                const val = Math.min(formInstallments, Math.max(1, parseInt(e.target.value) || 1));
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
                          <strong className="block font-bold">Parcelamento em andamento ({formStartInstallment}ª a {formInstallments}ª)</strong>
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

                <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                  {modalState.mode === 'edit' && modalState.data?.status === 'COMPROMETIDO' && (
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
                      className="px-4 py-2 border border-slate-300 rounded-lg text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmittingTx}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 min-w-[140px]"
                    >
                      {isSubmittingTx ? (
                        <>
                          <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                          <span>{modalState.mode === 'create' ? 'Salvando...' : 'Atualizando...'}</span>
                        </>
                      ) : (
                        <span>{modalState.mode === 'create' ? 'Salvar Lançamento' : 'Atualizar Lançamento'}</span>
                      )}
                    </button>
                  </div>
                </div>
              </form>
            );
          })()}

      </div>
    </div>
  );
}
