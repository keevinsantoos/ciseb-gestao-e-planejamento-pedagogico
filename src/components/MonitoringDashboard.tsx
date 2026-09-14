import React, { useEffect, useState, useMemo } from 'react';
import {
  AuthUser,
  CisebSessionPlan,
  MODALIDADES_OPTIONS,
  TEMAS_IMERSAO_OPTIONS,
  UNIDADES_CISEB_OPTIONS,
  ODS_OPTIONS,
  BNCC_COMPETENCIAS_OPTIONS,
  BNCC_EIXOS_HABILIDADES_OPTIONS,
  TRILHAS_IMERSAO_OPTIONS,
  TIPO_PROTOTIPO_OPTIONS,
} from '../types';
import { subscribePlans } from '../services/firestoreService';
import {
  FileText,
  Users,
  Building2,
  TrendingUp,
  Clock,
  Filter,
  X,
  Calendar,
  BookOpen,
  Lightbulb,
  Globe,
  GraduationCap,
  MapPin,
  ChevronDown,
  ChevronUp,
  Cpu,
  Layers,
  Sparkles,
  Info,
  Award,
  BarChart3,
  Flame,
  CheckCircle2,
} from 'lucide-react';

export interface MonitoringDashboardProps {
  user: AuthUser;
  onLogout: () => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  plans?: CisebSessionPlan[];
}

// ─── PALETA DE CORES POR MODALIDADE ──────────────────────────────────────────
export const MODALIDADE_COLOR_MAP: Record<
  string,
  {
    bg: string;
    text: string;
    border: string;
    bar: string;
    badge: string;
  }
> = {
  'Imersão para Estudantes': {
    bg: 'bg-blue-50 dark:bg-blue-950/40',
    text: 'text-blue-700 dark:text-blue-300',
    border: 'border-blue-200 dark:border-blue-800',
    bar: 'bg-blue-600 dark:bg-blue-500',
    badge: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 border-blue-200 dark:border-blue-800',
  },
  'Formação de Professores': {
    bg: 'bg-emerald-50 dark:bg-emerald-950/40',
    text: 'text-emerald-700 dark:text-emerald-300',
    border: 'border-emerald-200 dark:border-emerald-800',
    bar: 'bg-emerald-600 dark:bg-emerald-500',
    badge: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
  },
  'Mentoria': {
    bg: 'bg-violet-50 dark:bg-violet-950/40',
    text: 'text-violet-700 dark:text-violet-300',
    border: 'border-violet-200 dark:border-violet-800',
    bar: 'bg-violet-600 dark:bg-violet-500',
    badge: 'bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-300 border-violet-200 dark:border-violet-800',
  },
  'Visita Técnica': {
    bg: 'bg-amber-50 dark:bg-amber-950/40',
    text: 'text-amber-700 dark:text-amber-300',
    border: 'border-amber-200 dark:border-amber-800',
    bar: 'bg-amber-600 dark:bg-amber-500',
    badge: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 border-amber-200 dark:border-amber-800',
  },
  'Itinerância': {
    bg: 'bg-rose-50 dark:bg-rose-950/40',
    text: 'text-rose-700 dark:text-rose-300',
    border: 'border-rose-200 dark:border-rose-800',
    bar: 'bg-rose-600 dark:bg-rose-500',
    badge: 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300 border-rose-200 dark:border-rose-800',
  },
  'Turmas Fixas': {
    bg: 'bg-cyan-50 dark:bg-cyan-950/40',
    text: 'text-cyan-700 dark:text-cyan-300',
    border: 'border-cyan-200 dark:border-cyan-800',
    bar: 'bg-cyan-600 dark:bg-cyan-500',
    badge: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/40 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800',
  },
};

const DEFAULT_MODALIDADE_COLOR = {
  bg: 'bg-slate-50 dark:bg-slate-800',
  text: 'text-slate-700 dark:text-slate-300',
  border: 'border-slate-200 dark:border-slate-700',
  bar: 'bg-slate-600 dark:bg-slate-500',
  badge: 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700',
};

// ─── HELPERS AUXILIARES ──────────────────────────────────────────────────────
function cleanUnitName(name: string | undefined): string {
  if (!name) return 'Não informada';
  return name.replace(/^CISEB\s+EE\s+/i, '').trim();
}

function extractHours(carga: string | undefined): number {
  if (!carga) return 0;
  const match = carga.match(/(\d+)\s*h/i);
  if (match) {
    return parseInt(match[1], 10) || 0;
  }
  const matchAulas = carga.match(/(\d+)\s*aula/i);
  if (matchAulas) {
    return parseInt(matchAulas[1], 10) || 0;
  }
  return 0;
}

