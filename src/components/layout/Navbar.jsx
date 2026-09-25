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
  TrendingUp,
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
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const moreMenuRef = useRef(null);
  const userMenuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (moreMenuRef.current && !moreMenuRef.current.contains(event.target)) {
        setIsMoreMenuOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setIsUserMenuOpen(false);
      }
    };
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setIsMoreMenuOpen(false);
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const statusTooltip = isDemoModeState
    ? 'Modo Demonstração (Sandbox 100% em memória)'
    : isCloudConnected
    ? 'Nuvem Conectada (Supabase sincronizado)'
    : 'Modo Local (Armazenamento offline no navegador)';

  const userRoleLabel = isDemoModeState
    ? 'Visitante Demo'
    : currentUser?.role === 'admin'
    ? 'Administrador'
    : 'Membro';

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

      {/* Barra de Navegação Superior */}
      <header className="bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16 gap-3">
          {/* Lado Esquerdo: Protagonismo e Legibilidade da Marca */}
          <div className="flex items-center space-x-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center font-extrabold text-white text-xl shadow-md ring-1 ring-white/10 shrink-0 select-none">
              F
            </div>
            <div className="flex items-center space-x-2.5 min-w-0">
              <h1 className="text-xl font-bold tracking-tight text-white truncate">
                Finanças da Família
              </h1>

              {/* Indicador discreto de status com efeito de pulso e tooltip */}
              <div
                className="relative flex items-center shrink-0 cursor-help"
                title={statusTooltip}
                aria-label={statusTooltip}
              >
                <span className="relative flex h-2.5 w-2.5">
                  {(isDemoModeState || isCloudConnected) && (
                    <span
                      className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                        isDemoModeState ? 'bg-amber-400' : 'bg-emerald-400'
                      }`}
                    />
                  )}
                  <span
                    className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                      isDemoModeState
                        ? 'bg-amber-400'
                        : isCloudConnected
                        ? 'bg-emerald-400'
                        : 'bg-slate-400'
                    }`}
                  />
                </span>
              </div>
            </div>
          </div>

          {/* Lado Direito: Agrupamento Limpo e Funcional dos Controles */}
          <div className="flex items-center space-x-2 sm:space-x-2.5 shrink-0">
            {/* Seletor de Visão Familiar: Pílula Compacta */}
            <div className="flex items-center bg-slate-800/90 hover:bg-slate-800 border border-slate-700/80 rounded-full px-2.5 sm:px-3 py-1.5 shadow-xs transition-colors focus-within:ring-2 focus-within:ring-blue-500/50">
              <Users className="w-3.5 h-3.5 text-blue-400 mr-1.5 shrink-0" />
              <select
                value={currentMemberId}
                onChange={(e) => setCurrentMemberId(e.target.value)}
                className="bg-transparent text-xs font-medium text-slate-200 focus:outline-none cursor-pointer pr-1 max-w-[110px] sm:max-w-[170px] md:max-w-none truncate"
                title="Filtrar visão por membro da família"
                aria-label="Filtrar visão por membro da família"
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

            {/* Botão Utilitário: Olho Mágico (IconButton Minimalista) */}
            <button
              type="button"
              onClick={togglePrivacyMode}
              title={
                isPrivacyMode
                  ? 'Olho Mágico ATIVADO: Todos os valores estão ocultos (R$ •••••). Clique para exibir.'
                  : 'Ativar Olho Mágico: Oculte todos os valores para compartilhar tela com segurança.'
              }
              aria-label={isPrivacyMode ? 'Desativar Olho Mágico' : 'Ativar Olho Mágico'}
              className={`w-9 h-9 rounded-lg border flex items-center justify-center transition active:scale-95 cursor-pointer shrink-0 ${
                isPrivacyMode
                  ? 'bg-amber-500/15 text-amber-300 border-amber-500/60 ring-2 ring-amber-500/30 hover:bg-amber-500/25 shadow-xs'
                  : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white hover:border-slate-600'
              }`}
            >
              {isPrivacyMode ? (
                <EyeOff className="w-4 h-4 text-amber-400 shrink-0" />
              ) : (
                <Eye className="w-4 h-4 text-slate-300 shrink-0" />
              )}
            </button>

            {/* Botão Utilitário: Assistente IA (IconButton Compacto) */}
            <button
              type="button"
              onClick={() => setIsAIChatOpen((prev) => !prev)}
              title={
                isAIChatOpen
                  ? 'Fechar Assistente Financeiro IA (Google Gemini)'
                  : 'Abrir Assistente Financeiro IA (Google Gemini)'
              }
              aria-label="Assistente Financeiro IA"
              className={`w-9 h-9 rounded-lg border flex items-center justify-center transition active:scale-95 cursor-pointer shrink-0 ${
                isAIChatOpen
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-indigo-400 ring-2 ring-indigo-400/40 shadow-inner'
                  : 'bg-gradient-to-r from-slate-800 to-slate-800/90 hover:from-slate-750 hover:to-slate-700 border-slate-700 hover:border-indigo-500/40 text-amber-300 hover:text-amber-200'
              }`}
            >
              <Sparkles className="w-4 h-4 text-amber-300 shrink-0" />
            </button>

            {/* Menu Unificado de Perfil do Usuário */}
            <div className="relative shrink-0" ref={userMenuRef}>
              <button
                type="button"
                onClick={() => setIsUserMenuOpen((prev) => !prev)}
                className="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-500 hover:from-blue-500 hover:to-indigo-400 text-white font-bold text-xs sm:text-sm flex items-center justify-center shadow-xs ring-2 ring-slate-700 hover:ring-blue-400 transition cursor-pointer select-none"
                title={`Perfil: ${currentUser?.name || 'Usuário'}`}
                aria-label="Menu de perfil do usuário"
                aria-expanded={isUserMenuOpen}
              >
                {currentUser?.name?.[0]?.toUpperCase() || 'U'}
              </button>

              {isUserMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-60 bg-slate-900 border border-slate-700/80 rounded-xl shadow-2xl py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-3.5 py-2">
                    <p className="text-xs font-bold text-white truncate leading-tight">
                      {currentUser?.name || 'Usuário'}
                    </p>
                    {currentUser?.email && (
                      <p className="text-[11px] text-slate-400 truncate leading-tight mt-0.5">
                        {currentUser.email}
                      </p>
                    )}
                    <div className="mt-2">
                      <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-blue-950/70 text-blue-300 border border-blue-800/60 inline-block">
                        {userRoleLabel}
                      </span>
                    </div>
                  </div>

                  <div className="border-t border-slate-800 my-1.5" />

                  <button
                    type="button"
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      if (isDemoModeState) {
                        handleExitDemo();
                      } else {
                        handleLogout();
                      }
                    }}
                    className="w-full flex items-center space-x-2 px-3.5 py-2 text-xs font-semibold text-rose-400 hover:text-rose-300 hover:bg-rose-950/30 transition cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5 shrink-0" />
                    <span>{isDemoModeState ? 'Sair da Demonstração' : 'Sair da Conta'}</span>
                  </button>
                </div>
              )}
            </div>

            {/* Ação Principal em Destaque: Novo Lançamento */}
            <button
              type="button"
              onClick={() => openTransactionModal('create')}
              className="bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white text-xs sm:text-sm font-semibold px-3 sm:px-3.5 py-2 rounded-lg flex items-center space-x-1.5 shadow-md shadow-blue-900/30 transition active:scale-95 cursor-pointer shrink-0"
              title="Adicionar novo lançamento financeiro"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
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

            {/* 4. Investimentos */}
            <button
              type="button"
              onClick={() => {
                if (!['savings', 'portfolio'].includes(activeTab)) setActiveTab('savings');
                setIsMoreMenuOpen(false);
              }}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium whitespace-nowrap transition cursor-pointer ${
                ['savings', 'portfolio', 'investments'].includes(activeTab) ? 'bg-blue-600 text-white shadow' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <TrendingUp className="w-4 h-4" />
              <span>Investimentos</span>
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
