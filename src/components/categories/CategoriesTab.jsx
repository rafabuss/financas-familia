import React from 'react';
import {
  Plus,
  Edit2,
  Archive,
  Trash2,
} from 'lucide-react';
import { formatMoney } from '../../utils/formatters';

export default function CategoriesTab({
  categories = [],
  setModalState,
  toggleArchiveCategory,
  handleDeleteCategory,
}) {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Categorias Financeiras</h2>
          <p className="text-xs text-slate-500">Centros de custo da família</p>
        </div>
        <button
          onClick={() => setModalState({ isOpen: true, type: 'category', mode: 'create', data: null })}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center space-x-1 cursor-pointer shadow-sm transition active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Nova Categoria</span>
        </button>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {categories
            .filter((c) => !c.parentId)
            .map((cat) => {
              const subcategories = categories.filter((c) => c.parentId === cat.id);
              const subBudgetSum = subcategories.reduce((acc, s) => acc + (s.budgetLimitCents || 0), 0);

              return (
                <div
                  key={cat.id}
                  className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between space-y-3"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center space-x-3">
                        <span className="w-4 h-4 rounded-full shrink-0 shadow-xs" style={{ backgroundColor: cat.color }} />
                        <div>
                          <h4 className="font-bold text-sm sm:text-base text-slate-900">{cat.name}</h4>
                          <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                            <span className="text-[10px] uppercase font-bold text-slate-400">
                              {cat.type === 'INCOME' ? 'Receita' : 'Despesa'}
                            </span>
                            {cat.budgetLimitCents > 0 && (
                              <span className="text-[10px] font-bold px-1.5 py-0.2 bg-blue-50 text-blue-700 border border-blue-200 rounded">
                                ✉️ Teto: {formatMoney(cat.budgetLimitCents)}/mês
                              </span>
                            )}
                            {subcategories.length > 0 && (
                              <span className="text-[10px] font-semibold px-1.5 py-0.2 bg-slate-100 text-slate-600 rounded">
                                {subcategories.length} subcategoria{subcategories.length > 1 ? 's' : ''}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => setModalState({ isOpen: true, type: 'category', mode: 'create', data: { parentId: cat.id, type: cat.type } })}
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition cursor-pointer"
                          title="Adicionar Subcategoria sob esta categoria"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setModalState({ isOpen: true, type: 'category', mode: 'edit', data: cat })}
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition cursor-pointer"
                          title="Editar Categoria"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => toggleArchiveCategory(cat.id)}
                          className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition cursor-pointer"
                          title={cat.archived ? 'Desarquivar' : 'Arquivar'}
                        >
                          <Archive className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteCategory(cat)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                          title="Excluir Definitivamente"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Lista Aninhada de Subcategorias */}
                    {subcategories.length > 0 && (
                      <div className="mt-3.5 pt-3 border-t border-slate-100 space-y-2">
                        <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                          <span>Subcategorias</span>
                          {cat.budgetLimitCents > 0 && (
                            <span className="text-[10px] text-slate-400 font-normal">
                              Subtotal alocado: {formatMoney(subBudgetSum)} / {formatMoney(cat.budgetLimitCents)}
                            </span>
                          )}
                        </div>
                        <div className="space-y-1.5">
                          {subcategories.map((sub) => (
                            <div
                              key={sub.id}
                              className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-100 text-xs hover:bg-slate-100/70 transition"
                            >
                              <div className="flex items-center space-x-2">
                                <span className="text-slate-400 font-bold">↳</span>
                                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: sub.color }} />
                                <span className="font-semibold text-slate-800">{sub.name}</span>
                                {sub.budgetLimitCents > 0 && (
                                  <span className="text-[10px] font-bold px-1.5 py-0.2 bg-blue-100/70 text-blue-800 rounded">
                                    ✉️ {formatMoney(sub.budgetLimitCents)}/mês
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center space-x-1">
                                <button
                                  type="button"
                                  onClick={() => setModalState({ isOpen: true, type: 'category', mode: 'edit', data: sub })}
                                  className="p-1 text-slate-400 hover:text-blue-600 rounded transition cursor-pointer"
                                  title="Editar Subcategoria"
                                >
                                  <Edit2 className="w-3 h-3" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteCategory(sub)}
                                  className="p-1 text-slate-400 hover:text-rose-600 rounded transition cursor-pointer"
                                  title="Excluir Subcategoria"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
}
