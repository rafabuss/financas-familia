import React, { useState } from 'react';
import {
  FileText,
  UploadCloud,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Check,
  Filter,
  X,
  Sparkles,
  CreditCard,
  Building2,
  Lock,
  Users,
  Split,
  Plus,
  Trash2,
  ArrowRight,
  ShieldCheck,
  Edit3,
} from 'lucide-react';
import { formatMoney, formatDateBR } from '../../utils/formatters';
import { FAMILY_MEMBERS } from '../../data/constants';
import { useFinance } from '../../contexts/FinanceContext';

export default function ImportTab(props) {
  // Conecta ao FinanceContext com fallback para props
  const finance = useFinance() || {};

  const cards = props.cards || finance.cards || [];
  const accounts = props.accounts || finance.accounts || [];
  const categories = props.categories || finance.categories || [];
  const transactions = finance.transactions || [];

  const importDestinationType = props.importDestinationType || finance.importDestinationType || 'ACCOUNT';
  const setImportDestinationType = props.setImportDestinationType || finance.setImportDestinationType || (() => {});

  const importSelectedCard = props.importSelectedCard || finance.importSelectedCard || (cards[0]?.id || 'card-1');
  const setImportSelectedCard = props.setImportSelectedCard || finance.setImportSelectedCard || (() => {});

  const importSelectedAccountId = props.importSelectedAccountId || finance.importSelectedAccountId || (accounts[0]?.id || 'acc-1');
  const setImportSelectedAccountId = props.setImportSelectedAccountId || finance.setImportSelectedAccountId || (() => {});

  const importPreviewData = props.importPreviewData !== undefined ? props.importPreviewData : finance.importPreviewData;
  const setImportPreviewData = props.setImportPreviewData || finance.setImportPreviewData || (() => {});

  const importMetadata = props.importMetadata !== undefined ? props.importMetadata : finance.importMetadata;
  const setImportMetadata = props.setImportMetadata || finance.setImportMetadata || (() => {});

  const isImportLoading = props.isImportLoading !== undefined ? props.isImportLoading : finance.isImportLoading;
  const handleFileUpload = props.handleFileUpload || finance.handleFileUpload;

  const importSummary = props.importSummary || finance.importSummary || {
    selectedCount: 0,
    selectedTotalCents: 0,
    duplicateCount: 0,
    matchedCount: 0,
    newCount: 0,
    unselectedCount: 0,
  };

  const importFilterTab = props.importFilterTab || finance.importFilterTab || 'ALL';
  const setImportFilterTab = props.setImportFilterTab || finance.setImportFilterTab || (() => {});

  const importDefaultStatus = props.importDefaultStatus || finance.importDefaultStatus || 'REALIZADO';
  const setImportDefaultStatus = props.setImportDefaultStatus || finance.setImportDefaultStatus || (() => {});

  const handleSelectAllImport = props.handleSelectAllImport || finance.handleSelectAllImport;
  const handleDeselectDuplicates = props.handleDeselectDuplicates || finance.handleDeselectDuplicates;
  const handleUpdateImportItem = props.handleUpdateImportItem || finance.handleUpdateImportItem;
  const handleConfirmImport = props.handleConfirmImport || finance.handleConfirmImport;
  const handleLoadSampleOfx = props.handleLoadSampleOfx || finance.handleLoadSampleOfx;
  const handleReconcileWithTarget = props.handleReconcileWithTarget || finance.handleReconcileWithTarget;
  const handleSplitImportItem = props.handleSplitImportItem || finance.handleSplitImportItem;

  // Estado local para o Modal de Split (Divisão de Lançamento)
  const [splitModalItem, setSplitModalItem] = useState(null);
  const [splitParts, setSplitParts] = useState([]);

  // Abre modal de divisão para o item
  const openSplitModal = (item) => {
    setSplitModalItem(item);
    const half = Math.round(item.amountCents / 2);
    const otherHalf = item.amountCents - half;
    setSplitParts([
      {
        description: `${item.description} (Parte 1)`,
        amountCents: half,
        amountInput: (half / 100).toFixed(2),
        categoryId: item.categoryId || categories[0]?.id,
        ownerId: item.ownerId || 'user-1',
        scope: item.scope || 'FAMILY',
        visibility: item.visibility || 'FAMILY',
      },
      {
        description: `${item.description} (Parte 2)`,
        amountCents: otherHalf,
        amountInput: (otherHalf / 100).toFixed(2),
        categoryId: item.categoryId || categories[0]?.id,
        ownerId: item.ownerId || 'user-1',
        scope: item.scope || 'FAMILY',
        visibility: item.visibility || 'FAMILY',
      },
    ]);
  };

  const handleSplitPartChange = (idx, field, value) => {
    setSplitParts((prev) => {
      const copy = [...prev];
      if (field === 'amountInput') {
        const valNum = parseFloat(value.replace(',', '.')) || 0;
        const cents = Math.round(valNum * 100);
        copy[idx] = { ...copy[idx], amountInput: value, amountCents: cents };
      } else {
        copy[idx] = { ...copy[idx], [field]: value };
      }
      return copy;
    });
  };

  const handleAddSplitPart = () => {
    if (!splitModalItem) return;
    const currentSum = splitParts.reduce((acc, p) => acc + (p.amountCents || 0), 0);
    const remainder = Math.max(0, splitModalItem.amountCents - currentSum);
    setSplitParts((prev) => [
      ...prev,
      {
        description: `${splitModalItem.description} (Parte ${prev.length + 1})`,
        amountCents: remainder,
        amountInput: (remainder / 100).toFixed(2),
        categoryId: splitModalItem.categoryId || categories[0]?.id,
        ownerId: splitModalItem.ownerId || 'user-1',
        scope: splitModalItem.scope || 'FAMILY',
        visibility: splitModalItem.visibility || 'FAMILY',
      },
    ]);
  };

  const handleRemoveSplitPart = (idx) => {
    if (splitParts.length <= 2) {
      alert('São necessárias pelo menos duas partes para dividir um lançamento.');
      return;
    }
    setSplitParts((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleConfirmSplit = () => {
    if (!splitModalItem) return;
    const totalParts = splitParts.reduce((acc, p) => acc + (p.amountCents || 0), 0);
    if (totalParts !== splitModalItem.amountCents) {
      alert(
        `A soma das partes (${formatMoney(totalParts)}) deve ser exatamente igual ao total original do lançamento (${formatMoney(
          splitModalItem.amountCents
        )}).`
      );
      return;
    }

    if (handleSplitImportItem) {
      handleSplitImportItem(splitModalItem.id, splitParts);
    }
    setSplitModalItem(null);
    setSplitParts([]);
  };

  // Seletor de Destino Dinâmico
  const handleDestinationTypeChange = (newType) => {
    setImportDestinationType(newType);
    const newTargetId = newType === 'CARD' ? (importSelectedCard || cards[0]?.id) : (importSelectedAccountId || accounts[0]?.id);
    if (handleReconcileWithTarget) {
      handleReconcileWithTarget(newTargetId, newType);
    }
  };

  const handleTargetIdChange = (newId) => {
    if (importDestinationType === 'CARD') {
      setImportSelectedCard(newId);
    } else {
      setImportSelectedAccountId(newId);
    }
    if (handleReconcileWithTarget) {
      handleReconcileWithTarget(newId, importDestinationType);
    }
  };

  const currentTargetId = importDestinationType === 'CARD' ? importSelectedCard : importSelectedAccountId;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {!importPreviewData ? (
        /* ================= TELA INICIAL: UPLOAD & SELEÇÃO DE ARQUIVO ================= */
        <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm max-w-3xl mx-auto space-y-6">
          <div>
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Fase 8: Conciliação Inteligente & Anti-Duplicação</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center space-x-2">
              <FileText className="w-6 h-6 text-blue-600" />
              <span>Importação Universal de Extratos & Faturas</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1.5 leading-relaxed">
              Importe extratos bancários no formato universal <strong>OFX</strong> (Itaú, Nubank, Banco do Brasil, Inter, C6, Santander, Caixa, XP),
              faturas abertas e fechadas do Itaú em <strong>Excel (.xlsx)</strong> ou faturas em <strong>PDF/CSV</strong> com processamento 100% no seu navegador (privacidade e segurança total).
            </p>
          </div>

          {/* Configuração de Destino Padrão */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
              Tipo e Destino da Importação:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Toggle Conta vs Cartão */}
              <div className="flex rounded-lg bg-slate-200/70 p-1">
                <button
                  type="button"
                  onClick={() => handleDestinationTypeChange('ACCOUNT')}
                  className={`flex-1 py-1.5 px-3 rounded-md text-xs font-semibold flex items-center justify-center space-x-1.5 transition ${
                    importDestinationType === 'ACCOUNT'
                      ? 'bg-white text-blue-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Building2 className="w-3.5 h-3.5" />
                  <span>Conta Bancária (Extrato)</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleDestinationTypeChange('CARD')}
                  className={`flex-1 py-1.5 px-3 rounded-md text-xs font-semibold flex items-center justify-center space-x-1.5 transition ${
                    importDestinationType === 'CARD'
                      ? 'bg-white text-blue-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>Cartão de Crédito</span>
                </button>
              </div>

              {/* Seletor específico da Conta ou Cartão */}
              <div>
                {importDestinationType === 'CARD' ? (
                  <select
                    value={importSelectedCard}
                    onChange={(e) => handleTargetIdChange(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs font-semibold bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-xs"
                  >
                    {cards.map((c) => (
                      <option key={c.id} value={c.id}>
                        💳 {c.name} ({c.bank})
                      </option>
                    ))}
                  </select>
                ) : (
                  <select
                    value={importSelectedAccountId}
                    onChange={(e) => handleTargetIdChange(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs font-semibold bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-xs"
                  >
                    {accounts.map((a) => (
                      <option key={a.id} value={a.id}>
                        🏦 {a.name} ({a.bank})
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>
            <p className="text-[11px] text-slate-500">
              * O sistema identifica automaticamente a conta ou cartão caso o arquivo OFX ou XLSX contenha metadados bancários.
            </p>
          </div>

          {/* Área de Drop / Upload */}
          <div className="border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-2xl p-8 sm:p-10 text-center space-y-4 bg-slate-50/60 transition group">
            <div className="w-16 h-16 bg-blue-100/70 text-blue-600 rounded-2xl flex items-center justify-center mx-auto shadow-inner group-hover:scale-105 transition">
              <UploadCloud className="w-8 h-8" />
            </div>

            <div>
              <h3 className="font-bold text-base text-slate-900">Selecione seu Extrato (.ofx, .csv) ou Fatura (.xlsx, .pdf)</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                Decodificação direta no navegador com leitura de OFX 1.02/1.6 (SGML) e 2.0 (XML), Faturas Itaú em Excel (.xlsx), faturas em PDF e arquivos CSV.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <label className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs sm:text-sm px-8 py-3 rounded-xl cursor-pointer transition active:scale-95 flex items-center justify-center space-x-2 shadow-sm">
                <FileText className="w-4 h-4" />
                <span>Escolher Arquivo do Computador</span>
                <input
                  type="file"
                  accept=".ofx,.pdf,.csv,.txt,.xlsx,.xls"
                  onChange={handleFileUpload}
                  className="hidden"
                  disabled={isImportLoading}
                />
              </label>
            </div>

            {isImportLoading && (
              <div className="p-4 bg-blue-50 rounded-xl border border-blue-200 text-blue-800 text-xs font-semibold flex items-center justify-center space-x-2 animate-pulse">
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Processando arquivo e analisando conciliação inteligente...</span>
              </div>
            )}
          </div>

          {/* Seção de Demonstração Rápida em 1 Clique */}
          <div className="border-t border-slate-100 pt-5 space-y-3">
            <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-slate-500">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>Experimentar com Dados de Exemplo (1 Clique):</span>
            </div>
            <p className="text-xs text-slate-500">
              Teste o motor de conciliação agora mesmo com arquivos OFX demonstrativos gerados em tempo real com as 3 cores de validação (Novo, Match Inteligente e Duplicata):
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={() => handleLoadSampleOfx && handleLoadSampleOfx('ACCOUNT')}
                disabled={isImportLoading}
                className="flex-1 border border-slate-200 hover:border-blue-400 bg-white hover:bg-blue-50/50 p-3.5 rounded-xl text-left transition flex items-center justify-between group shadow-2xs"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-xs text-slate-800 block group-hover:text-blue-700">
                      Extrato Bancário OFX (Banco do Brasil)
                    </span>
                    <span className="text-[11px] text-slate-400">
                      5 lançamentos: salários, contas, match e duplicata
                    </span>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition" />
              </button>

              <button
                type="button"
                onClick={() => handleLoadSampleOfx && handleLoadSampleOfx('CARD')}
                disabled={isImportLoading}
                className="flex-1 border border-slate-200 hover:border-purple-400 bg-white hover:bg-purple-50/50 p-3.5 rounded-xl text-left transition flex items-center justify-between group shadow-2xs"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-xs">
                    <CreditCard className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-xs text-slate-800 block group-hover:text-purple-700">
                      Fatura de Cartão OFX (Nubank)
                    </span>
                    <span className="text-[11px] text-slate-400">
                      5 compras: supermercado, restaurante, assinaturas
                    </span>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-purple-600 transition" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* ================= TELA DE MESA DE CONFERÊNCIA & EDIÇÃO PRÉVIA ================= */
        <div className="space-y-6">
          {/* Cabeçalho com Metadados da Fatura/Extrato e Seletor de Destino */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-5">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-5">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider bg-blue-100 text-blue-800 px-2.5 py-0.5 rounded-md flex items-center space-x-1">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>{importMetadata?.fileType || 'OFX'} Identificado</span>
                  </span>
                  {importMetadata?.isSample && (
                    <span className="text-[11px] font-bold uppercase tracking-wider bg-amber-100 text-amber-800 px-2 py-0.5 rounded-md">
                      Modo Demonstração
                    </span>
                  )}
                  {importMetadata?.fileName && (
                    <span className="text-xs text-slate-500 font-mono truncate max-w-xs" title={importMetadata.fileName}>
                      {importMetadata.fileName}
                    </span>
                  )}
                </div>
                <h2 className="text-xl font-bold text-slate-900 mt-1">Mesa de Conferência & Conciliação Inteligente</h2>
                <div className="flex flex-wrap items-center gap-y-1 gap-x-3 text-xs text-slate-500 mt-1">
                  {importMetadata?.institution && (
                    <span>Instituição: <strong className="text-slate-700">{importMetadata.institution}</strong></span>
                  )}
                  {importMetadata?.cardName && (
                    <span>• Cartão: <strong className="text-slate-700">{importMetadata.cardName}</strong></span>
                  )}
                  {importMetadata?.acctId && (
                    <span>• Conta/Cartão: <strong className="text-slate-700">{importMetadata.acctId}</strong></span>
                  )}
                  {importMetadata?.cardholder && (
                    <span>• Titular: <strong className="text-slate-700">{importMetadata.cardholder}</strong></span>
                  )}
                  {importMetadata?.dueDate && (
                    <span>• Vencimento: <strong className="text-slate-700">{importMetadata.dueDate}</strong></span>
                  )}
                  {importMetadata?.startDate && importMetadata?.endDate && (
                    <span>• Período: <strong className="text-slate-700">{formatDateBR(importMetadata.startDate)} até {formatDateBR(importMetadata.endDate)}</strong></span>
                  )}
                  {importMetadata?.totalInvoiceCents > 0 && (
                    <span>• Fatura Total: <strong className="text-slate-700">{formatMoney(importMetadata.totalInvoiceCents)}</strong></span>
                  )}
                  {importMetadata?.ledgerBalanceCents !== null && importMetadata?.ledgerBalanceCents !== undefined && (
                    <span>• Saldo Extrato: <strong className="text-slate-700">{formatMoney(importMetadata.ledgerBalanceCents)}</strong></span>
                  )}
                </div>
              </div>

              {/* Seletor Dinâmico de Destino (Conta Corrente vs Cartão) */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                <div className="flex items-center space-x-1">
                  <button
                    type="button"
                    onClick={() => handleDestinationTypeChange('ACCOUNT')}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1 transition ${
                      importDestinationType === 'ACCOUNT'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
                    }`}
                  >
                    <Building2 className="w-3.5 h-3.5" />
                    <span>Conta</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDestinationTypeChange('CARD')}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1 transition ${
                      importDestinationType === 'CARD'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
                    }`}
                  >
                    <CreditCard className="w-3.5 h-3.5" />
                    <span>Cartão</span>
                  </button>
                </div>

                <div className="min-w-[180px]">
                  {importDestinationType === 'CARD' ? (
                    <select
                      value={importSelectedCard}
                      onChange={(e) => handleTargetIdChange(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {cards.map((c) => (
                        <option key={c.id} value={c.id}>
                          💳 {c.name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <select
                      value={importSelectedAccountId}
                      onChange={(e) => handleTargetIdChange(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {accounts.map((a) => (
                        <option key={a.id} value={a.id}>
                          🏦 {a.name}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>
            </div>

            {/* Painel de Métricas e Inteligência Anti-Duplicação */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl border border-slate-100 bg-slate-50 flex flex-col justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total do Arquivo</span>
                <div className="text-xl font-bold text-slate-900 mt-1">
                  {formatMoney(importMetadata?.totalInvoiceCents || 0)}
                </div>
                <span className="text-[11px] text-slate-500 mt-0.5">
                  {importPreviewData.length} transações no documento
                </span>
              </div>

              <div className="p-4 rounded-xl border border-blue-100 bg-blue-50/50 flex flex-col justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-blue-600">Aprovados para Gravação</span>
                <div className="text-xl font-bold text-blue-700 mt-1">
                  {formatMoney(importSummary.selectedTotalCents)}
                </div>
                <span className="text-[11px] text-blue-600/80 mt-0.5">
                  {importSummary.selectedCount} de {importPreviewData.length} selecionados
                </span>
              </div>

              <div className="p-4 rounded-xl border border-emerald-100 bg-emerald-50/50 flex flex-col justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-emerald-700 flex items-center space-x-1">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Novos & Conciliações</span>
                </span>
                <div className="text-sm font-bold text-emerald-800 mt-1 space-y-0.5">
                  <div>🟢 {importSummary.newCount || 0} lançamento(s) novo(s)</div>
                  <div className="text-amber-700">🟡 {importSummary.matchedCount || 0} sugestão(ões) de match</div>
                </div>
                <span className="text-[11px] text-emerald-600 mt-0.5">Motor anti-duplicação ativo</span>
              </div>

              <div
                className={`p-4 rounded-xl border flex flex-col justify-between ${
                  (importSummary.duplicateCount || 0) > 0
                    ? 'border-amber-200 bg-amber-50/60 text-amber-900'
                    : 'border-slate-100 bg-slate-50 text-slate-700'
                }`}
              >
                <span className="text-xs font-semibold uppercase tracking-wider">Duplicatas Evitadas</span>
                <div className="text-xl font-bold mt-1 flex items-center space-x-1.5">
                  {(importSummary.duplicateCount || 0) > 0 ? (
                    <>
                      <AlertTriangle className="w-5 h-5 text-amber-600" />
                      <span className="text-amber-700">{importSummary.duplicateCount} já existente(s)</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                      <span className="text-emerald-700">Zero duplicatas</span>
                    </>
                  )}
                </div>
                <span className="text-[11px] opacity-80 mt-0.5">
                  {(importSummary.duplicateCount || 0) > 0
                    ? 'Desmarcados automaticamente para proteção'
                    : 'Nenhum lançamento repetido encontrado'}
                </span>
              </div>
            </div>

            {/* Barra de Filtros e Ações em Massa */}
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3 pt-2 border-t border-slate-100">
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
                {(importSummary.duplicateCount || 0) > 0 && (
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

              {/* Tabs de Filtro de Visualização */}
              <div className="flex flex-wrap items-center gap-2">
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
                    onClick={() => setImportFilterTab('NEW')}
                    className={`px-3 py-1 rounded-lg transition ${importFilterTab === 'NEW' ? 'bg-white text-emerald-700 shadow-xs' : 'hover:text-slate-900'}`}
                  >
                    🟢 Novos ({importSummary.newCount || 0})
                  </button>
                  <button
                    type="button"
                    onClick={() => setImportFilterTab('MATCHES')}
                    className={`px-3 py-1 rounded-lg transition ${importFilterTab === 'MATCHES' ? 'bg-white text-amber-700 shadow-xs' : 'hover:text-slate-900'}`}
                  >
                    🟡 Match ({importSummary.matchedCount || 0})
                  </button>
                  {(importSummary.duplicateCount || 0) > 0 && (
                    <button
                      type="button"
                      onClick={() => setImportFilterTab('DUPLICATES')}
                      className={`px-3 py-1 rounded-lg transition ${importFilterTab === 'DUPLICATES' ? 'bg-white text-red-700 shadow-xs' : 'hover:text-slate-900'}`}
                    >
                      🔴 Duplicatas ({importSummary.duplicateCount})
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setImportFilterTab('SELECTED')}
                    className={`px-3 py-1 rounded-lg transition ${importFilterTab === 'SELECTED' ? 'bg-white text-blue-700 shadow-xs' : 'hover:text-slate-900'}`}
                  >
                    Aprovados ({importSummary.selectedCount})
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Tabela de Conferência e Edição Prévia Flexível */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200 text-xs">
                    <th className="py-3 px-3 w-10 text-center">Aprovar</th>
                    <th className="py-3 px-3 w-40">Status Conciliação</th>
                    <th className="py-3 px-3 w-32">Data</th>
                    <th className="py-3 px-3 min-w-[220px]">Descrição (Edição Inline)</th>
                    <th className="py-3 px-3 w-36">Categoria</th>
                    <th className="py-3 px-3 w-28">Escopo</th>
                    <th className="py-3 px-3 w-32">Titular</th>
                    <th className="py-3 px-4 text-right w-28">Valor (R$)</th>
                    <th className="py-3 px-3 w-20 text-center">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {importPreviewData
                    .filter((item) => {
                      if (importFilterTab === 'SELECTED') return item.selected;
                      if (importFilterTab === 'DUPLICATES') return item.reconciliationStatus === 'DUPLICATE' || item.isDuplicate;
                      if (importFilterTab === 'MATCHES') return item.reconciliationStatus === 'SUGGEST_MATCH';
                      if (importFilterTab === 'NEW') return item.reconciliationStatus === 'NEW';
                      return true;
                    })
                    .map((item) => {
                      const isMatch = item.reconciliationStatus === 'SUGGEST_MATCH';
                      const isDup = item.reconciliationStatus === 'DUPLICATE' || item.isDuplicate;
                      const isNew = item.reconciliationStatus === 'NEW' || (!isMatch && !isDup);

                      return (
                        <tr
                          key={item.id}
                          className={`transition-colors ${
                            !item.selected
                              ? 'bg-slate-50/50 opacity-60 hover:opacity-100'
                              : isDup
                              ? 'bg-red-50/40 hover:bg-red-50/60 border-l-4 border-red-500'
                              : isMatch
                              ? 'bg-amber-50/50 hover:bg-amber-50/70 border-l-4 border-amber-400'
                              : 'hover:bg-blue-50/30'
                          }`}
                        >
                          {/* 1. Checkbox Aprovar */}
                          <td className="py-3 px-3 text-center">
                            <input
                              type="checkbox"
                              checked={item.selected}
                              onChange={() =>
                                handleUpdateImportItem(item.id, { selected: !item.selected })
                              }
                              className="w-4 h-4 rounded text-blue-600 cursor-pointer focus:ring-blue-500"
                              title={item.selected ? 'Aprovado para importar/conciliar' : 'Ignorado (não será processado)'}
                            />
                          </td>

                          {/* 2. Status da Conciliação com Ações Rápidas */}
                          <td className="py-3 px-3">
                            {isDup && (
                              <div className="space-y-1">
                                <span className="inline-flex items-center space-x-1 text-[10px] font-bold bg-red-100 text-red-800 px-2 py-0.5 rounded-full">
                                  <AlertTriangle className="w-3 h-3 text-red-600" />
                                  <span>🔴 Já Registrado</span>
                                </span>
                                <span className="text-[10px] text-slate-500 block truncate" title={item.reconcileMessage}>
                                  Duplicata evitada
                                </span>
                              </div>
                            )}

                            {isMatch && (
                              <div className="space-y-1.5">
                                <span className="inline-flex items-center space-x-1 text-[10px] font-bold bg-amber-100 text-amber-900 px-2 py-0.5 rounded-full">
                                  <Sparkles className="w-3 h-3 text-amber-600" />
                                  <span>🟡 Match Inteligente</span>
                                </span>
                                <div className="text-[10px] text-slate-600 bg-white p-1 rounded border border-amber-200">
                                  <span>Lançamento manual: <strong>{item.matchedTransaction?.description}</strong></span>
                                </div>
                                <div className="flex items-center space-x-1">
                                  <button
                                    type="button"
                                    onClick={() => handleUpdateImportItem(item.id, { action: 'RECONCILE', selected: true })}
                                    className={`px-2 py-0.5 rounded text-[10px] font-bold transition ${
                                      item.action === 'RECONCILE'
                                        ? 'bg-amber-600 text-white shadow-2xs'
                                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                    }`}
                                    title="Atualiza o lançamento manual existente sem criar duplicata"
                                  >
                                    Conciliar
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleUpdateImportItem(item.id, { action: 'IMPORT_NEW', selected: true })}
                                    className={`px-2 py-0.5 rounded text-[10px] font-bold transition ${
                                      item.action === 'IMPORT_NEW'
                                        ? 'bg-blue-600 text-white shadow-2xs'
                                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                    }`}
                                    title="Importa como um novo lançamento independente"
                                  >
                                    Como Novo
                                  </button>
                                </div>
                              </div>
                            )}

                            {isNew && (
                              <span className="inline-flex items-center space-x-1 text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                <span>🟢 Novo Lançamento</span>
                              </span>
                            )}
                          </td>

                          {/* 3. Data */}
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
                            {item.fitId && (
                              <span className="text-[9px] text-slate-400 block font-mono mt-0.5 truncate max-w-[100px]" title={`FITID: ${item.fitId}`}>
                                #{item.fitId}
                              </span>
                            )}
                          </td>

                          {/* 4. Descrição (Edição Inline) */}
                          <td className="py-3 px-3">
                            <div className="space-y-1">
                              <div className="relative">
                                <input
                                  type="text"
                                  value={item.description}
                                  onChange={(e) =>
                                    handleUpdateImportItem(item.id, { description: e.target.value })
                                  }
                                  placeholder="Descrição do lançamento"
                                  className="w-full font-medium border border-slate-200 rounded-lg px-2 py-1 text-xs text-slate-900 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 pr-6"
                                />
                                <Edit3 className="w-3 h-3 text-slate-300 absolute right-2 top-2 pointer-events-none" />
                              </div>
                              {item.originalDescription && item.originalDescription !== item.description && (
                                <span className="text-[10px] text-slate-400 block truncate" title={`Original do banco: ${item.originalDescription}`}>
                                  Extrato: {item.originalDescription}
                                </span>
                              )}
                              {item.isSplit && (
                                <span className="text-[10px] font-bold bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded inline-flex items-center space-x-1">
                                  <Split className="w-2.5 h-2.5" />
                                  <span>Desmembrado ({item.splitIndex}/{item.splitTotal})</span>
                                </span>
                              )}
                            </div>
                          </td>

                          {/* 5. Categoria (Com auto-categorização inteligente) */}
                          <td className="py-3 px-3">
                            <select
                              value={item.categoryId || ''}
                              onChange={(e) =>
                                handleUpdateImportItem(item.id, { categoryId: e.target.value })
                              }
                              className="w-full border border-slate-200 rounded-lg px-2 py-1 text-xs text-slate-800 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
                            >
                              <optgroup label="Despesas">
                                {categories
                                  .filter((c) => !c.archived && c.type === 'EXPENSE')
                                  .map((cat) => (
                                    <option key={cat.id} value={cat.id}>
                                      {cat.name}
                                    </option>
                                  ))}
                              </optgroup>
                              <optgroup label="Receitas">
                                {categories
                                  .filter((c) => !c.archived && c.type === 'INCOME')
                                  .map((cat) => (
                                    <option key={cat.id} value={cat.id}>
                                      {cat.name}
                                    </option>
                                  ))}
                              </optgroup>
                            </select>
                          </td>

                          {/* 6. Escopo & Privacidade */}
                          <td className="py-3 px-3 whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => {
                                const newScope = item.scope === 'FAMILY' ? 'PERSONAL' : 'FAMILY';
                                const newVisibility = newScope === 'PERSONAL' ? 'PERSONAL_PRIVATE' : 'FAMILY';
                                handleUpdateImportItem(item.id, { scope: newScope, visibility: newVisibility });
                              }}
                              className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase transition flex items-center space-x-1 ${
                                item.scope === 'PERSONAL' || item.visibility === 'PERSONAL_PRIVATE'
                                  ? 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                                  : 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                              }`}
                              title={item.scope === 'PERSONAL' ? 'Gasto pessoal (privado com impacto familiar)' : 'Gasto familiar compartilhado'}
                            >
                              {item.scope === 'PERSONAL' || item.visibility === 'PERSONAL_PRIVATE' ? (
                                <>
                                  <Lock className="w-2.5 h-2.5" />
                                  <span>Privado</span>
                                </>
                              ) : (
                                <>
                                  <Users className="w-2.5 h-2.5" />
                                  <span>Familiar</span>
                                </>
                              )}
                            </button>
                          </td>

                          {/* 7. Membro / Titular */}
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

                          {/* 8. Valor */}
                          <td className="py-3 px-4 text-right font-bold whitespace-nowrap">
                            <span className={item.type === 'INCOME' || item.amountCents < 0 ? 'text-emerald-600' : 'text-slate-900'}>
                              {item.type === 'INCOME' ? '+ ' : ''}
                              {formatMoney(Math.abs(item.amountCents))}
                            </span>
                          </td>

                          {/* 9. Ações: Dividir (Split) */}
                          <td className="py-3 px-3 text-center">
                            <button
                              type="button"
                              onClick={() => openSplitModal(item)}
                              className="p-1.5 rounded-lg border border-slate-200 hover:border-purple-300 hover:bg-purple-50 text-slate-600 hover:text-purple-700 transition"
                              title="Dividir lançamento em duas ou mais categorias (Split)"
                            >
                              <Split className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Rodapé Fixo / Confirmação de Gravação */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs text-slate-500 text-center sm:text-left">
              <span>Lançamentos selecionados: </span>
              <strong className="text-slate-900 font-bold">
                {importSummary.selectedCount} de {importPreviewData.length}
              </strong>
              <span className="mx-2">•</span>
              <span>Total a processar: </span>
              <strong className="text-blue-700 font-bold text-sm">
                {formatMoney(importSummary.selectedTotalCents)}
              </strong>
              {importSummary.matchedCount > 0 && (
                <span className="text-amber-700 font-semibold ml-2">
                  ({importSummary.matchedCount} para conciliar)
                </span>
              )}
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
                  Confirmar Importação ({importSummary.selectedCount} Lançamento(s))
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL DE DIVISÃO DE LANÇAMENTO (SPLIT) ================= */}
      {splitModalItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-xl border border-slate-100 space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-base text-slate-900 flex items-center space-x-2">
                  <Split className="w-5 h-5 text-purple-600" />
                  <span>Dividir Lançamento em Múltiplas Categorias</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Lançamento original: <strong>{splitModalItem.description}</strong> ({formatMoney(splitModalItem.amountCents)})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSplitModalItem(null)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Linhas de Divisão */}
            <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
              {splitParts.map((part, idx) => (
                <div key={idx} className="p-3 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700">Parte {idx + 1}</span>
                    {splitParts.length > 2 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveSplitPart(idx)}
                        className="text-red-500 hover:text-red-700 text-xs flex items-center space-x-0.5"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Remover</span>
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div className="sm:col-span-2">
                      <label className="text-[10px] font-semibold text-slate-500 block mb-0.5">Descrição</label>
                      <input
                        type="text"
                        value={part.description}
                        onChange={(e) => handleSplitPartChange(idx, 'description', e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-medium"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-semibold text-slate-500 block mb-0.5">Valor (R$)</label>
                      <input
                        type="text"
                        value={part.amountInput}
                        onChange={(e) => handleSplitPartChange(idx, 'amountInput', e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-900 text-right"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                    <div>
                      <label className="text-[10px] font-semibold text-slate-500 block mb-0.5">Categoria</label>
                      <select
                        value={part.categoryId}
                        onChange={(e) => handleSplitPartChange(idx, 'categoryId', e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-lg px-2 py-1 text-xs"
                      >
                        {categories
                          .filter((c) => !c.archived && c.type === 'EXPENSE')
                          .map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name}
                            </option>
                          ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] font-semibold text-slate-500 block mb-0.5">Membro</label>
                      <select
                        value={part.ownerId}
                        onChange={(e) => handleSplitPartChange(idx, 'ownerId', e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-lg px-2 py-1 text-xs"
                      >
                        {FAMILY_MEMBERS.filter((m) => m.id !== 'user-all').map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.name.replace(/^[👑🏠👤]\s*/u, '')}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] font-semibold text-slate-500 block mb-0.5">Escopo</label>
                      <select
                        value={part.scope}
                        onChange={(e) => {
                          const sc = e.target.value;
                          handleSplitPartChange(idx, 'scope', sc);
                          handleSplitPartChange(idx, 'visibility', sc === 'PERSONAL' ? 'PERSONAL_PRIVATE' : 'FAMILY');
                        }}
                        className="w-full bg-white border border-slate-300 rounded-lg px-2 py-1 text-xs"
                      >
                        <option value="FAMILY">👥 Familiar</option>
                        <option value="PERSONAL">🔒 Pessoal Privado</option>
                      </select>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={handleAddSplitPart}
                className="px-3 py-1.5 rounded-lg border border-purple-200 bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-semibold flex items-center space-x-1 transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Adicionar Outra Divisão</span>
              </button>

              {/* Validação de Soma */}
              {(() => {
                const totalSplit = splitParts.reduce((acc, p) => acc + (p.amountCents || 0), 0);
                const diff = splitModalItem.amountCents - totalSplit;
                const isExact = diff === 0;

                return (
                  <div className="text-right">
                    <span className="text-xs text-slate-500 block">
                      Total dividido: <strong>{formatMoney(totalSplit)}</strong> / {formatMoney(splitModalItem.amountCents)}
                    </span>
                    {!isExact ? (
                      <span className="text-[11px] font-bold text-red-600 block">
                        Diferença restante: {formatMoney(Math.abs(diff))} {diff > 0 ? 'a atribuir' : 'a subtrair'}
                      </span>
                    ) : (
                      <span className="text-[11px] font-bold text-emerald-600 block">
                        ✓ Soma bate perfeitamente 100%
                      </span>
                    )}
                  </div>
                );
              })()}
            </div>

            <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSplitModalItem(null)}
                className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-semibold transition"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmSplit}
                disabled={splitParts.reduce((acc, p) => acc + (p.amountCents || 0), 0) !== splitModalItem.amountCents}
                className="px-5 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-slate-300 text-white rounded-xl text-xs font-semibold shadow-xs transition"
              >
                Aplicar Divisão do Lançamento
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
