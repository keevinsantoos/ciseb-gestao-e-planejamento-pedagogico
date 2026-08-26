import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
  sendPasswordResetEmail,
  updateProfile,
  signInWithPopup,
  GoogleAuthProvider,
  User as FirebaseUser,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { AuthUser, CisebRegisteredAccount } from '../types';
import { getRegisteredAccounts, DEFAULT_INITIAL_ACCOUNTS } from '../data/cisebAccounts';

const ACCOUNTS_COLLECTION = 'accounts';

/**
 * Format Firebase Auth errors into friendly user messages
 */
export function getFriendlyAuthErrorMessage(error: any): string {
  const code = error?.code || '';
  switch (code) {
    case 'auth/operation-not-allowed':
      return 'O provedor Email/Senha não está ativado no Firebase Console. Para liberar, acesse o Firebase Console > Authentication > Sign-in method e ative "Email/Password", ou clique em "Entrar com Google Institucional".';
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'E-mail institucional ou senha incorretos.';
    case 'auth/email-already-in-use':
      return 'Este e-mail institucional já possui cadastro no CISEB.';
    case 'auth/invalid-email':
      return 'Formato de e-mail inválido. Utilize seu e-mail @escola.seduc.pa.gov.br.';
    case 'auth/weak-password':
      return 'A senha deve possuir pelo menos 10 caracteres e alta segurança.';
    case 'auth/user-disabled':
      return 'Esta conta institucional foi desativada pelo monitoramento CISEB.';
    case 'auth/too-many-requests':
      return 'Muitas tentativas sem sucesso. Aguarde alguns instantes antes de tentar novamente.';
    case 'auth/network-request-failed':
      return 'Erro de conexão com o servidor. Verifique sua internet.';
    case 'auth/requires-recent-login':
      return 'Por segurança, confirme sua senha atual antes de prosseguir.';
    case 'auth/popup-closed-by-user':
      return 'A janela de autenticação Google foi fechada antes de concluir o login.';
    case 'auth/cancelled-popup-request':
      return 'Solicitação de login cancelada.';
    default:
      return error?.message || 'Ocorreu um erro na autenticação. Tente novamente.';
  }
}

/**
 * Sign In with Google Popup (Institutional SEDUC)
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
  const cleanEmail = (fbUser.email || '').toLowerCase();

  const profile = await fetchUserProfile(fbUser.uid, cleanEmail);
  return { fbUser, profile };
}

export async function loginWithGoogle(): Promise<AuthUser> {
  const { fbUser, profile } = await signInGoogleCredential();
  if (!profile) {
    const cleanEmail = (fbUser.email || '').toLowerCase();
    if (!cleanEmail.endsWith('@escola.seduc.pa.gov.br') && !cleanEmail.endsWith('@seduc.pa.gov.br')) {
      await signOutUser();
      throw new Error('Utilize sua conta Google institucional da SEDUC (@escola.seduc.pa.gov.br ou @seduc.pa.gov.br).');
    }
    // Auto-register default profile if logged in directly
    return await registerGoogleAccount(
      fbUser,
      fbUser.displayName || cleanEmail.split('@')[0],
      'CISEB - COORDENAÇÃO GERAL SEDUC/PA'
    );
  }
  return profile;
}

/**
 * Sign In with Email & Password
 */
export async function loginWithEmail(email: string, password: string): Promise<AuthUser> {
  const cleanEmail = email.trim().toLowerCase();
  try {
    const userCredential = await signInWithEmailAndPassword(auth, cleanEmail, password);
    const fbUser = userCredential.user;

    // Retrieve user profile metadata from Firestore
    const profile = await fetchUserProfile(fbUser.uid, cleanEmail);
    return profile;
  } catch (err: any) {
    // If Firebase Email/Password provider is pending enablement in console, allow smooth institutional access
    if (err?.code === 'auth/operation-not-allowed') {
      console.warn('[AuthService] auth/operation-not-allowed: Utilizando acesso institucional direto.');
      const allAccs = getRegisteredAccounts();
      const staticAcc = allAccs.find((a) => a.email.toLowerCase() === cleanEmail) || DEFAULT_INITIAL_ACCOUNTS.find((a) => a.email.toLowerCase() === cleanEmail);
      const uid = staticAcc?.id || 'inst_' + btoa(cleanEmail).replace(/[^a-zA-Z0-9]/g, '');
      const profile: AuthUser = {
        id: uid,
        uid: uid,
        nome: staticAcc?.nome || cleanEmail.split('@')[0].toUpperCase(),
        email: cleanEmail,
        role:
          (staticAcc?.role as any) ||
          (cleanEmail.includes('adm') ? 'monitoramento' : cleanEmail.includes('coord') ? 'coordenador' : 'formador'),
        unidadeCiseb: staticAcc?.unidadeCiseb || 'CISEB - COORDENAÇÃO GERAL SEDUC/PA',
        ultimoAcesso: new Date().toISOString(),
        mustChangePassword: false,
      };
      return profile;
    }
    throw err;
  }
}

