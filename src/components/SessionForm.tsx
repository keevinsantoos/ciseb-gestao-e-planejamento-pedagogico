import React, { useState, useEffect } from 'react';
import {
  CisebSessionPlan,
  AuthUser,
  MODALIDADES_OPTIONS,
  TEMAS_IMERSAO_OPTIONS,
  TURMA_PARTICIPANTE_OPTIONS,
  BNCC_COMPETENCIAS_OPTIONS,
  BNCC_EIXOS_HABILIDADES_OPTIONS,
  ODS_OPTIONS,
  TRILHAS_IMERSAO_OPTIONS,
  TIPO_PROTOTIPO_OPTIONS,
} from '../types';
import {
  Sparkles,
  Building2,
  UserCheck,
  BookMarked,
  Clock,
  Compass,
  Lightbulb,
  Cpu,
  CheckCircle2,
  Check,
  ListChecks,
  Wrench,
  Bot,
  Layers,
  GraduationCap,
  ChevronRight,
  ChevronLeft,
  ArrowRight,
  Globe2,
  TreePine,
  Lightbulb as IdeaIcon,
  Hammer,
  HeartHandshake,
  Save,
  FileSpreadsheet,
  Printer,
  ShieldCheck,
} from 'lucide-react';
import {
  PopoverRoot,
  PopoverTrigger,
  PopoverContent,
  PopoverHeader,
  PopoverBody,
  PopoverButton,
} from './ui/popover';
import { FormStepper, FormStepItem } from './FormStepper';

interface SessionFormProps {
  plan: CisebSessionPlan;
  currentUser?: AuthUser | null;
  onChange: (updated: CisebSessionPlan) => void;
  onAiAutoFillSection: (sectionKey: string) => void;
  isAiLoading: boolean;
  onSave: () => void;
  onGenerateReport: () => void;
  onOpenAiDrawer?: () => void;
}

