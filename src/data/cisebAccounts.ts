import { CisebRegisteredAccount } from '../types';

export const CISEB_ACCOUNTS_STORAGE_KEY = 'ciseb_monitored_accounts_v7';

/**
 * Strong password validator:
 * - At least 10 characters
 * - Uppercase letter
 * - Lowercase letter
 * - Number
 * - Special character / symbol
 */
export function validatePasswordStrength(password: string): {
  isValid: boolean;
  hasMinLength: boolean;
  hasUpperCase: boolean;
  hasLowerCase: boolean;
  hasNumber: boolean;
  hasSpecialChar: boolean;
  score: number; // 0 to 5
} {
  const hasMinLength = password.length >= 10;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecialChar = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?~`]/.test(password);

  let score = 0;
  if (hasMinLength) score += 1;
  if (hasUpperCase) score += 1;
  if (hasLowerCase) score += 1;
  if (hasNumber) score += 1;
  if (hasSpecialChar) score += 1;

  return {
    isValid: score === 5,
    hasMinLength,
    hasUpperCase,
    hasLowerCase,
    hasNumber,
    hasSpecialChar,
    score,
  };
}

/**
 * Generate a cryptographically strong, random temporary password:
 * Minimum 14 characters, containing uppercase, lowercase, numbers, and symbols.
 * Free of predictable prefixes.
 */
export function generateSecurePassword(length = 14): string {
  const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const lower = 'abcdefghijkmnopqrstuvwxyz';
  const numbers = '23456789';
  const symbols = '!@#$%^&*()_+-=';
  const allChars = upper + lower + numbers + symbols;

  const array = new Uint32Array(length);
  if (typeof window !== 'undefined' && window.crypto) {
    window.crypto.getRandomValues(array);
  } else {
    for (let i = 0; i < length; i++) {
      array[i] = Math.floor(Math.random() * 1000000);
    }
  }

  // Ensure at least 2 of each category
  const guaranteed = [
    upper[array[0] % upper.length],
    upper[array[1] % upper.length],
    lower[array[2] % lower.length],
    lower[array[3] % lower.length],
    numbers[array[4] % numbers.length],
    numbers[array[5] % numbers.length],
    symbols[array[6] % symbols.length],
    symbols[array[7] % symbols.length],
  ];

  const rest: string[] = [];
  for (let i = 8; i < length; i++) {
    rest.push(allChars[array[i] % allChars.length]);
  }

  const combined = [...guaranteed, ...rest];
  // Fisher-Yates shuffle
  for (let i = combined.length - 1; i > 0; i--) {
    const j = array[i] % (i + 1);
    [combined[i], combined[j]] = [combined[j], combined[i]];
  }

  return combined.join('');
}

// Contas Padrão do Sistema: Monitoramento e Coordenação Geral CISEB / SEDUC-PA (Sem campo de senha em código)
export const DEFAULT_INITIAL_ACCOUNTS: CisebRegisteredAccount[] = [
  // 1. Equipe de Monitoramento CISEB
  {
    id: 'admin_monitoramento',
    nome: 'EQUIPE DE MONITORAMENTO CISEB',
    unidadeCiseb: 'CISEB - COORDENAÇÃO GERAL SEDUC/PA',
    email: 'ciseb.adm@escola.seduc.pa.gov.br',
    role: 'monitoramento',
    status: 'ativo',
    cadastradoPor: 'SEDUC-PA',
    dataCadastro: '2026-01-01',
  },

  // 2. Coordenação Geral CISEB
  {
    id: 'admin_coordenacao',
    nome: 'COORDENAÇÃO GERAL CISEB',
    unidadeCiseb: 'CISEB - COORDENAÇÃO GERAL SEDUC/PA',
    email: 'ciseb.coordenacao@escola.seduc.pa.gov.br',
    role: 'coordenador',
    status: 'ativo',
    cadastradoPor: 'SEDUC-PA',
    dataCadastro: '2026-01-01',
  }
];

export function getRegisteredAccounts(): CisebRegisteredAccount[] {
  try {
    const stored = localStorage.getItem(CISEB_ACCOUNTS_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as CisebRegisteredAccount[];
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.error('Erro ao ler contas cadastradas:', err);
  }
  return DEFAULT_INITIAL_ACCOUNTS;
}

export function saveRegisteredAccounts(accounts: CisebRegisteredAccount[]) {
  try {
    localStorage.setItem(CISEB_ACCOUNTS_STORAGE_KEY, JSON.stringify(accounts));
    import('../services/firestoreService').then(({ saveAccountToFirestore }) => {
      accounts.forEach(acc => saveAccountToFirestore(acc).catch(() => {}));
    }).catch(() => {});
  } catch (err) {
    console.error('Erro ao salvar contas cadastradas:', err);
  }
}

export function addNewAccount(newAcc: Omit<CisebRegisteredAccount, 'id' | 'dataCadastro' | 'status'>): { success: boolean; error?: string; account?: CisebRegisteredAccount } {
  const emailClean = newAcc.email.trim().toLowerCase();
  if (!emailClean.endsWith('@escola.seduc.pa.gov.br')) {
    return { success: false, error: 'O e-mail deve obrigatoriamente terminar com @escola.seduc.pa.gov.br' };
  }
  if (!newAcc.nome.trim()) {
    return { success: false, error: 'Informe o nome completo do educador.' };
  }

  const accounts = getRegisteredAccounts();
  const exists = accounts.some(a => a.email.toLowerCase() === emailClean);
  if (exists) {
    return { success: false, error: 'Este e-mail institucional já está cadastrado no sistema CISEB.' };
  }

  const created: CisebRegisteredAccount = {
    id: `acc_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    nome: newAcc.nome.trim().toUpperCase(),
    unidadeCiseb: newAcc.unidadeCiseb.trim(),
    email: emailClean,
    role: newAcc.role || 'formador',
    status: 'ativo',
    cadastradoPor: newAcc.cadastradoPor || 'Equipe de Monitoramento CISEB / SEDUC-PA',
    dataCadastro: new Date().toISOString().split('T')[0],
  };

  const updated = [created, ...accounts];
  saveRegisteredAccounts(updated);
  import('../services/firestoreService').then(({ saveAccountToFirestore }) => {
    saveAccountToFirestore(created).catch(() => {});
  }).catch(() => {});
  return { success: true, account: created };
}

