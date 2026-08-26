import React, { useState } from 'react';
import { AuthUser } from '../types';
import { CisebLogo } from './CisebLogo';
import { LoginForm } from './auth/LoginForm';
import { RegisterForm } from './auth/RegisterForm';
import {
  KeyRound,
  UserPlus,
  Sun,
  Moon,
  Sparkles,
  School,
  Headphones,
  ExternalLink,
} from 'lucide-react';
import { DEFAULT_SUPPORT_URL } from './Header';
import magAvatar from '../assets/images/mag_avatar_v2_1786994402829.jpg';

interface LoginScreenProps {
  onLogin: (user: AuthUser) => void;
  theme?: 'light' | 'dark';
  onToggleTheme?: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  onLogin,
  theme = 'light',
  onToggleTheme,
}) => {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');

  return (
    <div className="min-h-screen bg-slate-100/90 dark:bg-slate-950 flex flex-col justify-center items-center p-4 sm:p-6 transition-colors duration-500 relative overflow-hidden">
      {/* Soft Ambient Background Glows */}
      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-sky-200/40 dark:bg-sky-900/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-amber-100/50 dark:bg-amber-900/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] dark:bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] opacity-40 pointer-events-none" />

      {/* Theme Toggle Button Top Right */}
      {onToggleTheme && (
        <div className="absolute top-4 right-4 z-20">
          <button
            onClick={onToggleTheme}
            className="p-2.5 rounded-2xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-md border border-slate-200/80 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:scale-105 active:scale-95 transition-all shadow-sm hover:shadow cursor-pointer"
            title="Alternar Tema"
          >
            {theme === 'dark' ? (
              <Sun className="w-5 h-5 text-amber-400" />
            ) : (
              <Moon className="w-5 h-5 text-slate-700" />
            )}
          </button>
        </div>
      )}

      {/* Main Container Card */}
      <div className="w-full max-w-5xl bg-white/95 dark:bg-slate-900/95 rounded-3xl shadow-xl hover:shadow-2xl transition-shadow border border-slate-200/90 dark:border-slate-800 overflow-hidden grid grid-cols-1 lg:grid-cols-12 backdrop-blur-md relative z-10">
        
        {/* Left Side: Brand & Visual Identity */}
        <div className="lg:col-span-5 bg-gradient-to-br from-[#005BAC] via-[#004b91] to-[#013780] p-6 sm:p-8 text-white flex flex-col justify-between relative overflow-hidden">
          {/* Subtle decorative circles */}
          <div className="absolute -right-16 -top-16 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute -left-16 -bottom-16 w-64 h-64 bg-[#F39200]/20 rounded-full blur-2xl pointer-events-none" />

          {/* Top Logo & System Title */}
          <div className="space-y-4 relative z-10 flex flex-col">
            <div className="flex justify-center w-full my-1">
              <CisebLogo className="h-16 sm:h-20 w-auto max-w-full drop-shadow-md" />
            </div>
            
            <div className="w-full text-left">
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight text-left">
                Planejador de Sessão
              </h1>
              <p className="text-sky-200 text-xs sm:text-sm font-medium mt-1 text-left">
                SEDUC-PA • Centros de Inovação e Sustentabilidade da Educação Básica
              </p>
            </div>
          </div>

          {/* Center Mascot & Message */}
          <div className="my-6 p-4 bg-white/10 backdrop-blur-md rounded-2xl border border-white/15 relative z-10 flex items-center gap-3.5 shadow-lg">
            <img
              src={magAvatar}
              alt="MAG - Mentora de Aprendizagem"
              className="w-12 h-12 rounded-full border-2 border-white shadow-md object-cover shrink-0"
            />
            <div className="text-xs space-y-0.5">
              <div className="flex items-center gap-1.5 font-bold text-amber-300">
                <Sparkles className="w-3.5 h-3.5" />
                <span>MAG • Mentora com IA</span>
              </div>
              <p className="text-white/90 text-[11px] leading-relaxed">
                Bem-vindo(a)! Acesse com seu e-mail institucional e planeje sessões formativas com rigor pedagógico.
              </p>
            </div>
          </div>

          {/* Bottom Security Info */}
          <div className="pt-2 border-t border-white/15 relative z-10 text-[11px] text-sky-200 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <School className="w-3.5 h-3.5 text-amber-400" />
              <span>Governo do Estado do Pará</span>
            </div>
            <span className="font-mono text-[10px] bg-white/15 px-2 py-0.5 rounded-full font-bold">
              v2.5 • Auth 2026
            </span>
          </div>
        </div>

        {/* Right Side: Auth Forms & Mode Switcher */}
        <div className="lg:col-span-7 p-6 sm:p-8 flex flex-col justify-center">
          {/* 2-Tab Selector */}
          <div className="flex bg-slate-100 dark:bg-slate-800/80 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-700 mb-6">
            <button
              onClick={() => setActiveTab('login')}
              className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                activeTab === 'login'
                  ? 'bg-white dark:bg-slate-700 text-[#005BAC] dark:text-sky-300 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>1. Acessar</span>
            </button>
            <button
              onClick={() => setActiveTab('register')}
              className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                activeTab === 'register'
                  ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-300 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>2. Cadastrar</span>
            </button>
          </div>

          {/* Form Content */}
          {activeTab === 'login' && (
            <LoginForm
              onLoginSuccess={onLogin}
              onSwitchToRegister={() => setActiveTab('register')}
            />
          )}
          {activeTab === 'register' && (
            <RegisterForm
              onRegisterSuccess={onLogin}
              onSwitchToLogin={() => setActiveTab('login')}
            />
          )}
        </div>
      </div>

      {/* Spacious Footer Bar Outside Card */}
      <div className="w-full max-w-5xl mt-6 px-4 py-3 rounded-2xl bg-white/60 dark:bg-slate-900/60 backdrop-blur-md border border-slate-200/70 dark:border-slate-800/70 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400 font-medium">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Sistema de Monitoramento • Diretoria de Inovação - DINOV</span>
        </div>

        <a
          id="login-support-link"
          href={DEFAULT_SUPPORT_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-sky-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 hover:border-sky-300 dark:hover:border-sky-600 text-slate-700 dark:text-slate-200 hover:text-[#005BAC] dark:hover:text-sky-300 shadow-xs hover:shadow transition-all group font-semibold"
        >
          <Headphones className="w-4 h-4 text-[#005BAC] dark:text-sky-400 group-hover:scale-110 transition-transform" />
          <span>Precisa de ajuda? <strong>Central de Suporte Técnico</strong></span>
          <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#005BAC] dark:group-hover:text-sky-300 transition-colors ml-0.5" />
        </a>
      </div>
    </div>
  );
};
