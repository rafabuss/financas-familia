import React from 'react';
import { CreditCard, Calendar, AlertTriangle, X, CheckCircle2, Clock } from 'lucide-react';
import { formatMoney, formatDateBR, formatMonthLabel } from '../../utils/formatters';

export function InvoicePaymentModal({
  invoicePaymentModal,
  setInvoicePaymentModal,
  handleConfirmInvoicePayment,
  accounts = [],
  accountBalances = {},
  visibleTransactions = [],
  categories = [],
}) {
  return (
    <>
      {invoicePaymentModal.isOpen && invoicePaymentModal.card && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-4 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Pagamento de Fatura do Cartão</h3>
                  <p className="text-xs text-slate-500">
                    {invoicePaymentModal.card.name} • Competência: {formatMonthLabel(invoicePaymentModal.monthKey)}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() =>
                  setInvoicePaymentModal({
                    isOpen: false,
                    card: null,
                    monthKey: '',
                    totalCents: 0,
                    monthItems: [],
                    dueDateIso: '',
                  })
                }
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmInvoicePayment} className="space-y-4 pt-4">
              {/* Box resumo da fatura */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500">Total da Fatura:</span>
                  <span className="text-base font-bold text-slate-900">
                    {formatMoney(invoicePaymentModal.totalCents)}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500">Vencimento da Fatura:</span>
                  <span className="font-semibold text-slate-700">
                    {formatDateBR(invoicePaymentModal.dueDateIso)}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500">Lançamentos Vinculados:</span>
                  <span className="font-semibold text-slate-700">
                    {invoicePaymentModal.monthItems.length} compras / parcelas
                  </span>
                </div>
              </div>

              {/* Conta Bancária para Débito */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Conta Bancária para Débito do Pagamento *
                </label>
                <select
                  name="accountId"
                  required
                  defaultValue={accounts[0]?.id || ''}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  {accounts.length === 0 ? (
                    <option value="">Nenhuma conta cadastrada</option>
                  ) : (
                    accounts.map((acc) => (
                      <option key={acc.id} value={acc.id}>
                        {acc.name} ({acc.bank}) — Saldo Atual: {formatMoney(accountBalances[acc.id] || 0)}
                      </option>
                    ))
                  )}
                </select>
              </div>

              {/* Data e Valor do Pagamento */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Data do Pagamento *
                  </label>
                  <input
                    type="date"
                    name="paymentDate"
                    required
                    defaultValue={new Date().toISOString().slice(0, 10)}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Valor Pago (R$) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    name="paidAmount"
                    required
                    defaultValue={(invoicePaymentModal.totalCents / 100).toFixed(2)}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>
              <p className="text-[11px] text-slate-400">
                * Por padrão, traz o valor total da fatura. Você pode informar um valor menor para registrar um pagamento parcial.
              </p>

              {/* Descrição do Pagamento */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Descrição / Identificação do Pagamento
                </label>
                <input
                  type="text"
                  name="description"
                  defaultValue={`Pagamento Fatura ${invoicePaymentModal.card.name} (${formatMonthLabel(invoicePaymentModal.monthKey)})`}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl text-xs text-emerald-800 space-y-1">
                <p className="font-semibold">Ao confirmar o pagamento:</p>
                <ul className="list-disc list-inside space-y-0.5 text-[11px]">
                  <li>O valor informado será debitado da conta bancária selecionada.</li>
                  <li>Todos os {invoicePaymentModal.monthItems.length} lançamentos desta fatura serão marcados como <strong>Realizado</strong>.</li>
                  <li>A fatura passará para a situação <strong>Paga</strong>.</li>
                </ul>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() =>
                    setInvoicePaymentModal({
                      isOpen: false,
                      card: null,
                      monthKey: '',
                      totalCents: 0,
                      monthItems: [],
                      dueDateIso: '',
                    })
                  }
                  className="px-4 py-2 border border-slate-300 rounded-xl text-sm text-slate-700 hover:bg-slate-50 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold transition active:scale-95 shadow-sm"
                >
                  Confirmar Pagamento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Exclusão de Toda uma Fatura e Compras Vinculadas */}

    </>
  );
}

export function CardPaymentPromptModal({
  cardPaymentPromptModal,
  setCardPaymentPromptModal,
  openInvoicePaymentModal,
}) {
  return (
    <>
      {cardPaymentPromptModal.isOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-100">
            <div className="flex items-start space-x-3">
              <div className="p-2.5 bg-purple-50 text-purple-600 rounded-xl">
                <CreditCard className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-bold text-slate-900">
                  Pagamento de Despesa no Cartão
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Lançamento vinculado à fatura de cartão de crédito
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  setCardPaymentPromptModal({
                    isOpen: false,
                    transaction: null,
                    card: null,
                    monthKey: '',
                    dueDateIso: '',
                  })
                }
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 space-y-3">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-500">Lançamento:</span>
                  <span className="font-semibold text-slate-800">
                    {cardPaymentPromptModal.transaction?.description}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Valor:</span>
                  <span className="font-bold text-slate-900">
                    {formatMoney(cardPaymentPromptModal.transaction?.amountCents || 0)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Cartão:</span>
                  <span className="font-semibold text-purple-700">
                    {cardPaymentPromptModal.card?.name}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Vencimento da Fatura:</span>
                  <span className="font-semibold text-slate-800">
                    {formatDateBR(cardPaymentPromptModal.dueDateIso)}
                  </span>
                </div>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                Compras no cartão de crédito não são debitadas individualmente de uma conta bancária. Elas são quitadas através do <strong>pagamento da fatura consolidada</strong> do mês correspondente.
              </p>
            </div>

            <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row gap-2 justify-end">
              <button
                type="button"
                onClick={() =>
                  setCardPaymentPromptModal({
                    isOpen: false,
                    transaction: null,
                    card: null,
                    monthKey: '',
                    dueDateIso: '',
                  })
                }
                className="px-4 py-2 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-700 hover:bg-slate-50 transition"
              >
                Fechar
              </button>
              <button
                type="button"
                onClick={() => {
                  const card = cardPaymentPromptModal.card;
                  const monthKey = cardPaymentPromptModal.monthKey;
                  setCardPaymentPromptModal({
                    isOpen: false,
                    transaction: null,
                    card: null,
                    monthKey: '',
                    dueDateIso: '',
                  });
                  openInvoicePaymentModal(card, monthKey);
                }}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs sm:text-sm font-semibold transition active:scale-95 shadow-sm flex items-center justify-center space-x-1.5"
              >
                <CreditCard className="w-4 h-4" />
                <span>Pagar Fatura deste Cartão</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Programação de Teto / Envelope */}

    </>
  );
}
