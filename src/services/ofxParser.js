/**
 * Universal Client-Side OFX Parser
 * Suporte a Extratos Bancários (<BANKTRANLIST>) e Faturas de Cartão (<CCSTMTTRN> / <CREDITCARDMSGSRSV1>)
 * Decodificação 100% no navegador (privacidade total)
 * Compatível com OFX 1.02/1.6 (SGML) e OFX 2.0 (XML) dos principais bancos brasileiros
 * (Nubank, Inter, Itaú, Banco do Brasil, Bradesco, Santander, C6 Bank, Caixa, XP, BTG, etc.)
 */

import { formatDateBR } from '../utils/formatters.js';

/**
 * Extrai o valor de uma tag tanto no formato XML (<TAG>val</TAG>) quanto SGML (<TAG>val\n)
 */
function extractTag(content, tag) {
  if (!content) return null;
  // 1. Padrão XML com tag de fechamento
  const xmlPattern = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i');
  const xmlMatch = content.match(xmlPattern);
  if (xmlMatch) return xmlMatch[1].trim();

  // 2. Padrão SGML (OFX 1.x) onde a tag não é fechada
  const sgmlPattern = new RegExp(`<${tag}>([^<\\r\\n]+)`, 'i');
  const sgmlMatch = content.match(sgmlPattern);
  if (sgmlMatch) return sgmlMatch[1].trim();

  return null;
}

/**
 * Converte data no formato OFX (ex: 20260915120000[-03:BRT] ou 20260915) para ISO YYYY-MM-DD
 */
export function parseOfxDate(dateStr) {
  if (!dateStr) return new Date().toISOString().slice(0, 10);
  const cleaned = String(dateStr).trim().replace(/[^0-9]/g, '');
  if (cleaned.length >= 8) {
    const y = cleaned.substring(0, 4);
    const m = cleaned.substring(4, 6);
    const d = cleaned.substring(6, 8);
    // Validação básica de limites
    const numY = parseInt(y, 10);
    const numM = parseInt(m, 10);
    const numD = parseInt(d, 10);
    if (numY >= 2000 && numY <= 2100 && numM >= 1 && numM <= 12 && numD >= 1 && numD <= 31) {
      return `${y}-${m}-${d}`;
    }
  }
  return new Date().toISOString().slice(0, 10);
}

/**
 * Decodifica entidades HTML ou caracteres especiais do texto
 */
function decodeOfxText(text) {
  if (!text) return '';
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Lê um File ou Blob com detecção de encoding (UTF-8 vs ISO-8859-1 / Windows-1252)
 */
export async function readOfxFileAsText(fileOrBlob) {
  if (typeof fileOrBlob === 'string') {
    return fileOrBlob;
  }

  const arrayBuffer = await fileOrBlob.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);

  // Decodifica primeiro como UTF-8
  const utf8Decoder = new TextDecoder('utf-8', { fatal: false });
  const utf8Text = utf8Decoder.decode(bytes);

  // Verifica o header de CHARSET do OFX
  const charsetMatch = utf8Text.match(/CHARSET\s*:\s*([^\r\n]+)/i);
  const encodingMatch = utf8Text.match(/ENCODING\s*:\s*([^\r\n]+)/i);
  const charset = (charsetMatch ? charsetMatch[1] : '').toUpperCase().trim();
  const encoding = (encodingMatch ? encodingMatch[1] : '').toUpperCase().trim();

  // Se indicar 1252, ISO-8859-1 ou se tiver caracteres de substituição comuns de charset latino
  if (
    charset.includes('1252') ||
    charset.includes('ISO') ||
    encoding.includes('1252') ||
    encoding.includes('ISO') ||
    utf8Text.includes('')
  ) {
    try {
      const latinDecoder = new TextDecoder('iso-8859-1');
      return latinDecoder.decode(bytes);
    } catch {
      return utf8Text;
    }
  }

  return utf8Text;
}

/**
 * Parser Universal de arquivo OFX
 * @param {string|File|Blob} input - Conteúdo de texto do OFX ou File/Blob
 * @returns {Promise<Object>} Resultado estruturado com metadados e lista de transações
 */
