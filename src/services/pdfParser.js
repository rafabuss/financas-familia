import * as pdfjsLib from 'pdfjs-dist';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.mjs?url';

// Configura o worker do PDF.js para navegadores via Vite
if (typeof window !== 'undefined' && pdfjsLib?.GlobalWorkerOptions) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;
}

/**
 * Mapeamento inteligente de palavras-chave para categorias cadastradas
 */
export function suggestCategory(description = '', categoryHint = '', availableCategories = []) {
  if (!availableCategories || availableCategories.length === 0) return null;

  const combined = `${description} ${categoryHint}`.toLowerCase();

  // Regras de correspondência de alta precisão
  const rules = [
    {
      keywords: ['supermercado', 'mercado', 'angeloni', 'imperatriz', 'fort atacadista', 'atacad', 'sj comercio', 'feira', 'hortifruti', 'padaria'],
      catMatch: ['supermercado', 'alimenta', 'feira', 'compras']
    },
    {
      keywords: ['restaurante', 'sushi', 'burger', 'pizzaria', 'ifd*', 'ifood', 'marilene', 'bar', 'lanchonete', 'cafe', 'sabores', 'churrascaria', 'gastronomia'],
      catMatch: ['restaurante', 'lazer', 'alimenta', 'refeição']
    },
    {
      keywords: ['saude', 'saúde', 'health', 'farmacia', 'farmácia', 'drogaria', 'oralglass', 'dentista', 'medico', 'médico', 'laboratorio', 'clinica', 'clínica', 'hospital', 'remedio'],
      catMatch: ['saúde', 'saude', 'farmácia', 'farmacia', 'medico']
    },
    {
      keywords: ['educacao', 'educação', 'escola', 'faculdade', 'curso', 'educa mais', 'colegio', 'colégio', 'idiomas', 'udemy', 'livraria', 'universidade'],
      catMatch: ['educação', 'educacao', 'curso']
    },
    {
      keywords: ['vestuario', 'vestuário', 'havan', 'constance', 'roupa', 'calcado', 'calçado', 'moda', 'zara', 'renner', 'riachuelo', 'oculos', 'óculos', 'q oculos'],
      catMatch: ['vestuário', 'vestuario', 'roupa', 'compras']
    },
    {
      keywords: ['academia', 'point academia', 'smart fit', 'crossfit', 'natacao', 'esporte'],
      catMatch: ['saúde', 'lazer', 'academia']
    },
    {
      keywords: ['google', 'youtube', 'microsoft', 'xbox', 'deepsearch', 'apple', 'netflix', 'spotify', 'amazon prime', 'disney', 'chatgpt', 'openai'],
      catMatch: ['serviços', 'servicos', 'assinatura', 'lazer', 'tecnologia']
    },
    {
      keywords: ['uber', '99app', 'posto', 'gasolina', 'combustivel', 'combustível', 'ipva', 'estacionamento', 'pedagio', 'pedágio'],
      catMatch: ['transporte', 'combustível', 'veículo', 'carro']
    },
    {
      keywords: ['toro inves', 'universal', 'pg *', 'serviços', 'servicos', 'cartorio', 'taxa', 'seguro'],
      catMatch: ['serviços', 'servicos', 'outros']
    }
  ];

  for (const rule of rules) {
    if (rule.keywords.some(kw => combined.includes(kw))) {
      const matched = availableCategories.find(c =>
        rule.catMatch.some(target => c.name.toLowerCase().includes(target))
      );
      if (matched) return matched.id;
    }
  }

  // Fallback: busca por nome direto da categoria na descrição ou dica
  for (const cat of availableCategories) {
    if (cat.name && combined.includes(cat.name.toLowerCase())) {
      return cat.id;
    }
  }

  // Se não encontrar regra específica, retorna a primeira categoria de despesa ou a primeira disponível
  const defaultExpense = availableCategories.find(c => c.type === 'EXPENSE' && !c.archived);
  return defaultExpense ? defaultExpense.id : (availableCategories[0]?.id || null);
}

/**
 * Sugere escopo (FAMILIAR vs PESSOAL) com base na categoria e descrição
 */
