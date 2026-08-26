import React, { useState, useMemo } from 'react';
import { AuthUser, CisebRegisteredAccount, UNIDADES_CISEB_OPTIONS } from '../../types';
import { useAuth } from '../../hooks/useAuth';
import {
  adminCreateAccount,
  adminUpdateAccount,
  adminResetPassword,
  adminDeleteAccount,
} from '../../services/authService';
import {
  Shield,
  ShieldCheck,
  Lock,
  Mail,
  User,
  Building2,
  Search,
  Filter,
  UserPlus,
  Trash2,
  Edit3,
  Copy,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  RotateCcw,
  Eye,
  EyeOff,
  ArrowRight,
  Sparkles,
  Loader2,
  X,
} from 'lucide-react';

interface AdminAccountsPanelProps {
  accounts: CisebRegisteredAccount[];
  onAdminLoginSuccess?: (user: AuthUser) => void;
  onSwitchToLogin: () => void;
}

const REQUIRED_DOMAIN = '@escola.seduc.pa.gov.br';

export const AdminAccountsPanel: React.FC<AdminAccountsPanelProps> = ({
  accounts,
  onAdminLoginSuccess,
  onSwitchToLogin,
}) => {
  const { user, login, loginGoogle } = useAuth();

  // Determine if active user is an admin or coordinator
  const isAdminAuthenticated =
    user && (user.role === 'monitoramento' || user.role === 'coordenador');

  // Admin Login State if not authenticated
  const [adminEmail, setAdminEmail] = useState('ciseb.adm@escola.seduc.pa.gov.br');
  const [adminPassword, setAdminPassword] = useState('');
  const [showAdminPassword, setShowAdminPassword] = useState(false);
  const [isLoggingInAdmin, setIsLoggingInAdmin] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [adminLoginError, setAdminLoginError] = useState<string | null>(null);

  // Panel State
  const [activeTab, setActiveTab] = useState<'list' | 'create'>('list');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUnitFilter, setSelectedUnitFilter] = useState('ALL');
  const [actionLoading, setActionLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // New Account State
  const [newName, setNewName] = useState('');
  const [newUnitType, setNewUnitType] = useState<'select' | 'custom'>('select');
  const [newSelectedUnit, setNewSelectedUnit] = useState<string>(UNIDADES_CISEB_OPTIONS[0]);
  const [newCustomUnit, setNewCustomUnit] = useState('');
  const [newEmailPrefix, setNewEmailPrefix] = useState('');
  const [newRole, setNewRole] = useState<'formador' | 'coordenador' | 'monitoramento'>('formador');

  // Edit Account State
  const [editingAccountId, setEditingAccountId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editUnitType, setEditUnitType] = useState<'select' | 'custom'>('select');
  const [editSelectedUnit, setEditSelectedUnit] = useState<string>(UNIDADES_CISEB_OPTIONS[0]);
  const [editCustomUnit, setEditCustomUnit] = useState('');
  const [editRole, setEditRole] = useState<'formador' | 'coordenador' | 'monitoramento'>('formador');

  // Reveal Temporary Password Dialog
  const [tempPasswordModal, setTempPasswordModal] = useState<{
    isOpen: boolean;
    nome: string;
    email: string;
    tempPassword: string;
    resetLink?: string;
  }>({
    isOpen: false,
    nome: '',
    email: '',
    tempPassword: '',
  });
  const [copiedCredentials, setCopiedCredentials] = useState(false);

  // Dynamic available units list
  const allAvailableUnits = useMemo(() => {
    const unitSet = new Set<string>(UNIDADES_CISEB_OPTIONS);
    accounts.forEach((acc) => {
      if (acc.unidadeCiseb) {
        unitSet.add(acc.unidadeCiseb);
      }
    });
    return Array.from(unitSet);
  }, [accounts]);

  // Filtered Accounts
  const filteredAccounts = useMemo(() => {
    return accounts.filter((acc) => {
      const matchSearch =
        acc.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        acc.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        acc.unidadeCiseb.toLowerCase().includes(searchTerm.toLowerCase());
      const matchUnit =
        selectedUnitFilter === 'ALL' || acc.unidadeCiseb === selectedUnitFilter;
      return matchSearch && matchUnit;
    });
  }, [accounts, searchTerm, selectedUnitFilter]);

  const handleGoogleAdminLogin = async () => {
    setAdminLoginError(null);
    setIsGoogleLoading(true);
    try {
      const loggedUser = await loginGoogle();
      if (loggedUser.role !== 'monitoramento' && loggedUser.role !== 'coordenador') {
        setAdminLoginError('Esta conta Google institucional não possui privilégios de Monitoramento ou Coordenação.');
        return;
      }
      if (onAdminLoginSuccess) {
        onAdminLoginSuccess(loggedUser);
      }
    } catch (err: any) {
      setAdminLoginError(err.message || 'Erro ao autenticar com conta Google.');
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminLoginError(null);
    setIsLoggingInAdmin(true);
    try {
      const loggedUser = await login(adminEmail, adminPassword);
      if (loggedUser.role !== 'monitoramento' && loggedUser.role !== 'coordenador') {
        setAdminLoginError('Esta conta não possui perfil administrativo de Monitoramento ou Coordenação.');
        return;
      }
      if (onAdminLoginSuccess) {
        onAdminLoginSuccess(loggedUser);
      }
    } catch (err: any) {
      setAdminLoginError(err.message || 'Credenciais de monitoramento incorretas.');
    } finally {
      setIsLoggingInAdmin(false);
    }
  };

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    const finalUnit =
      newUnitType === 'select' ? newSelectedUnit : newCustomUnit.trim().toUpperCase();

    if (!newName.trim()) {
      setFeedback({ type: 'error', text: 'Informe o nome completo do educador.' });
      return;
    }
    if (!finalUnit) {
      setFeedback({ type: 'error', text: 'Informe a Unidade CISEB.' });
      return;
    }
    if (!newEmailPrefix.trim()) {
      setFeedback({ type: 'error', text: 'Informe o e-mail institucional.' });
      return;
    }

    const cleanEmail = newEmailPrefix.includes('@')
      ? newEmailPrefix.trim().toLowerCase()
      : `${newEmailPrefix.trim().toLowerCase()}${REQUIRED_DOMAIN}`;

    if (!cleanEmail.endsWith(REQUIRED_DOMAIN)) {
      setFeedback({
        type: 'error',
        text: `O e-mail deve terminar com ${REQUIRED_DOMAIN}`,
      });
      return;
    }

    setActionLoading(true);
    const result = await adminCreateAccount({
      nome: newName.trim().toUpperCase(),
      unidadeCiseb: finalUnit,
      email: cleanEmail,
      role: newRole,
    });
    setActionLoading(false);

    if (!result.success) {
      setFeedback({ type: 'error', text: result.error || 'Erro ao criar conta.' });
      return;
    }

    // Reset Form
    setNewName('');
    setNewEmailPrefix('');
    setNewCustomUnit('');

    // Open Temporary Password Modal
    if (result.tempPassword) {
      setTempPasswordModal({
        isOpen: true,
        nome: newName.trim().toUpperCase(),
        email: cleanEmail,
        tempPassword: result.tempPassword,
      });
    } else {
      setFeedback({
        type: 'success',
        text: `Conta de ${cleanEmail} cadastrada com sucesso!`,
      });
    }

    setActiveTab('list');
  };

  const handleSaveEdit = async (id: string) => {
    setFeedback(null);
    const finalUnit =
      editUnitType === 'select' ? editSelectedUnit : editCustomUnit.trim().toUpperCase();

    if (!editName.trim()) {
      setFeedback({ type: 'error', text: 'O nome não pode ficar vazio.' });
      return;
    }

    setActionLoading(true);
    const res = await adminUpdateAccount(id, {
      nome: editName.trim().toUpperCase(),
      unidadeCiseb: finalUnit,
      role: editRole,
    });
    setActionLoading(false);

    if (!res.success) {
      setFeedback({ type: 'error', text: res.error || 'Erro ao atualizar dados.' });
      return;
    }

    setEditingAccountId(null);
    setFeedback({ type: 'success', text: 'Dados da conta atualizados com sucesso!' });
  };

  const handleResetPassword = async (acc: CisebRegisteredAccount) => {
    if (
      !window.confirm(
        `Deseja gerar uma nova senha temporária forte para ${acc.nome} (${acc.email})?`
      )
    ) {
      return;
    }

    setFeedback(null);
    setActionLoading(true);
    const res = await adminResetPassword(acc.id, true);
    setActionLoading(false);

    if (!res.success) {
      setFeedback({ type: 'error', text: res.error || 'Erro ao redefinir senha.' });
      return;
    }

    if (res.tempPassword) {
      setTempPasswordModal({
        isOpen: true,
        nome: acc.nome,
        email: acc.email,
        tempPassword: res.tempPassword,
        resetLink: res.resetLink,
      });
    } else {
      setFeedback({
        type: 'success',
        text: `Instruções de redefinição de senha enviadas para ${acc.email}.`,
      });
    }
  };

  const handleDeleteAccount = async (acc: CisebRegisteredAccount) => {
    if (
      acc.email === 'ciseb.adm@escola.seduc.pa.gov.br' ||
      acc.email === 'ciseb.coordenacao@escola.seduc.pa.gov.br'
    ) {
      alert('As contas centrais de monitoramento e coordenação não podem ser excluídas.');
      return;
    }

    if (
      !window.confirm(
        `Tem certeza que deseja excluir permanentemente a conta de ${acc.nome} (${acc.email}) do sistema CISEB e do Firebase Auth?`
      )
    ) {
      return;
    }

    setFeedback(null);
    setActionLoading(true);
    const res = await adminDeleteAccount(acc.id);
    setActionLoading(false);

    if (!res.success) {
      setFeedback({ type: 'error', text: res.error || 'Erro ao excluir conta.' });
      return;
    }

    setFeedback({ type: 'success', text: `Conta de ${acc.nome} excluída com sucesso.` });
  };

  const copyTemporaryCredentials = () => {
    const text = `*CREDENCIAIS DE ACESSO CISEB / SEDUC-PA*\n\nEducador(a): ${tempPasswordModal.nome}\nE-mail de Acesso: ${tempPasswordModal.email}\nSenha Temporária: ${tempPasswordModal.tempPassword}\n\n*Atenção:* Por segurança, altere sua senha no primeiro acesso ao sistema.`;
    navigator.clipboard.writeText(text);
    setCopiedCredentials(true);
    setTimeout(() => setCopiedCredentials(false), 2500);
  };

  // If not authenticated as Admin, show login form
  if (!isAdminAuthenticated) {
    return (
      <div className="space-y-5 animate-in fade-in duration-200">
        <div className="p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/60 rounded-2xl flex items-start gap-3 text-xs text-amber-900 dark:text-amber-200">
          <div className="w-8 h-8 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0 text-amber-600 dark:text-amber-400 mt-0.5">
            <Shield className="w-4 h-4" />
          </div>
          <div className="space-y-0.5">
            <p className="font-bold text-amber-950 dark:text-amber-100">
              Painel de Gestão & Monitoramento CISEB
            </p>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-[11px]">
              Área restrita à equipe técnica da SEDUC/PA e Coordenação Geral para gerenciamento de lotações, contas e senhas.
            </p>
          </div>
        </div>

        {adminLoginError && (
          <div className="p-3.5 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 rounded-2xl flex items-start gap-2.5 text-xs text-red-700 dark:text-red-300">
            <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
            <span className="font-medium leading-tight">{adminLoginError}</span>
          </div>
        )}

        <form onSubmit={handleAdminLogin} className="space-y-3.5">
          <div className="space-y-1">
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              <span>E-mail Administrativo</span>
            </label>
            <input
              type="email"
              value={adminEmail}
              onChange={(e) => setAdminEmail(e.target.value)}
              placeholder="ciseb.adm@escola.seduc.pa.gov.br"
              required
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-xs font-mono text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-amber-500 outline-hidden"
            />
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                <span>Senha de Monitoramento</span>
              </label>
              <button
                type="button"
                onClick={() => setShowAdminPassword(!showAdminPassword)}
                className="text-[11px] font-bold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer flex items-center gap-1"
              >
                {showAdminPassword ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                <span>{showAdminPassword ? 'Ocultar' : 'Ver'}</span>
              </button>
            </div>
            <input
              type={showAdminPassword ? 'text' : 'password'}
              value={adminPassword}
              onChange={(e) => setAdminPassword(e.target.value)}
              placeholder="Digite a senha de monitoramento"
              required
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-xs font-mono text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-amber-500 outline-hidden"
            />
          </div>

          <button
            type="submit"
            disabled={isLoggingInAdmin || isGoogleLoading}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-amber-600/20 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isLoggingInAdmin ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Autenticando Administrador...</span>
              </>
            ) : (
              <>
                <span>Desbloquear com E-mail e Senha</span>
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
            onClick={handleGoogleAdminLogin}
            disabled={isLoggingInAdmin || isGoogleLoading}
            className="w-full py-2.5 px-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 font-bold text-xs shadow-sm hover:shadow transition-all flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-50"
          >
            {isGoogleLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-amber-600" />
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
                <span>Desbloquear com Google Institucional</span>
              </>
            )}
          </button>
        </form>

        {/* Operation Not Allowed Assistance Card if error indicates provider disabled */}
        {adminLoginError && adminLoginError.includes('Firebase Console') && (
          <div className="p-3.5 bg-amber-50 dark:bg-amber-950/50 border border-amber-300 dark:border-amber-700/80 rounded-2xl text-xs text-amber-900 dark:text-amber-200 space-y-1.5">
            <p className="font-bold flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              Como habilitar o login por E-mail/Senha:
            </p>
            <ol className="list-decimal list-inside space-y-1 text-[11px] text-amber-800 dark:text-amber-300 pl-1">
              <li>Acesse o <strong>Firebase Console</strong> do projeto.</li>
              <li>Vá em <strong>Authentication &gt; Sign-in method</strong>.</li>
              <li>Clique em <strong>Email/Password</strong> e marque <strong>Ativar (Enable)</strong>.</li>
              <li>Pronto! Ou use o botão de login Google Institucional acima.</li>
            </ol>
          </div>
        )}

        <div className="pt-2 text-center text-xs text-slate-600 dark:text-slate-400">
          <span>Voltar para </span>
          <button
            type="button"
            onClick={onSwitchToLogin}
            className="font-bold text-[#005BAC] dark:text-sky-400 hover:underline cursor-pointer"
          >
            Acesso Formador
          </button>
        </div>
      </div>
    );
  }

  // Authenticated Admin Panel View
  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      {/* Top Admin Status Bar */}
      <div className="p-3 bg-slate-900 text-white rounded-2xl flex items-center justify-between shadow-md">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-xs">{user?.nome}</span>
              <span className="px-1.5 py-0.5 bg-amber-500/20 text-amber-300 text-[9px] font-black rounded uppercase">
                {user?.role}
              </span>
            </div>
            <span className="text-[10px] text-slate-400 font-mono">{user?.email}</span>
          </div>
        </div>

        {onAdminLoginSuccess && (
          <button
            onClick={() => onAdminLoginSuccess(user!)}
            className="px-3 py-1.5 bg-[#005BAC] hover:bg-[#004e96] text-white text-[11px] font-bold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
          >
            <span>Acessar App</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex bg-slate-100 dark:bg-slate-800/80 p-1 rounded-2xl border border-slate-200 dark:border-slate-700">
        <button
          onClick={() => setActiveTab('list')}
          className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'list'
              ? 'bg-white dark:bg-slate-700 text-[#005BAC] dark:text-sky-300 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          <Building2 className="w-3.5 h-3.5" />
          <span>Contas Cadastradas ({filteredAccounts.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('create')}
          className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'create'
              ? 'bg-white dark:bg-slate-700 text-[#005BAC] dark:text-sky-300 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          <UserPlus className="w-3.5 h-3.5" />
          <span>Nova Conta Oficial</span>
        </button>
      </div>

      {/* Feedback Messages */}
      {feedback && (
        <div
          className={`p-3 rounded-2xl text-xs flex items-start gap-2.5 ${
            feedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
          )}
          <span className="font-medium">{feedback.text}</span>
        </div>
      )}

      {/* TAB 1: ACCOUNTS LIST */}
      {activeTab === 'list' && (
        <div className="space-y-3">
          {/* Filters */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por nome ou e-mail..."
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 dark:text-white outline-hidden focus:ring-2 focus:ring-[#005BAC]"
              />
            </div>

            <div className="relative">
              <Filter className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
              <select
                value={selectedUnitFilter}
                onChange={(e) => setSelectedUnitFilter(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs font-medium text-slate-900 dark:text-white outline-hidden focus:ring-2 focus:ring-[#005BAC] cursor-pointer"
              >
                <option value="ALL">Todas as Unidades CISEB</option>
                {allAvailableUnits.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Accounts List Items */}
          <div className="max-h-[360px] overflow-y-auto space-y-2 pr-1">
            {filteredAccounts.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 text-slate-500 text-xs">
                Nenhuma conta encontrada para o filtro informado.
              </div>
            ) : (
              filteredAccounts.map((acc) => {
                const isEditing = editingAccountId === acc.id;
                const isCoreAdmin =
                  acc.email === 'ciseb.adm@escola.seduc.pa.gov.br' ||
                  acc.email === 'ciseb.coordenacao@escola.seduc.pa.gov.br';

                if (isEditing) {
                  return (
                    <div
                      key={acc.id}
                      className="p-4 bg-sky-50/70 dark:bg-slate-800 rounded-2xl border-2 border-[#005BAC] space-y-3 animate-in fade-in"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[#005BAC] dark:text-sky-300">
                          Editando Dados do Usuário
                        </span>
                        <button
                          onClick={() => setEditingAccountId(null)}
                          className="text-slate-400 hover:text-slate-600 cursor-pointer"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="space-y-2">
                        <div>
                          <label className="text-[10px] font-bold text-slate-600 uppercase">
                            Nome Completo
                          </label>
                          <input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs uppercase font-medium"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] font-bold text-slate-600 uppercase">
                            Unidade CISEB
                          </label>
                          <select
                            value={editSelectedUnit}
                            onChange={(e) => setEditSelectedUnit(e.target.value)}
                            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs font-medium"
                          >
                            {allAvailableUnits.map((u) => (
                              <option key={u} value={u}>
                                {u}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="text-[10px] font-bold text-slate-600 uppercase">
                            Perfil
                          </label>
                          <select
                            value={editRole}
                            onChange={(e) => setEditRole(e.target.value as any)}
                            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs font-medium"
                          >
                            <option value="formador">Professor Formador</option>
                            <option value="coordenador">Coordenação CISEB</option>
                            <option value="monitoramento">Equipe de Monitoramento</option>
                          </select>
                        </div>
                      </div>

                      <div className="flex justify-end gap-2 pt-1">
                        <button
                          onClick={() => setEditingAccountId(null)}
                          className="px-3 py-1.5 text-xs font-bold rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 cursor-pointer"
                        >
                          Cancelar
                        </button>
                        <button
                          onClick={() => handleSaveEdit(acc.id)}
                          disabled={actionLoading}
                          className="px-3 py-1.5 text-xs font-bold rounded-xl bg-[#005BAC] text-white hover:bg-[#004e96] flex items-center gap-1 cursor-pointer"
                        >
                          {actionLoading && <Loader2 className="w-3 h-3 animate-spin" />}
                          <span>Salvar Alterações</span>
                        </button>
                      </div>
                    </div>
                  );
                }

                return (
                  <div
                    key={acc.id}
                    className="p-3 bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-200 dark:border-slate-700/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-slate-900 dark:text-white">
                          {acc.nome}
                        </span>
                        <span
                          className={`px-1.5 py-0.5 text-[9px] font-black rounded uppercase ${
                            acc.role === 'monitoramento'
                              ? 'bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300'
                              : acc.role === 'coordenador'
                              ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                              : 'bg-sky-100 text-[#005BAC] dark:bg-sky-950/60 dark:text-sky-300'
                          }`}
                        >
                          {acc.role}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                        {acc.email}
                      </div>
                      <div className="text-[10px] text-slate-600 dark:text-slate-300 font-medium flex items-center gap-1">
                        <Building2 className="w-3 h-3 text-slate-400" />
                        <span>{acc.unidadeCiseb}</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                      <button
                        onClick={() => handleResetPassword(acc)}
                        disabled={actionLoading}
                        className="px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:hover:bg-amber-900/60 text-amber-800 dark:text-amber-300 rounded-xl text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer"
                        title="Gerar nova senha temporária forte"
                      >
                        <KeyRound className="w-3 h-3 text-amber-600" />
                        <span>Redefinir Senha</span>
                      </button>

                      <button
                        onClick={() => {
                          setEditingAccountId(acc.id);
                          setEditName(acc.nome);
                          setEditSelectedUnit(acc.unidadeCiseb);
                          setEditRole(acc.role);
                        }}
                        className="p-1.5 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl cursor-pointer"
                        title="Editar Informações"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>

                      {!isCoreAdmin && (
                        <button
                          onClick={() => handleDeleteAccount(acc)}
                          disabled={actionLoading}
                          className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/50 rounded-xl cursor-pointer"
                          title="Excluir Conta"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* TAB 2: CREATE NEW ACCOUNT */}
      {activeTab === 'create' && (
        <form onSubmit={handleCreateAccount} className="space-y-3.5 animate-in fade-in">
          <div className="p-3 bg-sky-50 dark:bg-sky-950/40 border border-sky-200 rounded-2xl text-xs text-sky-900 dark:text-sky-200">
            <p className="font-bold">Cadastro Oficial com Senha Temporária Automática</p>
            <p className="text-[11px] text-slate-600 dark:text-slate-300">
              O servidor gerará uma senha temporária forte de 14 caracteres e exigirá a troca no primeiro acesso.
            </p>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Nome Completo do Educador(a)
            </label>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Ex: PROFESSOR CARLOS ALBERTO BRITO"
              required
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs uppercase"
            />
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Unidade CISEB
              </label>
              <button
                type="button"
                onClick={() => setNewUnitType(newUnitType === 'select' ? 'custom' : 'select')}
                className="text-[10px] font-bold text-[#005BAC] hover:underline cursor-pointer"
              >
                {newUnitType === 'select' ? '+ Digitar nova unidade' : 'Escolher da lista'}
              </button>
            </div>

            {newUnitType === 'select' ? (
              <select
                value={newSelectedUnit}
                onChange={(e) => setNewSelectedUnit(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold"
              >
                {allAvailableUnits.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                value={newCustomUnit}
                onChange={(e) => setNewCustomUnit(e.target.value)}
                placeholder="Ex: CISEB EE NOVA UNIDADE REGIONAL"
                required
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs uppercase"
              />
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                E-mail Institucional
              </label>
              <input
                type="text"
                value={newEmailPrefix}
                onChange={(e) => setNewEmailPrefix(e.target.value)}
                placeholder="nome.sobrenome@escola.seduc.pa.gov.br"
                required
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Perfil de Acesso
              </label>
              <select
                value={newRole}
                onChange={(e) => setNewRole(e.target.value as any)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold"
              >
                <option value="formador">Professor Formador</option>
                <option value="coordenador">Coordenação CISEB</option>
                <option value="monitoramento">Equipe de Monitoramento</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={actionLoading}
            className="w-full py-3 px-4 rounded-xl bg-[#005BAC] hover:bg-[#004e96] text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-[#005BAC]/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {actionLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Criando Conta e Credenciais...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Criar Conta e Gerar Senha Segura</span>
              </>
            )}
          </button>
        </form>
      )}

      {/* Temporary Password Dialog */}
      {tempPasswordModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-800 w-full max-w-md rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-700 overflow-hidden">
            <div className="bg-gradient-to-r from-emerald-600 to-teal-700 p-4 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-white/15 flex items-center justify-center">
                  <KeyRound className="w-4 h-4 text-amber-300" />
                </div>
                <h3 className="font-bold text-sm">Credenciais Criadas com Sucesso</h3>
              </div>
              <button
                onClick={() => setTempPasswordModal({ ...tempPasswordModal, isOpen: false })}
                className="p-1 rounded-lg text-white/80 hover:text-white hover:bg-white/15 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl text-amber-900 dark:text-amber-200">
                <p className="font-bold flex items-center gap-1.5">
                  <Shield className="w-4 h-4 text-amber-600" />
                  <span>Aviso de Segurança</span>
                </p>
                <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-1">
                  Esta senha temporária não será exibida novamente em texto puro. Copie e envie para o educador através de canal institucional seguro.
                </p>
              </div>

              <div className="bg-slate-50 dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2 font-mono">
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-bold">Educador(a):</span>
                  <p className="font-bold text-slate-900 dark:text-white font-sans">
                    {tempPasswordModal.nome}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-bold">E-mail de Acesso:</span>
                  <p className="font-bold text-[#005BAC] dark:text-sky-400">
                    {tempPasswordModal.email}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-bold">Senha Temporária Gerada:</span>
                  <div className="p-2 bg-white dark:bg-slate-800 rounded-xl border border-slate-300 dark:border-slate-600 text-sm font-black tracking-wider text-emerald-600 dark:text-emerald-400 select-all">
                    {tempPasswordModal.tempPassword}
                  </div>
                </div>
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setTempPasswordModal({ ...tempPasswordModal, isOpen: false })}
                  className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-50 cursor-pointer"
                >
                  Concluir
                </button>

                <button
                  type="button"
                  onClick={copyTemporaryCredentials}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 cursor-pointer transition-all"
                >
                  {copiedCredentials ? (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Copiado!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>Copiar Credenciais</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
