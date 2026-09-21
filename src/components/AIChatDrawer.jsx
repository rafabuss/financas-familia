import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Sparkles,
  Send,
  Trash2,
  X,
  Key,
  CheckCircle2,
  TrendingUp,
  ArrowRight,
  ExternalLink,
  Eye,
  EyeOff,
  RotateCcw,
  Bot,
  Check,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import {
  sendMessageToGemini,
  getGeminiApiKey,
  setGeminiApiKey,
  removeGeminiApiKey,
  hasGeminiApiKey,
  getSelectedModel,
  setSelectedModel,
  AVAILABLE_MODELS,
} from '../services/aiService';

const CHAT_STORAGE_KEY = 'financas_ai_chat_history_v1';

// Formatador Monetário Seguro
const formatMoney = (cents = 0) => {
  return (cents / 100).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
};

// Formatação simples e robusta de Markdown (Negrito, Listas, Quebras e Moedas)
function SimpleMarkdown({ text }) {
  if (!text) return null;

  const lines = text.split('\n');

  return (
    <div className="space-y-1.5 text-xs sm:text-sm leading-relaxed text-slate-800">
      {lines.map((line, idx) => {
        const trimmed = line.trim();
        if (!trimmed) {
          return <div key={idx} className="h-1" />;
        }

        // Títulos markdown (###, ##, #)
        if (trimmed.startsWith('### ')) {
          return (
            <h4 key={idx} className="font-bold text-slate-900 text-xs sm:text-sm mt-2 mb-1">
              {trimmed.replace(/^###\s+/, '')}
            </h4>
          );
        }
        if (trimmed.startsWith('## ')) {
          return (
            <h3 key={idx} className="font-bold text-slate-900 text-sm sm:text-base mt-2 mb-1">
              {trimmed.replace(/^##\s+/, '')}
            </h3>
          );
        }

        // Itens de lista (- ou *)
        const isListItem = trimmed.startsWith('- ') || trimmed.startsWith('* ');
        const cleanContent = isListItem ? trimmed.slice(2) : trimmed;

        // Processa negrito **texto** e valores monetários
        const parts = [];
        let cursor = 0;
        const boldRegex = /\*\*(.*?)\*\*/g;
        let match;

        while ((match = boldRegex.exec(cleanContent)) !== null) {
          if (match.index > cursor) {
            parts.push(cleanContent.substring(cursor, match.index));
          }
          parts.push(
            <strong key={match.index} className="font-semibold text-slate-900">
              {match[1]}
            </strong>
          );
          cursor = match.index + match[0].length;
        }
        if (cursor < cleanContent.length) {
          parts.push(cleanContent.substring(cursor));
        }

        if (isListItem) {
          return (
            <div key={idx} className="flex items-start space-x-2 pl-1">
              <span className="text-blue-500 font-bold leading-none mt-1.5 text-[10px]">•</span>
              <div className="flex-1">{parts}</div>
            </div>
          );
        }

        return <p key={idx}>{parts}</p>;
      })}
    </div>
  );
}

export default function AIChatDrawer({
  dashboardMonth,
  accounts = [],
  cards = [],
  categories = [],
  transactions = [],
  scenarios = [],
  monthlyEnvelopes = [],
  accountBalances = {},
  cardStats = {},
  monthSummary = {},
  dashboardEnvelopes = {},
  isDemo = false,
  onCreateTransaction,
  onCreateScenario,
  onNavigateTab,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState(() => {
    try {
      const saved = sessionStorage.getItem(CHAT_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  });

  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [keyInputValue, setKeyInputValue] = useState('');
  const [showKeySecret, setShowKeySecret] = useState(false);
  const [keySavedToast, setKeySavedToast] = useState(false);
  const [hasKey, setHasKey] = useState(hasGeminiApiKey());
  const [activeModel, setActiveModelState] = useState(getSelectedModel());

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Auto scroll para o final do chat
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, isLoading]);

  // Salva histórico na sessionStorage
  useEffect(() => {
    try {
      sessionStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(messages));
    } catch {}
  }, [messages]);

  // Foco no input ao abrir
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 150);
      setHasKey(hasGeminiApiKey());
    }
  }, [isOpen]);

  const monthLabel = useMemo(() => {
    if (!dashboardMonth) return '';
    try {
      const [year, month] = dashboardMonth.split('-');
      const date = new Date(parseInt(year, 10), parseInt(month, 10) - 1, 1);
      return date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
    } catch {
      return dashboardMonth;
    }
  }, [dashboardMonth]);

  // Contexto financeiro atualizado para envio ao Gemini
  const financialContext = useMemo(() => {
    return {
      dashboardMonth,
      monthLabel,
      accounts,
      cards,
      categories,
      accountBalances,
      cardStats,
      monthSummary,
      dashboardEnvelopes,
      isDemo,
    };
  }, [
    dashboardMonth,
    monthLabel,
    accounts,
    cards,
    categories,
    accountBalances,
    cardStats,
    monthSummary,
    dashboardEnvelopes,
    isDemo,
  ]);

  // Manipulador de Tool Calling para execução de transações e simulações
  const handleExecuteTool = async (name, args) => {
    if (name === 'criar_transacao') {
      if (!onCreateTransaction) {
        throw new Error('Função de criação de transação não disponível.');
      }
      const result = await onCreateTransaction(args);
      return result;
    }

    if (name === 'simular_cenario') {
      if (!onCreateScenario) {
        throw new Error('Função de simulação de cenário não disponível.');
      }
      const result = await onCreateScenario(args);
      return result;
    }

    throw new Error(`Ferramenta desconhecida: ${name}`);
  };

  const handleSendMessage = async (textToSend) => {
    const text = (textToSend || inputMessage).trim();
    if (!text || isLoading) return;

    if (!hasGeminiApiKey()) {
      setShowKeyModal(true);
      return;
    }

    const userMsg = {
      id: `msg-${Date.now()}-user`,
      role: 'user',
      content: text,
      timestamp: new Date().toISOString(),
    };

    const updatedHistory = [...messages, userMsg];
    setMessages(updatedHistory);
    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await sendMessageToGemini({
        messages: updatedHistory,
        financialContext,
        onExecuteTool: handleExecuteTool,
        model: activeModel,
      });

      // Se executou alguma ferramenta, prepara os cards de ação
      let actionCards = [];
      if (response.toolExecutions?.length > 0) {
        actionCards = response.toolExecutions.map((exec) => {
          if (exec.name === 'criar_transacao' && exec.result?.transaction) {
            return {
              type: 'TRANSACTION_CREATED',
              data: exec.result.transaction,
              categoryName: exec.result.categoryName || exec.args.categoria_nome,
              sourceName: exec.result.sourceName || exec.args.conta_ou_cartao_nome,
            };
          }
          if (exec.name === 'simular_cenario' && exec.result?.scenario) {
            return {
              type: 'SCENARIO_CREATED',
              data: exec.result.scenario,
            };
          }
          return null;
        }).filter(Boolean);
      }

      const assistantMsg = {
        id: `msg-${Date.now()}-assistant`,
        role: 'assistant',
        content: response.text,
        timestamp: new Date().toISOString(),
        actionCards,
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      console.error('Erro no chat da IA:', err);
      let errorText = err.message || 'Desculpe, ocorreu um erro ao processar sua mensagem.';

      if (errorText.includes('CHAVE_NAO_CONFIGURADA') || errorText.includes('CHAVE_INVALIDA')) {
        setShowKeyModal(true);
      }

      const errorMsg = {
        id: `msg-${Date.now()}-error`,
        role: 'assistant',
        content: `⚠️ **Aviso**: ${errorText}`,
        timestamp: new Date().toISOString(),
        isError: true,
      };

      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearHistory = () => {
    if (confirm('Deseja limpar todo o histórico de conversa com o Assistente IA?')) {
      setMessages([]);
      sessionStorage.removeItem(CHAT_STORAGE_KEY);
    }
  };

  const handleSaveApiKey = (e) => {
    e.preventDefault();
    if (!keyInputValue.trim()) {
      removeGeminiApiKey();
      setHasKey(false);
    } else {
      setGeminiApiKey(keyInputValue);
      setHasKey(true);
      setKeySavedToast(true);
      setTimeout(() => setKeySavedToast(false), 2500);
    }
    setShowKeyModal(false);
  };

  const handleOpenKeyModal = () => {
    setKeyInputValue(getGeminiApiKey());
    setShowKeyModal(true);
  };

  const handleModelChange = (e) => {
    const newModel = e.target.value;
    setSelectedModel(newModel);
    setActiveModelState(newModel);
  };

  const quickChips = [
    { label: '📊 Resumo do mês', prompt: 'Faça um resumo geral da nossa situação financeira neste mês.' },
    { label: '💳 Situação das faturas', prompt: 'Como estão as faturas dos meus cartões de crédito e limites disponíveis?' },
    { label: '✉️ Como estão meus envelopes?', prompt: 'Quais envelopes orçamentários estão no limite ou estourados neste mês?' },
    { label: '💡 Dicas para economizar', prompt: 'Analisando meus gastos deste mês, quais dicas práticas você me dá para economizar?' },
  ];

  return (
    <>
      {/* Botão Flutuante de Acesso (FAB) */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label="Abrir Assistente Financeiro de IA"
        title="Conversar com o Assistente IA (Google Gemini)"
        className={`fixed bottom-6 right-6 z-40 group flex items-center justify-center rounded-full shadow-xl transition-all duration-300 transform active:scale-95 ${
          isOpen
            ? 'w-12 h-12 bg-slate-800 text-white hover:bg-slate-900 rotate-90 shadow-slate-900/20'
            : 'px-4 py-3.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 text-white hover:shadow-indigo-500/30 hover:scale-105'
        }`}
      >
        {isOpen ? (
          <X className="w-5 h-5 transition-transform" />
        ) : (
          <div className="flex items-center space-x-2">
            <div className="relative">
              <Sparkles className="w-5 h-5 text-amber-300 animate-pulse" />
              <span className="absolute -top-1 -right-1 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
            </div>
            <span className="text-xs font-bold tracking-wide pr-1 hidden sm:inline">Assistente IA</span>
          </div>
        )}
      </button>

      {/* Drawer / Modal Flutuante de Conversação */}
      {isOpen && (
        <div className="fixed inset-x-3 bottom-20 sm:bottom-20 sm:right-6 sm:left-auto z-40 w-auto sm:w-[440px] max-w-full h-[78vh] sm:h-[620px] max-h-[82vh] bg-white rounded-3xl shadow-2xl border border-slate-200/90 flex flex-col overflow-hidden animate-in slide-in-from-bottom-6 duration-200">
          {/* Header do Chat */}
          <div className="px-4 py-3.5 bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white flex items-center justify-between shrink-0 shadow-sm">
            <div className="flex items-center space-x-2.5">
              <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-blue-500 to-indigo-500 flex items-center justify-center shadow-inner">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="flex items-center space-x-1.5">
                  <h3 className="text-sm font-bold tracking-tight text-white">Assistente Financeiro</h3>
                  <span className="text-[9px] font-semibold uppercase px-1.5 py-0.5 rounded-full bg-blue-500/30 text-blue-200 border border-blue-400/30">
                    Gemini
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 capitalize flex items-center space-x-1">
                  <span>{monthLabel}</span>
                  <span>•</span>
                  <span className={isDemo ? 'text-amber-300 font-medium' : 'text-emerald-300 font-medium'}>
                    {isDemo ? 'Modo Demo' : 'Modo Real'}
                  </span>
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-1">
              <button
                type="button"
                onClick={handleOpenKeyModal}
                title="Configurar chave da API Gemini"
                className={`p-2 rounded-xl transition ${
                  hasKey
                    ? 'text-slate-300 hover:text-white hover:bg-white/10'
                    : 'text-amber-400 bg-amber-400/20 hover:bg-amber-400/30 animate-pulse'
                }`}
              >
                <Key className="w-4 h-4" />
              </button>
              {messages.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearHistory}
                  title="Limpar conversa"
                  className="p-2 text-slate-300 hover:text-rose-300 hover:bg-white/10 rounded-xl transition"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                title="Fechar"
                className="p-2 text-slate-300 hover:text-white hover:bg-white/10 rounded-xl transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Banner de Chave Ausente */}
          {!hasKey && (
            <div className="p-3 bg-amber-50 border-b border-amber-200 flex items-center justify-between text-xs text-amber-900 shrink-0">
              <div className="flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Chave do Google Gemini não configurada.</span>
              </div>
              <button
                type="button"
                onClick={handleOpenKeyModal}
                className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-semibold text-[11px] transition shrink-0 ml-2"
              >
                Configurar
              </button>
            </div>
          )}

          {/* Área de Mensagens do Chat */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
            {messages.length === 0 && (
              <div className="py-6 px-2 text-center space-y-4">
                <div className="w-14 h-14 mx-auto rounded-3xl bg-blue-100 text-blue-600 flex items-center justify-center shadow-sm">
                  <Bot className="w-7 h-7" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-slate-800">Olá! Como posso ajudar sua família hoje?</h4>
                  <p className="text-xs text-slate-500 max-w-xs mx-auto">
                    Analiso seus saldos, faturas, despesas e envelopes em tempo real. Você também pode me pedir para anotar despesas ou simular planos futuros.
                  </p>
                </div>

                {/* Chips de início rápido */}
                <div className="pt-2 space-y-1.5 text-left">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-1">Perguntas Rápidas:</p>
                  <div className="grid grid-cols-1 gap-1.5">
                    {quickChips.map((chip, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleSendMessage(chip.prompt)}
                        className="w-full text-left px-3 py-2 text-xs font-medium text-slate-700 bg-white hover:bg-blue-50/80 hover:text-blue-700 border border-slate-200/80 rounded-xl transition flex items-center justify-between group shadow-2xs"
                      >
                        <span>{chip.label}</span>
                        <ArrowRight className="w-3 h-3 text-slate-300 group-hover:text-blue-600 transition" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {messages.map((msg) => {
              const isUser = msg.role === 'user';
              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} space-y-1`}
                >
                  <div className="flex items-center space-x-1 px-1">
                    <span className="text-[10px] font-semibold text-slate-400">
                      {isUser ? 'Você' : 'Assistente IA'}
                    </span>
                    <span className="text-[9px] text-slate-300">
                      {msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                    </span>
                  </div>

                  <div
                    className={`max-w-[88%] rounded-2xl px-3.5 py-2.5 shadow-2xs ${
                      isUser
                        ? 'bg-blue-600 text-white rounded-br-xs'
                        : msg.isError
                        ? 'bg-rose-50 text-rose-900 border border-rose-200 rounded-bl-xs'
                        : 'bg-white text-slate-800 border border-slate-200/80 rounded-bl-xs'
                    }`}
                  >
                    {isUser ? (
                      <p className="text-xs sm:text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                    ) : (
                      <SimpleMarkdown text={msg.content} />
                    )}

                    {/* Cards Visuais de Ações Executadas */}
                    {msg.actionCards && msg.actionCards.length > 0 && (
                      <div className="mt-3 pt-2 border-t border-slate-100 space-y-2">
                        {msg.actionCards.map((card, cIdx) => {
                          if (card.type === 'TRANSACTION_CREATED') {
                            const tx = card.data;
                            const isExpense = tx.type === 'EXPENSE';
                            return (
                              <div
                                key={cIdx}
                                className="p-3 bg-emerald-50/90 border border-emerald-200/90 rounded-xl space-y-2 shadow-2xs"
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center space-x-1.5 text-emerald-800">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                    <span className="text-[11px] font-bold uppercase tracking-wide">
                                      Lançamento Registrado
                                    </span>
                                  </div>
                                  <span
                                    className={`text-xs font-bold ${
                                      isExpense ? 'text-rose-700' : 'text-emerald-700'
                                    }`}
                                  >
                                    {isExpense ? '-' : '+'}
                                    {formatMoney(tx.amountCents)}
                                  </span>
                                </div>
                                <div className="text-xs text-slate-700">
                                  <strong className="text-slate-900">{tx.description}</strong>
                                  <div className="text-[11px] text-slate-500 mt-0.5 flex items-center space-x-1.5">
                                    <span>{card.categoryName || 'Sem Categoria'}</span>
                                    {card.sourceName && (
                                      <>
                                        <span>•</span>
                                        <span>{card.sourceName}</span>
                                      </>
                                    )}
                                    <span>•</span>
                                    <span>{tx.date}</span>
                                  </div>
                                </div>
                                {onNavigateTab && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      onNavigateTab('transactions');
                                    }}
                                    className="w-full text-center py-1.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition flex items-center justify-center space-x-1 shadow-2xs"
                                  >
                                    <span>Ver no Extrato</span>
                                    <ArrowRight className="w-3 h-3" />
                                  </button>
                                )}
                              </div>
                            );
                          }

                          if (card.type === 'SCENARIO_CREATED') {
                            const scen = card.data;
                            return (
                              <div
                                key={cIdx}
                                className="p-3 bg-indigo-50/90 border border-indigo-200/90 rounded-xl space-y-2 shadow-2xs"
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center space-x-1.5 text-indigo-800">
                                    <TrendingUp className="w-4 h-4 text-indigo-600" />
                                    <span className="text-[11px] font-bold uppercase tracking-wide">
                                      Cenário Criado
                                    </span>
                                  </div>
                                  <span className="text-xs font-bold text-indigo-700">
                                    {formatMoney(Math.abs(scen.monthlyImpactCents))}/mês
                                  </span>
                                </div>
                                <div className="text-xs text-slate-700">
                                  <strong className="text-slate-900">{scen.title}</strong>
                                  <p className="text-[11px] text-slate-500 mt-0.5">
                                    Duração prevista de {scen.months} meses
                                  </p>
                                </div>
                                {onNavigateTab && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      onNavigateTab('scenarios');
                                    }}
                                    className="w-full text-center py-1.5 px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold transition flex items-center justify-center space-x-1 shadow-2xs"
                                  >
                                    <span>Ver em Cenários</span>
                                    <ArrowRight className="w-3 h-3" />
                                  </button>
                                )}
                              </div>
                            );
                          }
                          return null;
                        })}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Indicador de Digitação / Pensando */}
            {isLoading && (
              <div className="flex items-center space-x-2 text-slate-500 py-1 pl-1 animate-pulse">
                <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                  <Sparkles className="w-3.5 h-3.5" />
                </div>
                <div className="text-xs italic">Analisando suas finanças...</div>
                <div className="flex space-x-1">
                  <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                  <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                  <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce"></span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Chips contextuais quando já houver mensagens */}
          {messages.length > 0 && !isLoading && (
            <div className="px-3 py-1.5 bg-slate-100/70 border-t border-slate-200/60 overflow-x-auto flex items-center space-x-1.5 no-scrollbar shrink-0">
              {quickChips.map((chip, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSendMessage(chip.prompt)}
                  className="shrink-0 text-[11px] font-medium text-slate-600 bg-white hover:bg-blue-50 hover:text-blue-700 border border-slate-200 px-2.5 py-1 rounded-lg transition"
                >
                  {chip.label}
                </button>
              ))}
            </div>
          )}

          {/* Rodapé / Input de Envio */}
          <div className="p-3 bg-white border-t border-slate-200 shrink-0">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center space-x-2"
            >
              <input
                ref={inputRef}
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder={hasKey ? 'Pergunte ou peça para anotar algo...' : 'Configure sua chave Gemini para conversar'}
                disabled={isLoading}
                className="flex-1 bg-slate-100 hover:bg-slate-50 focus:bg-white text-xs sm:text-sm text-slate-900 px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition placeholder:text-slate-400"
              />
              <button
                type="submit"
                disabled={!inputMessage.trim() || isLoading}
                className="p-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 text-white disabled:text-slate-400 rounded-xl transition shadow-sm shrink-0 flex items-center justify-center cursor-pointer disabled:cursor-not-allowed"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
            <div className="flex items-center justify-between mt-2 px-1 text-[10px] text-slate-400">
              <span>IA analisa dados locais de {monthLabel}</span>
              <button
                type="button"
                onClick={handleOpenKeyModal}
                className="text-blue-600 hover:underline flex items-center space-x-0.5"
              >
                <span>Chave Gemini</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Discreto de Configuração da Chave Gemini */}
      {showKeyModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-200 p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center">
                  <Key className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Chave da API Google Gemini</h3>
                  <p className="text-xs text-slate-500">Configuração de acesso para o assistente de IA</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowKeyModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveApiKey} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 block">
                  Chave de API (API Key)
                </label>
                <div className="relative">
                  <input
                    type={showKeySecret ? 'text' : 'password'}
                    value={keyInputValue}
                    onChange={(e) => setKeyInputValue(e.target.value)}
                    placeholder="AIzaSy..."
                    className="w-full text-xs text-slate-900 px-3 py-2.5 pr-10 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowKeySecret((prev) => !prev)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showKeySecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  A chave é armazenada com segurança no seu navegador. Você pode obter uma chave gratuita no{' '}
                  <a
                    href="https://aistudio.google.com/app/apikey"
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-600 hover:underline inline-flex items-center space-x-0.5"
                  >
                    <span>Google AI Studio</span>
                    <ExternalLink className="w-3 h-3 ml-0.5 inline" />
                  </a>
                  .
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 block">
                  Modelo do Gemini
                </label>
                <select
                  value={activeModel}
                  onChange={handleModelChange}
                  className="w-full text-xs text-slate-800 bg-white px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {AVAILABLE_MODELS.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </div>

              {keySavedToast && (
                <div className="p-2.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs flex items-center space-x-1.5">
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>Chave salva com sucesso!</span>
                </div>
              )}

              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    removeGeminiApiKey();
                    setKeyInputValue('');
                    setHasKey(false);
                    setShowKeyModal(false);
                  }}
                  className="text-xs text-rose-600 hover:underline font-medium"
                >
                  Remover Chave
                </button>
                <div className="flex space-x-2">
                  <button
                    type="button"
                    onClick={() => setShowKeyModal(false)}
                    className="px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-medium text-slate-700 hover:bg-slate-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-xs font-semibold text-white shadow-sm"
                  >
                    Salvar Chave
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