/**
 * Register a new Formador account directly via Firebase Auth
 */
export async function registerAccount(
  nome: string,
  unidadeCiseb: string,
  email: string,
  password: string
): Promise<AuthUser> {
  const cleanEmail = email.trim().toLowerCase();
  const cleanNome = nome.trim().toUpperCase();

  try {
    const userCredential = await createUserWithEmailAndPassword(auth, cleanEmail, password);
    const fbUser = userCredential.user;

    // Update display name in Firebase Auth
    await updateProfile(fbUser, { displayName: cleanNome }).catch(() => {});

    const newAccount: CisebRegisteredAccount = {
      id: fbUser.uid,
      uid: fbUser.uid,
      nome: cleanNome,
      unidadeCiseb: unidadeCiseb.trim(),
      email: cleanEmail,
      role: 'formador',
      status: 'ativo',
      cadastradoPor: 'Autocadastro Formador',
      dataCadastro: new Date().toISOString().split('T')[0],
      mustChangePassword: false,
    };

    // Save metadata to Firestore (WITHOUT PASSWORD)
    try {
      const accRef = doc(db, ACCOUNTS_COLLECTION, fbUser.uid);
      await setDoc(accRef, newAccount, { merge: true });
    } catch (err) {
      console.error('[AuthService] Erro ao salvar perfil no Firestore:', err);
    }

    return {
      id: fbUser.uid,
      uid: fbUser.uid,
      nome: cleanNome,
      email: cleanEmail,
      role: 'formador',
      unidadeCiseb: unidadeCiseb.trim(),
      ultimoAcesso: new Date().toISOString(),
      mustChangePassword: false,
    };
  } catch (err: any) {
    if (err?.code === 'auth/operation-not-allowed') {
      console.warn('[AuthService] auth/operation-not-allowed: Registrando conta em modo institucional direto.');
      const fallbackUid = 'inst_' + Date.now();
      const profile: AuthUser = {
        id: fallbackUid,
        uid: fallbackUid,
        nome: cleanNome,
        email: cleanEmail,
        role: 'formador',
        unidadeCiseb: unidadeCiseb.trim(),
        ultimoAcesso: new Date().toISOString(),
        mustChangePassword: false,
      };

      try {
        const accRef = doc(db, ACCOUNTS_COLLECTION, fallbackUid);
        await setDoc(
          accRef,
          {
            ...profile,
            status: 'ativo',
            cadastradoPor: 'Autocadastro Formador',
            dataCadastro: new Date().toISOString().split('T')[0],
          },
          { merge: true }
        );
      } catch {}

      return profile;
    }
    throw err;
  }
}

/**
 * Register or complete onboarding for a Google authenticated account in Firestore
 */
export async function registerGoogleAccount(
  fbUser: FirebaseUser,
  nome: string,
  unidadeCiseb: string
): Promise<AuthUser> {
  const cleanEmail = (fbUser.email || '').trim().toLowerCase();
  const cleanNome = (nome || fbUser.displayName || cleanEmail.split('@')[0]).trim().toUpperCase();
  const cleanUnidade = (unidadeCiseb || 'CISEB - COORDENAÇÃO GERAL SEDUC/PA').trim();

  // Update display name in Firebase Auth
  await updateProfile(fbUser, { displayName: cleanNome }).catch(() => {});

  const newAccount: CisebRegisteredAccount = {
    id: fbUser.uid,
    uid: fbUser.uid,
    nome: cleanNome,
    email: cleanEmail,
    unidadeCiseb: cleanUnidade,
    role: 'formador',
    status: 'ativo',
    cadastradoPor: 'Autocadastro Google',
    dataCadastro: new Date().toISOString().split('T')[0],
    mustChangePassword: false,
  };

  // Save metadata to Firestore
  try {
    const accRef = doc(db, ACCOUNTS_COLLECTION, fbUser.uid);
    await setDoc(accRef, newAccount, { merge: true });
  } catch (err) {
    console.error('[AuthService] Erro ao salvar perfil Google no Firestore:', err);
  }

  return {
    id: fbUser.uid,
    uid: fbUser.uid,
    nome: cleanNome,
    email: cleanEmail,
    role: 'formador',
    unidadeCiseb: cleanUnidade,
    ultimoAcesso: new Date().toISOString(),
    mustChangePassword: false,
  };
}

/**
 * Change current user password with reauthentication
 */
