import { useState, useEffect, useCallback } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { AuthUser } from '../types';
import {
  loginWithEmail,
  loginWithGoogle,
  signInGoogleCredential,
  registerAccount,
  registerGoogleAccount as registerGoogleAccountService,
  changeUserPassword,
  updateUserProfile,
  sendResetPassword,
  signOutUser,
  fetchUserProfile,
  getFriendlyAuthErrorMessage,
} from '../services/authService';

const AUTH_STORAGE_KEY = 'ciseb_auth_user_v1';

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(() => {
    try {
      const stored = localStorage.getItem(AUTH_STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored) as AuthUser;
      }
    } catch {}
    return null;
  });

  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(auth.currentUser);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Synchronize onAuthStateChanged
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser);
      if (fbUser) {
        try {
          const profile = await fetchUserProfile(fbUser.uid, fbUser.email || undefined);
          if (profile) {
            setUser(profile);
            try {
              localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(profile));
            } catch {}
          }
        } catch (err: any) {
          console.error('[useAuth] Erro ao sincronizar perfil do usuário:', err);
        }
      } else {
        setUser(null);
        try {
          localStorage.removeItem(AUTH_STORAGE_KEY);
        } catch {}
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = useCallback(async (email: string, pass: string): Promise<AuthUser> => {
    setError(null);
    try {
      const profile = await loginWithEmail(email, pass);
      setUser(profile);
      try {
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(profile));
      } catch {}
      return profile;
    } catch (err: any) {
      const friendly = getFriendlyAuthErrorMessage(err);
      setError(friendly);
      throw new Error(friendly);
    }
  }, []);

  const loginGoogle = useCallback(async (): Promise<AuthUser> => {
    setError(null);
    try {
      const profile = await loginWithGoogle();
      setUser(profile);
      try {
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(profile));
      } catch {}
      return profile;
    } catch (err: any) {
      const friendly = getFriendlyAuthErrorMessage(err);
      setError(friendly);
      throw new Error(friendly);
    }
  }, []);

  const register = useCallback(
    async (nome: string, unidade: string, email: string, pass: string): Promise<AuthUser> => {
      setError(null);
      try {
        const profile = await registerAccount(nome, unidade, email, pass);
        setUser(profile);
        try {
          localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(profile));
        } catch {}
        return profile;
      } catch (err: any) {
        const friendly = getFriendlyAuthErrorMessage(err);
        setError(friendly);
        throw new Error(friendly);
      }
    },
    []
  );

  const registerGoogleAccount = useCallback(
    async (fbUser: FirebaseUser, nome: string, unidade: string): Promise<AuthUser> => {
      setError(null);
      try {
        const profile = await registerGoogleAccountService(fbUser, nome, unidade);
        setUser(profile);
        try {
          localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(profile));
        } catch {}
        return profile;
      } catch (err: any) {
        const friendly = getFriendlyAuthErrorMessage(err);
        setError(friendly);
        throw new Error(friendly);
      }
    },
    []
  );

  const changePassword = useCallback(async (currentPass: string, newPass: string): Promise<void> => {
    setError(null);
    try {
      await changeUserPassword(currentPass, newPass);
      if (user) {
        const updated = { ...user, mustChangePassword: false };
        setUser(updated);
        try {
          localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(updated));
        } catch {}
      }
    } catch (err: any) {
      const friendly = getFriendlyAuthErrorMessage(err);
      setError(friendly);
      throw new Error(friendly);
    }
  }, [user]);

  const resetPassword = useCallback(async (email: string): Promise<void> => {
    setError(null);
    try {
      await sendResetPassword(email);
    } catch (err: any) {
      const friendly = getFriendlyAuthErrorMessage(err);
      setError(friendly);
      throw new Error(friendly);
    }
  }, []);

  const updateProfile = useCallback(
    async (updates: { unidadeCiseb?: string; nome?: string }): Promise<AuthUser> => {
      setError(null);
      try {
        const uid = user?.uid || user?.id || '';
        const updated = await updateUserProfile(uid, updates);
        setUser(updated);
        try {
          localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(updated));
        } catch {}
        return updated;
      } catch (err: any) {
        const friendly = getFriendlyAuthErrorMessage(err);
        setError(friendly);
        throw new Error(friendly);
      }
    },
    [user]
  );

  const logout = useCallback(async (): Promise<void> => {
    setError(null);
    try {
      await signOutUser();
      setUser(null);
      try {
        localStorage.removeItem(AUTH_STORAGE_KEY);
      } catch {}
    } catch (err: any) {
      console.error('[useAuth] Erro ao deslogar:', err);
    }
  }, []);

  return {
    user,
    firebaseUser,
    loading,
    error,
    mustChangePassword: !!user?.mustChangePassword,
    login,
    loginGoogle,
    signInGoogleCredential,
    register,
    registerGoogleAccount,
    updateProfile,
    changePassword,
    resetPassword,
    logout,
  };
}
