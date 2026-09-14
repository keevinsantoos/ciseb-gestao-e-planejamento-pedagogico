import {
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  updateProfile,
  User as FirebaseUser,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  collection,
  query,
  where,
  getDocs,
} from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { AuthUser, CisebRegisteredAccount } from '../types';
import {
  getRegisteredAccounts,
  DEFAULT_INITIAL_ACCOUNTS,
  CISEB_ACCOUNTS_STORAGE_KEY,
} from '../data/cisebAccounts';
import { findEscolaByNameOrUnit, CANONICAL_ESCOLAS } from './escolasService';
import { safeJsonFetch } from '../lib/apiUtils';

export const ACCOUNTS_COLLECTION = 'accounts';
export const AUTH_STORAGE_KEY = 'ciseb_auth_user_v1';

/**
 * Mensagens amigáveis de autenticação Firebase / Google
 */
export function getFriendlyAuthErrorMessage(error: any): string {
  const code = error?.code || '';
  switch (code) {
    case 'auth/popup-closed-by-user':
      return 'A janela de autenticação Google foi fechada antes de concluir o acesso.';
    case 'auth/cancelled-popup-request':
      return 'Solicitação de autenticação cancelada.';
    case 'auth/popup-blocked':
      return 'A janela pop-up do Google foi bloqueada pelo navegador. Permita pop-ups para este site.';
    case 'auth/user-disabled':
      return 'Esta conta institucional foi desativada pelo monitoramento central do CISEB.';
    case 'auth/network-request-failed':
      return 'Erro de conexão com o servidor. Verifique sua conexão à internet.';
    case 'auth/unauthorized-domain':
      return 'Domínio não autorizado no Firebase Console para autenticação Google.';
    default:
      return error?.message || 'Ocorreu um erro na autenticação institucional. Tente novamente.';
  }
}

/**
 * Autenticação via Credencial Google (Pop-up Institucional SEDUC)
 */
export async function signInGoogleCredential(): Promise<{
  fbUser: FirebaseUser;
  profile: AuthUser | null;
}> {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({
    prompt: 'select_account',
  });

  const userCredential = await signInWithPopup(auth, provider);
  const fbUser = userCredential.user;
  const cleanEmail = (fbUser.email || '').trim().toLowerCase();

  const profile = await fetchUserProfile(fbUser.uid, cleanEmail);
  return { fbUser, profile };
}

/**
 * Login Exclusivo Google CISEB com Vínculo Automático à Escola (Zero-Trust)
 * O professor NÃO escolhe nem altera sua escola: o Firestore é a fonte oficial da verdade.
 */
export async function loginWithGoogle(): Promise<AuthUser> {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({
    prompt: 'select_account',
  });

  const userCredential = await signInWithPopup(auth, provider);
  const fbUser = userCredential.user;
  const cleanEmail = (fbUser.email || '').trim().toLowerCase();

  // Validação estrita de domínio institucional SEDUC/PA
  if (!cleanEmail.endsWith('@escola.seduc.pa.gov.br') && !cleanEmail.endsWith('@seduc.pa.gov.br')) {
    await signOut(auth);
    throw new Error('Acesso exclusivo: utilize sua conta Google institucional da SEDUC (@escola.seduc.pa.gov.br ou @seduc.pa.gov.br).');
  }

  // Busca ou cria o perfil oficial vinculado à escola no Firestore
  const profile = await fetchOrCreateGoogleUserProfile(fbUser);
  return profile;
}

/**
 * Localiza a conta do professor no Firestore ou estabelece o vínculo automático oficial
 */
