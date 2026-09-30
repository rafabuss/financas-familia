import * as XLSX from 'xlsx';
import { formatDateBR } from '../utils/formatters.js';
import { suggestCategory } from './reconciliationService.js';

/**
 * Sugere escopo (FAMILIAR vs PESSOAL) com base na descrição da compra
 */
export function suggestScope(description = '', categoryHint = '') {
  const combined = `${description} ${categoryHint}`.toLowerCase();
  const personalKeywords = ['xbox', 'games', 'oculos', 'óculos', 'constance', 'vestuário', 'vestuario', 'barbearia', 'salao', 'cabelo'];
  if (personalKeywords.some(kw => combined.includes(kw))) {
    return 'PERSONAL';
  }
  return 'FAMILY';
}


/**
 * Converte data serial numérica do Excel (ex: 46287) para string ISO YYYY-MM-DD
 * O Excel conta dias a partir de 1899-12-30 (considerando o bug bissexto de 1900).
 */
export function excelDateToIso(serial) {
  if (typeof serial === 'number' && !isNaN(serial)) {
    // 25569 é a diferença de dias entre 1970-01-01 e 1899-12-30
    const utcDays = Math.floor(serial - 25569);
    const date = new Date(utcDays * 86400 * 1000);
    if (!isNaN(date.getTime())) {
      return date.toISOString().slice(0, 10);
    }
  }

  if (typeof serial === 'string') {
    const trimmed = serial.trim();
    // Padrão DD/MM/YYYY
    const brMatch = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (brMatch) {
      return `${brMatch[3]}-${brMatch[2].padStart(2, '0')}-${brMatch[1].padStart(2, '0')}`;
    }
    // Padrão YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
      return trimmed;
    }
    // Fallback de data parseável
    const parsed = new Date(trimmed);
    if (!isNaN(parsed.getTime())) {
      return parsed.toISOString().slice(0, 10);
    }
  }

  return new Date().toISOString().slice(0, 10);
}

/**
 * Lê um File, Blob ou ArrayBuffer e converte para Workbook do SheetJS
 */
async function loadWorkbook(input) {
  let arrayBuffer;
  if (input instanceof ArrayBuffer) {
    arrayBuffer = input;
  } else if (input instanceof Uint8Array) {
    arrayBuffer = input.buffer;
  } else if (typeof input === 'object' && typeof input.arrayBuffer === 'function') {
    arrayBuffer = await input.arrayBuffer();
  } else {
    throw new Error('Formato de entrada inválido para leitura de arquivo Excel.');
  }

  const data = new Uint8Array(arrayBuffer);
  return XLSX.read(data, { type: 'array' });
}

/**
 * Parser Universal de Faturas e Extratos em Planilhas Excel (.xlsx, .xls)
 * Com suporte otimizado e automático para exportações do Banco Itaú (Uniclass Black, Infinite, etc.)
 * e compatibilidade com planilhas financeiras tabulares genéricas.
 *
 * @param {File|Blob|ArrayBuffer|Uint8Array} input
 * @param {Array} availableCategories - Categorias cadastradas para sugestão inteligente
 * @param {Array} familyMembers - Membros da família para atribuição de titularidade
 * @returns {Promise<Object>} Metadados da fatura/extrato e lista normalizada de lançamentos
 */
