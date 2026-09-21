import React from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';
import { formatMoney, formatDateBR, formatMonthLabel } from '../../utils/formatters';

export function DeleteTransactionModal({
  deleteModalState,
  setDeleteModalState,
  handleConfirmDeleteTransaction,
  categories = [],
  accounts = [],
  cards = [],
  transactions = [],
  formatDateBR: formatDate = formatDateBR,
}) {
  return (
    <>
      {deleteModalState.isOpen && deleteModalState.transaction && (() => {
        const tx = deleteModalState.transaction;
        const isGrouped = Boolean(tx.installmentGroupId || tx.recurrenceRuleId);
        const futureCount = transactions.filter((t) => {
          if (tx.installmentGroupId && t.installmentGroupId === tx.installmentGroupId) {
            return (t.installmentNumber || 0) >= (tx.installmentNumber || 0);
          }
          if (tx.recurrenceRuleId && t.recurrenceRuleId === tx.recurrenceRuleId) {
            return t.date >= tx.date;
          }
          return t.id === tx.id;
        }).length;

        const pastOnlyCount = transactions.filter((t) => {
          if (tx.installmentGroupId && t.installmentGroupId === tx.installmentGroupId) {
            return (t.installmentNumber || 0) < (tx.installmentNumber || 0);
          }
          if (tx.recurrenceRuleId && t.recurrenceRuleId === tx.recurrenceRuleId) {
            return t.date < tx.date;
          }
          return false;
        }).length;

        const pastInclusiveCount = transactions.filter((t) => {
          if (tx.installmentGroupId && t.installmentGroupId === tx.installmentGroupId) {
            return (t.installmentNumber || 0) <= (tx.installmentNumber || 0);
          }
          if (tx.recurrenceRuleId && t.recurrenceRuleId === tx.recurrenceRuleId) {
            return t.date <= tx.date;
          }
          return t.id === tx.id;
        }).length;

        const allCount = transactions.filter((t) =>
          (tx.installmentGroupId && t.installmentGroupId === tx.installmentGroupId) ||
          (tx.recurrenceRuleId && t.recurrenceRuleId === tx.recurrenceRuleId)
        ).length;

        const countToDelete =
          deleteModalState.scope === 'all'
            ? allCount
            : deleteModalState.scope === 'future'
            ? futureCount
            : deleteModalState.scope === 'past_only'
            ? pastOnlyCount
            : deleteModalState.scope === 'past_inclusive'
            ? pastInclusiveCount
            : 1;

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center space-x-2.5">
                  <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                    <Trash2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-800">Excluir Lançamento</h3>
                    <p className="text-xs text-slate-500">Confirmação de exclusão</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setDeleteModalState({ isOpen: false, transaction: null, scope: 'single' })}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="py-4 space-y-3">
                {/* Cartão de Detalhes do Lançamento */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-semibold text-sm text-slate-800">{tx.description}</h4>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Data: {formatDateBR(tx.date)}
                      </p>
                    </div>
                    <span className={`text-sm font-bold ${tx.type === 'INCOME' ? 'text-emerald-600' : 'text-slate-900'}`}>
                      {tx.type === 'INCOME' ? '+' : '-'} {formatMoney(tx.amountCents)}
                    </span>
                  </div>
                </div>

                {isGrouped ? (
                  <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-xl space-y-2.5">
                    <div className="flex items-center space-x-1.5 text-amber-900">
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                      <span className="text-xs font-bold">
                        {tx.installmentGroupId
                          ? `Este lançamento faz parte de um parcelamento (${tx.installmentNumber || '?'}/${tx.installmentCount || '?'})`
                          : 'Este lançamento faz parte de uma recorrência'}
                      </span>
                    </div>
                    <p className="text-xs text-amber-800">
                      Escolha como deseja prosseguir com a exclusão:
                    </p>

                    <div className="space-y-2 text-xs">
                      <label
                        className={`flex items-start space-x-2.5 p-2.5 rounded-lg border cursor-pointer transition ${
                          deleteModalState.scope === 'single'
                            ? 'bg-white border-rose-500 shadow-xs ring-1 ring-rose-500'
                            : 'bg-white/60 border-slate-200 hover:bg-white'
                        }`}
                      >
                        <input
                          type="radio"
                          name="deleteScopeRadio"
                          value="single"
                          checked={deleteModalState.scope === 'single'}
                          onChange={() => setDeleteModalState((prev) => ({ ...prev, scope: 'single' }))}
                          className="mt-0.5 text-rose-600 focus:ring-rose-500"
                        />
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-slate-800">Apenas este lançamento</span>
                            <span className="text-[10px] font-bold px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded">
                              1 lançamento
                            </span>
                          </div>
                          <span className="text-[11px] text-slate-500 block mt-0.5">
                            {tx.installmentGroupId
                              ? `Exclui apenas a parcela ${tx.installmentNumber || ''}. As demais parcelas continuam ativas.`
                              : 'Exclui apenas esta ocorrência da recorrência.'}
                          </span>
                        </div>
                      </label>

                      <label
                        className={`flex items-start space-x-2.5 p-2.5 rounded-lg border cursor-pointer transition ${
                          deleteModalState.scope === 'future'
                            ? 'bg-white border-rose-500 shadow-xs ring-1 ring-rose-500'
                            : 'bg-white/60 border-slate-200 hover:bg-white'
                        }`}
                      >
                        <input
                          type="radio"
                          name="deleteScopeRadio"
                          value="future"
                          checked={deleteModalState.scope === 'future'}
                          onChange={() => setDeleteModalState((prev) => ({ ...prev, scope: 'future' }))}
                          className="mt-0.5 text-rose-600 focus:ring-rose-500"
                        />
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-slate-800">Deste lançamento em diante</span>
                            <span className="text-[10px] font-bold px-1.5 py-0.5 bg-rose-50 text-rose-700 rounded">
                              {futureCount} {futureCount === 1 ? 'lançamento' : 'lançamentos'}
                            </span>
                          </div>
                          <span className="text-[11px] text-slate-500 block mt-0.5">
                            {tx.installmentGroupId
                              ? `Exclui a partir da parcela ${tx.installmentNumber || ''} até a última parcela.`
                              : 'Exclui este lançamento e todas as repetições futuras.'}
                          </span>
                        </div>
                      </label>

                      {pastOnlyCount > 0 && (
                        <label
                          className={`flex items-start space-x-2.5 p-2.5 rounded-lg border cursor-pointer transition ${
                            deleteModalState.scope === 'past_only'
                              ? 'bg-white border-rose-500 shadow-xs ring-1 ring-rose-500'
                              : 'bg-white/60 border-slate-200 hover:bg-white'
                          }`}
                        >
                          <input
                            type="radio"
                            name="deleteScopeRadio"
                            value="past_only"
                            checked={deleteModalState.scope === 'past_only'}
                            onChange={() => setDeleteModalState((prev) => ({ ...prev, scope: 'past_only' }))}
                            className="mt-0.5 text-rose-600 focus:ring-rose-500"
                          />
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-slate-800">Apenas parcelas anteriores</span>
                              <span className="text-[10px] font-bold px-1.5 py-0.5 bg-rose-50 text-rose-700 rounded">
                                {pastOnlyCount} {pastOnlyCount === 1 ? 'lançamento' : 'lançamentos'}
                              </span>
                            </div>
                            <span className="text-[11px] text-slate-500 block mt-0.5">
                              {tx.installmentGroupId
                                ? `Exclui as ${pastOnlyCount} parcela(s) anteriores (1 a ${Math.max(1, (tx.installmentNumber || 1) - 1)}). Mantém esta parcela ${tx.installmentNumber || ''} e as futuras ativas.`
                                : 'Exclui as repetições passadas anteriores a esta data.'}
                            </span>
                          </div>
                        </label>
                      )}

                      {pastInclusiveCount > 1 && (
                        <label
                          className={`flex items-start space-x-2.5 p-2.5 rounded-lg border cursor-pointer transition ${
                            deleteModalState.scope === 'past_inclusive'
                              ? 'bg-white border-rose-500 shadow-xs ring-1 ring-rose-500'
                              : 'bg-white/60 border-slate-200 hover:bg-white'
                          }`}
                        >
                          <input
                            type="radio"
                            name="deleteScopeRadio"
                            value="past_inclusive"
                            checked={deleteModalState.scope === 'past_inclusive'}
                            onChange={() => setDeleteModalState((prev) => ({ ...prev, scope: 'past_inclusive' }))}
                            className="mt-0.5 text-rose-600 focus:ring-rose-500"
                          />
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-slate-800">Deste lançamento para trás</span>
                              <span className="text-[10px] font-bold px-1.5 py-0.5 bg-rose-50 text-rose-700 rounded">
                                {pastInclusiveCount} {pastInclusiveCount === 1 ? 'lançamento' : 'lançamentos'}
                              </span>
                            </div>
                            <span className="text-[11px] text-slate-500 block mt-0.5">
                              {tx.installmentGroupId
                                ? `Exclui desde a parcela 1 até esta parcela (${tx.installmentNumber || ''}). Mantém apenas as parcelas seguintes.`
                                : 'Exclui esta repetição e todas as anteriores.'}
                            </span>
                          </div>
                        </label>
                      )}

                      <label
                        className={`flex items-start space-x-2.5 p-2.5 rounded-lg border cursor-pointer transition ${
                          deleteModalState.scope === 'all'
                            ? 'bg-white border-rose-500 shadow-xs ring-1 ring-rose-500'
                            : 'bg-white/60 border-slate-200 hover:bg-white'
                        }`}
                      >
                        <input
                          type="radio"
                          name="deleteScopeRadio"
                          value="all"
                          checked={deleteModalState.scope === 'all'}
                          onChange={() => setDeleteModalState((prev) => ({ ...prev, scope: 'all' }))}
                          className="mt-0.5 text-rose-600 focus:ring-rose-500"
                        />
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-slate-800">
                              {tx.installmentGroupId ? 'Todas as parcelas' : 'Todas as repetições'}
                            </span>
                            <span className="text-[10px] font-bold px-1.5 py-0.5 bg-rose-50 text-rose-700 rounded">
                              {allCount} {allCount === 1 ? 'lançamento' : 'lançamentos'}
                            </span>
                          </div>
                          <span className="text-[11px] text-slate-500 block mt-0.5">
                            {tx.installmentGroupId
                              ? `Exclui todas as ${allCount} parcelas deste grupo desde o início.`
                              : 'Exclui todas as repetições desta recorrência.'}
                          </span>
                        </div>
                      </label>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-slate-600 px-1">
                    Tem certeza de que deseja excluir este lançamento? Esta ação não poderá ser desfeita.
                  </p>
                )}
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setDeleteModalState({ isOpen: false, transaction: null, scope: 'single' })}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-sm text-slate-700 hover:bg-slate-50 transition"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDeleteTransaction}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-sm font-semibold transition active:scale-95 shadow-xs"
                >
                  Excluir {countToDelete > 1 ? `(${countToDelete})` : ''}
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Modal de Pagamento de Fatura de Cartão de Crédito */}

    </>
  );
}

export function DeleteInvoiceModal({
  deleteInvoiceModalState,
  setDeleteInvoiceModalState,
  handleConfirmDeleteInvoice,
}) {
  return (
    <>
      {deleteInvoiceModalState.isOpen && deleteInvoiceModalState.card && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-4 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-rose-50 text-rose-600 rounded-xl">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Excluir Toda a Fatura</h3>
                  <p className="text-xs text-slate-500">
                    {deleteInvoiceModalState.card.name} • Competência: {formatMonthLabel(deleteInvoiceModalState.monthKey)}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() =>
                  setDeleteInvoiceModalState({
                    isOpen: false,
                    card: null,
                    monthKey: '',
                    items: [],
                    paymentTx: null,
                    totalCents: 0,
                    includeFutureInstallments: false,
                  })
                }
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 pt-4">
              <div className="p-4 bg-rose-50/70 border border-rose-200 rounded-xl space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-rose-700">Total da Fatura:</span>
                  <span className="text-base font-bold text-rose-900">
                    {formatMoney(deleteInvoiceModalState.totalCents)}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-rose-700">Lançamentos Vinculados:</span>
                  <span className="font-semibold text-rose-900">
                    {deleteInvoiceModalState.items.length} compras / parcelas neste mês
                  </span>
                </div>
                {deleteInvoiceModalState.paymentTx && (
                  <div className="text-[11px] text-rose-800 font-medium bg-rose-100/60 p-2 rounded-lg">
                    ⚠️ Esta fatura possui um pagamento registrado no valor de {formatMoney(deleteInvoiceModalState.paymentTx.amountCents)}. O lançamento do pagamento também será excluído.
                  </div>
                )}
              </div>

              <div className="text-xs text-slate-600 space-y-2">
                <p>
                  Esta ação excluirá <strong>todos os {deleteInvoiceModalState.items.length} lançamentos</strong> pertencentes a esta fatura de <strong>{formatMonthLabel(deleteInvoiceModalState.monthKey)}</strong>.
                </p>
              </div>

              {/* Opção para parcelas futuras / recorrências */}
              {deleteInvoiceModalState.items.some((i) => i.installmentGroupId || i.recurrenceRuleId) && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-2">
                  <label className="flex items-start space-x-2.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={deleteInvoiceModalState.includeFutureInstallments}
                      onChange={(e) =>
                        setDeleteInvoiceModalState((prev) => ({
                          ...prev,
                          includeFutureInstallments: e.target.checked,
                        }))
                      }
                      className="mt-0.5 rounded text-rose-600 focus:ring-rose-500"
                    />
                    <div className="text-xs">
                      <span className="font-bold text-amber-950 block">
                        Excluir também parcelas futuras e repetições vinculadas
                      </span>
                      <span className="text-[11px] text-amber-800 leading-tight block mt-0.5">
                        Algumas compras desta fatura fazem parte de parcelamentos ou repetições. Marque para apagar também as parcelas dos meses futuros geradas por elas.
                      </span>
                    </div>
                  </label>
                </div>
              )}

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() =>
                    setDeleteInvoiceModalState({
                      isOpen: false,
                      card: null,
                      monthKey: '',
                      items: [],
                      paymentTx: null,
                      totalCents: 0,
                      includeFutureInstallments: false,
                    })
                  }
                  className="px-4 py-2 border border-slate-300 rounded-xl text-sm text-slate-700 hover:bg-slate-50 transition"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDeleteInvoice}
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-sm font-semibold transition active:scale-95 shadow-sm flex items-center space-x-1.5"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Confirmar Exclusão da Fatura</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Informativo para Quitação de Lançamentos de Cartão */}

    </>
  );
}