export async function fetchOrCreateGoogleUserProfile(fbUser: FirebaseUser): Promise<AuthUser> {
  const cleanEmail = (fbUser.email || '').trim().toLowerCase();
  const cleanNome = (fbUser.displayName || cleanEmail.split('@')[0]).trim().toUpperCase();

  // Tratamento prioritário para o administrador oficial de monitoramento
  const isOfficialAdmin = cleanEmail === 'ciseb.adm@escola.seduc.pa.gov.br';

  let accountData: CisebRegisteredAccount | null = null;
  let preRegDocId: string | null = null;

  // 1. Consulta o Firestore pelo UID real do Firebase Auth
  try {
    const docRef = doc(db, ACCOUNTS_COLLECTION, fbUser.uid);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      accountData = snap.data() as CisebRegisteredAccount;
    }
  } catch (err) {
    console.warn('[AuthService] Aviso ao buscar conta por UID:', err);
  }

  // 2. Se não encontrou por UID, busca no Firestore por e-mail (cadastro prévio pelo administrador)
  if (!accountData && !isOfficialAdmin) {
    try {
      const colRef = collection(db, ACCOUNTS_COLLECTION);
      const qEmail = query(colRef, where('email', '==', cleanEmail));
      const snapEmail = await getDocs(qEmail);
      if (!snapEmail.empty) {
        const foundDoc = snapEmail.docs[0];
        preRegDocId = foundDoc.id;
        accountData = foundDoc.data() as CisebRegisteredAccount;
      }
    } catch (err) {
      console.warn('[AuthService] Aviso ao buscar conta por e-mail no Firestore:', err);
    }
  }

  // 3. Se ainda não encontrou no Firestore, verifica a lista inicial oficial de migração
  if (!accountData && !isOfficialAdmin) {
    const allRegistered = getRegisteredAccounts();
    const foundByEmail = allRegistered.find(
      (a) => a.email.toLowerCase() === cleanEmail
    );
    if (foundByEmail) {
      accountData = foundByEmail;
    }
  }

  // 4. Se não houver cadastro prévio e não for o admin oficial: bloqueia o acesso
  if (!accountData && !isOfficialAdmin) {
    await signOut(auth);
    throw new Error(
      `Acesso não autorizado: O e-mail institucional "${cleanEmail}" não foi localizado no cadastro oficial do CISEB. ` +
      `Solicite o cadastro prévio da sua unidade à Equipe de Monitoramento (ciseb.adm@escola.seduc.pa.gov.br).`
    );
  }

  // 5. Verifica se a conta está inativa
  if (accountData && accountData.status === 'inativo' && !isOfficialAdmin) {
    await signOut(auth);
    throw new Error(
      `Acesso suspenso: Esta conta institucional foi inativada pelo monitoramento do CISEB. ` +
      `Entre em contato com ciseb.adm@escola.seduc.pa.gov.br para solicitar a reativação.`
    );
  }

  // 6. Determinação de papel e escola canônica oficial
  let role: 'formador' | 'coordenador' | 'monitoramento' = 'formador';
  let escola = CANONICAL_ESCOLAS[0];

  if (isOfficialAdmin) {
    role = 'monitoramento';
    escola = findEscolaByNameOrUnit('CISEB - COORDENAÇÃO GERAL SEDUC/PA');
  } else if (accountData) {
    role = accountData.role || 'formador';
    escola = findEscolaByNameOrUnit(accountData.escolaId || accountData.unidadeCiseb || '');
  }

  const finalNome = accountData?.nome || cleanNome;
  const nowIso = new Date().toISOString();

  const finalDre = accountData?.dre || escola.dre || '';

  const finalAccount: CisebRegisteredAccount = {
    id: fbUser.uid,
    uid: fbUser.uid,
    nome: finalNome,
    email: cleanEmail,
    escolaId: escola.id,
    escolaNome: escola.nome,
    unidadeCiseb: escola.nome,
    dre: finalDre,
    role,
    status: 'ativo',
    cadastradoPor: accountData?.cadastradoPor || (isOfficialAdmin ? 'Sistema CISEB' : 'Administração CISEB'),
    dataCadastro: accountData?.dataCadastro || nowIso.split('T')[0],
    criadoPor: accountData?.criadoPor || 'Cadastro CISEB',
    criadoEm: accountData?.criadoEm || nowIso,
    atualizadoPor: accountData?.atualizadoPor,
    atualizadoEm: accountData?.atualizadoEm,
    primeiroAcessoEm: accountData?.primeiroAcessoEm || nowIso,
    ultimoAcessoEm: nowIso,
  };

  // 7. Salva ou atualiza a conta sob o UID real no Firestore
  try {
    const docRef = doc(db, ACCOUNTS_COLLECTION, fbUser.uid);
    await setDoc(docRef, finalAccount, { merge: true });
    await updateProfile(fbUser, { displayName: finalNome }).catch(() => {});

    // Se havia um pré-cadastro sob ID temporário (ex: prof_...), remove para não duplicar
    if (preRegDocId && preRegDocId !== fbUser.uid) {
      try {
        await deleteDoc(doc(db, ACCOUNTS_COLLECTION, preRegDocId));
      } catch (errDelete) {
        console.warn('[AuthService] Aviso ao remover documento temporário de pré-cadastro:', errDelete);
      }
    }
  } catch (err) {
    console.warn('[AuthService] Aviso ao persistir vínculo professor-escola no Firestore:', err);
  }

  // 8. Retorna o perfil autenticado vinculado diretamente à sua unidade
  const profile: AuthUser = {
    id: fbUser.uid,
    uid: fbUser.uid,
    nome: finalNome,
    email: cleanEmail,
    role,
    escolaId: escola.id,
    escolaNome: escola.nome,
    unidadeCiseb: escola.nome,
    dre: finalDre,
    ultimoAcesso: nowIso,
  };

  try {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(profile));
  } catch {}

  return profile;
}

