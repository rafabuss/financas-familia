/**
 * Motor de Conciliação Híbrida Inteligente & Auto-Categorização
 * Responsável por:
 * 1. Categorização inteligente por palavras-chave com foco no mercado brasileiro
 * 2. Detecção de 3 estados de conciliação:
 *    - 🟢 NOVO (inexistente no sistema)
 *    - 🟡 SUGERIR CONCILIAÇÃO (Match inteligente com lançamento manual +/- 3 dias)
 *    - 🔴 JÁ IMPORTADO (Duplicata exata por FITID bancário ou dados idênticos)
 * 3. Desmembramento (Split) de transações únicas em múltiplas categorias
 * 4. Gerador de OFX de Demonstração dinâmico
 */

import { formatDateBR } from '../utils/formatters.js';

/**
 * Regras abrangentes de correspondência de palavras-chave para categorias brasileiras
 */
const CATEGORY_RULES = [
  // Supermercado & Alimentação
  {
    keywords: [
      'supermercado', 'mercado', 'carrefour', 'extra', 'pao de acucar', 'pão de açúcar',
      'atacadao', 'atacadão', 'assai', 'assaí', 'muffato', 'angeloni', 'fort atacadista',
      'hortifruti', 'sacolao', 'sacolão', 'feira', 'swift', 'dia brasil', 'condor',
      'zaffari', 'sonda', 'supermercados', 'mercado livre mercado'
    ],
    categoryMatches: ['supermercado', 'mercado', 'feira', 'alimentação', 'alimentacao'],
    type: 'EXPENSE',
  },
  // Restaurantes, Delivery & Lanches
  {
    keywords: [
      'ifood', 'ifd*', 'rappi', 'restaurante', 'mcdonald', 'burger king', 'subway',
      'habib', 'pizzaria', 'pizza', 'sushi', 'churrascaria', 'bar', 'boteco',
      'lanchonete', 'padaria', 'cafe', 'café', 'starbucks', 'bacio di latte',
      'madalena', 'choperia', 'gastronomia', 'almoço', 'almoco', 'refeicao', 'refeição'
    ],
    categoryMatches: ['padaria', 'restaurante', 'refeição', 'alimentação', 'alimentacao', 'lazer'],
    type: 'EXPENSE',
  },
  // Combustível & Postos
  {
    keywords: [
      'posto', 'shell', 'ipiranga', 'petrobras', 'br distribuidora', 'auto posto',
      'combustivel', 'combustível', 'gasolina', 'etanol', 'gnv', 'diesel', 'abastece'
    ],
    categoryMatches: ['combustível', 'combustivel', 'transporte', 'veículos', 'veiculos'],
    type: 'EXPENSE',
  },
  // Transporte Urbano, Pedágio & Estacionamento
  {
    keywords: [
      'uber', '99app', '99 *', '99 pop', 'taxi', 'táxi', 'estapar', 'estacionamento',
      'sem parar', 'veloe', 'conectcar', 'pedagio', 'pedágio', 'metro', 'metrô',
      'cptm', 'sptrans', 'autovias', 'ecovias', 'ccr'
    ],
    categoryMatches: ['transporte', 'veículos', 'veiculos'],
    type: 'EXPENSE',
  },
  // Moradia, Contas Básicas & Utilidades
  {
    keywords: [
      'aluguel', 'condominio', 'condomínio', 'quintoandar', 'loft', 'enel', 'cpfl',
      'light', 'cemig', 'copel', 'equatorial', 'energisa', 'sabesp', 'copasa',
      'sanepar', 'embasa', 'caesb', 'comgas', 'comgás', 'naturgy', 'gas brasiliano'
    ],
    categoryMatches: ['aluguel', 'condomínio', 'condominio', 'energia', 'moradia', 'contas básicas', 'contas basicas'],
    type: 'EXPENSE',
  },
  // Internet, Telefonia & Celular
  {
    keywords: [
      'vivo', 'claro', 'tim', 'oi', 'telecom', 'fibra', 'internet', 'net virtua',
      'algar', 'desktop internet', 'brisanet'
    ],
    categoryMatches: ['internet', 'moradia', 'serviços', 'servicos'],
    type: 'EXPENSE',
  },
  // Saúde, Farmácia & Medicamentos
  {
    keywords: [
      'farmacia', 'farmácia', 'drogaria', 'drogasil', 'raia', 'droga raia', 'pacheco',
      'sao paulo', 'são paulo', 'panvel', 'pague menos', 'araujo', 'remedio', 'remédio',
      'medico', 'médico', 'consulta', 'clinica', 'clínica', 'hospital', 'laboratorio',
      'laboratório', 'fleury', 'dasa', 'lavoisier', 'delboni', 'dentista', 'odonto',
      'unimed', 'bradesco saude', 'sulamerica saude', 'amil'
    ],
    categoryMatches: ['saúde', 'saude', 'farmácia', 'farmacia', 'médico', 'medico'],
    type: 'EXPENSE',
  },
  // Educação, Cursos & Livros
  {
    keywords: [
      'escola', 'colegio', 'colégio', 'faculdade', 'universidade', 'mensalidade escolar',
      'curso', 'idiomas', 'udemy', 'alura', 'coursera', 'livraria', 'saraiva', 'panini',
      'cultura', 'leitura', 'material escolar'
    ],
    categoryMatches: ['educação', 'educacao', 'cursos', 'escola'],
    type: 'EXPENSE',
  },
  // Assinaturas, Streaming & Lazer
  {
    keywords: [
      'netflix', 'spotify', 'amazon prime', 'prime video', 'disney', 'hbo max',
      'max *', 'globoplay', 'apple.com/bill', 'apple store', 'google play', 'youtube',
      'chatgpt', 'openai', 'deezer', 'steam', 'playstation', 'psn', 'xbox',
      'nintendo', 'cinema', 'cinemark', 'ingresso.com', 'sympla', 'teatro'
    ],
    categoryMatches: ['lazer', 'serviços', 'servicos', 'assinatura', 'streaming'],
    type: 'EXPENSE',
  },
  // Vestuário & Calçados
  {
    keywords: [
      'zara', 'renner', 'riachuelo', 'c&a', 'shein', 'centauro', 'decathlon',
      'hering', 'arezzo', 'schutz', 'havan', 'moda', 'vestuario', 'vestuário',
      'calcado', 'calçado', 'roupa', 'tenis', 'tênis', 'netshoes'
    ],
    categoryMatches: ['vestuário', 'vestuario', 'compras', 'pessoal'],
    type: 'EXPENSE',
  },
  // Salário & Receitas de Trabalho
  {
    keywords: [
      'salario', 'salário', 'pro-labore', 'pró-labore', 'folha pagto', 'vencimento',
      'remuneracao', 'remuneração', 'ted recebida', 'pix recebido de', 'credito ordenado'
    ],
    categoryMatches: ['salário', 'salario', 'pró-labore', 'renda extra'],
    type: 'INCOME',
  },
  // Rendimentos & Investimentos
  {
    keywords: [
      'dividendos', 'juros sobre capital', 'jcp', 'rendimento', 'aplicacao',
      'resgate cdb', 'tesouro direto', 'fii', 'provento'
    ],
    categoryMatches: ['investimentos', 'rendimentos', 'dividendos'],
    type: 'INCOME',
  },
  // Renda Extra & Reembolsos
  {
    keywords: [
      'consultoria', 'freelance', 'reembolso', 'devolucao', 'cashback', 'bônus', 'bonus'
    ],
    categoryMatches: ['renda extra', 'outros', 'reembolso'],
    type: 'INCOME',
  }
];

