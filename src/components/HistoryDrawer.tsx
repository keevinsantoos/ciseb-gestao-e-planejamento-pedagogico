import React, { useState } from 'react';
import { CisebSessionPlan, AuthUser } from '../types';
import {
  X,
  History,
  Trash2,
  Copy,
  FileText,
  Search,
  Upload,
  Download,
  Calendar,
  Building2,
  UserCheck,
  Lock,
  ShieldCheck
} from 'lucide-react';

interface HistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  savedPlans: CisebSessionPlan[];
  currentUser?: AuthUser | null;
  onLoadPlan: (plan: CisebSessionPlan) => void;
  onDeletePlan: (planId: string) => void;
  onImportPlans: (imported: CisebSessionPlan[]) => void;
}

export const HistoryDrawer: React.FC<HistoryDrawerProps> = ({
  isOpen,
  onClose,
  savedPlans,
  currentUser,
  onLoadPlan,
  onDeletePlan,
  onImportPlans,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  if (!isOpen) return null;

  const filteredPlans = savedPlans.filter((p) => {
    const term = searchTerm.toLowerCase();
    return (
      (p.tituloSuporte || '').toLowerCase().includes(term) ||
      (p.unidadeCiseb || '').toLowerCase().includes(term) ||
      (p.professorFormador || '').toLowerCase().includes(term) ||
      (p.temaImersao || '').toLowerCase().includes(term)
    );
  });

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const parsed = JSON.parse(content);
        const rawArray: CisebSessionPlan[] = Array.isArray(parsed) ? parsed : [parsed];
        
        // Ensure imported plans are bound to the current logged in user
        const boundArray = rawArray.map((p) => ({
          ...p,
          createdBy: currentUser?.id || currentUser?.uid || p.createdBy,
          authorEmail: currentUser?.email || p.authorEmail,
          authorNome: currentUser?.nome || p.authorNome || p.professorFormador,
        }));

        onImportPlans(boundArray);
      } catch (err) {
        alert('Erro ao importar arquivo JSON. Certifique-se de ser um arquivo válido do CISEB.');
      }
    };
    reader.readAsText(file);
  };

  const handleExportAll = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(savedPlans, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `CISEB_Meus_Planos_${currentUser?.nome?.replace(/\s+/g, '_') || 'Usuario'}_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-96 md:w-[460px] bg-white dark:bg-slate-900 shadow-2xl border-l border-slate-200 dark:border-slate-700 flex flex-col animate-in slide-in-from-right duration-200">
      {/* Header */}
      <div className="bg-[#013780] dark:bg-slate-950 text-white p-4 flex items-center justify-between border-b border-[#012b66] dark:border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-white/10 rounded-lg border border-white/20">
            <History className="w-4 h-4 text-amber-300" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="font-bold text-sm text-white">Meus Planos Salvos</h3>
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                <Lock className="w-2.5 h-2.5" />
                Privado
              </span>
            </div>
            <p className="text-[11px] text-white/80">
              {savedPlans.length} {savedPlans.length === 1 ? 'plano autoral salvo' : 'planos autorais salvos'}
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-1.5 hover:bg-white/10 rounded-lg text-white/80 hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* User Privacy Notice */}
      <div className="px-4 py-2.5 bg-sky-50 dark:bg-sky-950/40 border-b border-sky-100 dark:border-sky-900/50 flex items-center gap-2 text-xs text-sky-900 dark:text-sky-200">
        <ShieldCheck className="w-4 h-4 text-[#005BAC] dark:text-sky-400 shrink-0" />
        <p className="text-[11px] leading-tight">
          Visualização restrita ao autor <span className="font-bold text-[#005BAC] dark:text-sky-300">({currentUser?.nome || currentUser?.email})</span>.
        </p>
      </div>

      {/* Toolbar (Search & Import/Export) */}
      <div className="p-3 bg-slate-100 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700 space-y-2">
        <div className="relative">
          <input
            type="text"
            placeholder="Buscar nos meus planos por título ou tema..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#013780]"
          />
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
        </div>

        <div className="flex items-center justify-between text-xs gap-2 pt-1">
          <label className="px-2.5 py-1 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 rounded font-medium cursor-pointer flex items-center gap-1.5 text-[11px] transition-colors">
            <Upload className="w-3 h-3 text-[#005BAC] dark:text-sky-400" />
            Importar JSON
            <input type="file" accept=".json" onChange={handleFileUpload} className="hidden" />
          </label>

          {savedPlans.length > 0 && (
            <button
              onClick={handleExportAll}
              className="px-2.5 py-1 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 rounded font-medium cursor-pointer flex items-center gap-1.5 text-[11px] transition-colors"
            >
              <Download className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
              Exportar Meus Planos
            </button>
          )}
        </div>
      </div>

      {/* Plan Cards List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50 dark:bg-slate-900/50">
        {filteredPlans.length > 0 ? (
          filteredPlans.map((plan) => (
            <div
              key={plan.id}
              className="bg-white dark:bg-slate-800 rounded-xl p-3.5 border border-slate-200 dark:border-slate-700 shadow-xs space-y-2 hover:border-[#005BAC]/40 dark:hover:border-sky-500/40 transition-all"
            >
              <div className="flex items-start justify-between gap-2">
                <span className="text-[10px] font-bold uppercase bg-sky-100 dark:bg-sky-900/40 text-[#005BAC] dark:text-sky-300 px-2 py-0.5 rounded">
                  {plan.temaImersao || 'Geral'}
                </span>

                <span className="text-[10px] text-slate-400 dark:text-slate-500 flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {new Date(plan.updatedAt || plan.createdAt).toLocaleDateString('pt-BR')}
                </span>
              </div>

              <h4 className="font-bold text-xs text-slate-900 dark:text-white leading-snug">
                {plan.tituloSuporte || 'Plano sem título'}
              </h4>

              <div className="space-y-1 text-[11px] text-slate-600 dark:text-slate-300">
                <div className="flex items-center gap-1.5 truncate">
                  <Building2 className="w-3 h-3 text-slate-400 shrink-0" />
                  <span className="truncate">{plan.unidadeCiseb || 'Unidade não definida'}</span>
                </div>

                <div className="flex items-center gap-1.5 truncate">
                  <UserCheck className="w-3 h-3 text-emerald-500 shrink-0" />
                  <span className="truncate font-medium">{plan.professorFormador || currentUser?.nome || 'Você'}</span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-xs">
                <button
                  onClick={() => {
                    onLoadPlan(plan);
                    onClose();
                  }}
                  className="px-3 py-1 bg-[#005BAC] hover:bg-[#004785] text-white font-bold rounded-lg text-[11px] transition-colors cursor-pointer shadow-xs active:scale-95"
                >
                  Carregar / Editar
                </button>

                <button
                  onClick={() => onDeletePlan(plan.id)}
                  className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors cursor-pointer"
                  title="Excluir este plano"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="p-8 text-center text-xs text-slate-400 dark:text-slate-500 space-y-2">
            <FileText className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600" />
            <p className="font-semibold text-slate-600 dark:text-slate-300">
              Nenhum plano salvo encontrado para sua conta.
            </p>
            <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
              Os planos que você criar e salvar ficarão armazenados aqui de forma privada para o seu usuário.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