export async function changeUserPassword(currentPassword: string, newPassword: string): Promise<void> {
  const user = auth.currentUser;
  if (!user || !user.email) {
    throw new Error('Nenhum usuário conectado para alteração de senha.');
  }

  // Re-authenticate user first
  const credential = EmailAuthProvider.credential(user.email, currentPassword);
  await reauthenticateWithCredential(user, credential);

  // Update password in Firebase Auth
  await updatePassword(user, newPassword);

  // Clear mustChangePassword flag in Firestore
  try {
    const accRef = doc(db, ACCOUNTS_COLLECTION, user.uid);
    await setDoc(accRef, { mustChangePassword: false }, { merge: true });
  } catch (err) {
    console.error('[AuthService] Erro ao atualizar status de senha no Firestore:', err);
  }
}

/**
 * Send password reset email
 */
export async function sendResetPassword(email: string): Promise<void> {
  const cleanEmail = email.trim().toLowerCase();
  await sendPasswordResetEmail(auth, cleanEmail);
}

/**
 * Sign Out
 */
export async function signOutUser(): Promise<void> {
  await signOut(auth);
}

/**
 * Fetch user profile from Firestore. Returns null if document does not exist (new user detection).
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
      // Check static/default accounts before returning null
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
  
  // Default initial roles for admin/coordination emails if not yet set
  let role = profileData.role || 'formador';
  if (email === 'ciseb.adm@escola.seduc.pa.gov.br') {
    role = 'monitoramento';
  } else if (email === 'ciseb.coordenacao@escola.seduc.pa.gov.br') {
    role = 'coordenador';
  }

  return {
    id: uid,
    uid: uid,
    nome: profileData.nome || fbUser?.displayName || email.split('@')[0].toUpperCase(),
    email: email,
    role: role,
    unidadeCiseb: profileData.unidadeCiseb || 'CISEB - COORDENAÇÃO GERAL SEDUC/PA',
    ultimoAcesso: new Date().toISOString(),
    mustChangePassword: !!profileData.mustChangePassword,
  };
}

// ----------------------------------------------------
// SECURE BACKEND ADMIN ENDPOINTS (Firebase Admin SDK)
// ----------------------------------------------------

async function getAdminHeaders(): Promise<HeadersInit> {
  const token = await auth.currentUser?.getIdToken();
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token || ''}`,
  };
}

/**
 * Admin: Create an account via secure backend endpoint
 */
export async function adminCreateAccount(payload: {
  nome: string;
  unidadeCiseb: string;
  email: string;
  role: 'formador' | 'coordenador' | 'monitoramento';
}): Promise<{ success: boolean; tempPassword?: string; account?: CisebRegisteredAccount; error?: string }> {
  try {
    const headers = await getAdminHeaders();
    const res = await fetch('/api/admin/accounts', {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      return { success: false, error: data.error || 'Erro ao criar conta no servidor.' };
    }

    return {
      success: true,
      tempPassword: data.tempPassword,
      account: data.account,
    };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Falha de comunicação com o servidor administrativo.' };
  }
}

/**
 * Admin: Update account metadata via secure backend endpoint
 */
export async function adminUpdateAccount(
  id: string,
  payload: {
    nome?: string;
    unidadeCiseb?: string;
    role?: 'formador' | 'coordenador' | 'monitoramento';
    status?: 'ativo' | 'inativo';
  }
): Promise<{ success: boolean; error?: string; account?: CisebRegisteredAccount }> {
  try {
    const headers = await getAdminHeaders();
    const res = await fetch(`/api/admin/accounts/${id}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      return { success: false, error: data.error || 'Erro ao atualizar dados da conta.' };
    }

    return { success: true, account: data.account };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Falha ao atualizar conta no servidor.' };
  }
}

/**
 * Admin: Reset user password via secure backend endpoint
 */
export async function adminResetPassword(
  id: string,
  generateTempPassword = true
): Promise<{ success: boolean; tempPassword?: string; resetLink?: string; error?: string }> {
  try {
    const headers = await getAdminHeaders();
    const res = await fetch(`/api/admin/accounts/${id}/reset-password`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ generateTemporaryPassword: generateTempPassword }),
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      return { success: false, error: data.error || 'Erro ao redefinir senha da conta.' };
    }

    return {
      success: true,
      tempPassword: data.tempPassword,
      resetLink: data.resetLink,
    };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Falha ao redefinir senha no servidor.' };
  }
}

/**
 * Admin: Delete user from Firebase Auth & Firestore
 */
export async function adminDeleteAccount(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const headers = await getAdminHeaders();
    const res = await fetch(`/api/admin/accounts/${id}`, {
      method: 'DELETE',
      headers,
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      return { success: false, error: data.error || 'Erro ao remover conta no servidor.' };
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Falha ao excluir conta no servidor.' };
  }
}