/**
 * Sugere a melhor categoria baseada na descrição e tipo da transação
 */
export function suggestCategory(description = '', transactionType = 'EXPENSE', availableCategories = []) {
  if (!availableCategories || availableCategories.length === 0) return null;

  const descLower = String(description).toLowerCase().trim();
  const normalizedType = transactionType === 'INCOME' ? 'INCOME' : 'EXPENSE';

  // 1. Procura nas regras específicas pelo tipo
  const matchedRules = CATEGORY_RULES.filter(
    (rule) => rule.type === normalizedType && rule.keywords.some((kw) => descLower.includes(kw))
  );

  for (const rule of matchedRules) {
    // Busca preferencialmente categorias ativas que combinem com os nomes almejados
    for (const matchName of rule.categoryMatches) {
      // Prioridade para subcategorias com nome direto
      const exactSub = availableCategories.find(
        (c) =>
          !c.archived &&
          c.type === normalizedType &&
          c.name.toLowerCase().includes(matchName)
      );
      if (exactSub) return exactSub.id;
    }
  }

  // 2. Busca por similaridade direta do nome da categoria com a descrição
  const directMatch = availableCategories.find(
    (c) =>
      !c.archived &&
      c.type === normalizedType &&
      c.name.length > 3 &&
      descLower.includes(c.name.toLowerCase())
  );
  if (directMatch) return directMatch.id;

  // 3. Fallback: primeira categoria válida daquele tipo
  const defaultCategory = availableCategories.find(
    (c) => !c.archived && c.type === normalizedType
  );

  return defaultCategory ? defaultCategory.id : (availableCategories[0]?.id || null);
}

