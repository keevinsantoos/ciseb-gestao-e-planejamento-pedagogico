import React from 'react';
import {
  Building2,
  BookMarked,
  Cpu,
  Compass,
  Wrench,
  Check,
  ChevronRight,
} from 'lucide-react';

export interface FormStepItem {
  id: number;
  sectionId: string;
  title: string;
  shortTitle: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  isComplete: boolean;
}

interface FormStepperProps {
  currentStep: number;
  onSelectStep: (stepNumber: number, sectionId: string) => void;
  steps: FormStepItem[];
  completionPercentage: number;
}

export const FormStepper: React.FC<FormStepperProps> = ({
  currentStep,
  onSelectStep,
  steps,
  completionPercentage,
}) => {
  const currentStepData = steps.find((s) => s.id === currentStep) || steps[0];

  return (
    <div className="sticky top-[73px] sm:top-[81px] z-20 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200/90 dark:border-slate-800 rounded-2xl p-3 sm:p-4 shadow-sm transition-all">
      {/* Top row: Context header with Stage Counter and Progress */}
      <div className="flex items-center justify-between gap-3 pb-2.5 mb-2.5 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-[#005BAC] dark:text-sky-300 text-xs font-bold shrink-0 border border-blue-100 dark:border-blue-900/50">
            <span>Etapa {currentStep} de 5</span>
          </div>
          <span className="flex-1 text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100 truncate min-w-0">
            {currentStepData.title}
          </span>
        </div>

        {/* Global Progress indicator */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="hidden sm:flex flex-col items-end">
            <span className="text-[10px] uppercase font-semibold text-slate-400 dark:text-slate-400">
              Progresso
            </span>
            <span className="text-xs font-bold text-[#16a34a] dark:text-emerald-400">
              {completionPercentage}% Concluído
            </span>
          </div>
          <div className="w-16 sm:w-24 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden border border-slate-200 dark:border-slate-700">
            <div
              className="h-full bg-gradient-to-r from-[#005BAC] via-[#0284c7] to-[#78BC61] rounded-full transition-all duration-500 ease-out"
              style={{ width: `${Math.min(100, Math.max(4, completionPercentage))}%` }}
            />
          </div>
        </div>
      </div>

      {/* Main 5-Stage Stepper: 1 ───── 2 ───── 3 ───── 4 ───── 5 */}
      <nav aria-label="Progresso das etapas do formulário" className="w-full overflow-hidden">
        <ol className="flex flex-nowrap sm:grid sm:grid-cols-5 gap-1 sm:gap-2 items-center overflow-x-auto pb-2 sm:pb-0 snap-x [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {steps.map((step, index) => {
            const isCurrent = currentStep === step.id;
            const isCompleted = step.isComplete;
            const isPast = step.id < currentStep;

            return (
              <li key={step.id} className="relative flex-none w-[72px] sm:w-auto snap-center">
                {/* Connecting Line to next step */}
                {index < steps.length - 1 && (
                  <div
                    aria-hidden="true"
                    className="absolute top-4 sm:top-5 left-[50%] w-full h-[2px] -z-0 pointer-events-none transition-colors duration-300"
                    style={{
                      backgroundColor:
                        isCompleted && steps[index + 1]?.isComplete
                          ? '#16a34a'
                          : isPast
                          ? '#005BAC'
                          : '#e2e8f0',
                    }}
                  />
                )}

                {/* Step Button */}
                <button
                  type="button"
                  onClick={() => onSelectStep(step.id, step.sectionId)}
                  className={`group relative z-10 w-full flex flex-col items-center text-center p-1 sm:p-2 rounded-xl transition-all duration-200 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#005BAC] ${
                    isCurrent
                      ? 'bg-blue-50/80 dark:bg-blue-950/40'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800/60'
                  }`}
                  aria-current={isCurrent ? 'step' : undefined}
                  title={`Ir para Etapa ${step.id}: ${step.title}`}
                >
                  {/* Step Circle / Badge */}
                  <div
                    className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                      isCompleted
                        ? 'bg-[#16a34a] text-white shadow-xs'
                        : isCurrent
                        ? 'bg-[#005BAC] text-white ring-4 ring-[#005BAC]/20 shadow-md scale-105'
                        : 'bg-white dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-700 text-slate-500 dark:text-slate-400 group-hover:border-slate-400'
                    }`}
                  >
                    {isCompleted ? (
                      <Check className="w-4 h-4 stroke-[3]" />
                    ) : (
                      <span>{step.id}</span>
                    )}
                  </div>

                  {/* Step Title */}
                  <div className="mt-1.5 hidden sm:flex flex-col items-center">
                    <span
                      className={`text-[11px] leading-tight font-bold transition-colors line-clamp-1 ${
                        isCurrent
                          ? 'text-[#005BAC] dark:text-sky-300'
                          : isCompleted
                          ? 'text-[#16a34a] dark:text-emerald-400'
                          : 'text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {step.shortTitle}
                    </span>
                    <span className="text-[9px] text-slate-400 dark:text-slate-400 font-medium">
                      {isCompleted ? 'Concluído' : isCurrent ? 'Em edição' : 'Pendente'}
                    </span>
                  </div>

                  {/* Mobile compact title */}
                  <span
                    className={`sm:hidden text-[9px] font-bold mt-1 truncate max-w-full ${
                      isCurrent
                        ? 'text-[#005BAC] dark:text-sky-300'
                        : 'text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    {step.shortTitle.split(' ')[0]}
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
      </nav>
    </div>
  );
};
