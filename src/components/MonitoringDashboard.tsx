import React, { useEffect, useState, useMemo } from 'react';
import { AuthUser, CisebSessionPlan } from '../types';
import { subscribePlans } from '../services/firestoreService';
import { CisebLogo } from './CisebLogo';
import { LogOut, LayoutDashboard, Building2, Users, FileText, ChevronDown, ChevronUp, Sun, Moon } from 'lucide-react';

interface MonitoringDashboardProps {
  user: AuthUser;
  onLogout: () => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
}

export const MonitoringDashboard: React.FC<MonitoringDashboardProps> = ({
  user,
  onLogout,
  theme,
  onToggleTheme
}) => {
  const [plans, setPlans] = useState<CisebSessionPlan[]>([]);
  const [expandedUser, setExpandedUser] = useState<string | null>(null);
  const [expandedUnit, setExpandedUnit] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = subscribePlans((data) => {
      setPlans(data || []);
    });
    return () => unsubscribe();
  }, []);

  // Compute stats
  const totalPlans = plans.length;
  
  // Group by users
  const userStats = useMemo(() => {
    const map = new Map<string, { unidade: string, total: number, lastDate: Date, plans: CisebSessionPlan[] }>();
    plans.forEach(p => {
      const formador = p.professorFormador || 'Desconhecido';
      const existing = map.get(formador);
      const date = new Date(p.createdAt);
      if (!existing) {
        map.set(formador, { unidade: p.unidadeCiseb || 'Desconhecida', total: 1, lastDate: date, plans: [p] });
      } else {
        existing.total += 1;
        existing.plans.push(p);
        if (date > existing.lastDate) {
          existing.lastDate = date;
        }
      }
    });
    return Array.from(map.entries())
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.total - a.total);
  }, [plans]);

  const totalUsersWithPlans = userStats.length;

  // Group by units
  const unitStats = useMemo(() => {
    const map = new Map<string, { formadores: Set<string>, total: number, plans: CisebSessionPlan[] }>();
    plans.forEach(p => {
      const unidade = p.unidadeCiseb || 'Desconhecida';
      const formador = p.professorFormador || 'Desconhecido';
      const existing = map.get(unidade);
      if (!existing) {
        map.set(unidade, { formadores: new Set([formador]), total: 1, plans: [p] });
      } else {
        existing.total += 1;
        existing.formadores.add(formador);
        existing.plans.push(p);
      }
    });
    return Array.from(map.entries())
      .map(([name, data]) => ({ name, total: data.total, formadoresAtivos: data.formadores.size, plans: data.plans }))
      .sort((a, b) => b.total - a.total);
  }, [plans]);

  const topUnit = unitStats.length > 0 ? unitStats[0].name : 'N/A';

  const toggleUserRow = (name: string) => {
    setExpandedUser(expandedUser === name ? null : name);
  };

  const toggleUnitRow = (name: string) => {
    setExpandedUnit(expandedUnit === name ? null : name);
  };

  return (
    <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-in fade-in slide-in-from-bottom-4">
        
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-[#005BAC]/10 dark:bg-sky-400/10 flex items-center justify-center shrink-0">
              <FileText className="w-6 h-6 text-[#005BAC] dark:text-sky-400" />
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">Total de Planos</p>
              <p className="text-2xl font-black text-slate-900 dark:text-white">{totalPlans}</p>
            </div>
          </div>
          
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center shrink-0">
              <Users className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">Formadores com Plano</p>
              <p className="text-2xl font-black text-slate-900 dark:text-white">{totalUsersWithPlans}</p>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center shrink-0">
              <Building2 className="w-6 h-6 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">Unidade Destaque</p>
              <p className="text-base sm:text-lg font-black text-slate-900 dark:text-white truncate" title={topUnit}>{topUnit}</p>
            </div>
          </div>
        </div>

        {/* User Table */}
        <section className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
            <h2 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-[#005BAC] dark:text-sky-400" />
              Controle por Usuário (Formadores)
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
              <thead className="text-xs text-slate-500 dark:text-slate-400 uppercase bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="px-5 py-3 font-semibold">Professor Formador</th>
                  <th className="px-5 py-3 font-semibold">Unidade CISEB</th>
                  <th className="px-5 py-3 font-semibold text-center">Total de Planos</th>
                  <th className="px-5 py-3 font-semibold text-right">Último Plano</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                {userStats.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-5 py-8 text-center text-slate-500">Nenhum plano encontrado.</td>
                  </tr>
                ) : (
                  userStats.map((stat) => (
                    <React.Fragment key={stat.name}>
                      <tr 
                        onClick={() => toggleUserRow(stat.name)}
                        className={`hover:bg-slate-50 dark:hover:bg-slate-700/30 cursor-pointer transition-colors ${expandedUser === stat.name ? 'bg-sky-50/50 dark:bg-sky-900/10' : ''}`}
                      >
                        <td className="px-5 py-3 font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                          {expandedUser === stat.name ? <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" /> : <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />}
                          <span className="truncate max-w-[200px]">{stat.name}</span>
                        </td>
                        <td className="px-5 py-3 text-xs">{stat.unidade}</td>
                        <td className="px-5 py-3 text-center">
                          <span className="bg-slate-100 dark:bg-slate-700 px-2.5 py-1 rounded-full text-xs font-bold text-slate-700 dark:text-slate-300">
                            {stat.total}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-right text-xs whitespace-nowrap">
                          {stat.lastDate.toLocaleDateString('pt-BR')}
                        </td>
                      </tr>
                      {expandedUser === stat.name && (
                        <tr>
                          <td colSpan={4} className="p-0 border-b border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/30">
                            <div className="p-4 pl-12 max-h-60 overflow-y-auto space-y-2">
                              {stat.plans.map(p => (
                                <div key={p.id} className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 flex justify-between items-center gap-4 text-xs shadow-sm">
                                  <div className="min-w-0">
                                    <p className="font-bold text-slate-900 dark:text-white truncate" title={p.tituloSuporte || 'Sem título'}>
                                      {p.tituloSuporte || 'Sem título'}
                                    </p>
                                    <p className="text-slate-500 dark:text-slate-400 mt-0.5 truncate">{p.modalidade || 'Não informada'}</p>
                                  </div>
                                  <div className="text-right shrink-0 flex flex-col items-end gap-1">
                                    <p className="text-slate-500 dark:text-slate-400">{new Date(p.createdAt).toLocaleDateString('pt-BR')}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Unit Table */}
        <section className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
            <h2 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <Building2 className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              Controle por Unidade CISEB
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
              <thead className="text-xs text-slate-500 dark:text-slate-400 uppercase bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="px-5 py-3 font-semibold">Unidade CISEB</th>
                  <th className="px-5 py-3 font-semibold text-center">Total de Planos</th>
                  <th className="px-5 py-3 font-semibold text-center">Formadores Ativos</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                {unitStats.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-5 py-8 text-center text-slate-500">Nenhuma unidade encontrada.</td>
                  </tr>
                ) : (
                  unitStats.map((stat) => (
                    <React.Fragment key={stat.name}>
                      <tr 
                        onClick={() => toggleUnitRow(stat.name)}
                        className={`hover:bg-slate-50 dark:hover:bg-slate-700/30 cursor-pointer transition-colors ${expandedUnit === stat.name ? 'bg-amber-50/50 dark:bg-amber-900/10' : ''}`}
                      >
                        <td className="px-5 py-3 font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                          {expandedUnit === stat.name ? <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" /> : <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />}
                          {stat.name}
                        </td>
                        <td className="px-5 py-3 text-center">
                          <span className="bg-slate-100 dark:bg-slate-700 px-2.5 py-1 rounded-full text-xs font-bold text-slate-700 dark:text-slate-300">
                            {stat.total}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-center">
                          <span className="bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 px-2.5 py-1 rounded-full text-xs font-bold">
                            {stat.formadoresAtivos}
                          </span>
                        </td>
                      </tr>
                      {expandedUnit === stat.name && (
                        <tr>
                          <td colSpan={3} className="p-0 border-b border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/30">
                            <div className="p-4 pl-12 max-h-60 overflow-y-auto space-y-2">
                              {stat.plans.map(p => (
                                <div key={p.id} className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 flex justify-between items-center gap-4 text-xs shadow-sm">
                                  <div className="min-w-0">
                                    <p className="font-bold text-slate-900 dark:text-white truncate" title={p.tituloSuporte || 'Sem título'}>
                                      {p.tituloSuporte || 'Sem título'}
                                    </p>
                                    <p className="text-slate-500 dark:text-slate-400 mt-0.5 truncate">{p.professorFormador || 'Desconhecido'} • {p.modalidade || 'Não informada'}</p>
                                  </div>
                                  <div className="text-right shrink-0">
                                    <p className="text-slate-500 dark:text-slate-400">{new Date(p.createdAt).toLocaleDateString('pt-BR')}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

    </div>
  );
};
