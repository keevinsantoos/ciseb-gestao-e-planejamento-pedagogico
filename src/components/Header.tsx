import React, { useState, useRef, useEffect } from 'react';
import { CisebLogo } from './CisebLogo';
import {
  FileText,
  BookOpen,
  History,
  PlusCircle,
  Download,
  Printer,
  LayoutDashboard,
  LogOut,
  UserCheck,
  User,
  Users,
  KeyRound,
  Settings,
  HelpCircle,
  ExternalLink,
  ChevronDown,
  ShieldCheck,
  Headphones,
  Sun,
  Moon,
  Save,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { AuthUser } from '../types';

// URL de Suporte Oficial CISEB SEDUC/PA
export const DEFAULT_SUPPORT_URL =
  'https://script.google.com/a/macros/seduc.pa.gov.br/s/AKfycbwxlm3fDdb2JP_H4ZcHQkxXFQiRmFwQ0cTV1DuUIClghxSPWKoBGoXjVUxJkwmVusbamg/exec';

interface HeaderProps {
  onNewPlan: () => void;
  onOpenGuide: () => void;
  onOpenHistory: () => void;
  onToggleAiDrawer: () => void;
  onOpenPrint: () => void;
  onOpenAccountsModal?: () => void;
  onChangePassword?: () => void;
  onOpenSupport?: () => void;
  supportUrl?: string;
  activeView: 'edit' | 'report' | 'monitoring';
  setActiveView: (view: 'edit' | 'report' | 'monitoring') => void;
  savedCount: number;
  completionPercentage: number;
  currentUser?: AuthUser | null;
  onLogout?: () => void;
  theme?: 'light' | 'dark';
  onToggleTheme?: () => void;
  saveStatus?: 'idle' | 'saving' | 'saved' | 'error';
  onSavePlan?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onNewPlan,
  onOpenGuide,
  onOpenHistory,
  onToggleAiDrawer,
  onOpenPrint,
  onOpenAccountsModal,
  onChangePassword,
  onOpenSupport,
  supportUrl = DEFAULT_SUPPORT_URL,
  activeView,
  setActiveView,
  savedCount,
  completionPercentage,
  currentUser,
  onLogout,
  theme = 'light',
  onToggleTheme,
  saveStatus = 'idle',
  onSavePlan,
}) => {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const settingsRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (settingsRef.current && !settingsRef.current.contains(event.target as Node)) {
        setIsSettingsOpen(false);
      }
    };
    if (isSettingsOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isSettingsOpen]);

  const handleOpenSupport = () => {
    setIsSettingsOpen(false);
    if (onOpenSupport) {
      onOpenSupport();
    } else if (supportUrl) {
      window.open(supportUrl, '_blank', 'noopener,noreferrer');
    }
  };
  return (
    <header className="sticky top-0 z-30 bg-gradient-to-r from-[#005BAC] via-[#004e96] to-[#013780] text-white border-b border-[#012b66] shadow-md">
      {/* Top Banner with Official CISEB / SEDUC PA Branding */}
      <div className="w-full px-4 sm:px-6 py-2.5 flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Brand identity */}
        <div className="flex items-center gap-3.5 sm:gap-4 shrink-0">
          <div
            className="h-14 sm:h-16 md:h-18 w-auto shrink-0 flex items-center justify-center transition-all hover:scale-105"
            title="CISEB - Centro de Inovação e Sustentabilidade da Educação Básica"
          >
            <CisebLogo className="h-14 sm:h-16 md:h-18 w-auto drop-shadow-md" variant="light" />
          </div>

          <div className="hidden sm:flex flex-col justify-center border-l-2 border-white/20 pl-4 py-1">
            <div className="flex items-center gap-2.5 mb-1.5">
              <span className="text-[10px] font-black uppercase tracking-widest text-sky-50 bg-white/10 px-2 py-0.5 rounded-sm border border-white/20 backdrop-blur-sm shadow-sm">
                SEDUC/PA
              </span>
              <span className="text-[10px] text-sky-100 uppercase tracking-widest font-bold opacity-90">
                CISEB POR TODO PARÁ
              </span>
            </div>
            <h1 className="text-lg sm:text-xl font-black uppercase tracking-wide text-white leading-tight drop-shadow-sm">
              SISTEMA DE MONITORAMENTO PEDAGÓGICO
            </h1>
          </div>
        </div>

        {/* Action Controls & Navigation */}
        <div className="flex-1 flex items-center justify-end flex-wrap gap-2.5 sm:gap-3 text-xs">
          {/* Main Controls Dock */}
          <div className="bg-black/20 p-1 rounded-xl border border-white/15 flex items-center gap-1 shadow-sm backdrop-blur-sm">
            {/* View Toggle */}
            <button
              onClick={() => setActiveView('edit')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition-all flex items-center gap-1.5 cursor-pointer ${
                activeView === 'edit'
                  ? 'bg-white text-[#005BAC] shadow-sm'
                  : 'text-white/80 hover:text-white hover:bg-white/15'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              Formulário
            </button>
            <button
              onClick={() => setActiveView('report')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition-all flex items-center gap-1.5 cursor-pointer ${
                activeView === 'report'
                  ? 'bg-white text-[#005BAC] shadow-sm'
                  : 'text-white/80 hover:text-white hover:bg-white/15'
              }`}
            >
              <Printer className="w-3.5 h-3.5" />
              Relatório
            </button>

            {currentUser?.role === 'monitoramento' && (
              <button
                onClick={() => setActiveView('monitoring')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeView === 'monitoring'
                    ? 'bg-amber-400 text-[#021631] shadow-sm'
                    : 'text-white/80 hover:text-amber-300 hover:bg-white/15'
                }`}
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                Painel
              </button>
            )}

            <div className="w-px h-5 bg-white/20 hidden sm:block mx-1.5 rounded-full" />

            {/* Actions */}
            {onSavePlan && (
              <button
                type="button"
                onClick={onSavePlan}
                disabled={saveStatus === 'saving'}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition-all flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95 border ${
                  saveStatus === 'saved'
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-400'
                    : saveStatus === 'error'
                    ? 'bg-red-600 hover:bg-red-500 text-white border-red-400'
                    : saveStatus === 'saving'
                    ? 'bg-sky-600 text-white/90 border-sky-400/40 cursor-not-allowed opacity-90'
                    : 'bg-white text-[#005BAC] hover:bg-sky-50 border-white/80'
                }`}
                title="Salvar plano no banco de dados (Ctrl+S)"
              >
                {saveStatus === 'saving' ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                    <span>Salvando...</span>
                  </>
                ) : saveStatus === 'saved' ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                    <span>Plano Salvo!</span>
                  </>
                ) : saveStatus === 'error' ? (
                  <>
                    <AlertCircle className="w-3.5 h-3.5 text-white" />
                    <span>Erro ao Salvar</span>
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5 text-[#005BAC]" />
                    <span>Salvar Plano</span>
                  </>
                )}
              </button>
            )}

            <button
              onClick={onNewPlan}
              className="px-3 py-1.5 rounded-lg text-xs font-black uppercase transition-colors flex items-center gap-1.5 cursor-pointer bg-sky-400 hover:bg-sky-300 text-[#021631] shadow-sm active:scale-95"
              title="Iniciar novo plano"
            >
              <PlusCircle className="w-3.5 h-3.5 text-[#021631]" />
              <span className="text-[#021631] font-black">Novo</span>
            </button>

            <button
              onClick={onOpenHistory}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold uppercase transition-colors flex items-center gap-1.5 relative cursor-pointer text-white/90 hover:text-white hover:bg-white/15"
              title="Ver planos salvos"
            >
              <History className="w-3.5 h-3.5" />
              Salvos
              {savedCount > 0 && (
                <span className="bg-sky-400 text-[#021631] text-[10px] font-black px-1.5 py-0 rounded-full shadow-xs">
                  {savedCount}
                </span>
              )}
            </button>

            <button
              onClick={onOpenGuide}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold uppercase transition-colors flex items-center gap-1.5 cursor-pointer text-white/90 hover:text-white hover:bg-white/15"
              title="Consultar Referencial Curricular de Computação do Pará"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span className="hidden lg:inline">Referencial</span> Pará
            </button>
          </div>

          {/* Right Side Settings & User Profile */}
          <div className="flex items-center gap-1.5">
            {/* Quick Theme Toggle Button (Light/Dark Mode) */}
            {onToggleTheme && (
              <button
                type="button"
                onClick={onToggleTheme}
                className="p-2 rounded-xl text-xs font-bold uppercase transition-all flex items-center justify-center cursor-pointer border shadow-sm backdrop-blur-sm bg-black/25 hover:bg-black/40 text-amber-300 hover:text-white border-white/15 active:scale-95"
                title={theme === 'dark' ? 'Ativar Modo Claro' : 'Ativar Modo Escuro'}
                aria-label="Alternar modo claro e escuro"
              >
                {theme === 'dark' ? (
                  <Sun className="w-4 h-4 text-amber-300 transition-transform duration-300 hover:rotate-45" />
                ) : (
                  <Moon className="w-4 h-4 text-sky-200 transition-transform duration-300 hover:-rotate-12" />
                )}
              </button>
            )}

            {/* Settings Gear Dropdown Menu on the Right */}
            <div className="relative" ref={settingsRef}>
              <button
                type="button"
                onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                className={`p-2 rounded-xl text-xs font-bold uppercase transition-all flex items-center justify-center cursor-pointer border shadow-sm backdrop-blur-sm ${
                  isSettingsOpen
                    ? 'bg-white text-[#005BAC] border-white shadow-md'
                    : 'bg-black/25 hover:bg-black/40 text-sky-100 hover:text-white border-white/15'
                }`}
                title="Configurações e Suporte"
                aria-expanded={isSettingsOpen}
                aria-haspopup="true"
              >
                <Settings
                  className={`w-4 h-4 transition-transform duration-300 ${
                    isSettingsOpen ? 'rotate-90 text-[#005BAC]' : 'text-amber-300'
                  }`}
                />
              </button>

              {/* Dropdown Box */}
              {isSettingsOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-700 py-2 text-slate-800 dark:text-slate-100 z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-3.5 py-2 border-b border-slate-100 dark:border-slate-700">
                    <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-400">
                      Opções & Configurações
                    </p>
                    {currentUser && (
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate" title={currentUser.nome}>
                        {currentUser.nome}
                      </p>
                    )}
                  </div>

                  <div className="py-1">
                    {/* 0. Alternar Tema Claro / Escuro */}
                    {onToggleTheme && (
                      <button
                        type="button"
                        onClick={() => {
                          onToggleTheme();
                        }}
                        className="w-full px-3.5 py-2 text-left text-xs font-bold text-slate-700 dark:text-slate-200 hover:text-[#005BAC] dark:hover:text-sky-300 hover:bg-sky-50 dark:hover:bg-slate-700/60 transition-colors flex items-center justify-between gap-2 cursor-pointer"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-6 h-6 rounded-lg bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-300 flex items-center justify-center shrink-0">
                            {theme === 'dark' ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
                          </div>
                          <div className="flex flex-col">
                            <span>{theme === 'dark' ? 'Modo Claro' : 'Modo Escuro'}</span>
                            <span className="text-[10px] text-slate-400 dark:text-slate-400 font-normal">
                              {theme === 'dark' ? 'Mudar para tema claro' : 'Mudar para tema escuro'}
                            </span>
                          </div>
                        </div>
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                          {theme === 'dark' ? 'Escuro' : 'Claro'}
                        </span>
                      </button>
                    )}

                    {/* 1. Alterar Minha Senha */}
                    {onChangePassword && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsSettingsOpen(false);
                          onChangePassword();
                        }}
                        className="w-full px-3.5 py-2 text-left text-xs font-bold text-slate-700 dark:text-slate-200 hover:text-[#005BAC] dark:hover:text-sky-300 hover:bg-sky-50 dark:hover:bg-slate-700/60 transition-colors flex items-center gap-2.5 cursor-pointer"
                      >
                        <div className="w-6 h-6 rounded-lg bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-300 flex items-center justify-center shrink-0">
                          <KeyRound className="w-3.5 h-3.5" />
                        </div>
                        <div className="flex flex-col">
                          <span>Alterar Minha Senha</span>
                          <span className="text-[10px] text-slate-400 dark:text-slate-400 font-normal">Exclusivo para seu acesso</span>
                        </div>
                      </button>
                    )}

                    {/* 2. Suporte Técnico */}
                    <button
                      type="button"
                      onClick={handleOpenSupport}
                      className="w-full px-3.5 py-2 text-left text-xs font-bold text-slate-700 dark:text-slate-200 hover:text-[#005BAC] dark:hover:text-sky-300 hover:bg-sky-50 dark:hover:bg-slate-700/60 transition-colors flex items-center justify-between gap-2 cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-6 h-6 rounded-lg bg-sky-100 dark:bg-sky-900/40 text-[#005BAC] dark:text-sky-300 flex items-center justify-center shrink-0">
                          <Headphones className="w-3.5 h-3.5" />
                        </div>
                        <div className="flex flex-col">
                          <span>Suporte Técnico</span>
                          <span className="text-[10px] text-slate-400 dark:text-slate-400 font-normal">Central de Ajuda CISEB</span>
                        </div>
                      </div>
                      <ExternalLink className="w-3 h-3 text-slate-400 dark:text-slate-400 shrink-0" />
                    </button>

                    {/* 3. Gestão Geral de Contas (Apenas equipe de monitoramento) */}
                    {onOpenAccountsModal && currentUser?.role === 'monitoramento' && (
                      <>
                        <div className="my-1 border-t border-slate-100 dark:border-slate-700" />
                        <button
                          type="button"
                          onClick={() => {
                            setIsSettingsOpen(false);
                            onOpenAccountsModal();
                          }}
                          className="w-full px-3.5 py-2 text-left text-xs font-bold text-slate-700 dark:text-slate-200 hover:text-[#005BAC] dark:hover:text-sky-300 hover:bg-sky-50 dark:hover:bg-slate-700/60 transition-colors flex items-center gap-2.5 cursor-pointer"
                        >
                          <div className="w-6 h-6 rounded-lg bg-blue-100 dark:bg-blue-900/40 text-[#005BAC] dark:text-sky-300 flex items-center justify-center shrink-0">
                            <Users className="w-3.5 h-3.5" />
                          </div>
                          <div className="flex flex-col">
                            <span>Gestão de Contas</span>
                            <span className="text-[10px] text-slate-400 dark:text-slate-400 font-normal">Monitoramento & Unidades</span>
                          </div>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Logged in User Profile & Logout */}
            {currentUser && (
              <div className="bg-black/25 pl-2.5 pr-1 py-1 rounded-xl border border-white/15 flex items-center gap-2 text-xs shadow-sm">
                <div className="flex items-center gap-1.5 max-w-[140px] sm:max-w-[200px]">
                  <div className="w-6 h-6 rounded-full bg-sky-400 text-[#021631] font-black flex items-center justify-center text-[10px] shrink-0 shadow-xs">
                    <span className="text-[#021631] font-black">{currentUser.nome.charAt(0)}</span>
                  </div>
                  <div className="truncate text-left leading-tight">
                    <div className="font-bold text-white text-[11px] truncate" title={currentUser.nome}>
                      {currentUser.nome.split(' ')[0]} {currentUser.nome.split(' ').slice(1, 2)}
                    </div>
                    <div className="text-[9px] text-sky-200 truncate uppercase font-medium">
                      {currentUser.role === 'formador'
                        ? 'Formador(a)'
                        : currentUser.role === 'monitoramento'
                        ? 'Equipe Monitoramento'
                        : currentUser.role === 'coordenador'
                        ? 'Coordenador(a)'
                        : 'Usuário'}
                    </div>
                  </div>
                </div>

                {onLogout && (
                  <button
                    onClick={onLogout}
                    className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-red-500/30 transition-colors cursor-pointer"
                    title="Sair / Trocar de Usuário"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Progress sub-bar for form completeness */}
      {activeView === 'edit' && (
        <div className="bg-[#012b66] border-t border-[#013780] px-4 sm:px-6 py-1 text-xs flex items-center justify-between text-white/90">
          <div className="flex items-center gap-2 text-[11px]">
            <span className="font-bold uppercase text-white/85">
              Preenchimento de Parâmetros:
            </span>
            <span className="font-black text-[#78BC61]">{completionPercentage}%</span>
          </div>
          <div className="w-28 sm:w-44 bg-black/30 rounded-full h-1.5 overflow-hidden border border-white/10">
            <div
              className={`h-full transition-all duration-500 rounded-full ${
                completionPercentage === 100
                  ? 'bg-[#78BC61]'
                  : completionPercentage > 60
                  ? 'bg-amber-400'
                  : 'bg-blue-300'
              }`}
              style={{ width: `${completionPercentage}%` }}
            />
          </div>
        </div>
      )}
    </header>
  );
};
