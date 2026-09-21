// Formatação Monetária Segura (em Centavos) com suporte a Modo Privacidade ("Olho Mágico")
let _globalPrivacyActive = false;

export const setGlobalPrivacyActive = (val) => {
  _globalPrivacyActive = Boolean(val);
};

export const getGlobalPrivacyActive = () => _globalPrivacyActive;

export const formatMoney = (cents = 0, bypassPrivacy = false) => {
  if (_globalPrivacyActive && !bypassPrivacy) {
    return 'R$ •••••';
  }
  return (cents / 100).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
};

// Formatação de Data Segura no padrão brasileiro (dd/mm/aaaa) sem deslocamento de fuso horário
export const formatDateBR = (dateStr) => {
  if (!dateStr) return '';
  if (typeof dateStr !== 'string') return String(dateStr);
  const clean = dateStr.trim().slice(0, 10);
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(clean)) return clean;
  const parts = clean.split('-');
  if (parts.length === 3) {
    const [y, m, d] = parts;
    if (y && m && d && y.length === 4) {
      return `${d.padStart(2, '0')}/${m.padStart(2, '0')}/${y}`;
    }
  }
  return dateStr;
};

// Formatação amigável de Mês (YYYY-MM -> "março de 2026")
export const formatMonthLabel = (yearMonthStr) => {
  try {
    if (!yearMonthStr) return '';
    const [y, m] = yearMonthStr.split('-');
    const d = new Date(parseInt(y, 10), parseInt(m, 10) - 1, 1);
    return d.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  } catch {
    return yearMonthStr;
  }
};

// Cálculo inteligente do vencimento da fatura do cartão a partir da data da compra e datas de corte
export const calculateCardDueDate = (dateStr, closingDay = 1, dueDay = 10) => {
  if (!dateStr || typeof dateStr !== 'string') return dateStr;
  const clean = dateStr.trim().slice(0, 10);
  const parts = clean.split('-');
  if (parts.length !== 3) return dateStr;

  let year = parseInt(parts[0], 10);
  let month = parseInt(parts[1], 10);
  const day = parseInt(parts[2], 10);

  const safeClosing = Math.min(Math.max(closingDay || 1, 1), 28);
  const safeDue = Math.min(Math.max(dueDay || 10, 1), 28);

  let monthsToAdd = 0;
  if (safeDue < safeClosing) {
    // Ex: Fecha dia 28, vence dia 10 do mês seguinte
    monthsToAdd = day > safeClosing ? 2 : 1;
  } else {
    // Ex: Fecha dia 1, vence dia 10 do mesmo mês
    monthsToAdd = day > safeClosing ? 1 : 0;
  }

  month += monthsToAdd;
  while (month > 12) {
    month -= 12;
    year += 1;
  }

  return `${year}-${String(month).padStart(2, '0')}-${String(safeDue).padStart(2, '0')}`;
};

// Adiciona N meses a uma data ISO YYYY-MM-DD mantendo o dia seguro (máx 28 para fev/outros)
export const addMonthsToIso = (isoDateStr, monthsToAdd) => {
  if (!isoDateStr || typeof isoDateStr !== 'string') return isoDateStr;
  const parts = isoDateStr.trim().slice(0, 10).split('-');
  if (parts.length !== 3) return isoDateStr;
  const y = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10);
  const d = parseInt(parts[2], 10);
  const target = new Date(y, m - 1 + monthsToAdd, Math.min(d, 28));
  const newY = target.getFullYear();
  const newM = String(target.getMonth() + 1).padStart(2, '0');
  const newD = String(target.getDate()).padStart(2, '0');
  return `${newY}-${newM}-${newD}`;
};

// Retorna a data efetiva de vencimento financeiro de um lançamento (usada para fluxo de caixa, mês e atrasos)
export const getTxDueDate = (tx, cards = []) => {
  if (!tx) return '';
  if (tx.dueDate) return tx.dueDate;
  if (tx.cardId && tx.purchaseDate && tx.purchaseDate !== tx.date) {
    const card = cards.find((c) => c.id === tx.cardId);
    if (card && card.closingDay && card.dueDay) {
      return calculateCardDueDate(tx.purchaseDate, card.closingDay, card.dueDay);
    }
  }
  return tx.date;
};

// Verifica se um lançamento está de fato em atraso (comprometido com vencimento anterior a hoje)
export const isTxOverdue = (tx, cards = [], todayStr = new Date().toISOString().slice(0, 10)) => {
  if (!tx || tx.isHypothetical) return false;
  if (tx.isInvoiceMaster) {
    return tx.status === 'EM ATRASO' || (!tx.isPaid && Boolean(tx.dueDate && tx.dueDate < todayStr));
  }
  // Compras em cartão de crédito pertencem à fatura do cartão (cardInvoiceMaster), não são contas avulsas de débito em conta
  if (tx.cardId) return false;
  if (tx.status !== 'COMPROMETIDO') return false;
  const dueDate = getTxDueDate(tx, cards);
  return Boolean(dueDate && dueDate < todayStr);
};
