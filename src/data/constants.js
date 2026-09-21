// Usuários da Família e Visões
export const FAMILY_MEMBERS = [
  { id: 'user-all', name: '👑 Visão Admin (Toda a Família)', isFamily: true },
  { id: 'family-shared', name: '🏠 Gastos Compartilhados (Família)', isFamily: true },
  { id: 'user-1', name: '👤 Rafael (Apenas Pessoal / Membro)', isFamily: false },
  { id: 'user-2', name: '👤 Ana Débora (Apenas Pessoal / Membro)', isFamily: false },
];

// Categorias Padrão Essenciais do Sistema
export const DEFAULT_CATEGORIES = [
  { id: 'cat-1', name: 'Salário & Dividendos', type: 'INCOME', color: '#16a34a', archived: false },
  { id: 'cat-2', name: 'Renda Extra & Consultoria', type: 'INCOME', color: '#0d9488', archived: false },
  { id: 'cat-3', name: 'Moradia (Aluguel/Condomínio)', type: 'EXPENSE', color: '#2563eb', archived: false },
  { id: 'cat-4', name: 'Supermercado & Feira', type: 'EXPENSE', color: '#d97706', archived: false },
  { id: 'cat-5', name: 'Educação & Cursos', type: 'EXPENSE', color: '#7c3aed', archived: false },
  { id: 'cat-6', name: 'Saúde & Farmácia', type: 'EXPENSE', color: '#e11d48', archived: false },
  { id: 'cat-7', name: 'Lazer & Restaurantes', type: 'EXPENSE', color: '#0284c7', archived: false },
  { id: 'cat-8', name: 'Transporte & Combustível', type: 'EXPENSE', color: '#475569', archived: false },
];
