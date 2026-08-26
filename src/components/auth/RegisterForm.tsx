import React, { useState } from 'react';
import { AuthUser } from '../../types';
import { useAuth } from '../../hooks/useAuth';
import { signInGoogleCredential, registerGoogleAccount, getFriendlyAuthErrorMessage } from '../../services/authService';
import {
  Sparkles,
  AlertCircle,
  CheckCircle2,
  Loader2,
  School,
  ArrowRight,
} from 'lucide-react';

interface RegisterFormProps {
  onRegisterSuccess: (user: AuthUser) => void;
  onSwitchToLogin: () => void;
}

export const RegisterForm: React.FC<RegisterFormProps> = ({
  onRegisterSuccess,
  onSwitchToLogin,
}) => {
  const { logout } = useAuth();
  
  // Status State
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Single-Step Google Authentication & Direct Onboarding
  const handleGoogleAuth = async () => {
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsLoading(true);

    try {
      const { fbUser, profile } = await signInGoogleCredential();
      const cleanEmail = (fbUser.email || '').trim().toLowerCase();

      // Check Institutional Domain
      const isInstitutional =
        cleanEmail.endsWith('@escola.seduc.pa.gov.br') || cleanEmail.endsWith('@seduc.pa.gov.br');

      if (!isInstitutional) {
        await logout();
        setErrorMsg('Utilize sua conta Google institucional da SEDUC (@escola.seduc.pa.gov.br ou @seduc.pa.gov.br).');
        setIsLoading(false);
        return;
      }

      // If user already has a saved profile in Firestore -> direct login
      if (profile) {
        setSuccessMsg(`Bem-vindo(a) de volta, ${profile.nome}! Redirecionando...`);
        setTimeout(() => {
          onRegisterSuccess(profile);
        }, 500);
        return;
      }

      // If new user -> automatically register and log in directly without unit selection step
      const cleanNome = (
        fbUser.displayName ||
        cleanEmail.split('@')[0].replace(/\./g, ' ')
      ).trim().toUpperCase();

      const newProfile = await registerGoogleAccount(
        fbUser,
        cleanNome,
        'CISEB - SEDUC/PA' // Default Unidade
      );

      setSuccessMsg(`Cadastro institucional realizado com sucesso! Bem-vindo(a), ${newProfile.nome}!`);
      setTimeout(() => {
        onRegisterSuccess(newProfile);
      }, 500);
    } catch (err: any) {
      setErrorMsg(getFriendlyAuthErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* Error & Success Messages */}
      {errorMsg && (
        <div className="p-3.5 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 rounded-2xl flex items-start gap-2.5 text-xs text-red-700 dark:text-red-300 animate-in fade-in">
          <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
          <span className="font-medium leading-tight">{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 rounded-2xl flex items-start gap-2.5 text-xs text-emerald-800 dark:text-emerald-300 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
          <span className="font-medium leading-tight">{successMsg}</span>
        </div>
      )}

      {/* Direct Google Institutional Registration */}
      <div className="space-y-4">
        <div className="text-center space-y-1.5 py-2">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/80 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-2">
            <Sparkles className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            Primeiro acesso ao sistema CISEB
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
            Seu cadastro é criado de forma automática e segura utilizando a sua conta Google institucional da SEDUC/PA.
          </p>
        </div>

        {/* Google Connect Button */}
        <button
          type="button"
          onClick={handleGoogleAuth}
          disabled={isLoading}
          className="w-full py-3.5 px-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 font-bold text-xs shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-3 cursor-pointer disabled:opacity-50"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-[#005BAC]" />
              <span>Autenticando com a SEDUC/PA...</span>
            </>
          ) : (
            <>
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Entrar com Google Institucional</span>
              <ArrowRight className="w-4 h-4 ml-auto text-slate-400" />
            </>
          )}
        </button>

        {/* Institutional Domain Reminder Note */}
        <div className="p-3 bg-sky-50 dark:bg-sky-950/40 border border-sky-200/80 dark:border-sky-800/60 rounded-xl flex items-center gap-2.5 text-[11px] text-sky-900 dark:text-sky-200">
          <School className="w-4 h-4 text-[#005BAC] dark:text-sky-400 shrink-0" />
          <span>
            Utilize seu e-mail <strong>@escola.seduc.pa.gov.br</strong> ou <strong>@seduc.pa.gov.br</strong>
          </span>
        </div>
      </div>

      {/* Switch back to login */}
      <div className="pt-2 text-center text-xs text-slate-600 dark:text-slate-400">
        <span>Já possui uma conta ativa? </span>
        <button
          type="button"
          onClick={onSwitchToLogin}
          className="font-bold text-[#005BAC] dark:text-sky-400 hover:underline cursor-pointer"
        >
          Acessar Sistema
        </button>
      </div>
    </div>
  );
};

