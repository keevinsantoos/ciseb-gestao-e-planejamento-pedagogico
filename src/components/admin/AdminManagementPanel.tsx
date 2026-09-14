import React, { useState, useEffect, useMemo } from 'react';
import { AuthUser, CisebEscola, CisebRegisteredAccount } from '../../types';
import {
  subscribeAdminProfessores,
  subscribeAdminUnidades,
  cadastrarProfessor,
  atualizarProfessor,
  alternarStatusProfessor,
  cadastrarUnidade,
  atualizarUnidade,
  alternarStatusUnidade,
  verificarExclusaoUnidade,
  excluirUnidadeFisica,
  detectSimilarUnit,
  generateUnitCode,
} from '../../services/adminService';
import {
  ShieldCheck,
  Building2,
  Users,
  UserPlus,
  PlusCircle,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Edit3,
  Power,
  Trash2,
  Loader2,
  School,
  Clock,
  Check,
  X,
  History,
  FileSpreadsheet,
  ArrowRight,
  Sparkles,
  Info,
  ChevronRight,
  Shield,
  Layers,
} from 'lucide-react';

interface AdminManagementPanelProps {
  currentUser: AuthUser | null;
  onBackToEdit?: () => void;
  theme?: 'light' | 'dark';
}

export const AdminManagementPanel: React.FC<AdminManagementPanelProps> = ({
  currentUser,
  onBackToEdit,
}) => {
  // Controle de Abas Administrativas
  const [activeTab, setActiveTab] = useState<'professores' | 'unidades' | 'auditoria'>('professores');

  // Dados em Tempo Real do Firestore
  const [professores, setProfessores] = useState<CisebRegisteredAccount[]>([]);
  const [unidades, setUnidades] = useState<CisebEscola[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  // Filtros - Professores
  const [searchProf, setSearchProf] = useState('');
  const [filterUnitProf, setFilterUnitProf] = useState('ALL');
  const [filterStatusProf, setFilterStatusProf] = useState<'ALL' | 'ativo' | 'inativo'>('ALL');

  // Filtros - Unidades
  const [searchUnit, setSearchUnit] = useState('');
  const [filterStatusUnit, setFilterStatusUnit] = useState<'ALL' | 'ativo' | 'inativo'>('ALL');

  // Modais de Criação e Edição
  const [isNewProfModalOpen, setIsNewProfModalOpen] = useState(false);
  const [isEditProfModalOpen, setIsEditProfModalOpen] = useState(false);
  const [editingProf, setEditingProf] = useState<CisebRegisteredAccount | null>(null);

  const [isNewUnitModalOpen, setIsNewUnitModalOpen] = useState(false);
  const [isEditUnitModalOpen, setIsEditUnitModalOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState<CisebEscola | null>(null);

  // Estados dos Formulários
  // Novo Professor
  const [newProfNome, setNewProfNome] = useState('');
  const [newProfEmail, setNewProfEmail] = useState('');
  const [newProfEscolaId, setNewProfEscolaId] = useState('');
  const [newProfStatus, setNewProfStatus] = useState<'ativo' | 'inativo'>('ativo');

  // Editar Professor
  const [editProfNome, setEditProfNome] = useState('');
  const [editProfEscolaId, setEditProfEscolaId] = useState('');
  const [editProfStatus, setEditProfStatus] = useState<'ativo' | 'inativo'>('ativo');

  // Nova Unidade
  const [newUnitNome, setNewUnitNome] = useState('');
  const [newUnitCodigo, setNewUnitCodigo] = useState('');
  const [newUnitMunicipio, setNewUnitMunicipio] = useState('');
  const [newUnitStatus, setNewUnitStatus] = useState<'ativo' | 'inativo'>('ativo');
  const [similarUnitWarning, setSimilarUnitWarning] = useState<CisebEscola | null>(null);
  const [confirmSimilarBypass, setConfirmSimilarBypass] = useState(false);

  // Editar Unidade
  const [editUnitNome, setEditUnitNome] = useState('');
  const [editUnitMunicipio, setEditUnitMunicipio] = useState('');
  const [editUnitStatus, setEditUnitStatus] = useState<'ativo' | 'inativo'>('ativo');

  // Mensagens de Feedback & Carregamento
  const [actionLoading, setActionLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Modal de Bloqueio de Exclusão de Unidade
  const [deletionBlockInfo, setDeletionBlockInfo] = useState<{
    unidadeNome: string;
    motivo: string;
    totalProfessores: number;
  } | null>(null);

  // Assinatura em Tempo Real no Firestore
  useEffect(() => {
    setLoadingData(true);
    const unsubProfs = subscribeAdminProfessores((profs) => {
      setProfessores(profs);
      setLoadingData(false);
    });

    const unsubUnits = subscribeAdminUnidades((units) => {
      setUnidades(units);
      if (units.length > 0 && !newProfEscolaId) {
        setNewProfEscolaId(units[0].id);
      }
    });

    return () => {
      unsubProfs();
      unsubUnits();
    };
  }, []);

  // Monitora digitação do nome da nova unidade para autogerar código e alertar similaridade
  useEffect(() => {
    if (newUnitNome.trim().length >= 3) {
      const autoCode = generateUnitCode(newUnitNome);
      setNewUnitCodigo(autoCode);
      const similar = detectSimilarUnit(newUnitNome, unidades);
      setSimilarUnitWarning(similar);
      if (!similar) {
        setConfirmSimilarBypass(false);
      }
    } else {
      setSimilarUnitWarning(null);
      setConfirmSimilarBypass(false);
    }
  }, [newUnitNome, unidades]);

  // Exibição de Feedback com Timer
  const showFeedback = (type: 'success' | 'error', text: string) => {
    setFeedback({ type, text });
    setTimeout(() => {
      setFeedback(null);
    }, 5000);
  };

  // -------------------------------------------------------------------------
  // MÉTODOS DE PROFESSORES
  // -------------------------------------------------------------------------
  const handleOpenNewProf = () => {
    setNewProfNome('');
    setNewProfEmail('');
    setNewProfEscolaId(unidades.length > 0 ? unidades[0].id : '');
    setNewProfStatus('ativo');
    setIsNewProfModalOpen(true);
  };

  const handleCreateProf = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);

    const res = await cadastrarProfessor({
      nome: newProfNome,
      email: newProfEmail,
      escolaId: newProfEscolaId,
      escolasDisponiveis: unidades,
      status: newProfStatus,
      adminEmail: currentUser?.email || 'ciseb.adm@escola.seduc.pa.gov.br',
    });

    setActionLoading(false);

    if (res.success) {
      setIsNewProfModalOpen(false);
      showFeedback('success', `Professor ${newProfNome} cadastrado com sucesso!`);
    } else {
      showFeedback('error', res.error || 'Erro ao cadastrar professor.');
    }
  };

  const handleOpenEditProf = (prof: CisebRegisteredAccount) => {
    setEditingProf(prof);
    setEditProfNome(prof.nome);
    setEditProfEscolaId(prof.escolaId || unidades[0]?.id || '');
    setEditProfStatus(prof.status || 'ativo');
    setIsEditProfModalOpen(true);
  };

  const handleSaveEditProf = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProf) return;

    setActionLoading(true);
    const res = await atualizarProfessor({
      id: editingProf.id,
      nome: editProfNome,
      escolaId: editProfEscolaId,
      escolasDisponiveis: unidades,
      status: editProfStatus,
      adminEmail: currentUser?.email || 'ciseb.adm@escola.seduc.pa.gov.br',
    });
    setActionLoading(false);

    if (res.success) {
      setIsEditProfModalOpen(false);
      setEditingProf(null);
      showFeedback('success', 'Dados do professor atualizados com sucesso!');
    } else {
      showFeedback('error', res.error || 'Erro ao atualizar professor.');
    }
  };

  const handleToggleProfStatus = async (prof: CisebRegisteredAccount) => {
    const novoStatus = prof.status === 'ativo' ? 'inativo' : 'ativo';
    const confirmMsg =
      novoStatus === 'inativo'
        ? `Deseja inativar o acesso de ${prof.nome}? O histórico de planos e registros pedagógicos será preservado.`
        : `Deseja reativar o acesso de ${prof.nome}?`;

    if (!window.confirm(confirmMsg)) return;

    setActionLoading(true);
    const res = await alternarStatusProfessor(
      prof.id,
      novoStatus,
      currentUser?.email || 'ciseb.adm@escola.seduc.pa.gov.br'
    );
    setActionLoading(false);

    if (res.success) {
      showFeedback('success', `Status de ${prof.nome} alterado para ${novoStatus.toUpperCase()}.`);
    } else {
      showFeedback('error', res.error || 'Erro ao alterar status.');
    }
  };

  // -------------------------------------------------------------------------
  // MÉTODOS DE UNIDADES CISEB
  // -------------------------------------------------------------------------
  const handleOpenNewUnit = () => {
    setNewUnitNome('');
    setNewUnitCodigo('');
    setNewUnitMunicipio('Belém');
    setNewUnitStatus('ativo');
    setSimilarUnitWarning(null);
    setConfirmSimilarBypass(false);
    setIsNewUnitModalOpen(true);
  };

  const handleCreateUnit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (similarUnitWarning && !confirmSimilarBypass) {
      showFeedback('error', 'Confirme o aviso de similaridade antes de prosseguir com o cadastro.');
      return;
    }

    setActionLoading(true);
    const res = await cadastrarUnidade({
      codigo: newUnitCodigo,
      nome: newUnitNome,
      municipio: newUnitMunicipio,
      status: newUnitStatus,
      adminEmail: currentUser?.email || 'ciseb.adm@escola.seduc.pa.gov.br',
      existingUnits: unidades,
      permitirSimilaridadeConfirmada: confirmSimilarBypass,
    });
    setActionLoading(false);

    if (res.success) {
      setIsNewUnitModalOpen(false);
      showFeedback('success', `Unidade ${newUnitNome} cadastrada com sucesso!`);
    } else if (res.alertaSimilaridade) {
      setSimilarUnitWarning(res.alertaSimilaridade.unidadeSimilar);
      showFeedback('error', res.alertaSimilaridade.mensagem);
    } else {
      showFeedback('error', res.error || 'Erro ao cadastrar unidade.');
    }
  };

  const handleOpenEditUnit = (unit: CisebEscola) => {
    setEditingUnit(unit);
    setEditUnitNome(unit.nome);
    setEditUnitMunicipio(unit.municipio || '');
    setEditUnitStatus(unit.status || 'ativo');
    setIsEditUnitModalOpen(true);
  };

  const handleSaveEditUnit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUnit) return;

    setActionLoading(true);
    const res = await atualizarUnidade({
      id: editingUnit.id,
      nome: editUnitNome,
      municipio: editUnitMunicipio,
      status: editUnitStatus,
      adminEmail: currentUser?.email || 'ciseb.adm@escola.seduc.pa.gov.br',
      existingUnits: unidades,
      permitirSimilaridadeConfirmada: true,
    });
    setActionLoading(false);

    if (res.success) {
      setIsEditUnitModalOpen(false);
      setEditingUnit(null);
      showFeedback('success', 'Dados da unidade escolar atualizados com sucesso!');
    } else {
      showFeedback('error', res.error || 'Erro ao atualizar unidade.');
    }
  };

  const handleToggleUnitStatus = async (unit: CisebEscola) => {
    const novoStatus = unit.status === 'ativo' ? 'inativo' : 'ativo';
    const confirmMsg =
      novoStatus === 'inativo'
        ? `Deseja inativar a unidade "${unit.nome}"? Os professores e planos vinculados permanecerão salvos no histórico.`
        : `Deseja reativar a unidade "${unit.nome}"?`;

    if (!window.confirm(confirmMsg)) return;

    setActionLoading(true);
    const res = await alternarStatusUnidade(
      unit.id,
      novoStatus,
      currentUser?.email || 'ciseb.adm@escola.seduc.pa.gov.br'
    );
    setActionLoading(false);

    if (res.success) {
      showFeedback('success', `Status da unidade alterado para ${novoStatus.toUpperCase()}.`);
    } else {
      showFeedback('error', res.error || 'Erro ao alternar status da unidade.');
    }
  };

  const handleDeleteUnitAttempt = async (unit: CisebEscola) => {
    setActionLoading(true);
    const check = await verificarExclusaoUnidade(unit.id, unit.nome);
    setActionLoading(false);

    if (!check.podeExcluir) {
      setDeletionBlockInfo({
        unidadeNome: unit.nome,
        motivo: check.motivo || 'Esta unidade possui histórico associado e não pode ser excluída fisicamente.',
        totalProfessores: check.totalProfessores,
      });
      return;
    }

    if (
      window.confirm(
        `Esta unidade NÃO possui nenhum professor ou plano vinculado. Confirma a exclusão física definitiva de "${unit.nome}"?`
      )
    ) {
      setActionLoading(true);
      const res = await excluirUnidadeFisica(unit.id, unit.nome);
      setActionLoading(false);
      if (res.success) {
        showFeedback('success', 'Unidade excluída do banco de dados.');
      } else {
        showFeedback('error', res.error || 'Erro ao excluir unidade.');
      }
    }
  };

  // -------------------------------------------------------------------------
  // FILTROS COMPUTADOS
  // -------------------------------------------------------------------------
  const filteredProfessores = useMemo(() => {
    return professores.filter((p) => {
      const matchSearch =
        p.nome.toLowerCase().includes(searchProf.toLowerCase()) ||
        p.email.toLowerCase().includes(searchProf.toLowerCase()) ||
        (p.escolaNome || p.unidadeCiseb || '').toLowerCase().includes(searchProf.toLowerCase());

      const matchUnit = filterUnitProf === 'ALL' || p.escolaId === filterUnitProf;
      const matchStatus = filterStatusProf === 'ALL' || p.status === filterStatusProf;

      return matchSearch && matchUnit && matchStatus;
    });
  }, [professores, searchProf, filterUnitProf, filterStatusProf]);

  const filteredUnidades = useMemo(() => {
    return unidades.filter((u) => {
      const matchSearch =
        u.nome.toLowerCase().includes(searchUnit.toLowerCase()) ||
        u.id.toLowerCase().includes(searchUnit.toLowerCase()) ||
        (u.municipio || '').toLowerCase().includes(searchUnit.toLowerCase());

      const matchStatus = filterStatusUnit === 'ALL' || u.status === filterStatusUnit;

      return matchSearch && matchStatus;
    });
  }, [unidades, searchUnit, filterStatusUnit]);

  // Contagem de professores por unidade
  const teachersCountByUnit = useMemo(() => {
    const map: Record<string, number> = {};
    professores.forEach((p) => {
      const uid = p.escolaId || p.unidadeCiseb;
      map[uid] = (map[uid] || 0) + 1;
    });
    return map;
  }, [professores]);

  // Auditoria consolidada
  const auditLogs = useMemo(() => {
    const logs: Array<{
      id: string;
      tipo: 'Professor' | 'Unidade';
      nome: string;
      responsavel: string;
      data: string;
      acao: string;
    }> = [];

    professores.forEach((p) => {
      if (p.criadoPor || p.cadastradoPor) {
        logs.push({
          id: `prof_create_${p.id}`,
          tipo: 'Professor',
          nome: p.nome,
          responsavel: p.criadoPor || p.cadastradoPor || 'Monitoramento',
          data: p.criadoEm || p.dataCadastro || '',
          acao: 'Cadastro Inicial no CISEB',
        });
      }
      if (p.atualizadoPor && p.atualizadoEm) {
        logs.push({
          id: `prof_update_${p.id}`,
          tipo: 'Professor',
          nome: p.nome,
          responsavel: p.atualizadoPor,
          data: p.atualizadoEm,
          acao: `Atualização de Cadastro (${p.status.toUpperCase()})`,
        });
      }
    });

    unidades.forEach((u) => {
      if (u.criadoPor) {
        logs.push({
          id: `unit_create_${u.id}`,
          tipo: 'Unidade',
          nome: u.nome,
          responsavel: u.criadoPor,
          data: u.criadoEm || u.dataCriacao || '',
          acao: 'Criação da Unidade Escolar',
        });
      }
      if (u.atualizadoPor && u.atualizadoEm) {
        logs.push({
          id: `unit_update_${u.id}`,
          tipo: 'Unidade',
          nome: u.nome,
          responsavel: u.atualizadoPor,
          data: u.atualizadoEm,
          acao: `Atualização de Dados (${u.status.toUpperCase()})`,
        });
      }
    });

    logs.sort((a, b) => (b.data || '').localeCompare(a.data || ''));
    return logs;
  }, [professores, unidades]);

  // Formatação de data/hora amigável
  const formatDateTime = (isoString?: string) => {
    if (!isoString) return 'Data não informada';
    try {
      const d = new Date(isoString);
      if (isNaN(d.getTime())) return isoString;
      return d.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-in fade-in duration-200">
      {/* ── TOPO INSTITUCIONAL COM BREADCRUMB ───────────────────────────── */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-700 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-purple-500/10 via-sky-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-purple-700 dark:text-purple-300">
              <span className="px-2.5 py-1 rounded-full bg-purple-50 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800/60 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" />
                Painel Administrativo CISEB
              </span>
              <span className="text-slate-400">·</span>
              <span className="text-slate-500 dark:text-slate-400">SEDUC/PA</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              Gestão de Professores & Unidades
            </h1>

            <p className="text-sm text-slate-600 dark:text-slate-300 max-w-2xl leading-relaxed">
              Área exclusiva para a Equipe de Monitoramento (
              <code className="text-xs px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700 font-mono text-purple-700 dark:text-purple-300">
                ciseb.adm@escola.seduc.pa.gov.br
              </code>
              ). Cadastre e gerencie os formadores e as unidades escolares diretamente pelo sistema, com auditoria de
              modificações e autenticação exclusivamente via Google SEDUC.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {onBackToEdit && (
              <button
                type="button"
                onClick={onBackToEdit}
                className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs hover:bg-slate-100 dark:hover:bg-slate-700 transition-all cursor-pointer shadow-xs"
              >
                Voltar ao Formulário
              </button>
            )}
          </div>
        </div>

        {/* Feedback Bar */}
        {feedback && (
          <div
            className={`mt-6 p-4 rounded-2xl border flex items-center gap-3 text-sm font-medium animate-in slide-in-from-top-2 duration-200 ${
              feedback.type === 'success'
                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
                : 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200'
            }`}
          >
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
            )}
            <span className="flex-1">{feedback.text}</span>
            <button
              onClick={() => setFeedback(null)}
              className="p-1 hover:opacity-75 transition-opacity cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Estatísticas Rápidas */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-100 dark:border-slate-700">
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
              Professores Cadastrados
            </span>
            <span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-1 block">
              {professores.length}
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
              Professores Ativos
            </span>
            <span className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1 block">
              {professores.filter((p) => p.status === 'ativo').length}
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
              Unidades Escolares
            </span>
            <span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-1 block">
              {unidades.length}
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
              Unidades Ativas
            </span>
            <span className="text-xl sm:text-2xl font-black text-sky-600 dark:text-sky-400 mt-1 block">
              {unidades.filter((u) => u.status === 'ativo').length}
            </span>
          </div>
        </div>
      </div>

      {/* ── NAVEGAÇÃO ENTRE ABAS ─────────────────────────────────────────── */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-700 pb-1">
        <button
          id="tab-btn-professores"
          type="button"
          onClick={() => setActiveTab('professores')}
          className={`px-5 py-3 rounded-2xl font-bold text-sm flex items-center gap-2.5 transition-all cursor-pointer ${
            activeTab === 'professores'
              ? 'bg-[#005BAC] text-white shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Professores Formadores</span>
          <span
            className={`text-xs px-2 py-0.5 rounded-full font-bold ${
              activeTab === 'professores'
                ? 'bg-white/20 text-white'
                : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
            }`}
          >
            {professores.length}
          </span>
        </button>

        <button
          id="tab-btn-unidades"
          type="button"
          onClick={() => setActiveTab('unidades')}
          className={`px-5 py-3 rounded-2xl font-bold text-sm flex items-center gap-2.5 transition-all cursor-pointer ${
            activeTab === 'unidades'
              ? 'bg-[#005BAC] text-white shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Unidades CISEB</span>
          <span
            className={`text-xs px-2 py-0.5 rounded-full font-bold ${
              activeTab === 'unidades'
                ? 'bg-white/20 text-white'
                : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
            }`}
          >
            {unidades.length}
          </span>
        </button>

        <button
          id="tab-btn-auditoria"
          type="button"
          onClick={() => setActiveTab('auditoria')}
          className={`px-5 py-3 rounded-2xl font-bold text-sm flex items-center gap-2.5 transition-all cursor-pointer ${
            activeTab === 'auditoria'
              ? 'bg-[#005BAC] text-white shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Auditoria & Histórico</span>
          <span
            className={`text-xs px-2 py-0.5 rounded-full font-bold ${
              activeTab === 'auditoria'
                ? 'bg-white/20 text-white'
                : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
            }`}
          >
            {auditLogs.length}
          </span>
        </button>
      </div>

      {/* ── ABA 1: PROFESSORES CISEB ──────────────────────────────────────── */}
      {activeTab === 'professores' && (
        <div className="space-y-6">
          {/* Barra de Ações & Filtros */}
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-4 sm:p-6 border border-slate-200 dark:border-slate-700 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
            <div className="flex-1 flex flex-col sm:flex-row items-center gap-3">
              {/* Campo de Busca */}
              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Buscar por nome, e-mail ou escola..."
                  value={searchProf}
                  onChange={(e) => setSearchProf(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#005BAC]"
                />
              </div>

              {/* Filtro por Unidade */}
              <select
                value={filterUnitProf}
                onChange={(e) => setFilterUnitProf(e.target.value)}
                className="w-full sm:w-60 px-3 py-2.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#005BAC]"
              >
                <option value="ALL">Todas as Unidades</option>
                {unidades.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.nome}
                  </option>
                ))}
              </select>

              {/* Filtro por Status */}
              <select
                value={filterStatusProf}
                onChange={(e) => setFilterStatusProf(e.target.value as any)}
                className="w-full sm:w-36 px-3 py-2.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#005BAC]"
              >
                <option value="ALL">Todos os Status</option>
                <option value="ativo">Ativos</option>
                <option value="inativo">Inativos</option>
              </select>
            </div>

            {/* Botão de Novo Professor */}
            <button
              id="ciseb-btn-novo-professor"
              type="button"
              onClick={handleOpenNewProf}
              className="px-5 py-2.5 rounded-xl font-bold text-xs bg-[#005BAC] hover:bg-[#004887] text-white flex items-center justify-center gap-2 shadow-sm hover:shadow-md transition-all cursor-pointer shrink-0"
            >
              <UserPlus className="w-4 h-4" />
              <span>Novo Professor</span>
            </button>
          </div>

          {/* Lista de Professores */}
          {loadingData ? (
            <div className="py-20 text-center text-slate-500 dark:text-slate-400">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-[#005BAC] mb-2" />
              <p className="text-sm font-medium">Carregando dados oficiais do Firestore...</p>
            </div>
          ) : filteredProfessores.length === 0 ? (
            <div className="bg-white dark:bg-slate-800 rounded-3xl p-12 text-center border border-dashed border-slate-200 dark:border-slate-700">
              <Users className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
                Nenhum professor localizado
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto mt-1">
                Tente ajustar os termos de busca ou filtros, ou utilize o botão "Novo Professor" acima para cadastrar.
              </p>
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
                      <th className="py-3.5 px-4 sm:px-6">Professor / Formador</th>
                      <th className="py-3.5 px-4 sm:px-6">E-mail Institucional</th>
                      <th className="py-3.5 px-4 sm:px-6">Unidade CISEB Vinculada</th>
                      <th className="py-3.5 px-4 sm:px-6">Status</th>
                      <th className="py-3.5 px-4 sm:px-6">Auditoria (Cadastro / Edição)</th>
                      <th className="py-3.5 px-4 sm:px-6 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60 text-slate-700 dark:text-slate-200">
                    {filteredProfessores.map((prof) => {
                      const isAtivo = prof.status === 'ativo';
                      return (
                        <tr
                          key={prof.id}
                          className="hover:bg-slate-50/80 dark:hover:bg-slate-700/30 transition-colors"
                        >
                          <td className="py-3.5 px-4 sm:px-6 font-bold text-slate-900 dark:text-white">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-950/60 text-[#005BAC] dark:text-sky-300 font-bold flex items-center justify-center shrink-0 text-xs">
                                {prof.nome.charAt(0)}
                              </div>
                              <div>
                                <span className="block font-bold">{prof.nome}</span>
                                <span className="text-[10px] text-slate-400 font-normal">
                                  Papel: {prof.role}
                                </span>
                              </div>
                            </div>
                          </td>

                          <td className="py-3.5 px-4 sm:px-6 font-mono text-[11px] text-slate-600 dark:text-slate-300">
                            {prof.email}
                          </td>

                          <td className="py-3.5 px-4 sm:px-6">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200">
                              <School className="w-3.5 h-3.5 text-[#005BAC] dark:text-sky-400" />
                              {prof.escolaNome || prof.unidadeCiseb}
                            </span>
                          </td>

                          <td className="py-3.5 px-4 sm:px-6">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${
                                isAtivo
                                  ? 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300'
                                  : 'bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300'
                              }`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                  isAtivo ? 'bg-emerald-500' : 'bg-amber-500'
                                }`}
                              />
                              {isAtivo ? 'Ativo' : 'Inativo'}
                            </span>
                          </td>

                          <td className="py-3.5 px-4 sm:px-6 text-[10px] text-slate-500 dark:text-slate-400 space-y-0.5">
                            <div>
                              <span className="font-semibold">Cadastrado por:</span>{' '}
                              {prof.criadoPor || prof.cadastradoPor || 'Monitoramento'} em{' '}
                              {formatDateTime(prof.criadoEm || prof.dataCadastro)}
                            </div>
                            {prof.atualizadoPor && (
                              <div className="text-purple-600 dark:text-purple-300">
                                <span className="font-semibold">Alterado por:</span> {prof.atualizadoPor} em{' '}
                                {formatDateTime(prof.atualizadoEm)}
                              </div>
                            )}
                          </td>

                          <td className="py-3.5 px-4 sm:px-6 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleOpenEditProf(prof)}
                                className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:text-[#005BAC] hover:bg-sky-50 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                                title="Editar dados do professor"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>

                              <button
                                type="button"
                                onClick={() => handleToggleProfStatus(prof)}
                                className={`p-2 rounded-lg transition-colors cursor-pointer ${
                                  isAtivo
                                    ? 'text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40'
                                    : 'text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
                                }`}
                                title={isAtivo ? 'Inativar acesso (mantém histórico)' : 'Reativar acesso'}
                              >
                                <Power className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── ABA 2: UNIDADES CISEB ─────────────────────────────────────────── */}
      {activeTab === 'unidades' && (
        <div className="space-y-6">
          {/* Barra de Ações & Filtros */}
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-4 sm:p-6 border border-slate-200 dark:border-slate-700 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
            <div className="flex-1 flex flex-col sm:flex-row items-center gap-3">
              {/* Campo de Busca */}
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Buscar por nome, código ou município..."
                  value={searchUnit}
                  onChange={(e) => setSearchUnit(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#005BAC]"
                />
              </div>

              {/* Filtro por Status */}
              <select
                value={filterStatusUnit}
                onChange={(e) => setFilterStatusUnit(e.target.value as any)}
                className="w-full sm:w-40 px-3 py-2.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#005BAC]"
              >
                <option value="ALL">Todos os Status</option>
                <option value="ativo">Ativas</option>
                <option value="inativo">Inativas</option>
              </select>
            </div>

            {/* Botão de Nova Unidade */}
            <button
              id="ciseb-btn-nova-unidade"
              type="button"
              onClick={handleOpenNewUnit}
              className="px-5 py-2.5 rounded-xl font-bold text-xs bg-[#005BAC] hover:bg-[#004887] text-white flex items-center justify-center gap-2 shadow-sm hover:shadow-md transition-all cursor-pointer shrink-0"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Nova Unidade</span>
            </button>
          </div>

          {/* Lista de Unidades */}
          {loadingData ? (
            <div className="py-20 text-center text-slate-500 dark:text-slate-400">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-[#005BAC] mb-2" />
              <p className="text-sm font-medium">Carregando unidades escolares do Firestore...</p>
            </div>
          ) : filteredUnidades.length === 0 ? (
            <div className="bg-white dark:bg-slate-800 rounded-3xl p-12 text-center border border-dashed border-slate-200 dark:border-slate-700">
              <Building2 className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
                Nenhuma unidade localizada
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto mt-1">
                Tente ajustar os termos de busca ou utilize o botão "Nova Unidade" acima para cadastrar.
              </p>
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
                      <th className="py-3.5 px-4 sm:px-6">Unidade Escolar Oficial</th>
                      <th className="py-3.5 px-4 sm:px-6">Código Firestore (ID)</th>
                      <th className="py-3.5 px-4 sm:px-6">Município</th>
                      <th className="py-3.5 px-4 sm:px-6">Formadores Vinculados</th>
                      <th className="py-3.5 px-4 sm:px-6">Status</th>
                      <th className="py-3.5 px-4 sm:px-6">Auditoria (Criação / Edição)</th>
                      <th className="py-3.5 px-4 sm:px-6 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60 text-slate-700 dark:text-slate-200">
                    {filteredUnidades.map((unit) => {
                      const isAtivo = unit.status === 'ativo';
                      const vinculados = teachersCountByUnit[unit.id] || teachersCountByUnit[unit.nome] || 0;

                      return (
                        <tr
                          key={unit.id}
                          className="hover:bg-slate-50/80 dark:hover:bg-slate-700/30 transition-colors"
                        >
                          <td className="py-3.5 px-4 sm:px-6 font-bold text-slate-900 dark:text-white">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 flex items-center justify-center shrink-0">
                                <Building2 className="w-4 h-4" />
                              </div>
                              <span className="font-bold text-slate-900 dark:text-white">{unit.nome}</span>
                            </div>
                          </td>

                          <td className="py-3.5 px-4 sm:px-6 font-mono text-[11px] text-slate-500 dark:text-slate-400">
                            {unit.id}
                          </td>

                          <td className="py-3.5 px-4 sm:px-6 font-medium text-slate-800 dark:text-slate-200">
                            {unit.municipio || 'Pará'}
                          </td>

                          <td className="py-3.5 px-4 sm:px-6">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 dark:bg-blue-950/50 text-[#005BAC] dark:text-sky-300">
                              <Users className="w-3 h-3" />
                              {vinculados} professor(es)
                            </span>
                          </td>

                          <td className="py-3.5 px-4 sm:px-6">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${
                                isAtivo
                                  ? 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300'
                                  : 'bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300'
                              }`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                  isAtivo ? 'bg-emerald-500' : 'bg-amber-500'
                                }`}
                              />
                              {isAtivo ? 'Ativa' : 'Inativa'}
                            </span>
                          </td>

                          <td className="py-3.5 px-4 sm:px-6 text-[10px] text-slate-500 dark:text-slate-400 space-y-0.5">
                            <div>
                              <span className="font-semibold">Criada por:</span>{' '}
                              {unit.criadoPor || 'SEDUC-PA'} em{' '}
                              {formatDateTime(unit.criadoEm || unit.dataCriacao)}
                            </div>
                            {unit.atualizadoPor && (
                              <div className="text-purple-600 dark:text-purple-300">
                                <span className="font-semibold">Alterada por:</span> {unit.atualizadoPor} em{' '}
                                {formatDateTime(unit.atualizadoEm)}
                              </div>
                            )}
                          </td>

                          <td className="py-3.5 px-4 sm:px-6 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleOpenEditUnit(unit)}
                                className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:text-[#005BAC] hover:bg-sky-50 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                                title="Editar dados da unidade"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>

                              <button
                                type="button"
                                onClick={() => handleToggleUnitStatus(unit)}
                                className={`p-2 rounded-lg transition-colors cursor-pointer ${
                                  isAtivo
                                    ? 'text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40'
                                    : 'text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
                                }`}
                                title={isAtivo ? 'Inativar unidade' : 'Reativar unidade'}
                              >
                                <Power className="w-4 h-4" />
                              </button>

                              <button
                                type="button"
                                onClick={() => handleDeleteUnitAttempt(unit)}
                                className="p-2 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer"
                                title="Excluir unidade (somente se não possuir histórico)"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── ABA 3: AUDITORIA & HISTÓRICO ──────────────────────────────────── */}
      {activeTab === 'auditoria' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-200 dark:border-slate-700 shadow-xs">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 flex items-center justify-center shrink-0">
                <History className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Rastreabilidade e Auditoria do Sistema
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Histórico de operações administrativas realizadas no cadastro de professores e unidades.
                </p>
              </div>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-700/60">
              {auditLogs.map((log) => (
                <div
                  key={log.id}
                  className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                >
                  <div className="flex items-start sm:items-center gap-3">
                    <span
                      className={`px-2 py-0.5 rounded-md font-bold uppercase text-[10px] shrink-0 ${
                        log.tipo === 'Professor'
                          ? 'bg-blue-100 dark:bg-blue-950/60 text-[#005BAC] dark:text-sky-300'
                          : 'bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300'
                      }`}
                    >
                      {log.tipo}
                    </span>
                    <div>
                      <span className="font-bold text-slate-900 dark:text-white block sm:inline">
                        {log.nome}
                      </span>
                      <span className="text-slate-400 mx-2 hidden sm:inline">·</span>
                      <span className="text-slate-600 dark:text-slate-300">{log.acao}</span>
                    </div>
                  </div>

                  <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-2 pl-9 sm:pl-0">
                    <span className="font-mono text-[10px] text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/40 px-1.5 py-0.5 rounded">
                      {log.responsavel}
                    </span>
                    <span>·</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400" />
                      {formatDateTime(log.data)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: NOVO PROFESSOR ────────────────────────────────────────── */}
      {isNewProfModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-800 w-full max-w-lg rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-100 dark:border-slate-700 space-y-5 animate-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-[10px] font-bold text-purple-700 dark:text-purple-300 uppercase tracking-widest flex items-center gap-1.5 mb-1">
                  <span>Administração</span>
                  <ChevronRight className="w-3 h-3" />
                  <span>Professores</span>
                  <ChevronRight className="w-3 h-3" />
                  <span className="text-slate-900 dark:text-white">Novo Professor</span>
                </div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white">
                  Cadastrar Professor Formador
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsNewProfModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateProf} className="space-y-4">
              {/* Nome Completo */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Nome Completo do Professor *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: MARIA DE FÁTIMA SILVA"
                  value={newProfNome}
                  onChange={(e) => setNewProfNome(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-[#005BAC]"
                />
              </div>

              {/* E-mail Institucional */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  E-mail Institucional SEDUC *
                </label>
                <input
                  type="email"
                  required
                  placeholder="professor.nome@escola.seduc.pa.gov.br"
                  value={newProfEmail}
                  onChange={(e) => setNewProfEmail(e.target.value.toLowerCase().trim())}
                  className="w-full px-3.5 py-2.5 rounded-xl text-xs font-mono bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-[#005BAC]"
                />
                <p className="text-[10px] text-slate-500 mt-1">
                  O e-mail deve ser único e pertencer ao domínio @escola.seduc.pa.gov.br ou @seduc.pa.gov.br.
                </p>
              </div>

              {/* Unidade CISEB */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Unidade CISEB Vinculada *
                </label>
                <select
                  required
                  value={newProfEscolaId}
                  onChange={(e) => setNewProfEscolaId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-[#005BAC]"
                >
                  <option value="" disabled>
                    Selecione a unidade escolar
                  </option>
                  {unidades.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.nome} ({u.municipio})
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-slate-500 mt-1">
                  Não é permitido professor sem unidade vinculada.
                </p>
              </div>

              {/* Status */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Status do Cadastro
                </label>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 text-xs font-medium cursor-pointer">
                    <input
                      type="radio"
                      name="status"
                      value="ativo"
                      checked={newProfStatus === 'ativo'}
                      onChange={() => setNewProfStatus('ativo')}
                      className="text-[#005BAC] focus:ring-[#005BAC]"
                    />
                    <span className="text-emerald-700 dark:text-emerald-400 font-bold">Ativo</span>
                  </label>
                  <label className="flex items-center gap-2 text-xs font-medium cursor-pointer">
                    <input
                      type="radio"
                      name="status"
                      value="inativo"
                      checked={newProfStatus === 'inativo'}
                      onChange={() => setNewProfStatus('inativo')}
                      className="text-[#005BAC] focus:ring-[#005BAC]"
                    />
                    <span className="text-amber-700 dark:text-amber-400 font-bold">Inativo</span>
                  </label>
                </div>
              </div>

              {/* Card de Regra de Segurança */}
              <div className="p-3.5 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/60 text-[11px] text-blue-900 dark:text-blue-200 space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-[#005BAC] dark:text-sky-300">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Autenticação Exclusiva Google SEDUC</span>
                </div>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                  Nenhuma senha será criada. Quando o professor acessar o sistema pela primeira vez com sua conta Google
                  institucional, o sistema identificará automaticamente seu cadastro oficial e liberará o acesso à sua
                  unidade.
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsNewProfModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-[#005BAC] hover:bg-[#004887] flex items-center gap-2 shadow-md cursor-pointer disabled:opacity-60"
                >
                  {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  <span>Confirmar Cadastro</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: EDITAR PROFESSOR ──────────────────────────────────────── */}
      {isEditProfModalOpen && editingProf && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-800 w-full max-w-lg rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-100 dark:border-slate-700 space-y-5 animate-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="text-[10px] font-bold text-purple-700 dark:text-purple-300 uppercase tracking-widest block mb-1">
                  Administração CISEB
                </span>
                <h3 className="text-lg font-black text-slate-900 dark:text-white">
                  Editar Cadastro do Professor
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsEditProfModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditProf} className="space-y-4">
              {/* E-mail (somente leitura para integridade) */}
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">
                  E-mail Institucional (Identificador Google)
                </label>
                <input
                  type="email"
                  disabled
                  value={editingProf.email}
                  className="w-full px-3.5 py-2.5 rounded-xl text-xs font-mono bg-slate-100 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-slate-500 cursor-not-allowed"
                />
              </div>

              {/* Nome Completo */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Nome Completo *
                </label>
                <input
                  type="text"
                  required
                  value={editProfNome}
                  onChange={(e) => setEditProfNome(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-[#005BAC]"
                />
              </div>

              {/* Unidade CISEB */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Unidade CISEB Vinculada *
                </label>
                <select
                  required
                  value={editProfEscolaId}
                  onChange={(e) => setEditProfEscolaId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-[#005BAC]"
                >
                  {unidades.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.nome} ({u.municipio})
                    </option>
                  ))}
                </select>
              </div>

              {/* Status */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Status de Acesso
                </label>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 text-xs font-medium cursor-pointer">
                    <input
                      type="radio"
                      name="editStatus"
                      value="ativo"
                      checked={editProfStatus === 'ativo'}
                      onChange={() => setEditProfStatus('ativo')}
                      className="text-[#005BAC] focus:ring-[#005BAC]"
                    />
                    <span className="text-emerald-700 dark:text-emerald-400 font-bold">Ativo</span>
                  </label>
                  <label className="flex items-center gap-2 text-xs font-medium cursor-pointer">
                    <input
                      type="radio"
                      name="editStatus"
                      value="inativo"
                      checked={editProfStatus === 'inativo'}
                      onChange={() => setEditProfStatus('inativo')}
                      className="text-[#005BAC] focus:ring-[#005BAC]"
                    />
                    <span className="text-amber-700 dark:text-amber-400 font-bold">Inativo</span>
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsEditProfModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-[#005BAC] hover:bg-[#004887] flex items-center gap-2 shadow-md cursor-pointer disabled:opacity-60"
                >
                  {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  <span>Salvar Alterações</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: NOVA UNIDADE CISEB ────────────────────────────────────── */}
      {isNewUnitModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-800 w-full max-w-lg rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-100 dark:border-slate-700 space-y-5 animate-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-[10px] font-bold text-purple-700 dark:text-purple-300 uppercase tracking-widest flex items-center gap-1.5 mb-1">
                  <span>Administração</span>
                  <ChevronRight className="w-3 h-3" />
                  <span>Unidades CISEB</span>
                  <ChevronRight className="w-3 h-3" />
                  <span className="text-slate-900 dark:text-white">Nova Unidade</span>
                </div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white">
                  Cadastrar Unidade Escolar
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsNewUnitModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateUnit} className="space-y-4">
              {/* Nome Oficial */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Nome Oficial da Unidade *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: CISEB - EE NOVO PROGRESSO"
                  value={newUnitNome}
                  onChange={(e) => setNewUnitNome(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-[#005BAC]"
                />
              </div>

              {/* Alerta de Similaridade */}
              {similarUnitWarning && (
                <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs space-y-2">
                  <div className="flex items-center gap-1.5 font-bold text-amber-700 dark:text-amber-300">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>Atenção: Unidade Semelhante Já Existente</span>
                  </div>
                  <p className="text-[11px] leading-relaxed">
                    Detectamos uma unidade cadastrada com nome similar:{' '}
                    <strong>"{similarUnitWarning.nome}"</strong> ({similarUnitWarning.municipio}).
                    Verifique se não se trata de uma duplicidade antes de continuar.
                  </p>
                  <label className="flex items-center gap-2 pt-1 font-bold text-[11px] text-amber-900 dark:text-amber-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={confirmSimilarBypass}
                      onChange={(e) => setConfirmSimilarBypass(e.target.checked)}
                      className="rounded text-amber-600 focus:ring-amber-500"
                    />
                    <span>Confirmo que é uma nova unidade distinta e desejo cadastrá-la.</span>
                  </label>
                </div>
              )}

              {/* Código Identificador */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Código da Unidade (ID Único Firestore) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="ciseb-ee-novo-progresso"
                  value={newUnitCodigo}
                  onChange={(e) => setNewUnitCodigo(e.target.value.toLowerCase().replace(/[^a-z0-9\-]/g, '-'))}
                  className="w-full px-3.5 py-2.5 rounded-xl text-xs font-mono bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-[#005BAC]"
                />
                <p className="text-[10px] text-slate-500 mt-1">
                  Identificador único sem espaços ou caracteres especiais. Utilizado para o vínculo com professores.
                </p>
              </div>

              {/* Município */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Município *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Novo Progresso"
                  value={newUnitMunicipio}
                  onChange={(e) => setNewUnitMunicipio(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-[#005BAC]"
                />
              </div>

              {/* Status */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Status
                </label>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 text-xs font-medium cursor-pointer">
                    <input
                      type="radio"
                      name="statusUnit"
                      value="ativo"
                      checked={newUnitStatus === 'ativo'}
                      onChange={() => setNewUnitStatus('ativo')}
                      className="text-[#005BAC] focus:ring-[#005BAC]"
                    />
                    <span className="text-emerald-700 dark:text-emerald-400 font-bold">Ativa</span>
                  </label>
                  <label className="flex items-center gap-2 text-xs font-medium cursor-pointer">
                    <input
                      type="radio"
                      name="statusUnit"
                      value="inativo"
                      checked={newUnitStatus === 'inativo'}
                      onChange={() => setNewUnitStatus('inativo')}
                      className="text-[#005BAC] focus:ring-[#005BAC]"
                    />
                    <span className="text-amber-700 dark:text-amber-400 font-bold">Inativa</span>
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsNewUnitModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={actionLoading || (!!similarUnitWarning && !confirmSimilarBypass)}
                  className="px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-[#005BAC] hover:bg-[#004887] flex items-center gap-2 shadow-md cursor-pointer disabled:opacity-60"
                >
                  {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  <span>Cadastrar Unidade</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: EDITAR UNIDADE CISEB ──────────────────────────────────── */}
      {isEditUnitModalOpen && editingUnit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-800 w-full max-w-lg rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-100 dark:border-slate-700 space-y-5 animate-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="text-[10px] font-bold text-purple-700 dark:text-purple-300 uppercase tracking-widest block mb-1">
                  Administração CISEB
                </span>
                <h3 className="text-lg font-black text-slate-900 dark:text-white">
                  Editar Unidade Escolar
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsEditUnitModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditUnit} className="space-y-4">
              {/* Código Identificador (somente leitura para integridade relacional) */}
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">
                  Código da Unidade (ID Relacional)
                </label>
                <input
                  type="text"
                  disabled
                  value={editingUnit.id}
                  className="w-full px-3.5 py-2.5 rounded-xl text-xs font-mono bg-slate-100 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-slate-500 cursor-not-allowed"
                />
              </div>

              {/* Nome Oficial */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Nome Oficial da Unidade *
                </label>
                <input
                  type="text"
                  required
                  value={editUnitNome}
                  onChange={(e) => setEditUnitNome(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-[#005BAC]"
                />
              </div>

              {/* Município */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Município *
                </label>
                <input
                  type="text"
                  required
                  value={editUnitMunicipio}
                  onChange={(e) => setEditUnitMunicipio(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-[#005BAC]"
                />
              </div>

              {/* Status */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Status
                </label>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 text-xs font-medium cursor-pointer">
                    <input
                      type="radio"
                      name="editStatusUnit"
                      value="ativo"
                      checked={editUnitStatus === 'ativo'}
                      onChange={() => setEditUnitStatus('ativo')}
                      className="text-[#005BAC] focus:ring-[#005BAC]"
                    />
                    <span className="text-emerald-700 dark:text-emerald-400 font-bold">Ativa</span>
                  </label>
                  <label className="flex items-center gap-2 text-xs font-medium cursor-pointer">
                    <input
                      type="radio"
                      name="editStatusUnit"
                      value="inativo"
                      checked={editUnitStatus === 'inativo'}
                      onChange={() => setEditUnitStatus('inativo')}
                      className="text-[#005BAC] focus:ring-[#005BAC]"
                    />
                    <span className="text-amber-700 dark:text-amber-400 font-bold">Inativa</span>
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsEditUnitModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-[#005BAC] hover:bg-[#004887] flex items-center gap-2 shadow-md cursor-pointer disabled:opacity-60"
                >
                  {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  <span>Salvar Alterações</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: AVISO DE BLOQUEIO DE EXCLUSÃO DE UNIDADE ─────────────── */}
      {deletionBlockInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-800 w-full max-w-md rounded-3xl p-6 sm:p-8 shadow-2xl border border-amber-200 dark:border-amber-800 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1.5">
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                Exclusão Bloqueada por Integridade
              </h3>
              <p className="text-xs font-bold text-[#005BAC] dark:text-sky-300">
                {deletionBlockInfo.unidadeNome}
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              {deletionBlockInfo.motivo}
            </div>

            <p className="text-[11px] text-slate-500 text-center">
              Para suspender novas atribuições sem comprometer os registros históricos, altere o status desta unidade para{' '}
              <strong>"Inativa"</strong>.
            </p>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => setDeletionBlockInfo(null)}
                className="w-full py-2.5 rounded-xl font-bold text-xs bg-slate-900 dark:bg-slate-700 hover:bg-slate-800 text-white cursor-pointer shadow-sm transition-all"
              >
                Compreendi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
