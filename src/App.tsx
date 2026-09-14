import React, { useState, useEffect, useMemo } from 'react';
import {
  CisebSessionPlan,
  MODALIDADES_OPTIONS,
  UNIDADES_CISEB_OPTIONS,
  PROFESSORES_FORMADORES_OPTIONS,
  TEMAS_IMERSAO_OPTIONS,
  AuthUser,
  isPlanOwnedByUser,
  DEFAULT_MAG_EXTERNAL_URL,
} from './types';
import { Header } from './components/Header';
import { SessionForm } from './components/SessionForm';
import { ReportView } from './components/ReportView';
import { AiCopilotDrawer } from './components/AiCopilotDrawer';
import { CurriculumGuideModal } from './components/CurriculumGuideModal';
import { HistoryDrawer } from './components/HistoryDrawer';
import { LoginScreen } from './components/LoginScreen';
import { Hub } from './components/hub/Hub';
import { MonitoringDashboard } from './components/MonitoringDashboard';
import { AdminManagementPanel } from './components/admin/AdminManagementPanel';
import { AccountManagerModal } from './components/AccountManagerModal';
import { ChangePasswordModal } from './components/ChangePasswordModal';
import { UnitSelectorModal } from './components/UnitSelectorModal';
import { subscribePlans, savePlanToFirestore, deletePlanFromFirestore } from './services/firestoreService';
import { useAuth } from './hooks/useAuth';
import { safeJsonFetch } from './lib/apiUtils';
import { Sparkles, ExternalLink } from 'lucide-react';
import magAvatar from './assets/images/mag_avatar_v2_1786994402829.jpg';

const LOCAL_STORAGE_KEY = 'ciseb_saved_plans_v1';
const THEME_STORAGE_KEY = 'ciseb_theme_mode_v1';

const createEmptyPlan = (user?: AuthUser | null): CisebSessionPlan => ({
  id: Date.now().toString(),
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  createdBy: user?.id || user?.uid || '',
  authorEmail: user?.email || '',
  authorNome: user?.nome || '',
  modalidade: '',
  unidadeCiseb: user?.unidadeCiseb || '',
  professorFormador: user?.nome || '',
  temaImersao: '',
  tituloSuporte: '',
  cargaHorariaAulas: '',
  turmaParticipante: '',
  bnccCompetencias: [],
  bnccHabilidadesEixo: [],
  odsAplicada: [],
  trilhaImersao: '',
  fase1Empatia: '',
  fase2TempestadeIdeias: '',
  fase3PrototipagemSolucao: '',
  tipoPrototipo: '',
  recursosDidaticosTecnologicos: '',
  roteiroPedagógico: '',
  expectativaAprendizagem: '',
});

