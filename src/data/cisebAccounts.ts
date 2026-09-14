import { CisebRegisteredAccount } from '../types';
import { findEscolaByNameOrUnit } from '../services/escolasService';

export const CISEB_ACCOUNTS_STORAGE_KEY = 'ciseb_monitored_accounts_v8';

/**
 * Conta Padrão do Sistema: Monitoramento Central CISEB / SEDUC-PA (Sem senhas)
 * A conta legada admin_coordenacao foi removida conforme auditoria oficial.
 */
export const DEFAULT_INITIAL_ACCOUNTS: CisebRegisteredAccount[] = [
  {
    id: 'admin_monitoramento',
    nome: 'EQUIPE DE MONITORAMENTO CISEB',
    escolaId: 'ciseb-coordenacao-geral',
    unidadeCiseb: 'CISEB - COORDENAÇÃO GERAL SEDUC/PA',
    email: 'ciseb.adm@escola.seduc.pa.gov.br',
    role: 'monitoramento',
    status: 'ativo',
    cadastradoPor: 'SEDUC-PA',
    dataCadastro: '2026-01-01',
  },
];

/**
 * Recupera as contas cadastradas com migração automática para escolaId
 * e expurgo de contas legadas não autorizadas.
 */
export function getRegisteredAccounts(): CisebRegisteredAccount[] {
  try {
    const stored = localStorage.getItem(CISEB_ACCOUNTS_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as CisebRegisteredAccount[];
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Filtra admin_coordenacao e garante escolaId em todos os registros
        const migrated = parsed
          .filter((a) => a.id !== 'admin_coordenacao' && a.email !== 'ciseb.coordenacao@escola.seduc.pa.gov.br')
          .map((a) => {
            if (!a.escolaId) {
              const esc = findEscolaByNameOrUnit(a.unidadeCiseb || '');
              return {
                ...a,
                escolaId: esc.id,
                unidadeCiseb: esc.nome,
              };
            }
            return a;
          });
        return migrated;
      }
    }
  } catch (err) {
    console.error('[CisebAccounts] Erro ao ler contas cadastradas:', err);
  }
  return DEFAULT_INITIAL_ACCOUNTS;
}

export function saveRegisteredAccounts(accounts: CisebRegisteredAccount[]) {
  try {
    const sanitized = accounts
      .filter((a) => a.id !== 'admin_coordenacao' && a.email !== 'ciseb.coordenacao@escola.seduc.pa.gov.br')
      .map((a) => {
        if (!a.escolaId) {
          const esc = findEscolaByNameOrUnit(a.unidadeCiseb || '');
          return { ...a, escolaId: esc.id, unidadeCiseb: esc.nome };
        }
        return a;
      });

    localStorage.setItem(CISEB_ACCOUNTS_STORAGE_KEY, JSON.stringify(sanitized));
    import('../services/firestoreService')
      .then(({ saveAccountToFirestore }) => {
        sanitized.forEach((acc) => saveAccountToFirestore(acc).catch(() => {}));
      })
      .catch(() => {});
  } catch (err) {
    console.error('[CisebAccounts] Erro ao salvar contas cadastradas:', err);
  }
}

