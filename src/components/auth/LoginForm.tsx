import React, { useState } from 'react';
import { AuthUser } from '../../types';
import { useAuth } from '../../hooks/useAuth';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  AlertCircle,
  Loader2,
  CheckCircle2,
  HelpCircle,
  X,
  KeyRound,
} from 'lucide-react';

interface LoginFormProps {
  onLoginSuccess: (user: AuthUser) => void;
  onSwitchToRegister: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({
  onLoginSuccess,
  onSwitchToRegister,
}) => {
  const { login, loginGoogle, resetPassword } = useAuth();

  // Form Fields
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // States
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Forgot Password modal state
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [isSendingReset, setIsSendingReset] = useState(false);
  const [resetFeedback, setResetFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Google Login Submit
  const handleGoogleLogin = async () => {
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsGoogleLoading(true);
    try {
      const user = await loginGoogle();
      setSuccessMsg(`Bem-vindo(a), ${user.nome}!`);
      setTimeout(() => {
        onLoginSuccess(user);
      }, 400);
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao autenticar com a conta Google.');
    } finally {
      setIsGoogleLoading(false);
    }
  };

  // Email/Password Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const cleanEmail = emailInput.trim().toLowerCase();
    if (!cleanEmail) {
      setErrorMsg('Informe seu e-mail institucional @escola.seduc.pa.gov.br.');
      return;
    }

    if (!passwordInput) {
      setErrorMsg('Informe sua senha de acesso.');
      return;
    }

    setIsLoading(true);
    try {
      const user = await login(cleanEmail, passwordInput);
      setSuccessMsg(`Bem-vindo(a), ${user.nome}!`);
      setTimeout(() => {
        onLoginSuccess(user);
      }, 400);
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao realizar login. Verifique suas credenciais.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Reset Password Request
  const handleSendResetEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetFeedback(null);
    const cleanEmail = forgotEmail.trim().toLowerCase();

    if (!cleanEmail || !cleanEmail.endsWith('@escola.seduc.pa.gov.br')) {
      setResetFeedback({
        type: 'error',
        text: 'Informe um e-mail institucional válido (@escola.seduc.pa.gov.br).',
      });
      return;
    }

    setIsSendingReset(true);
    try {
      await resetPassword(cleanEmail);
      setResetFeedback({
        type: 'success',
        text: `Link de redefinição enviado para ${cleanEmail}! Verifique sua caixa de entrada institucional.`,
      });
    } catch (err: any) {
      setResetFeedback({
        type: 'error',
        text: err.message || 'Não foi possível enviar o link de redefinição.',
      });
    } finally {
      setIsSendingReset(false);
    }
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* Informational Banner */}
      <div className="p-4 bg-sky-50 dark:bg-sky-950/40 border border-sky-200/80 dark:border-sky-800/60 rounded-2xl flex items-start gap-3 text-xs text-sky-900 dark:text-sky-200">
        <div className="w-8 h-8 rounded-xl bg-[#005BAC]/10 dark:bg-sky-400/10 flex items-center justify-center shrink-0 text-[#005BAC] dark:text-sky-400 mt-0.5">
          <KeyRound className="w-4 h-4" />
        </div>
        <div className="space-y-0.5">
          <p className="font-bold text-sky-950 dark:text-sky-100">
            Acesso Seguro via Firebase Authentication
          </p>
          <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-[11px]">
            Autenticação protegida com criptografia de ponta a ponta. Utilize suas credenciais institucionais da SEDUC/PA.
          </p>
        </div>
      </div>

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

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Email Field */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <Mail className="w-3.5 h-3.5 text-[#005BAC] dark:text-sky-400" />
            <span>E-mail Institucional</span>
          </label>
          <div className="relative">
            <input
              type="email"
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              placeholder="nome.sobrenome@escola.seduc.pa.gov.br"
              required
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-xs text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-[#005BAC] outline-hidden transition-all font-mono"
            />
          </div>
        </div>

        {/* Password Field */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-[#005BAC] dark:text-sky-400" />
              <span>Senha de Acesso</span>
            </label>
            <button
              type="button"
              onClick={() => {
                setForgotEmail(emailInput);
                setIsForgotModalOpen(true);
              }}
              className="text-[11px] font-bold text-[#005BAC] dark:text-sky-400 hover:underline cursor-pointer"
            >
              Esqueceu a senha?
            </button>
          </div>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              placeholder="Digite sua senha"
              required
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-3 pr-10 py-2.5 text-xs font-mono text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-[#005BAC] outline-hidden transition-all"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              title={showPassword ? 'Ocultar senha' : 'Ver senha'}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading || isGoogleLoading}
          className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#005BAC] to-[#013780] hover:from-[#004e96] hover:to-[#012d6a] text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-[#005BAC]/20 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Autenticando no CISEB...</span>
            </>
          ) : (
            <>
              <span>Entrar com E-mail e Senha</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
        
        {/* Divider */}
        <div className="relative flex py-1 items-center">
          <div className="grow border-t border-slate-200 dark:border-slate-700"></div>
          <span className="shrink mx-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">ou</span>
          <div className="grow border-t border-slate-200 dark:border-slate-700"></div>
        </div>

        {/* Google Institutional Button */}
        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={isLoading || isGoogleLoading}
          className="w-full py-2.5 px-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 font-bold text-xs shadow-sm hover:shadow transition-all flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-50"
        >
          {isGoogleLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-[#005BAC]" />
              <span>Conectando com Google...</span>
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
              <span>Entrar com Conta Google Institucional</span>
            </>
          )}
        </button>
      </form>

      {/* Operation Not Allowed Assistance Card if error indicates provider disabled */}
      {errorMsg && errorMsg.includes('Firebase Console') && (
        <div className="p-3.5 bg-amber-50 dark:bg-amber-950/50 border border-amber-300 dark:border-amber-700/80 rounded-2xl text-xs text-amber-900 dark:text-amber-200 space-y-1.5">
          <p className="font-bold flex items-center gap-1.5">
            <HelpCircle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            Como habilitar o login por E-mail no Firebase:
          </p>
          <ol className="list-decimal list-inside space-y-1 text-[11px] text-amber-800 dark:text-amber-300 pl-1">
            <li>Acesse o <strong>Firebase Console</strong> do seu projeto.</li>
            <li>Vá em <strong>Authentication &gt; Sign-in method</strong>.</li>
            <li>Clique em <strong>Email/Password</strong> (E-mail/senha) e marque a opção <strong>Ativar (Enable)</strong>.</li>
            <li>Salve as alterações. Em seguida, o login por e-mail funcionará instantaneamente!</li>
          </ol>
        </div>
      )}

      {/* Footer link to register */}
      <div className="pt-2 text-center text-xs text-slate-600 dark:text-slate-400">
        <span>Não possui conta? </span>
        <button
          type="button"
          onClick={onSwitchToRegister}
          className="font-bold text-[#005BAC] dark:text-sky-400 hover:underline cursor-pointer"
        >
          Criar meu cadastro como Formador
        </button>
      </div>

      {/* Forgot Password Modal */}
      {isForgotModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-800 w-full max-w-md rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-700 overflow-hidden">
            <div className="bg-gradient-to-r from-[#005BAC] to-[#013780] p-4 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center">
                  <KeyRound className="w-4 h-4 text-amber-300" />
                </div>
                <h3 className="font-bold text-sm">Recuperação de Senha CISEB</h3>
              </div>
              <button
                onClick={() => {
                  setIsForgotModalOpen(false);
                  setResetFeedback(null);
                }}
                className="p-1 rounded-lg text-white/80 hover:text-white hover:bg-white/15 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSendResetEmail} className="p-5 space-y-4">
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Informe o seu e-mail institucional cadastrado para enviarmos as instruções seguras de redefinição de senha do Firebase Auth.
              </p>

              {resetFeedback && (
                <div
                  className={`p-3 rounded-xl text-xs flex items-start gap-2 ${
                    resetFeedback.type === 'success'
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : 'bg-red-50 text-red-800 border border-red-200'
                  }`}
                >
                  {resetFeedback.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  )}
                  <span>{resetFeedback.text}</span>
                </div>
              )}

              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-700 dark:text-slate-300 mb-1">
                  E-mail Institucional (@escola.seduc.pa.gov.br)
                </label>
                <input
                  type="email"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  placeholder="seu.nome@escola.seduc.pa.gov.br"
                  required
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-xs font-mono text-slate-900 dark:text-white focus:ring-2 focus:ring-[#005BAC] outline-hidden"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsForgotModalOpen(false);
                    setResetFeedback(null);
                  }}
                  className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer"
                >
                  Fechar
                </button>
                <button
                  type="submit"
                  disabled={isSendingReset}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-[#005BAC] hover:bg-[#004e96] text-white font-bold text-xs shadow-md shadow-[#005BAC]/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isSendingReset ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Enviando...</span>
                    </>
                  ) : (
                    <span>Enviar Link</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