export const MonitoringDashboard: React.FC<MonitoringDashboardProps> = ({
  user,
  onLogout,
  theme,
  onToggleTheme,
  plans: propPlans,
}) => {
  // ─── ESTADOS LOCAIS ───────────────────────────────────
  const [internalPlans, setInternalPlans] = useState<CisebSessionPlan[]>([]);
  const [expandedUser, setExpandedUser] = useState<string | null>(null);
  const [expandedUnit, setExpandedUnit] = useState<string | null>(null);

  // ─── FILTROS ──────────────────────────────────────────
  const [selectedUnit, setSelectedUnit] = useState<string>('ALL');
  const [selectedModalidade, setSelectedModalidade] = useState<string>('ALL');
  const [selectedTema, setSelectedTema] = useState<string>('ALL');
  const [selectedPeriod, setSelectedPeriod] = useState<'ALL' | '7days' | '30days' | 'thisMonth'>('ALL');

  // Subscrever Firestore caso não receba plans via prop
  useEffect(() => {
    if (propPlans && Array.isArray(propPlans)) {
      setInternalPlans(propPlans);
      return;
    }
    const unsubscribe = subscribePlans((data) => {
      setInternalPlans(data || []);
    });
    return () => unsubscribe();
  }, [propPlans]);

  const rawPlans = propPlans && Array.isArray(propPlans) ? propPlans : internalPlans;

  // ─── CÁLCULOS DERIVADOS (useMemo) ────────────────────

  // 1. Filtragem unificada
  const filteredPlans = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    return rawPlans.filter((p) => {
      // Filtro de Unidade
      if (selectedUnit !== 'ALL' && p.unidadeCiseb !== selectedUnit) {
        return false;
      }
      // Filtro de Modalidade
      if (selectedModalidade !== 'ALL' && p.modalidade !== selectedModalidade) {
        return false;
      }
      // Filtro de Tema
      if (selectedTema !== 'ALL' && p.temaImersao !== selectedTema) {
        return false;
      }
      // Filtro de Período
      if (selectedPeriod !== 'ALL') {
        const planDate = new Date(p.createdAt || p.updatedAt || 0);
        if (isNaN(planDate.getTime())) return true;

        if (selectedPeriod === '7days') {
          const sevenDaysAgo = new Date(startOfToday.getTime() - 7 * 24 * 60 * 60 * 1000);
          if (planDate < sevenDaysAgo) return false;
        } else if (selectedPeriod === '30days') {
          const thirtyDaysAgo = new Date(startOfToday.getTime() - 30 * 24 * 60 * 60 * 1000);
          if (planDate < thirtyDaysAgo) return false;
        } else if (selectedPeriod === 'thisMonth') {
          if (
            planDate.getFullYear() !== now.getFullYear() ||
            planDate.getMonth() !== now.getMonth()
          ) {
            return false;
          }
        }
      }
      return true;
    });
  }, [rawPlans, selectedUnit, selectedModalidade, selectedTema, selectedPeriod]);

  // Contagem de filtros ativos
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (selectedUnit !== 'ALL') count++;
    if (selectedModalidade !== 'ALL') count++;
    if (selectedTema !== 'ALL') count++;
    if (selectedPeriod !== 'ALL') count++;
    return count;
  }, [selectedUnit, selectedModalidade, selectedTema, selectedPeriod]);

  const handleClearFilters = () => {
    setSelectedUnit('ALL');
    setSelectedModalidade('ALL');
    setSelectedTema('ALL');
    setSelectedPeriod('ALL');
  };

  // 2. KPIs Principais
  const kpis = useMemo(() => {
    const totalPlans = filteredPlans.length;

    // Formadores ativos
    const formadoresSet = new Set<string>();
    const unidadesSet = new Set<string>();
    let totalHours = 0;

    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    let plansThisWeek = 0;

    filteredPlans.forEach((p) => {
      if (p.professorFormador) formadoresSet.add(p.professorFormador.trim());
      if (p.unidadeCiseb) unidadesSet.add(p.unidadeCiseb.trim());
      totalHours += extractHours(p.cargaHorariaAulas);

      const pDate = new Date(p.createdAt || p.updatedAt || 0);
      if (!isNaN(pDate.getTime()) && pDate >= sevenDaysAgo) {
        plansThisWeek++;
      }
    });

    const activeFormadoresCount = formadoresSet.size;
    const activeUnidadesCount = unidadesSet.size;
    const avgPlansPerFormador =
      activeFormadoresCount > 0 ? (totalPlans / activeFormadoresCount).toFixed(1) : '0.0';

    return {
      totalPlans,
      activeFormadoresCount,
      activeUnidadesCount,
      avgPlansPerFormador,
      plansThisWeek,
      totalHours,
    };
  }, [filteredPlans]);

  // 3. Distribuição por Modalidade
  const modalidadeStats = useMemo(() => {
    const counts: Record<string, number> = {};
    MODALIDADES_OPTIONS.forEach((m) => (counts[m] = 0));

    filteredPlans.forEach((p) => {
      const m = p.modalidade || 'Outros';
      counts[m] = (counts[m] || 0) + 1;
    });

    const total = filteredPlans.length || 1;
    return Object.entries(counts)
      .map(([name, count]) => ({
        name,
        count,
        pct: Math.round((count / total) * 100),
      }))
      .sort((a, b) => b.count - a.count);
  }, [filteredPlans]);

  // 4. Distribuição por Tema de Imersão
  const temaStats = useMemo(() => {
    const counts: Record<string, number> = {};
    TEMAS_IMERSAO_OPTIONS.forEach((t) => (counts[t] = 0));

    filteredPlans.forEach((p) => {
      const t = p.temaImersao || 'Outros';
      counts[t] = (counts[t] || 0) + 1;
    });

    const total = filteredPlans.length || 1;
    return Object.entries(counts)
      .map(([name, count]) => ({
        name,
        count,
        pct: Math.round((count / total) * 100),
      }))
      .sort((a, b) => b.count - a.count);
  }, [filteredPlans]);

  // 5. Distribuição por Tipo de Protótipo
  const prototipoStats = useMemo(() => {
    const counts: Record<string, number> = {};
    TIPO_PROTOTIPO_OPTIONS.forEach((t) => (counts[t] = 0));

    filteredPlans.forEach((p) => {
      const proto = p.tipoPrototipo || 'Outros';
      counts[proto] = (counts[proto] || 0) + 1;
    });

    const total = filteredPlans.length || 1;
    return Object.entries(counts)
      .map(([name, count]) => ({
        name,
        count,
        pct: Math.round((count / total) * 100),
      }))
      .sort((a, b) => b.count - a.count);
  }, [filteredPlans]);

  // 6. Linha do Tempo / Atividade nos últimos 14 dias
  const timelineDays = useMemo(() => {
    const days: { dateStr: string; label: string; count: number; dayOfWeek: string }[] = [];
    const now = new Date();

    for (let i = 13; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const iso = d.toISOString().split('T')[0];
      const label = `${d.getDate()}/${d.getMonth() + 1}`;
      const dayOfWeek = d.toLocaleDateString('pt-BR', { weekday: 'narrow' });
      days.push({ dateStr: iso, label, count: 0, dayOfWeek });
    }

    filteredPlans.forEach((p) => {
      if (!p.createdAt) return;
      const pIso = p.createdAt.split('T')[0];
      const found = days.find((item) => item.dateStr === pIso);
      if (found) {
        found.count++;
      }
    });

    const maxCount = Math.max(...days.map((d) => d.count), 1);
    return { days, maxCount };
  }, [filteredPlans]);

  // 7. Cobertura de ODS
  const odsStats = useMemo(() => {
    const counts: Record<string, number> = {};
    ODS_OPTIONS.forEach((ods) => (counts[ods] = 0));

    filteredPlans.forEach((p) => {
      if (Array.isArray(p.odsAplicada)) {
        p.odsAplicada.forEach((ods) => {
          counts[ods] = (counts[ods] || 0) + 1;
        });
      }
    });

    const total = filteredPlans.length || 1;
    const list = Object.entries(counts)
      .map(([name, count]) => ({
        name,
        count,
        pct: Math.round((count / total) * 100),
      }))
      .sort((a, b) => b.count - a.count);

    const maxCount = list[0]?.count || 0;
    return { list, topOds: maxCount > 0 ? list[0].name : null };
  }, [filteredPlans]);

  // 8. Competências e Eixos BNCC
  const bnccStats = useMemo(() => {
    const compCounts: Record<string, number> = {};
    BNCC_COMPETENCIAS_OPTIONS.forEach((c) => (compCounts[c] = 0));

    const eixoCounts: Record<string, number> = {};
    BNCC_EIXOS_HABILIDADES_OPTIONS.forEach((e) => (eixoCounts[e] = 0));

    filteredPlans.forEach((p) => {
      if (Array.isArray(p.bnccCompetencias)) {
        p.bnccCompetencias.forEach((c) => {
          compCounts[c] = (compCounts[c] || 0) + 1;
        });
      }
      if (Array.isArray(p.bnccHabilidadesEixo)) {
        p.bnccHabilidadesEixo.forEach((e) => {
          eixoCounts[e] = (eixoCounts[e] || 0) + 1;
        });
      }
    });

    const total = filteredPlans.length || 1;
    const competencias = Object.entries(compCounts)
      .map(([name, count]) => ({
        name,
        count,
        pct: Math.round((count / total) * 100),
      }))
      .sort((a, b) => b.count - a.count);

    const eixos = Object.entries(eixoCounts)
      .map(([name, count]) => ({
        name,
        count,
        pct: Math.round((count / total) * 100),
      }))
      .sort((a, b) => b.count - a.count);

    return { competencias, eixos };
  }, [filteredPlans]);

  // 9. Tabela de Formadores
  const formadoresRanking = useMemo(() => {
    const map = new Map<
      string,
      {
        unidade: string;
        plans: CisebSessionPlan[];
        modalidades: Set<string>;
        temas: Set<string>;
        lastDate: Date;
      }
    >();

    filteredPlans.forEach((p) => {
      const name = p.professorFormador ? p.professorFormador.trim() : 'Desconhecido';
      const date = new Date(p.createdAt || p.updatedAt || 0);
      const existing = map.get(name);

      if (!existing) {
        map.set(name, {
          unidade: p.unidadeCiseb || 'Desconhecida',
          plans: [p],
          modalidades: new Set([p.modalidade].filter(Boolean)),
          temas: new Set([p.temaImersao].filter(Boolean)),
          lastDate: date,
        });
      } else {
        existing.plans.push(p);
        if (p.modalidade) existing.modalidades.add(p.modalidade);
        if (p.temaImersao) existing.temas.add(p.temaImersao);
        if (date > existing.lastDate) {
          existing.lastDate = date;
        }
      }
    });

    return Array.from(map.entries())
      .map(([nome, data]) => ({
        nome,
        unidade: data.unidade,
        total: data.plans.length,
        modalidades: Array.from(data.modalidades),
        temas: Array.from(data.temas),
        lastDate: data.lastDate,
        plans: data.plans.sort(
          (a, b) =>
            new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
        ),
      }))
      .sort((a, b) => b.total - a.total);
  }, [filteredPlans]);

  // 10. Tabela de Unidades CISEB
  const unidadesRanking = useMemo(() => {
    const map = new Map<
      string,
      {
        formadores: Map<string, number>;
        modalidadesCount: Record<string, number>;
        temasCount: Record<string, number>;
        plans: CisebSessionPlan[];
      }
    >();

    filteredPlans.forEach((p) => {
      const unit = p.unidadeCiseb ? p.unidadeCiseb.trim() : 'Não informada';
      const formador = p.professorFormador ? p.professorFormador.trim() : 'Desconhecido';

      let data = map.get(unit);
      if (!data) {
        data = {
          formadores: new Map(),
          modalidadesCount: {},
          temasCount: {},
          plans: [],
        };
        map.set(unit, data);
      }

      data.plans.push(p);
      data.formadores.set(formador, (data.formadores.get(formador) || 0) + 1);

      if (p.modalidade) {
        data.modalidadesCount[p.modalidade] =
          (data.modalidadesCount[p.modalidade] || 0) + 1;
      }
      if (p.temaImersao) {
        data.temasCount[p.temaImersao] = (data.temasCount[p.temaImersao] || 0) + 1;
      }
    });

    return Array.from(map.entries())
      .map(([unidade, data]) => {
        // Modalidade mais usada
        const topMod = Object.entries(data.modalidadesCount).sort(
          (a, b) => b[1] - a[1]
        )[0]?.[0] || '—';

        // Tema mais explorado
        const topTema = Object.entries(data.temasCount).sort(
          (a, b) => b[1] - a[1]
        )[0]?.[0] || '—';

        const formadoresList = Array.from(data.formadores.entries())
          .map(([nome, count]) => ({ nome, count }))
          .sort((a, b) => b.count - a.count);

        return {
          unidade,
          cleanName: cleanUnitName(unidade),
          total: data.plans.length,
          formadoresAtivosCount: data.formadores.size,
          topMod,
          topTema,
          formadoresList,
          modalidadesDist: data.modalidadesCount,
          plans: data.plans,
        };
      })
      .sort((a, b) => b.total - a.total);
  }, [filteredPlans]);

  // 11. Painel de Trilhas de Imersão
  const trilhasStats = useMemo(() => {
    const map = new Map<
      string,
      {
        unidades: Set<string>;
        formadores: Set<string>;
        plans: CisebSessionPlan[];
      }
    >();

    TRILHAS_IMERSAO_OPTIONS.forEach((trilha) => {
      map.set(trilha, {
        unidades: new Set(),
        formadores: new Set(),
        plans: [],
      });
    });

    filteredPlans.forEach((p) => {
      if (!p.trilhaImersao) return;
      const data = map.get(p.trilhaImersao);
      if (data) {
        data.plans.push(p);
        if (p.unidadeCiseb) data.unidades.add(p.unidadeCiseb);
        if (p.professorFormador) data.formadores.add(p.professorFormador);
      } else {
        map.set(p.trilhaImersao, {
          unidades: new Set([p.unidadeCiseb].filter(Boolean)),
          formadores: new Set([p.professorFormador].filter(Boolean)),
          plans: [p],
        });
      }
    });

    const list = Array.from(map.entries())
      .map(([nome, data]) => ({
        nome,
        total: data.plans.length,
        unidades: Array.from(data.unidades),
        formadores: Array.from(data.formadores),
      }))
      .sort((a, b) => b.total - a.total);

    const maxTotal = list[0]?.total || 0;
    return {
      list,
      topTrilha: maxTotal > 0 ? list[0].nome : null,
    };
  }, [filteredPlans]);

  // ─── HELPERS DE RENDERIZAÇÃO ─────────────────────────

  const toggleUserRow = (name: string) => {
    setExpandedUser(expandedUser === name ? null : name);
  };

  const toggleUnitRow = (name: string) => {
    setExpandedUnit(expandedUnit === name ? null : name);
  };

  const currentTimeFormatted = useMemo(() => {
    return new Date().toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }, []);

  // ─── RENDER ──────────────────────────────────────────
  return (
    <div className="max-w-7xl mx-auto w-full px-3 sm:px-6 lg:px-8 py-6 space-y-7 animate-in fade-in slide-in-from-bottom-4 duration-300">
      
      {/* ─── 1. BARRA DE FILTROS (STICKY) ─────────────────────────────────── */}
      <div className="sticky top-16 z-20 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md p-3 sm:p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-md transition-all">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#005BAC]/10 dark:bg-sky-400/10 flex items-center justify-center shrink-0">
              <Filter className="w-4 h-4 text-[#005BAC] dark:text-sky-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                  Filtros de Monitoramento
                </span>
                {activeFiltersCount > 0 && (
                  <span className="px-2 py-0.5 text-[10px] font-black rounded-full bg-[#005BAC] text-white">
                    {activeFiltersCount} ativo{activeFiltersCount > 1 ? 's' : ''}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Exibindo <strong className="text-slate-900 dark:text-white">{filteredPlans.length}</strong> de {rawPlans.length} planos
              </p>
            </div>
          </div>

          {/* Selects Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-2 flex-1 lg:max-w-4xl">
            {/* Unidade */}
            <div className="relative">
              <select
                id="filter-unidade"
                value={selectedUnit}
                onChange={(e) => setSelectedUnit(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-800 dark:text-slate-200 font-medium focus:ring-2 focus:ring-[#005BAC] outline-none cursor-pointer"
                title="Filtrar por Unidade CISEB"
              >
                <option value="ALL">Todas as Unidades CISEB</option>
                {UNIDADES_CISEB_OPTIONS.map((u) => (
                  <option key={u} value={u}>
                    {cleanUnitName(u)}
                  </option>
                ))}
              </select>
            </div>

            {/* Modalidade */}
            <div className="relative">
              <select
                id="filter-modalidade"
                value={selectedModalidade}
                onChange={(e) => setSelectedModalidade(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-800 dark:text-slate-200 font-medium focus:ring-2 focus:ring-[#005BAC] outline-none cursor-pointer"
                title="Filtrar por Modalidade de Atendimento"
              >
                <option value="ALL">Todas as Modalidades</option>
                {MODALIDADES_OPTIONS.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>

            {/* Tema de Imersão */}
            <div className="relative">
              <select
                id="filter-tema"
                value={selectedTema}
                onChange={(e) => setSelectedTema(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-800 dark:text-slate-200 font-medium focus:ring-2 focus:ring-[#005BAC] outline-none cursor-pointer"
                title="Filtrar por Tema de Imersão"
              >
                <option value="ALL">Todos os Temas de Imersão</option>
                {TEMAS_IMERSAO_OPTIONS.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            {/* Período */}
            <div className="relative flex items-center gap-1.5">
              <select
                id="filter-periodo"
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value as any)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-800 dark:text-slate-200 font-medium focus:ring-2 focus:ring-[#005BAC] outline-none cursor-pointer"
                title="Filtrar por Período de Criação"
              >
                <option value="ALL">Todo o Período</option>
                <option value="7days">Últimos 7 dias</option>
                <option value="30days">Últimos 30 dias</option>
                <option value="thisMonth">Este mês</option>
              </select>

              {activeFiltersCount > 0 && (
                <button
                  type="button"
                  onClick={handleClearFilters}
                  className="px-2.5 py-1.5 bg-red-50 hover:bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-300 rounded-xl text-xs font-bold flex items-center gap-1 shrink-0 cursor-pointer transition-colors"
                  title="Limpar todos os filtros"
                  aria-label="Limpar filtros"
                >
                  <X className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Limpar</span>
                </button>
              )}
            </div>

          </div>

        </div>
      </div>

      {/* ─── 2. FAIXA DE KPIS PRINCIPAIS (5 CARDS) ─────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        
        {/* KPI 1: Total de Planos */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-200 dark:border-slate-700 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Total de Planos
            </span>
            <div className="w-8 h-8 rounded-xl bg-[#005BAC]/10 dark:bg-sky-400/10 flex items-center justify-center text-[#005BAC] dark:text-sky-400">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
              {kpis.totalPlans}
            </div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
              {kpis.totalHours > 0 ? `${kpis.totalHours}h planejadas` : `de ${rawPlans.length} na base`}
            </p>
          </div>
        </div>

        {/* KPI 2: Formadores Ativos */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-200 dark:border-slate-700 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Formadores Ativos
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400">
              {kpis.activeFormadoresCount}
            </div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
              com planos cadastrados
            </p>
          </div>
        </div>

        {/* KPI 3: Unidades com Planos */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-200 dark:border-slate-700 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Unidades Ativas
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/40 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl sm:text-3xl font-black text-amber-600 dark:text-amber-400">
              {kpis.activeUnidadesCount}
            </div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
              de 20 unidades CISEB
            </p>
          </div>
        </div>

        {/* KPI 4: Média Planos/Formador */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-200 dark:border-slate-700 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Média / Formador
            </span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950/40 flex items-center justify-center text-purple-600 dark:text-purple-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl sm:text-3xl font-black text-purple-600 dark:text-purple-400">
              {kpis.avgPlansPerFormador}
            </div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
              planos por formador
            </p>
          </div>
        </div>

        {/* KPI 5: Planos Esta Semana */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-200 dark:border-slate-700 shadow-xs flex flex-col justify-between col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Últimos 7 Dias
            </span>
            <div className="w-8 h-8 rounded-xl bg-sky-50 dark:bg-sky-950/40 flex items-center justify-center text-sky-600 dark:text-sky-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl sm:text-3xl font-black text-sky-600 dark:text-sky-400">
              {kpis.plansThisWeek}
            </div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
              planos criados na semana
            </p>
          </div>
        </div>

      </div>

      {/* ─── 3. SEÇÃO DE GRÁFICOS (2 COLUNAS) ───────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Gráfico A — Distribuição por Modalidade */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950/40 flex items-center justify-center text-blue-600 dark:text-blue-400">
                  <BookOpen className="w-4 h-4" />
                </div>
                <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                  Distribuição por Modalidade
                </h3>
              </div>
              <span className="text-[11px] font-bold text-slate-400">
                {filteredPlans.length} total
              </span>
            </div>

            {filteredPlans.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs flex flex-col items-center gap-1.5">
                <Info className="w-5 h-5 opacity-40" />
                <span>Nenhum plano encontrado para os filtros selecionados.</span>
              </div>
            ) : (
              <div className="space-y-3">
                {modalidadeStats.map((item) => {
                  const colors = MODALIDADE_COLOR_MAP[item.name] || DEFAULT_MODALIDADE_COLOR;
                  return (
                    <div key={item.name} className="space-y-1">
                      <div className="flex items-center justify-between text-xs font-medium">
                        <span className="text-slate-800 dark:text-slate-200 truncate pr-2">
                          {item.name}
                        </span>
                        <span className="text-slate-500 dark:text-slate-400 font-bold shrink-0">
                          {item.count} <span className="text-[10px] font-normal">({item.pct}%)</span>
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 dark:bg-slate-700 h-2.5 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${colors.bar}`}
                          style={{ width: `${item.pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Gráfico B — Distribuição por Tema de Imersão */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-amber-50 dark:bg-amber-950/40 flex items-center justify-center text-amber-600 dark:text-amber-400">
                  <Lightbulb className="w-4 h-4" />
                </div>
                <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                  Distribuição por Tema de Imersão
                </h3>
              </div>
              <span className="text-[11px] font-bold text-slate-400">
                7 temas CISEB
              </span>
            </div>

            {filteredPlans.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs flex flex-col items-center gap-1.5">
                <Info className="w-5 h-5 opacity-40" />
                <span>Nenhum plano encontrado para os filtros selecionados.</span>
              </div>
            ) : (
              <div className="space-y-3">
                {temaStats.map((item) => (
                  <div key={item.name} className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-medium">
                      <span className="text-slate-800 dark:text-slate-200 truncate pr-2">
                        {item.name}
                      </span>
                      <span className="text-slate-500 dark:text-slate-400 font-bold shrink-0">
                        {item.count} <span className="text-[10px] font-normal">({item.pct}%)</span>
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-700 h-2.5 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-amber-500 dark:bg-amber-400 transition-all duration-500"
                        style={{ width: `${item.pct}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Gráfico C — Distribuição por Tipo de Protótipo */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-purple-50 dark:bg-purple-950/40 flex items-center justify-center text-purple-600 dark:text-purple-400">
                <Cpu className="w-4 h-4" />
              </div>
              <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                Tipos de Protótipo Desenvolvidos
              </h3>
            </div>
            <span className="text-[11px] font-bold text-slate-400">
              Execução Técnica
            </span>
          </div>

          {filteredPlans.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-xs">
              Nenhum plano encontrado.
            </div>
          ) : (
            <div className="space-y-3">
              {prototipoStats.map((item) => (
                <div key={item.name} className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-medium">
                    <span className="text-slate-800 dark:text-slate-200">
                      Protótipo {item.name}
                    </span>
                    <span className="text-slate-500 dark:text-slate-400 font-bold">
                      {item.count} <span className="text-[10px] font-normal">({item.pct}%)</span>
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-700 h-2.5 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-purple-600 dark:bg-purple-400 transition-all duration-500"
                      style={{ width: `${item.pct}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Gráfico D — Linha do Tempo de Criação (Últimos 14 dias) */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <Calendar className="w-4 h-4" />
              </div>
              <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                Atividade nos Últimos 14 Dias
              </h3>
            </div>
            <span className="text-[11px] font-bold text-slate-400">
              Ritmo de Criação
            </span>
          </div>

          <div className="h-36 flex items-end justify-between gap-1 sm:gap-2 pt-4">
            {timelineDays.days.map((day) => {
              const heightPct = Math.max(
                Math.round((day.count / timelineDays.maxCount) * 100),
                day.count > 0 ? 15 : 4
              );
              return (
                <div
                  key={day.dateStr}
                  className="flex-1 flex flex-col items-center h-full justify-end group relative"
                  title={`${day.label} (${day.dayOfWeek}): ${day.count} plano(s)`}
                >
                  {/* Tooltip on hover */}
                  <div className="absolute -top-7 opacity-0 group-hover:opacity-100 bg-slate-900 text-white text-[10px] px-1.5 py-0.5 rounded shadow-sm transition-opacity pointer-events-none whitespace-nowrap z-10">
                    {day.count} plano{day.count !== 1 ? 's' : ''}
                  </div>

                  <div className="w-full bg-slate-100 dark:bg-slate-700/60 rounded-t-md h-full flex items-end">
                    <div
                      className={`w-full rounded-t-md transition-all duration-300 ${
                        day.count > 0
                          ? 'bg-[#005BAC] dark:bg-sky-400 group-hover:bg-[#004e96]'
                          : 'bg-transparent'
                      }`}
                      style={{ height: `${heightPct}%` }}
                    />
                  </div>
                  <span className="text-[9px] text-slate-400 dark:text-slate-500 font-mono mt-1">
                    {day.label}
                  </span>
                </div>
              );
            })}
          </div>
          <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-700/50 pt-2">
            <span>Mais antigo (14 dias atrás)</span>
            <span>Hoje</span>
          </div>
        </div>

      </div>

      {/* ─── 4. PAINEL DE COBERTURA DE ODS ──────────────────────────────────── */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-teal-50 dark:bg-teal-950/40 flex items-center justify-center text-teal-600 dark:text-teal-400">
              <Globe className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                Cobertura dos Objetivos de Desenvolvimento Sustentável (ODS)
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Alinhamento com a Agenda 2030 da ONU e temas transversais
              </p>
            </div>
          </div>

          {odsStats.topOds && (
            <div className="flex items-center gap-1.5 px-3 py-1 bg-teal-50 dark:bg-teal-950/50 border border-teal-200 dark:border-teal-800 rounded-xl text-teal-800 dark:text-teal-300 text-xs font-bold shrink-0">
              <Award className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
              <span>ODS Mais Aplicada: {odsStats.topOds}</span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {odsStats.list.map((item, idx) => {
            const isTop = item.name === odsStats.topOds && item.count > 0;
            return (
              <div
                key={item.name}
                className={`p-3.5 rounded-xl border transition-all ${
                  isTop
                    ? 'bg-teal-50/70 dark:bg-teal-950/30 border-teal-300 dark:border-teal-700 shadow-xs'
                    : 'bg-slate-50/70 dark:bg-slate-900/40 border-slate-200 dark:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-900 dark:text-white truncate" title={item.name}>
                    {item.name}
                  </span>
                  <span className="text-xs font-black text-teal-700 dark:text-teal-300 shrink-0 ml-2">
                    {item.count} <span className="text-[10px] font-normal text-slate-400">({item.pct}%)</span>
                  </span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-teal-600 dark:bg-teal-400 transition-all duration-500"
                    style={{ width: `${item.pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ─── 5. PAINEL DE COMPETÊNCIAS E EIXOS BNCC ─────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Competências BNCC */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 shadow-xs">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <GraduationCap className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                Competências Gerais BNCC Computação
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Frequência de aplicação nos planos pedagógicos
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {bnccStats.competencias.map((item) => (
              <div key={item.name} className="space-y-1">
                <div className="flex items-center justify-between text-xs font-medium">
                  <span className="text-slate-800 dark:text-slate-200 truncate pr-2">
                    {item.name}
                  </span>
                  <span className="text-slate-500 dark:text-slate-400 font-bold shrink-0">
                    {item.count} <span className="text-[10px] font-normal">({item.pct}%)</span>
                  </span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-700 h-2.5 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-indigo-600 dark:bg-indigo-400 transition-all duration-500"
                    style={{ width: `${item.pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Eixos de Habilidades BNCC */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 shadow-xs">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-7 h-7 rounded-lg bg-sky-50 dark:bg-sky-950/40 flex items-center justify-center text-sky-600 dark:text-sky-400">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                Eixos Estruturantes da BNCC
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Pensamento Computacional, Mundo Digital e Cultura Digital
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {bnccStats.eixos.map((item) => (
              <div
                key={item.name}
                className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 space-y-2"
              >
                <div className="flex items-center justify-between text-xs font-bold text-slate-900 dark:text-white">
                  <span>{item.name}</span>
                  <span className="text-sky-600 dark:text-sky-400 font-black">
                    {item.count} planos ({item.pct}%)
                  </span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-sky-500 dark:bg-sky-400 transition-all duration-500"
                    style={{ width: `${item.pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* ─── 6. TABELA DE FORMADORES (EXPANSÍVEL) ────────────────────────────── */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-[#005BAC] dark:text-sky-400" />
            <h2 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
              Controle Individual por Professor Formador ({formadoresRanking.length})
            </h2>
          </div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400">
            Clique na linha ou em "Ver planos" para expandir detalhes
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
            <thead className="text-[11px] text-slate-500 dark:text-slate-400 uppercase bg-slate-50/80 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="px-4 py-3 font-semibold w-12 text-center">#</th>
                <th className="px-4 py-3 font-semibold">Professor(a) Formador(a)</th>
                <th className="px-4 py-3 font-semibold">Unidade CISEB</th>
                <th className="px-4 py-3 font-semibold text-center">Planos</th>
                <th className="px-4 py-3 font-semibold hidden md:table-cell">Modalidades</th>
                <th className="px-4 py-3 font-semibold hidden lg:table-cell">Temas</th>
                <th className="px-4 py-3 font-semibold text-right">Último Plano</th>
                <th className="px-4 py-3 font-semibold text-center w-24">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
              {formadoresRanking.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-10 text-center text-slate-400 text-xs">
                    Nenhum formador encontrado para os filtros selecionados.
                  </td>
                </tr>
              ) : (
                formadoresRanking.map((f, idx) => {
                  const isExpanded = expandedUser === f.nome;
                  return (
                    <React.Fragment key={f.nome}>
                      <tr
                        onClick={() => toggleUserRow(f.nome)}
                        className={`hover:bg-slate-50 dark:hover:bg-slate-700/30 cursor-pointer transition-colors ${
                          isExpanded ? 'bg-sky-50/50 dark:bg-sky-950/20' : ''
                        }`}
                        role="button"
                        aria-expanded={isExpanded}
                      >
                        <td className="px-4 py-3.5 text-center font-mono text-xs text-slate-400">
                          {idx + 1}
                        </td>
                        <td className="px-4 py-3.5 font-bold text-slate-900 dark:text-white">
                          {f.nome}
                        </td>
                        <td
                          className="px-4 py-3.5 text-xs text-slate-600 dark:text-slate-300 truncate max-w-[180px]"
                          title={f.unidade}
                        >
                          {cleanUnitName(f.unidade)}
                        </td>
                        <td className="px-4 py-3.5 text-center">
                          <span className="bg-[#005BAC]/10 text-[#005BAC] dark:bg-sky-950/60 dark:text-sky-300 px-2.5 py-1 rounded-full text-xs font-black">
                            {f.total}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 hidden md:table-cell">
                          <div className="flex flex-wrap gap-1 max-w-[200px]">
                            {f.modalidades.map((m) => {
                              const col = MODALIDADE_COLOR_MAP[m] || DEFAULT_MODALIDADE_COLOR;
                              return (
                                <span
                                  key={m}
                                  className={`px-1.5 py-0.5 text-[9px] font-bold rounded-md border ${col.badge}`}
                                >
                                  {m.replace('Imersão para ', '').replace('Formação de ', '')}
                                </span>
                              );
                            })}
                          </div>
                        </td>
                        <td className="px-4 py-3.5 hidden lg:table-cell">
                          <div className="flex flex-wrap gap-1 max-w-[180px]">
                            {f.temas.map((t) => (
                              <span
                                key={t}
                                className="px-1.5 py-0.5 text-[9px] font-medium rounded-md bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300"
                              >
                                {t}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="px-4 py-3.5 text-right text-xs whitespace-nowrap font-mono text-slate-500 dark:text-slate-400">
                          {f.lastDate && !isNaN(f.lastDate.getTime())
                            ? f.lastDate.toLocaleDateString('pt-BR')
                            : '—'}
                        </td>
                        <td className="px-4 py-3.5 text-center">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleUserRow(f.nome);
                            }}
                            className="px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 flex items-center justify-center gap-1 mx-auto transition-colors"
                          >
                            <span>{isExpanded ? 'Ocultar' : 'Ver'}</span>
                            {isExpanded ? (
                              <ChevronUp className="w-3.5 h-3.5" />
                            ) : (
                              <ChevronDown className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </td>
                      </tr>

                      {/* Linha Expandida: Cards dos Planos */}
                      {isExpanded && (
                        <tr>
                          <td
                            colSpan={8}
                            className="p-4 bg-slate-50/80 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700"
                          >
                            <div className="space-y-2">
                              <div className="flex items-center justify-between text-xs font-bold text-slate-600 dark:text-slate-400">
                                <span>Planos cadastrados por {f.nome} ({f.plans.length}):</span>
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-96 overflow-y-auto pr-1">
                                {f.plans.map((p) => {
                                  const col =
                                    MODALIDADE_COLOR_MAP[p.modalidade] ||
                                    DEFAULT_MODALIDADE_COLOR;
                                  return (
                                    <div
                                      key={p.id}
                                      className="p-3.5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs space-y-2"
                                    >
                                      <div className="flex items-start justify-between gap-2">
                                        <h4
                                          className="text-xs font-bold text-slate-900 dark:text-white line-clamp-2"
                                          title={p.tituloSuporte}
                                        >
                                          {p.tituloSuporte || 'Plano de Sessão sem Título'}
                                        </h4>
                                        <span
                                          className={`px-2 py-0.5 text-[10px] font-black rounded-lg border uppercase shrink-0 ${col.badge}`}
                                        >
                                          {p.modalidade || 'Modalidade'}
                                        </span>
                                      </div>

                                      <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                                        <span className="px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 font-medium">
                                          💡 {p.temaImersao || 'Tema não informado'}
                                        </span>
                                        {p.tipoPrototipo && (
                                          <span className="px-2 py-0.5 rounded-md bg-purple-50 dark:bg-purple-950/40 text-purple-800 dark:text-purple-300 font-medium">
                                            ⚙️ {p.tipoPrototipo}
                                          </span>
                                        )}
                                        {p.cargaHorariaAulas && (
                                          <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium">
                                            ⏱️ {p.cargaHorariaAulas}
                                          </span>
                                        )}
                                      </div>

                                      {Array.isArray(p.odsAplicada) &&
                                        p.odsAplicada.length > 0 && (
                                          <div className="flex flex-wrap gap-1 pt-1">
                                            {p.odsAplicada.map((ods) => (
                                              <span
                                                key={ods}
                                                className="px-1.5 py-0.5 text-[9px] font-bold rounded-md bg-teal-50 dark:bg-teal-950/40 text-teal-800 dark:text-teal-300 border border-teal-200 dark:border-teal-800"
                                              >
                                                {ods}
                                              </span>
                                            ))}
                                          </div>
                                        )}

                                      <div className="flex items-center justify-between text-[10px] text-slate-400 dark:text-slate-500 pt-1 border-t border-slate-100 dark:border-slate-700">
                                        <span>
                                          Criado em:{' '}
                                          {p.createdAt
                                            ? new Date(p.createdAt).toLocaleDateString('pt-BR')
                                            : '—'}
                                        </span>
                                        <span className="truncate max-w-[150px]">
                                          {p.trilhaImersao || ''}
                                        </span>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── 7. TABELA DE UNIDADES CISEB (EXPANSÍVEL) ─────────────────────────── */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <h2 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
              Controle Geral por Unidade CISEB ({unidadesRanking.length})
            </h2>
          </div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400">
            Acompanhamento de engajamento e temáticas por polo
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
            <thead className="text-[11px] text-slate-500 dark:text-slate-400 uppercase bg-slate-50/80 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="px-4 py-3 font-semibold w-12 text-center">#</th>
                <th className="px-4 py-3 font-semibold">Unidade CISEB</th>
                <th className="px-4 py-3 font-semibold text-center">Planos</th>
                <th className="px-4 py-3 font-semibold text-center">Formadores Ativos</th>
                <th className="px-4 py-3 font-semibold hidden md:table-cell">Modalidade Predominante</th>
                <th className="px-4 py-3 font-semibold hidden lg:table-cell">Tema Mais Frequente</th>
                <th className="px-4 py-3 font-semibold text-center w-28">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
              {unidadesRanking.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-slate-400 text-xs">
                    Nenhuma unidade encontrada para os filtros selecionados.
                  </td>
                </tr>
              ) : (
                unidadesRanking.map((u, idx) => {
                  const isExpanded = expandedUnit === u.unidade;
                  return (
                    <React.Fragment key={u.unidade}>
                      <tr
                        onClick={() => toggleUnitRow(u.unidade)}
                        className={`hover:bg-slate-50 dark:hover:bg-slate-700/30 cursor-pointer transition-colors ${
                          isExpanded ? 'bg-amber-50/50 dark:bg-amber-950/20' : ''
                        }`}
                        role="button"
                        aria-expanded={isExpanded}
                      >
                        <td className="px-4 py-3.5 text-center font-mono text-xs text-slate-400">
                          {idx + 1}
                        </td>
                        <td
                          className="px-4 py-3.5 font-bold text-slate-900 dark:text-white"
                          title={u.unidade}
                        >
                          {u.cleanName}
                        </td>
                        <td className="px-4 py-3.5 text-center">
                          <span className="bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 px-2.5 py-1 rounded-full text-xs font-black">
                            {u.total}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-center">
                          <span className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 px-2.5 py-1 rounded-full text-xs font-black">
                            {u.formadoresAtivosCount}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 hidden md:table-cell text-xs text-slate-700 dark:text-slate-300">
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700 text-xs font-medium">
                            {u.topMod}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 hidden lg:table-cell text-xs text-slate-700 dark:text-slate-300">
                          <span className="px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 text-xs font-medium">
                            {u.topTema}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-center">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleUnitRow(u.unidade);
                            }}
                            className="px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 flex items-center justify-center gap-1 mx-auto transition-colors"
                          >
                            <span>{isExpanded ? 'Ocultar' : 'Detalhes'}</span>
                            {isExpanded ? (
                              <ChevronUp className="w-3.5 h-3.5" />
                            ) : (
                              <ChevronDown className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </td>
                      </tr>

                      {/* Linha Expandida: Detalhes da Unidade */}
                      {isExpanded && (
                        <tr>
                          <td
                            colSpan={7}
                            className="p-4 bg-slate-50/80 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700"
                          >
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              
                              {/* Formadores na Unidade */}
                              <div className="p-3.5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
                                <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                                  <Users className="w-3.5 h-3.5 text-[#005BAC]" />
                                  <span>Formadores atuantes nesta unidade ({u.formadoresList.length}):</span>
                                </h4>
                                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                                  {u.formadoresList.map((f) => (
                                    <div
                                      key={f.nome}
                                      className="flex items-center justify-between text-xs py-1 px-2 rounded-lg bg-slate-50 dark:bg-slate-900/40"
                                    >
                                      <span className="font-medium text-slate-800 dark:text-slate-200">
                                        {f.nome}
                                      </span>
                                      <span className="font-black text-[#005BAC] dark:text-sky-400">
                                        {f.count} plano{f.count !== 1 ? 's' : ''}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              {/* Distribuição de Modalidades na Unidade */}
                              <div className="p-3.5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
                                <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                                  <BookOpen className="w-3.5 h-3.5 text-blue-600" />
                                  <span>Modalidades aplicadas nesta unidade:</span>
                                </h4>
                                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                                  {Object.entries(u.modalidadesDist).map(([mod, cnt]) => {
                                    const pct = Math.round((cnt / u.total) * 100);
                                    const col =
                                      MODALIDADE_COLOR_MAP[mod] || DEFAULT_MODALIDADE_COLOR;
                                    return (
                                      <div key={mod} className="space-y-1">
                                        <div className="flex items-center justify-between text-[11px]">
                                          <span className="text-slate-700 dark:text-slate-300 font-medium">
                                            {mod}
                                          </span>
                                          <span className="font-bold text-slate-500">
                                            {cnt} ({pct}%)
                                          </span>
                                        </div>
                                        <div className="w-full bg-slate-100 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                                          <div
                                            className={`h-full rounded-full ${col.bar}`}
                                            style={{ width: `${pct}%` }}
                                          />
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>

                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── 8. PAINEL DE TRILHAS DE IMERSÃO ────────────────────────────────── */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-rose-50 dark:bg-rose-950/40 flex items-center justify-center text-rose-600 dark:text-rose-400">
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                Painel de Trilhas Temáticas de Imersão
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Engajamento por vertente de aprendizagem socioambiental e cidadã
              </p>
            </div>
          </div>

          {trilhasStats.topTrilha && (
            <div className="flex items-center gap-1.5 px-3 py-1 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 rounded-xl text-rose-800 dark:text-rose-300 text-xs font-bold shrink-0">
              <Flame className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
              <span>Trilha Mais Ativa: {trilhasStats.topTrilha}</span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {trilhasStats.list.map((trilha) => {
            const isTop = trilha.nome === trilhasStats.topTrilha && trilha.total > 0;
            return (
              <div
                key={trilha.nome}
                className={`p-4 rounded-2xl border transition-all flex flex-col justify-between ${
                  isTop
                    ? 'bg-rose-50/60 dark:bg-rose-950/30 border-rose-300 dark:border-rose-700 shadow-xs'
                    : 'bg-slate-50/60 dark:bg-slate-900/40 border-slate-200 dark:border-slate-700'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h4 className="text-xs font-black text-slate-900 dark:text-white">
                      {trilha.nome}
                    </h4>
                    <span className="px-2 py-0.5 rounded-full text-xs font-black bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 shrink-0">
                      {trilha.total} plano{trilha.total !== 1 ? 's' : ''}
                    </span>
                  </div>

                  <div className="space-y-1 text-[11px] text-slate-600 dark:text-slate-300 mt-2">
                    <div className="flex items-center gap-1">
                      <Building2 className="w-3 h-3 text-slate-400 shrink-0" />
                      <span>
                        <strong>{trilha.unidades.length}</strong> unidade{trilha.unidades.length !== 1 ? 's' : ''} participante{trilha.unidades.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="w-3 h-3 text-slate-400 shrink-0" />
                      <span>
                        <strong>{trilha.formadores.length}</strong> formador{trilha.formadores.length !== 1 ? 'es' : ''} envolvido{trilha.formadores.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>
                </div>

                {trilha.unidades.length > 0 && (
                  <div className="mt-3 pt-2 border-t border-slate-200/60 dark:border-slate-700/60 flex flex-wrap gap-1">
                    {trilha.unidades.slice(0, 3).map((u) => (
                      <span
                        key={u}
                        className="px-1.5 py-0.5 text-[9px] font-medium rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 truncate max-w-[150px]"
                        title={u}
                      >
                        {cleanUnitName(u)}
                      </span>
                    ))}
                    {trilha.unidades.length > 3 && (
                      <span className="px-1.5 py-0.5 text-[9px] font-bold rounded bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                        +{trilha.unidades.length - 3}
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ─── 9. RODAPÉ DO DASHBOARD ─────────────────────────────────────────── */}
      <footer className="pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
        <div className="flex flex-wrap items-center gap-2">
          <span>Última atualização: <strong className="text-slate-700 dark:text-slate-300">{currentTimeFormatted}</strong></span>
          <span>•</span>
          <span>Base ativa: <strong className="text-slate-700 dark:text-slate-300">{rawPlans.length} planos</strong></span>
          {kpis.totalHours > 0 && (
            <>
              <span>•</span>
              <span>Horas planejadas: <strong className="text-slate-700 dark:text-slate-300">{kpis.totalHours}h</strong></span>
            </>
          )}
        </div>

        <div className="flex items-center gap-1.5 text-[11px] text-amber-600 dark:text-amber-400 font-medium">
          <Clock className="w-3.5 h-3.5 shrink-0" />
          <span>Planos expiram após 7 dias de inatividade no sistema.</span>
        </div>
      </footer>

    </div>
  );
};
