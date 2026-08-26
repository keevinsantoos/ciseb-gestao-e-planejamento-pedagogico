import React, { useState, useMemo, useEffect } from 'react';
import {
  CisebRegisteredAccount,
  UNIDADES_CISEB_OPTIONS,
  AuthUser,
} from '../types';
import { getRegisteredAccounts } from '../data/cisebAccounts';
import { subscribeAccounts } from '../services/firestoreService';
import {
  adminCreateAccount,
  adminUpdateAccount,
  adminResetPassword,
  adminDeleteAccount,
} from '../services/authService';
import {
  UserPlus,
  Mail,
  Lock,
  Building2,
  User,
  Shield,
  Search,
  CheckCircle2,
  AlertCircle,
  Trash2,
  Edit3,
  Copy,
  X,
  KeyRound,
  Filter,
  Sparkles,
  Loader2,
} from 'lucide-react';

interface AccountManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser?: AuthUser | null;
  onAccountsUpdated?: () => void;
}

const REQUIRED_DOMAIN = '@escola.seduc.pa.gov.br';

export const AccountManagerModal: React.FC<AccountManagerModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onAccountsUpdated,
}) => {
  const [accounts, setAccounts] = useState<CisebRegisteredAccount[]>(() => getRegisteredAccounts());
  const [activeTab, setActiveTab] = useState<'list' | 'create'>('list');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUnitFilter, setSelectedUnitFilter] = useState('ALL');

  // Loading & Feedback
  const [isLoadingAction, setIsLoadingAction] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

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

  // One-time Temporary Password Modal
  const [tempModal, setTempModal] = useState<{
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
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    const unsubscribe = subscribeAccounts((updated) => {
      if (updated && updated.length > 0) {
        setAccounts(updated);
        if (onAccountsUpdated) onAccountsUpdated();
      }
    });

    return () => unsubscribe();
  }, [isOpen, onAccountsUpdated]);

  const allAvailableUnits = useMemo(() => {
    const unitSet = new Set<string>(UNIDADES_CISEB_OPTIONS);
    accounts.forEach((acc) => {
      if (acc.unidadeCiseb) {
        unitSet.add(acc.unidadeCiseb);
      }
    });
    return Array.from(unitSet);
  }, [accounts]);

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

  if (!isOpen) return null;

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const finalUnit =
      newUnitType === 'select' ? newSelectedUnit : newCustomUnit.trim().toUpperCase();

    if (!newName.trim()) {
      setErrorMsg('Informe o nome completo.');
      return;
    }
    if (!finalUnit) {
      setErrorMsg('Informe a Unidade CISEB.');
      return;
    }
    if (!newEmailPrefix.trim()) {
      setErrorMsg('Informe o e-mail institucional.');
      return;
    }

    const cleanEmail = newEmailPrefix.includes('@')
      ? newEmailPrefix.trim().toLowerCase()
      : `${newEmailPrefix.trim().toLowerCase()}${REQUIRED_DOMAIN}`;

    if (!cleanEmail.endsWith(REQUIRED_DOMAIN)) {
      setErrorMsg(`O e-mail deve terminar com ${REQUIRED_DOMAIN}`);
      return;
    }

    setIsLoadingAction(true);
    const result = await adminCreateAccount({
      nome: newName.trim().toUpperCase(),
      unidadeCiseb: finalUnit,
      email: cleanEmail,
      role: newRole,
    });
    setIsLoadingAction(false);

    if (!result.success) {
      setErrorMsg(result.error || 'Erro ao criar conta no servidor.');
      return;
    }

    setNewName('');
    setNewEmailPrefix('');
    setNewCustomUnit('');

    if (result.tempPassword) {
      setTempModal({
        isOpen: true,
        nome: newName.trim().toUpperCase(),
        email: cleanEmail,
        tempPassword: result.tempPassword,
      });
    } else {
      setSuccessMsg(`Conta de ${cleanEmail} criada com sucesso!`);
    }

    setActiveTab('list');
  };

  const handleSaveEdit = async (id: string) => {
    setErrorMsg(null);
    setSuccessMsg(null);

    const finalUnit =
      editUnitType === 'select' ? editSelectedUnit : editCustomUnit.trim().toUpperCase();

    if (!editName.trim()) {
      setErrorMsg('O nome não pode estar em branco.');
      return;
    }

    setIsLoadingAction(true);
    const res = await adminUpdateAccount(id, {
      nome: editName.trim().toUpperCase(),
      unidadeCiseb: finalUnit,
      role: editRole,
    });
    setIsLoadingAction(false);

    if (!res.success) {
      setErrorMsg(res.error || 'Erro ao atualizar conta.');
      return;
    }

    setEditingAccountId(null);
    setSuccessMsg('Dados da conta atualizados com sucesso!');
  };

  const handleResetPassword = async (acc: CisebRegisteredAccount) => {
    if (
      !window.confirm(
        `Deseja gerar uma nova senha temporária forte para ${acc.nome} (${acc.email})?`
      )
    ) {
      return;
    }

    setErrorMsg(null);
    setSuccessMsg(null);
    setIsLoadingAction(true);
    const res = await adminResetPassword(acc.id, true);
    setIsLoadingAction(false);

    if (!res.success) {
      setErrorMsg(res.error || 'Erro ao redefinir senha.');
      return;
    }

    if (res.tempPassword) {
      setTempModal({
        isOpen: true,
        nome: acc.nome,
        email: acc.email,
        tempPassword: res.tempPassword,
        resetLink: res.resetLink,
      });
    } else {
      setSuccessMsg(`Link de redefinição de senha enviado para ${acc.email}.`);
    }
  };

  const handleDeleteAccount = async (acc: CisebRegisteredAccount) => {
    if (
      acc.email === 'ciseb.adm@escola.seduc.pa.gov.br' ||
      acc.email === 'ciseb.coordenacao@escola.seduc.pa.gov.br'
    ) {
      alert('As contas centrais da coordenação e monitoramento não podem ser excluídas.');
      return;
    }

    if (
      !window.confirm(
        `Tem certeza que deseja excluir permanentemente ${acc.nome} (${acc.email}) do sistema e do Firebase Auth?`
      )
    ) {
      return;
    }

    setErrorMsg(null);
    setSuccessMsg(null);
    setIsLoadingAction(true);
    const res = await adminDeleteAccount(acc.id);
    setIsLoadingAction(false);

    if (!res.success) {
      setErrorMsg(res.error || 'Erro ao excluir conta.');
      return;
    }

    setSuccessMsg(`Conta de ${acc.nome} removida com sucesso.`);
  };

  const handleCopyCredentials = () => {
    const text = `*CREDENCIAIS CISEB / SEDUC-PA*\n\nEducador(a): ${tempModal.nome}\nE-mail de Acesso: ${tempModal.email}\nSenha Temporária: ${tempModal.tempPassword}\n\n*Atenção:* Por segurança, altere sua senha no primeiro acesso ao sistema.`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 w-full max-w-4xl rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#005BAC] to-[#013780] p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center border border-white/20">
              <Shield className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h2 className="text-base font-black tracking-tight">
                Gerenciador de Lotações e Contas CISEB
              </h2>
              <p className="text-xs text-sky-100 font-medium">
                Controle de acessos, unidades e emissão de senhas temporárias
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-white/80 hover:text-white hover:bg-white/15 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex bg-slate-100 dark:bg-slate-800/80 p-2 border-b border-slate-200 dark:border-slate-700">
          <button
            onClick={() => setActiveTab('list')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'list'
                ? 'bg-white dark:bg-slate-700 text-[#005BAC] dark:text-sky-300 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Contas e Lotações ({filteredAccounts.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('create')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'create'
                ? 'bg-white dark:bg-slate-700 text-[#005BAC] dark:text-sky-300 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Cadastrar Nova Conta</span>
          </button>
        </div>

        {/* Alerts */}
        <div className="p-4 pb-0 space-y-2">
          {errorMsg && (
            <div className="p-3 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 rounded-2xl flex items-start gap-2 text-xs text-red-700 dark:text-red-300">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 rounded-2xl flex items-start gap-2 text-xs text-emerald-800 dark:text-emerald-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto flex-1 space-y-4">
          {activeTab === 'list' && (
            <div className="space-y-3">
              {/* Search and Filters */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Buscar por educador, e-mail ou unidade..."
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 dark:text-white outline-hidden focus:ring-2 focus:ring-[#005BAC]"
                  />
                </div>

                <div className="relative">
                  <Filter className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                  <select
                    value={selectedUnitFilter}
                    onChange={(e) => setSelectedUnitFilter(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 dark:text-white outline-hidden focus:ring-2 focus:ring-[#005BAC] cursor-pointer"
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

              {/* Table / List */}
              <div className="space-y-2">
                {filteredAccounts.map((acc) => {
                  const isEditing = editingAccountId === acc.id;
                  const isCoreAdmin =
                    acc.email === 'ciseb.adm@escola.seduc.pa.gov.br' ||
                    acc.email === 'ciseb.coordenacao@escola.seduc.pa.gov.br';

                  if (isEditing) {
                    return (
                      <div
                        key={acc.id}
                        className="p-4 bg-sky-50 dark:bg-slate-800 rounded-2xl border-2 border-[#005BAC] space-y-3"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-[#005BAC] dark:text-sky-300">
                            Editar Lotação / Perfil
                          </span>
                          <button
                            onClick={() => setEditingAccountId(null)}
                            className="text-slate-400 hover:text-slate-600 cursor-pointer"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <div>
                            <label className="text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase">
                              Nome do Educador(a)
                            </label>
                            <input
                              type="text"
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs uppercase"
                            />
                          </div>

                          <div>
                            <label className="text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase">
                              Unidade CISEB
                            </label>
                            <select
                              value={editSelectedUnit}
                              onChange={(e) => setEditSelectedUnit(e.target.value)}
                              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs"
                            >
                              {allAvailableUnits.map((u) => (
                                <option key={u} value={u}>
                                  {u}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>

                        <div className="flex justify-end gap-2 pt-1">
                          <button
                            onClick={() => setEditingAccountId(null)}
                            className="px-3 py-1.5 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 cursor-pointer"
                          >
                            Cancelar
                          </button>
                          <button
                            onClick={() => handleSaveEdit(acc.id)}
                            disabled={isLoadingAction}
                            className="px-3 py-1.5 text-xs font-bold rounded-xl bg-[#005BAC] text-white hover:bg-[#004e96] flex items-center gap-1 cursor-pointer"
                          >
                            {isLoadingAction && <Loader2 className="w-3 h-3 animate-spin" />}
                            <span>Salvar</span>
                          </button>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={acc.id}
                      className="p-3 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs"
                    >
                      <div className="space-y-0.5">
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
                        <div className="text-[10px] text-slate-600 dark:text-slate-300 flex items-center gap-1 font-medium">
                          <Building2 className="w-3 h-3 text-slate-400" />
                          <span>{acc.unidadeCiseb}</span>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                        <button
                          onClick={() => handleResetPassword(acc)}
                          disabled={isLoadingAction}
                          className="px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 rounded-xl text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                          title="Gerar nova senha temporária"
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
                          title="Editar"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>

                        {!isCoreAdmin && (
                          <button
                            onClick={() => handleDeleteAccount(acc)}
                            disabled={isLoadingAction}
                            className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/50 rounded-xl cursor-pointer"
                            title="Excluir"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'create' && (
            <form onSubmit={handleCreateAccount} className="space-y-3.5 max-w-xl mx-auto py-2">
              <div className="p-3 bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800 rounded-2xl text-xs text-sky-900 dark:text-sky-200">
                <p className="font-bold">Criação de Conta via Backend com Firebase Admin</p>
                <p className="text-[11px] text-slate-600 dark:text-slate-300">
                  Uma senha temporária forte será gerada no servidor e exigida a troca no primeiro acesso.
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
                  placeholder="Ex: PROFESSOR CARLOS ALBERTO"
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
                    {newUnitType === 'select' ? '+ Outra unidade' : 'Escolher da lista'}
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
                    placeholder="Ex: CISEB EE NOVA UNIDADE"
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
                    Perfil
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
                disabled={isLoadingAction}
                className="w-full py-3 px-4 rounded-xl bg-[#005BAC] hover:bg-[#004e96] text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-[#005BAC]/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isLoadingAction ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Cadastrando...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Criar Conta e Emitir Senha Temporária</span>
                  </>
                )}
              </button>
            </form>
          )}
        </div>

        {/* Temporary Password Modal */}
        {tempModal.isOpen && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in">
            <div className="bg-white dark:bg-slate-800 w-full max-w-md rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-700 overflow-hidden">
              <div className="bg-gradient-to-r from-emerald-600 to-teal-700 p-4 text-white flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-white/15 flex items-center justify-center">
                    <KeyRound className="w-4 h-4 text-amber-300" />
                  </div>
                  <h3 className="font-bold text-sm">Credenciais Emitidas</h3>
                </div>
                <button
                  onClick={() => setTempModal({ ...tempModal, isOpen: false })}
                  className="p-1 rounded-lg text-white/80 hover:text-white hover:bg-white/15 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-5 space-y-4 text-xs">
                <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl text-amber-900 dark:text-amber-200">
                  <p className="font-bold flex items-center gap-1.5">
                    <Shield className="w-4 h-4 text-amber-600" />
                    <span>Senha Temporária de Uso Único</span>
                  </p>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-1">
                    Copie e envie ao educador por canal institucional seguro.
                  </p>
                </div>

                <div className="bg-slate-50 dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2 font-mono">
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-bold">Educador(a):</span>
                    <p className="font-bold text-slate-900 dark:text-white font-sans">
                      {tempModal.nome}
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-bold">E-mail:</span>
                    <p className="font-bold text-[#005BAC] dark:text-sky-400">
                      {tempModal.email}
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-bold">Senha Temporária Gerada:</span>
                    <div className="p-2 bg-white dark:bg-slate-800 rounded-xl border border-slate-300 dark:border-slate-600 text-sm font-black tracking-wider text-emerald-600 dark:text-emerald-400 select-all">
                      {tempModal.tempPassword}
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setTempModal({ ...tempModal, isOpen: false })}
                    className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-50 cursor-pointer"
                  >
                    Fechar
                  </button>

                  <button
                    type="button"
                    onClick={handleCopyCredentials}
                    className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 cursor-pointer transition-all"
                  >
                    {copied ? (
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
    </div>
  );
};
