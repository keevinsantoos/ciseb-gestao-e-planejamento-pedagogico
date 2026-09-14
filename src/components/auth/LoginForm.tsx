import React, { useState } from 'react';
import { AuthUser, UNIDADES_CISEB_OPTIONS, PROFESSORES_FORMADORES_OPTIONS } from '../../types';
import { useAuth } from '../../hooks/useAuth';
import { User as FirebaseUser } from 'firebase/auth';
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
  Building2,
  School,
  Search,
  UserCheck,
  ShieldCheck,
} from 'lucide-react';

interface LoginFormProps {
  onLoginSuccess: (user: AuthUser) => void;
  onSwitchToRegister: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({
  onLoginSuccess,
  onSwitchToRegister,
}) => {
  const { login, loginGoogle, signInGoogleCredential, registerGoogleAccount, resetPassword } = useAuth();

  // Form Fields
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // States
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Google Onboarding Modal (for selecting Unidade CISEB on Google Auth)
  const [googleOnboardingUser, setGoogleOnboardingUser] = useState<{
    fbUser: FirebaseUser;
    nome: string;
    email: string;
  } | null>(null);
  const [googleSelectedUnit, setGoogleSelectedUnit] = useState<string>(UNIDADES_CISEB_OPTIONS[0]);
  const [googleUnitSearch, setGoogleUnitSearch] = useState('');
  const [isCompletingGoogle, setIsCompletingGoogle] = useState(false);

  // Forgot Password modal state
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [isSendingReset, setIsSendingReset] = useState(false);
  const [resetFeedback, setResetFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Google Login Submit with Unit Selection Detection
  const handleGoogleLogin = async () => {
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsGoogleLoading(true);
    try {
      const { fbUser, profile } = await signInGoogleCredential();
      const cleanEmail = (fbUser.email || '').toLowerCase();

      // Verify domain
      if (!cleanEmail.endsWith('@escola.seduc.pa.gov.br') && !cleanEmail.endsWith('@seduc.pa.gov.br')) {
        throw new Error('Utilize sua conta Google institucional da SEDUC (@escola.seduc.pa.gov.br ou @seduc.pa.gov.br).');
      }

      // If user profile already exists with an assigned unit
      if (profile && profile.unidadeCiseb && profile.unidadeCiseb !== 'CISEB - COORDENAÇÃO GERAL SEDUC/PA') {
        setSuccessMsg(`Bem-vindo(a), ${profile.nome}!`);
        setTimeout(() => {
          onLoginSuccess(profile);
        }, 400);
      } else {
        // Prompt user to select their Unidade CISEB and confirm their name
        setGoogleOnboardingUser({
          fbUser,
          nome: profile?.nome || fbUser.displayName || cleanEmail.split('@')[0].toUpperCase(),
          email: cleanEmail,
        });
        if (profile?.unidadeCiseb) {
          setGoogleSelectedUnit(profile.unidadeCiseb);
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao autenticar com a conta Google.');
    } finally {
      setIsGoogleLoading(false);
    }
  };

  // Complete Google Onboarding with Selected Unit
  const handleCompleteGoogleOnboarding = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!googleOnboardingUser) return;

    if (!googleSelectedUnit) {
      setErrorMsg('Selecione a sua Unidade CISEB de atuação.');
      return;
    }

    setIsCompletingGoogle(true);
    setErrorMsg(null);
    try {
      const user = await registerGoogleAccount(
        googleOnboardingUser.fbUser,
        googleOnboardingUser.nome,
        googleSelectedUnit
      );
      setSuccessMsg(`Cadastro concluído com sucesso! Bem-vindo(a), ${user.nome}!`);
      setGoogleOnboardingUser(null);
      setTimeout(() => {
        onLoginSuccess(user);
      }, 400);
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao registrar sua unidade.');
    } finally {
      setIsCompletingGoogle(false);
    }
  };

  // Email/Password Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    let cleanEmail = emailInput.trim().toLowerCase();
    if (!cleanEmail) {
      setErrorMsg('Informe seu usuário ou e-mail institucional.');
      return;
    }

    // Se o usuário digitar apenas o nome de usuário (sem @), anexa o domínio institucional automaticamente
    if (!cleanEmail.includes('@')) {
      cleanEmail = `${cleanEmail}@escola.seduc.pa.gov.br`;
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
    let cleanEmail = forgotEmail.trim().toLowerCase();

    if (cleanEmail && !cleanEmail.includes('@')) {
      cleanEmail = `${cleanEmail}@escola.seduc.pa.gov.br`;
    }

    if (!cleanEmail || !cleanEmail.endsWith('@escola.seduc.pa.gov.br')) {
      setResetFeedback({
        type: 'error',
        text: 'Informe um usuário ou e-mail institucional válido.',
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
      <div className="p-4 bg-sky-50/80 dark:bg-sky-950/40 border border-sky-200/80 dark:border-sky-800/60 rounded-2xl flex items-start gap-3 text-xs text-sky-950 dark:text-sky-200 shadow-xs">
        <div className="w-8 h-8 rounded-xl bg-[#005BAC]/10 dark:bg-sky-400/10 flex items-center justify-center shrink-0 text-[#005BAC] dark:text-sky-400 mt-0.5 border border-[#005BAC]/15 dark:border-sky-400/20">
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
        <div
          role="alert"
          className="p-3.5 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 rounded-2xl flex items-start gap-2.5 text-xs text-red-700 dark:text-red-300 animate-in fade-in shadow-xs"
        >
          <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
          <span className="font-medium leading-tight">{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div
          role="status"
          className="p-3.5 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 rounded-2xl flex items-start gap-2.5 text-xs text-emerald-800 dark:text-emerald-300 animate-in fade-in shadow-xs"
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
          <span className="font-medium leading-tight">{successMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4" noValidate={false}>
        {/* Email Field */}
        <div className="space-y-1.5 text-left">
          <label
            htmlFor="login-email-input"
            className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5"
          >
            <Mail className="w-3.5 h-3.5 text-[#005BAC] dark:text-sky-400" />
            <span>Seu e-mail institucional</span>
          </label>
          <div className="relative">
            <input
              id="login-email-input"
              name="email"
              type="email"
              autoComplete="username"
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              placeholder="seu.email@escola.seduc.pa.gov.br"
              required
              disabled={isLoading || isGoogleLoading}
              className="w-full bg-slate-50/90 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-[#005BAC]/30 focus:border-[#005BAC] dark:focus:border-sky-400 outline-none transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>
        </div>

        {/* Password Field */}
        <div className="space-y-1.5 text-left">
          <div className="flex items-center justify-between">
            <label
              htmlFor="login-password-input"
              className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5"
            >
              <Lock className="w-3.5 h-3.5 text-[#005BAC] dark:text-sky-400" />
              <span>Senha de Acesso</span>
            </label>
            <button
              type="button"
              onClick={() => {
                setForgotEmail(emailInput);
                setIsForgotModalOpen(true);
              }}
              className="text-xs font-bold text-[#005BAC] dark:text-sky-400 hover:text-[#004e96] dark:hover:text-sky-300 hover:underline cursor-pointer focus:outline-none"
            >
              Esqueceu a senha?
            </button>
          </div>
          <div className="relative">
            <input
              id="login-password-input"
              name="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              placeholder="Digite sua senha"
              required
              disabled={isLoading || isGoogleLoading}
              className="w-full bg-slate-50/90 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 rounded-xl pl-4 pr-11 py-3 text-sm font-mono text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-[#005BAC]/30 focus:border-[#005BAC] dark:focus:border-sky-400 outline-none transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer focus:outline-none"
              title={showPassword ? 'Ocultar senha' : 'Ver senha'}
              aria-label={showPassword ? 'Ocultar senha digitada' : 'Exibir senha digitada'}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading || isGoogleLoading}
          className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-[#005BAC] via-[#004e96] to-[#013780] hover:from-[#004e96] hover:via-[#013780] hover:to-[#012d6a] text-white font-bold text-sm tracking-wide shadow-lg shadow-[#005BAC]/20 hover:shadow-xl hover:shadow-[#005BAC]/30 hover:-translate-y-0.5 active:translate-y-0 focus:outline-none focus:ring-2 focus:ring-[#005BAC] focus:ring-offset-2 dark:focus:ring-offset-slate-900 transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
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
          <span className="shrink mx-3 text-xs font-bold uppercase tracking-wider text-slate-400">ou</span>
          <div className="grow border-t border-slate-200 dark:border-slate-700"></div>
        </div>

        {/* Google Institutional Button */}
        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={isLoading || isGoogleLoading}
          className="w-full py-3 px-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 hover:border-slate-400 dark:hover:border-slate-500 text-slate-800 dark:text-slate-100 font-bold text-sm shadow-xs hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-[#005BAC]/20 transition-all duration-200 flex items-center justify-center gap-3 cursor-pointer disabled:opacity-50"
        >
          {isGoogleLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-[#005BAC]" />
              <span>Conectando com Google...</span>
            </>
          ) : (
            <>
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
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
                <label
                  htmlFor="forgot-email-input"
                  className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5"
                >
                  Seu e-mail institucional
                </label>
                <input
                  id="forgot-email-input"
                  type="email"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  placeholder="seu.email@escola.seduc.pa.gov.br"
                  required
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-[#005BAC]/30 focus:border-[#005BAC] dark:focus:border-sky-400 outline-none transition-all"
                />
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsForgotModalOpen(false);
                    setResetFeedback(null);
                  }}
                  className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                >
                  Fechar
                </button>
                <button
                  type="submit"
                  disabled={isSendingReset}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#005BAC] to-[#013780] hover:from-[#004e96] hover:to-[#012d6a] text-white font-bold text-xs shadow-md shadow-[#005BAC]/20 hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
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

      {/* Google Authentication - Unidade CISEB Selection Modal */}
      {googleOnboardingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="bg-gradient-to-r from-[#005BAC] to-[#013780] p-5 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center border border-white/20 shadow-xs">
                  <Building2 className="w-5 h-5 text-amber-300" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white">Selecione sua Unidade CISEB</h3>
                  <p className="text-xs text-sky-100">
                    Acesso institucional Google SEDUC/PA
                  </p>
                </div>
              </div>
              <button
                onClick={() => setGoogleOnboardingUser(null)}
                className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/15 transition-colors cursor-pointer"
                aria-label="Fechar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCompleteGoogleOnboarding} className="p-5 space-y-4 overflow-y-auto flex-1 text-slate-800 dark:text-slate-100">
              <div className="p-3 bg-sky-50 dark:bg-sky-950/40 rounded-2xl border border-sky-200/80 dark:border-sky-900/60 flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-sky-500 text-white font-bold flex items-center justify-center text-xs shrink-0 shadow-xs">
                  {googleOnboardingUser.nome.charAt(0)}
                </div>
                <div className="min-w-0 text-xs">
                  <p className="font-bold text-slate-900 dark:text-white truncate">
                    {googleOnboardingUser.nome}
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono truncate">
                    {googleOnboardingUser.email}
                  </p>
                </div>
              </div>

              <div>
                <label
                  htmlFor="google-user-name-input"
                  className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5"
                >
                  Confirmar Nome do(a) Formador(a)
                </label>
                <input
                  id="google-user-name-input"
                  type="text"
                  list="professores-login-options"
                  value={googleOnboardingUser.nome}
                  onChange={(e) =>
                    setGoogleOnboardingUser({
                      ...googleOnboardingUser,
                      nome: e.target.value.toUpperCase(),
                    })
                  }
                  required
                  placeholder="SEU NOME COMPLETO"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 dark:text-white uppercase focus:ring-2 focus:ring-[#005BAC]/30 focus:border-[#005BAC] dark:focus:border-sky-400 outline-none transition-all"
                />
                <datalist id="professores-login-options">
                  {PROFESSORES_FORMADORES_OPTIONS.map((p) => (
                    <option key={p} value={p} />
                  ))}
                </datalist>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Sua Unidade CISEB de Lotação:
                </label>

                {/* Filter */}
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Buscar unidade CISEB..."
                    value={googleUnitSearch}
                    onChange={(e) => setGoogleUnitSearch(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-8 pr-3 py-2 text-xs text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:ring-2 focus:ring-[#005BAC]/30 focus:border-[#005BAC] dark:focus:border-sky-400 outline-none transition-all"
                  />
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                </div>

                {/* List */}
                <div className="max-h-48 overflow-y-auto border border-slate-200 dark:border-slate-700 rounded-xl divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-800/40 shadow-inner">
                  {UNIDADES_CISEB_OPTIONS.filter((u) =>
                    u.toLowerCase().includes(googleUnitSearch.toLowerCase().trim())
                  ).map((u) => {
                    const isSelected = googleSelectedUnit === u;
                    return (
                      <button
                        key={u}
                        type="button"
                        onClick={() => setGoogleSelectedUnit(u)}
                        className={`w-full text-left px-3.5 py-2.5 text-xs transition-colors flex items-center justify-between gap-2 cursor-pointer ${
                          isSelected
                            ? 'bg-sky-50 dark:bg-sky-950/60 font-bold text-[#005BAC] dark:text-sky-300'
                            : 'hover:bg-slate-50 dark:hover:bg-slate-700/50 text-slate-700 dark:text-slate-200'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 truncate">
                          <School
                            className={`w-3.5 h-3.5 shrink-0 ${
                              isSelected ? 'text-[#005BAC] dark:text-sky-400' : 'text-slate-400'
                            }`}
                          />
                          <span className="truncate">{u}</span>
                        </div>
                        {isSelected && (
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#005BAC] dark:text-sky-400 shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="p-3 bg-amber-50/70 dark:bg-amber-950/30 rounded-xl border border-amber-200/60 dark:border-amber-900/40 flex items-start gap-2 text-[11px] text-amber-900 dark:text-amber-200">
                <ShieldCheck className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <p>
                  Esta unidade será vinculada ao seu e-mail institucional e atribuída aos seus novos planos pedagógicos.
                </p>
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setGoogleOnboardingUser(null)}
                  className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isCompletingGoogle || !googleSelectedUnit}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#005BAC] to-[#013780] hover:from-[#004e96] hover:to-[#012d6a] text-white font-bold text-xs uppercase tracking-wider shadow-md shadow-[#005BAC]/20 hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isCompletingGoogle ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Salvando...</span>
                    </>
                  ) : (
                    <>
                      <span>Confirmar e Entrar</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
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