export const SessionForm: React.FC<SessionFormProps> = ({
  plan,
  currentUser,
  onChange,
  onAiAutoFillSection,
  isAiLoading,
  onSave,
  onGenerateReport,
  onOpenAiDrawer,
}) => {
  const [activeStep, setActiveStep] = useState<number>(1);

  // Automatically sync unit and teacher name from logged in user if not filled
  useEffect(() => {
    if (currentUser) {
      let shouldUpdate = false;
      const updated = { ...plan };

      if (!plan.unidadeCiseb && currentUser.unidadeCiseb) {
        updated.unidadeCiseb = currentUser.unidadeCiseb;
        shouldUpdate = true;
      }
      if (!plan.professorFormador && currentUser.nome) {
        updated.professorFormador = currentUser.nome;
        shouldUpdate = true;
      }
      if (!plan.authorEmail && currentUser.email) {
        updated.authorEmail = currentUser.email;
        shouldUpdate = true;
      }
      if (!plan.authorNome && currentUser.nome) {
        updated.authorNome = currentUser.nome;
        shouldUpdate = true;
      }

      if (shouldUpdate) {
        onChange({
          ...updated,
          updatedAt: new Date().toISOString(),
        });
      }
    }
  }, [currentUser, plan.unidadeCiseb, plan.professorFormador]);

  // Step Completion Trackers
  const isStep1Complete = Boolean(
    plan.modalidade &&
      (plan.unidadeCiseb || currentUser?.unidadeCiseb) &&
      (plan.professorFormador || currentUser?.nome)
  );

  const isStep2Complete = Boolean(
    plan.temaImersao &&
      plan.tituloSuporte?.trim() &&
      plan.cargaHorariaAulas?.trim() &&
      plan.turmaParticipante
  );

  const isStep3Complete = Boolean(
    (plan.bnccCompetencias && plan.bnccCompetencias.length > 0) ||
      (plan.bnccHabilidadesEixo && plan.bnccHabilidadesEixo.length > 0) ||
      (plan.odsAplicada && plan.odsAplicada.length > 0) ||
      plan.trilhaImersao
  );

  const isStep4Complete = Boolean(
    plan.fase1Empatia?.trim() &&
      plan.fase2TempestadeIdeias?.trim() &&
      plan.fase3PrototipagemSolucao?.trim()
  );

  const isStep5Complete = Boolean(
    plan.tipoPrototipo &&
      plan.recursosDidaticosTecnologicos?.trim() &&
      plan.roteiroPedagógico?.trim() &&
      plan.expectativaAprendizagem?.trim()
  );

  // Helper to check completion of Options 1, 2 and 3 for MAG AI mentorship context
  const areOptions123Ready = isStep1Complete && isStep2Complete && isStep3Complete;

  // Calculate Overall Completion
  const calculateTotalProgress = () => {
    let score = 0;
    if (plan.modalidade) score += 1;
    if (plan.unidadeCiseb || currentUser?.unidadeCiseb) score += 1;
    if (plan.professorFormador || currentUser?.nome) score += 1;
    if (plan.temaImersao) score += 1;
    if (plan.tituloSuporte?.trim()) score += 1;
    if (plan.cargaHorariaAulas?.trim()) score += 1;
    if (plan.turmaParticipante) score += 1;
    if (plan.bnccCompetencias?.length > 0) score += 1;
    if (plan.bnccHabilidadesEixo?.length > 0) score += 1;
    if (plan.odsAplicada?.length > 0) score += 1;
    if (plan.trilhaImersao) score += 1;
    if (plan.fase1Empatia?.trim()) score += 1;
    if (plan.fase2TempestadeIdeias?.trim()) score += 1;
    if (plan.fase3PrototipagemSolucao?.trim()) score += 1;
    if (plan.tipoPrototipo) score += 1;
    if (plan.recursosDidaticosTecnologicos?.trim()) score += 1;
    if (plan.roteiroPedagógico?.trim()) score += 1;
    if (plan.expectativaAprendizagem?.trim()) score += 1;

    return Math.round((score / 18) * 100);
  };

  const completionPercentage = calculateTotalProgress();

  // 5 Real Stages Definition
  const formSteps: FormStepItem[] = [
    {
      id: 1,
      sectionId: 'secao-1-identificacao',
      title: 'Identificação do Atendimento e Unidade',
      shortTitle: 'Identificação',
      description: 'Modalidade, Unidade CISEB e Formador Responsável',
      icon: Building2,
      isComplete: isStep1Complete,
    },
    {
      id: 2,
      sectionId: 'secao-2-tema',
      title: 'Planejamento do Suporte e Tema',
      shortTitle: 'Planejamento',
      description: 'Tema de Imersão, Título do Suporte, Carga Horária e Turma',
      icon: BookMarked,
      isComplete: isStep2Complete,
    },
    {
      id: 3,
      sectionId: 'secao-3-bncc',
      title: 'Alinhamento Pedagógico (BNCC e ODS)',
      shortTitle: 'BNCC & ODS',
      description: 'Competências, Eixos, ODS Aplicada e Trilha Amazônica',
      icon: Cpu,
      isComplete: isStep3Complete,
    },
    {
      id: 4,
      sectionId: 'secao-4-metodologia',
      title: 'Design Thinking Framework',
      shortTitle: 'Design Thinking',
      description: 'Fases Metodológicas: Empatizar, Idear e Prototipar',
      icon: Compass,
      isComplete: isStep4Complete,
    },
    {
      id: 5,
      sectionId: 'secao-5-recursos',
      title: 'Execução Técnica e Recursos',
      shortTitle: 'Execução',
      description: 'Tipo de Protótipo, Recursos, Roteiro e Aprendizagem',
      icon: Wrench,
      isComplete: isStep5Complete,
    },
  ];

  // Helper to handle text/select changes
  const handleChange = (field: keyof CisebSessionPlan, value: any) => {
    onChange({
      ...plan,
      [field]: value,
      updatedAt: new Date().toISOString(),
    });
  };

  // Helper for multi-select array fields
  const handleToggleArrayItem = (
    field: 'bnccCompetencias' | 'bnccHabilidadesEixo' | 'odsAplicada',
    item: string
  ) => {
    const current = plan[field] || [];
    const updated = current.includes(item)
      ? current.filter((i) => i !== item)
      : [...current, item];
    handleChange(field, updated);
  };

  // Scroll to section handler
  const handleSelectStep = (stepNumber: number, sectionId: string) => {
    setActiveStep(stepNumber);
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Scroll spy to update active step indicator naturally
  useEffect(() => {
    const observerCallback: IntersectionObserverCallback = (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const stepMatch = formSteps.find((s) => s.sectionId === entry.target.id);
          if (stepMatch) {
            setActiveStep(stepMatch.id);
          }
        }
      });
    };

    const observer = new IntersectionObserver(observerCallback, {
      root: null,
      rootMargin: '-20% 0px -60% 0px',
      threshold: 0.1,
    });

    formSteps.forEach((step) => {
      const el = document.getElementById(step.sectionId);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  return (
    <div className="max-w-6xl mx-auto py-4 sm:py-6 px-3 sm:px-5 space-y-5">
      {/* 1. Header Institucional CISEB - SEDUC Pará */}
      <div className="bg-gradient-to-r from-[#005BAC] via-[#004e96] to-[#013780] rounded-2xl p-4 sm:p-6 text-white shadow-md border border-[#012b66] flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all">
        <div className="space-y-1.5 max-w-3xl">
          <div className="inline-flex items-center gap-2 bg-white/15 border border-white/20 text-sky-100 text-[11px] px-3 py-0.5 rounded-full font-bold tracking-wider backdrop-blur-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            CISEB • SEDUC/PA
          </div>
          <h2 className="text-base sm:text-xl font-bold tracking-tight text-white">
            Plano de Trabalho Docente e Monitoramento Pedagógico
          </h2>
          <p className="text-sky-100/90 text-xs sm:text-sm leading-relaxed text-justify">
            Instrumento oficial de planejamento, registro e monitoramento pedagógico para acompanhamento das ações formativas, experimentação científica e desenvolvimento de projetos práticos alinhados à BNCC Computação, aos Objetivos de Desenvolvimento Sustentável (ODS) e às diretrizes curriculares da SEDUC/PA.
          </p>
        </div>

        <div className="flex flex-row md:flex-col items-center md:items-end justify-between gap-2 border-t md:border-t-0 md:border-l border-white/20 pt-3 md:pt-0 md:pl-6 shrink-0">
          <div className="text-left md:text-right">
            <span className="text-[10px] uppercase font-semibold text-sky-200/80 block">
              Status do Registro
            </span>
            <span className="text-xs font-bold text-white flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />
              Sessão Institucional Ativa
            </span>
          </div>
        </div>
      </div>

      {/* 2. Stepper Principal de 5 Etapas (Sticky & Interativo) */}
      <FormStepper
        currentStep={activeStep}
        onSelectStep={handleSelectStep}
        steps={formSteps}
        completionPercentage={completionPercentage}
      />

      {/* ========================================================================= */}
      {/* ETAPA 1: Identificação do Atendimento e Unidade */}
      {/* ========================================================================= */}
      <section
        id="secao-1-identificacao"
        className={`bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 shadow-xs border transition-all duration-200 scroll-mt-36 ${
          activeStep === 1
            ? 'border-[#005BAC]/40 ring-2 ring-[#005BAC]/15 shadow-sm'
            : 'border-slate-200/90 dark:border-slate-800'
        }`}
      >
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-[#005BAC] dark:text-sky-400 flex items-center justify-center font-bold text-xs shrink-0 border border-blue-100 dark:border-blue-900/50">
              1
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                Identificação do atendimento e unidade
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Defina o formato de atendimento e confirme a unidade vinculada
              </p>
            </div>
          </div>
          {isStep1Complete && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/40">
              <Check className="w-3 h-3 stroke-[3]" /> Concluída
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* 1. Modalidade de Atendimento */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between">
              <span>1. Modalidade de Atendimento *</span>
            </label>
            <PopoverRoot>
              <PopoverTrigger className="rounded-lg p-2.5 text-xs bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-[#005BAC]">
                <Layers className="w-3.5 h-3.5 text-[#005BAC] dark:text-sky-400 shrink-0" />
                <span className="truncate">{plan.modalidade || 'Selecione a modalidade...'}</span>
              </PopoverTrigger>
              <PopoverContent className="w-full">
                <PopoverHeader>Modalidade de Atendimento</PopoverHeader>
                <PopoverBody>
                  {MODALIDADES_OPTIONS.map((m) => (
                    <PopoverButton
                      key={m}
                      isSelected={plan.modalidade === m}
                      onClick={() => handleChange('modalidade', m)}
                    >
                      <Layers className="w-3.5 h-3.5 text-[#005BAC] dark:text-sky-400 shrink-0" />
                      <span className="truncate">{m}</span>
                    </PopoverButton>
                  ))}
                </PopoverBody>
              </PopoverContent>
            </PopoverRoot>
          </div>

          {/* 2. Unidade CISEB - Vinculada ao Login */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between">
              <span>2. Unidade CISEB *</span>
              <span className="text-[10px] text-slate-400 font-normal">Vinculada</span>
            </label>
            <div className="relative flex items-center">
              <input
                type="text"
                readOnly
                value={plan.unidadeCiseb || currentUser?.unidadeCiseb || 'Unidade CISEB'}
                className="w-full p-2.5 pl-8 pr-3 bg-slate-100/90 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-800 dark:text-slate-200 select-none cursor-default focus:outline-none"
                title="Unidade vinculada automaticamente à sua conta de acesso"
              />
              <Building2 className="w-3.5 h-3.5 text-[#005BAC] dark:text-sky-400 absolute left-2.5 top-3" />
            </div>
          </div>

          {/* 3. Professor(a) Formador(a) - Vinculado ao Login */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between">
              <span>3. Professor(a) Formador(a) *</span>
              <span className="text-[10px] text-slate-400 font-normal">Autenticado</span>
            </label>
            <div className="relative flex items-center">
              <input
                type="text"
                readOnly
                value={plan.professorFormador || currentUser?.nome || 'Professor(a) Formador(a)'}
                className="w-full p-2.5 pl-8 pr-3 bg-slate-100/90 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-800 dark:text-slate-200 select-none cursor-default focus:outline-none"
                title="Formador(a) autenticado(a) na sessão ativa"
              />
              <UserCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 absolute left-2.5 top-3" />
            </div>
          </div>
        </div>

        {/* Step Progression Button */}
        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
          <button
            type="button"
            onClick={() => handleSelectStep(2, 'secao-2-tema')}
            className="px-4 py-2 rounded-lg bg-[#005BAC] hover:bg-[#004e96] text-white text-xs font-bold flex items-center gap-2 cursor-pointer transition-all shadow-xs"
          >
            <span>Continuar para Planejamento</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* ETAPA 2: Planejamento do Suporte & Tema */}
      {/* ========================================================================= */}
      <section
        id="secao-2-tema"
        className={`bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 shadow-xs border transition-all duration-200 scroll-mt-36 ${
          activeStep === 2
            ? 'border-[#005BAC]/40 ring-2 ring-[#005BAC]/15 shadow-sm'
            : 'border-slate-200/90 dark:border-slate-800'
        }`}
      >
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-[#005BAC] dark:text-sky-400 flex items-center justify-center font-bold text-xs shrink-0 border border-blue-100 dark:border-blue-900/50">
              2
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                Planejamento do suporte e tema
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Estruture a temática central, carga horária e o público participante
              </p>
            </div>
          </div>
          {isStep2Complete && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/40">
              <Check className="w-3 h-3 stroke-[3]" /> Concluída
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* 4. Tema de Imersão */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
              4. Tema de Imersão *
            </label>
            <PopoverRoot>
              <PopoverTrigger className="rounded-lg p-2.5 text-xs bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-[#005BAC]">
                <BookMarked className="w-3.5 h-3.5 text-[#005BAC] dark:text-sky-400 shrink-0" />
                <span className="truncate">{plan.temaImersao || 'Selecione tema...'}</span>
              </PopoverTrigger>
              <PopoverContent className="w-full">
                <PopoverHeader>Temas de Imersão</PopoverHeader>
                <PopoverBody>
                  {TEMAS_IMERSAO_OPTIONS.map((t) => (
                    <PopoverButton
                      key={t}
                      isSelected={plan.temaImersao === t}
                      onClick={() => handleChange('temaImersao', t)}
                    >
                      <BookMarked className="w-3.5 h-3.5 text-[#005BAC] dark:text-sky-400 shrink-0" />
                      <span className="truncate">{t}</span>
                    </PopoverButton>
                  ))}
                </PopoverBody>
              </PopoverContent>
            </PopoverRoot>
          </div>

          {/* 5. Título do Suporte de Prototipagem */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
              5. Título do Suporte *
            </label>
            <input
              type="text"
              placeholder="Ex: Irrigação com Arduino..."
              value={plan.tituloSuporte}
              onChange={(e) => handleChange('tituloSuporte', e.target.value)}
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#005BAC] focus:border-[#005BAC] transition-all"
            />
          </div>

          {/* Carga Horária / Aulas */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
              Carga Horária / Aulas *
            </label>
            <div className="relative flex items-center">
              <input
                type="text"
                placeholder="Ex: 04 Horas-Aula..."
                value={plan.cargaHorariaAulas}
                onChange={(e) => handleChange('cargaHorariaAulas', e.target.value)}
                className="w-full p-2.5 pl-8 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#005BAC] focus:border-[#005BAC] transition-all"
              />
              <Clock className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-3" />
            </div>
          </div>

          {/* Turma Participante */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
              Turma / Público *
            </label>
            <PopoverRoot>
              <PopoverTrigger className="rounded-lg p-2.5 text-xs bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-[#005BAC]">
                <GraduationCap className="w-3.5 h-3.5 text-[#005BAC] dark:text-sky-400 shrink-0" />
                <span className="truncate">{plan.turmaParticipante || 'Selecione turma...'}</span>
              </PopoverTrigger>
              <PopoverContent className="w-full">
                <PopoverHeader>Público / Turma Participante</PopoverHeader>
                <PopoverBody>
                  {TURMA_PARTICIPANTE_OPTIONS.map((tp) => (
                    <PopoverButton
                      key={tp}
                      isSelected={plan.turmaParticipante === tp}
                      onClick={() => handleChange('turmaParticipante', tp)}
                    >
                      <GraduationCap className="w-3.5 h-3.5 text-[#005BAC] dark:text-sky-400 shrink-0" />
                      <span className="truncate">{tp}</span>
                    </PopoverButton>
                  ))}
                </PopoverBody>
              </PopoverContent>
            </PopoverRoot>
          </div>
        </div>

        {/* Step Progression Buttons */}
        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <button
            type="button"
            onClick={() => handleSelectStep(1, 'secao-1-identificacao')}
            className="px-3.5 py-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span>Voltar</span>
          </button>
          <button
            type="button"
            onClick={() => handleSelectStep(3, 'secao-3-bncc')}
            className="px-4 py-2 rounded-lg bg-[#005BAC] hover:bg-[#004e96] text-white text-xs font-bold flex items-center gap-2 cursor-pointer transition-all shadow-xs"
          >
            <span>Continuar para Alinhamento BNCC/ODS</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* ETAPA 3: Alinhamento Pedagógico (BNCC, ODS & Trilhas) */}
      {/* ========================================================================= */}
      <section
        id="secao-3-bncc"
        className={`bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 shadow-xs border transition-all duration-200 scroll-mt-36 ${
          activeStep === 3
            ? 'border-[#005BAC]/40 ring-2 ring-[#005BAC]/15 shadow-sm'
            : 'border-slate-200/90 dark:border-slate-800'
        }`}
      >
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-[#005BAC] dark:text-sky-400 flex items-center justify-center font-bold text-xs shrink-0 border border-blue-100 dark:border-blue-900/50">
              3
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                Alinhamento pedagógico (BNCC & ODS)
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Vincule competências computacionais, eixos formativos e objetivos sustentáveis
              </p>
            </div>
          </div>
          {isStep3Complete && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/40">
              <Check className="w-3 h-3 stroke-[3]" /> Concluída
            </span>
          )}
        </div>

        <div className="space-y-5">
          {/* BNCC Computação - Competências */}
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-2">
              Competências BNCC Computação
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {BNCC_COMPETENCIAS_OPTIONS.map((comp) => {
                const isSelected = (plan.bnccCompetencias || []).includes(comp);
                return (
                  <button
                    key={comp}
                    type="button"
                    onClick={() => handleToggleArrayItem('bnccCompetencias', comp)}
                    className={`p-3 rounded-xl border text-xs font-medium text-left transition-all flex items-start gap-2.5 cursor-pointer ${
                      isSelected
                        ? 'bg-[#005BAC] text-white border-[#005BAC] shadow-xs'
                        : 'bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100/80 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-md border mt-0.5 shrink-0 flex items-center justify-center transition-colors ${
                        isSelected
                          ? 'bg-white text-[#005BAC] border-white'
                          : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800'
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                    <span className="leading-snug">{comp}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* BNCC Computação - Eixos / Habilidades */}
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-2">
              Eixo de Habilidade BNCC Computação
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {BNCC_EIXOS_HABILIDADES_OPTIONS.map((eixo) => {
                const isSelected = (plan.bnccHabilidadesEixo || []).includes(eixo);
                return (
                  <button
                    key={eixo}
                    type="button"
                    onClick={() => handleToggleArrayItem('bnccHabilidadesEixo', eixo)}
                    className={`p-3 rounded-xl border text-xs font-medium text-left transition-all flex items-start gap-2.5 cursor-pointer ${
                      isSelected
                        ? 'bg-[#004e96] text-white border-[#004e96] shadow-xs font-semibold'
                        : 'bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100/80 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-md border mt-0.5 shrink-0 flex items-center justify-center transition-colors ${
                        isSelected
                          ? 'bg-white text-[#004e96] border-white'
                          : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800'
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                    <span className="leading-snug">{eixo}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ODS e Trilha */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
            {/* ODS Aplicada */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                ODS Aplicada (Objetivos de Desenvolvimento Sustentável)
              </label>
              <div className="space-y-2">
                {ODS_OPTIONS.map((ods) => {
                  const isSelected = (plan.odsAplicada || []).includes(ods);
                  const isEnvironmental = ods.includes('11') || ods.includes('12') || ods.includes('13');
                  const isSocial = ods.includes('04');

                  return (
                    <button
                      key={ods}
                      type="button"
                      onClick={() => handleToggleArrayItem('odsAplicada', ods)}
                      className={`w-full p-2.5 rounded-xl border text-xs font-medium text-left transition-all flex items-center gap-2.5 cursor-pointer ${
                        isSelected
                          ? isEnvironmental
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                            : isSocial
                            ? 'bg-[#005BAC] text-white border-[#005BAC] shadow-xs'
                            : 'bg-amber-600 text-white border-amber-600 shadow-xs'
                          : isEnvironmental
                          ? 'bg-emerald-50/60 dark:bg-emerald-950/20 text-slate-800 dark:text-slate-200 border-emerald-200/70 dark:border-emerald-800/40 hover:bg-emerald-100/60'
                          : isSocial
                          ? 'bg-sky-50/60 dark:bg-sky-950/20 text-slate-800 dark:text-slate-200 border-sky-200/70 dark:border-sky-800/40 hover:bg-sky-100/60'
                          : 'bg-amber-50/60 dark:bg-amber-950/20 text-slate-800 dark:text-slate-200 border-amber-200/70 dark:border-amber-800/40 hover:bg-amber-100/60'
                      }`}
                    >
                      <div
                        className={`w-4 h-4 rounded-md border shrink-0 flex items-center justify-center transition-colors ${
                          isSelected
                            ? 'bg-white text-slate-900 border-white'
                            : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800'
                        }`}
                      >
                        {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                      <span className="leading-snug">{ods}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Trilha das Imersões (Contexto Amazônia) */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                Trilha das Imersões (Contexto Amazônia)
              </label>
              <div className="space-y-2">
                {TRILHAS_IMERSAO_OPTIONS.map((trilha) => {
                  const isSelected = plan.trilhaImersao === trilha;
                  return (
                    <button
                      key={trilha}
                      type="button"
                      onClick={() => handleChange('trilhaImersao', trilha)}
                      className={`w-full p-2.5 rounded-xl border text-xs font-medium text-left transition-all flex items-center gap-2.5 cursor-pointer ${
                        isSelected
                          ? 'bg-[#005BAC] text-white border-[#005BAC] font-semibold shadow-xs'
                          : 'bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100/80 dark:hover:bg-slate-800'
                      }`}
                    >
                      <div
                        className={`w-4 h-4 rounded-full border shrink-0 flex items-center justify-center transition-colors ${
                          isSelected
                            ? 'bg-emerald-400 border-emerald-400'
                            : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800'
                        }`}
                      >
                        {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </div>
                      <span className="leading-snug">{trilha}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Step Progression Buttons */}
        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <button
            type="button"
            onClick={() => handleSelectStep(2, 'secao-2-tema')}
            className="px-3.5 py-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span>Voltar</span>
          </button>
          <button
            type="button"
            onClick={() => handleSelectStep(4, 'secao-4-metodologia')}
            className="px-4 py-2 rounded-lg bg-[#005BAC] hover:bg-[#004e96] text-white text-xs font-bold flex items-center gap-2 cursor-pointer transition-all shadow-xs"
          >
            <span>Continuar para Design Thinking</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* ETAPA 4: Design Thinking Framework (Metodologia) */}
      {/* ========================================================================= */}
      <section
        id="secao-4-metodologia"
        className={`bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 shadow-xs border transition-all duration-200 scroll-mt-36 ${
          activeStep === 4
            ? 'border-[#005BAC]/40 ring-2 ring-[#005BAC]/15 shadow-sm'
            : 'border-slate-200/90 dark:border-slate-800'
        }`}
      >
        <div className="flex flex-wrap items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 mb-4 gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-[#005BAC] dark:text-sky-400 flex items-center justify-center font-bold text-xs shrink-0 border border-blue-100 dark:border-blue-900/50">
              4
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                Design Thinking Framework
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Subetapas pedagógicas: Empatizar, Idear e Prototipar
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isStep4Complete && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/40">
                <Check className="w-3 h-3 stroke-[3]" /> Concluída
              </span>
            )}
          </div>
        </div>

        {/* Dynamic Context Banner for Options 1, 2 and 3 */}
        {areOptions123Ready ? (
          <div className="mb-4 bg-gradient-to-r from-blue-50 to-sky-50 dark:from-slate-800/80 dark:to-blue-950/40 border border-blue-200/80 dark:border-blue-900/40 rounded-xl p-3.5 shadow-xs">
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase flex items-center gap-1 shadow-xs">
                  <CheckCircle2 className="w-3 h-3" /> Opções 1, 2 e 3 Carregadas
                </span>
                <span className="text-xs font-bold text-[#005BAC] dark:text-sky-300">
                  Pronto para construir as Fases com alternativas da MAG
                </span>
              </div>
              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                A MAG utilizará como âncora a <strong>{plan.unidadeCiseb || 'Unidade CISEB'}</strong>, o tema <strong>{plan.temaImersao || plan.tituloSuporte || 'definido'}</strong> ({plan.turmaParticipante || 'Turma'}), articulando com <strong>{plan.odsAplicada?.[0] || 'ODS'}</strong> e <strong>{plan.bnccHabilidadesEixo?.[0] || 'BNCC'}</strong> para sugerir caminhos e alternativas pedagógicas.
              </p>
            </div>
          </div>
        ) : (
          <div className="mb-4 bg-amber-50/90 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 rounded-xl p-3.5 text-xs text-amber-900 dark:text-amber-200 space-y-1.5">
            <div className="flex items-center gap-1.5 font-bold text-amber-950 dark:text-amber-200">
              <Sparkles className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              <span>Preencha as Opções 1, 2 e 3 para a MAG orientar e apresentar alternativas</span>
            </div>
            <p className="text-[11px] text-amber-800 dark:text-amber-300 leading-tight">
              Para que a MAG sugira alternativas personalizadas para a Fase 1 (Empatia), Fase 2 (Ideação) e Fase 3 (Prototipagem), preencha:
            </p>
            <div className="flex flex-wrap gap-1.5 pt-1">
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 ${
                  isStep1Complete
                    ? 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300 border border-green-300'
                    : 'bg-white dark:bg-slate-800 text-amber-800 dark:text-amber-300 border border-amber-300'
                }`}
              >
                {isStep1Complete ? '✓' : '○'} 1. Identificação / Unidade
              </span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 ${
                  isStep2Complete
                    ? 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300 border border-green-300'
                    : 'bg-white dark:bg-slate-800 text-amber-800 dark:text-amber-300 border border-amber-300'
                }`}
              >
                {isStep2Complete ? '✓' : '○'} 2. Planejamento / Tema
              </span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 ${
                  isStep3Complete
                    ? 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300 border border-green-300'
                    : 'bg-white dark:bg-slate-800 text-amber-800 dark:text-amber-300 border border-amber-300'
                }`}
              >
                {isStep3Complete ? '✓' : '○'} 3. Alinhamento BNCC & ODS
              </span>
            </div>
          </div>
        )}

        {/* 3 Subetapas: Empatizar, Idear, Prototipar */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          {/* Subetapa 1: Empatizar */}
          <div className="flex flex-col bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-xs hover:border-rose-300 dark:hover:border-rose-700 transition-colors">
            <div className="bg-rose-50 dark:bg-rose-950/30 px-3 py-2 border-b border-rose-100 dark:border-rose-900/40 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <HeartHandshake className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                <span className="text-xs font-bold text-rose-800 dark:text-rose-300">
                  Fase 1: Empatia
                </span>
              </div>
              <span className="text-[10px] text-slate-400 font-medium">Subetapa 4.1</span>
            </div>
            <div className="p-3 space-y-1.5 flex-1 flex flex-col">
              <textarea
                rows={5}
                placeholder="Levantamento de dados, contextualização do problema e investigação de dores da comunidade..."
                value={plan.fase1Empatia}
                onChange={(e) => handleChange('fase1Empatia', e.target.value)}
                className="w-full h-full min-h-[110px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-xs text-slate-800 dark:text-slate-100 placeholder:text-slate-400 leading-relaxed focus:outline-none focus:ring-2 focus:ring-rose-400 focus:border-rose-400"
              />
            </div>
          </div>

          {/* Subetapa 2: Ideação */}
          <div className="flex flex-col bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-xs hover:border-amber-300 dark:hover:border-amber-700 transition-colors">
            <div className="bg-amber-50 dark:bg-amber-950/30 px-3 py-2 border-b border-amber-100 dark:border-amber-900/40 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <IdeaIcon className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                <span className="text-xs font-bold text-amber-800 dark:text-amber-300">
                  Fase 2: Ideação
                </span>
              </div>
              <span className="text-[10px] text-slate-400 font-medium">Subetapa 4.2</span>
            </div>
            <div className="p-3 space-y-1.5 flex-1 flex flex-col">
              <textarea
                rows={5}
                placeholder="Brainstorming, definição de componentes, seleção de soluções e refinamento de hipóteses..."
                value={plan.fase2TempestadeIdeias}
                onChange={(e) => handleChange('fase2TempestadeIdeias', e.target.value)}
                className="w-full h-full min-h-[110px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-xs text-slate-800 dark:text-slate-100 placeholder:text-slate-400 leading-relaxed focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400"
              />
            </div>
          </div>

          {/* Subetapa 3: Prototipagem */}
          <div className="flex flex-col bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-xs hover:border-emerald-300 dark:hover:border-emerald-700 transition-colors">
            <div className="bg-emerald-50 dark:bg-emerald-950/30 px-3 py-2 border-b border-emerald-100 dark:border-emerald-900/40 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Hammer className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300">
                  Fase 3: Protótipo
                </span>
              </div>
              <span className="text-[10px] text-slate-400 font-medium">Subetapa 4.3</span>
            </div>
            <div className="p-3 space-y-1.5 flex-1 flex flex-col">
              <textarea
                rows={5}
                placeholder="Montagem física/digital, circuitos eletrônicos, lógica em blocos e teste prático da solução..."
                value={plan.fase3PrototipagemSolucao}
                onChange={(e) => handleChange('fase3PrototipagemSolucao', e.target.value)}
                className="w-full h-full min-h-[110px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-xs text-slate-800 dark:text-slate-100 placeholder:text-slate-400 leading-relaxed focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400"
              />
            </div>
          </div>
        </div>

        {/* Step Progression Buttons */}
        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <button
            type="button"
            onClick={() => handleSelectStep(3, 'secao-3-bncc')}
            className="px-3.5 py-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span>Voltar</span>
          </button>
          <button
            type="button"
            onClick={() => handleSelectStep(5, 'secao-5-recursos')}
            className="px-4 py-2 rounded-lg bg-[#005BAC] hover:bg-[#004e96] text-white text-xs font-bold flex items-center gap-2 cursor-pointer transition-all shadow-xs"
          >
            <span>Continuar para Execução Técnica</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* ETAPA 5: Detalhes Técnicos & Execução */}
      {/* ========================================================================= */}
      <section
        id="secao-5-recursos"
        className={`bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 shadow-xs border transition-all duration-200 scroll-mt-36 ${
          activeStep === 5
            ? 'border-[#005BAC]/40 ring-2 ring-[#005BAC]/15 shadow-sm'
            : 'border-slate-200/90 dark:border-slate-800'
        }`}
      >
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-[#005BAC] dark:text-sky-400 flex items-center justify-center font-bold text-xs shrink-0 border border-blue-100 dark:border-blue-900/50">
              5
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                Detalhes de execução técnica e roteiro
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Defina o tipo de produto, recursos didáticos, passo a passo e expectativas
              </p>
            </div>
          </div>
          {isStep5Complete && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/40">
              <Check className="w-3 h-3 stroke-[3]" /> Concluída
            </span>
          )}
        </div>

        <div className="space-y-4 text-xs">
          {/* Tipo de Protótipo */}
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-2">
              Tipo de Produto / Protótipo
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {TIPO_PROTOTIPO_OPTIONS.map((tipo) => {
                const isSelected = plan.tipoPrototipo === tipo;
                return (
                  <button
                    key={tipo}
                    type="button"
                    onClick={() => handleChange('tipoPrototipo', tipo)}
                    className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center text-center cursor-pointer border ${
                      isSelected
                        ? 'bg-[#005BAC] text-white border-[#005BAC] shadow-xs ring-2 ring-[#005BAC]/20'
                        : 'bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {tipo}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Recursos Didáticos e Tecnológicos */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
              Recursos Didáticos e Tecnológicos Utilizados
            </label>
            <input
              type="text"
              placeholder="Ex: Arduino, Sensor HL-69, Jumper Wires, Chromebooks, Protoboard..."
              value={plan.recursosDidaticosTecnologicos}
              onChange={(e) => handleChange('recursosDidaticosTecnologicos', e.target.value)}
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#005BAC] focus:border-[#005BAC]"
            />
          </div>

          {/* Roteiro Pedagógico */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
              Resumo do Roteiro Pedagógico (Passo a Passo)
            </label>
            <textarea
              rows={3}
              placeholder="1. Introdução à eletrônica; 2. Diagramação do circuito; 3. Lógica condicional; 4. Teste em campo real..."
              value={plan.roteiroPedagógico}
              onChange={(e) => handleChange('roteiroPedagógico', e.target.value)}
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-900 dark:text-slate-100 placeholder:text-slate-400 leading-relaxed focus:outline-none focus:ring-2 focus:ring-[#005BAC] focus:border-[#005BAC]"
            />
          </div>

          {/* Expectativa de Aprendizagem */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
              Expectativa de Aprendizagem
            </label>
            <textarea
              rows={3}
              placeholder="Compreender o funcionamento de sensores e atuar na lógica de programação para sustentabilidade..."
              value={plan.expectativaAprendizagem}
              onChange={(e) => handleChange('expectativaAprendizagem', e.target.value)}
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-900 dark:text-slate-100 placeholder:text-slate-400 leading-relaxed focus:outline-none focus:ring-2 focus:ring-[#005BAC] focus:border-[#005BAC]"
            />
          </div>
        </div>

        {/* Final Actions Dock */}
        <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => handleSelectStep(4, 'secao-4-metodologia')}
            className="w-full sm:w-auto px-3.5 py-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span>Voltar para Design Thinking</span>
          </button>

          <div className="w-full sm:w-auto flex items-center gap-2.5">
            <button
              type="button"
              onClick={onSave}
              className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-all shadow-xs"
            >
              <Save className="w-3.5 h-3.5 text-[#005BAC] dark:text-sky-400" />
              <span>Salvar Plano</span>
            </button>

            <button
              type="button"
              onClick={onGenerateReport}
              className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl bg-[#005BAC] hover:bg-[#004e96] text-white text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-all shadow-sm"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Gerar Relatório</span>
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