/**
 * Calcula a diferença em dias entre duas datas ISO YYYY-MM-DD
 */
export function calculateDateDiffDays(dateStr1, dateStr2) {
  if (!dateStr1 || !dateStr2) return 999;
  const d1 = new Date(dateStr1.slice(0, 10));
  const d2 = new Date(dateStr2.slice(0, 10));
  const diffTime = Math.abs(d2.getTime() - d1.getTime());
  return Math.round(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Normaliza textos para comparação flexível
 */
function normalizeString(str) {
  return String(str || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Motor de Conciliação Híbrida Inteligente
 * Classifica cada item importado em um dos 3 estados:
 * - 🟢 NEW: Lançamento inédito
 * - 🟡 SUGGEST_MATCH: Match inteligente com lançamento manual existente (+/- 3 dias)
 * - 🔴 DUPLICATE: Já importado ou duplicata exata
 *
 * @param {Array} importedItems - Itens extraídos do OFX, CSV ou PDF
 * @param {Array} existingTransactions - Transações existentes no sistema
 * @param {Object} options - { targetId, targetType, dateMarginDays, categories, defaultOwnerId }
 */
export function reconcileTransactions(importedItems = [], existingTransactions = [], options = {}) {
  const {
    targetId = null,
    targetType = 'ACCOUNT', // 'ACCOUNT' | 'CARD'
    dateMarginDays = 3,
    categories = [],
    defaultOwnerId = 'user-1',
  } = options;

  // Filtra transações candidatas que pertencem ao mesmo destino ou não têm destino amarrado
  const candidateTransactions = existingTransactions.filter((tx) => {
    if (targetType === 'CARD') {
      return !targetId || tx.cardId === targetId;
    } else {
      return !targetId || tx.accountId === targetId;
    }
  });

  // Conjunto de IDs já casados para evitar casar dois itens importados na mesma transação manual
  const matchedExistingIds = new Set();

  return importedItems.map((item, index) => {
    const itemDate = item.purchaseDate || item.date;
    const itemAmountCents = Math.abs(item.amountCents || 0);
    const itemType = item.type || 'EXPENSE';
    const normItemDesc = normalizeString(item.description);

    // -------------------------------------------------------------
    // 1. Verificação de Duplicata Exata (🔴 DUPLICATE)
    // -------------------------------------------------------------
    let duplicateMatch = null;

    // A) Match por FITID bancário único (já registrado anteriormente)
    if (item.fitId) {
      duplicateMatch = candidateTransactions.find(
        (t) => t.fitId && t.fitId === item.fitId
      );
    }

    // B) Match exato por dados: mesma conta/cartão, mesma data exata, mesmo valor e descrição semelhante
    if (!duplicateMatch) {
      duplicateMatch = candidateTransactions.find((t) => {
        if (matchedExistingIds.has(t.id)) return false;
        const tDate = t.purchaseDate || t.date;
        const tAmount = Math.abs(t.amountCents || 0);
        if (tAmount !== itemAmountCents) return false;
        if (tDate !== itemDate) return false;
        if (t.type !== itemType) return false;

        const normTDesc = normalizeString(t.description);
        // Descrição idêntica ou uma contém a outra
        return (
          normTDesc === normItemDesc ||
          (normTDesc.length > 5 && normItemDesc.includes(normTDesc)) ||
          (normItemDesc.length > 5 && normTDesc.includes(normItemDesc))
        );
      });
    }

    if (duplicateMatch) {
      matchedExistingIds.add(duplicateMatch.id);
      const suggestedCatId =
        duplicateMatch.categoryId ||
        item.categoryId ||
        suggestCategory(item.description, itemType, categories);

      return {
        ...item,
        reconciliationStatus: 'DUPLICATE',
        selected: false, // Desmarcado por padrão para evitar duplicações
        action: 'IGNORE', // 'IGNORE' | 'IMPORT_NEW'
        matchedTransactionId: duplicateMatch.id,
        matchedTransaction: duplicateMatch,
        reconcileBadge: '🔴 Já Registrado',
        reconcileMessage: `Identificado anteriormente como "${duplicateMatch.description}" em ${formatDateBR(duplicateMatch.purchaseDate || duplicateMatch.date)} (${duplicateMatch.fitId ? 'FITID ' + duplicateMatch.fitId : 'Dados exatos'}).`,
        categoryId: suggestedCatId,
        ownerId: duplicateMatch.ownerId || item.ownerId || defaultOwnerId,
        scope: duplicateMatch.scope || item.scope || 'FAMILY',
        visibility: duplicateMatch.visibility || (duplicateMatch.scope === 'PERSONAL' ? 'PERSONAL_PRIVATE' : 'FAMILY'),
      };
    }

    // -------------------------------------------------------------
    // 2. Verificação de Match Inteligente (🟡 SUGGEST_MATCH)
    // -------------------------------------------------------------
    // O sistema detecta lançamento manual existente com mesmo valor e data próxima (+/- 2 a 3 dias)
    const smartMatch = candidateTransactions.find((t) => {
      if (matchedExistingIds.has(t.id)) return false;
      const tAmount = Math.abs(t.amountCents || 0);
      if (tAmount !== itemAmountCents) return false;
      if (t.type !== itemType) return false;

      const tDate = t.purchaseDate || t.date;
      const diffDays = calculateDateDiffDays(tDate, itemDate);
      return diffDays <= dateMarginDays;
    });

    if (smartMatch) {
      matchedExistingIds.add(smartMatch.id);
      const suggestedCatId =
        smartMatch.categoryId ||
        item.categoryId ||
        suggestCategory(item.description, itemType, categories);

      return {
        ...item,
        reconciliationStatus: 'SUGGEST_MATCH',
        selected: true, // Marcado para ação do usuário
        action: 'RECONCILE', // 'RECONCILE' (atualiza existente) | 'IMPORT_NEW' (cria nova)
        matchedTransactionId: smartMatch.id,
        matchedTransaction: smartMatch,
        reconcileBadge: '🟡 Sugestão de Conciliação',
        reconcileMessage: `Lançamento manual compatível: "${smartMatch.description}" de ${formatDateBR(smartMatch.purchaseDate || smartMatch.date)}. Escolha conciliar ou importar como novo.`,
        categoryId: suggestedCatId,
        ownerId: smartMatch.ownerId || item.ownerId || defaultOwnerId,
        scope: smartMatch.scope || item.scope || 'FAMILY',
        visibility: smartMatch.visibility || (smartMatch.scope === 'PERSONAL' ? 'PERSONAL_PRIVATE' : 'FAMILY'),
      };
    }

    // -------------------------------------------------------------
    // 3. Novo Lançamento (🟢 NEW)
    // -------------------------------------------------------------
    const suggestedCatId =
      item.categoryId || suggestCategory(item.description, itemType, categories);

    return {
      ...item,
      reconciliationStatus: 'NEW',
      selected: true,
      action: 'IMPORT_NEW',
      matchedTransactionId: null,
      matchedTransaction: null,
      reconcileBadge: '🟢 Novo Lançamento',
      reconcileMessage: 'Lançamento não encontrado no sistema. Pronto para importação.',
      categoryId: suggestedCatId,
      ownerId: item.ownerId || defaultOwnerId,
      scope: item.scope || 'FAMILY',
      visibility: item.visibility || 'FAMILY',
    };
  });
}

/**
 * Desmembra (Split) uma transação em duas ou mais partes
 * @param {Object} originalItem - Transação original a ser dividida
 * @param {Array} splits - Lista de splits [{ description, amountCents, categoryId, scope, ownerId }]
 * @returns {Array} Itens divididos prontos para substituir o item original
 */
export function splitTransactionItem(originalItem, splits = []) {
  if (!originalItem || !splits || splits.length < 2) {
    throw new Error('É necessário ao menos duas divisões para desmembrar o lançamento.');
  }

  const totalSplitCents = splits.reduce((acc, s) => acc + (parseInt(s.amountCents, 10) || 0), 0);
  if (totalSplitCents !== originalItem.amountCents) {
    throw new Error(
      `A soma das divisões (${totalSplitCents / 100}) deve ser exatamente igual ao valor original (${originalItem.amountCents / 100}).`
    );
  }

  return splits.map((split, idx) => ({
    ...originalItem,
    id: `${originalItem.id}-split-${idx + 1}-${Math.random().toString(36).slice(2, 5)}`,
    fitId: originalItem.fitId ? `${originalItem.fitId}-part${idx + 1}` : null,
    isSplit: true,
    splitIndex: idx + 1,
    splitTotal: splits.length,
    splitParentId: originalItem.id,
    description: split.description || `${originalItem.description} (Parte ${idx + 1}/${splits.length})`,
    amountCents: parseInt(split.amountCents, 10),
    categoryId: split.categoryId || originalItem.categoryId,
    scope: split.scope || originalItem.scope || 'FAMILY',
    visibility: split.visibility || originalItem.visibility || 'FAMILY',
    ownerId: split.ownerId || originalItem.ownerId,
    action: originalItem.action || 'IMPORT_NEW',
    selected: true,
  }));
}

/**
 * Gera dados OFX de exemplo com datas dinâmicas no mês atual
 * Inclui:
 * 1. Lançamentos novos
 * 2. Lançamento que dá match com transação existente (🟡)
 * 3. Lançamento que é duplicata (🔴)
 */
export function generateSampleOfxData(type = 'ACCOUNT', existingTransactions = []) {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = Math.min(now.getDate(), 26);
  const pad = (n) => String(n).padStart(2, '0');

  // Tenta encontrar uma transação existente no mês corrente para simular o Match Inteligente (🟡)
  const candidateMatch = existingTransactions.find(
    (t) => t.type === 'EXPENSE' && t.amountCents > 1000 && t.amountCents < 50000
  ) || {
    amountCents: 4500,
    description: 'Almoço Restaurante Familiar',
    date: `${year}-${month}-${pad(Math.max(1, day - 2))}`,
    fitId: null,
  };

  // Tenta encontrar ou criar uma duplicata já existente (🔴)
  const existingDup = existingTransactions.find((t) => t.fitId) || {
    fitId: `OFX-DUP-${year}${month}01`,
    amountCents: 8990,
    description: 'Farmácia Drogasil Saúde',
    date: `${year}-${month}-02`,
  };

  const matchAmtFormatted = (-candidateMatch.amountCents / 100).toFixed(2);
  const matchDateOfx = candidateMatch.date.replace(/-/g, '') + '120000[-03:BRT]';

  const dupAmtFormatted = (-existingDup.amountCents / 100).toFixed(2);
  const dupDateOfx = `${year}${month}02120000[-03:BRT]`;
  const dupFitId = existingDup.fitId || `OFX-DUP-${year}${month}01`;

  const d1 = `${year}${month}${pad(Math.max(1, day - 1))}120000[-03:BRT]`;
  const d2 = `${year}${month}${pad(Math.max(1, day - 3))}120000[-03:BRT]`;
  const d3 = `${year}${month}${pad(Math.max(1, day - 5))}120000[-03:BRT]`;
  const d4 = `${year}${month}${pad(Math.max(1, day - 8))}120000[-03:BRT]`;

  if (type === 'CARD') {
    return `OFXHEADER:100
DATA:OFXSGML
VERSION:102
SECURITY:NONE
ENCODING:UTF-8
CHARSET:1252
COMPRESSION:NONE
OLDFILEUID:NONE
NEWFILEUID:NONE

<OFX>
<SIGNONMSGSRSV1>
<SONRS>
<STATUS>
<CODE>0
<SEVERITY>INFO
</STATUS>
<DTSERVER>${year}${month}${pad(day)}120000[-03:BRT]
<LANGUAGE>POR
<FI>
<ORG>Nubank Mastercard
<FID>260
</FI>
</SONRS>
</SIGNONMSGSRSV1>
<CREDITCARDMSGSRSV1>
<CCSTMTTRNRS>
<TRNUID>1001
<STATUS>
<CODE>0
<SEVERITY>INFO
</STATUS>
<CCSTMTRS>
<CURDEF>BRL
<CCACCTFROM>
<ACCTID>**** **** **** 8557
</CCACCTFROM>
<BANKTRANLIST>
<DTSTART>${year}${month}01120000[-03:BRT]
<DTEND>${year}${month}${pad(day)}120000[-03:BRT]
<STMTTRN>
<TRNTYPE>DEBIT
<DTPOSTED>${d1}
<TRNAMT>-320.50
<FITID>CARD-${year}${month}-001
<MEMO>SUPERMERCADO CARREFOUR 01/01
</STMTTRN>
<STMTTRN>
<TRNTYPE>DEBIT
<DTPOSTED>${matchDateOfx}
<TRNAMT>${matchAmtFormatted}
<FITID>CARD-${year}${month}-MATCH
<MEMO>RESTAURANTE SABOR BRASIL
</STMTTRN>
<STMTTRN>
<TRNTYPE>DEBIT
<DTPOSTED>${d2}
<TRNAMT>-185.00
<FITID>CARD-${year}${month}-002
<MEMO>POSTO IPIRANGA COMBUSTIVEL
</STMTTRN>
<STMTTRN>
<TRNTYPE>DEBIT
<DTPOSTED>${d3}
<TRNAMT>-55.90
<FITID>CARD-${year}${month}-003
<MEMO>NETFLIX.COM MENSALIDADE
</STMTTRN>
<STMTTRN>
<TRNTYPE>DEBIT
<DTPOSTED>${dupDateOfx}
<TRNAMT>${dupAmtFormatted}
<FITID>${dupFitId}
<MEMO>DROGARIA RAIA FARMACIA
</STMTTRN>
</BANKTRANLIST>
<LEDGERBAL>
<BALAMT>-606.40
<DTASOF>${year}${month}${pad(day)}
</LEDGERBAL>
</CCSTMTRS>
</CCSTMTTRNRS>
</CREDITCARDMSGSRSV1>
</OFX>`;
  }

  // Extrato Bancário de Conta Corrente (Banco do Brasil / Inter / Itaú)
  return `OFXHEADER:100
DATA:OFXSGML
VERSION:102
SECURITY:NONE
ENCODING:UTF-8
CHARSET:1252
COMPRESSION:NONE
OLDFILEUID:NONE
NEWFILEUID:NONE

<OFX>
<SIGNONMSGSRSV1>
<SONRS>
<STATUS>
<CODE>0
<SEVERITY>INFO
</STATUS>
<DTSERVER>${year}${month}${pad(day)}120000[-03:BRT]
<LANGUAGE>POR
<FI>
<ORG>Banco do Brasil S.A.
<FID>001
</FI>
</SONRS>
</SIGNONMSGSRSV1>
<BANKMSGSRSV1>
<STMTTRNRS>
<TRNUID>2001
<STATUS>
<CODE>0
<SEVERITY>INFO
</STATUS>
<STMTRS>
<CURDEF>BRL
<BANKACCTFROM>
<BANKID>001
<BRANCHID>1234
<ACCTID>98765-4
<ACCTTYPE>CHECKING
</BANKACCTFROM>
<BANKTRANLIST>
<DTSTART>${year}${month}01120000[-03:BRT]
<DTEND>${year}${month}${pad(day)}120000[-03:BRT]
<STMTTRN>
<TRNTYPE>CREDIT
<DTPOSTED>${d4}
<TRNAMT>4500.00
<FITID>BB-${year}${month}-SAL
<MEMO>TED RECEBIDA - SALARIO EMPRESA
</STMTTRN>
<STMTTRN>
<TRNTYPE>DEBIT
<DTPOSTED>${d1}
<TRNAMT>-245.80
<FITID>BB-${year}${month}-001
<MEMO>PIX ENVIADO - ENEL ENERGIA ELETRICA
</STMTTRN>
<STMTTRN>
<TRNTYPE>DEBIT
<DTPOSTED>${matchDateOfx}
<TRNAMT>${matchAmtFormatted}
<FITID>BB-${year}${month}-MATCH
<MEMO>PIX - ALMOCO RESTAURANTE
</STMTTRN>
<STMTTRN>
<TRNTYPE>DEBIT
<DTPOSTED>${d2}
<TRNAMT>-120.00
<FITID>BB-${year}${month}-002
<MEMO>DEBITO AUTOMATICO - VIVO FIBRA INTERNET
</STMTTRN>
<STMTTRN>
<TRNTYPE>DEBIT
<DTPOSTED>${dupDateOfx}
<TRNAMT>${dupAmtFormatted}
<FITID>${dupFitId}
<MEMO>COMPRA DEBITO - DROGARIA SAUDE
</STMTTRN>
</BANKTRANLIST>
<LEDGERBAL>
<BALAMT>8450.00
<DTASOF>${year}${month}${pad(day)}
</LEDGERBAL>
</STMTRS>
</STMTTRNRS>
</BANKMSGSRSV1>
</OFX>`;
}