export function deleteAccount(accountId: string): boolean {
  const accounts = getRegisteredAccounts();
  const filtered = accounts.filter(a => a.id !== accountId);
  if (filtered.length !== accounts.length) {
    saveRegisteredAccounts(filtered);
    import('../services/firestoreService').then(({ deleteAccountFromFirestore }) => {
      deleteAccountFromFirestore(accountId).catch(() => {});
    }).catch(() => {});
    return true;
  }
  return false;
}

export function updateAccountEmail(accountId: string, newEmail: string): boolean {
  if (!newEmail.toLowerCase().endsWith('@escola.seduc.pa.gov.br')) {
    return false;
  }
  const accounts = getRegisteredAccounts();
  const index = accounts.findIndex(a => a.id === accountId);
  if (index >= 0) {
    accounts[index].email = newEmail.toLowerCase().trim();
    saveRegisteredAccounts(accounts);
    return true;
  }
  return false;
}

export function updateAccountDetails(
  accountId: string,
  details: {
    nome?: string;
    unidadeCiseb?: string;
    email?: string;
    role?: 'formador' | 'coordenador' | 'monitoramento';
    cadastradoPor?: string;
  }
): { success: boolean; error?: string; account?: CisebRegisteredAccount } {
  const accounts = getRegisteredAccounts();
  const index = accounts.findIndex(a => a.id === accountId);
  if (index === -1) {
    return { success: false, error: 'Conta não encontrada.' };
  }

  if (details.email && !details.email.toLowerCase().endsWith('@escola.seduc.pa.gov.br')) {
    return { success: false, error: 'O e-mail deve terminar com @escola.seduc.pa.gov.br' };
  }

  if (details.email) {
    const emailConflict = accounts.find(
      a => a.id !== accountId && a.email.toLowerCase() === details.email!.toLowerCase().trim()
    );
    if (emailConflict) {
      return { success: false, error: `O e-mail ${details.email} já está em uso por outro usuário.` };
    }
  }

  const current = accounts[index];
  const updatedAccount: CisebRegisteredAccount = {
    ...current,
    nome: details.nome !== undefined ? details.nome.trim().toUpperCase() : current.nome,
    unidadeCiseb: details.unidadeCiseb !== undefined ? details.unidadeCiseb.trim() : current.unidadeCiseb,
    email: details.email !== undefined ? details.email.trim().toLowerCase() : current.email,
    role: details.role !== undefined ? details.role : current.role,
    cadastradoPor: details.cadastradoPor !== undefined ? details.cadastradoPor : current.cadastradoPor,
  };

  accounts[index] = updatedAccount;
  saveRegisteredAccounts(accounts);
  return { success: true, account: updatedAccount };
}

export async function fetchPublicAccounts(): Promise<CisebRegisteredAccount[]> {
  return getRegisteredAccounts();
}


