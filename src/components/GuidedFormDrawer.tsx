import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  AlertCircle,
  Building2,
  GraduationCap,
  Layers,
  BookOpen,
  Wrench,
  FileCheck2,
  Check,
  Flame,
  Lightbulb,
  Cpu,
  ArrowRight
} from 'lucide-react';
import {
  FamilyDrawerRoot,
  FamilyDrawerPortal,
  FamilyDrawerOverlay,
  FamilyDrawerContent,
  FamilyDrawerClose,
  FamilyDrawerAnimatedWrapper,
  FamilyDrawerAnimatedContent,
  FamilyDrawerViewContent,
  useFamilyDrawer,
  ViewsRegistry
} from './ui/family-drawer';
import {
  CisebSessionPlan,
  MODALIDADES_OPTIONS,
  UNIDADES_CISEB_OPTIONS,
  PROFESSORES_FORMADORES_OPTIONS,
  TEMAS_IMERSAO_OPTIONS,
  TIPO_PROTOTIPO_OPTIONS,
  BNCC_COMPETENCIAS_OPTIONS,
  ODS_OPTIONS
} from '../types';

interface GuidedFormDrawerProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  currentPlan: CisebSessionPlan;
  onApplyPlan: (updatedPlan: CisebSessionPlan) => void;
}

// Validation Helpers
function isEtapa1Valid(plan: Partial<CisebSessionPlan>): boolean {
  return Boolean(
    plan.modalidade?.trim() &&
    plan.unidadeCiseb?.trim() &&
    plan.professorFormador?.trim()
  );
}

function isEtapa2Valid(plan: Partial<CisebSessionPlan>): boolean {
  return Boolean(
    isEtapa1Valid(plan) &&
    plan.temaImersao?.trim() &&
    plan.tituloSuporte?.trim()
  );
}

function isEtapa3Valid(plan: Partial<CisebSessionPlan>): boolean {
  return Boolean(
    isEtapa2Valid(plan) &&
    plan.tipoPrototipo?.trim()
  );
}

