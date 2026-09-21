import React from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Edit2,
  Trash2,
} from 'lucide-react';
import { formatMoney, formatMonthLabel } from '../../utils/formatters';

export default function EnvelopesTab({
  envelopeSelectedMonth,
  setEnvelopeSelectedMonth,
  changeEnvelopeSelectedMonth,
  currentActualMonth,
  getEnvelopesForMonth,
  setEnvelopeModalState,
  setDeleteEnvelopeModalState,
}) {
  const currentEnvelopesData = getEnvelopesForMonth(envelopeSelectedMonth);

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
        {/* Topo: Título, Navegador de Mês e Ação Novo Envelope */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xl">✉️</span>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                Envelopes de Gastos & Orçamento Mensal
              </h2>
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full">
                Método dos Envelopes
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Destine limites de renda para categorias (ex: Combustível: R$ 800). O valor fica virtualmente comprometido e é consumido conforme você registra suas compras no mês.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Navegador de Mês do Envelope */}
            <div className="flex items-center space-x-1.5 bg-slate-50 border border-slate-200 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => changeEnvelopeSelectedMonth(-1)}
                className="p-1 text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 rounded-lg transition cursor-pointer"
                title="Mês Anterior"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs font-bold text-slate-800 px-2 capitalize min-w-[120px] text-center">
                {formatMonthLabel(envelopeSelectedMonth)}
              </span>
              <button
                type="button"
                onClick={() => changeEnvelopeSelectedMonth(1)}
                className="p-1 text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 rounded-lg transition cursor-pointer"
                title="Próximo Mês"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {envelopeSelectedMonth !== currentActualMonth && (
              <button
                type="button"
                onClick={() => setEnvelopeSelectedMonth(currentActualMonth)}
                className="text-[11px] font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 px-2.5 py-1.5 rounded-xl border border-blue-200 transition cursor-pointer"
              >
                Mês Atual
              </button>
            )}

            <button
              type="button"
              onClick={() =>
                setEnvelopeModalState({
                  isOpen: true,
                  mode: 'create',
                  category: null,
                  monthKey: envelopeSelectedMonth,
                  existingEnvelope: null,
                  scope: 'all_recurring',
                })
              }
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs px-3.5 py-2 rounded-xl flex items-center space-x-1.5 shadow-xs transition active:scale-95 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Programar Teto / Envelope</span>
            </button>
          </div>
        </div>

        {/* Faixa com 4 Métricas Consolidadas do Mês */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              Total Destinado
            </span>
            <div className="text-lg font-bold text-slate-900 mt-0.5">
              {formatMoney(currentEnvelopesData.totalAllocatedCents)}
            </div>
            <span className="text-[10px] text-slate-400">Soma dos tetos mensais</span>
          </div>

          <div className="p-3.5 rounded-xl bg-blue-50/60 border border-blue-100">
            <span className="text-[11px] font-semibold text-blue-700 uppercase tracking-wider block">
              Gasto Realizado
            </span>
            <div className="text-lg font-bold text-blue-900 mt-0.5">
              {formatMoney(currentEnvelopesData.totalSpentCents)}
            </div>
            <span className="text-[10px] text-blue-600">Lançamentos em conta/cartão</span>
          </div>

          <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200/80">
            <span className="text-[11px] font-semibold text-emerald-800 uppercase tracking-wider block">
              Reserva Restante
            </span>
            <div className="text-lg font-bold text-emerald-700 mt-0.5">
              {formatMoney(currentEnvelopesData.totalResidualCommittedCents)}
            </div>
            <span className="text-[10px] text-emerald-600">Disponível nos envelopes</span>
          </div>

          <div
            className={`p-3.5 rounded-xl border ${
              currentEnvelopesData.totalOverspentCents > 0
                ? 'bg-rose-50 border-rose-200'
                : 'bg-slate-50 border-slate-200/70'
            }`}
          >
            <span
              className={`text-[11px] font-semibold uppercase tracking-wider block ${
                currentEnvelopesData.totalOverspentCents > 0 ? 'text-rose-700' : 'text-slate-500'
              }`}
            >
              {currentEnvelopesData.totalOverspentCents > 0 ? '🚨 Total Extrapolado' : 'Estouro / Excesso'}
            </span>
            <div
              className={`text-lg font-bold mt-0.5 ${
                currentEnvelopesData.totalOverspentCents > 0 ? 'text-rose-700' : 'text-slate-400'
              }`}
            >
              {currentEnvelopesData.totalOverspentCents > 0
                ? `+${formatMoney(currentEnvelopesData.totalOverspentCents)}`
                : 'R$ 0,00'}
            </div>
            <span
              className={`text-[10px] ${
                currentEnvelopesData.totalOverspentCents > 0 ? 'text-rose-600 font-medium' : 'text-slate-400'
              }`}
            >
              {currentEnvelopesData.totalOverspentCents > 0 ? 'Além do teto planejado' : 'Dentro do orçamento'}
            </span>
          </div>
        </div>

        {/* Grade de Cards de Envelopes */}
        {!currentEnvelopesData.hasEnvelopes ? (
          <div className="p-8 border-2 border-dashed border-slate-200 rounded-2xl text-center space-y-3 bg-slate-50/50">
            <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mx-auto text-2xl">
              ✉️
            </div>
            <h3 className="font-bold text-slate-800 text-base">Nenhum envelope configurado para este mês</h3>
            <p className="text-xs sm:text-sm text-slate-500 max-w-lg mx-auto">
              O método dos envelopes permite destinar valores mensais para despesas frequentes (ex: Combustível: R$ 800, Supermercado: R$ 1.500, Lazer: R$ 400).
              Você pode programar um teto para 3, 6, 12, 24 ou 36 meses, e o valor reservado diminui conforme suas compras acontecem.
            </p>
            <button
              type="button"
              onClick={() =>
                setEnvelopeModalState({
                  isOpen: true,
                  mode: 'create',
                  category: null,
                  monthKey: envelopeSelectedMonth,
                  existingEnvelope: null,
                  scope: 'all_recurring',
                })
              }
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow-sm transition inline-flex items-center space-x-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Programar Primeiro Envelope</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {currentEnvelopesData.envelopes.map((env) => {
              const cat = env.category;
              const barColor = env.isOver ? '#ef4444' : env.percentage >= 80 ? '#f59e0b' : '#10b981';

              return (
                <div
                  key={cat.id}
                  className={`p-4 rounded-2xl border transition shadow-xs flex flex-col justify-between space-y-3 ${
                    env.isOver
                      ? 'bg-rose-50/40 border-rose-200 ring-1 ring-rose-200'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {/* Topo do Card: Categoria, Tag de Recorrência e Botões */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="w-3.5 h-3.5 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                      <div>
                        <h4 className="font-bold text-sm text-slate-900">{cat.name}</h4>
                        {env.hasRecurringSchedule && (
                          <span className="text-[10px] font-semibold text-blue-600 bg-blue-50 px-1.5 py-0.2 rounded border border-blue-100 inline-block">
                            🗓️ Programado
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-1">
                      <button
                        type="button"
                        onClick={() =>
                          setEnvelopeModalState({
                            isOpen: true,
                            mode: 'edit',
                            category: cat,
                            monthKey: envelopeSelectedMonth,
                            existingEnvelope: env,
                            scope: env.hasRecurringSchedule ? 'all_recurring' : 'this_only',
                          })
                        }
                        className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition cursor-pointer"
                        title="Ajustar teto / programação do envelope"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setDeleteEnvelopeModalState({
                            isOpen: true,
                            envelope: env,
                            scope: env.hasRecurringSchedule ? 'all_recurring' : 'this_only',
                          })
                        }
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                        title="Excluir envelope deste mês ou da programação"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Barra de Progresso */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-slate-600">
                        Gasto: <strong className="text-slate-900">{formatMoney(env.spentCents)}</strong>
                      </span>
                      <span className="text-slate-500">
                        Teto: <strong className="text-slate-800">{formatMoney(env.allocatedCents)}</strong>
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{
                          width: `${Math.min(100, env.percentage)}%`,
                          backgroundColor: barColor,
                        }}
                      />
                    </div>
                  </div>

                  {/* Rodapé do Card: Situação / Restante / Alerta de Estouro */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-500">
                      {env.percentage.toFixed(0)}% consumido
                    </span>
                    {env.isOver ? (
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-300">
                        🚨 Ultrapassou {formatMoney(env.overspentCents)}
                      </span>
                    ) : env.remainingCents === 0 ? (
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                        Teto Atingido
                      </span>
                    ) : (
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                        ✓ {formatMoney(env.remainingCents)} disponíveis
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
