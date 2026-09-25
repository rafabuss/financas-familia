import React from 'react';
import {
  Plus,
  Edit2,
  Archive,
  Trash2,
  Receipt,
  CreditCard,
  ArrowLeftRight,
} from 'lucide-react';
import { formatMoney } from '../../utils/formatters';

export default function AccountsTab({
  visibleAccounts = [],
  accountBalances = {},
  visibleCards = [],
  cardStats = {},
  setModalState,
  openTransactionModal,
  toggleArchiveAccount,
  handleDeleteAccount,
  toggleArchiveCard,
  handleDeleteCard,
  onNavigateToAccountStatement,
  onNavigateToCardStatement,
}) {
  return (
    <div className="space-y-8">
      {/* Contas */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Contas Bancárias e Carteiras</h2>
            <p className="text-xs text-slate-500">Cadastre e edite contas correntes e reservas</p>
          </div>
          <div className="flex items-center space-x-2">
            {openTransactionModal && (
              <button
                type="button"
                onClick={() => openTransactionModal(null, 'TRANSFER')}
                className="bg-sky-600 hover:bg-sky-700 text-white px-3.5 py-2 rounded-lg text-sm font-semibold flex items-center space-x-1.5 cursor-pointer shadow-sm transition active:scale-95"
                title="Transferir saldo entre contas (Pix / TED)"
              >
                <ArrowLeftRight className="w-4 h-4" />
                <span>Transferir / Pix</span>
              </button>
            )}
            <button
              onClick={() => setModalState({ isOpen: true, type: 'account', mode: 'create', data: null })}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center space-x-1 cursor-pointer shadow-sm transition active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Nova Conta</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {visibleAccounts.map((acc) => (
            <div key={acc.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center space-x-2">
                    <span className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: acc.color }} />
                    <h3 className="font-bold text-slate-900 text-base">{acc.name}</h3>
                  </div>
                  {acc.archived && <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded font-bold uppercase">Arquivada</span>}
                </div>
                <p className="text-xs text-slate-500">{acc.bank} • Titular: <strong>{acc.holder}</strong></p>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Saldo Atual</span>
                  <p className="text-lg font-bold text-slate-900">{formatMoney(accountBalances[acc.id] || 0)}</p>
                </div>
                <div className="flex items-center space-x-1.5 flex-wrap gap-y-1">
                  {openTransactionModal && (
                    <button
                      type="button"
                      onClick={() => openTransactionModal({ accountId: acc.id }, 'TRANSFER')}
                      className="px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-sky-50 text-sky-700 hover:bg-sky-100 border border-sky-200 flex items-center space-x-1 transition active:scale-95 cursor-pointer shadow-2xs"
                      title={`Fazer transferência / Pix a partir de ${acc.name}`}
                    >
                      <ArrowLeftRight className="w-3.5 h-3.5 text-sky-600" />
                      <span>Pix</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => onNavigateToAccountStatement && onNavigateToAccountStatement(acc.id)}
                    className="px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 flex items-center space-x-1 transition active:scale-95 cursor-pointer shadow-2xs"
                    title="Ver Extrato completo com saldo progressivo"
                  >
                    <Receipt className="w-3.5 h-3.5 text-blue-600" />
                    <span>Extrato</span>
                  </button>
                  <button
                    onClick={() => setModalState({ isOpen: true, type: 'account', mode: 'edit', data: acc })}
                    className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition cursor-pointer"
                    title="Editar"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => toggleArchiveAccount(acc.id)}
                    className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition cursor-pointer"
                    title={acc.archived ? 'Desarquivar' : 'Arquivar'}
                  >
                    <Archive className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteAccount(acc)}
                    className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                    title="Excluir Definitivamente"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Cartões */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Cartões de Crédito</h2>
            <p className="text-xs text-slate-500">Gerencie limites totais, disponíveis e datas de vencimento</p>
          </div>
          <button
            onClick={() => setModalState({ isOpen: true, type: 'card', mode: 'create', data: null })}
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center space-x-1 cursor-pointer shadow-sm transition active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Cartão</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {visibleCards.map((card) => {
            const stats = cardStats[card.id] || { committedCents: 0, availableCents: card.limitCents };
            return (
              <div key={card.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-slate-900 text-base">{card.name}</h3>
                    <span className="text-xs text-slate-400">Fecha dia {card.closingDay} | Vence dia {card.dueDay}</span>
                  </div>
                  <p className="text-xs text-slate-500">{card.bank} ({card.flag})</p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 space-y-1 text-xs">
                  <div className="flex justify-between text-slate-500">
                    <span>Limite Total:</span>
                    <strong>{formatMoney(card.limitCents)}</strong>
                  </div>
                  <div className="flex justify-between text-rose-600">
                    <span>Comprometido:</span>
                    <strong>{formatMoney(stats.committedCents)}</strong>
                  </div>
                  <div className="flex justify-between text-emerald-600 font-bold">
                    <span>Disponível:</span>
                    <span>{formatMoney(stats.availableCents)}</span>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => onNavigateToCardStatement && onNavigateToCardStatement(card.id)}
                    className="px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200 flex items-center space-x-1 transition active:scale-95 cursor-pointer shadow-2xs"
                    title="Ver Fatura deste Cartão"
                  >
                    <CreditCard className="w-3.5 h-3.5 text-purple-600" />
                    <span>Ver Fatura</span>
                  </button>
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => setModalState({ isOpen: true, type: 'card', mode: 'edit', data: card })}
                      className="p-1.5 text-slate-500 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition cursor-pointer"
                      title="Editar"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => toggleArchiveCard(card.id)}
                      className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition cursor-pointer"
                      title={card.archived ? 'Desarquivar' : 'Arquivar'}
                    >
                      <Archive className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteCard(card)}
                      className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                      title="Excluir Definitivamente"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
