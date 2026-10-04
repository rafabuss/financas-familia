import { supabase, isSupabaseConfigured } from './supabase.js';
import { isDemoMode } from './financeService.js';

/**
 * Camada de Serviço para o Assistente de IA Financeiro (Google Gemini)
 *
 * Arquitetura Híbrida & Segura (Fase 10.1):
 * - Modo Produção / Autenticado: Invoca a Supabase Edge Function 'ai-assistant'
 *   protegendo a chave mestra GEMINI_API_KEY no backend via Supabase Secrets.
 * - Modo Demonstração / Fallback Local: Executa a chamada client-side direta
 *   (callGeminiDirectly) usando a chave configurada no localStorage ou .env.local.
 */

const STORAGE_API_KEY = 'financas_gemini_api_key';
const STORAGE_SELECTED_MODEL = 'financas_gemini_model';
const DEFAULT_MODEL = 'gemini-2.5-flash';

export const isLegacyOrDiscontinuedModel = (modelId) => {
  if (!modelId) return true;
  const id = modelId.toLowerCase();
  return id === 'gemini-pro' || id === 'gemini-1.0-pro';
};

export const AVAILABLE_MODELS = [
  { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash (Recomendado & Alta Performance)' },
  { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash (Estável & Econômico)' },
  { id: 'gemini-3.8-flash', name: 'Gemini 3.8 Flash (Nova Geração)' },
  { id: 'gemini-3.6-flash', name: 'Gemini 3.6 Flash (Rápido e Preciso)' },
  { id: 'gemini-3.5-flash', name: 'Gemini 3.5 Flash (Equilibrado)' },
  { id: 'gemini-3.1-flash-lite', name: 'Gemini 3.1 Flash-Lite (Ultra Rápido)' },
];

export const FALLBACK_CANDIDATE_MODELS = [
  'gemini-2.5-flash',
  'gemini-1.5-flash',
  'gemini-3.8-flash',
  'gemini-3.6-flash',
  'gemini-3.5-flash',
  'gemini-3.1-flash-lite',
];

/**
 * Obtém a chave de API do Gemini configurada.
 * Prioridade:
 * 1. Chave customizada salva no localStorage pelo usuário
 * 2. Variável de ambiente VITE_GEMINI_API_KEY (de .env.local)
 */
export const getGeminiApiKey = () => {
  if (typeof window !== 'undefined') {
    const customKey = localStorage.getItem(STORAGE_API_KEY);
    if (customKey && customKey.trim()) {
      return customKey.trim();
    }
  }
  return (import.meta.env.VITE_GEMINI_API_KEY || '').trim();
};

export const setGeminiApiKey = (key) => {
  if (typeof window === 'undefined') return;
  if (!key || !key.trim()) {
    localStorage.removeItem(STORAGE_API_KEY);
  } else {
    localStorage.setItem(STORAGE_API_KEY, key.trim());
  }
};

export const removeGeminiApiKey = () => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_API_KEY);
};

export const isProxyModeAvailable = () => {
  if (isDemoMode() || !isSupabaseConfigured() || !supabase) return false;
  if (typeof window === 'undefined') return false;
  try {
    const sessionStr = localStorage.getItem('financas_session');
    if (sessionStr) {
      const parsed = JSON.parse(sessionStr);
      if (parsed && parsed.id && !String(parsed.id).startsWith('demo-')) return true;
    }
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('sb-') && key.endsWith('-auth-token')) {
        const item = localStorage.getItem(key);
        if (item && item.includes('access_token')) return true;
      }
    }
  } catch {}
  return false;
};

export const hasGeminiApiKey = () => {
  return Boolean(getGeminiApiKey()) || isProxyModeAvailable();
};

let _cachedDiscoveredModels = null;

/**
 * Consulta a API do Google Gemini (ModelService.ListModels) para obter
 * a lista autoritativa e atualizada de modelos compatíveis com generateContent.
 */
