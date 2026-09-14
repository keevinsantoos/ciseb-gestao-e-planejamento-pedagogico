import React from 'react';
import { LucideIcon } from 'lucide-react';

interface ToolCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  status: 'available' | 'development';
  onClick: () => void;
}

export const ToolCard: React.FC<ToolCardProps> = ({
  title,
  description,
  icon: Icon,
  status,
  onClick,
}) => {
  const isAvailable = status === 'available';

  return (
    <button
      onClick={onClick}
      className={`group relative flex flex-col items-start p-6 rounded-2xl border text-left transition-all duration-300 overflow-hidden outline-none focus-visible:ring-4 focus-visible:ring-sky-500/50 cursor-pointer w-full
        ${
          isAvailable
            ? 'bg-white dark:bg-slate-800 border-sky-100 dark:border-slate-700 hover:border-sky-300 dark:hover:border-sky-500 shadow-sm hover:shadow-xl hover:shadow-sky-900/5 hover:-translate-y-1'
            : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 shadow-sm hover:shadow-md'
        }
      `}
      aria-label={`${title}. Status: ${isAvailable ? 'Disponível' : 'Em desenvolvimento'}. Clique para acessar.`}
    >
      {/* Glossy gradient effect on hover for available items */}
      {isAvailable && (
        <div className="absolute inset-0 bg-gradient-to-br from-sky-50 to-white dark:from-slate-700 dark:to-slate-800 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
      )}

      {/* Header section with Icon & Badge */}
      <div className="w-full flex items-start justify-between mb-6 relative z-10">
        <div
          className={`p-3 rounded-xl transition-colors duration-300 ${
            isAvailable
              ? 'bg-sky-100 dark:bg-slate-700 text-[#005BAC] dark:text-sky-400 group-hover:bg-[#005BAC] group-hover:text-white'
              : 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
          }`}
        >
          <Icon className="w-6 h-6" />
        </div>
        
        <span
          className={`px-3 py-1 text-[10px] font-bold tracking-widest uppercase rounded-full border ${
            isAvailable
              ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/50'
              : 'bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800/50'
          }`}
        >
          {isAvailable ? 'Disponível' : 'Em desenvolvimento'}
        </span>
      </div>

      {/* Content section */}
      <div className="relative z-10 w-full">
        <h3
          className={`text-lg font-black mb-2 transition-colors ${
            isAvailable
              ? 'text-slate-900 dark:text-white group-hover:text-[#005BAC] dark:group-hover:text-sky-300'
              : 'text-slate-700 dark:text-slate-300'
          }`}
        >
          {title}
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed min-h-[40px]">
          {description}
        </p>
      </div>

      {/* Footer action indicator */}
      <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-700/50 w-full relative z-10 flex items-center justify-between">
        <span
          className={`text-xs font-bold uppercase tracking-wider transition-colors ${
            isAvailable
              ? 'text-[#005BAC] dark:text-sky-400 group-hover:text-[#004e96]'
              : 'text-slate-400 dark:text-slate-500'
          }`}
        >
          {isAvailable ? 'Acessar ferramenta' : 'Saiba mais'}
        </span>
        <div
          className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${
            isAvailable
              ? 'bg-sky-50 dark:bg-slate-700 text-[#005BAC] dark:text-sky-300 group-hover:bg-[#005BAC] group-hover:text-white group-hover:scale-110'
              : 'bg-slate-100 dark:bg-slate-700 text-slate-400 dark:text-slate-500'
          }`}
        >
          <span className="text-sm leading-none block transform group-hover:translate-x-0.5 transition-transform">
            &rarr;
          </span>
        </div>
      </div>
    </button>
  );
};