export function suggestScope(description = '', categoryHint = '') {
  const combined = `${description} ${categoryHint}`.toLowerCase();
  
  // Despesas claramente pessoais ou de interesse individual
  const personalKeywords = ['xbox', 'games', 'oculos', 'óculos', 'constance', 'vestuário', 'vestuario', 'barbearia', 'salao'];
  if (personalKeywords.some(kw => combined.includes(kw))) {
    return 'PERSONAL';
  }

  // Padrão orçamentário familiar
  return 'FAMILY';
}

/**
 * Parser principal de faturas PDF (Itaú Black/Platinum/Mastercard/Visa e padrão bancário brasileiro)
 * @param {ArrayBuffer|Uint8Array} pdfData - Buffer binário do PDF
 * @param {Array} availableCategories - Categorias cadastradas no sistema
 * @param {Array} familyMembers - Membros da família para associação de titular
 */
export async function parseInvoicePdf(pdfData, availableCategories = [], familyMembers = []) {
  const doc = await pdfjsLib.getDocument({ data: pdfData }).promise;

  // 1. Extração de metadados da Fatura (Página 1)
  const page1 = await doc.getPage(1);
  const textContent1 = await page1.getTextContent();
  const page1Strings = textContent1.items.filter(i => 'str' in i).map(i => i.str);
  const page1FullText = page1Strings.join(' ');

  // Cartão (ex: Cartão 5536.XXXX.XXXX.8557 -> 8557)
  let cardLast4 = '';
  const cardMatch = page1FullText.match(/Cartão\s+[\d.X]+\.(\d{4})/i) || page1FullText.match(/(?:Final|Cartão|Card)[:\s]+.*?(\d{4})/i);
  if (cardMatch) cardLast4 = cardMatch[1];

  // Vencimento (ex: 22/09/2026)
  let dueDate = '';
  const dueMatch = page1FullText.match(/Vencimento:\s*(\d{2}\/\d{2}\/\d{4})/i) || page1FullText.match(/vencimento em:\s*(\d{2}\/\d{2}\/\d{4})/i);
  if (dueMatch) dueDate = dueMatch[1];

  let dueDateIso = '';
  if (dueDate && dueDate.includes('/')) {
    const [d, m, y] = dueDate.split('/');
    dueDateIso = `${y}-${m}-${d}`;
  }

  // Fechamento / Emissão (ex: 15/09/2026)
  let closingDate = '';
  const closingMatch = page1FullText.match(/(?:Emissão|Postagem|Fechamento):\s*(\d{2}\/\d{2}\/\d{4})/i);
  if (closingMatch) closingDate = closingMatch[1];

  // Titular da fatura
  let cardholder = '';
  const holderMatch = page1FullText.match(/Titular\s+([A-Z\s]{4,40})/i) || page1FullText.match(/RAFAEL BUSS FERREIRA/i);
  if (holderMatch) cardholder = holderMatch[1]?.trim() || holderMatch[0]?.trim();

  // Total da Fatura (ex: R$ 2.149,92)
  let totalInvoiceCents = 0;
  const totalMatch = page1FullText.match(/Total desta fatura\s*([\d.,]+)/i) || page1FullText.match(/total da sua fatura é:\s*R\$\s*([\d.,]+)/i);
  if (totalMatch) {
    const clean = totalMatch[1].replace(/\./g, '').replace(',', '.');
    totalInvoiceCents = Math.round(parseFloat(clean) * 100);
  }

  // Identificação do membro correspondente pelo nome do titular
  let defaultOwnerId = 'user-1';
  if (cardholder && familyMembers && familyMembers.length > 0) {
    const holderLower = cardholder.toLowerCase();
    const matchedMember = familyMembers.find(m => {
      const mName = m.name.toLowerCase();
      return (
        m.id !== 'user-all' &&
        m.id !== 'family-shared' &&
        (holderLower.includes('rafael') && mName.includes('rafael') ||
         holderLower.includes('ana') && mName.includes('ana'))
      );
    });
    if (matchedMember) defaultOwnerId = matchedMember.id;
  }

  // 2. Extração dos itens e compras da fatura
  const rawItems = [];

  for (let pageNum = 1; pageNum <= doc.numPages; pageNum++) {
    const page = await doc.getPage(pageNum);
    const content = await page.getTextContent();

    const textItems = content.items
      .filter(i => 'str' in i && i.str.trim())
      .map(i => ({
        str: i.str.trim(),
        x: Math.round(i.transform[4]),
        y: Math.round(i.transform[5]),
        width: Math.round(i.width || 0)
      }));

    // No modelo Itaú (página 2), os lançamentos são organizados em duas colunas paralelas
    // Coluna 1: x < 340 | Coluna 2: x >= 340
    const columns = [
      textItems.filter(i => i.x < 340),
      textItems.filter(i => i.x >= 340)
    ];

    for (const colItems of columns) {
      if (colItems.length === 0) continue;

      // Ordena de cima para baixo (y decrescente)
      colItems.sort((a, b) => b.y - a.y || a.x - b.x);

      let inTransactionsSection = false;
      let stopSection = false;

      // Agrupa itens em linhas por proximidade de coordenada Y (tolerância de 4px)
      const lines = [];
      for (const item of colItems) {
        let existingLine = lines.find(l => Math.abs(l.y - item.y) <= 4);
        if (existingLine) {
          existingLine.items.push(item);
          existingLine.items.sort((a, b) => a.x - b.x);
        } else {
          lines.push({ y: item.y, items: [item] });
        }
      }

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const lineStr = line.items.map(it => it.str).join(' ');

        // Início da seção de compras
        if (lineStr.includes('Lançamentos: compras e saques')) {
          inTransactionsSection = true;
          continue;
        }

        // Condições de parada: totais ou compras parceladas de próximas faturas
        if (
          lineStr.includes('Total dos lançamentos') ||
          lineStr.includes('Lançamentos no cartão') ||
          lineStr.includes('Compras parceladas - próximas faturas') ||
          lineStr.includes('Total para próximas faturas') ||
          lineStr.includes('Limites de crédito')
        ) {
          stopSection = true;
        }

        if (stopSection) break;
        if (!inTransactionsSection) continue;

        // Pula cabeçalhos da tabela e nome do portador
        if (lineStr.includes('ESTABELECIMENTO') || lineStr.includes('DATA') || lineStr.includes('VALOR EM R$')) continue;
        if (lineStr.includes('RAFAEL BUSS') || lineStr.includes('Titular') || lineStr.includes('4004 4828') || lineStr.includes('0800')) continue;

        // Estrutura de uma linha de compra:
        // Item 0: Data no formato DD/MM (ex: "19/09" ou "23/08")
        // Último item: Valor monetário (ex: "71,61" ou "-1.258,76")
        const firstItem = line.items[0]?.str;
        const lastItem = line.items[line.items.length - 1]?.str;
        const dateMatch = firstItem && firstItem.match(/^(\d{2}\/\d{2})$/);
        const amountMatch = lastItem && lastItem.match(/^-?([\d.]+,\d{2})$/);

        if (dateMatch && amountMatch && line.items.length >= 2) {
          const dateShort = dateMatch[1]; // dd/mm
          const amountRaw = amountMatch[1];
          const isNegative = lastItem.startsWith('-');
          const amountNum = parseFloat(amountRaw.replace(/\./g, '').replace(',', '.'));
          const amountCents = Math.round(amountNum * 100) * (isNegative ? -1 : 1);

          // Itens intermediários formam o nome do estabelecimento e parcelamento
          const descItems = line.items.slice(1, line.items.length - 1);
          let rawDesc = descItems.map(it => it.str).join(' ').trim();

          // Ignora pagamentos de fatura anterior (ex: PAGAMENTO DEB AUTOMATIC)
          if (rawDesc.toLowerCase().includes('pagamento deb automatic') || rawDesc.toLowerCase().includes('pagamento efetuado')) {
            continue;
          }

          // Verifica se a próxima linha contém dica de categoria / localização
          let categoryHint = '';
          const nextLine = lines[i + 1];
          if (nextLine && !nextLine.items[0]?.str.match(/^(\d{2}\/\d{2})$/)) {
            const nextStr = nextLine.items.map(it => it.str).join(' ');
            if (
              !nextStr.includes('Total') &&
              !nextStr.includes('Lançamentos') &&
              !nextStr.includes('Compras parceladas') &&
              !nextStr.includes('4004')
            ) {
              categoryHint = nextStr;
            }
          }

          // Detecção de parcelamento no final da descrição (ex: "EDUCA MAIS BRA 12/12" -> parcela 12 de 12)
          let installmentNumber = null;
          let installmentCount = null;
          const instMatch = rawDesc.match(/(\d{1,2})\/(\d{1,2})$/);
          if (instMatch) {
            installmentNumber = parseInt(instMatch[1], 10);
            installmentCount = parseInt(instMatch[2], 10);
            rawDesc = rawDesc.replace(/\s*\d{1,2}\/\d{1,2}$/, '').trim();
          }

          // Limpa sufixos de cidades grudados com o nome (ex: "JUREREFLORIANO" ou "FLORIANOPOLIS")
          rawDesc = cleanEstablishmentName(rawDesc);

          // Determinação exata do ano com base na data de fechamento da fatura
          let year = new Date().getFullYear();
          if (closingDate) {
            const closingParts = closingDate.split('/');
            const closingYear = parseInt(closingParts[2], 10);
            const closingMonth = parseInt(closingParts[1], 10);
            const closingDay = parseInt(closingParts[0], 10);
            const [dDay, dMonth] = dateShort.split('/').map(Number);

            year = closingYear;
            // Se o mês da compra for maior que o mês de fechamento, a compra é do ano anterior
            if (dMonth > closingMonth || (dMonth === closingMonth && dDay > closingDay && installmentCount)) {
              year = closingYear - 1;
            }
          }

          const [dDay, dMonth] = dateShort.split('/');
          const fullIsoDate = `${year}-${dMonth.padStart(2, '0')}-${dDay.padStart(2, '0')}`;
          const dateDisplay = `${dDay.padStart(2, '0')}/${dMonth.padStart(2, '0')}/${year}`;

          // Categoria e Escopo sugeridos
          const suggestedCatId = suggestCategory(rawDesc, categoryHint, availableCategories);
          const suggestedScope = suggestScope(rawDesc, categoryHint);

          rawItems.push({
            id: `imp-item-${Date.now()}-${rawItems.length + 1}-${Math.random().toString(36).slice(2, 6)}`,
            date: fullIsoDate,
            purchaseDate: fullIsoDate,
            dueDate: dueDateIso || fullIsoDate,
            dateDisplay,
            description: rawDesc,
            amountCents,
            installmentNumber,
            installmentCount,
            categoryHint,
            categoryId: suggestedCatId,
            scope: suggestedScope,
            ownerId: defaultOwnerId,
            selected: true,
          });
        }
      }
    }
  }

  // Soma de todos os itens extraídos
  const itemsTotalCents = rawItems.reduce((acc, it) => acc + it.amountCents, 0);
  const isReconciled = totalInvoiceCents > 0 ? itemsTotalCents === totalInvoiceCents : true;

  return {
    isItau: true,
    cardholder,
    cardLast4,
    dueDate,
    dueDateIso,
    closingDate,
    totalInvoiceCents,
    itemsTotalCents,
    isReconciled,
    items: rawItems,
  };
}

/**
 * Função utilitária para limpar sufixos comuns de cidades anexados em faturas do Itaú
 */
function cleanEstablishmentName(name) {
  if (!name) return '';
  let cleaned = name.trim();

  // Remove sufixos como "FLORIANOPOLIS", "SAO PAULO", "OSASCO", "BELO HORIZONT", etc. quando anexados
  const citySuffixes = [
    /FLORIANOPOLIS$/i,
    /FLORIANOPOL$/i,
    /FLORIANO$/i,
    /FLORI$/i,
    /SAO PAULO$/i,
    /SAOPAULO$/i,
    /BELO HORIZONT$/i,
    /RIO DE JANEIR$/i,
    /OSASCO$/i,
    /LAURO DE FREI$/i
  ];

  for (const suf of citySuffixes) {
    if (cleaned.length > 8 && suf.test(cleaned)) {
      cleaned = cleaned.replace(suf, '').trim();
      break;
    }
  }

  return cleaned || name;
}
