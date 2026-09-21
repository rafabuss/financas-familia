import React from 'react';
import {
  FileText,
  UploadCloud,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Check,
  Filter,
  X,
} from 'lucide-react';
import { formatMoney, formatDateBR } from '../../utils/formatters';

export default function ImportTab({
  cards = [],
  categories = [],
  importSelectedCard = 'card-1',
  setImportSelectedCard,
  importPreviewData = null,
  setImportPreviewData,
  importMetadata = null,
  setImportMetadata,
  isImportLoading = false,
  handleFileUpload,
  importSummary = { selectedCount: 0, selectedTotalCents: 0, duplicatesCount: 0 },
  importFilterTab = 'ALL',
  setImportFilterTab,
  importDefaultStatus = 'COMPROMETIDO',
  setImportDefaultStatus,
  handleSelectAllImport,
  handleDeselectDuplicates,
  handleUpdateImportItem,
  handleConfirmImport,
}) {
  return (
          <div className="space-y-6 max-w-6xl mx-auto">
            {!importPreviewData ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm max-w-3xl mx-auto space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center space-x-2">
                    <FileText className="w-5 h-5 text-blue-600" />
                    <span>Importação de Faturas em PDF & Extratos</span>
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-500 mt-1">
                    Envie a fatura original do seu cartão de crédito (PDF do Itaú, Nubank ou extrato bancário CSV).
                    O leitor inteligente extrai todas as compras, parcelamentos e datas para você aprovar item por item.
                  </p>
                </div>

                <div className="border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-2xl p-8 sm:p-12 text-center space-y-5 bg-slate-50/60 transition group">
                  <div className="w-16 h-16 bg-blue-100/70 text-blue-600 rounded-2xl flex items-center justify-center mx-auto shadow-inner group-hover:scale-105 transition">
                    <UploadCloud className="w-8 h-8" />
                  </div>

                  <div>
                    <h3 className="font-bold text-base text-slate-900">Selecione sua fatura PDF ou extrato CSV</h3>
                    <p className="text-xs text-slate-400 mt-1">
                      Compatível com faturas PDF do Itaú (Black, Platinum, Visa/Mastercard) e arquivos bancários (.pdf, .csv, .txt)
                    </p>
                  </div>

                  <div className="max-w-xs mx-auto text-left">
                    <label className="block text-xs font-semibold text-slate-600 mb-1 text-center">
                      Cartão de destino padrão:
                    </label>
                    <select
                      value={importSelectedCard}
                      onChange={(e) => setImportSelectedCard(e.target.value)}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-xs"
                    >
                      {cards.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} ({c.bank})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                    <label className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm px-8 py-3 rounded-xl cursor-pointer transition active:scale-95 flex items-center justify-center space-x-2 shadow-sm">
                      <FileText className="w-4 h-4" />
                      <span>Selecionar Fatura (PDF / CSV)</span>
                      <input
                        type="file"
                        accept=".pdf,.csv,.txt,.ofx"
                        onChange={handleFileUpload}
                        className="hidden"
                        disabled={isImportLoading}
                      />
                    </label>
                  </div>

                  {isImportLoading && (
                    <div className="p-4 bg-blue-50 rounded-xl border border-blue-200 text-blue-800 text-xs font-semibold flex items-center justify-center space-x-2 animate-pulse">
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Lendo e analisando fatura com inteligência de conciliação...</span>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* TELA DE CONFERÊNCIA E APROVAÇÃO ITEM POR ITEM */
              <div className="space-y-6">
                {/* Cabeçalho com Metadados da Fatura e Indicadores de Conciliação */}
                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-5">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-bold uppercase tracking-wider bg-blue-100 text-blue-800 px-2 py-0.5 rounded-md">
                          Fatura Identificada
                        </span>
                        {importMetadata?.fileName && (
                          <span className="text-xs text-slate-500 font-mono truncate max-w-xs">
                            {importMetadata.fileName}
                          </span>
                        )}
                      </div>
                      <h2 className="text-xl font-bold text-slate-900 mt-1">Conferência & Aprovação de Lançamentos</h2>
                      <div className="flex flex-wrap items-center gap-y-1 gap-x-3 text-xs text-slate-500 mt-1">
                        {importMetadata?.cardholder && <span>Titular: <strong className="text-slate-700">{importMetadata.cardholder}</strong></span>}
                        {importMetadata?.cardLast4 && <span>• Cartão Final: <strong className="text-slate-700">{importMetadata.cardLast4}</strong></span>}
                        {importMetadata?.dueDate && <span>• Vencimento: <strong className="text-slate-700">{importMetadata.dueDate}</strong></span>}
                        {importMetadata?.closingDate && <span>• Fechamento: <strong className="text-slate-700">{importMetadata.closingDate}</strong></span>}
                      </div>
                    </div>

                    {/* Seletor de Cartão de Destino */}
                    <div className="flex items-center space-x-2 bg-slate-50 p-2 rounded-xl border border-slate-200">
                      <label className="text-xs font-bold text-slate-600 whitespace-nowrap">Cartão de Destino:</label>
                      <select
                        value={importSelectedCard}
                        onChange={(e) => setImportSelectedCard(e.target.value)}
                        className="bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        {cards.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name} ({c.bank})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Cards de Métricas e Status de Conciliação */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="p-4 rounded-xl border border-slate-100 bg-slate-50 flex flex-col justify-between">
                      <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Lido na Fatura (PDF)</span>
                      <div className="text-xl font-bold text-slate-900 mt-1">
                        {formatMoney(importMetadata?.totalInvoiceCents || 0)}
                      </div>
                      <span className="text-[11px] text-slate-500 mt-0.5">Valor estampado no extrato oficial</span>
                    </div>

                    <div className="p-4 rounded-xl border border-blue-100 bg-blue-50/50 flex flex-col justify-between">
                      <span className="text-xs font-semibold uppercase tracking-wider text-blue-600">Total Selecionado para Gravar</span>
                      <div className="text-xl font-bold text-blue-700 mt-1">
                        {formatMoney(importSummary.selectedTotalCents)}
                      </div>
                      <span className="text-[11px] text-blue-600/80 mt-0.5">
                        {importSummary.selectedCount} de {importPreviewData.length} compras aprovadas
                      </span>
                    </div>

                    <div
                      className={`p-4 rounded-xl border flex flex-col justify-between ${
                        importSummary.selectedTotalCents === (importMetadata?.totalInvoiceCents || 0)
                          ? 'border-emerald-200 bg-emerald-50/60 text-emerald-900'
                          : 'border-amber-200 bg-amber-50/60 text-amber-900'
                      }`}
                    >
                      <span className="text-xs font-semibold uppercase tracking-wider">Status da Conciliação</span>
                      <div className="text-sm font-bold flex items-center space-x-1.5 mt-1">
                        {importSummary.selectedTotalCents === (importMetadata?.totalInvoiceCents || 0) ? (
                          <>
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            <span className="text-emerald-700">100% Conciliado com a Fatura</span>
                          </>
                        ) : (
                          <>
                            <AlertTriangle className="w-4 h-4 text-amber-600" />
                            <span className="text-amber-700">
                              Diferença: {formatMoney(Math.abs(importSummary.selectedTotalCents - (importMetadata?.totalInvoiceCents || 0)))}
                            </span>
                          </>
                        )}
                      </div>
                      <span className="text-[11px] opacity-80 mt-0.5">
                        {importSummary.selectedTotalCents === (importMetadata?.totalInvoiceCents || 0)
                          ? 'A soma exata dos itens aprovados bate com o total da fatura.'
                          : 'Revise os itens desmarcados ou despesas extras.'}
                      </span>
                    </div>
                  </div>

                  {/* Barra de Ações em Massa e Filtros */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-2 border-t border-slate-100">
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleSelectAllImport(true)}
                        className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 transition"
                      >
                        Aprovar Todos ({importPreviewData.length})
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSelectAllImport(false)}
                        className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 transition"
                      >
                        Desmarcar Todos
                      </button>
                      {importSummary.duplicateCount > 0 && (
                        <button
                          type="button"
                          onClick={handleDeselectDuplicates}
                          className="px-3 py-1.5 rounded-lg border border-amber-200 bg-amber-50 hover:bg-amber-100 text-xs font-semibold text-amber-800 transition flex items-center space-x-1"
                        >
                          <AlertTriangle className="w-3 h-3 text-amber-600" />
                          <span>Desmarcar Duplicidades ({importSummary.duplicateCount})</span>
                        </button>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
                        <span className="text-slate-500 px-1 text-[11px]">Situação padrão:</span>
                        <button
                          type="button"
                          onClick={() => {
                            setImportDefaultStatus('COMPROMETIDO');
                            setImportPreviewData((prev) => prev ? prev.map((i) => ({ ...i, status: 'COMPROMETIDO' })) : prev);
                          }}
                          className={`px-2.5 py-1 rounded-lg transition ${
                            importDefaultStatus === 'COMPROMETIDO' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          A Vencer (Comprometido)
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setImportDefaultStatus('REALIZADO');
                            setImportPreviewData((prev) => prev ? prev.map((i) => ({ ...i, status: 'REALIZADO' })) : prev);
                          }}
                          className={`px-2.5 py-1 rounded-lg transition ${
                            importDefaultStatus === 'REALIZADO' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          Fatura Paga (Realizado)
                        </button>
                      </div>

                      <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold text-slate-600">
                        <button
                          type="button"
                          onClick={() => setImportFilterTab('ALL')}
                          className={`px-3 py-1 rounded-lg transition ${importFilterTab === 'ALL' ? 'bg-white text-slate-900 shadow-xs' : 'hover:text-slate-900'}`}
                        >
                          Todos ({importPreviewData.length})
                        </button>
                        <button
                          type="button"
                          onClick={() => setImportFilterTab('SELECTED')}
                          className={`px-3 py-1 rounded-lg transition ${importFilterTab === 'SELECTED' ? 'bg-white text-emerald-700 shadow-xs' : 'hover:text-slate-900'}`}
                        >
                          Aprovados ({importSummary.selectedCount})
                        </button>
                        {importSummary.duplicateCount > 0 && (
                          <button
                            type="button"
                            onClick={() => setImportFilterTab('DUPLICATES')}
                            className={`px-3 py-1 rounded-lg transition ${importFilterTab === 'DUPLICATES' ? 'bg-white text-amber-700 shadow-xs' : 'hover:text-slate-900'}`}
                          >
                            Duplicidades ({importSummary.duplicateCount})
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Tabela Interativa de Proposta e Aprovação Item por Item */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm border-collapse">
                      <thead>
                        <tr className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200 text-xs">
                          <th className="py-3 px-3 w-12 text-center">Status</th>
                          <th className="py-3 px-3 w-32">Data Compra</th>
                          <th className="py-3 px-3">Estabelecimento / Descrição</th>
                          <th className="py-3 px-3 w-28">Parcela</th>
                          <th className="py-3 px-3 w-32">Situação</th>
                          <th className="py-3 px-3 w-40">Categoria</th>
                          <th className="py-3 px-3 w-28">Escopo</th>
                          <th className="py-3 px-3 w-32">Membro</th>
                          <th className="py-3 px-4 text-right w-32">Valor (R$)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-xs">
                        {importPreviewData
                          .filter((item) => {
                            if (importFilterTab === 'SELECTED') return item.selected;
                            if (importFilterTab === 'DUPLICATES') return item.isDuplicate;
                            return true;
                          })
                          .map((item) => {
                            return (
                              <tr
                                key={item.id}
                                className={`transition-colors ${
                                  !item.selected
                                    ? 'bg-slate-50/50 opacity-60 hover:opacity-100'
                                    : item.isDuplicate
                                    ? 'bg-amber-50/50 hover:bg-amber-50/80 border-l-4 border-amber-400'
                                    : 'hover:bg-blue-50/30'
                                }`}
                              >
                                {/* Checkbox Aprovar */}
                                <td className="py-3 px-3 text-center">
                                  <input
                                    type="checkbox"
                                    checked={item.selected}
                                    onChange={() =>
                                      handleUpdateImportItem(item.id, { selected: !item.selected })
                                    }
                                    className="w-4 h-4 rounded text-blue-600 cursor-pointer focus:ring-blue-500"
                                    title={item.selected ? 'Aprovado para importar' : 'Ignorado (não será importado)'}
                                  />
                                </td>

                                {/* Data da Compra */}
                                <td className="py-3 px-3 whitespace-nowrap">
                                  <input
                                    type="date"
                                    value={item.purchaseDate || item.date}
                                    onChange={(e) =>
                                      handleUpdateImportItem(item.id, {
                                        date: e.target.value,
                                        purchaseDate: e.target.value,
                                        dateDisplay: formatDateBR(e.target.value),
                                      })
                                    }
                                    className="border border-slate-200 rounded-lg px-2 py-1 text-xs text-slate-700 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                                  />
                                  {importMetadata?.dueDate && (
                                    <span className="text-[10px] text-purple-600 block mt-0.5" title="Vencimento na fatura do cartão">
                                      Venc: {importMetadata.dueDate}
                                    </span>
                                  )}
                                </td>

                                {/* Descrição / Estabelecimento */}
                                <td className="py-3 px-3">
                                  <div className="space-y-1">
                                    <input
                                      type="text"
                                      value={item.description}
                                      onChange={(e) =>
                                        handleUpdateImportItem(item.id, { description: e.target.value })
                                      }
                                      className="w-full font-medium border border-slate-200 rounded-lg px-2 py-1 text-xs text-slate-900 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    />
                                    {item.categoryHint && (
                                      <span className="text-[10px] text-slate-400 block truncate" title={item.categoryHint}>
                                        Dica extrato: {item.categoryHint}
                                      </span>
                                    )}
                                    {item.isDuplicate && (
                                      <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded inline-flex items-center space-x-1">
                                        <AlertTriangle className="w-2.5 h-2.5 text-amber-600" />
                                        <span>Possível duplicidade no extrato</span>
                                      </span>
                                    )}
                                  </div>
                                </td>

                                {/* Parcela */}
                                <td className="py-3 px-3 whitespace-nowrap">
                                  {item.installmentCount ? (
                                    <div className="flex flex-col space-y-1">
                                      <div className="flex items-center space-x-1">
                                        <input
                                          type="number"
                                          min="1"
                                          max={item.installmentCount || 1}
                                          value={item.installmentNumber || 1}
                                          onChange={(e) =>
                                            handleUpdateImportItem(item.id, {
                                              installmentNumber: parseInt(e.target.value, 10) || 1,
                                            })
                                          }
                                          className="w-10 border border-slate-200 rounded px-1 py-0.5 text-center text-xs font-semibold"
                                        />
                                        <span className="text-slate-400">/</span>
                                        <input
                                          type="number"
                                          min="1"
                                          max="120"
                                          value={item.installmentCount || 1}
                                          onChange={(e) =>
                                            handleUpdateImportItem(item.id, {
                                              installmentCount: parseInt(e.target.value, 10) || 1,
                                            })
                                          }
                                          className="w-10 border border-slate-200 rounded px-1 py-0.5 text-center text-xs font-semibold"
                                        />
                                      </div>
                                      {item.installmentNumber < item.installmentCount && (
                                        <span
                                          className="text-[10px] bg-purple-100 text-purple-700 font-bold px-1.5 py-0.5 rounded text-center inline-block"
                                          title="As parcelas restantes dos meses seguintes serão agendadas automaticamente no sistema"
                                        >
                                          +{item.installmentCount - item.installmentNumber} futuras
                                        </span>
                                      )}
                                    </div>
                                  ) : (
                                    <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-semibold">
                                      À Vista
                                    </span>
                                  )}
                                </td>

                                {/* Situação: Comprometido vs Realizado */}
                                <td className="py-3 px-3 whitespace-nowrap">
                                  <select
                                    value={item.status || importDefaultStatus}
                                    onChange={(e) =>
                                      handleUpdateImportItem(item.id, { status: e.target.value })
                                    }
                                    className={`border rounded-lg px-2 py-1 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                                      (item.status || importDefaultStatus) === 'REALIZADO'
                                        ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                                        : 'bg-blue-50 text-blue-700 border-blue-300'
                                    }`}
                                  >
                                    <option value="COMPROMETIDO">Comprometido</option>
                                    <option value="REALIZADO">Realizado</option>
                                  </select>
                                </td>

                                {/* Categoria */}
                                <td className="py-3 px-3">
                                  <select
                                    value={item.categoryId || ''}
                                    onChange={(e) =>
                                      handleUpdateImportItem(item.id, { categoryId: e.target.value })
                                    }
                                    className="w-full border border-slate-200 rounded-lg px-2 py-1 text-xs text-slate-800 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                                  >
                                    {categories
                                      .filter((c) => !c.archived && c.type === 'EXPENSE')
                                      .map((cat) => (
                                        <option key={cat.id} value={cat.id}>
                                          {cat.name}
                                        </option>
                                      ))}
                                  </select>
                                </td>

                                {/* Escopo (Familiar vs Pessoal) */}
                                <td className="py-3 px-3 whitespace-nowrap">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleUpdateImportItem(item.id, {
                                        scope: item.scope === 'FAMILY' ? 'PERSONAL' : 'FAMILY',
                                      })
                                    }
                                    className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase transition ${
                                      item.scope === 'PERSONAL'
                                        ? 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                                        : 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                                    }`}
                                  >
                                    {item.scope === 'PERSONAL' ? 'Pessoal' : 'Familiar'}
                                  </button>
                                </td>

                                {/* Membro Familiar */}
                                <td className="py-3 px-3">
                                  <select
                                    value={item.ownerId || 'user-1'}
                                    onChange={(e) =>
                                      handleUpdateImportItem(item.id, { ownerId: e.target.value })
                                    }
                                    className="w-full border border-slate-200 rounded-lg px-2 py-1 text-xs text-slate-800 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                                  >
                                    {FAMILY_MEMBERS.filter((m) => m.id !== 'user-all').map((m) => (
                                      <option key={m.id} value={m.id}>
                                        {m.name.replace(/^[👑🏠👤]\s*/u, '')}
                                      </option>
                                    ))}
                                  </select>
                                </td>

                                {/* Valor */}
                                <td className="py-3 px-4 text-right font-bold whitespace-nowrap">
                                  <span className={item.amountCents < 0 ? 'text-emerald-600' : 'text-slate-900'}>
                                    {item.amountCents < 0 ? '+ ' : ''}
                                    {formatMoney(Math.abs(item.amountCents))}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Barra Fixa / Rodapé de Confirmação e Gravação */}
                <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="text-xs text-slate-500 text-center sm:text-left">
                    <span>Lançamentos selecionados: </span>
                    <strong className="text-slate-900 font-bold">
                      {importSummary.selectedCount} de {importPreviewData.length}
                    </strong>
                    <span className="mx-2">•</span>
                    <span>Total a gravar: </span>
                    <strong className="text-blue-700 font-bold text-sm">
                      {formatMoney(importSummary.selectedTotalCents)}
                    </strong>
                  </div>

                  <div className="flex items-center space-x-3 w-full sm:w-auto">
                    <button
                      type="button"
                      onClick={() => {
                        setImportPreviewData(null);
                        setImportMetadata(null);
                      }}
                      className="w-full sm:w-auto px-5 py-2.5 border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-semibold transition"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={handleConfirmImport}
                      disabled={importSummary.selectedCount === 0}
                      className="w-full sm:w-auto px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-sm transition active:scale-95 flex items-center justify-center space-x-1.5"
                    >
                      <Check className="w-4 h-4" />
                      <span>
                        Confirmar e Gravar {importSummary.selectedCount} Lançamento(s)
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

  );
}
