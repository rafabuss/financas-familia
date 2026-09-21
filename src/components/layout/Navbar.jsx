import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Eye,
  EyeOff,
  RefreshCw,
  LogOut,
  Users,
  Plus,
  BarChart3,
  RefreshCw as LançamentosIcon,
  Wallet,
  Mail,
  Calendar,
  MoreHorizontal,
  ChevronDown,
  PieChart,
  UploadCloud,
  Download,
} from 'lucide-react';
import { FAMILY_MEMBERS } from '../../data/constants';

export default function Navbar({
  isDemoModeState,
  isCloudConnected,
  isPrivacyMode,
  togglePrivacyMode,
  handleResetDemoSandbox,
  handleExitDemo,
  handleLogout,
  isAIChatOpen,
  setIsAIChatOpen,
  currentUser,
  currentMemberId,
  setCurrentMemberId,
  openTransactionModal,
  activeTab,
  setActiveTab,
}) {
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const moreMenuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (moreMenuRef.current && !moreMenuRef.current.contains(event.target)) {
        setIsMoreMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="sticky top-0 z-30 shadow-md">
      {/* Banner Visual Fixo do Modo Demonstração (Sandbox 100% em Memória) */}
      {isDemoModeState && (
        <div className="bg-gradient-to-r from-amber-600 via-amber-700 to-amber-800 text-white border-b border-amber-500/40 shadow-inner">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 flex flex-wrap items-center justify-between gap-2.5 text-xs sm:text-sm">
            <div className="flex items-center space-x-2.5">
              <span className="flex h-2 w-2 relative shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-300 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-200"></span>
              </span>
              <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-2">
                <span className="font-bold text-white tracking-tight">
                  Modo Demonstração Interativo — Nenhuma alteração é salva
                </span>
                <span className="text-amber-100/80 text-xs hidden lg:inline">
                  (Sandbox 100% em memória • Risco zero aos dados reais)
                </span>
              </div>
            </div>
            <div className="flex items-center space-x-2 self-end sm:self-auto">
              <button
                type="button"
                onClick={togglePrivacyMode}
                className="bg-amber-800/80 hover:bg-amber-800 text-amber-100 hover:text-white border border-amber-500/50 px-2.5 py-1 rounded-lg text-xs font-semibold transition active:scale-95 flex items-center space-x-1 cursor-pointer"
                title={isPrivacyMode ? 'Mostrar valores monetários' : 'Ocultar valores monetários (Olho Mágico)'}
              >
                {isPrivacyMode ? <EyeOff className="w-3.5 h-3.5 text-amber-300" /> : <Eye className="w-3.5 h-3.5 text-amber-300" />}
                <span className="hidden sm:inline">{isPrivacyMode ? 'Valores Ocultos' : 'Olho Mágico'}</span>
              </button>
              <button
                type="button"
                onClick={handleResetDemoSandbox}
                className="bg-amber-800/80 hover:bg-amber-800 text-amber-100 hover:text-white border border-amber-500/50 px-2.5 py-1 rounded-lg text-xs font-semibold transition active:scale-95 flex items-center space-x-1 cursor-pointer"
                title="Restaurar dados originais da demonstração"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Restaurar Dados</span>
              </button>
              <button
                type="button"
                onClick={handleExitDemo}
                className="bg-white hover:bg-slate-100 text-slate-900 px-3 py-1 rounded-lg text-xs font-bold shadow transition active:scale-95 flex items-center space-x-1 cursor-pointer"
                title="Sair da demonstração e voltar aos dados reais"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sair da Demonstração</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Barra de Navegação Superior com Seletor de Perfil / Login Familiar */}
      <header className="bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center font-bold text-xl shadow-inner">
              F
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-lg font-bold tracking-tight">Finanças da Família</h1>
                <span className="text-[10px] bg-blue-900/60 text-blue-300 border border-blue-700 px-2 py-0.5 rounded-full font-semibold">
                  Planejamento Familiar
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">Gestão, Projeções e Orçamento Compartilhado</p>
            </div>
          </div>

          {/* Seletor de Visão / Usuário, Olho Mágico & Botão Novo Lançamento */}
          <div className="flex items-center space-x-2 sm:space-x-2.5">
            {/* Indicador de Nuvem / Local / Demonstração Segura */}
            {isDemoModeState ? (
              <div className="hidden lg:flex items-center space-x-1.5 text-[11px] font-semibold text-amber-300 bg-amber-950/60 border border-amber-700/50 px-2.5 py-1 rounded-full">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Demonstração Segura</span>
              </div>
            ) : isCloudConnected ? (
              <div className="hidden lg:flex items-center space-x-1.5 text-[11px] font-semibold text-emerald-300 bg-emerald-950/60 border border-emerald-700/50 px-2.5 py-1 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>Nuvem Conectada</span>
              </div>
            ) : (
              <div className="hidden lg:flex items-center space-x-1.5 text-[11px] font-semibold text-slate-300 bg-slate-800 border border-slate-700 px-2.5 py-1 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                <span>Modo Local</span>
              </div>
            )}

            {/* Botão Assistente IA (Google Gemini) */}
            <button
              type="button"
              onClick={() => setIsAIChatOpen((prev) => !prev)}
              title="Abrir Assistente Financeiro IA (Google Gemini)"
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition active:scale-95 cursor-pointer shadow-xs ${
                isAIChatOpen
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-indigo-400 shadow-inner ring-1 ring-indigo-400'
                  : 'bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700 hover:text-white hover:border-slate-600'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
              <span className="font-bold text-white">Assistente IA</span>
              <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-full bg-blue-500/30 text-blue-200 border border-blue-400/30 hidden sm:inline">
                Gemini
              </span>
            </button>

            {/* Botão Modo Privacidade (Olho Mágico para Compartilhamento de Tela) */}
            <button
              type="button"
              onClick={togglePrivacyMode}
              title={
                isPrivacyMode
                  ? 'Olho Mágico ATIVADO: Todos os valores estão ocultos (R$ •••••). Clique para exibir.'
                  : 'Ativar Olho Mágico: Oculte todos os valores para compartilhar tela com segurança.'
              }
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition active:scale-95 cursor-pointer shadow-xs ${
                isPrivacyMode
                  ? 'bg-amber-500/25 text-amber-300 border-amber-500/60 hover:bg-amber-500/35 ring-1 ring-amber-500/40 shadow-inner'
                  : 'bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700 hover:text-white hover:border-slate-600'
              }`}
            >
              {isPrivacyMode ? (
                <>
                  <EyeOff className="w-4 h-4 text-amber-400 shrink-0 animate-pulse" />
                  <span className="font-bold text-amber-300">Olho Mágico</span>
                  <span className="text-[10px] bg-amber-500/30 text-amber-200 px-1.5 py-0.5 rounded-full font-bold ml-0.5">Oculto</span>
                </>
              ) : (
                <>
                  <Eye className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Olho Mágico</span>
                </>
              )}
            </button>

            {/* Perfil do Usuário Logado */}
            <div className="flex items-center space-x-2 bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 shadow-sm">
              <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
                {currentUser?.name?.[0] || 'U'}
              </div>
              <div className="hidden sm:block text-left leading-tight">
                <div className="text-xs font-bold text-white leading-none">{currentUser?.name}</div>
                <span className="text-[9px] uppercase font-bold text-blue-400">
                  {isDemoModeState ? 'Visitante Demo' : currentUser?.role === 'admin' ? 'Administrador' : 'Membro'}
                </span>
              </div>
              <button
                type="button"
                onClick={isDemoModeState ? handleExitDemo : handleLogout}
                className="text-slate-400 hover:text-rose-400 hover:bg-slate-700 p-1 rounded transition flex items-center space-x-1 ml-1 cursor-pointer"
                title={isDemoModeState ? "Sair do modo demo" : "Sair da conta"}
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="text-[11px] font-medium hidden md:inline">Sair</span>
              </button>
            </div>

            {/* Seletor de Visão (Filtrado pelo Perfil do Usuário) */}
            <div className="flex items-center bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 shadow-sm">
              <Users className="w-4 h-4 text-slate-400 mr-2" />
              <select
                value={currentMemberId}
                onChange={(e) => setCurrentMemberId(e.target.value)}
                className="bg-transparent text-xs font-semibold text-white focus:outline-none cursor-pointer"
              >
                {FAMILY_MEMBERS.filter((m) => {
                  if (isDemoModeState || currentUser?.role === 'admin') return true;
                  return m.id === 'family-shared' || m.id === currentUser?.memberKey;
                }).map((m) => (
                  <option key={m.id} value={m.id} className="bg-slate-900 text-white">
                    {m.name}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={() => openTransactionModal('create')}
              className="bg-blue-600 hover:bg-blue-500 text-white text-xs sm:text-sm font-semibold px-3 py-2 rounded-lg flex items-center space-x-1.5 shadow-sm transition active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Novo Lançamento</span>
            </button>
          </div>
        </div>

        {/* Abas Principais: 5 Módulos Principais + Menu Mais */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-slate-800 flex items-center justify-between py-2 relative">
          <div className="flex space-x-1 sm:space-x-1.5 overflow-x-auto py-0.5 scrollbar-none flex-1 min-w-0 pr-2">
            {/* 1. Visão Geral */}
            <button
              type="button"
              onClick={() => {
                setActiveTab('dashboard');
                setIsMoreMenuOpen(false);
              }}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium whitespace-nowrap transition cursor-pointer ${
                activeTab === 'dashboard' ? 'bg-blue-600 text-white shadow' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>Visão Geral</span>
            </button>

            {/* 2. Lançamentos */}
            <button
              type="button"
              onClick={() => {
                setActiveTab('transactions');
                setIsMoreMenuOpen(false);
              }}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium whitespace-nowrap transition cursor-pointer ${
                activeTab === 'transactions' ? 'bg-blue-600 text-white shadow' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <LançamentosIcon className="w-4 h-4" />
              <span>Lançamentos</span>
            </button>

            {/* 3. Contas & Faturas */}
            <button
              type="button"
              onClick={() => {
                if (!['accounts', 'faturas'].includes(activeTab)) setActiveTab('accounts');
                setIsMoreMenuOpen(false);
              }}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium whitespace-nowrap transition cursor-pointer ${
                ['accounts', 'faturas'].includes(activeTab) ? 'bg-blue-600 text-white shadow' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Wallet className="w-4 h-4" />
              <span>Contas & Faturas</span>
            </button>

            {/* 4. Envelopes & Categorias */}
            <button
              type="button"
              onClick={() => {
                if (!['envelopes', 'categories'].includes(activeTab)) setActiveTab('envelopes');
                setIsMoreMenuOpen(false);
              }}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium whitespace-nowrap transition cursor-pointer ${
                ['envelopes', 'categories'].includes(activeTab) ? 'bg-blue-600 text-white shadow' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Mail className="w-4 h-4" />
              <span>Envelopes & Categorias</span>
            </button>

            {/* 5. Projeções & Cenários */}
            <button
              type="button"
              onClick={() => {
                if (!['projections', 'scenarios'].includes(activeTab)) setActiveTab('projections');
                setIsMoreMenuOpen(false);
              }}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium whitespace-nowrap transition cursor-pointer ${
                ['projections', 'scenarios'].includes(activeTab) ? 'bg-blue-600 text-white shadow' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span>Projeções & Cenários</span>
            </button>
          </div>

          {/* 6. Menu Mais ▾ (Posicionado fora do scroll horizontal para que o dropdown nunca seja recortado/clipado) */}
          <div className="relative shrink-0 ml-1 sm:ml-2" ref={moreMenuRef}>
            <button
              type="button"
              onClick={() => setIsMoreMenuOpen((prev) => !prev)}
              className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium whitespace-nowrap transition cursor-pointer ${
                ['charts', 'import', 'exports'].includes(activeTab) || isMoreMenuOpen
                  ? 'bg-blue-600/90 text-white shadow'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <MoreHorizontal className="w-4 h-4" />
              <span>Mais</span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isMoreMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            {isMoreMenuOpen && (
              <div
                className="absolute right-0 top-full mt-1.5 w-56 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150"
                style={{ minWidth: '220px' }}
              >
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('charts');
                    setIsMoreMenuOpen(false);
                  }}
                  className={`w-full flex items-center space-x-2.5 px-3.5 py-2.5 text-xs sm:text-sm text-left transition cursor-pointer ${
                    activeTab === 'charts' ? 'bg-blue-600 text-white font-semibold' : 'text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  <PieChart className="w-4 h-4 text-blue-400" />
                  <span>Gráficos & Análise</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('import');
                    setIsMoreMenuOpen(false);
                  }}
                  className={`w-full flex items-center space-x-2.5 px-3.5 py-2.5 text-xs sm:text-sm text-left transition cursor-pointer ${
                    activeTab === 'import' ? 'bg-blue-600 text-white font-semibold' : 'text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  <UploadCloud className="w-4 h-4 text-emerald-400" />
                  <span>Importar Fatura / Extrato</span>
                </button>
                <div className="border-t border-slate-800 my-1" />
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('exports');
                    setIsMoreMenuOpen(false);
                  }}
                  className={`w-full flex items-center space-x-2.5 px-3.5 py-2.5 text-xs sm:text-sm text-left transition cursor-pointer ${
                    activeTab === 'exports' ? 'bg-blue-600 text-white font-semibold' : 'text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  <Download className="w-4 h-4 text-amber-400" />
                  <span>Backup & Exportar</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>
    </div>
  );
}
