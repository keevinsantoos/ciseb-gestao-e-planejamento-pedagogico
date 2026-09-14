import React, { useState } from 'react';
import { AuthUser } from '../../types';
import { useAuth } from '../../hooks/useAuth';
import {
  AlertCircle,
  Loader2,
  CheckCircle2,
  ShieldCheck,
  Building2,
  Sparkles,
  School,
} from 'lucide-react';

interface LoginFormProps {
  onLoginSuccess: (user: AuthUser) => void;
  onSwitchToRegister?: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({
  onLoginSuccess,
}) => {
  const { loginGoogle } = useAuth();

  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleGoogleLogin = async () => {
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsGoogleLoading(true);

    try {
      const user = await loginGoogle();
      setSuccessMsg(`Bem-vindo(a), ${user.nome}! Vínculo confirmado: ${user.unidadeCiseb}.`);
      setTimeout(() => {
        onLoginSuccess(user);
      }, 500);
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao autenticar com a conta Google institucional.');
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="w-full space-y-5">
      {/* Mensagem de Feedback de Erro */}
      {errorMsg && (
        <div
          role="alert"
          className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-red-700 dark:text-red-300 text-xs sm:text-sm flex items-start gap-2.5 shadow-sm transition-all"
        >
          <AlertCircle className="w-4 h-4 shrink-0 text-red-500 mt-0.5" />
          <div className="flex-1 leading-relaxed">
            <span className="font-semibold block mb-0.5">Acesso Não Autorizado</span>
            {errorMsg}
          </div>
        </div>
      )}

      {/* Mensagem de Feedback de Sucesso */}
      {successMsg && (
        <div
          role="status"
          className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 text-emerald-700 dark:text-emerald-300 text-xs sm:text-sm flex items-start gap-2.5 shadow-sm transition-all"
        >
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500 mt-0.5" />
          <div className="flex-1 leading-relaxed">
            <span className="font-semibold block mb-0.5">Autenticado com Sucesso</span>
            {successMsg}
          </div>
        </div>
      )}

      {/* Card de Informação sobre Vínculo Automático Oficial */}
      <div className="p-4 rounded-xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40 text-blue-900 dark:text-blue-200 text-xs leading-relaxed space-y-2">
        <div className="flex items-center gap-2 font-semibold text-[#005BAC] dark:text-sky-300">
          <ShieldCheck className="w-4 h-4 shrink-0" />
          <span>Autenticação Oficial Google SEDUC/PA</span>
        </div>
        <p className="text-slate-600 dark:text-slate-300 text-xs">
          O CISEB utiliza exclusivamente a sua conta Google institucional (
          <code className="px-1 py-0.5 rounded bg-blue-100 dark:bg-blue-900/60 font-mono text-[11px] text-[#005BAC] dark:text-sky-300">
            @escola.seduc.pa.gov.br
          </code>{' '}
          ou{' '}
          <code className="px-1 py-0.5 rounded bg-blue-100 dark:bg-blue-900/60 font-mono text-[11px] text-[#005BAC] dark:text-sky-300">
            @seduc.pa.gov.br
          </code>
          ).
        </p>
        <div className="flex items-start gap-2 pt-1 text-[11px] text-slate-500 dark:text-slate-400 border-t border-blue-100/70 dark:border-blue-900/30">
          <School className="w-3.5 h-3.5 shrink-0 text-[#005BAC] dark:text-sky-400 mt-0.5" />
          <span>
            <strong>Vínculo Automático:</strong> A sua escola CISEB de atuação é associada automaticamente pelo Firestore institucional, garantindo segurança e integridade das 16 unidades.
          </span>
        </div>
      </div>

      {/* Botão de Login Exclusivo Google */}
      <button
        id="ciseb-btn-google-login"
        type="button"
        onClick={handleGoogleLogin}
        disabled={isGoogleLoading}
        className="w-full flex items-center justify-center gap-3 py-3.5 px-4 rounded-xl text-sm font-bold text-white bg-[#005BAC] hover:bg-[#004887] active:bg-[#003b70] shadow-md hover:shadow-lg focus:outline-none focus:ring-4 focus:ring-[#005BAC]/25 transition-all duration-200 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed group"
      >
        {isGoogleLoading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin shrink-0 text-white" />
            <span>Autenticando com Google SEDUC...</span>
          </>
        ) : (
          <>
            {/* Ícone Oficial do Google */}
            <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center shadow-xs shrink-0 p-0.5">
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
            </div>
            <span className="font-bold tracking-wide">Entrar com Google Institucional</span>
          </>
        )}
      </button>

      {/* Informações Institucionais CISEB */}
      <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80">
        <div className="grid grid-cols-2 gap-2 text-center">
          <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
            <span className="block text-xs font-bold text-slate-800 dark:text-slate-200">16 Unidades</span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400">Escolas Polo CISEB</span>
          </div>
          <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
            <span className="block text-xs font-bold text-slate-800 dark:text-slate-200">SEDUC Pará</span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400">Coordenação Geral</span>
          </div>
        </div>
      </div>
    </div>
  );
};