/**
 * Consulta perfil do usuário no Firestore com resolução automática de escola
 */
export async function fetchUserProfile(uid: string, emailFallback?: string): Promise<AuthUser | null> {
  const fbUser = auth.currentUser;
  let profileData: Partial<CisebRegisteredAccount> | null = null;

  try {
    const docRef = doc(db, ACCOUNTS_COLLECTION, uid);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      profileData = snap.data() as CisebRegisteredAccount;
    } else {
      const cleanEmail = (emailFallback || fbUser?.email || '').toLowerCase();
      const staticAcc = getRegisteredAccounts().find((a) => a.email.toLowerCase() === cleanEmail);
      if (staticAcc) {
        profileData = staticAcc;
      }
    }
  } catch (err) {
    console.warn('[AuthService] Erro ao buscar perfil no Firestore:', err);
  }

  if (!profileData) {
    return null;
  }

  const email = (profileData.email || emailFallback || fbUser?.email || '').toLowerCase();
  let role = profileData.role || 'formador';
  if (email === 'ciseb.adm@escola.seduc.pa.gov.br') {
    role = 'monitoramento';
  } else if (email === 'ciseb.coordenacao@escola.seduc.pa.gov.br') {
    role = 'coordenador';
  }

  const escola = findEscolaByNameOrUnit(profileData.escolaId || profileData.unidadeCiseb || '');
  const finalDre = profileData.dre || escola.dre || '';

  return {
    id: uid,
    uid: uid,
    nome: profileData.nome || fbUser?.displayName || email.split('@')[0].toUpperCase(),
    email,
    role,
    escolaId: escola.id,
    escolaNome: escola.nome,
    unidadeCiseb: escola.nome,
    dre: finalDre,
    ultimoAcesso: new Date().toISOString(),
  };
}

/**
 * Desconectar da sessão
 */
export async function signOutUser(): Promise<void> {
  try {
    localStorage.removeItem(AUTH_STORAGE_KEY);
  } catch {}
  await signOut(auth);
}

// ----------------------------------------------------
// SECURE BACKEND ADMIN ENDPOINTS (Firebase Admin SDK)
// ----------------------------------------------------

async function getAdminHeaders(): Promise<HeadersInit> {
  const token = await auth.currentUser?.getIdToken();
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token || ''}`,
  };
}

/**
 * Admin: Cadastrar professor ou membro da equipe vinculado a uma escola canônica
 */
export async function adminCreateAccount(payload: {
  nome: string;
  escolaId?: string;
  unidadeCiseb: string;
  email: string;
  role: 'formador' | 'coordenador' | 'monitoramento';
}): Promise<{ success: boolean; account?: CisebRegisteredAccount; error?: string }> {
  try {
    const escola = findEscolaByNameOrUnit(payload.escolaId || payload.unidadeCiseb);
    const headers = await getAdminHeaders();
    const result = await safeJsonFetch<{ success: boolean; account?: CisebRegisteredAccount; error?: string }>(
      '/api/admin/accounts',
      {
        method: 'POST',
        headers,
        body: JSON.stringify({
          ...payload,
          escolaId: escola.id,
          unidadeCiseb: escola.nome,
        }),
      }
    );

    if (!result.ok || !result.data?.success) {
      return { success: false, error: result.error || result.data?.error || 'Erro ao criar conta no servidor.' };
    }

    return {
      success: true,
      account: result.data.account,
    };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Falha de comunicação com o servidor administrativo.' };
  }
}

/**
 * Admin: Atualizar vinculação de escola ou dados de conta
 */
export async function adminUpdateAccount(
  id: string,
  payload: {
    nome?: string;
    escolaId?: string;
    unidadeCiseb?: string;
    role?: 'formador' | 'coordenador' | 'monitoramento';
    status?: 'ativo' | 'inativo';
  }
): Promise<{ success: boolean; error?: string; account?: CisebRegisteredAccount }> {
  try {
    let finalEscolaId = payload.escolaId;
    let finalUnidadeCiseb = payload.unidadeCiseb;

    if (payload.escolaId || payload.unidadeCiseb) {
      const esc = findEscolaByNameOrUnit(payload.escolaId || payload.unidadeCiseb || '');
      finalEscolaId = esc.id;
      finalUnidadeCiseb = esc.nome;
    }

    const cleanPayload = {
      ...payload,
      ...(finalEscolaId ? { escolaId: finalEscolaId } : {}),
      ...(finalUnidadeCiseb ? { unidadeCiseb: finalUnidadeCiseb } : {}),
    };

    // 1. Atualização direta no Firestore
    try {
      const accRef = doc(db, ACCOUNTS_COLLECTION, id);
      await setDoc(accRef, cleanPayload, { merge: true });
    } catch (fsErr) {
      console.warn('[Admin Update] Aviso ao salvar no Firestore:', fsErr);
    }

    // 2. Atualiza cache local
    try {
      const raw = localStorage.getItem(CISEB_ACCOUNTS_STORAGE_KEY);
      if (raw) {
        const list: CisebRegisteredAccount[] = JSON.parse(raw);
        const idx = list.findIndex((a) => a.id === id);
        if (idx >= 0) {
          list[idx] = { ...list[idx], ...cleanPayload };
          localStorage.setItem(CISEB_ACCOUNTS_STORAGE_KEY, JSON.stringify(list));
        }
      }
    } catch {}

    // 3. Backend Admin API
    const headers = await getAdminHeaders();
    await safeJsonFetch(`/api/admin/accounts/${id}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify(cleanPayload),
    }).catch(() => {});

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Falha ao atualizar conta no servidor.' };
  }
}