export const fetchAvailableModels = async (apiKeyParam) => {
  const key = apiKeyParam || getGeminiApiKey();
  if (!key) return AVAILABLE_MODELS;

  if (_cachedDiscoveredModels && _cachedDiscoveredModels.length > 0) {
    return _cachedDiscoveredModels;
  }

  try {
    const stored = sessionStorage.getItem('financas_gemini_discovered_models');
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const cleanParsed = parsed.filter((m) => !isLegacyOrDiscontinuedModel(m.id));
        if (cleanParsed.length > 0) {
          _cachedDiscoveredModels = cleanParsed;
          return cleanParsed;
        }
      }
    }
  } catch {}

  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}`, {
      headers: {
        'x-goog-api-key': key,
      },
    });
    if (!res.ok) return AVAILABLE_MODELS;

    const data = await res.json();
    const rawList = data?.models || [];
    const valid = rawList
      .filter((m) => Array.isArray(m.supportedGenerationMethods) && m.supportedGenerationMethods.includes('generateContent'))
      .map((m) => {
        const id = m.name.replace(/^models\//, '');
        return {
          id,
          name: m.displayName ? `${m.displayName} (${id})` : id,
          description: m.description || '',
        };
      })
      .filter((m) => !isLegacyOrDiscontinuedModel(m.id));

    if (valid.length > 0) {
      // Prioriza modelos flash e ordenação decrescente de versão (3.8 > 3.6 > 3.5 > 3.1)
      valid.sort((a, b) => {
        const aFlash = a.id.includes('flash') ? 1 : 0;
        const bFlash = b.id.includes('flash') ? 1 : 0;
        if (aFlash !== bFlash) return bFlash - aFlash;
        return b.id.localeCompare(a.id);
      });

      _cachedDiscoveredModels = valid;
      try {
        sessionStorage.setItem('financas_gemini_discovered_models', JSON.stringify(valid));
      } catch {}
      return valid;
    }
  } catch (err) {
    console.warn('Aviso ao consultar ListModels:', err);
  }

  return AVAILABLE_MODELS;
};

export const getSelectedModel = () => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem(STORAGE_SELECTED_MODEL);
    // Auto-migração: se o modelo salvo for legado/descontinuado (1.5, 2.0, 2.5), auto-migra para o padrão 3.8
    if (saved && !isLegacyOrDiscontinuedModel(saved)) {
      return saved;
    }
    localStorage.setItem(STORAGE_SELECTED_MODEL, DEFAULT_MODEL);
  }
  return DEFAULT_MODEL;
};

export const setSelectedModel = (model) => {
  if (typeof window === 'undefined') return;
  const cleanId = (model || '').replace(/^models\//, '').trim();
  const finalModel = isLegacyOrDiscontinuedModel(cleanId) ? DEFAULT_MODEL : cleanId;
  localStorage.setItem(STORAGE_SELECTED_MODEL, finalModel);
};

// Formatação monetária segura para o prompt da IA
const formatMoney = (cents = 0) => {
  return (cents / 100).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
};

/**
 * Constrói o System Prompt com Injeção Dinâmica do Contexto Financeiro
 */
export const buildSystemPrompt = ({
  dashboardMonth = new Date().toISOString().slice(0, 7),
  monthLabel = '',
  accounts = [],
  cards = [],
  categories = [],
  accountBalances = {},
  cardStats = {},
  monthSummary = {},
  dashboardEnvelopes = {},
  isDemo = false,
  savingsGoals = [],
  savingsGoalBalances = {},
  portfolioAssets = [],
  portfolioSummary = {},
  householdMembers = [],
  familyName = '',
  recentTransactions = [],
}) => {
  const todayStr = new Date().toISOString().slice(0, 10);

  // 1. Contas bancárias
  const activeAccounts = accounts.filter((a) => !a.archived);
  const accountsText = activeAccounts.length > 0
    ? activeAccounts
        .map((a) => {
          const bal = accountBalances[a.id] ?? a.initialBalanceCents ?? 0;
          return `- ${a.name} (${a.bank}): Saldo Atual ${formatMoney(bal)} [Tipo: ${a.type || 'corrente'}]`;
        })
        .join('\n')
    : '- Nenhuma conta cadastrada';

  // 2. Faturas de Cartões
  const activeCards = cards.filter((c) => !c.archived);
  let totalOpenInvoicesCents = 0;
  const cardsText = activeCards.length > 0
    ? activeCards
        .map((c) => {
          const stats = cardStats[c.id] || {};
          const invTotal = stats.invoiceTotalCents || 0;
          totalOpenInvoicesCents += invTotal;
          const status = stats.invoiceStatus || 'ABERTA';
          const due = stats.dueDateIso || `Dia ${c.dueDay}`;
          const available = stats.availableCents ?? Math.max(0, (c.limitCents || 0) - (stats.committedCents || 0));
          return `- ${c.name} (${c.flag}): Fatura deste mês ${formatMoney(invTotal)} | Status: ${status} | Vencimento: ${due} | Limite Disponível: ${formatMoney(available)} (Limite Total: ${formatMoney(c.limitCents)})`;
        })
        .join('\n')
    : '- Nenhum cartão cadastrado';

  // 3. Envelopes Orçamentários
  const envelopes = dashboardEnvelopes?.envelopes || [];
  const envelopesText = envelopes.length > 0
    ? envelopes
        .map((e) => {
          const catName = e.category?.name || 'Geral';
          const cap = e.allocatedCents || 0;
          const spent = e.spentCents || 0;
          const remaining = e.remainingCents || 0;
          const over = e.overspentCents || 0;
          const status = over > 0
            ? `ESTOURADO em ${formatMoney(over)}`
            : `Restam ${formatMoney(remaining)} (${((spent / (cap || 1)) * 100).toFixed(0)}% utilizado)`;
          return `- ${catName}: Limite ${formatMoney(cap)} | Gasto ${formatMoney(spent)} | ${status}`;
        })
        .join('\n')
    : '- Nenhum envelope orçamentário configurado para este mês';

  // 4. Categorias Ativas
  const activeCats = categories.filter((c) => !c.archived);
  const expenseCats = activeCats.filter((c) => c.type === 'EXPENSE').map((c) => c.name);
  const incomeCats = activeCats.filter((c) => c.type === 'INCOME').map((c) => c.name);

  // 5. Nomes disponíveis de contas e cartões para lançamentos
  const accountNames = activeAccounts.map((a) => a.name);
  const cardNames = activeCards.map((c) => c.name);

  // 6. Cofrinhos & Metas de Reserva
  let totalSavingsBalanceCents = 0;
  const goalsText = savingsGoals.length > 0
    ? savingsGoals
        .map((g) => {
          const bal = savingsGoalBalances[g.id] ?? g.currentBalanceCents ?? 0;
          totalSavingsBalanceCents += bal;
          const target = g.targetCents || 0;
          const pct = target > 0 ? ((bal / target) * 100).toFixed(0) : '0';
          const yieldStr = g.yieldRate ? ` [Rendimento: ${g.yieldRate}]` : '';
          return `- ${g.name}: Saldo Acumulado ${formatMoney(bal)} de Meta ${formatMoney(target)} (${pct}% atingido)${yieldStr}`;
        })
        .join('\n')
    : '- Nenhum cofrinho ou meta de reserva cadastrado';

  // 7. Carteira de Ativos & Renda Variável
  let totalPortfolioValueCents = 0;
  let totalPortfolioInvestedCents = 0;
  const assetsText = portfolioAssets.length > 0
    ? portfolioAssets
        .map((a) => {
          const qty = Number(a.quantity || 0);
          const avg = Number(a.averagePriceCents || 0);
          const cur = Number(a.currentPriceCents || 0);
          const invested = Math.round(qty * avg);
          const current = Math.round(qty * cur);
          totalPortfolioInvestedCents += invested;
          totalPortfolioValueCents += current;
          const diff = current - invested;
          const pct = invested > 0 ? ((diff / invested) * 100).toFixed(1) : '0.0';
          const sign = diff >= 0 ? '+' : '';
          return `- ${a.ticker} (${a.name}) [${a.assetType}]: ${qty} un | Cotação Atual ${formatMoney(cur)} (Médio ${formatMoney(avg)}) | Posição: ${formatMoney(current)} | Retorno: ${sign}${formatMoney(diff)} (${sign}${pct}%)`;
        })
        .join('\n')
    : '- Nenhum ativo de investimento cadastrado na carteira';

  // 8. Estrutura e Membros da Família
  const membersText = householdMembers.length > 0
    ? householdMembers
        .map((m) => {
          const roleLabel = m.role === 'admin' ? 'Administrador(a)' : 'Membro';
          const accessLabel = m.visibleEntities && m.visibleEntities.length === 1 && m.visibleEntities[0] === m.memberKey
            ? 'Acesso restrito apenas aos próprios lançamentos'
            : 'Acesso total compartilhado familiar';
          return `- ${m.displayName || m.name || m.memberKey}: Papel: ${roleLabel} | Permissão: ${accessLabel}`;
        })
        .join('\n')
    : '- Rafael (Admin), Ana Débora (Membro), Camila (Membro - Filha)';

  // 9. Amostra de Lançamentos Recentes (Últimas Despesas para análise de padrões)
  const recentExpenses = (recentTransactions || [])
    .filter((t) => t.type === 'EXPENSE')
    .slice(0, 16);
  const recentExpensesText = recentExpenses.length > 0
    ? recentExpenses
        .map((t) => {
          const catName = categories.find((c) => c.id === t.categoryId)?.name || 'Geral';
          const source = t.cardId
            ? (cards.find((c) => c.id === t.cardId)?.name || 'Cartão')
            : (accounts.find((a) => a.id === t.accountId)?.name || 'Conta');
          return `- ${t.date}: ${t.description} | ${formatMoney(t.amountCents)} [Cat: ${catName} | Pagto: ${source}]`;
        })
        .join('\n')
    : '- Nenhuma despesa recente registrada';

  // 10. Métrica de Patrimônio Líquido Consolidado 360°
  const totalBankBalCents = monthSummary.totalBankBalance ?? 0;
  const portfolioCurrentValCents = portfolioSummary?.currentValueCents ?? totalPortfolioValueCents;
  const totalNetWorthCents = totalBankBalCents + totalSavingsBalanceCents + portfolioCurrentValCents;

  return `Você é o Assistente de IA Financeiro oficial do aplicativo "Finanças da Família".