export function addNewAccount(
  newAcc: Omit<CisebRegisteredAccount, 'id' | 'dataCadastro' | 'status'> & { escolaId?: string }
): { success: boolean; error?: string; account?: CisebRegisteredAccount } {
  const emailClean = newAcc.email.trim().toLowerCase();
  if (!emailClean.endsWith('@escola.seduc.pa.gov.br') && !emailClean.endsWith('@seduc.pa.gov.br')) {
    return { success: false, error: 'O e-mail deve pertencer ao domínio institucional da SEDUC/PA.' };
  }
  if (!newAcc.nome.trim()) {
    return { success: false, error: 'Informe o nome completo do educador.' };
  }

  const accounts = getRegisteredAccounts();
  const exists = accounts.some((a) => a.email.toLowerCase() === emailClean);
  if (exists) {
    return { success: false, error: 'Este e-mail institucional já está cadastrado no sistema CISEB.' };
  }

  const escola = findEscolaByNameOrUnit(newAcc.escolaId || newAcc.unidadeCiseb);

  const created: CisebRegisteredAccount = {
    id: `acc_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    nome: newAcc.nome.trim().toUpperCase(),
    escolaId: escola.id,
    unidadeCiseb: escola.nome,
    email: emailClean,
    role: newAcc.role || 'formador',
    status: 'ativo',
    cadastradoPor: newAcc.cadastradoPor || 'Equipe de Monitoramento CISEB / SEDUC-PA',
    dataCadastro: new Date().toISOString().split('T')[0],
  };

  const updated = [created, ...accounts];
  saveRegisteredAccounts(updated);
  import('../services/firestoreService')
    .then(({ saveAccountToFirestore }) => {
      saveAccountToFirestore(created).catch(() => {});
    })
    .catch(() => {});
  return { success: true, account: created };
}

export function deleteAccount(accountId: string): boolean {
  const accounts = getRegisteredAccounts();
  const filtered = accounts.filter((a) => a.id !== accountId);
  if (filtered.length !== accounts.length) {
    saveRegisteredAccounts(filtered);
    import('../services/firestoreService')
      .then(({ deleteAccountFromFirestore }) => {
        deleteAccountFromFirestore(accountId).catch(() => {});
      })
      .catch(() => {});
    return true;
  }
  return false;
}

export function updateAccountEmail(accountId: string, newEmail: string): boolean {
  if (!newEmail.toLowerCase().endsWith('@escola.seduc.pa.gov.br') && !newEmail.toLowerCase().endsWith('@seduc.pa.gov.br')) {
    return false;
  }
  const accounts = getRegisteredAccounts();
  const index = accounts.findIndex((a) => a.id === accountId);
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
    escolaId?: string;
    unidadeCiseb?: string;
    email?: string;
    role?: 'formador' | 'coordenador' | 'monitoramento';
    cadastradoPor?: string;
  }
): { success: boolean; error?: string; account?: CisebRegisteredAccount } {
  const accounts = getRegisteredAccounts();
  const index = accounts.findIndex((a) => a.id === accountId);
  if (index === -1) {
    return { success: false, error: 'Conta não encontrada.' };
  }

  if (details.email && !details.email.toLowerCase().endsWith('@escola.seduc.pa.gov.br') && !details.email.toLowerCase().endsWith('@seduc.pa.gov.br')) {
    return { success: false, error: 'O e-mail deve pertencer ao domínio institucional da SEDUC/PA.' };
  }

  if (details.email) {
    const emailConflict = accounts.find(
      (a) => a.id !== accountId && a.email.toLowerCase() === details.email!.toLowerCase().trim()
    );
    if (emailConflict) {
      return { success: false, error: `O e-mail ${details.email} já está em uso por outro usuário.` };
    }
  }

  const current = accounts[index];
  let finalEscolaId = current.escolaId;
  let finalUnidadeCiseb = current.unidadeCiseb;

  if (details.escolaId) {
    const esc = findEscolaByNameOrUnit(details.escolaId);
    finalEscolaId = esc.id;
    finalUnidadeCiseb = esc.nome;
  } else if (details.unidadeCiseb) {
    const esc = findEscolaByNameOrUnit(details.unidadeCiseb);
    finalEscolaId = esc.id;
    finalUnidadeCiseb = esc.nome;
  }

  const updatedAccount: CisebRegisteredAccount = {
    ...current,
    nome: details.nome !== undefined ? details.nome.trim().toUpperCase() : current.nome,
    escolaId: finalEscolaId,
    unidadeCiseb: finalUnidadeCiseb,
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

export interface PasswordValidationResult {
  isValid: boolean;
  score: number;
  hasMinLength: boolean;
  hasUpperCase: boolean;
  hasLowerCase: boolean;
  hasNumber: boolean;
  hasSpecialChar: boolean;
  message?: string;
}

export function validatePasswordStrength(password: string): PasswordValidationResult {
  const hasMinLength = password.length >= 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecialChar = /[^A-Za-z0-9]/.test(password);

  let score = 0;
  if (hasMinLength) score++;
  if (hasUpperCase) score++;
  if (hasLowerCase) score++;
  if (hasNumber) score++;
  if (hasSpecialChar) score++;

  return {
    isValid: score >= 4,
    score,
    hasMinLength,
    hasUpperCase,
    hasLowerCase,
    hasNumber,
    hasSpecialChar,
    message: score >= 4 ? 'Senha segura' : 'A senha precisa atender aos critérios mínimos',
  };
}
