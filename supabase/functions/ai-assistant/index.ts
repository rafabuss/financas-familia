import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

// Configuração de cabeçalhos CORS para preflight e requisições cross-origin
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// Declaração de tipo para ambiente Deno
declare const Deno: {
  serve: (handler: (req: Request) => Promise<Response> | Response) => void;
  env: {
    get: (key: string) => string | undefined;
  };
};

interface GeminiContentPart {
  text?: string;
  functionCall?: {
    name: string;
    args?: Record<string, unknown>;
  };
  functionResponse?: {
    name: string;
    response: Record<string, unknown>;
  };
}

interface GeminiContent {
  role: string;
  parts: GeminiContentPart[];
}

interface RequestPayload {
  contents?: GeminiContent[];
  systemInstruction?: { parts?: Array<{ text: string }> } | string;
  tools?: Array<Record<string, unknown>>;
  model?: string;
}

Deno.serve(async (req: Request): Promise<Response> => {
  // 1. Trata preflight CORS (OPTIONS)
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      status: 200,
      headers: corsHeaders,
    });
  }

  // 2. Valida método HTTP (apenas POST permitido)
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({
        error: 'Método não permitido. Utilize POST.',
        code: 'METHOD_NOT_ALLOWED',
      }),
      {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }

  try {
    // 3. Validação de Autenticação JWT via Supabase Auth
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({
          error: 'Cabeçalho de autorização Bearer ausente ou inválido.',
          code: 'UNAUTHORIZED',
        }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') || '';

    if (!supabaseUrl || !supabaseAnonKey) {
      return new Response(
        JSON.stringify({
          error: 'Configuração do Supabase ausente nas variáveis de ambiente.',
          code: 'SERVER_CONFIG_ERROR',
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Cria cliente com o token do usuário para validação segura
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: { Authorization: authHeader },
      },
    });

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return new Response(
        JSON.stringify({
          error: 'Usuário não autenticado ou token JWT expirado.',
          code: 'UNAUTHORIZED',
        }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // 4. Obtenção da chave mestra do Google Gemini nos Segredos do Supabase
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
    if (!geminiApiKey || !geminiApiKey.trim()) {
      return new Response(
        JSON.stringify({
          error: 'Chave GEMINI_API_KEY não configurada no Supabase Secrets.',
          code: 'GEMINI_KEY_NOT_CONFIGURED',
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // 5. Parse do corpo da requisição
    let payload: RequestPayload;
    try {
      payload = await req.json();
    } catch (_parseErr) {
      return new Response(
        JSON.stringify({
          error: 'Corpo da requisição JSON inválido.',
          code: 'BAD_REQUEST',
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const { contents, tools, model } = payload;
    if (!contents || !Array.isArray(contents) || contents.length === 0) {
      return new Response(
        JSON.stringify({
          error: 'O parâmetro "contents" é obrigatório e deve ser um array com o histórico de mensagens.',
          code: 'BAD_REQUEST',
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Normalização do systemInstruction
    let systemInstruction = payload.systemInstruction;
    if (typeof systemInstruction === 'string') {
      systemInstruction = {
        parts: [{ text: systemInstruction }],
      };
    }

    // 6. Preparação do payload para a REST API do Google Gemini
    const geminiRequestBody: Record<string, unknown> = {
      contents,
    };

    if (systemInstruction) {
      geminiRequestBody.systemInstruction = systemInstruction;
    }

    if (tools && Array.isArray(tools) && tools.length > 0) {
      geminiRequestBody.tools = tools;
    }

    // 7. Resolução de Modelo com Fallback Resiliente
    const requestedModel = (model || '').replace(/^models\//, '').trim();
    const candidateModels = [
      requestedModel,
      'gemini-2.5-flash',
      'gemini-1.5-flash',
      'gemini-2.0-flash',
      'gemini-3.8-flash',
    ].filter(Boolean);

    // Remove duplicatas preservando a ordem de preferência
    const modelsToTry = candidateModels.filter(
      (item, idx) => candidateModels.indexOf(item) === idx
    );

    let geminiResponse: Response | null = null;
    let lastErrorDetail = '';
    let usedModel = requestedModel || 'gemini-2.5-flash';

    for (const currentModel of modelsToTry) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${currentModel}:generateContent?key=${geminiApiKey.trim()}`;

        geminiResponse = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': geminiApiKey.trim(),
          },
          body: JSON.stringify(geminiRequestBody),
        });

        if (geminiResponse.ok) {
          usedModel = currentModel;
          break;
        }

        let errorJson: { error?: { message?: string } } | null = null;
        try {
          errorJson = await geminiResponse.clone().json();
        } catch {
          // falha ao parsear erro como JSON
        }

        lastErrorDetail =
          errorJson?.error?.message || `HTTP ${geminiResponse.status} ${geminiResponse.statusText}`;

        // Se modelo não existir (404) ou houver sobrecarga (503/429), tenta o próximo modelo
        if (
          geminiResponse.status === 404 ||
          geminiResponse.status === 503 ||
          geminiResponse.status === 429
        ) {
          console.warn(
            `[ai-assistant] Modelo ${currentModel} falhou (${geminiResponse.status}): ${lastErrorDetail}. Tentando próximo candidato...`
          );
          continue;
        }

        // Se for chave inválida (400 com API_KEY_INVALID), interrompe
        if (geminiResponse.status === 400 && lastErrorDetail.includes('API_KEY_INVALID')) {
          break;
        }
      } catch (netErr: unknown) {
        const msg = netErr instanceof Error ? netErr.message : String(netErr);
        lastErrorDetail = msg;
        console.warn(`[ai-assistant] Erro de rede ao conectar com ${currentModel}:`, msg);
      }
    }

    if (!geminiResponse || !geminiResponse.ok) {
      let statusCode = 502;
      let errorCode = 'GEMINI_UPSTREAM_ERROR';

      if (lastErrorDetail.includes('API_KEY_INVALID')) {
        statusCode = 400;
        errorCode = 'INVALID_API_KEY';
      } else if (geminiResponse?.status === 429) {
        statusCode = 429;
        errorCode = 'RATE_LIMIT_EXCEEDED';
      } else if (geminiResponse?.status === 503) {
        statusCode = 503;
        errorCode = 'HIGH_DEMAND';
      }

      return new Response(
        JSON.stringify({
          error: `Erro ao comunicar com o Google Gemini: ${lastErrorDetail || 'Falha de comunicação upstream'}`,
          code: errorCode,
          details: lastErrorDetail,
        }),
        {
          status: statusCode,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // 8. Processamento e Estruturação da Resposta para o Cliente
    const geminiData = await geminiResponse.json();
    const candidate = geminiData?.candidates?.[0];
    const parts = candidate?.content?.parts || [];

    let text = '';
    const functionCalls: Array<{ name: string; args: Record<string, unknown> }> = [];

    for (const part of parts) {
      if (typeof part.text === 'string') {
        text += part.text;
      }
      if (part.functionCall) {
        functionCalls.push({
          name: part.functionCall.name,
          args: part.functionCall.args || {},
        });
      }
    }

    return new Response(
      JSON.stringify({
        text,
        functionCalls,
        candidates: geminiData?.candidates || [],
        model: usedModel,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (uncaughtErr: unknown) {
    const errorMsg = uncaughtErr instanceof Error ? uncaughtErr.message : String(uncaughtErr);
    return new Response(
      JSON.stringify({
        error: `Erro interno no servidor: ${errorMsg}`,
        code: 'INTERNAL_SERVER_ERROR',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