Você é um consultor pessoal e familiar de finanças de altíssimo nível: altamente preciso, amigável, acolhedor, objetivo e pragmático.
Você possui visão 360° completa de todos os módulos do sistema: Contas, Cartões, Envelopes, Cofrinhos de Reserva, Carteira de Investimentos e Membros da Família.

INFORMAÇÕES TEMPORAIS & DE CONTEXTO:
- Data de hoje: ${todayStr}
- Mês de referência em análise: ${monthLabel || dashboardMonth} (${dashboardMonth})
- Família: ${familyName || 'Família Silva'}
- Modo da aplicação: ${isDemo ? 'MODO DEMONSTRAÇÃO (Dados simulados em memória)' : 'MODO REAL (Dados da família)'}

=== PATRIMÔNIO LÍQUIDO CONSOLIDADO DA FAMÍLIA (360°) ===
- Saldo Bancário em Contas Correntes: ${formatMoney(totalBankBalCents)}
- Reserva Acumulada em Cofrinhos / Caixinhas: ${formatMoney(totalSavingsBalanceCents)}
- Carteira de Ativos & Renda Variável (Valor Atual): ${formatMoney(portfolioCurrentValCents)}
- 💎 PATRIMÔNIO LÍQUIDO TOTAL CONSOLIDADO: ${formatMoney(totalNetWorthCents)}
- Total de Faturas de Cartão em Aberto (Passivo do Mês): ${formatMoney(totalOpenInvoicesCents)}

=== PAINEL FINANCEIRO DO MÊS (${monthLabel || dashboardMonth}) ===
- Saldo Bancário Consolidado: ${formatMoney(monthSummary.totalBankBalance ?? 0)}
- Saldo Projetado ao Fim do Mês: ${formatMoney(monthSummary.projectedEndBalance ?? 0)}
- Receitas Totais do Mês: ${formatMoney(monthSummary.incomeTotal ?? monthSummary.income ?? 0)} (Realizadas: ${formatMoney(monthSummary.incomeRealized ?? 0)}, Pendentes: ${formatMoney(monthSummary.incomePending ?? 0)})
- Despesas Totais do Mês: ${formatMoney(monthSummary.expenseTotal ?? monthSummary.expense ?? 0)} (Realizadas: ${formatMoney(monthSummary.expenseRealized ?? 0)}, Pendentes: ${formatMoney(monthSummary.expensePending ?? 0)})
- Saldo Líquido do Mês: ${formatMoney((monthSummary.incomeTotal ?? 0) - (monthSummary.expenseTotal ?? 0))}
- Reserva comprometida por envelopes: ${formatMoney(monthSummary.envelopesCommitted ?? 0)}
- Saldo Livre Projetado: ${formatMoney(monthSummary.freeProjectedBalance ?? 0)}