/**
 * Admin: Remover conta do CISEB
 */
export async function adminDeleteAccount(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const headers = await getAdminHeaders();
    const result = await safeJsonFetch<{ success: boolean; error?: string }>(
      `/api/admin/accounts/${id}`,
      {
        method: 'DELETE',
        headers,
      }
    );

    if (!result.ok || !result.data?.success) {
      return { success: false, error: result.error || result.data?.error || 'Erro ao remover conta no servidor.' };
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Falha ao excluir conta no servidor.' };
  }
}

/**
 * Atualizar perfil básico do usuário atual
 */
export async function updateUserProfile(
  uid: string,
  updates: { nome?: string }
): Promise<AuthUser> {
  const user = auth.currentUser;
  const targetUid = uid || user?.uid || '';
  if (!targetUid) {
    throw new Error('Nenhum usuário conectado para atualizar perfil.');
  }

  const cleanUpdates: Partial<CisebRegisteredAccount> = {};
  if (updates.nome) {
    cleanUpdates.nome = updates.nome.trim().toUpperCase();
    if (user) {
      await updateProfile(user, { displayName: cleanUpdates.nome }).catch(() => {});
    }
  }

  try {
    const accRef = doc(db, ACCOUNTS_COLLECTION, targetUid);
    await setDoc(accRef, cleanUpdates, { merge: true });
  } catch (err) {
    console.error('[AuthService] Erro ao atualizar perfil no Firestore:', err);
  }

  const updated = await fetchUserProfile(targetUid, user?.email || undefined);
  if (!updated) {
    return {
      id: targetUid,
      uid: targetUid,
      nome: updates.nome || user?.displayName || 'USUÁRIO',
      email: user?.email || '',
      role: 'formador',
      escolaId: CANONICAL_ESCOLAS[0].id,
      unidadeCiseb: CANONICAL_ESCOLAS[0].nome,
      ultimoAcesso: new Date().toISOString(),
    };
  }
  return updated;
}

// ----------------------------------------------------
// MÉTODOS DE COMPATIBILIDADE LEGADA (STUBS SEGUROS)
// Redirecionam para a autenticação oficial Google
// ----------------------------------------------------
export async function loginWithEmail(_email: string, _password: string): Promise<AuthUser> {
  throw new Error('O CISEB utiliza exclusivamente o login com Google Institucional (@escola.seduc.pa.gov.br). Clique no botão "Entrar com Google Institucional".');
}

export async function registerAccount(
  _nome: string,
  _unidadeCiseb: string,
  _email: string,
  _password: string
): Promise<AuthUser> {
  throw new Error('O cadastro é automático via login com Google Institucional (@escola.seduc.pa.gov.br).');
}

export async function registerGoogleAccount(
  fbUser: FirebaseUser,
  _nome?: string,
  _unidadeCiseb?: string
): Promise<AuthUser> {
  return fetchOrCreateGoogleUserProfile(fbUser);
}

export async function changeUserPassword(_currentPassword: string, _newPassword: string): Promise<void> {
  throw new Error('As contas institucionais do CISEB utilizam autenticação Google centralizada pela SEDUC.');
}

export async function sendResetPassword(_email: string): Promise<void> {
  throw new Error('As senhas de contas @escola.seduc.pa.gov.br são gerenciadas pela plataforma Google Workspace da SEDUC.');
}

export async function adminResetPassword(
  _id: string,
  _generateTempPassword = true
): Promise<{ success: boolean; tempPassword?: string; resetLink?: string; error?: string }> {
  return {
    success: true,
    message: 'As contas utilizam exclusivamente autenticação Google Workspace SEDUC. Não requerem redefinição manual de senha.',
  } as any;
}