export default function App() {
  const { user: authHookUser, logout, mustChangePassword } = useAuth();
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(authHookUser);

  useEffect(() => {
    setCurrentUser(authHookUser);
  }, [authHookUser]);

  const [currentPlan, setCurrentPlan] = useState<CisebSessionPlan>(() =>
    createEmptyPlan(currentUser)
  );
  const [savedPlans, setSavedPlans] = useState<CisebSessionPlan[]>([]);
  const [activeView, setActiveView] = useState<'hub' | 'edit' | 'report' | 'monitoring' | 'admin'>('hub');
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    try {
      const stored = localStorage.getItem(THEME_STORAGE_KEY);
      if (stored === 'dark' || stored === 'light') return stored;
      if (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return 'dark';
      }
    } catch (e) {
      console.error('Erro ao ler tema:', e);
    }
    return 'light';
  });

  // Strict ownership filtering: Only the user who created a saved plan can see/manage it in history
  const userSavedPlans = useMemo(() => {
    return savedPlans.filter((plan) => isPlanOwnedByUser(plan, currentUser));
  }, [savedPlans, currentUser]);

  // Sync theme with DOM and localStorage
  useEffect(() => {
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch (e) {
      console.error('Erro ao salvar tema:', e);
    }
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  // Modals & Drawers state
  const [isAiDrawerOpen, setIsAiDrawerOpen] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isAccountsModalOpen, setIsAccountsModalOpen] = useState(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [isUnitModalOpen, setIsUnitModalOpen] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  // Subscribe to real-time plans from Firestore (with localStorage fallback)
  useEffect(() => {
    const unsubscribe = subscribePlans((updatedPlans) => {
      if (Array.isArray(updatedPlans)) {
        setSavedPlans(updatedPlans);
      }
    });
    return () => unsubscribe();
  }, []);

  // Keyboard shortcut: Ctrl+S or Cmd+S to save plan
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        handleSavePlan();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentPlan]);

  const handleLogin = (user: AuthUser) => {
    setCurrentUser(user);
    setActiveView('hub');
    // Auto-update formador, unit, and author tracking if current plan is blank
    setCurrentPlan((prev) => ({
      ...prev,
      createdBy: prev.createdBy || user.id || user.uid || '',
      authorEmail: prev.authorEmail || user.email || '',
      authorNome: prev.authorNome || user.nome || '',
      professorFormador: prev.professorFormador || (user.role === 'formador' ? user.nome : prev.professorFormador),
      unidadeCiseb: prev.unidadeCiseb || user.unidadeCiseb || prev.unidadeCiseb,
    }));
  };

  const handleLogout = async () => {
    await logout();
    setCurrentUser(null);
    setActiveView('hub');
  };


  // Save current plan to Firestore and localStorage with status feedback and author metadata
  const handleSavePlan = async () => {
    const updatedPlan: CisebSessionPlan = {
      ...currentPlan,
      updatedAt: new Date().toISOString(),
      createdBy: currentPlan.createdBy || currentUser?.id || currentUser?.uid || '',
      authorEmail: currentPlan.authorEmail || currentUser?.email || '',
      authorNome: currentPlan.authorNome || currentUser?.nome || '',
      professorFormador: currentPlan.professorFormador || currentUser?.nome || '',
      unidadeCiseb: currentPlan.unidadeCiseb || currentUser?.unidadeCiseb || '',
    };
    setCurrentPlan(updatedPlan);

    setSavedPlans((prev) => {
      const index = prev.findIndex((p) => p.id === updatedPlan.id);
      let updatedList: CisebSessionPlan[];
      if (index >= 0) {
        updatedList = [...prev];
        updatedList[index] = updatedPlan;
      } else {
        updatedList = [updatedPlan, ...prev];
      }
      return updatedList;
    });

    setSaveStatus('saving');
    try {
      await savePlanToFirestore(updatedPlan);
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (err) {
      console.error('Erro ao salvar no Firestore:', err);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 4000);
    }
  };

  const handleNewPlan = () => {
    setCurrentPlan(createEmptyPlan(currentUser));
    setActiveView('edit');
  };

  const handleDeletePlan = (planId: string) => {
    deletePlanFromFirestore(planId).catch((err) => {
      console.error('Erro ao excluir do Firestore:', err);
    });
    setSavedPlans((prev) => prev.filter((p) => p.id !== planId));
  };

  const handleImportPlans = (imported: CisebSessionPlan[]) => {
    const enriched = imported.map((p) => ({
      ...p,
      createdBy: p.createdBy || currentUser?.id || currentUser?.uid || '',
      authorEmail: p.authorEmail || currentUser?.email || '',
      authorNome: p.authorNome || currentUser?.nome || p.professorFormador || '',
    }));

    enriched.forEach((p) => {
      savePlanToFirestore(p).catch((err) => {
        console.error('Erro ao importar plano no Firestore:', err);
      });
    });
    setSavedPlans((prev) => {
      const merged = [...enriched, ...prev];
      return merged;
    });
    if (enriched.length > 0) {
      setCurrentPlan(enriched[0]);
    }
  };

  // AI Auto-Fill / Refinement Trigger
  const handleAiAutoFillSection = async (sectionKey: string) => {
    setIsAiLoading(true);
    let prompt = '';

    if (sectionKey === 'all') {
      prompt = 'Completar ou enriquecer com alto rigor pedagógico todos os campos em branco deste plano de atendimento, articulando Design Thinking, Cultura Maker e BNCC Computação.';
    } else if (sectionKey === 'pedagogical') {
      prompt = 'Sugerir as competências BNCC Computação, Eixos, ODS aplicada e Trilha de Imersão mais adequados ao título e tema informados.';
    } else if (sectionKey === 'designThinking') {
      prompt = 'Redigir detalhadamente as três fases de Design Thinking (Fase 1 Empatia, Fase 2 Tempestade de Ideias e Fase 3 Prototipagem da Solução) para este projeto de atendimento CISEB.';
    } else if (sectionKey === 'execution') {
      prompt = 'Sugerir e detalhar os Recursos Didáticos/Tecnológicos do CISEB, Roteiro Pedagógico passo a passo e a Expectativa de Aprendizagem final dos estudantes/professores.';
    }

    try {
      const result = await safeJsonFetch<{ success: boolean; plan: any; error?: string }>(
        '/api/gemini/generate-plan',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt,
            currentPlan,
          }),
        }
      );

      if (result.ok && result.data?.success && result.data.plan) {
        const planData = result.data.plan;
        setCurrentPlan((prev) => ({
          ...prev,
          ...planData,
          // Preserve arrays if valid
          bnccCompetencias: Array.isArray(planData.bnccCompetencias) && planData.bnccCompetencias.length ? planData.bnccCompetencias : prev.bnccCompetencias,
          bnccHabilidadesEixo: Array.isArray(planData.bnccHabilidadesEixo) && planData.bnccHabilidadesEixo.length ? planData.bnccHabilidadesEixo : prev.bnccHabilidadesEixo,
          odsAplicada: Array.isArray(planData.odsAplicada) && planData.odsAplicada.length ? planData.odsAplicada : prev.odsAplicada,
          updatedAt: new Date().toISOString(),
        }));
      } else {
        const errorMsg = result.error || result.data?.error || 'Não foi possível gerar com a IA no momento.';
        console.warn('[AI Plan Generation]', errorMsg);
        alert(errorMsg);
      }
    } catch (error: any) {
      console.error('Erro na chamada da IA:', error);
      alert(error?.message || 'Erro de comunicação com a IA. Tente novamente.');
    } finally {
      setIsAiLoading(false);
    }
  };

  // Calculate completion percentage
  const calculateCompletion = () => {
    const fields: (keyof CisebSessionPlan)[] = [
      'modalidade',
      'unidadeCiseb',
      'professorFormador',
      'temaImersao',
      'tituloSuporte',
      'cargaHorariaAulas',
      'turmaParticipante',
      'trilhaImersao',
      'fase1Empatia',
      'fase2TempestadeIdeias',
      'fase3PrototipagemSolucao',
      'tipoPrototipo',
      'recursosDidaticosTecnologicos',
      'roteiroPedagógico',
      'expectativaAprendizagem',
    ];

    let filled = 0;
    fields.forEach((f) => {
      if (typeof currentPlan[f] === 'string' && (currentPlan[f] as string).trim().length > 0) {
        filled += 1;
      }
    });

    if (currentPlan.bnccCompetencias?.length > 0) filled += 1;
    if (currentPlan.bnccHabilidadesEixo?.length > 0) filled += 1;
    if (currentPlan.odsAplicada?.length > 0) filled += 1;

    const total = fields.length + 3;
    return Math.round((filled / total) * 100);
  };

  const completionPercentage = calculateCompletion();

  if (!currentUser) {
    return <LoginScreen onLogin={handleLogin} theme={theme} onToggleTheme={toggleTheme} />;
  }

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-900 font-sans text-slate-900 dark:text-slate-100 flex flex-col transition-colors duration-200">
      {/* Top Bar Header */}
      <Header
        onNewPlan={handleNewPlan}
        onOpenGuide={() => setIsGuideOpen(true)}
        onOpenHistory={() => setIsHistoryOpen(true)}
        onToggleAiDrawer={() => setIsAiDrawerOpen(!isAiDrawerOpen)}
        onOpenPrint={() => setActiveView('report')}
        onOpenAccountsModal={() => {
          if (currentUser?.role === 'monitoramento') {
            setActiveView('admin');
          } else {
            setIsAccountsModalOpen(true);
          }
        }}
        onOpenUnitModal={() => setIsUnitModalOpen(true)}
        onChangePassword={() => setIsChangePasswordOpen(true)}
        onBackToHub={() => setActiveView('hub')}
        activeView={activeView}
        setActiveView={setActiveView}
        savedCount={userSavedPlans.length}
        completionPercentage={completionPercentage}
        currentUser={currentUser}
        onLogout={handleLogout}
        theme={theme}
        onToggleTheme={toggleTheme}
        saveStatus={saveStatus}
        onSavePlan={handleSavePlan}
      />

      {/* Main View Area */}
      <main className="flex-1 pb-16 print:pb-0 print:m-0 flex flex-col">
        {activeView === 'hub' ? (
          <Hub
            currentUser={currentUser}
            onSelectTool={(tool) => setActiveView(tool)}
          />
        ) : activeView === 'admin' && currentUser?.role === 'monitoramento' ? (
          <AdminManagementPanel
            currentUser={currentUser}
            onBackToEdit={() => setActiveView('hub')}
            theme={theme}
          />
        ) : activeView === 'monitoring' ? (
          <MonitoringDashboard
            user={currentUser}
            onLogout={handleLogout}
            theme={theme}
            onToggleTheme={toggleTheme}
            plans={savedPlans}
          />
        ) : activeView === 'edit' ? (
          <SessionForm
            currentUser={currentUser}
            plan={currentPlan}
            onChange={setCurrentPlan}
            onAiAutoFillSection={handleAiAutoFillSection}
            isAiLoading={isAiLoading}
            onSave={handleSavePlan}
            onGenerateReport={() => {
              handleSavePlan();
              setActiveView('report');
            }}
            onOpenAiDrawer={() => setIsAiDrawerOpen(true)}
          />
        ) : (
          <ReportView
            plan={currentPlan}
            onEdit={() => setActiveView('edit')}
          />
        )}
      </main>

      {/* Modals and Drawers */}
      <AiCopilotDrawer
        isOpen={isAiDrawerOpen}
        onClose={() => setIsAiDrawerOpen(false)}
        plan={currentPlan}
        onApplyPlanUpdate={(partial) => {
          setCurrentPlan((prev) => ({ ...prev, ...partial }));
        }}
      />

      <CurriculumGuideModal
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
      />

      <HistoryDrawer
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        savedPlans={userSavedPlans}
        currentUser={currentUser}
        onLoadPlan={(plan) => {
          setCurrentPlan(plan);
          setActiveView('edit');
        }}
        onDeletePlan={handleDeletePlan}
        onImportPlans={handleImportPlans}
      />

      <AccountManagerModal
        isOpen={isAccountsModalOpen}
        onClose={() => setIsAccountsModalOpen(false)}
        currentUser={currentUser}
      />

      <ChangePasswordModal
        isOpen={isChangePasswordOpen || !!mustChangePassword}
        onClose={() => setIsChangePasswordOpen(false)}
        currentUser={currentUser}
        forcedMode={!!mustChangePassword}
      />

      <UnitSelectorModal
        isOpen={isUnitModalOpen}
        onClose={() => setIsUnitModalOpen(false)}
        currentUser={currentUser}
        onProfileUpdated={(updated) => {
          setCurrentUser(updated);
          // Sync current plan if empty or matching old values
          setCurrentPlan((prev) => ({
            ...prev,
            unidadeCiseb: updated.unidadeCiseb || prev.unidadeCiseb,
            professorFormador: updated.nome || prev.professorFormador,
            authorNome: updated.nome || prev.authorNome,
          }));
        }}
      />


      {/* Floating MAG AI Assistant Button at the Bottom (External Link) */}
      {activeView !== 'hub' && (
        <button
          type="button"
          onClick={() => window.open(DEFAULT_MAG_EXTERNAL_URL, '_blank', 'noopener,noreferrer')}
          className="fixed bottom-6 right-6 z-40 group pl-2 pr-4 py-2 rounded-2xl bg-white dark:bg-slate-800 hover:bg-sky-50 dark:hover:bg-slate-700 text-[#005BAC] dark:text-sky-300 font-black text-xs uppercase shadow-2xl shadow-slate-900/30 dark:shadow-black/50 hover:shadow-[0_0_28px_rgba(0,91,172,0.45)] hover:-translate-y-1 active:translate-y-0 transition-all duration-300 flex items-center gap-3 cursor-pointer border border-[#005BAC]/20 dark:border-sky-500/30 ring-4 ring-[#005BAC]/10 dark:ring-sky-400/10 animate-in fade-in slide-in-from-bottom-4 print:hidden"
          title="Abrir a MAG (Assistente Pedagógica com IA) em nova aba"
          aria-label="Abrir a MAG Mentora Pedagógica em nova aba"
        >
          <div className="w-10 h-10 rounded-xl overflow-hidden shrink-0 border-2 border-[#005BAC]/30 dark:border-sky-400/40 shadow-sm relative z-10 bg-sky-100 dark:bg-slate-700 ring-2 ring-white dark:ring-slate-800">
            <img
              src={magAvatar}
              alt="Avatar MAG"
              className="w-full h-full object-cover object-top scale-110 group-hover:scale-125 transition-transform duration-300"
              referrerPolicy="no-referrer"
            />
          </div>
          <div className="text-left">
            <span className="block text-[10px] text-slate-500 dark:text-slate-400 font-bold normal-case tracking-normal -mb-0.5 flex items-center gap-1">
              Assistente IA <ExternalLink className="w-2.5 h-2.5 opacity-60" />
            </span>
            <span className="tracking-tight text-xs font-black text-[#005BAC] dark:text-sky-300">Conheça a MAG</span>
          </div>
          <Sparkles className="w-4 h-4 text-amber-500 dark:text-amber-400 animate-pulse shrink-0 ml-0.5" />
        </button>
      )}
    </div>
  );
}