export async function parseInvoiceXlsx(input, availableCategories = [], familyMembers = []) {
  const workbook = await loadWorkbook(input);
  const firstSheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[firstSheetName];

  // Matriz de dados 2D raw
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: true, defval: '' });

  if (!rows || rows.length === 0) {
    throw new Error('A planilha está vazia ou não pôde ser interpretada.');
  }

  // Metadados extraídos
  let cardholder = '';
  let agency = '';
  let account = '';
  let periodTitle = '';
  let cardName = '';
  let cardLast4 = '';
  let dueDateIso = '';
  let dueDateBR = '';
  let totalInvoiceCents = 0;
  let isItauCardFormat = false;

  let headerRowIdx = -1;
  const colMap = {};

  // 1. Varredura do cabeçalho e identificação de formato (Itaú ou Genérico)
  for (let r = 0; r < rows.length; r++) {
    const row = rows[r];
    const rowStr = row.map(c => String(c)).join(' ').toLowerCase();

    // Detecção de marcadores Itaú
    if (headerRowIdx === -1) {
      for (let c = 0; c < row.length; c++) {
        const cell = String(row[c]).trim();
        const nextCell = row[c + 1] !== undefined ? String(row[c + 1]).trim() : '';

        if (cell === 'Nome' && nextCell && !cardholder) {
          cardholder = nextCell;
          isItauCardFormat = true;
        }
        if (cell === 'Agência' && nextCell) {
          agency = nextCell;
          isItauCardFormat = true;
        }
        if (cell === 'Conta' && nextCell) {
          account = nextCell;
          isItauCardFormat = true;
        }
        if (cell.toLowerCase().includes('fatura aberta') || cell.toLowerCase().includes('fatura fechada')) {
          periodTitle = cell;
          isItauCardFormat = true;
        }
      }

      // Detecção de resumo de cartão no Itaú:
      // Linha com colunas: Cartão | Valor (parcial) | Vencimento
      const cIdx = row.findIndex(c => String(c).trim().toLowerCase() === 'cartão');
      const vIdx = row.findIndex(c => String(c).trim().toLowerCase().includes('vencimento'));
      const valIdx = row.findIndex(c => String(c).trim().toLowerCase().includes('valor'));

      if (cIdx !== -1 && rows[r + 1]) {
        const nextRow = rows[r + 1];
        if (nextRow[cIdx]) {
          cardName = String(nextRow[cIdx]).trim();
          const matchFinal = cardName.match(/final\s*(\d{4})/i) || cardName.match(/(\d{4})$/);
          if (matchFinal) {
            cardLast4 = matchFinal[1];
          }
        }
        if (valIdx !== -1 && typeof nextRow[valIdx] === 'number') {
          totalInvoiceCents = Math.round(nextRow[valIdx] * 100);
        }
        if (vIdx !== -1) {
          dueDateIso = excelDateToIso(nextRow[vIdx]);
          dueDateBR = formatDateBR(dueDateIso);
        }
      }
    }

    // Procura pela linha de cabeçalho da tabela de lançamentos
    const hasData = row.some(c => {
      const s = String(c).trim().toLowerCase();
      return s === 'data' || s === 'date';
    });
    const hasDesc = row.some(c => {
      const s = String(c).trim().toLowerCase();
      return s === 'lançamento' || s === 'lançamentos' || s === 'descrição' || s === 'descricao' || s === 'histórico' || s === 'historico';
    });
    const hasValor = row.some(c => {
      const s = String(c).trim().toLowerCase();
      return s === 'valor' || s === 'amount' || s === 'valor (r$)';
    });

    if (hasData && (hasDesc || hasValor)) {
      headerRowIdx = r;
      row.forEach((cell, idx) => {
        const clean = String(cell).trim().toLowerCase();
        if (clean === 'data' || clean === 'date') colMap.date = idx;
        if (clean === 'lançamento' || clean === 'lançamentos' || clean === 'descrição' || clean === 'descricao' || clean === 'histórico') colMap.desc = idx;
        if (clean === 'parcelamento' || clean === 'parcela' || clean === 'parcelas') colMap.parc = idx;
        if (clean === 'valor' || clean === 'amount' || clean === 'valor (r$)') colMap.val = idx;
        if (clean === 'titularidade' || clean === 'titular') colMap.titular = idx;
        if (clean === 'nome') colMap.nome = idx;
        if (clean.includes('tipo')) colMap.tipoCartao = idx;
        if (clean.includes('número') || clean.includes('numero') || clean.includes('cartão') || clean.includes('cartao')) colMap.numCartao = idx;
        if (clean.includes('categoria')) colMap.categoria = idx;
      });
      break;
    }
  }

  // Fallback caso a tabela não tenha um cabeçalho explícito
  if (headerRowIdx === -1) {
    headerRowIdx = 0;
    colMap.date = 0;
    colMap.desc = 1;
    colMap.val = 2;
  }

  // Identificação do membro padrão da família
  let defaultOwnerId = 'user-1';
  if (cardholder && familyMembers && familyMembers.length > 0) {
    const holderLower = cardholder.toLowerCase();
    const matchedMember = familyMembers.find(m => {
      const mName = m.name.toLowerCase();
      return (
        m.id !== 'user-all' &&
        m.id !== 'family-shared' &&
        holderLower.includes(mName.split(' ')[0])
      );
    });
    if (matchedMember) defaultOwnerId = matchedMember.id;
  }

  const items = [];
  const todayStr = new Date().toISOString().slice(0, 10);
  const defaultStatus = dueDateIso && dueDateIso >= todayStr ? 'COMPROMETIDO' : 'REALIZADO';

  // 2. Extração dos lançamentos da tabela
  for (let r = headerRowIdx + 1; r < rows.length; r++) {
    const row = rows[r];
    if (!row || row.length === 0) continue;

    const descCell = String(row[colMap.desc] !== undefined ? row[colMap.desc] : '').trim();
    const valRaw = row[colMap.val];
    const dateCell = row[colMap.date];

    // Condições de parada de rodapé
    const lowerDesc = descCell.toLowerCase();
    const lowerDate = String(dateCell).toLowerCase();
    if (lowerDesc.includes('subtotal') || lowerDesc.includes('total geral') || lowerDate.includes('importante saber')) {
      break;
    }

    if (!descCell && valRaw === undefined) continue;

    // Ignora lançamentos de pagamento da fatura anterior (já abatidos do extrato)
    if (
      lowerDesc.includes('pagamento debito automatico') ||
      lowerDesc.includes('pagamento débito automático') ||
      lowerDesc.includes('pagamento de fatura') ||
      lowerDesc.includes('pagamento efetuado') ||
      lowerDesc.includes('crédito concedido')
    ) {
      continue;
    }

    // Normalização do valor
    let numVal = 0;
    if (typeof valRaw === 'number') {
      numVal = valRaw;
    } else if (typeof valRaw === 'string') {
      const cleaned = valRaw
        .replace(/R\$/g, '')
        .replace(/\s/g, '')
        .replace(/\./g, '')
        .replace(',', '.');
      numVal = parseFloat(cleaned);
    }

    if (isNaN(numVal) || numVal === 0) continue;

    // Normalização da data
    const dateIso = excelDateToIso(dateCell);
    const dateDisplay = formatDateBR(dateIso);

    // Detecção de parcelas
    let installmentNumber = null;
    let installmentCount = null;
    let cleanDesc = descCell;

    const parcStr = colMap.parc !== undefined ? String(row[colMap.parc] || '').trim() : '';
    const parcMatch =
      parcStr.match(/(\d{1,2})\s*(?:de|\/)\s*(\d{1,2})/i) ||
      descCell.match(/Parcela\s+(\d{1,2})\s+de\s+(\d{1,2})/i) ||
      descCell.match(/(\d{1,2})\/(\d{1,2})$/);

    if (parcMatch) {
      installmentNumber = parseInt(parcMatch[1], 10);
      installmentCount = parseInt(parcMatch[2], 10);
      cleanDesc = cleanDesc
        .replace(/Parcela\s+\d{1,2}\s+de\s+\d{1,2}/i, '')
        .replace(/\s*\d{1,2}\/\d{1,2}$/, '')
        .trim();
    }

    // Cartão específico do item (se houver cartão adicional ou virtual)
    let itemCardLast4 = cardLast4;
    if (colMap.numCartao !== undefined && row[colMap.numCartao]) {
      const cStr = String(row[colMap.numCartao]).replace(/[^0-9]/g, '');
      if (cStr.length >= 4) {
        itemCardLast4 = cStr.slice(-4);
      }
    }

    // Titular da compra no item
    let itemOwnerId = defaultOwnerId;
    if (colMap.nome !== undefined && row[colMap.nome]) {
      const rowName = String(row[colMap.nome]).trim().toLowerCase();
      const matched = familyMembers.find(m => {
        const mName = m.name.toLowerCase();
        return (
          m.id !== 'user-all' &&
          m.id !== 'family-shared' &&
          rowName.includes(mName.split(' ')[0])
        );
      });
      if (matched) itemOwnerId = matched.id;
    }

    const amountCents = Math.round(Math.abs(numVal) * 100);
    const categoryHint = colMap.categoria !== undefined ? String(row[colMap.categoria] || '') : '';
    const suggestedCatId = suggestCategory(cleanDesc, categoryHint, availableCategories);
    const suggestedScope = suggestScope(cleanDesc, categoryHint);

    items.push({
      id: `imp-xlsx-${Date.now()}-${items.length + 1}-${Math.random().toString(36).slice(2, 6)}`,
      date: dueDateIso || dateIso,
      purchaseDate: dateIso,
      dueDate: dueDateIso || dateIso,
      dateDisplay,
      description: cleanDesc,
      originalDescription: descCell,
      amountCents,
      rawAmount: numVal,
      type: 'EXPENSE',
      status: defaultStatus,
      installmentNumber,
      installmentCount,
      cardLast4: itemCardLast4 || cardLast4,
      cardType: colMap.tipoCartao !== undefined ? String(row[colMap.tipoCartao] || '') : '',
      categoryId: suggestedCatId,
      scope: suggestedScope,
      ownerId: itemOwnerId,
      selected: true,
    });
  }

  // Se não foi extraído total geral do cabeçalho, soma os lançamentos
  if (!totalInvoiceCents) {
    totalInvoiceCents = items.reduce((sum, it) => sum + it.amountCents, 0);
  }

  const institution = isItauCardFormat ? 'Itaú Uniclass' : 'Planilha Excel';

  return {
    sourceType: 'CARD',
    fileType: 'XLSX',
    institution,
    bankId: isItauCardFormat ? '0341' : '',
    agency,
    account,
    cardholder: cardholder || (familyMembers[0]?.name || 'Titular'),
    cardName: cardName || (cardLast4 ? `Cartão Itaú final ${cardLast4}` : 'Cartão de Crédito'),
    cardLast4,
    periodTitle,
    dueDate: dueDateBR,
    dueDateIso,
    totalInvoiceCents,
    totalItems: items.length,
    items,
    transactions: items, // Compatibilidade com reconciliação
  };
}