=== CONTAS BANCÁRIAS ===
${accountsText}

=== FATURAS DE CARTÃO DE CRÉDITO (${monthLabel || dashboardMonth}) ===
${cardsText}

=== COFRINHOS & METAS DE RESERVA ===
${goalsText}

=== CARTEIRA DE ATIVOS & INVESTIMENTOS ===
${assetsText}

=== STATUS DOS ENVELOPES ORÇAMENTÁRIOS ===
${envelopesText}

=== ESTRUTURA DA FAMÍLIA & PERMISSÕES ===
${membersText}

=== AMOSTRA DE LANÇAMENTOS RECENTES (ÚLTIMAS DESPESAS) ===
${recentExpensesText}

=== CATEGORIAS DISPONÍVEIS ===
- Despesas: ${expenseCats.join(', ') || 'Nenhuma'}
- Receitas: ${incomeCats.join(', ') || 'Nenhuma'}

=== DESTINOS DE PAGAMENTO CADASTRADOS ===
- Contas: ${accountNames.join(', ') || 'Nenhuma'}
- Cartões: ${cardNames.join(', ') || 'Nenhum'}

=== SUAS DIRETRIZES DE ATUAÇÃO ===
1. Utilize português brasileiro natural, acolhedor e cordial. Formate sua resposta com markdown claro (negrito, listas, destaques monetários).
2. Se o usuário fizer perguntas sobre finanças, saldo, faturas, cofrinhos, patrimônio total ou carteira, responda com base estrita nos dados do painel acima.
3. Se o usuário perguntar o Patrimônio Líquido Total, apresente o valor consolidado (${formatMoney(totalNetWorthCents)}) detalhando a composição: Contas Correntes (${formatMoney(totalBankBalCents)}), Cofrinhos (${formatMoney(totalSavingsBalanceCents)}) e Carteira de Investimentos (${formatMoney(portfolioCurrentValCents)}).
4. CONSULTORIA PREDITIVA & SUGESTÃO DE CATEGORIAS:
   - Quando o usuário solicitar ("Sugira novas categorias com base nos meus gastos" ou similar), analise as despesas recentes e as categorias existentes.
   - Identifique padrões de gastos recorrentes agrupados em categorias muito amplas ou genéricas (ex: assinaturas de streaming como Netflix/Spotify, transporte por aplicativo como Uber/99, cuidados pet/veterinário, delivery, etc.).
   - Sugira proativamente a criação de categorias especializadas adequadas com cor e teto mensal sugerido, e já acione ou ofereça-se para acionar a ferramenta \`criar_categoria\`.
5. Se o usuário pedir para cadastrar, criar ou adicionar uma categoria ou subcategoria, USE OBRIGATORIAMENTE A FERRAMENTA \`criar_categoria\`.
6. Se o usuário informar que fez um Pix, TED ou transferência entre contas correntes (ex: "Fiz um Pix de R$ 300 do Itaú para o Nubank"), USE OBRIGATORIAMENTE A FERRAMENTA \`criar_transferencia\`.
7. Se o usuário pedir para anotar, registrar, lançar, criar ou descontar uma transação (despesa ou receita comum), USE OBRIGATORIAMENTE A FERRAMENTA \`criar_transacao\`.
   - Escolha a categoria ativa mais adequada.
   - Deduza a conta ou cartão correto. Se a data não for dita, use ${todayStr}.
8. Se o usuário informar nova cotação ou preço de mercado de uma ação, FII, criptomoeda ou título (ex: "O Bitcoin subiu para R$ 390.000", "Atualize PETR4 para 38.50"), USE OBRIGATORIAMENTE A FERRAMENTA \`atualizar_cotacao_ativo\`.
9. Se o usuário pedir para guardar dinheiro, transferir para a reserva ou aportar num cofrinho (ex: "Aporte R$ 500 no cofrinho Reserva de Emergência"), USE OBRIGATORIAMENTE A FERRAMENTA \`aportar_cofrinho\`.
10. Se o usuário pedir para simular um cenário (ex: "e se eu comprar um carro?", "simule um corte de R$ 200 no aluguel"), USE OBRIGATORIAMENTE A FERRAMENTA \`simular_cenario\`.
11. Quando uma ferramenta for executada com sucesso, finalize sua resposta confirmando com clareza o que foi cadastrado e o impacto no ecossistema familiar.`;
};

/**
 * Declaração das Ferramentas (Function Calling)
 */
