import React from 'react';
import { X } from 'lucide-react';
import { FAMILY_MEMBERS } from '../../data/constants';

export default function EntityModal({
  modalState,
  setModalState,
  categories = [],
  accounts = [],
  cards = [],
  handleSaveScenario,
  handleSaveAccount,
  handleSaveCard,
  handleSaveCategory,
}) {
  if (!modalState.isOpen || !['account', 'card', 'category', 'scenario'].includes(modalState.type)) {
    return null;
  }

  return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-base text-slate-900">
                {modalState.mode === 'edit' ? 'Editar' : 'Cadastrar'}{' '}
                {modalState.type === 'account' && 'Conta / Carteira'}
                {modalState.type === 'card' && 'Cartão de Crédito'}
                {modalState.type === 'category' && 'Categoria'}
                {modalState.type === 'transaction' && 'Lançamento'}
                {modalState.type === 'scenario' && 'Cenário de Simulação'}
              </h3>
              <button
                onClick={() => setModalState({ isOpen: false, type: null, mode: 'create', data: null })}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-md"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* FORMULÁRIO: NOVO / EDITAR CENÁRIO */}
            {modalState.type === 'scenario' && (
              <form onSubmit={handleSaveScenario} className="p-6 space-y-4 overflow-y-auto">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Título do Cenário / Simulação</label>
                  <input
                    type="text"
                    name="title"
                    required
                    defaultValue={modalState.data?.title || ''}
                    placeholder="Ex: Reforma da Cozinha, Compra de Celular, Nova Consultoria"
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Tipo de Impacto</label>
                    <select
                      name="type"
                      defaultValue={modalState.data?.type || (modalState.data?.monthlyImpactCents < 0 ? 'EXPENSE' : 'EXPENSE')}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    >
                      <option value="EXPENSE">Despesa (Gasto Mensal)</option>
                      <option value="INCOME">Receita (Ganho Mensal)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Valor Mensal (R$)</label>
                    <input
                      type="number"
                      step="0.01"
                      name="amount"
                      required
                      defaultValue={modalState.data ? (Math.abs(modalState.data.monthlyImpactCents) / 100).toFixed(2) : ''}
                      placeholder="0,00"
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Duração (Meses)</label>
                    <input
                      type="number"
                      min="1"
                      max="60"
                      name="months"
                      defaultValue={modalState.data?.months || 12}
                      required
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Data de Início</label>
                    <input
                      type="date"
                      name="startDate"
                      required
                      defaultValue={modalState.data?.startDate || new Date().toISOString().slice(0, 10)}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Categoria Prevista</label>
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
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Forma / Origem Prevista</label>
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
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Conta Bancária Prevista</label>
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
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Cartão de Crédito Previsto</label>
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

                {/* Seletor de Escopo: Familiar vs Pessoal */}
                <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Escopo do Cenário</label>
                    <select
                      name="scope"
                      defaultValue={modalState.data?.scope || 'FAMILY'}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
                    >
                      <option value="FAMILY">Familiar (Visível a todos)</option>
                      <option value="PERSONAL">Individual / Pessoal (Privado)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Responsável / Titular</label>
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

                {/* Campo oculto com as regras de cortes e supressões do What-If */}
                <input
                  type="hidden"
                  name="adjustmentsJson"
                  value={JSON.stringify(modalState.data?.adjustments || { ignoredIncomes: [], ignoredExpenses: [], categoryReductions: [] })}
                />

                {/* Exibição informativa dos cortes associados a este cenário */}
                {modalState.data?.adjustments && (
                  (modalState.data.adjustments.ignoredIncomes?.length > 0) ||
                  (modalState.data.adjustments.ignoredExpenses?.length > 0) ||
                  (modalState.data.adjustments.categoryReductions?.length > 0)
                ) && (
                  <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-xl space-y-2">
                    <div className="flex items-center space-x-1.5 text-xs font-bold text-amber-900">
                      <span>✂️</span>
                      <span>Cortes & Supressões incluídos neste Cenário:</span>
                    </div>
                    <div className="space-y-1.5 text-xs max-h-40 overflow-y-auto pr-1">
                      {modalState.data.adjustments.ignoredIncomes?.map((inc, i) => (
                        <div key={i} className="flex items-center justify-between bg-white/90 p-2 rounded border border-rose-200 text-rose-800">
                          <span className="truncate">🔴 Desconsiderar Receita: <strong>{inc.description}</strong></span>
                          {inc.amountCents ? <span className="font-bold shrink-0 ml-1">-{formatMoney(inc.amountCents)}/mês</span> : null}
                        </div>
                      ))}
                      {modalState.data.adjustments.ignoredExpenses?.map((exp, i) => (
                        <div key={i} className="flex items-center justify-between bg-white/90 p-2 rounded border border-emerald-200 text-emerald-800">
                          <span className="truncate">🟢 Cortar Despesa: <strong>{exp.description}</strong></span>
                          {exp.amountCents ? <span className="font-bold shrink-0 ml-1">-{formatMoney(exp.amountCents)}/mês</span> : null}
                        </div>
                      ))}
                      {modalState.data.adjustments.categoryReductions?.map((red, i) => (
                        <div key={i} className="flex items-center justify-between bg-white/90 p-2 rounded border border-indigo-200 text-indigo-800">
                          <span className="truncate">✂️ Reduzir Categoria: <strong>{categories.find((c) => c.id === red.categoryId)?.name || 'Categoria'}</strong></span>
                          <span className="font-bold shrink-0 ml-1">-{formatMoney(red.amountCents)}/mês</span>
                        </div>
                      ))}
                    </div>
                    <p className="text-[11px] text-amber-700 italic">
                      Essas regras serão aplicadas na Projeção do Fluxo de Caixa sempre que este cenário estiver ativo, sem alterar transações passadas.
                    </p>
                  </div>
                )}

                <div className="pt-4 border-t border-slate-100 flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setModalState({ isOpen: false, type: null, mode: 'create', data: null, scenarioIdToConvert: null })}
                    className="px-4 py-2 border border-slate-300 rounded-lg text-sm text-slate-700 hover:bg-slate-50"
                  >
                    Cancelar
                  </button>
                  <button type="submit" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold">
                    Salvar Cenário
                  </button>
                </div>
              </form>
            )}

            {/* FORMULÁRIO: CONTA */}
            {modalState.type === 'account' && (
              <form onSubmit={handleSaveAccount} className="p-6 space-y-4 overflow-y-auto">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Nome da Conta / Carteira</label>
                  <input
                    type="text"
                    name="name"
                    required
                    defaultValue={modalState.data?.name || ''}
                    placeholder="Ex: Conta Corrente Principal, Reserva"
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Instituição Bancária</label>
                    <input
                      type="text"
                      name="bank"
                      required
                      defaultValue={modalState.data?.bank || ''}
                      placeholder="Ex: Nubank, Itaú, Banco do Brasil"
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Tipo de Conta</label>
                    <select
                      name="type"
                      defaultValue={modalState.data?.type || 'corrente'}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    >
                      <option value="corrente">Conta Corrente</option>
                      <option value="poupanca">Poupança</option>
                      <option value="investimento">Investimento</option>
                      <option value="dinheiro">Carteira / Dinheiro Físico</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Saldo Inicial (R$)</label>
                    <input
                      type="number"
                      step="0.01"
                      name="initialBalance"
                      required
                      defaultValue={modalState.data ? (modalState.data.initialBalanceCents / 100).toFixed(2) : '0.00'}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Titular Responsável</label>
                    <input
                      type="text"
                      name="holder"
                      defaultValue={modalState.data?.holder || 'Família'}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setModalState({ isOpen: false, type: null, mode: 'create', data: null })}
                    className="px-4 py-2 border border-slate-300 rounded-lg text-sm text-slate-700 hover:bg-slate-50"
                  >
                    Cancelar
                  </button>
                  <button type="submit" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold">
                    Salvar Conta
                  </button>
                </div>
              </form>
            )}

            {/* FORMULÁRIO: CARTÃO */}
            {modalState.type === 'card' && (
              <form onSubmit={handleSaveCard} className="p-6 space-y-4 overflow-y-auto">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Nome do Cartão</label>
                  <input
                    type="text"
                    name="name"
                    required
                    defaultValue={modalState.data?.name || ''}
                    placeholder="Ex: Nubank Ultravioleta, XP Infinite"
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Banco Emissor</label>
                    <input
                      type="text"
                      name="bank"
                      required
                      defaultValue={modalState.data?.bank || ''}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Bandeira</label>
                    <input
                      type="text"
                      name="flag"
                      defaultValue={modalState.data?.flag || 'Mastercard'}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Limite Total (R$)</label>
                    <input
                      type="number"
                      step="0.01"
                      name="limit"
                      required
                      defaultValue={modalState.data ? (modalState.data.limitCents / 100).toFixed(2) : '5000.00'}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Dia Fechamento</label>
                    <input
                      type="number"
                      min="1"
                      max="31"
                      name="closingDay"
                      required
                      defaultValue={modalState.data?.closingDay || '25'}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Dia Vencimento</label>
                    <input
                      type="number"
                      min="1"
                      max="31"
                      name="dueDay"
                      required
                      defaultValue={modalState.data?.dueDay || '5'}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setModalState({ isOpen: false, type: null, mode: 'create', data: null })}
                    className="px-4 py-2 border border-slate-300 rounded-lg text-sm text-slate-700 hover:bg-slate-50"
                  >
                    Cancelar
                  </button>
                  <button type="submit" className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-semibold">
                    Salvar Cartão
                  </button>
                </div>
              </form>
            )}

            {/* FORMULÁRIO: CATEGORIA */}
            {modalState.type === 'category' && (
              <form onSubmit={handleSaveCategory} className="p-6 space-y-4 overflow-y-auto">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Nome da Categoria</label>
                  <input
                    type="text"
                    name="name"
                    required
                    defaultValue={modalState.data?.name || ''}
                    placeholder="Ex: Supermercado, Educação, Aluguel"
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
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
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Cor</label>
                    <input
                      type="color"
                      name="color"
                      defaultValue={modalState.data?.color || '#2563eb'}
                      className="w-full h-10 p-1 border border-slate-300 rounded-lg cursor-pointer"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Categoria Pai (Opcional - para transformar em Subcategoria)
                  </label>
                  <select
                    name="parentId"
                    defaultValue={modalState.data?.parentId || ''}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="">Nenhuma (Categoria Principal)</option>
                    {categories
                      .filter((c) => !c.archived && !c.parentId && c.id !== modalState.data?.id)
                      .map((parent) => (
                        <option key={parent.id} value={parent.id}>
                          📁 {parent.name} {parent.budgetLimitCents > 0 ? `(Teto atual: ${formatMoney(parent.budgetLimitCents)})` : ''}
                        </option>
                      ))}
                  </select>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Ao vincular a uma categoria pai, esta categoria funcionará como uma subcategoria subordinada (ex: Combustível dentro de Transporte).
                  </p>
                </div>

                <div className="p-3 bg-blue-50/70 border border-blue-100 rounded-xl space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-slate-800">
                      Teto Mensal do Envelope (Orçamento)
                    </label>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 bg-blue-100/80 px-2 py-0.5 rounded-full">
                      ✉️ Método dos Envelopes
                    </span>
                  </div>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-sm text-slate-500 font-bold">R$</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      name="budgetLimit"
                      defaultValue={modalState.data?.budgetLimitCents ? (modalState.data.budgetLimitCents / 100).toFixed(2) : ''}
                      placeholder="0,00 (Sem teto definido)"
                      className="w-full border border-slate-300 rounded-lg pl-9 pr-3 py-2 text-sm font-semibold text-slate-900 bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                  <p className="text-[11px] text-slate-600 leading-tight">
                    Destine um valor mensal para esta categoria (ex: 800 para Combustível). Conforme registrar compras na conta ou no cartão de crédito, o saldo disponível reduzirá automaticamente.
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-100 flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setModalState({ isOpen: false, type: null, mode: 'create', data: null })}
                    className="px-4 py-2 border border-slate-300 rounded-lg text-sm text-slate-700 hover:bg-slate-50"
                  >
                    Cancelar
                  </button>
                  <button type="submit" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold">
                    Salvar Categoria
                  </button>
                </div>
              </form>
            )}

          </div>
        </div>
  );
}
