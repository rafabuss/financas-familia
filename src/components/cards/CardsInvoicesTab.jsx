import React from 'react';
import {
  UploadCloud,
  Plus,
  ChevronLeft,
  ChevronRight,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  Clock,
  CreditCard,
  Trash2,
  Edit2,
} from 'lucide-react';
import { formatMoney, formatDateBR, formatMonthLabel, getTxDueDate } from '../../utils/formatters';

export default function CardsInvoicesTab({
  cards = [],
  faturasCardsData = {},
  invoiceSelectedMonth,
  setInvoiceSelectedMonth,
  changeInvoiceSelectedMonth,
  availableInvoiceMonths = [],
  currentActualMonth,
  openInvoicePaymentModal,
  handleOpenDeleteInvoiceModal,
  openTransactionModal,
  categories = [],
  setActiveTab,
  setModalState,
}) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Faturas & Parcelas de Cartões</h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Acompanhe o valor da fatura de qualquer mês e confira o impacto de compras parceladas futuras.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={() => setActiveTab('import')}
            className="bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-200 text-xs sm:text-sm font-semibold px-4 py-2 rounded-lg flex items-center space-x-1.5 transition cursor-pointer"
          >
            <UploadCloud className="w-4 h-4" />
            <span>Importar Fatura</span>
          </button>
          <button
            type="button"
            onClick={() => setModalState({ isOpen: true, type: 'card', mode: 'create', data: null })}
            className="bg-purple-600 hover:bg-purple-700 text-white text-xs sm:text-sm font-semibold px-4 py-2 rounded-lg flex items-center space-x-1.5 transition shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Cartão</span>
          </button>
        </div>
      </div>

      {/* Seletor Cronológico de Mês das Faturas */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-2 w-full sm:w-auto justify-between sm:justify-start">
          <button
            type="button"
            onClick={() => changeInvoiceSelectedMonth(-1)}
            className="p-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl transition active:scale-95 shadow-2xs cursor-pointer"
            title="Ver fatura do mês anterior"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <div className="flex items-center space-x-2">
            <Calendar className="w-4 h-4 text-purple-600 hidden sm:inline" />
            <select
              value={invoiceSelectedMonth}
              onChange={(e) => setInvoiceSelectedMonth(e.target.value)}
              className="border border-slate-300 rounded-xl px-3 py-2 text-sm sm:text-base font-bold text-slate-800 bg-white focus:ring-2 focus:ring-purple-500 focus:outline-none cursor-pointer capitalize"
            >
              {availableInvoiceMonths.map((mKey) => (
                <option key={mKey} value={mKey}>
                  {formatMonthLabel(mKey)} {mKey === currentActualMonth ? '★ (MÊS ATUAL)' : ''}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={() => changeInvoiceSelectedMonth(1)}
            className="p-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl transition active:scale-95 shadow-2xs cursor-pointer"
            title="Ver fatura do próximo mês"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        <div className="flex items-center space-x-3 text-xs">
          {invoiceSelectedMonth !== currentActualMonth && (
            <button
              type="button"
              onClick={() => setInvoiceSelectedMonth(currentActualMonth)}
              className="font-semibold px-3 py-1.5 rounded-lg bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200 transition cursor-pointer"
            >
              Voltar para Mês Atual
            </button>
          )}
          <span className="text-slate-500">
            Fatura de competência: <strong className="text-slate-800 capitalize">{formatMonthLabel(invoiceSelectedMonth)}</strong>
          </span>
        </div>
      </div>

      <div className="space-y-6">
        {cards.map((card) => {
          const info = faturasCardsData[card.id] || {
            monthItems: [],
            invoiceTotalCents: 0,
            availableCents: card.limitCents,
            committedTotalCents: 0,
            isPaid: false,
            invoiceStatus: 'ABERTA',
            dueDateIso: '',
            closingDateIso: '',
          };

          return (
            <div key={card.id} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <div className="flex flex-col md:flex-row justify-between md:items-center pb-4 border-b border-slate-100 gap-4">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: card.color || '#1e293b' }} />
                    <h3 className="text-base font-bold text-slate-900">{card.name}</h3>
                    <span className="text-xs text-slate-500">({card.bank} • {card.flag})</span>
                    {/* Badge de Situação da Fatura */}
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase flex items-center space-x-1 border ${
                        info.invoiceStatus === 'PAGA'
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                          : info.invoiceStatus === 'EM ATRASO'
                          ? 'bg-rose-100 text-rose-800 border-rose-300'
                          : info.invoiceStatus === 'FECHADA'
                          ? 'bg-amber-100 text-amber-800 border-amber-300'
                          : 'bg-blue-100 text-blue-800 border-blue-300'
                      }`}
                    >
                      {info.invoiceStatus === 'PAGA' && <CheckCircle2 className="w-3 h-3" />}
                      {info.invoiceStatus === 'EM ATRASO' && <AlertTriangle className="w-3 h-3 text-rose-600" />}
                      {info.invoiceStatus === 'FECHADA' && <Clock className="w-3 h-3 text-amber-600" />}
                      {info.invoiceStatus === 'ABERTA' && <Clock className="w-3 h-3 text-blue-600" />}
                      <span>FATURA {info.invoiceStatus}</span>
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    Fechamento todo dia <strong>{card.closingDay}</strong> • Vencimento todo dia <strong>{card.dueDay}</strong>
                    {info.dueDateIso && (
                      <span className="ml-2 font-medium text-slate-600">
                        (Vence em: {formatDateBR(info.dueDateIso)})
                      </span>
                    )}
                  </p>
                </div>

                <div className="flex items-center space-x-4">
                  <div className="text-left md:text-right">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      VALOR DESTA FATURA
                    </span>
                    <span className="text-2xl font-bold text-slate-900">{formatMoney(info.invoiceTotalCents)}</span>
                    {info.isPaid ? (
                      <span className="text-xs text-emerald-600 font-semibold block mt-0.5">
                        ✓ Paga ({formatMoney(info.paidCents || info.invoiceTotalCents)})
                      </span>
                    ) : (
                      <span className="text-xs text-slate-500 font-medium block mt-0.5">
                        Disponível: {formatMoney(info.availableCents)} (de {formatMoney(card.limitCents)})
                      </span>
                    )}
                  </div>

                  {info.invoiceTotalCents > 0 && (
                    <button
                      type="button"
                      onClick={() => openInvoicePaymentModal(card, invoiceSelectedMonth)}
                      className={`text-xs sm:text-sm font-semibold px-4 py-2 rounded-xl flex items-center space-x-1.5 transition active:scale-95 shadow-sm whitespace-nowrap cursor-pointer ${
                        info.isPaid
                          ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
                          : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                      }`}
                      title="Efetuar débito na conta bancária e quitar faturas"
                    >
                      <CreditCard className="w-4 h-4" />
                      <span>{info.isPaid ? 'Novo Pagamento' : 'Pagar Fatura'}</span>
                    </button>
                  )}

                  {(info.monthItems.length > 0 || info.paymentTx) && (
                    <button
                      type="button"
                      onClick={() => handleOpenDeleteInvoiceModal(card, invoiceSelectedMonth)}
                      className="text-xs sm:text-sm font-semibold px-3 py-2 rounded-xl flex items-center space-x-1.5 transition active:scale-95 shadow-sm whitespace-nowrap bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 cursor-pointer"
                      title="Excluir todos os lançamentos desta fatura"
                    >
                      <Trash2 className="w-4 h-4 text-rose-600" />
                      <span className="hidden sm:inline">Excluir Fatura</span>
                    </button>
                  )}
                </div>
              </div>

              <div className="mt-4">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    LANÇAMENTOS E PARCELAS DESTA FATURA ({info.monthItems.length}):
                  </h4>
                  <button
                    type="button"
                    onClick={() => openTransactionModal('create', { cardId: card.id, sourceType: 'CARD' })}
                    className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center space-x-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Adicionar na Fatura</span>
                  </button>
                </div>

                {info.monthItems.length === 0 ? (
                  <p className="text-xs text-slate-400 py-4 bg-slate-50/60 rounded-xl text-center">
                    Nenhuma despesa ou parcela vinculada a este cartão na fatura de {formatMonthLabel(invoiceSelectedMonth)}.
                  </p>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {info.monthItems.map((item) => {
                      const cat = categories.find((c) => c.id === item.categoryId);
                      return (
                        <div key={item.id} className="py-3 flex items-center justify-between hover:bg-slate-50 px-2 rounded-lg transition">
                          <div>
                            <div className="flex items-center space-x-2">
                              <span className="font-semibold text-sm text-slate-900">{item.description}</span>
                              {item.installmentCount && (
                                <span className="text-[10px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded font-semibold">
                                  {item.installmentNumber}/{item.installmentCount}
                                </span>
                              )}
                              {cat && (
                                <span className="text-[10px] px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: `${cat.color}20`, color: cat.color }}>
                                  {cat.name}
                                </span>
                              )}
                              <span
                                className={`text-[9px] font-bold px-1.5 py-0.2 rounded uppercase ${
                                  item.status === 'REALIZADO'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-blue-100 text-blue-800'
                                }`}
                              >
                                {item.status === 'REALIZADO' ? 'Quitado' : 'Comprometido'}
                              </span>
                            </div>
                            <span className="text-xs text-slate-400 block mt-0.5">
                              Vencimento: <strong className="text-slate-600 font-medium">{formatDateBR(getTxDueDate(item, cards))}</strong>
                              {item.purchaseDate && item.purchaseDate !== getTxDueDate(item, cards) && (
                                <span className="ml-2 text-slate-400 font-normal">• Compra: {formatDateBR(item.purchaseDate)}</span>
                              )}
                            </span>
                          </div>
                          <div className="flex items-center space-x-3">
                            <span className="font-bold text-sm text-slate-900">{formatMoney(item.amountCents)}</span>
                            <button
                              type="button"
                              onClick={() => openTransactionModal('edit', item)}
                              className="p-1 text-slate-400 hover:text-blue-600 rounded transition cursor-pointer"
                              title="Editar lançamento"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Rodapé informativo de limites do cartão */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between text-xs text-slate-500 gap-2">
                  <span>
                    Limite Total: <strong>{formatMoney(card.limitCents)}</strong>
                  </span>
                  <span>
                    Total Comprometido (Todas as Parcelas): <strong className="text-slate-700">{formatMoney(info.committedTotalCents)}</strong>
                  </span>
                  <span className="text-emerald-600 font-semibold">
                    Disponível Atual: {formatMoney(info.availableCents)}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