export const GEMINI_TOOLS = [
  {
    functionDeclarations: [
      {
        name: 'criar_transacao',
        description: 'Cria um novo lançamento financeiro (despesa ou receita) em uma conta bancária ou cartão de crédito no aplicativo.',
        parameters: {
          type: 'OBJECT',
          properties: {
            descricao: {
              type: 'STRING',
              description: 'Descrição sucinta e clara do lançamento (ex: Almoço no restaurante, Uber ao trabalho, Supermercado Extra, Salário).',
            },
            valor_reais: {
              type: 'NUMBER',
              description: 'Valor numérico positivo em reais (ex: 65.50 para R$ 65,50).',
            },
            tipo: {
              type: 'STRING',
              enum: ['DESPESA', 'RECEITA'],
              description: 'Tipo do lançamento: DESPESA para saídas ou RECEITA para entradas de dinheiro.',
            },
            categoria_nome: {
              type: 'STRING',
              description: 'Nome exato ou aproximado de uma das categorias ativas fornecidas no contexto.',
            },
            conta_ou_cartao_nome: {
              type: 'STRING',
              description: 'Nome da conta bancária ou cartão de crédito cadastrado onde o valor será debitado/creditado.',
            },
            data: {
              type: 'STRING',
              description: 'Data no formato ISO YYYY-MM-DD em que a transação ocorreu ou ocorrerá.',
            },
          },
          required: ['descricao', 'valor_reais', 'tipo'],
        },
      },
      {
        name: 'criar_categoria',
        description: 'Cria uma nova categoria ou subcategoria de receitas ou despesas no sistema financeiro da família.',
        parameters: {
          type: 'OBJECT',
          properties: {
            nome: {
              type: 'STRING',
              description: 'Nome da categoria a ser criada (ex: Pets & Veterinário, Serviços de Streaming, Aplicativos de Transporte).',
            },
            tipo: {
              type: 'STRING',
              enum: ['DESPESA', 'RECEITA'],
              description: 'Tipo da categoria: DESPESA para gastos ou RECEITA para fontes de renda.',
            },
            cor: {
              type: 'STRING',
              description: 'Código de cor hexadecimal para identificação visual (ex: #10b981, #f59e0b, #6366f1, #ec4899).',
            },
            parentId: {
              type: 'STRING',
              description: 'ID ou nome aproximado da categoria pai caso seja uma subcategoria (opcional).',
            },
            teto_mensal_reais: {
              type: 'NUMBER',
              description: 'Teto ou limite orçamentário mensal sugerido em reais para esta categoria (opcional).',
            },
          },
          required: ['nome', 'tipo'],
        },
      },
      {
        name: 'criar_transferencia',
        description: 'Lança uma transferência ou Pix nativo entre duas contas bancárias da família, movimentando saldos sem afetar receitas ou despesas do mês.',
        parameters: {
          type: 'OBJECT',
          properties: {
            conta_origem_nome: {
              type: 'STRING',
              description: 'Nome da conta bancária de origem onde o dinheiro sairá (ex: Conta Corrente Principal, Inter, Nubank).',
            },
            conta_destino_nome: {
              type: 'STRING',
              description: 'Nome da conta bancária de destino onde o dinheiro entrará (ex: Nubank, Inter, Banco do Brasil).',
            },
            valor_reais: {
              type: 'NUMBER',
              description: 'Valor numérico positivo em reais a transferir (ex: 300.00).',
            },
            data: {
              type: 'STRING',
              description: 'Data no formato ISO YYYY-MM-DD em que a transferência ocorreu ou ocorrerá (opcional, hoje por padrão).',
            },
            descricao: {
              type: 'STRING',
              description: 'Descrição ou motivo da transferência / Pix (ex: Pix para compras da semana, Transferência de reserva).',
            },
          },
          required: ['conta_origem_nome', 'conta_destino_nome', 'valor_reais'],
        },
      },
      {
        name: 'atualizar_cotacao_ativo',
        description: 'Atualiza a cotação/preço unitário atual de um ativo da carteira de investimentos (cripto, ação, FII ou título do Tesouro), recalculando o saldo e rentabilidade imediatamente.',
        parameters: {
          type: 'OBJECT',
          properties: {
            ticker_ou_nome: {
              type: 'STRING',
              description: 'Ticker (ex: BTC, ETH, PETR4, VALE3, MXRF11, TESOURO_SELIC_2029) ou nome do ativo cadastrado na carteira.',
            },
            novo_preco_reais: {
              type: 'NUMBER',
              description: 'Novo preço unitário de mercado do ativo em reais (ex: 390000.00 para Bitcoin, 38.50 para Petrobras, 10.45 para MXRF11).',
            },
          },
          required: ['ticker_ou_nome', 'novo_preco_reais'],
        },
      },
      {
        name: 'aportar_cofrinho',
        description: 'Realiza um aporte financeiro da conta corrente para um cofrinho ou meta de reserva de emergência da família via transferência nativa.',
        parameters: {
          type: 'OBJECT',
          properties: {
            cofrinho_nome: {
              type: 'STRING',
              description: 'Nome exato ou aproximado do cofrinho ou meta de reserva (ex: Reserva de Emergência Familiar, Caixinha Viagem de Férias).',
            },
            conta_origem_nome: {
              type: 'STRING',
              description: 'Nome da conta bancária de origem onde o dinheiro sairá (opcional, utiliza a conta vinculada ou principal por padrão).',
            },
            valor_reais: {
              type: 'NUMBER',
              description: 'Valor numérico positivo em reais a ser aportado no cofrinho (ex: 500.00).',
            },
          },
          required: ['cofrinho_nome', 'valor_reais'],
        },
      },
      {
        name: 'simular_cenario',
        description: 'Cria uma simulação de cenário financeiro hipotético para planejar gastos futuros ou metas sem alterar as contas reais.',
        parameters: {
          type: 'OBJECT',
          properties: {
            titulo: {
              type: 'STRING',
              description: 'Título explicativo da simulação (ex: Curso de Pós-Graduação, Troca de Carro, Economia de Assinaturas).',
            },
            valor_mensal: {
              type: 'NUMBER',
              description: 'Valor do impacto financeiro mensal em reais (ex: 350.00).',
            },
            duracao_meses: {
              type: 'INTEGER',
              description: 'Número de meses de duração do cenário (ex: 6, 12, 24). Padrão: 12.',
            },
            tipo: {
              type: 'STRING',
              enum: ['DESPESA', 'RECEITA'],
              description: 'Tipo do impacto financeiro mensal: DESPESA ou RECEITA.',
            },
          },
          required: ['titulo', 'valor_mensal', 'duracao_meses', 'tipo'],
        },
      },
    ],
  },
];

