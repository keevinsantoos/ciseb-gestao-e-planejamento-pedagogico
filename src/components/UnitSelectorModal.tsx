import React, { useState, useMemo } from 'react';
import {
  X,
  Building2,
  CheckCircle2,
  Search,
  School,
  Save,
  User,
  ShieldCheck,
  AlertCircle,
  Shield,
  Crown,
  GraduationCap,
} from 'lucide-react';
import {
  AuthUser,
  UNIDADES_CISEB_OPTIONS,
  PROFESSORES_FORMADORES_OPTIONS
} from '../types';
import { useAuth } from '../hooks/useAuth';
import { TopBlur, BottomBlur } from './ui/edge-blur';

interface UnitSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: AuthUser | null;
  onSave?: (updates: { unidadeCiseb: string; nome?: string }) => Promise<void>;
  onProfileUpdated?: (updatedUser: AuthUser) => void;
}

export const UnitSelectorModal: React.FC<UnitSelectorModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onSave,
  onProfileUpdated,
}) => {
  const { updateProfile } = useAuth();
  const [selectedUnit, setSelectedUnit] = useState(
    currentUser?.unidadeCiseb || UNIDADES_CISEB_OPTIONS[0]
  );
  const [searchFilter, setSearchFilter] = useState('');
  const [nomeFormador, setNomeFormador] = useState(currentUser?.nome || '');
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Sync initial state when modal opens
  React.useEffect(() => {
    if (isOpen && currentUser) {
      setSelectedUnit(currentUser.unidadeCiseb || UNIDADES_CISEB_OPTIONS[0]);
      setNomeFormador(currentUser.nome || '');
      setErrorMsg(null);
      setSuccessMsg(null);
      setSearchFilter('');
    }
  }, [isOpen, currentUser]);

  const filteredUnits = useMemo(() => {
    const term = searchFilter.toLowerCase().trim();
    if (!term) return UNIDADES_CISEB_OPTIONS;
    return UNIDADES_CISEB_OPTIONS.filter((u) => u.toLowerCase().includes(term));
  }, [searchFilter]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nomeFormador.trim()) {
      setErrorMsg('Por favor, informe seu nome completo.');
      return;
    }
    if (!selectedUnit) {
      setErrorMsg('Selecione uma Unidade CISEB válida.');
      return;
    }

    setIsSaving(true);
    setErrorMsg(null);
    try {
      if (onSave) {
        await onSave({
          unidadeCiseb: selectedUnit,
          nome: nomeFormador.trim(),
        });
      } else {
        const updated = await updateProfile({
          unidadeCiseb: selectedUnit,
          nome: nomeFormador.trim(),
        });
        if (onProfileUpdated) {
          onProfileUpdated(updated);
        }
      }
      setSuccessMsg('Unidade e dados de perfil atualizados com sucesso!');
      setTimeout(() => {
        onClose();
      }, 700);
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao atualizar unidade.');
    } finally {
      setIsSaving(false);
    }
  };

  const getRoleBadge = () => {
    const role = currentUser?.role || 'formador';
    if (role === 'monitoramento') {
      return (
        <span className="px-2 py-0.5 text-[10px] font-black rounded-lg uppercase flex items-center gap-1 bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
          <Shield className="w-3 h-3 text-purple-600 dark:text-purple-400" />
          <span>Equipe Monitoramento</span>
        </span>
      );
    }
    if (role === 'coordenador') {
      return (
        <span className="px-2 py-0.5 text-[10px] font-black rounded-lg uppercase flex items-center gap-1 bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
          <Crown className="w-3 h-3 text-amber-600 dark:text-amber-400" />
          <span>Coordenação CISEB</span>
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 text-[10px] font-black rounded-lg uppercase flex items-center gap-1 bg-sky-100 text-[#005BAC] dark:bg-sky-950/60 dark:text-sky-300 border border-sky-200 dark:border-sky-800">
        <GraduationCap className="w-3 h-3 text-[#005BAC] dark:text-sky-400" />
        <span>Professor(a) Formador(a)</span>
      </span>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 w-full max-w-xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-[#005BAC] text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/10 rounded-xl border border-white/20">
              <Building2 className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Minha Unidade CISEB</h3>
              <p className="text-xs text-sky-100">
                Selecione ou altere a sua unidade de lotação institucional
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

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto flex-1 text-slate-800 dark:text-slate-100">
          {errorMsg && (
            <div className="p-3.5 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-xl text-xs text-red-700 dark:text-red-300 flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* User Name, Email & Role Badge */}
          <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/80 space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
              <span className="font-semibold text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-[#005BAC] dark:text-sky-400" />
                Nome Institucional:
              </span>
              <div className="flex items-center gap-2">
                {getRoleBadge()}
                <span className="text-[11px] text-slate-400 font-mono hidden sm:inline">
                  {currentUser?.email}
                </span>
              </div>
            </div>
            <input
              type="text"
              list="professores-options"
              value={nomeFormador}
              onChange={(e) => setNomeFormador(e.target.value.toUpperCase())}
              placeholder="SEU NOME COMPLETO"
              className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-xs font-bold text-slate-800 dark:text-white uppercase focus:outline-none focus:ring-2 focus:ring-[#005BAC]"
            />
            <datalist id="professores-options">
              {PROFESSORES_FORMADORES_OPTIONS.map((prof) => (
                <option key={prof} value={prof} />
              ))}
            </datalist>
          </div>

          {/* Searchable Unit Selection */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center justify-between">
              <span>Selecione sua Unidade CISEB de Atuação:</span>
              <span className="text-[10px] text-slate-400 font-normal lowercase">
                {filteredUnits.length} opções
              </span>
            </label>

            {/* Quick search input */}
            <div className="relative">
              <input
                type="text"
                placeholder="Filtrar unidade CISEB (ex: Augusto Meira, Marabá, etc)..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#005BAC]"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
            </div>

            {/* Units Options List with EdgeBlur */}
            <div className="relative isolate overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/40 shadow-inner">
              <TopBlur height={20} />
              <div className="max-h-56 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                {filteredUnits.length > 0 ? (
                  filteredUnits.map((unit) => {
                    const isSelected = selectedUnit === unit;
                    return (
                      <button
                        key={unit}
                        type="button"
                        onClick={() => setSelectedUnit(unit)}
                        className={`w-full text-left px-3.5 py-2.5 text-xs transition-colors flex items-center justify-between gap-3 cursor-pointer ${
                          isSelected
                            ? 'bg-sky-50 dark:bg-sky-950/60 font-bold text-[#005BAC] dark:text-sky-300'
                            : 'hover:bg-slate-50 dark:hover:bg-slate-700/50 text-slate-700 dark:text-slate-200'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <School
                            className={`w-4 h-4 shrink-0 ${
                              isSelected ? 'text-[#005BAC] dark:text-sky-400' : 'text-slate-400'
                            }`}
                          />
                          <span className="truncate">{unit}</span>
                        </div>
                        {isSelected && (
                          <CheckCircle2 className="w-4 h-4 text-[#005BAC] dark:text-sky-400 shrink-0" />
                        )}
                      </button>
                    );
                  })
                ) : (
                  <div className="p-4 text-center text-xs text-slate-400">
                    Nenhuma unidade encontrada para &quot;{searchFilter}&quot;.
                  </div>
                )}
              </div>
              <BottomBlur height={20} />
            </div>
          </div>

          {/* Institutional Info Box */}
          <div className="p-3.5 bg-sky-50/70 dark:bg-sky-950/30 rounded-xl border border-sky-200/60 dark:border-sky-900/40 flex items-start gap-2.5 text-[11px] text-sky-900 dark:text-sky-200 leading-relaxed">
            <ShieldCheck className="w-4 h-4 text-[#005BAC] dark:text-sky-400 shrink-0 mt-0.5" />
            <p>
              Ao confirmar, a unidade selecionada será salva no seu perfil institucional e preenchida automaticamente nos seus novos planos de sessão.
            </p>
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-slate-200 dark:border-slate-700 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider bg-[#005BAC] hover:bg-[#004785] text-white shadow-md active:scale-95 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              {isSaving ? 'Salvando...' : 'Salvar Unidade'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
