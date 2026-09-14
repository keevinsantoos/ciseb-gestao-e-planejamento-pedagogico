import React, { useState, useMemo, useEffect } from 'react';
import {
  CisebRegisteredAccount,
  UNIDADES_CISEB_OPTIONS,
  AuthUser,
} from '../types';
import { getRegisteredAccounts } from '../data/cisebAccounts';
import { subscribeAccounts } from '../services/firestoreService';
import { findEscolaByNameOrUnit } from '../services/escolasService';
import {
  adminCreateAccount,
  adminUpdateAccount,
  adminResetPassword,
  adminDeleteAccount,
} from '../services/authService';
import {
  UserPlus,
  Building2,
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
  ArrowRightLeft,
  GraduationCap,
  Crown,
  School,
  BarChart3,
  Users,
  Check,
  Power,
  Lock,
  UserCheck,
  UserX,
  AlertTriangle,
  Layers,
  TrendingUp,
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
  const [activeTab, setActiveTab] = useState<'list' | 'create' | 'stats'>('list');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUnitFilter, setSelectedUnitFilter] = useState('ALL');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<'ALL' | 'formador' | 'monitoramento' | 'coordenador'>('ALL');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<'ALL' | 'ativo' | 'inativo'>('ALL');

  // Role permissions
  const isMonitoramento = currentUser?.role === 'monitoramento';
  const isCoordenador = currentUser?.role === 'coordenador';
  const coordinatorUnit = currentUser?.unidadeCiseb || '';

  // Loading & Feedback
  const [isLoadingAction, setIsLoadingAction] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // New Account State
  const [newName, setNewName] = useState('');
  const [newUnitType, setNewUnitType] = useState<'select' | 'custom'>('select');
  const [newSelectedUnit, setNewSelectedUnit] = useState<string>(
    isCoordenador && coordinatorUnit ? coordinatorUnit : UNIDADES_CISEB_OPTIONS[0]
  );
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

  // Set default unit for coordinator when opening
  useEffect(() => {
    if (isCoordenador && coordinatorUnit) {
      setNewSelectedUnit(coordinatorUnit);
      setSelectedUnitFilter(coordinatorUnit);
    }
  }, [isCoordenador, coordinatorUnit]);

  // Accounts scoped by permissions
  const scopedAccounts = useMemo(() => {
    if (isCoordenador && coordinatorUnit) {
      return accounts.filter((acc) => acc.unidadeCiseb === coordinatorUnit);
    }
    return accounts;
  }, [accounts, isCoordenador, coordinatorUnit]);

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
    return scopedAccounts.filter((acc) => {
      const matchSearch =
        acc.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        acc.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        acc.unidadeCiseb.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchUnit =
        isCoordenador
          ? acc.unidadeCiseb === coordinatorUnit
          : selectedUnitFilter === 'ALL' || acc.unidadeCiseb === selectedUnitFilter;

      const matchRole =
        selectedRoleFilter === 'ALL' || acc.role === selectedRoleFilter;

      const matchStatus =
        selectedStatusFilter === 'ALL' ||
        (selectedStatusFilter === 'ativo' ? acc.status !== 'inativo' : acc.status === 'inativo');

      return matchSearch && matchUnit && matchRole && matchStatus;
    });
  }, [
    scopedAccounts,
    searchTerm,
    selectedUnitFilter,
    selectedRoleFilter,
    selectedStatusFilter,
    isCoordenador,
    coordinatorUnit,
  ]);

  // Statistics Calculation
  const statistics = useMemo(() => {
    const total = scopedAccounts.length;
    const ativos = scopedAccounts.filter((a) => a.status !== 'inativo').length;
    const inativos = scopedAccounts.filter((a) => a.status === 'inativo').length;

    const formadoresCount = scopedAccounts.filter((a) => a.role === 'formador').length;
    const coordenadoresCount = scopedAccounts.filter((a) => a.role === 'coordenador').length;
    const monitoramentoCount = scopedAccounts.filter((a) => a.role === 'monitoramento').length;

    // By Unit Breakdown
    const unitMap: Record<string, number> = {};
    scopedAccounts.forEach((a) => {
      const unit = a.unidadeCiseb || 'Não informada';
      unitMap[unit] = (unitMap[unit] || 0) + 1;
    });

    const unitRanking = Object.entries(unitMap)
      .map(([unit, count]) => ({ unit, count }))
      .sort((a, b) => b.count - a.count);

    return {
      total,
      ativos,
      inativos,
      formadoresCount,
      coordenadoresCount,
      monitoramentoCount,
      unitRanking,
    };
  }, [scopedAccounts]);

  const handleQuickChangeRole = async (
    acc: CisebRegisteredAccount,
    targetRole: 'formador' | 'coordenador' | 'monitoramento'
  ) => {
    if (acc.role === targetRole) return;

    if (isCoordenador && targetRole !== 'formador') {
      alert('Coordenadores só podem gerenciar formadores da sua unidade.');
      return;
    }

    const roleName =
      targetRole === 'monitoramento'
        ? 'EQUIPE DE MONITORAMENTO'
        : targetRole === 'coordenador'
        ? 'COORDENAÇÃO CISEB'
        : 'PROFESSOR FORMADOR';

    if (
      !window.confirm(
        `Deseja alterar a função de ${acc.nome} (${acc.email}) para "${roleName}"?`
      )
    ) {
      return;
    }

    setErrorMsg(null);
    setSuccessMsg(null);
    setActionLoadingId(acc.id);
    setIsLoadingAction(true);
    const res = await adminUpdateAccount(acc.id, {
      role: targetRole,
    });
    setIsLoadingAction(false);
    setActionLoadingId(null);

    if (!res.success) {
      setErrorMsg(res.error || 'Erro ao alterar função.');
      return;
    }

    setSuccessMsg(`Função de ${acc.nome} alterada para ${roleName} com sucesso!`);
  };

  const handleToggleStatus = async (acc: CisebRegisteredAccount) => {
    const isCurrentlyActive = acc.status !== 'inativo';
    const nextStatus = isCurrentlyActive ? 'inativo' : 'ativo';
    const nextStatusLabel = nextStatus === 'ativo' ? 'ATIVAR' : 'DESATIVAR';

    if (
      !window.confirm(
        `Deseja ${nextStatusLabel} a conta de ${acc.nome} (${acc.email})?`
      )
    ) {
      return;
    }

    setErrorMsg(null);
    setSuccessMsg(null);
    setActionLoadingId(acc.id);
    setIsLoadingAction(true);

    const res = await adminUpdateAccount(acc.id, {
      status: nextStatus,
    });

    setIsLoadingAction(false);
    setActionLoadingId(null);

    if (!res.success) {
      setErrorMsg(res.error || `Erro ao ${nextStatusLabel.toLowerCase()} conta.`);
      return;
    }

    setSuccessMsg(
      `Conta de ${acc.nome} foi ${nextStatus === 'ativo' ? 'ativada' : 'desativada'} com sucesso.`
    );
  };

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    let finalUnit = isCoordenador
      ? coordinatorUnit
      : newUnitType === 'select'
      ? newSelectedUnit
      : newCustomUnit.trim().toUpperCase();

    const finalRole = isCoordenador ? 'formador' : newRole;

    if (!newName.trim()) {
      setErrorMsg('Informe o nome completo do educador(a).');
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
    const escola = findEscolaByNameOrUnit(finalUnit);
    const result = await adminCreateAccount({
      nome: newName.trim().toUpperCase(),
      escolaId: escola.id,
      unidadeCiseb: escola.nome,
      email: cleanEmail,
      role: finalRole,
    });
    setIsLoadingAction(false);

    if (!result.success) {
      setErrorMsg(result.error || 'Erro ao criar conta no servidor.');
      return;
    }

    setNewName('');
    setNewEmailPrefix('');
    setNewCustomUnit('');

    setSuccessMsg(`Conta institucional de ${cleanEmail} vinculada à escola ${escola.nome} com sucesso!`);
    setActiveTab('list');
  };

  const handleSaveEdit = async (id: string) => {
    setErrorMsg(null);
    setSuccessMsg(null);

    const finalUnit = isCoordenador
      ? coordinatorUnit
      : editUnitType === 'select'
      ? editSelectedUnit
      : editCustomUnit.trim().toUpperCase();

    const finalRole = isCoordenador ? 'formador' : editRole;

    if (!editName.trim()) {
      setErrorMsg('O nome não pode estar em branco.');
      return;
    }

    setIsLoadingAction(true);
    const escola = findEscolaByNameOrUnit(finalUnit);
    const res = await adminUpdateAccount(id, {
      nome: editName.trim().toUpperCase(),
      escolaId: escola.id,
      unidadeCiseb: escola.nome,
      role: finalRole,
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
    if (isCoordenador && acc.role !== 'formador') {
      alert('Coordenadores só podem redefinir senha de formadores da própria unidade.');
      return;
    }

    if (
      !window.confirm(
        `Deseja gerar uma nova senha temporária forte para ${acc.nome} (${acc.email})?`
      )
    ) {
      return;
    }

    setErrorMsg(null);
    setSuccessMsg(null);
    setActionLoadingId(acc.id);
    setIsLoadingAction(true);
    const res = await adminResetPassword(acc.id, true);
    setIsLoadingAction(false);
    setActionLoadingId(null);

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
      setSuccessMsg(`Link de redefinição de senha gerado para ${acc.email}.`);
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

    if (isCoordenador && acc.role !== 'formador') {
      alert('Coordenadores só têm permissão para gerenciar contas de formadores.');
      return;
    }

    if (
      !window.confirm(
        `Tem certeza que deseja excluir permanentemente ${acc.nome} (${acc.email}) do sistema?`
      )
    ) {
      return;
    }

    setErrorMsg(null);
    setSuccessMsg(null);
    setActionLoadingId(acc.id);
    setIsLoadingAction(true);
    const res = await adminDeleteAccount(acc.id);
    setIsLoadingAction(false);
    setActionLoadingId(null);

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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 w-full max-w-4xl rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#005BAC] to-[#013780] p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center border border-white/20">
              {isCoordenador ? (
                <Crown className="w-5 h-5 text-amber-300" />
              ) : (
                <Shield className="w-5 h-5 text-amber-300" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black tracking-tight">
                  {isCoordenador ? 'Gestão de Formadores CISEB' : 'Gerenciador de Contas e Lotações CISEB'}
                </h2>
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/15 text-white border border-white/20">
                  {isCoordenador ? 'Coordenação' : 'Monitoramento'}
                </span>
              </div>
              <p className="text-xs text-sky-100 font-medium">
                {isCoordenador
                  ? `Unidade: ${coordinatorUnit || 'Sua Unidade CISEB'}`
                  : 'Controle geral de acessos, unidades e emissão de senhas temporárias'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-white/80 hover:text-white hover:bg-white/15 cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex bg-slate-100 dark:bg-slate-800/80 p-2 border-b border-slate-200 dark:border-slate-700 gap-1">
          <button
            onClick={() => setActiveTab('list')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'list'
                ? 'bg-white dark:bg-slate-700 text-[#005BAC] dark:text-sky-300 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
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
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Cadastrar Conta</span>
          </button>

          <button
            onClick={() => setActiveTab('stats')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'stats'
                ? 'bg-white dark:bg-slate-700 text-[#005BAC] dark:text-sky-300 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Estatísticas</span>
          </button>
        </div>

        {/* Coordinator Unit Notice */}
        {isCoordenador && coordinatorUnit && (
          <div className="bg-amber-50 dark:bg-amber-950/40 border-b border-amber-200 dark:border-amber-900/40 px-4 py-2 flex items-center justify-between text-xs text-amber-900 dark:text-amber-200">
            <div className="flex items-center gap-2">
              <School className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
              <span>
                Escopo restrito à sua lotação: <strong>{coordinatorUnit}</strong>
              </span>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-200/60 dark:bg-amber-900/60 px-2 py-0.5 rounded-full text-amber-800 dark:text-amber-200">
              Formadores Locais
            </span>
          </div>
        )}

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

        {/* Content Tabs */}
        <div className="p-4 overflow-y-auto flex-1 space-y-4">
          {/* TAB 1: LIST & MANAGEMENT */}
          {activeTab === 'list' && (
            <div className="space-y-3">
              {/* Search and Filters Bar */}
              <div className="space-y-2">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div className="relative sm:col-span-2">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Buscar por educador, e-mail ou unidade..."
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-[#005BAC]"
                    />
                  </div>

                  <div className="relative">
                    <Filter className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                    <select
                      value={isCoordenador ? coordinatorUnit : selectedUnitFilter}
                      disabled={isCoordenador}
                      onChange={(e) => setSelectedUnitFilter(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-[#005BAC] cursor-pointer disabled:opacity-75"
                    >
                      {isCoordenador ? (
                        <option value={coordinatorUnit}>{coordinatorUnit}</option>
                      ) : (
                        <>
                          <option value="ALL">Todas as Unidades CISEB</option>
                          {allAvailableUnits.map((u) => (
                            <option key={u} value={u}>
                              {u}
                            </option>
                          ))}
                        </>
                      )}
                    </select>
                  </div>
                </div>

                {/* Quick Filters (Role & Status) */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-[10px] font-bold uppercase text-slate-400 dark:text-slate-500 mr-1 flex items-center gap-1">
                      <Shield className="w-3 h-3" /> Função:
                    </span>

                    <button
                      type="button"
                      onClick={() => setSelectedRoleFilter('ALL')}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                        selectedRoleFilter === 'ALL'
                          ? 'bg-[#005BAC] text-white shadow-xs'
                          : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      Todos ({scopedAccounts.length})
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedRoleFilter('formador')}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer ${
                        selectedRoleFilter === 'formador'
                          ? 'bg-sky-600 text-white shadow-xs'
                          : 'bg-sky-50 hover:bg-sky-100 dark:bg-sky-950/40 text-sky-800 dark:text-sky-300'
                      }`}
                    >
                      <GraduationCap className="w-3 h-3" />
                      <span>Formadores ({scopedAccounts.filter((a) => a.role === 'formador').length})</span>
                    </button>

                    {isMonitoramento && (
                      <>
                        <button
                          type="button"
                          onClick={() => setSelectedRoleFilter('monitoramento')}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer ${
                            selectedRoleFilter === 'monitoramento'
                              ? 'bg-purple-600 text-white shadow-xs'
                              : 'bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/40 text-purple-800 dark:text-purple-300'
                          }`}
                        >
                          <Shield className="w-3 h-3" />
                          <span>Monitoramento ({scopedAccounts.filter((a) => a.role === 'monitoramento').length})</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setSelectedRoleFilter('coordenador')}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer ${
                            selectedRoleFilter === 'coordenador'
                              ? 'bg-amber-600 text-white shadow-xs'
                              : 'bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300'
                          }`}
                        >
                          <Crown className="w-3 h-3" />
                          <span>Coordenação ({scopedAccounts.filter((a) => a.role === 'coordenador').length})</span>
                        </button>
                      </>
                    )}
                  </div>

                  {/* Status Filter */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold uppercase text-slate-400 dark:text-slate-500 mr-1 flex items-center gap-1">
                      <Power className="w-3 h-3" /> Status:
                    </span>
                    <button
                      type="button"
                      onClick={() => setSelectedStatusFilter('ALL')}
                      className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                        selectedStatusFilter === 'ALL'
                          ? 'bg-slate-700 text-white'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      Todos
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedStatusFilter('ativo')}
                      className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                        selectedStatusFilter === 'ativo'
                          ? 'bg-emerald-600 text-white'
                          : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300'
                      }`}
                    >
                      Ativos
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedStatusFilter('inativo')}
                      className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                        selectedStatusFilter === 'inativo'
                          ? 'bg-red-600 text-white'
                          : 'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300'
                      }`}
                    >
                      Inativos
                    </button>
                  </div>
                </div>
              </div>

              {/* Accounts List */}
              <div className="space-y-2.5">
                {filteredAccounts.length === 0 ? (
                  <div className="p-8 text-center bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400">
                    <Users className="w-8 h-8 mx-auto mb-2 opacity-40 text-slate-400" />
                    <p className="text-xs font-bold">Nenhuma conta encontrada com os filtros selecionados.</p>
                  </div>
                ) : (
                  filteredAccounts.map((acc) => {
                    const isEditing = editingAccountId === acc.id;
                    const isCoreAdmin =
                      acc.email === 'ciseb.adm@escola.seduc.pa.gov.br' ||
                      acc.email === 'ciseb.coordenacao@escola.seduc.pa.gov.br';
                    const isActive = acc.status !== 'inativo';
                    const isRowLoading = actionLoadingId === acc.id;

                    if (isEditing) {
                      return (
                        <div
                          key={acc.id}
                          className="p-4 bg-sky-50/80 dark:bg-slate-800/90 rounded-2xl border-2 border-[#005BAC] space-y-3.5 shadow-md animate-in fade-in"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Shield className="w-4 h-4 text-[#005BAC] dark:text-sky-400" />
                              <span className="text-xs font-black text-[#005BAC] dark:text-sky-300 uppercase tracking-wide">
                                Editar Perfil e Lotação
                              </span>
                            </div>
                            <button
                              onClick={() => setEditingAccountId(null)}
                              className="text-slate-400 hover:text-slate-600 cursor-pointer"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <label className="text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase">
                                Nome do Educador(a)
                              </label>
                              <input
                                type="text"
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs uppercase font-medium focus:ring-2 focus:ring-[#005BAC]"
                              />
                            </div>

                            <div>
                              <label className="text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase">
                                Unidade CISEB de Lotação
                              </label>
                              <select
                                value={isCoordenador ? coordinatorUnit : editSelectedUnit}
                                disabled={isCoordenador}
                                onChange={(e) => setEditSelectedUnit(e.target.value)}
                                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold focus:ring-2 focus:ring-[#005BAC] disabled:opacity-75"
                              >
                                {isCoordenador ? (
                                  <option value={coordinatorUnit}>{coordinatorUnit}</option>
                                ) : (
                                  allAvailableUnits.map((u) => (
                                    <option key={u} value={u}>
                                      {u}
                                    </option>
                                  ))
                                )}
                              </select>
                            </div>
                          </div>

                          {/* Role selection in Edit Form (Monitoring only) */}
                          {isMonitoramento && (
                            <div className="space-y-1.5">
                              <label className="text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase flex items-center gap-1.5">
                                <Shield className="w-3.5 h-3.5 text-[#005BAC]" />
                                <span>Função / Nível de Acesso:</span>
                              </label>

                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                <label
                                  className={`p-2.5 rounded-xl border cursor-pointer transition-all flex flex-col gap-1 ${
                                    editRole === 'formador'
                                      ? 'bg-sky-100/90 dark:bg-sky-950/60 border-sky-500 shadow-xs'
                                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                                  }`}
                                >
                                  <div className="flex items-center gap-1.5">
                                    <input
                                      type="radio"
                                      name={`editRole_${acc.id}`}
                                      value="formador"
                                      checked={editRole === 'formador'}
                                      onChange={() => setEditRole('formador')}
                                      className="text-[#005BAC]"
                                    />
                                    <GraduationCap className="w-3.5 h-3.5 text-sky-600" />
                                    <span className="text-[11px] font-black text-slate-900 dark:text-white uppercase">
                                      Formador
                                    </span>
                                  </div>
                                  <span className="text-[10px] text-slate-500 dark:text-slate-400 pl-5">
                                    Acesso ao formulário e planos da própria unidade
                                  </span>
                                </label>

                                <label
                                  className={`p-2.5 rounded-xl border cursor-pointer transition-all flex flex-col gap-1 ${
                                    editRole === 'monitoramento'
                                      ? 'bg-purple-100/90 dark:bg-purple-950/60 border-purple-500 shadow-xs'
                                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                                  }`}
                                >
                                  <div className="flex items-center gap-1.5">
                                    <input
                                      type="radio"
                                      name={`editRole_${acc.id}`}
                                      value="monitoramento"
                                      checked={editRole === 'monitoramento'}
                                      onChange={() => setEditRole('monitoramento')}
                                      className="text-purple-600"
                                    />
                                    <Shield className="w-3.5 h-3.5 text-purple-600" />
                                    <span className="text-[11px] font-black text-purple-900 dark:text-purple-300 uppercase">
                                      Monitoramento
                                    </span>
                                  </div>
                                  <span className="text-[10px] text-slate-500 dark:text-slate-400 pl-5">
                                    Acesso global SEDUC/PA e todas as unidades
                                  </span>
                                </label>

                                <label
                                  className={`p-2.5 rounded-xl border cursor-pointer transition-all flex flex-col gap-1 ${
                                    editRole === 'coordenador'
                                      ? 'bg-amber-100/90 dark:bg-amber-950/60 border-amber-500 shadow-xs'
                                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                                  }`}
                                >
                                  <div className="flex items-center gap-1.5">
                                    <input
                                      type="radio"
                                      name={`editRole_${acc.id}`}
                                      value="coordenador"
                                      checked={editRole === 'coordenador'}
                                      onChange={() => setEditRole('coordenador')}
                                      className="text-amber-600"
                                    />
                                    <Crown className="w-3.5 h-3.5 text-amber-600" />
                                    <span className="text-[11px] font-black text-amber-900 dark:text-amber-300 uppercase">
                                      Coordenação
                                    </span>
                                  </div>
                                  <span className="text-[10px] text-slate-500 dark:text-slate-400 pl-5">
                                    Gestão pedagógica da unidade e painel
                                  </span>
                                </label>
                              </div>
                            </div>
                          )}

                          <div className="flex justify-end gap-2 pt-1">
                            <button
                              onClick={() => setEditingAccountId(null)}
                              className="px-3 py-1.5 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700"
                            >
                              Cancelar
                            </button>
                            <button
                              onClick={() => handleSaveEdit(acc.id)}
                              disabled={isLoadingAction}
                              className="px-4 py-1.5 text-xs font-bold rounded-xl bg-[#005BAC] text-white hover:bg-[#004e96] flex items-center gap-1.5 cursor-pointer shadow-sm disabled:opacity-50"
                            >
                              {isLoadingAction ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                <CheckCircle2 className="w-3.5 h-3.5" />
                              )}
                              <span>Salvar Alterações</span>
                            </button>
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div
                        key={acc.id}
                        className={`p-3.5 rounded-2xl border flex flex-col md:flex-row md:items-center justify-between gap-3 transition-colors ${
                          isActive
                            ? 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-xs hover:border-slate-300'
                            : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/60 opacity-75'
                        }`}
                      >
                        <div className="space-y-1 flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-bold text-xs text-slate-900 dark:text-white truncate">
                              {acc.nome}
                            </span>

                            {/* Status Badge */}
                            <span
                              className={`px-2 py-0.5 text-[9px] font-black rounded-md uppercase flex items-center gap-1 ${
                                isActive
                                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                                  : 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-600'
                              }`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                  isActive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
                                }`}
                              />
                              <span>{isActive ? 'Ativo' : 'Inativo'}</span>
                            </span>

                            {/* Role Badge */}
                            <span
                              className={`px-2 py-0.5 text-[10px] font-black rounded-lg uppercase flex items-center gap-1 ${
                                acc.role === 'monitoramento'
                                  ? 'bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200 dark:border-purple-800'
                                  : acc.role === 'coordenador'
                                  ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                                  : 'bg-sky-100 text-[#005BAC] dark:bg-sky-950/60 dark:text-sky-300 border border-sky-200 dark:border-sky-800'
                              }`}
                            >
                              {acc.role === 'monitoramento' ? (
                                <Shield className="w-3 h-3 text-purple-600 dark:text-purple-400" />
                              ) : acc.role === 'coordenador' ? (
                                <Crown className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                              ) : (
                                <GraduationCap className="w-3 h-3 text-[#005BAC] dark:text-sky-400" />
                              )}
                              <span>{acc.role}</span>
                            </span>

                            {/* Google Auth Badge */}
                            <span
                              className="px-2 py-0.5 text-[9px] font-bold rounded-md bg-blue-50 text-[#005BAC] dark:bg-blue-950/60 dark:text-sky-300 border border-blue-200 dark:border-blue-800 flex items-center gap-1"
                              title="Autenticação exclusiva Google Institucional SEDUC"
                            >
                              <Shield className="w-2.5 h-2.5" />
                              <span>Google Auth</span>
                            </span>
                          </div>

                          <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono truncate">
                            {acc.email}
                          </div>

                          <div className="text-[10px] text-slate-600 dark:text-slate-300 flex items-center gap-1 font-medium truncate">
                            <Building2 className="w-3 h-3 text-slate-400 shrink-0" />
                            <span className="truncate">{acc.unidadeCiseb}</span>
                          </div>
                        </div>

                        {/* Action Buttons and Role Switcher */}
                        <div className="flex flex-wrap items-center gap-2 shrink-0">
                          {/* Role Quick Switcher (Monitoring only) */}
                          {isMonitoramento && (
                            <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-900/80 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
                              <ArrowRightLeft className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase hidden sm:inline">
                                Função:
                              </span>
                              <select
                                value={acc.role}
                                disabled={isLoadingAction || isCoreAdmin}
                                onChange={(e) =>
                                  handleQuickChangeRole(
                                    acc,
                                    e.target.value as 'formador' | 'monitoramento' | 'coordenador'
                                  )
                                }
                                className="bg-transparent text-[11px] font-bold text-slate-800 dark:text-slate-200 outline-none cursor-pointer hover:text-[#005BAC] focus:ring-0 disabled:opacity-50"
                                title="Mudar função rapidamente"
                              >
                                <option value="formador" className="dark:bg-slate-800 text-slate-900 dark:text-white">
                                  Formador
                                </option>
                                <option value="monitoramento" className="dark:bg-slate-800 text-slate-900 dark:text-white">
                                  Monitoramento
                                </option>
                                <option value="coordenador" className="dark:bg-slate-800 text-slate-900 dark:text-white">
                                  Coordenação
                                </option>
                              </select>
                            </div>
                          )}

                          {/* Toggle Status Button (Ativo / Inativo) */}
                          {!isCoreAdmin && (
                            <button
                              type="button"
                              onClick={() => handleToggleStatus(acc)}
                              disabled={isLoadingAction}
                              className={`px-2.5 py-1.5 rounded-xl text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-all ${
                                isActive
                                  ? 'bg-slate-100 hover:bg-red-50 text-slate-600 hover:text-red-700 dark:bg-slate-800 dark:hover:bg-red-950/40 dark:text-slate-300 dark:hover:text-red-300'
                                  : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'
                              }`}
                              title={isActive ? 'Desativar acesso da conta' : 'Reativar acesso da conta'}
                            >
                              <Power className="w-3 h-3" />
                              <span className="hidden sm:inline">{isActive ? 'Desativar' : 'Ativar'}</span>
                            </button>
                          )}

                          {/* Reset Password Button */}
                          <button
                            onClick={() => handleResetPassword(acc)}
                            disabled={isLoadingAction}
                            className="px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 rounded-xl text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                            title="Gerar nova senha temporária forte"
                          >
                            {isRowLoading ? (
                              <Loader2 className="w-3 h-3 animate-spin text-amber-600" />
                            ) : (
                              <KeyRound className="w-3 h-3 text-amber-600" />
                            )}
                            <span className="hidden sm:inline">Redefinir Senha</span>
                          </button>

                          {/* Edit Details Button */}
                          <button
                            onClick={() => {
                              setEditingAccountId(acc.id);
                              setEditName(acc.nome);
                              setEditSelectedUnit(acc.unidadeCiseb);
                              setEditRole(acc.role);
                            }}
                            className="p-2 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl cursor-pointer transition-colors"
                            title="Editar Perfil"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete Account Button */}
                          {!isCoreAdmin && (
                            <button
                              onClick={() => handleDeleteAccount(acc)}
                              disabled={isLoadingAction}
                              className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/50 rounded-xl cursor-pointer transition-colors"
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
            <form onSubmit={handleCreateAccount} className="space-y-4 max-w-xl mx-auto py-2 animate-in fade-in">
              <div className="p-3.5 bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800 rounded-2xl text-xs text-sky-900 dark:text-sky-200">
                <p className="font-bold flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-[#005BAC] dark:text-sky-400" />
                  <span>Criação de Conta Institucional CISEB</span>
                </p>
                <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-1">
                  Uma senha temporária de uso único será gerada no servidor. O educador deverá cadastrar uma nova senha no primeiro login.
                </p>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Nome Completo do Educador(a) *
                </label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="EX: PROFESSOR CARLOS ALBERTO SILVA"
                  required
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs uppercase font-medium text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-[#005BAC]"
                />
              </div>

              {/* Unit Selection */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Unidade CISEB de Atuação *
                  </label>
                  {isMonitoramento && (
                    <button
                      type="button"
                      onClick={() => setNewUnitType(newUnitType === 'select' ? 'custom' : 'select')}
                      className="text-[10px] font-bold text-[#005BAC] dark:text-sky-400 hover:underline cursor-pointer"
                    >
                      {newUnitType === 'select' ? '+ Digitar nova unidade' : 'Escolher da lista'}
                    </button>
                  )}
                </div>

                {isCoordenador ? (
                  <div className="w-full bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                    <span>{coordinatorUnit}</span>
                    <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase">Sua Lotação</span>
                  </div>
                ) : newUnitType === 'select' ? (
                  <select
                    value={newSelectedUnit}
                    onChange={(e) => setNewSelectedUnit(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-[#005BAC]"
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
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs uppercase font-medium text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-[#005BAC]"
                  />
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    E-mail Institucional *
                  </label>
                  <input
                    type="text"
                    value={newEmailPrefix}
                    onChange={(e) => setNewEmailPrefix(e.target.value)}
                    placeholder="nome.sobrenome@escola.seduc.pa.gov.br"
                    required
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-mono text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-[#005BAC]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Função de Acesso
                  </label>
                  <select
                    value={isCoordenador ? 'formador' : newRole}
                    disabled={isCoordenador}
                    onChange={(e) => setNewRole(e.target.value as any)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-[#005BAC] disabled:opacity-75"
                  >
                    <option value="formador">Professor Formador</option>
                    {isMonitoramento && (
                      <>
                        <option value="coordenador">Coordenação CISEB</option>
                        <option value="monitoramento">Equipe de Monitoramento</option>
                      </>
                    )}
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoadingAction}
                className="w-full py-3 px-4 rounded-xl bg-[#005BAC] hover:bg-[#004e96] text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-[#005BAC]/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-2"
              >
                {isLoadingAction ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Cadastrando...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Cadastrar Conta e Emitir Senha Temporária</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* TAB 3: STATS & OVERVIEW */}
          {activeTab === 'stats' && (
            <div className="space-y-4 py-1 animate-in fade-in">
              {/* Top Metric Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700/80 space-y-1">
                  <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                    <span className="text-[10px] font-bold uppercase">Total de Contas</span>
                    <Users className="w-4 h-4 text-[#005BAC] dark:text-sky-400" />
                  </div>
                  <div className="text-xl font-black text-slate-900 dark:text-white">
                    {statistics.total}
                  </div>
                  <div className="text-[10px] text-slate-500">No seu escopo de gestão</div>
                </div>

                <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/30 rounded-2xl border border-emerald-200 dark:border-emerald-900/40 space-y-1">
                  <div className="flex items-center justify-between text-emerald-700 dark:text-emerald-400">
                    <span className="text-[10px] font-bold uppercase">Contas Ativas</span>
                    <UserCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div className="text-xl font-black text-emerald-900 dark:text-emerald-200">
                    {statistics.ativos}
                  </div>
                  <div className="text-[10px] text-emerald-700 dark:text-emerald-400">
                    {statistics.total > 0
                      ? `${Math.round((statistics.ativos / statistics.total) * 100)}% de disponibilidade`
                      : '0%'}
                  </div>
                </div>

                <div className="p-3.5 bg-blue-50 dark:bg-blue-950/30 rounded-2xl border border-blue-200 dark:border-blue-900/40 space-y-1">
                  <div className="flex items-center justify-between text-[#005BAC] dark:text-sky-400">
                    <span className="text-[10px] font-bold uppercase">Google SEDUC</span>
                    <Shield className="w-4 h-4 text-[#005BAC] dark:text-sky-400" />
                  </div>
                  <div className="text-xl font-black text-slate-900 dark:text-white">
                    {statistics.ativos}
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400">
                    Contas Google ativas
                  </div>
                </div>

                <div className="p-3.5 bg-purple-50 dark:bg-purple-950/30 rounded-2xl border border-purple-200 dark:border-purple-900/40 space-y-1">
                  <div className="flex items-center justify-between text-purple-700 dark:text-purple-400">
                    <span className="text-[10px] font-bold uppercase">Inativas</span>
                    <UserX className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div className="text-xl font-black text-purple-900 dark:text-purple-200">
                    {statistics.inativos}
                  </div>
                  <div className="text-[10px] text-purple-700 dark:text-purple-400">
                    Acessos pausados
                  </div>
                </div>
              </div>

              {/* Roles Breakdown */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200">
                  <Shield className="w-4 h-4 text-[#005BAC] dark:text-sky-400" />
                  <span>Distribuição por Nível de Acesso (Função)</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <GraduationCap className="w-4 h-4 text-[#005BAC] dark:text-sky-400" />
                      <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Professores Formadores
                      </span>
                    </div>
                    <span className="text-xs font-black text-slate-900 dark:text-white">
                      {statistics.formadoresCount}
                    </span>
                  </div>

                  <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Crown className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                      <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Coordenação CISEB
                      </span>
                    </div>
                    <span className="text-xs font-black text-slate-900 dark:text-white">
                      {statistics.coordenadoresCount}
                    </span>
                  </div>

                  <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                      <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Equipe Monitoramento
                      </span>
                    </div>
                    <span className="text-xs font-black text-slate-900 dark:text-white">
                      {statistics.monitoramentoCount}
                    </span>
                  </div>
                </div>
              </div>

              {/* By Unit Ranking / Breakdown */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
                <div className="flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-200">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-[#005BAC] dark:text-sky-400" />
                    <span>Contas por Unidade CISEB</span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-normal">
                    {statistics.unitRanking.length} unidades
                  </span>
                </div>

                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {statistics.unitRanking.map(({ unit, count }) => {
                    const percentage = statistics.total > 0 ? Math.round((count / statistics.total) * 100) : 0;
                    return (
                      <div
                        key={unit}
                        className="p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700/80 space-y-1.5"
                      >
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[80%]">
                            {unit}
                          </span>
                          <span className="font-mono text-[11px] font-bold text-slate-600 dark:text-slate-400">
                            {count} educador{count > 1 ? 'es' : ''} ({percentage}%)
                          </span>
                        </div>
                        <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                          <div
                            className="bg-[#005BAC] dark:bg-sky-500 h-full rounded-full transition-all duration-300"
                            style={{ width: `${Math.max(percentage, 5)}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Temporary Password Modal Dialog */}
        {tempModal.isOpen && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
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
                    Copie e envie ao educador por canal institucional seguro. No primeiro acesso, o sistema exigirá a troca imediata da senha.
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
                    <span className="text-[10px] text-slate-500 uppercase font-bold">E-mail de Acesso:</span>
                    <p className="font-bold text-[#005BAC] dark:text-sky-400">
                      {tempModal.email}
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-bold">Senha Temporária Gerada:</span>
                    <div className="p-2.5 bg-white dark:bg-slate-800 rounded-xl border border-slate-300 dark:border-slate-600 text-sm font-black tracking-wider text-emerald-600 dark:text-emerald-400 select-all">
                      {tempModal.tempPassword}
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setTempModal({ ...tempModal, isOpen: false })}
                    className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer"
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