// Helper compartilhado para mensagens de feedback em fallback de ferramentas
const generateToolFeedbackFallback = (lastTool) => {
  if (!lastTool) return 'Ação executada com sucesso!';
  if (lastTool.name === 'criar_transacao') {
    return `Pronto! Registrei o lançamento de **${lastTool.args.descricao}** no valor de **${formatMoney(Math.round(lastTool.args.valor_reais * 100))}** com sucesso.`;
  }
  if (lastTool.name === 'criar_categoria') {
    const tipoLabel = lastTool.args.tipo === 'INCOME' ? 'Receitas' : 'Despesas';
    return `Pronto! Criei a categoria **${lastTool.args.nome}** em **${tipoLabel}** com sucesso.`;
  }
  if (lastTool.name === 'criar_transferencia') {
    return `Pronto! Registrei a transferência de **${formatMoney(Math.round(lastTool.args.valor_reais * 100))}** de **${lastTool.args.conta_origem_nome}** para **${lastTool.args.conta_destino_nome}** com sucesso.`;
  }
  if (lastTool.name === 'atualizar_cotacao_ativo') {
    return `Pronto! Atualizei a cotação do ativo **${lastTool.args.ticker_ou_nome}** para **${formatMoney(Math.round(lastTool.args.novo_preco_reais * 100))}** com sucesso.`;
  }
  if (lastTool.name === 'aportar_cofrinho') {
    return `Pronto! Realizei o aporte de **${formatMoney(Math.round(lastTool.args.valor_reais * 100))}** no cofrinho **${lastTool.args.cofrinho_nome}** com sucesso.`;
  }
  if (lastTool.name === 'simular_cenario') {
    return `Pronto! Criei a simulação do cenário **${lastTool.args.titulo}** com impacto de **${formatMoney(Math.round(lastTool.args.valor_mensal * 100))}/mês** por **${lastTool.args.duracao_meses} meses**.`;
  }
  return 'Ação executada com sucesso!';
};

/**
 * Invoca a Supabase Edge Function 'ai-assistant' para processar a requisição de IA
 * de forma segura no backend (com autenticação JWT e chave GEMINI_API_KEY oculta).
 */
export const callGeminiViaEdgeFunction = async ({
  contents,
  systemInstruction,
  tools = GEMINI_TOOLS,
  model,
}) => {
  if (!isSupabaseConfigured() || !supabase) {
    throw new Error('Supabase não está configurado neste ambiente.');
  }

  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  if (sessionError || !sessionData?.session?.access_token) {
    throw new Error('Usuário não autenticado no Supabase para invocar o assistente na nuvem.');
  }

  const payload = {
    contents,
    systemInstruction,
    tools,
    model,
  };

  const { data, error } = await supabase.functions.invoke('ai-assistant', {
    body: payload,
    headers: {
      Authorization: `Bearer ${sessionData.session.access_token}`,
    },
  });

  if (error) {
    const errorMsg = data?.error || error.message || 'Erro ao executar a Edge Function ai-assistant';
    const err = new Error(errorMsg);
    err.code = data?.code || 'EDGE_FUNCTION_ERROR';
    err.details = data;
    throw err;
  }

  return data;
};

/**
 * Fluxo completo de conversação via Edge Function (com suporte a Function Calling)
 */
