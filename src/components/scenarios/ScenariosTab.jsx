import React from 'react';
import {
  Plus,
  Edit2,
  Trash2,
  Sliders,
} from 'lucide-react';
import { formatMoney } from '../../utils/formatters';

export default function ScenariosTab({
  scenarios = [],
  setScenarios,
  categories = [],
  accounts = [],
  cards = [],
  setModalSourceType,
  setModalState,
  handleDeleteScenario,
  handleConvertScenarioToReal,
}) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Cenários & Simulações "What-If"</h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Simule grandes decisões (compras, financiamentos, renda extra) sem contaminar seus lançamentos reais.
          </p>
        </div>

        <button
          onClick={() => {
            if (setModalSourceType) setModalSourceType('ACCOUNT');
            setModalState({ isOpen: true, type: 'scenario', mode: 'create', data: null });
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs sm:text-sm px-4 py-2 rounded-lg flex items-center space-x-1.5 shadow-sm transition active:scale-95 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Novo Cenário</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {scenarios.map((scen) => {
          const isExpense = scen.monthlyImpactCents < 0;
          const absAmount = Math.abs(scen.monthlyImpactCents);

          return (
            <div
              key={scen.id}
              className={`bg-white rounded-2xl border-2 p-6 shadow-sm flex flex-col justify-between transition-all ${
                scen.active ? 'border-blue-500 shadow-blue-50' : 'border-slate-200'
              }`}
            >
              <div>
                {/* Topo do Card */}
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-blue-600 font-bold text-lg">✨</span>
                    <h3 className="font-bold text-slate-900 text-base">{scen.title}</h3>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded tracking-wider uppercase ${
                        isExpense ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'
                      }`}
                    >
                      {isExpense ? 'Despesa' : 'Receita'}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        if (setModalSourceType) setModalSourceType(scen.sourceType || (scen.cardId ? 'CARD' : 'ACCOUNT'));
                        setModalState({ isOpen: true, type: 'scenario', mode: 'edit', data: scen });
                      }}
                      className="p-1 text-slate-400 hover:text-blue-600 rounded transition cursor-pointer"
                      title="Editar Cenário"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteScenario(scen)}
                      className="p-1 text-slate-400 hover:text-rose-600 rounded transition cursor-pointer"
                      title="Excluir Cenário"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <p className="text-xs text-slate-400 mb-5">
                  {isExpense ? 'Parcela estimada de' : 'Previsão de'} {formatMoney(absAmount)} por {scen.months} meses
                </p>

                {/* Informações Centrais */}
                <div className="space-y-2 text-xs text-slate-500 py-3 border-y border-slate-100">
                  <div className="flex justify-between">
                    <span>Impacto Mensal:</span>
                    <strong className="text-slate-900 font-semibold">{formatMoney(absAmount)}/mês</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Duração Prevista:</span>
                    <strong className="text-slate-900 font-semibold">{scen.months} meses</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>A partir de:</span>
                    <strong className="text-slate-900 font-semibold">
                      {scen.startDate
                        ? new Date(scen.startDate + 'T12:00:00').toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })
                        : 'set de 2026'}
                    </strong>
                  </div>
                  {scen.categoryId && (
                    <div className="flex justify-between">
                      <span>Categoria:</span>
                      <strong className="text-slate-900 font-semibold">
                        {categories.find((c) => c.id === scen.categoryId)?.name || '-'}
                      </strong>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>Origem Prevista:</span>
                    <strong className="text-slate-900 font-semibold">
                      {scen.cardId
                        ? `Cartão: ${cards.find((c) => c.id === scen.cardId)?.name || 'Cartão'}`
                        : `Conta: ${accounts.find((a) => a.id === scen.accountId)?.name || 'Conta Corrente'}`}
                    </strong>
                  </div>
                </div>

                {/* Ajustes no Fluxo Real (Cortes e Supressões) */}
                {scen.adjustments && (
                  (scen.adjustments.ignoredIncomes?.length > 0) ||
                  (scen.adjustments.ignoredExpenses?.length > 0) ||
                  (scen.adjustments.categoryReductions?.length > 0)
                ) && (
                  <div className="mt-3 p-2.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5 text-xs">
                    <span className="font-bold text-slate-700 flex items-center space-x-1">
                      <Sliders className="w-3 h-3 text-blue-600" />
                      <span>Ajustes no fluxo real:</span>
                    </span>
                    {scen.adjustments.ignoredIncomes?.map((inc, i) => (
                      <div key={i} className="flex items-center justify-between text-rose-700 bg-rose-50/80 px-2 py-0.5 rounded">
                        <span className="truncate">🔴 Suspender: {inc.description || inc}</span>
                        {inc.amountCents ? <span className="font-semibold shrink-0 ml-1">-{formatMoney(inc.amountCents)}</span> : null}
                      </div>
                    ))}
                    {scen.adjustments.ignoredExpenses?.map((exp, i) => (
                      <div key={i} className="flex items-center justify-between text-emerald-700 bg-emerald-50/80 px-2 py-0.5 rounded">
                        <span className="truncate">🟢 Cortar: {exp.description || exp}</span>
                        {exp.amountCents ? <span className="font-semibold shrink-0 ml-1">-{formatMoney(exp.amountCents)}</span> : null}
                      </div>
                    ))}
                    {scen.adjustments.categoryReductions?.map((red, i) => (
                      <div key={i} className="flex items-center justify-between text-indigo-700 bg-indigo-50/80 px-2 py-0.5 rounded">
                        <span className="truncate">✂️ Teto: {categories.find((c) => c.id === red.categoryId)?.name || 'Categoria'}</span>
                        <span className="font-semibold shrink-0 ml-1">-{formatMoney(red.amountCents)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Rodapé com Toggle e Botão de Conversão */}
              <div className="mt-5 pt-2 flex items-center justify-between">
                <label className="flex items-center space-x-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={scen.active}
                    onChange={() => {
                      setScenarios((prev) =>
                        prev.map((s) => (s.id === scen.id ? { ...s, active: !s.active } : s))
                      );
                    }}
                    className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4"
                  />
                  <span className={`text-xs font-semibold ${scen.active ? 'text-blue-600' : 'text-slate-500'}`}>
                    {scen.active ? 'Ativo na Projeção' : 'Desativado'}
                  </span>
                </label>

                <button
                  type="button"
                  onClick={() => handleConvertScenarioToReal(scen)}
                  className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-blue-200 text-blue-600 hover:bg-blue-50 transition active:scale-95 shadow-sm cursor-pointer"
                >
                  Converter em Real
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
