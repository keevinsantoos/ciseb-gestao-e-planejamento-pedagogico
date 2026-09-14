import React, { useState } from 'react';
import { AuthUser } from '../../types';
import { CisebLogo } from '../CisebLogo';
import { ToolCard } from './ToolCard';
import { DevelopmentModal } from './DevelopmentModal';
import {
  FileText,
  FolderKanban,
  BarChart3,
  LogOut,
  User,
  School,
  Sparkles,
  ShieldCheck,
  LayoutDashboard,
} from 'lucide-react';

interface HubProps {
  currentUser: AuthUser;
  onSelectTool: (tool: 'edit' | 'report' | 'monitoring' | 'admin') => void;
}

export const Hub: React.FC<HubProps> = ({
  currentUser,
  onSelectTool,
}) => {
  const [devModalTitle, setDevModalTitle] = useState<string | null>(null);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bom dia';
    if (hour < 18) return 'Boa tarde';
    return 'Boa noite';
  };

  return (
    <div className="flex-1 w-full bg-slate-50 dark:bg-slate-900 flex flex-col font-sans transition-colors duration-300">
      {/* MAIN HUB CONTENT */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12 flex flex-col">
        
        {/* Welcome Section */}
        <div className="mb-10 sm:mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-100 dark:bg-sky-900/30 text-[#005BAC] dark:text-sky-300 text-xs font-bold uppercase tracking-widest mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            Bem-vindo(a) ao CISEB
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white mb-2 tracking-tight">
            {getGreeting()}, {currentUser.nome?.split(' ')[0]}
          </h2>
          <p className="text-lg text-slate-600 dark:text-slate-400">
            Escolha uma ferramenta para continuar seu trabalho.
          </p>
        </div>

        {/* Tools Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          
          <ToolCard
            title="Plano de Aula"
            description="Planeje e organize suas atividades pedagógicas com base na BNCC Computação, Cultura Maker e Design Thinking."
            icon={FileText}
            status="available"
            onClick={() => onSelectTool('edit')}
          />

          <ToolCard
            title="Cadastro de Projetos"
            description="Cadastre, estruture e organize projetos pedagógicos desenvolvidos nas unidades CISEB."
            icon={FolderKanban}
            status="development"
            onClick={() => setDevModalTitle("Cadastro de Projetos")}
          />

          <ToolCard
            title="Avaliação Pedagógica"
            description="Acompanhe, mensure e desenvolva processos de avaliação pedagógica dos estudantes."
            icon={BarChart3}
            status="development"
            onClick={() => setDevModalTitle("Avaliação Pedagógica")}
          />

          {(currentUser?.role === 'monitoramento' || currentUser?.role === 'coordenador') && (
            <ToolCard
              title="Painel de Monitoramento"
              description="Acompanhe métricas, relatórios de atendimentos e indicadores das unidades CISEB de todo o Pará."
              icon={LayoutDashboard}
              status="available"
              onClick={() => onSelectTool('monitoring')}
            />
          )}

          {currentUser?.role === 'monitoramento' && (
            <ToolCard
              title="Administração"
              description="Gerencie os professores formadores, unidades escolares e permissões de acesso da rede CISEB."
              icon={ShieldCheck}
              status="available"
              onClick={() => onSelectTool('admin')}
            />
          )}

        </div>
      </main>

      {/* Modals */}
      <DevelopmentModal
        isOpen={!!devModalTitle}
        title={devModalTitle || ''}
        onClose={() => setDevModalTitle(null)}
      />
    </div>
  );
};