export const executeWithEdgeFunction = async ({
  messages = [],
  financialContext = {},
  onExecuteTool,
  model,
}) => {
  const cleanModel = (m) => (m || '').replace(/^models\//, '').trim();
  const rawModel = cleanModel(model) || getSelectedModel();
  const activeModel = isLegacyOrDiscontinuedModel(rawModel) ? DEFAULT_MODEL : rawModel;
  const systemPrompt = buildSystemPrompt(financialContext);

  const contents = [];
  messages.forEach((msg) => {
    const role = msg.role === 'user' ? 'user' : 'model';
    if (msg.content && msg.content.trim()) {
      contents.push({
        role,
        parts: [{ text: msg.content }],
      });
    }
  });

  const edgeResponse = await callGeminiViaEdgeFunction({
    contents,
    systemInstruction: {
      parts: [{ text: systemPrompt }],
    },
    tools: GEMINI_TOOLS,
    model: activeModel,
  });

  let textReply = edgeResponse?.text || '';
  const toolExecutions = [];

  const functionCalls = edgeResponse?.functionCalls || [];
  if (functionCalls.length > 0 && onExecuteTool) {
    for (const call of functionCalls) {
      const fnName = call.name;
      const fnArgs = call.args || {};

      try {
        const executionResult = await onExecuteTool(fnName, fnArgs);
        toolExecutions.push({
          name: fnName,
          args: fnArgs,
          result: executionResult,
        });

        // Monta histórico de follow-up para feedback em linguagem natural da IA
        const followUpContents = [
          ...contents,
          {
            role: 'model',
            parts: [{ functionCall: { name: fnName, args: fnArgs } }],
          },
          {
            role: 'function',
            parts: [
              {
                functionResponse: {
                  name: fnName,
                  response: {
                    output: executionResult,
                  },
                },
              },
            ],
          },
        ];

        try {
          const followUpRes = await callGeminiViaEdgeFunction({
            contents: followUpContents,
            systemInstruction: {
              parts: [{ text: systemPrompt }],
            },
            tools: GEMINI_TOOLS,
            model: edgeResponse.model || activeModel,
          });

          if (followUpRes?.text) {
            textReply = followUpRes.text;
          }
        } catch (followErr) {
          console.warn('[AI Assistant] Aviso na resposta subsequente de tool calling via Edge Function:', followErr);
        }
      } catch (toolError) {
        console.error(`Erro ao executar ferramenta ${fnName}:`, toolError);
        toolExecutions.push({
          name: fnName,
          args: fnArgs,
          error: toolError.message,
        });
      }
    }
  }

  // Fallback amigável se executou ferramenta mas não obteve texto explicativo
  if (!textReply && toolExecutions.length > 0) {
    textReply = generateToolFeedbackFallback(toolExecutions[0]);
  }

  return {
    text: textReply || 'Entendido! Estou à disposição para ajudar com suas finanças.',
    toolExecutions,
    source: 'edge-function',
  };
};

/**
 * Executa a chamada diretamente pelo navegador para a API do Google Gemini.
 * Utilizado em Modo Demonstração, ambiente local ou como fallback resiliente.
 */
export const callGeminiDirectly = async ({
  messages = [],
  financialContext = {},
  onExecuteTool,
  model,
}) => {
  const apiKey = getGeminiApiKey();

  if (!apiKey) {
    throw new Error(
      'CHAVE_NAO_CONFIGURADA: Nenhuma chave da API Google Gemini foi encontrada. Configure sua chave no painel do chat ou no arquivo .env.local.'
    );
  }

  const cleanModel = (m) => (m || '').replace(/^models\//, '').trim();
  const rawModel = cleanModel(model) || getSelectedModel();
  const activeModel = isLegacyOrDiscontinuedModel(rawModel) ? DEFAULT_MODEL : rawModel;
  const systemPrompt = buildSystemPrompt(financialContext);

  // Formata o histórico de mensagens para a estrutura do Gemini
  const contents = [];
  messages.forEach((msg) => {
    const role = msg.role === 'user' ? 'user' : 'model';
    if (msg.content && msg.content.trim()) {
      contents.push({
        role,
        parts: [{ text: msg.content }],
      });
    }
  });

  const requestBody = {
    systemInstruction: {
      parts: [{ text: systemPrompt }],
    },
    contents,
    tools: GEMINI_TOOLS,
  };

  const endpointUrl = (targetModel) =>
    `https://generativelanguage.googleapis.com/v1beta/models/${cleanModel(targetModel)}:generateContent?key=${apiKey}`;

  let currentModel = activeModel;
  let response;
  let lastErrorDetail = '';
  let hadHighDemand = false;

  const modelsToTry = [
    currentModel,
    ...FALLBACK_CANDIDATE_MODELS.filter((m) => m !== currentModel),
  ].filter((m) => !isLegacyOrDiscontinuedModel(m));

  let hasQueriedLiveModels = false;

  for (let i = 0; i < modelsToTry.length; i++) {
    const candidateModel = cleanModel(modelsToTry[i]);
    if (isLegacyOrDiscontinuedModel(candidateModel)) continue;

    try {
      response = await fetch(endpointUrl(candidateModel), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey,
        },
        body: JSON.stringify(requestBody),
      });

      if (response.ok) {
        currentModel = candidateModel;
        setSelectedModel(candidateModel);
        break;
      }

      // Analisa detalhes do erro
      let errorDetail = '';
      try {
        const errorJson = await response.clone().json();
        errorDetail = errorJson?.error?.message || '';
      } catch {}

      lastErrorDetail = errorDetail;

      // 1. Tratamento de 404 (modelo não encontrado ou sem permissão na conta)
      if (response.status === 404) {
        console.warn(`Modelo ${candidateModel} retornou 404: ${errorDetail}`);

        // Se a mensagem do Google sugerir outro modelo moderno, adiciona à fila
        const match = errorDetail.match(/models\/(gemini-[\w.-]+)/);
        if (
          match &&
          match[1] &&
          !modelsToTry.includes(match[1]) &&
          !isLegacyOrDiscontinuedModel(match[1])
        ) {
          console.log(`Auto-detectado modelo recomendado pela API: ${match[1]}`);
          modelsToTry.splice(i + 1, 0, match[1]);
        }

        // Consulta a lista de modelos ativos da conta
        if (!hasQueriedLiveModels) {
          hasQueriedLiveModels = true;
          try {
            const liveModels = await fetchAvailableModels(apiKey);
            const liveIds = liveModels.map((m) => m.id).filter((id) => !isLegacyOrDiscontinuedModel(id));
            liveIds.forEach((id) => {
              if (!modelsToTry.includes(id)) {
                modelsToTry.push(id);
              }
            });
          } catch (listErr) {
            console.warn('Falha ao descobrir modelos via ListModels:', listErr);
          }
        }

        continue;
      }

      // 2. Tratamento de 503 (High Demand / Sobrecarga temporária) ou 429/500/502
      if (response.status === 503 || response.status === 429 || response.status === 500 || response.status === 502) {
        hadHighDemand = true;
        console.warn(`Modelo ${candidateModel} retornou status ${response.status} (alta demanda). Tentando próximo modelo alternativo...`);
        await new Promise((resolve) => setTimeout(resolve, 400));
        continue;
      }

      // Se for erro definitivo de parâmetros ou chave (ex: 400), interrompe o loop
      break;
    } catch (netErr) {
      if (i === modelsToTry.length - 1) {
        throw new Error(`Falha de conexão com os servidores do Google Gemini: ${netErr.message}`);
      }
    }
  }

  if (!response || !response.ok) {
    if (hadHighDemand && (!response || response.status === 503)) {
      throw new Error(
        'ALTA_DEMANDA (503): Os servidores do Google Gemini estão com alta demanda temporária neste momento. Por favor, aguarde alguns instantes e tente enviar sua mensagem novamente.'
      );
    }

    let errorDetail = lastErrorDetail;
    if (!errorDetail && response) {
      try {
        const errorJson = await response.json();
        errorDetail = errorJson?.error?.message || JSON.stringify(errorJson);
      } catch {
        errorDetail = response?.statusText || 'Erro desconhecido';
      }
    }

    if (response?.status === 400 && errorDetail.includes('API_KEY_INVALID')) {
      throw new Error('CHAVE_INVALIDA: A chave de API do Google Gemini informada é inválida. Verifique sua chave no Google AI Studio.');
    }
    if (response?.status === 429) {
      throw new Error('LIMITE_ATINGIDO: O limite temporário de requisições da sua chave Gemini foi atingido. Aguarde alguns segundos.');
    }
    if (response?.status === 503) {
      throw new Error('ALTA_DEMANDA (503): Os servidores do Google Gemini estão enfrentando um pico temporário de demanda mundial. Aguarde alguns segundos e tente novamente.');
    }

    throw new Error(`Erro na API Gemini (${response?.status || 500}): ${errorDetail}`);
  }

  const data = await response.json();
  const candidate = data?.candidates?.[0];
  const parts = candidate?.content?.parts || [];

  let textReply = '';
  const toolExecutions = [];

  // Analisa as partes da resposta procurando texto e functionCalls
  for (const part of parts) {
    if (part.text) {
      textReply += part.text;
    }

    if (part.functionCall && onExecuteTool) {
      const fnName = part.functionCall.name;
      const fnArgs = part.functionCall.args || {};

      try {
        const executionResult = await onExecuteTool(fnName, fnArgs);
        toolExecutions.push({
          name: fnName,
          args: fnArgs,
          result: executionResult,
        });

        // Executa a segunda chamada ao Gemini passando o retorno da ferramenta (Function Response)
        const followUpContents = [
          ...contents,
          {
            role: 'model',
            parts: [{ functionCall: part.functionCall }],
          },
          {
            role: 'function',
            parts: [
              {
                functionResponse: {
                  name: fnName,
                  response: {
                    output: executionResult,
                  },
                },
              },
            ],
          },
        ];

        try {
          const followUpRes = await fetch(endpointUrl(currentModel), {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-goog-api-key': apiKey,
            },
            body: JSON.stringify({
              systemInstruction: {
                parts: [{ text: systemPrompt }],
              },
              contents: followUpContents,
              tools: GEMINI_TOOLS,
            }),
          });

          if (followUpRes.ok) {
            const followUpData = await followUpRes.json();
            const followUpParts = followUpData?.candidates?.[0]?.content?.parts || [];
            const followUpText = followUpParts.map((p) => p.text || '').join('').trim();
            if (followUpText) {
              textReply = followUpText;
            }
          }
        } catch (followErr) {
          console.warn('Aviso na resposta subsequente de tool calling:', followErr);
        }
      } catch (toolError) {
        console.error(`Erro ao executar ferramenta ${fnName}:`, toolError);
        toolExecutions.push({
          name: fnName,
          args: fnArgs,
          error: toolError.message,
        });
      }
    }
  }

  if (!textReply && toolExecutions.length > 0) {
    textReply = generateToolFeedbackFallback(toolExecutions[0]);
  }

  return {
    text: textReply || 'Entendido! Estou à disposição para ajudar com suas finanças.',
    toolExecutions,
    source: 'direct-client',
  };
};