// ----------------------------------------------------
// STEP 1: IDENTIFICATION & UNIT
// ----------------------------------------------------
const Step1View: React.FC = () => {
  const { data, setData, setView } = useFamilyDrawer();
  const plan: CisebSessionPlan = data.plan;

  const valid = isEtapa1Valid(plan);

  const updateField = (field: keyof CisebSessionPlan, value: any) => {
    setData((prev: any) => ({
      ...prev,
      plan: {
        ...prev.plan,
        [field]: value
      }
    }));
  };

  const handleNext = () => {
    if (!valid) return;
    setView('etapa2');
  };

  return (
    <div className="p-6 space-y-5 flex-1 flex flex-col justify-between">
      <div className="space-y-4">
        {/* Step Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-[#005BAC]/10 dark:bg-sky-500/20 text-[#005BAC] dark:text-sky-400 text-[11px] font-bold">
                Etapa 1 de 3
              </span>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                Identificação Institucional
              </h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Defina a unidade CISEB, modalidade pedagógica e educador responsável.
            </p>
          </div>
        </div>

        {/* Fields */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {/* Unidade CISEB */}
          <div className="sm:col-span-2 space-y-1">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-[#005BAC] dark:text-sky-400" />
                <span>Unidade CISEB (Polo)*</span>
              </span>
              {!plan.unidadeCiseb && <span className="text-[10px] text-rose-500 font-normal">Obrigatório</span>}
            </label>
            <select
              value={plan.unidadeCiseb || ''}
              onChange={(e) => updateField('unidadeCiseb', e.target.value)}
              className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-[#005BAC] focus:outline-none"
            >
              <option value="">Selecione a Unidade CISEB...</option>
              {UNIDADES_CISEB_OPTIONS.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
          </div>

          {/* Modalidade */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-[#005BAC] dark:text-sky-400" />
                <span>Modalidade de Atendimento*</span>
              </span>
              {!plan.modalidade && <span className="text-[10px] text-rose-500 font-normal">Obrigatório</span>}
            </label>
            <select
              value={plan.modalidade || ''}
              onChange={(e) => updateField('modalidade', e.target.value)}
              className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-[#005BAC] focus:outline-none"
            >
              <option value="">Selecione a Modalidade...</option>
              {MODALIDADES_OPTIONS.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          {/* Professor Formador */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <GraduationCap className="w-3.5 h-3.5 text-[#005BAC] dark:text-sky-400" />
                <span>Professor(a) Formador(a)*</span>
              </span>
              {!plan.professorFormador && <span className="text-[10px] text-rose-500 font-normal">Obrigatório</span>}
            </label>
            <select
              value={plan.professorFormador || ''}
              onChange={(e) => updateField('professorFormador', e.target.value)}
              className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-[#005BAC] focus:outline-none"
            >
              <option value="">Selecione o(a) Professor(a)...</option>
              {PROFESSORES_FORMADORES_OPTIONS.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>

          {/* Turma Participante */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Turma Participante / Público
            </label>
            <input
              type="text"
              value={plan.turmaParticipante || ''}
              onChange={(e) => updateField('turmaParticipante', e.target.value)}
              placeholder="Ex: 1º Ano A e B - Ensino Médio"
              className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-[#005BAC] focus:outline-none"
            />
          </div>

          {/* Carga Horária */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Carga Horária Prevista
            </label>
            <input
              type="text"
              value={plan.cargaHorariaAulas || ''}
              onChange={(e) => updateField('cargaHorariaAulas', e.target.value)}
              placeholder="Ex: 4 horas / 4 aulas"
              className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-[#005BAC] focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Footer Navigation */}
      <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
        <div className="text-[11px] text-slate-500">
          {!valid ? (
            <span className="text-amber-600 dark:text-amber-400 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" />
              Preencha os campos com * para avançar
            </span>
          ) : (
            <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-medium">
              <Check className="w-3.5 h-3.5" />
              Identificação completa
            </span>
          )}
        </div>

        <button
          type="button"
          disabled={!valid}
          onClick={handleNext}
          className="py-2.5 px-5 rounded-xl bg-[#005BAC] hover:bg-[#004e96] text-white font-bold text-xs uppercase tracking-wider shadow-md shadow-[#005BAC]/20 flex items-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        >
          <span>Avançar para Tema</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

// ----------------------------------------------------
// STEP 2: PEDAGOGICAL ALIGNMENT & THEME
// ----------------------------------------------------
const Step2View: React.FC = () => {
  const { data, setData, setView, goBack } = useFamilyDrawer();
  const plan: CisebSessionPlan = data.plan;

  // Strict guard: if step 1 is invalid, enforce return to step 1
  if (!isEtapa1Valid(plan)) {
    return (
      <div className="p-6 text-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-950/40 text-amber-600 flex items-center justify-center mx-auto">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h4 className="font-bold text-sm text-slate-900 dark:text-white">Etapa Anterior Incompleta</h4>
        <p className="text-xs text-slate-500 max-w-sm mx-auto">
          Por favor, preencha os campos obrigatórios da Etapa 1 (Unidade, Modalidade e Professor) para prosseguir.
        </p>
        <button
          type="button"
          onClick={() => setView('etapa1')}
          className="py-2 px-4 rounded-xl bg-[#005BAC] text-white text-xs font-bold"
        >
          Voltar para Etapa 1
        </button>
      </div>
    );
  }

  const valid = isEtapa2Valid(plan);

  const updateField = (field: keyof CisebSessionPlan, value: any) => {
    setData((prev: any) => ({
      ...prev,
      plan: {
        ...prev.plan,
        [field]: value
      }
    }));
  };

  const toggleArrayItem = (field: 'bnccCompetencias' | 'odsAplicada', item: string) => {
    const list = plan[field] || [];
    const nextList = list.includes(item) ? list.filter((i) => i !== item) : [...list, item];
    updateField(field, nextList);
  };

  const handleNext = () => {
    if (!valid) return;
    setView('etapa3');
  };

  return (
    <div className="p-6 space-y-5 flex-1 flex flex-col justify-between">
      <div className="space-y-4">
        {/* Step Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-[#005BAC]/10 dark:bg-sky-500/20 text-[#005BAC] dark:text-sky-400 text-[11px] font-bold">
                Etapa 2 de 3
              </span>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                Tema & Alinhamento Pedagógico
              </h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Selecione a trilha de imersão maker, o título da ação e eixos curriculares.
            </p>
          </div>
        </div>

        {/* Fields */}
        <div className="space-y-3.5">
          {/* Tema de Imersão */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-[#005BAC] dark:text-sky-400" />
                <span>Tema Estruturante de Imersão*</span>
              </span>
              {!plan.temaImersao && <span className="text-[10px] text-rose-500 font-normal">Obrigatório</span>}
            </label>
            <select
              value={plan.temaImersao || ''}
              onChange={(e) => updateField('temaImersao', e.target.value)}
              className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-[#005BAC] focus:outline-none"
            >
              <option value="">Selecione o Tema de Imersão...</option>
              {TEMAS_IMERSAO_OPTIONS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          {/* Título do Suporte */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#005BAC] dark:text-sky-400" />
                <span>Título da Ação / Oficina Proposta*</span>
              </span>
              {!plan.tituloSuporte && <span className="text-[10px] text-rose-500 font-normal">Obrigatório</span>}
            </label>
            <input
              type="text"
              value={plan.tituloSuporte || ''}
              onChange={(e) => updateField('tituloSuporte', e.target.value)}
              placeholder="Ex: Construção de Estação Meteorológica com Microcontroladores e Reciclagem"
              className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-[#005BAC] focus:outline-none"
            />
          </div>

          {/* BNCC Quick Selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Competências BNCC Computação
            </label>
            <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto p-2 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
              {BNCC_COMPETENCIAS_OPTIONS.map((item) => {
                const selected = (plan.bnccCompetencias || []).includes(item);
                return (
                  <button
                    key={item}
                    type="button"
                    onClick={() => toggleArrayItem('bnccCompetencias', item)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer text-left ${
                      selected
                        ? 'bg-[#005BAC] text-white'
                        : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-600'
                    }`}
                  >
                    {item}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Footer Navigation */}
      <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
        <button
          type="button"
          onClick={goBack}
          className="py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center gap-1.5 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Voltar</span>
        </button>

        <button
          type="button"
          disabled={!valid}
          onClick={handleNext}
          className="py-2.5 px-5 rounded-xl bg-[#005BAC] hover:bg-[#004e96] text-white font-bold text-xs uppercase tracking-wider shadow-md shadow-[#005BAC]/20 flex items-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        >
          <span>Avançar para Metodologia</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

// ----------------------------------------------------
// STEP 3: METHODOLOGY & REVIEW
// ----------------------------------------------------
const Step3View: React.FC = () => {
  const { data, setData, setView, goBack } = useFamilyDrawer();
  const plan: CisebSessionPlan = data.plan;

  if (!isEtapa2Valid(plan)) {
    return (
      <div className="p-6 text-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-950/40 text-amber-600 flex items-center justify-center mx-auto">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h4 className="font-bold text-sm text-slate-900 dark:text-white">Etapas Anteriores Incompletas</h4>
        <p className="text-xs text-slate-500 max-w-sm mx-auto">
          Preencha todos os campos obrigatórios das etapas anteriores para continuar a revisão.
        </p>
        <button
          type="button"
          onClick={() => setView('etapa1')}
          className="py-2 px-4 rounded-xl bg-[#005BAC] text-white text-xs font-bold"
        >
          Reiniciar do Passo 1
        </button>
      </div>
    );
  }

  const valid = isEtapa3Valid(plan);

  const updateField = (field: keyof CisebSessionPlan, value: any) => {
    setData((prev: any) => ({
      ...prev,
      plan: {
        ...prev.plan,
        [field]: value
      }
    }));
  };

  const handleFinish = () => {
    if (!valid) return;
    setView('concluido');
  };

  return (
    <div className="p-6 space-y-5 flex-1 flex flex-col justify-between overflow-y-auto">
      <div className="space-y-4">
        {/* Step Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-[#005BAC]/10 dark:bg-sky-500/20 text-[#005BAC] dark:text-sky-400 text-[11px] font-bold">
                Etapa 3 de 3
              </span>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                Metodologia Maker & Revisão
              </h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Defina a tipologia do protótipo, recursos e confira os dados gerais.
            </p>
          </div>
        </div>

        {/* Prototyping Inputs */}
        <div className="space-y-3.5">
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Wrench className="w-3.5 h-3.5 text-[#005BAC] dark:text-sky-400" />
                <span>Tipologia do Protótipo Maker*</span>
              </span>
              {!plan.tipoPrototipo && <span className="text-[10px] text-rose-500 font-normal">Obrigatório</span>}
            </label>
            <select
              value={plan.tipoPrototipo || ''}
              onChange={(e) => updateField('tipoPrototipo', e.target.value)}
              className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-[#005BAC] focus:outline-none"
            >
              <option value="">Selecione o Tipo de Protótipo...</option>
              {TIPO_PROTOTIPO_OPTIONS.map((tp) => (
                <option key={tp} value={tp}>
                  {tp}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Recursos Didáticos & Tecnológicos
            </label>
            <textarea
              rows={2}
              value={plan.recursosDidaticosTecnologicos || ''}
              onChange={(e) => updateField('recursosDidaticosTecnologicos', e.target.value)}
              placeholder="Ex: Kits de robótica educacional, sensores, sucata eletrônica, papelão, cola quente, software Scratch/Tinkercad..."
              className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-[#005BAC] focus:outline-none resize-none"
            />
          </div>

          {/* Quick Summary Preview Box */}
          <div className="p-3.5 bg-slate-50 dark:bg-slate-800/70 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2 text-xs">
            <div className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-200">
              <FileCheck2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Resumo dos Dados Consolidados:</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 dark:text-slate-300 font-medium">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase">Unidade:</span>
                <span className="truncate block font-semibold text-slate-800 dark:text-slate-100">{plan.unidadeCiseb}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase">Modalidade:</span>
                <span className="truncate block font-semibold text-slate-800 dark:text-slate-100">{plan.modalidade}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase">Educador(a):</span>
                <span className="truncate block font-semibold text-slate-800 dark:text-slate-100">{plan.professorFormador}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase">Tema:</span>
                <span className="truncate block font-semibold text-slate-800 dark:text-slate-100">{plan.temaImersao}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Navigation */}
      <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
        <button
          type="button"
          onClick={goBack}
          className="py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center gap-1.5 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Voltar</span>
        </button>

        <button
          type="button"
          disabled={!valid}
          onClick={handleFinish}
          className="py-2.5 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider shadow-md shadow-emerald-600/20 flex items-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>Validar e Concluir</span>
        </button>
      </div>
    </div>
  );
};

// ----------------------------------------------------
// STEP 4: COMPLETED / SUCCESS
// ----------------------------------------------------
const CompletedView: React.FC = () => {
  const { data, setIsOpen } = useFamilyDrawer();
  const plan: CisebSessionPlan = data.plan;
  const onApplyPlan = data.onApplyPlan;

  const handleApply = () => {
    if (onApplyPlan && plan) {
      onApplyPlan(plan);
    }
    setIsOpen(false);
  };

  return (
    <div className="p-6 space-y-5 flex-1 flex flex-col items-center justify-center text-center animate-in fade-in">
      <div className="w-16 h-16 rounded-3xl bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-lg shadow-emerald-600/15">
        <CheckCircle2 className="w-8 h-8" />
      </div>

      <div className="space-y-1 max-w-md">
        <h3 className="font-bold text-lg text-slate-900 dark:text-white">
          Plano de Atendimento Estruturado!
        </h3>
        <p className="text-xs text-slate-600 dark:text-slate-400">
          Todas as etapas essenciais foram validadas com sucesso segundo as diretrizes pedagógicas do CISEB SEDUC/PA.
        </p>
      </div>

      <div className="w-full max-w-md p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 text-left text-xs space-y-2">
        <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center justify-between">
          <span>{plan.tituloSuporte || 'Oficina Pedagógica'}</span>
          <span className="px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-[10px]">
            Pronto
          </span>
        </div>
        <p className="text-slate-500 dark:text-slate-400 text-[11px]">
          {plan.unidadeCiseb} • {plan.modalidade} • {plan.professorFormador}
        </p>
      </div>

      <div className="w-full max-w-md flex flex-col sm:flex-row gap-2.5 pt-2">
        <button
          type="button"
          onClick={() => setIsOpen(false)}
          className="flex-1 py-3 px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition-colors"
        >
          Fechar
        </button>

        <button
          type="button"
          onClick={handleApply}
          className="flex-1 py-3 px-4 rounded-xl bg-[#005BAC] hover:bg-[#004e96] text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-[#005BAC]/20 flex items-center justify-center gap-2 cursor-pointer transition-all"
        >
          <span>Aplicar ao Formulário</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

// ----------------------------------------------------
// MAIN GUIDED FORM DRAWER
// ----------------------------------------------------
export const GuidedFormDrawer: React.FC<GuidedFormDrawerProps> = ({
  isOpen,
  onOpenChange,
  currentPlan,
  onApplyPlan,
}) => {
  const wizardViews: ViewsRegistry = {
    etapa1: Step1View,
    etapa2: Step2View,
    etapa3: Step3View,
    concluido: CompletedView,
  };

  return (
    <FamilyDrawerRoot
      defaultView="etapa1"
      views={wizardViews}
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      initialData={{ plan: currentPlan, onApplyPlan }}
    >
      <FamilyDrawerPortal>
        <FamilyDrawerOverlay />
        <FamilyDrawerContent className="max-w-xl">
          <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-[#005BAC]/10 text-[#005BAC] dark:text-sky-400 flex items-center justify-center font-bold text-xs">
                <Sparkles className="w-4 h-4" />
              </div>
              <span className="font-bold text-xs text-slate-800 dark:text-slate-200">
                Assistente de Preenchimento Guiado CISEB
              </span>
            </div>
            <FamilyDrawerClose />
          </div>

          <FamilyDrawerAnimatedWrapper>
            <FamilyDrawerAnimatedContent>
              <FamilyDrawerViewContent />
            </FamilyDrawerAnimatedContent>
          </FamilyDrawerAnimatedWrapper>
        </FamilyDrawerContent>
      </FamilyDrawerPortal>
    </FamilyDrawerRoot>
  );
};