export async function parseOfx(input) {
  const content = await readOfxFileAsText(input);

  // 1. Identificação do Tipo de OFX: Cartão de Crédito vs Extrato Bancário
  const isCreditCard =
    /<CREDITCARDMSGSRSV1>/i.test(content) ||
    /<CCSTMTTRNRS>/i.test(content) ||
    /<CCSTMTRS>/i.test(content) ||
    /<CCACCTFROM>/i.test(content);

  // 2. Extração de Metadados da Instituição e Conta
  const org = extractTag(content, 'ORG') || '';
  const fid = extractTag(content, 'FID') || '';
  const bankId = extractTag(content, 'BANKID') || '';
  const branchId = extractTag(content, 'BRANCHID') || '';
  const acctId = extractTag(content, 'ACCTID') || '';
  const acctType = extractTag(content, 'ACCTTYPE') || (isCreditCard ? 'CREDITCARD' : 'CHECKING');
  const currency = extractTag(content, 'CURDEF') || 'BRL';

  // Período do extrato
  const dtStartRaw = extractTag(content, 'DTSTART');
  const dtEndRaw = extractTag(content, 'DTEND');
  const startDate = dtStartRaw ? parseOfxDate(dtStartRaw) : null;
  const endDate = dtEndRaw ? parseOfxDate(dtEndRaw) : null;

  // Saldo informado no arquivo
  const ledgerBalAmtRaw = extractTag(content, 'BALAMT');
  let ledgerBalanceCents = null;
  if (ledgerBalAmtRaw !== null) {
    const balNum = parseFloat(ledgerBalAmtRaw.replace(',', '.'));
    if (!isNaN(balNum)) {
      ledgerBalanceCents = Math.round(balNum * 100);
    }
  }
  const dtAsOfRaw = extractTag(content, 'DTASOF');
  const balanceDate = dtAsOfRaw ? parseOfxDate(dtAsOfRaw) : null;

  // 3. Extração das Transações (<STMTTRN>)
  // Divide pelas tags <STMTTRN> (compatível com SGML e XML)
  const rawBlocks = content.split(/<STMTTRN>/i);
  const blocks = rawBlocks.slice(1);

  const transactions = [];

  blocks.forEach((block, index) => {
    // Isola o bloco até o fechamento </STMTTRN> se for XML
    const endXmlIdx = block.search(/<\/STMTTRN>/i);
    const cleanBlock = endXmlIdx !== -1 ? block.substring(0, endXmlIdx) : block;

    const trnType = (extractTag(cleanBlock, 'TRNTYPE') || 'OTHER').toUpperCase();
    const dtPostedRaw = extractTag(cleanBlock, 'DTPOSTED');
    const trnAmtRaw = extractTag(cleanBlock, 'TRNAMT');
    const fitIdRaw = extractTag(cleanBlock, 'FITID') || '';
    const checkNum = extractTag(cleanBlock, 'CHECKNUM') || extractTag(cleanBlock, 'REFNUM') || '';
    const memo = decodeOfxText(extractTag(cleanBlock, 'MEMO') || '');
    const name = decodeOfxText(extractTag(cleanBlock, 'NAME') || '');

    if (!trnAmtRaw) return;

    // Normalização do valor monetário
    const rawVal = parseFloat(trnAmtRaw.replace(',', '.'));
    if (isNaN(rawVal) || rawVal === 0) return;

    const amountCents = Math.round(Math.abs(rawVal) * 100);

    // Formatação de data
    const dateIso = parseOfxDate(dtPostedRaw);
    const dateDisplay = formatDateBR(dateIso);

    // Construção da melhor descrição
    let description = '';
    if (name && memo && name !== memo) {
      // Se memo complementa name (ex: Nubank: name="Transferência enviada", memo="Rafael")
      description = `${name} - ${memo}`;
    } else {
      description = memo || name || `Lançamento ${index + 1}`;
    }

    // Determina se é despesa ou receita
    // Em extrato de conta corrente: negativo = débito/despesa, positivo = crédito/receita
    // Em cartão de crédito: débitos são compras (EXPENSE), pagamentos/estornos são créditos
    let type = 'EXPENSE';
    if (isCreditCard) {
      if (trnType === 'CREDIT' || rawVal > 0) {
        // Se a descrição for claramente pagamento de fatura ou estorno
        if (/pagamento|pgto|estorno|reembolso|credito/i.test(description)) {
          type = 'INCOME';
        } else {
          // Alguns bancos invertem sinais em cartão, mantemos EXPENSE por padrão se for débito
          type = rawVal > 0 && trnType !== 'DEBIT' ? 'INCOME' : 'EXPENSE';
        }
      } else {
        type = 'EXPENSE';
      }
    } else {
      if (rawVal > 0 || trnType === 'CREDIT') {
        type = 'INCOME';
      } else {
        type = 'EXPENSE';
      }
    }

    // Detecta parcelamento na descrição se houver (ex: "LOJA XPTO 02/10" ou "(02/10)")
    let installmentNumber = null;
    let installmentCount = null;
    const instMatch = description.match(/(\d{1,2})\s*[\/|\\]\s*(\d{1,2})/);
    if (instMatch) {
      const cur = parseInt(instMatch[1], 10);
      const tot = parseInt(instMatch[2], 10);
      if (cur > 0 && tot > 1 && cur <= tot && tot <= 60) {
        installmentNumber = cur;
        installmentCount = tot;
      }
    }

    const fitId = fitIdRaw || `ofx-${dateIso}-${amountCents}-${index}`;

    transactions.push({
      id: `imp-ofx-${Date.now()}-${index}-${Math.random().toString(36).slice(2, 6)}`,
      fitId,
      type, // 'EXPENSE' | 'INCOME'
      trnType, // 'DEBIT' | 'CREDIT' | 'OTHER'
      date: dateIso,
      dateDisplay,
      purchaseDate: dateIso,
      amountCents,
      rawAmount: rawVal,
      description,
      originalDescription: description,
      memo,
      name,
      checkNum,
      installmentNumber,
      installmentCount,
    });
  });

  // Ordena por data decrescente
  transactions.sort((a, b) => b.date.localeCompare(a.date));

  return {
    sourceType: isCreditCard ? 'CARD' : 'ACCOUNT',
    institution: org || (bankId ? `Banco (${bankId})` : 'Instituição Financeira'),
    bankId,
    branchId,
    acctId,
    acctType,
    currency,
    startDate,
    endDate,
    ledgerBalanceCents,
    balanceDate,
    totalTransactionsCount: transactions.length,
    totalExpensesCents: transactions
      .filter((t) => t.type === 'EXPENSE')
      .reduce((acc, t) => acc + t.amountCents, 0),
    totalIncomesCents: transactions
      .filter((t) => t.type === 'INCOME')
      .reduce((acc, t) => acc + t.amountCents, 0),
    transactions,
  };
}