/**
 * Envia mensagem para o Assistente de IA Financeiro (Google Gemini)
 *
 * Estratégia Híbrida Inteligente (Fase 10.1):
 * - Modo Produção / Usuário Autenticado: Chamada via Supabase Edge Function (ai-assistant)
 * - Modo Demonstração / Fallback Local: Chamada direta client-side (callGeminiDirectly)
 *
 * @param {Object} options
 * @param {Array} options.messages - Histórico de mensagens [{ role: 'user'|'assistant', content: string }]
 * @param {Object} options.financialContext - Dados financeiros para injeção de contexto
 * @param {Function} options.onExecuteTool - Callback assíncrono para executar a ferramenta solicitada
 * @param {string} [options.model] - Modelo do Gemini a ser usado
 */
export const sendMessageToGemini = async ({
  messages = [],
  financialContext = {},
  onExecuteTool,
  model,
}) => {
  const isDemo = Boolean(financialContext.isDemo) || isDemoMode();
  const hasSupabase = isSupabaseConfigured() && Boolean(supabase);

  // Verifica se o usuário possui sessão ativa autenticada no Supabase
  let isAuthenticated = false;
  if (hasSupabase && !isDemo) {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      isAuthenticated = Boolean(sessionData?.session?.user && sessionData?.session?.access_token);
    } catch {
      isAuthenticated = false;
    }
  }

  const shouldUseEdgeFunction = hasSupabase && !isDemo && isAuthenticated;

  // 1. Modo Produção / Autenticado: Invoca a Supabase Edge Function
  if (shouldUseEdgeFunction) {
    try {
      return await executeWithEdgeFunction({
        messages,
        financialContext,
        onExecuteTool,
        model,
      });
    } catch (edgeErr) {
      console.warn(
        '[AI Service] Supabase Edge Function falhou ou não está implantada. Verificando fallback local...',
        edgeErr
      );

      // Fallback gracioso transparente: se houver chave configurada no cliente, utiliza chamada direta
      if (getGeminiApiKey()) {
        console.log('[AI Service] Acionando fallback direto client-side (callGeminiDirectly)...');
        return await callGeminiDirectly({
          messages,
          financialContext,
          onExecuteTool,
          model,
        });
      }

      // Se não houver chave local nem Edge Function funcional, exibe mensagem limpa ao usuário final
      throw new Error(
        'O assistente inteligente está temporariamente indisponível. Por favor, tente novamente em instantes.'
      );
    }
  }

  // 2. Modo Demonstração ou Não-Autenticado: Fallback direto client-side
  return await callGeminiDirectly({
    messages,
    financialContext,
    onExecuteTool,
    model,
  });
};
