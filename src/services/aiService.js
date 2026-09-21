/**
 * Camada de Serviço para o Assistente de IA Financeiro (Google Gemini)
 *
 * Arquitetura Desacoplada:
 * Toda a comunicação com a IA fica isolada neste módulo.
 * No futuro, a chamada para a API do Gemini pode ser redirecionada para
 * uma Edge Function no Supabase sem necessidade de alterar a interface.
 */

const STORAGE_API_KEY = 'financas_gemini_api_key';
const STORAGE_SELECTED_MODEL = 'financas_gemini_model';
const DEFAULT_MODEL = 'gemini-3.6-flash';

export const AVAILABLE_MODELS = [
  { id: 'gemini-3.6-flash', name: 'Gemini 3.6 Flash (Recomendado & Mais Rápido)' },
  { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash (Equilibrado)' },
  { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro (Raciocínio Complexo)' },
];

export const FALLBACK_CANDIDATE_MODELS = [
  'gemini-3.6-flash',
  'gemini-2.5-flash',
  'gemini-2.5-pro',
  'gemini-2.0-flash',
  'gemini-1.5-flash',
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

export const hasGeminiApiKey = () => {
  return Boolean(getGeminiApiKey());
};

export const getSelectedModel = () => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem(STORAGE_SELECTED_MODEL);
    // Auto-migração: se o modelo salvo for descontinuado (1.5 ou 2.0), migra para o 3.6
    if (saved && saved !== 'gemini-1.5-flash' && saved !== 'gemini-2.0-flash') {
      return saved;
    }
  }
  return DEFAULT_MODEL;
};

export const setSelectedModel = (model) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_SELECTED_MODEL, model);
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
  const cardsText = activeCards.length > 0
    ? activeCards
        .map((c) => {
          const stats = cardStats[c.id] || {};
          const invTotal = stats.invoiceTotalCents || 0;
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

  return `Você é o Assistente de IA Financeiro oficial do aplicativo "Finanças da Família".
Você é um consultor pessoal e familiar de finanças de altíssimo nível: altamente preciso, amigável, acolhedor, objetivo e pragmático.

INFORMAÇÕES TEMPORAIS & DE CONTEXTO:
- Data de hoje: ${todayStr}
- Mês de referência em análise: ${monthLabel || dashboardMonth} (${dashboardMonth})
- Modo da aplicação: ${isDemo ? 'MODO DEMONSTRAÇÃO (Dados simulados em memória)' : 'MODO REAL (Dados da família)'}

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

=== STATUS DOS ENVELOPES ORÇAMENTÁRIOS ===
${envelopesText}

=== CATEGORIAS DISPONÍVEIS ===
- Despesas: ${expenseCats.join(', ') || 'Nenhuma'}
- Receitas: ${incomeCats.join(', ') || 'Nenhuma'}

=== DESTINOS DE PAGAMENTO CADASTRADOS ===
- Contas: ${accountNames.join(', ') || 'Nenhuma'}
- Cartões: ${cardNames.join(', ') || 'Nenhum'}

=== SUAS DIRETRIZES DE ATUAÇÃO ===
1. Utilize português brasileiro natural e cordial. Formate sua resposta com markdown claro (negrito, listas, destaques monetários).
2. Se o usuário fizer perguntas sobre finanças, saldo, faturas ou envelopes, responda com base estrita nos dados do painel acima.
3. Se o usuário pedir para anotar, registrar, lançar, criar ou descontar uma transação (despesa ou receita), USE OBRIGATORIAMENTE A FERRAMENTA \`criar_transacao\`.
   - Escolha a categoria ativa que melhor se encaixe na descrição informada.
   - Identifique a conta bancária ou cartão correto. Se o usuário não disser onde gastou, deduza se é cartão ou conta (se mencionou "cartão", escolha um cartão disponível; caso contrário, use a primeira conta ou cartão mais coerente).
   - Se a data não for informada, use a data de hoje (${todayStr}).
4. Se o usuário pedir para simular um cenário (ex: "e se eu comprar um carro?", "simule um corte de R$ 200 no aluguel", "e se eu fizer um curso de 500 por mês"), USE OBRIGATORIAMENTE A FERRAMENTA \`simular_cenario\`.
5. Quando uma ferramenta for executada com sucesso, finalize sua resposta confirmando os dados que foram cadastrados e como isso impacta as finanças da família.`;
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

/**
 * Envia mensagem para a API REST do Google Gemini com suporte a Function Calling
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
  const apiKey = getGeminiApiKey();

  if (!apiKey) {
    throw new Error(
      'CHAVE_NAO_CONFIGURADA: Nenhuma chave da API Google Gemini foi encontrada. Configure sua chave no painel do chat ou no arquivo .env.local.'
    );
  }

  const activeModel = model || getSelectedModel();
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
    `https://generativelanguage.googleapis.com/v1beta/models/${targetModel}:generateContent?key=${apiKey}`;

  let currentModel = activeModel;
  let response;
  const modelsToTry = [
    currentModel,
    ...FALLBACK_CANDIDATE_MODELS.filter((m) => m !== currentModel),
  ];

  for (let i = 0; i < modelsToTry.length; i++) {
    const candidateModel = modelsToTry[i];
    try {
      response = await fetch(endpointUrl(candidateModel), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      if (response.ok) {
        currentModel = candidateModel;
        setSelectedModel(candidateModel);
        break;
      }

      // 1. Tratamento de 404 (modelo inexistente ou descontinuado)
      if (response.status === 404) {
        let errorDetail = '';
        try {
          const errorJson = await response.clone().json();
          errorDetail = errorJson?.error?.message || '';
        } catch {}

        console.warn(`Modelo ${candidateModel} retornou 404: ${errorDetail}`);

        // Se a mensagem do Google contiver "Please update your code to use models/...", extrai o modelo sugerido
        const match = errorDetail.match(/models\/(gemini-[\w.-]+)/);
        if (match && match[1] && !modelsToTry.includes(match[1])) {
          console.log(`Auto-detectado modelo recomendado pela API: ${match[1]}`);
          modelsToTry.splice(i + 1, 0, match[1]);
        }
        continue;
      }

      // 2. Tratamento de 503 (High Demand / Sobrecarga temporária) ou 429/500/502
      // Diferentes modelos do Gemini rodam em clusters distintos de TPU no Google Cloud.
      // Se um modelo estiver sobrecarregado, tentar outro modelo geralmente resolve imediatamente!
      if (response.status === 503 || response.status === 429 || response.status === 500 || response.status === 502) {
        console.warn(`Modelo ${candidateModel} retornou status ${response.status} (alta demanda). Tentando próximo modelo alternativo...`);
        await new Promise((resolve) => setTimeout(resolve, 500));
        continue;
      }

      // Se for erro permanente de parâmetros ou chave (400), interrompe o loop
      break;
    } catch (netErr) {
      if (i === modelsToTry.length - 1) {
        throw new Error(`Falha de conexão com os servidores do Google Gemini: ${netErr.message}`);
      }
    }
  }

  if (!response || !response.ok) {
    let errorDetail = '';
    try {
      const errorJson = await response.json();
      errorDetail = errorJson?.error?.message || JSON.stringify(errorJson);
    } catch {
      errorDetail = response?.statusText || 'Erro desconhecido';
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
            headers: { 'Content-Type': 'application/json' },
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
    const lastTool = toolExecutions[0];
    if (lastTool.name === 'criar_transacao') {
      textReply = `Pronto! Registrei o lançamento de **${lastTool.args.descricao}** no valor de **${formatMoney(Math.round(lastTool.args.valor_reais * 100))}** com sucesso.`;
    } else if (lastTool.name === 'simular_cenario') {
      textReply = `Pronto! Criei a simulação do cenário **${lastTool.args.titulo}** com impacto de **${formatMoney(Math.round(lastTool.args.valor_mensal * 100))}/mês** por **${lastTool.args.duracao_meses} meses**.`;
    }
  }

  return {
    text: textReply || 'Entendido! Estou à disposição para ajudar com suas finanças.',
    toolExecutions,
  };
};
