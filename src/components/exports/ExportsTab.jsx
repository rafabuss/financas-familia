import React from 'react';
import {
  Download,
  FileSpreadsheet,
  Eye,
  EyeOff,
  Sparkles,
  Trash2,
} from 'lucide-react';

export default function ExportsTab({
  exportData,
  isPrivacyMode,
  togglePrivacyMode,
  isDemoModeState,
  handleLoadDemoData,
  handleClearOnlyDemo,
  handleResetEntireSystem,
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm max-w-xl mx-auto space-y-6">
      <div>
        <h2 className="text-lg font-bold text-slate-900">Backup e Portabilidade Familiar</h2>
        <p className="text-xs text-slate-500">
          Exporte todos os lançamentos com marcação de titularidade familiar ou individual.
        </p>
      </div>

      <div className="space-y-4">
        <div className="p-4 border border-slate-100 bg-slate-50 rounded-xl flex items-center justify-between">
          <div>
            <h4 className="font-bold text-sm text-slate-900">Exportar Banco Completo (JSON)</h4>
            <p className="text-xs text-slate-500">Contas, cartões, lançamentos e simulações</p>
          </div>
          <button
            type="button"
            onClick={() => exportData('json')}
            className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2 rounded-lg flex items-center space-x-1 cursor-pointer transition active:scale-95 shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Baixar JSON</span>
          </button>
        </div>

        <div className="p-4 border border-slate-100 bg-slate-50 rounded-xl flex items-center justify-between">
          <div>
            <h4 className="font-bold text-sm text-slate-900">Planilha de Lançamentos (CSV)</h4>
            <p className="text-xs text-slate-500">Compatível com Excel e Google Planilhas</p>
          </div>
          <button
            type="button"
            onClick={() => exportData('csv')}
            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-4 py-2 rounded-lg flex items-center space-x-1 cursor-pointer transition active:scale-95 shadow-sm"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Baixar CSV</span>
          </button>
        </div>

        <div className="p-4 border border-purple-100 bg-purple-50/60 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h4 className="font-bold text-sm text-purple-900 flex items-center space-x-1.5">
              {isPrivacyMode ? <EyeOff className="w-4 h-4 text-purple-600" /> : <Eye className="w-4 h-4 text-purple-600" />}
              <span>Modo Privacidade ("Olho Mágico")</span>
            </h4>
            <p className="text-xs text-purple-700">
              Oculta todos os saldos e valores monetários na tela (exibindo R$ •••••) para permitir apresentar ou compartilhar tela com segurança.
            </p>
          </div>
          <button
            type="button"
            onClick={togglePrivacyMode}
            className={`text-xs font-semibold px-4 py-2 rounded-lg flex items-center space-x-1.5 shadow-sm transition active:scale-95 whitespace-nowrap self-start sm:self-auto cursor-pointer ${
              isPrivacyMode
                ? 'bg-amber-600 hover:bg-amber-700 text-white'
                : 'bg-purple-600 hover:bg-purple-700 text-white'
            }`}
          >
            {isPrivacyMode ? (
              <>
                <EyeOff className="w-3.5 h-3.5" />
                <span>Desativar (Valores Ocultos)</span>
              </>
            ) : (
              <>
                <Eye className="w-3.5 h-3.5" />
                <span>Ativar Olho Mágico</span>
              </>
            )}
          </button>
        </div>

        {/* Seção Modo Demonstração e Gerenciamento de Dados */}
        <div className="pt-4 border-t border-slate-200 space-y-4">
          <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-1.5">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>Modo Demonstração & Gerenciamento de Dados</span>
          </h3>

          <div className="p-4 border border-blue-100 bg-blue-50/60 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h4 className="font-bold text-sm text-blue-900">Modo Demonstração Seguro (Sandbox)</h4>
              <p className="text-xs text-blue-700">
                Abre a plataforma com dados ricos de simulação isolados 100% em memória, com risco zero aos seus dados reais.
              </p>
            </div>
            <button
              type="button"
              onClick={handleLoadDemoData}
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2 rounded-lg flex items-center space-x-1 shadow-sm transition active:scale-95 whitespace-nowrap self-start sm:self-auto cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Iniciar Demonstração</span>
            </button>
          </div>

          <div className="p-4 border border-amber-100 bg-amber-50/60 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h4 className="font-bold text-sm text-amber-900">
                {isDemoModeState ? 'Restaurar Dados Padrão da Demo' : 'Remover Apenas Dados de Exemplo'}
              </h4>
              <p className="text-xs text-amber-700">
                {isDemoModeState
                  ? 'Reseta todas as alterações temporárias feitas nesta sessão de demonstração para o estado original.'
                  : 'Remove somente lançamentos e registros fictícios de demonstração, mantendo 100% intactos seus lançamentos reais, contas e saldos.'}
              </p>
            </div>
            <button
              type="button"
              onClick={handleClearOnlyDemo}
              className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold px-4 py-2 rounded-lg flex items-center space-x-1 shadow-sm transition active:scale-95 whitespace-nowrap self-start sm:self-auto cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{isDemoModeState ? 'Restaurar Sandbox' : 'Limpar Exemplos'}</span>
            </button>
          </div>

          <div className="p-4 border border-rose-100 bg-rose-50/60 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h4 className="font-bold text-sm text-rose-900">Zerar Todo o Sistema (Reset Completo)</h4>
              <p className="text-xs text-rose-600">
                Exclui todas as contas, cartões, lançamentos e cenários, deixando a aplicação 100% vazia para iniciar do zero.
              </p>
            </div>
            <button
              type="button"
              onClick={handleResetEntireSystem}
              className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold px-4 py-2 rounded-lg flex items-center space-x-1 shadow-sm transition active:scale-95 whitespace-nowrap self-start sm:self-auto cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Reset Completo</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
