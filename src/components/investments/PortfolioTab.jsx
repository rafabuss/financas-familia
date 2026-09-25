import React from 'react';
import {
  TrendingUp,
  Landmark,
  Building2,
  Coins,
  PieChart,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  Clock,
  CheckCircle2,
  Calendar,
} from 'lucide-react';

export default function PortfolioTab() {
  return (
    <div className="space-y-6">
      {/* ===================== BANNER PRINCIPAL: FASE 6.2 ===================== */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 text-white p-6 sm:p-8 rounded-3xl shadow-md border border-slate-700/80 relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-10 -translate-y-10 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-3xl">
          <div className="flex items-center space-x-2.5 mb-2.5">
            <span className="p-1.5 bg-blue-500/20 text-blue-400 border border-blue-400/30 rounded-lg">
              <TrendingUp className="w-5 h-5" />
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-blue-300">
              Módulo de Investimentos • Fase 6.2
            </span>
            <span className="text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full">
              Próxima Fase no Roadmap
            </span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Carteira de Ativos & Renda Variável
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-2 leading-relaxed">
            Em breve você poderá consolidar todos os ativos de médio e longo prazo da família: Ações da B3, Fundos Imobiliários (FIIs), Criptomoedas e títulos do Tesouro Direto, com acompanhamento de preço médio, rentabilidade e gráfico de alocação de patrimônio líquido.
          </p>
        </div>
      </div>

      {/* ===================== CARDS DOS PILARES DE ATIVOS (PREVIEW FASE 6.2) ===================== */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Pilar 1: Tesouro & Renda Fixa */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-3">
              <Landmark className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-sm">Tesouro & Renda Fixa Longa</h3>
            <p className="text-xs text-slate-500 mt-1">
              Tesouro Selic, IPCA+ com juros semestrais, CDBs, LCIs e LCAs com vencimentos planejados.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 font-medium">
            <span>Planejamento de Longo Prazo</span>
            <span className="text-emerald-600 font-bold">Fase 6.2</span>
          </div>
        </div>

        {/* Pilar 2: Ações & Empresas */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
              <TrendingUp className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-sm">Ações da B3</h3>
            <p className="text-xs text-slate-500 mt-1">
              Participação em empresas brasileiras (VALE3, PETR4, ITUB4, etc.), preço médio de aquisição e histórico de dividendos.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 font-medium">
            <span>Crescimento & Proventos</span>
            <span className="text-blue-600 font-bold">Fase 6.2</span>
          </div>
        </div>

        {/* Pilar 3: Fundos Imobiliários */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-3">
              <Building2 className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-sm">Fundos Imobiliários (FIIs)</h3>
            <p className="text-xs text-slate-500 mt-1">
              Renda passiva mensal isenta de IR vinda de galpões logísticos, lajes corporativas e recebíveis imobiliários.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 font-medium">
            <span>Renda Mensal Passiva</span>
            <span className="text-purple-600 font-bold">Fase 6.2</span>
          </div>
        </div>

        {/* Pilar 4: Criptoativos */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center mb-3">
              <Coins className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-sm">Criptoativos</h3>
            <p className="text-xs text-slate-500 mt-1">
              Bitcoin, Ethereum e stablecoins custodiados em corretoras ou carteiras frias da família.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 font-medium">
            <span>Reserva de Valor Global</span>
            <span className="text-orange-600 font-bold">Fase 6.2</span>
          </div>
        </div>
      </div>

      {/* ===================== PREVIEW DO PAINEL DE ALOCAÇÃO ===================== */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
              <PieChart className="w-5 h-5 text-indigo-600" />
              <span>Visão de Alocação de Patrimônio (Prévia da Arquitetura)</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Como a riqueza da família será balanceada entre reserva líquida, renda fixa, ativos geradores de renda e ativos de crescimento
            </p>
          </div>
          <span className="text-[11px] bg-slate-100 text-slate-600 px-3 py-1 rounded-full font-semibold border border-slate-200">
            Modelo Recomendado
          </span>
        </div>

        {/* Gráfico / Barras de Demonstração de Alocação */}
        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-xs font-semibold mb-1">
              <span className="text-emerald-700 flex items-center space-x-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span>Reserva de Emergência & Cofrinhos CDI (Fase 6.1 - Ativa!)</span>
              </span>
              <span className="text-slate-900">40% do Patrimônio</span>
            </div>
            <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 rounded-full" style={{ width: '40%' }} />
            </div>
          </div>

          <div>
            <div className="flex justify-between text-xs font-semibold mb-1">
              <span className="text-blue-700 flex items-center space-x-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                <span>Renda Fixa de Longo Prazo & Tesouro Direto (Fase 6.2)</span>
              </span>
              <span className="text-slate-900">30% do Patrimônio</span>
            </div>
            <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
              <div className="h-full bg-blue-500 rounded-full" style={{ width: '30%' }} />
            </div>
          </div>

          <div>
            <div className="flex justify-between text-xs font-semibold mb-1">
              <span className="text-purple-700 flex items-center space-x-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
                <span>Fundos Imobiliários & Ações Dividendos (Fase 6.2)</span>
              </span>
              <span className="text-slate-900">20% do Patrimônio</span>
            </div>
            <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
              <div className="h-full bg-purple-500 rounded-full" style={{ width: '20%' }} />
            </div>
          </div>

          <div>
            <div className="flex justify-between text-xs font-semibold mb-1">
              <span className="text-amber-700 flex items-center space-x-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                <span>Criptoativos & Ativos Globais (Fase 6.2)</span>
              </span>
              <span className="text-slate-900">10% do Patrimônio</span>
            </div>
            <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
              <div className="h-full bg-amber-500 rounded-full" style={{ width: '10%' }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
