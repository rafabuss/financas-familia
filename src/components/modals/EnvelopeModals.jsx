import React from 'react';
import { Mail, Plus, Trash2, AlertTriangle, X, Calendar } from 'lucide-react';
import { formatMoney, formatMonthLabel } from '../../utils/formatters';

export function EnvelopeScheduleModal({
  envelopeModalState,
  setEnvelopeModalState,
  categories = [],
  monthlyEnvelopes = [],
  envelopeSelectedMonth = '',
  currentActualMonth = '',
  handleSaveEnvelopeSchedule,
}) {
  return (
    <>
      {envelopeModalState.isOpen && (() => {
        const isEditing = envelopeModalState.mode === 'edit';
        const initialCatId =
          envelopeModalState.category?.id ||
          categories.find((c) => !c.archived && c.type === 'EXPENSE')?.id ||
          '';
        const initialMonth =
          envelopeModalState.monthKey || envelopeSelectedMonth || currentActualMonth;
        const initialAmount = envelopeModalState.existingEnvelope
          ? (envelopeModalState.existingEnvelope.allocatedCents / 100).toFixed(2)
          : envelopeModalState.category?.budgetLimitCents
          ? (envelopeModalState.category.budgetLimitCents / 100).toFixed(2)
          : '';

        const hasRecurrence =
          envelopeModalState.existingEnvelope?.hasRecurringSchedule ||
          Boolean(envelopeModalState.existingEnvelope?.envelopeEntry?.ruleId);

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
            <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center space-x-2.5">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 text-lg">
                    ✉️
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">
                      {isEditing ? 'Ajustar Teto do Envelope' : 'Programar Teto / Envelope'}
                    </h3>
                    <p className="text-xs text-slate-500">
                      Defina um limite mensal e programe por múltiplos meses
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setEnvelopeModalState({
                      isOpen: false,
                      mode: 'create',
                      category: null,
                      monthKey: '',
                      existingEnvelope: null,
                      scope: 'all',
                    })
                  }
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const fd = new FormData(e.target);
                  const categoryId = fd.get('categoryId');
                  const amountRaw = fd.get('amount');
                  const amountCents = Math.round(parseFloat(amountRaw || '0') * 100);
                  const startMonth = fd.get('startMonth');
                  const durationMonths = parseInt(fd.get('durationMonths') || '1', 10);
                  const scope = fd.get('scope') || 'all_recurring';

                  handleSaveEnvelopeSchedule({
                    categoryId,
                    amountCents,
                    startMonth,
                    durationMonths,
                    scope,
                    existingEnvelope: envelopeModalState.existingEnvelope,
                  });
                }}
                className="pt-4 space-y-4"
              >
                {/* Seleção de Categoria */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Categoria Despesa
                  </label>
                  <select
                    name="categoryId"
                    defaultValue={initialCatId}
                    disabled={isEditing}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-slate-900 focus:bg-white focus:border-blue-500 focus:outline-none transition disabled:opacity-75"
                    required
                  >
                    {categories
                      .filter((c) => !c.parentId && !c.archived && c.type === 'EXPENSE')
                      .map((parent) => {
                        const children = categories.filter((c) => c.parentId === parent.id && !c.archived && c.type === 'EXPENSE');
                        if (children.length === 0) {
                          return (
                            <option key={parent.id} value={parent.id}>
                              {parent.name}
                            </option>
                          );
                        }
                        return (
                          <optgroup key={parent.id} label={`📁 ${parent.name}`}>
                            <option value={parent.id}>{parent.name} (Geral / Categoria Principal)</option>
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

                {/* Mês Inicial e Valor do Teto */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Mês de Referência
                    </label>
                    <input
                      type="month"
                      name="startMonth"
                      defaultValue={initialMonth}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-slate-900 focus:bg-white focus:border-blue-500 focus:outline-none transition"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Teto Mensal (R$)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      name="amount"
                      defaultValue={initialAmount}
                      placeholder="Ex: 800.00"
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm font-bold text-slate-900 focus:bg-white focus:border-blue-500 focus:outline-none transition"
                      required
                      autoFocus
                    />
                  </div>
                </div>

                {/* Duração / Período da Programação */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Programar por Quanto Tempo?
                  </label>
                  <select
                    name="durationMonths"
                    defaultValue={isEditing ? '1' : '12'}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-slate-900 focus:bg-white focus:border-blue-500 focus:outline-none transition"
                  >
                    <option value="1">Apenas no mês selecionado (1 mês)</option>
                    <option value="3">Próximos 3 Meses</option>
                    <option value="6">Próximos 6 Meses</option>
                    <option value="12">12 Meses (1 Ano)</option>
                    <option value="24">24 Meses (2 Anos)</option>
                    <option value="36">36 Meses (3 Anos)</option>
                  </select>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Gera tetos automáticos para os meses selecionados, permitindo que as projeções financeiras reflitam esse compromisso.
                  </p>
                </div>

                {/* Opções de Escopo se estiver editando */}
                {isEditing && (
                  <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-xl space-y-2">
                    <label className="block text-xs font-bold text-blue-950 uppercase tracking-wider">
                      Aplicar alteração para:
                    </label>
                    <div className="space-y-1.5 text-xs">
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="radio"
                          name="scope"
                          value="this_only"
                          defaultChecked={!hasRecurrence}
                          className="text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-slate-800 font-medium">
                          Apenas neste mês ({formatMonthLabel(initialMonth)})
                        </span>
                      </label>
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="radio"
                          name="scope"
                          value="from_now_on"
                          className="text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-slate-800 font-medium">
                          Deste mês ({formatMonthLabel(initialMonth)}) em diante
                        </span>
                      </label>
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="radio"
                          name="scope"
                          value="all_recurring"
                          defaultChecked={hasRecurrence}
                          className="text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-slate-800 font-medium">
                          Todos os meses da programação
                        </span>
                      </label>
                    </div>
                  </div>
                )}

                <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() =>
                      setEnvelopeModalState({
                        isOpen: false,
                        mode: 'create',
                        category: null,
                        monthKey: '',
                        existingEnvelope: null,
                        scope: 'all',
                      })
                    }
                    className="px-4 py-2 border border-slate-300 rounded-xl text-xs sm:text-sm font-medium text-slate-700 hover:bg-slate-50 transition"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs sm:text-sm font-semibold transition active:scale-95 shadow-sm"
                  >
                    {isEditing ? 'Salvar Alterações' : 'Salvar Programação'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        );
      })()}

      {/* Modal de Exclusão de Envelope com Escopo em Lote */}

    </>
  );
}

export function DeleteEnvelopeModal({
  deleteEnvelopeModalState,
  setDeleteEnvelopeModalState,
  monthlyEnvelopes = [],
  handleConfirmDeleteEnvelope,
}) {
  return (
    <>
      {deleteEnvelopeModalState.isOpen && deleteEnvelopeModalState.envelope && (() => {
        const env = deleteEnvelopeModalState.envelope;
        const cat = env.category;
        const targetMonth = env.monthKey;
        const ruleId = env.envelopeEntry?.ruleId;

        const totalEntriesCount = monthlyEnvelopes.filter(
          (m) => m.categoryId === cat.id && (ruleId ? m.ruleId === ruleId : true)
        ).length;

        const isMultiMonth = totalEntriesCount > 1 || Boolean(ruleId) || (cat.budgetLimitCents > 0);

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center space-x-2.5">
                  <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                    <Trash2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">Excluir Envelope</h3>
                    <p className="text-xs text-slate-500">
                      {cat.name} • {formatMonthLabel(targetMonth)}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setDeleteEnvelopeModalState({
                      isOpen: false,
                      envelope: null,
                      scope: 'this_only',
                    })
                  }
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="pt-4 space-y-4">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Categoria:</span>
                    <strong className="text-slate-800">{cat.name}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Teto Atual:</span>
                    <strong className="text-slate-900">{formatMoney(env.allocatedCents)}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Mês de Referência:</span>
                    <span className="font-semibold text-slate-700 capitalize">
                      {formatMonthLabel(targetMonth)}
                    </span>
                  </div>
                </div>

                {isMultiMonth ? (
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Escolha o escopo da exclusão:
                    </label>
                    <div className="space-y-2">
                      <label className="flex items-start space-x-2.5 p-2.5 border rounded-xl cursor-pointer hover:bg-slate-50 transition">
                        <input
                          type="radio"
                          name="deleteEnvelopeScope"
                          value="this_only"
                          checked={deleteEnvelopeModalState.scope === 'this_only'}
                          onChange={(e) =>
                            setDeleteEnvelopeModalState((prev) => ({
                              ...prev,
                              scope: e.target.value,
                            }))
                          }
                          className="mt-0.5 text-rose-600 focus:ring-rose-500"
                        />
                        <div className="text-xs">
                          <strong className="text-slate-900 block">
                            Apenas neste mês ({formatMonthLabel(targetMonth)})
                          </strong>
                          <span className="text-slate-500">
                            Zera o envelope deste mês sem alterar os outros meses programados.
                          </span>
                        </div>
                      </label>

                      <label className="flex items-start space-x-2.5 p-2.5 border rounded-xl cursor-pointer hover:bg-slate-50 transition">
                        <input
                          type="radio"
                          name="deleteEnvelopeScope"
                          value="from_now_on"
                          checked={deleteEnvelopeModalState.scope === 'from_now_on'}
                          onChange={(e) =>
                            setDeleteEnvelopeModalState((prev) => ({
                              ...prev,
                              scope: e.target.value,
                            }))
                          }
                          className="mt-0.5 text-rose-600 focus:ring-rose-500"
                        />
                        <div className="text-xs">
                          <strong className="text-slate-900 block">Deste mês em diante</strong>
                          <span className="text-slate-500">
                            Exclui os tetos deste mês e de todos os meses futuros.
                          </span>
                        </div>
                      </label>

                      <label className="flex items-start space-x-2.5 p-2.5 border rounded-xl cursor-pointer hover:bg-slate-50 transition">
                        <input
                          type="radio"
                          name="deleteEnvelopeScope"
                          value="before_this"
                          checked={deleteEnvelopeModalState.scope === 'before_this'}
                          onChange={(e) =>
                            setDeleteEnvelopeModalState((prev) => ({
                              ...prev,
                              scope: e.target.value,
                            }))
                          }
                          className="mt-0.5 text-rose-600 focus:ring-rose-500"
                        />
                        <div className="text-xs">
                          <strong className="text-slate-900 block">
                            Apenas os meses anteriores
                          </strong>
                          <span className="text-slate-500">
                            Apaga os registros passados, mantendo este mês e os futuros intactos.
                          </span>
                        </div>
                      </label>

                      <label className="flex items-start space-x-2.5 p-2.5 border rounded-xl cursor-pointer hover:bg-slate-50 transition">
                        <input
                          type="radio"
                          name="deleteEnvelopeScope"
                          value="all_recurring"
                          checked={deleteEnvelopeModalState.scope === 'all_recurring'}
                          onChange={(e) =>
                            setDeleteEnvelopeModalState((prev) => ({
                              ...prev,
                              scope: e.target.value,
                            }))
                          }
                          className="mt-0.5 text-rose-600 focus:ring-rose-500"
                        />
                        <div className="text-xs">
                          <strong className="text-slate-900 block">
                            Toda a programação (todos os meses)
                          </strong>
                          <span className="text-slate-500">
                            Remove completamente o teto programado para esta categoria.
                          </span>
                        </div>
                      </label>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-slate-600">
                    Tem certeza de que deseja remover o envelope desta categoria para o mês de{' '}
                    {formatMonthLabel(targetMonth)}?
                  </p>
                )}

                <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() =>
                      setDeleteEnvelopeModalState({
                        isOpen: false,
                        envelope: null,
                        scope: 'this_only',
                      })
                    }
                    className="px-4 py-2 border border-slate-300 rounded-xl text-xs sm:text-sm font-medium text-slate-700 hover:bg-slate-50 transition"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmDeleteEnvelope}
                    className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs sm:text-sm font-semibold transition active:scale-95 shadow-sm flex items-center space-x-1.5"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Confirmar Exclusão</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Modal de Validação / Resolução de Conflito de Tetos (Categoria Pai x Subcategoria) */}

    </>
  );
}

export function CategoryConflictModal({
  categoryConflictModal,
  setCategoryConflictModal,
  handleResolveCategoryConflict,
}) {
  return (
    <>
      {categoryConflictModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center space-x-3 pb-3 border-b border-slate-100">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Ajuste de Teto do Envelope</h3>
                <p className="text-xs text-slate-500">Regra de hierarquia entre Categoria Pai e Subcategoria</p>
              </div>
            </div>

            <div className="space-y-3 text-xs text-slate-600">
              <p>
                O teto definido para a subcategoria <strong className="text-slate-900 font-semibold">{categoryConflictModal.childName}</strong> (<strong>{formatMoney(categoryConflictModal.childAttemptedCents)}</strong>), somado às outras subcategorias já cadastradas (<strong>{formatMoney(categoryConflictModal.currentSiblingsSum)}</strong>), totaliza <strong className="text-rose-700 font-bold">{formatMoney(categoryConflictModal.suggestedParentCents)}</strong>.
              </p>
              <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-xl space-y-1">
                <div className="flex justify-between">
                  <span>Categoria Pai:</span>
                  <strong className="text-slate-800">{categoryConflictModal.parentName}</strong>
                </div>
                <div className="flex justify-between">
                  <span>Teto atual da Categoria Pai:</span>
                  <strong className="text-slate-800">{formatMoney(categoryConflictModal.parentCurrentCents)}</strong>
                </div>
                <div className="flex justify-between">
                  <span>Saldo disponível restante para subcategorias:</span>
                  <strong className="text-emerald-700 font-bold">{formatMoney(categoryConflictModal.maxAvailableChildCents)}</strong>
                </div>
              </div>
              <p className="font-semibold text-slate-800">
                Como você deseja definir os tetos dos envelopes?
              </p>
            </div>

            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={() => handleResolveCategoryConflict('EXPAND_PARENT')}
                className="w-full text-left p-3 rounded-xl border border-blue-200 hover:border-blue-400 bg-blue-50/60 hover:bg-blue-50 transition flex items-start space-x-3 group"
              >
                <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                  A
                </span>
                <div className="text-xs">
                  <strong className="text-blue-900 font-bold block group-hover:underline">
                    Aumentar o teto da Categoria Pai para {formatMoney(categoryConflictModal.suggestedParentCents)}
                  </strong>
                  <span className="text-slate-600">
                    Expande o limite de "{categoryConflictModal.parentName}" para comportar integralmente o novo teto desta subcategoria.
                  </span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleResolveCategoryConflict('ADJUST_CHILD')}
                className="w-full text-left p-3 rounded-xl border border-slate-200 hover:border-slate-400 bg-slate-50 hover:bg-white transition flex items-start space-x-3 group"
              >
                <span className="w-6 h-6 rounded-full bg-slate-600 text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                  B
                </span>
                <div className="text-xs">
                  <strong className="text-slate-900 font-bold block group-hover:underline">
                    Ajustar o teto da subcategoria para {formatMoney(categoryConflictModal.maxAvailableChildCents)}
                  </strong>
                  <span className="text-slate-600">
                    Mantém o teto da categoria pai intacto e limita "{categoryConflictModal.childName}" ao saldo restante ainda disponível.
                  </span>
                </div>
              </button>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setCategoryConflictModal({ isOpen: false })}
                className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-medium text-slate-700 hover:bg-slate-50 transition"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}


    </>
  );
}
