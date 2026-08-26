import React from 'react';
import { validatePasswordStrength } from '../../data/cisebAccounts';
import { Check, X, ShieldAlert, ShieldCheck } from 'lucide-react';

interface PasswordStrengthMeterProps {
  password: string;
  showDetails?: boolean;
}

export const PasswordStrengthMeter: React.FC<PasswordStrengthMeterProps> = ({
  password,
  showDetails = true,
}) => {
  const result = validatePasswordStrength(password);

  if (!password) {
    return (
      <div className="text-[11px] text-slate-600 dark:text-slate-400 mt-1.5 flex items-center gap-1.5">
        <ShieldAlert className="w-3.5 h-3.5 text-slate-500" />
        <span>Exige 10+ caracteres, maiúsculas, minúsculas, números e símbolos.</span>
      </div>
    );
  }

  // Calculate width percentage based on score 0-5
  const widthPercent = (result.score / 5) * 100;

  // Determine bar color
  let barColor = 'bg-red-500';
  let statusText = 'Senha Fraca';
  let textColor = 'text-red-600 dark:text-red-400';

  if (result.score >= 5) {
    barColor = 'bg-emerald-500';
    statusText = 'Excelente / Segura';
    textColor = 'text-emerald-600 dark:text-emerald-400';
  } else if (result.score >= 3) {
    barColor = 'bg-amber-500';
    statusText = 'Média / Incompleta';
    textColor = 'text-amber-600 dark:text-amber-400';
  }

  return (
    <div className="space-y-2 mt-2 animate-in fade-in">
      {/* Progress Bar Header */}
      <div className="flex items-center justify-between text-[11px]">
        <span className="font-bold text-slate-700 dark:text-slate-300">
          Segurança da Senha:
        </span>
        <span className={`font-black uppercase tracking-wider text-[10px] ${textColor}`}>
          {statusText}
        </span>
      </div>

      {/* Progress Bar Track */}
      <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
        <div
          className={`h-full transition-all duration-300 ${barColor}`}
          style={{ width: `${widthPercent}%` }}
        />
      </div>

      {/* Checklist details */}
      {showDetails && (
        <div className="grid grid-cols-2 gap-x-2 gap-y-1 pt-1 text-[10px]">
          <div
            className={`flex items-center gap-1.5 transition-colors ${
              result.hasMinLength
                ? 'text-emerald-700 dark:text-emerald-400 font-semibold'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            {result.hasMinLength ? (
              <Check className="w-3 h-3 text-emerald-600 shrink-0" />
            ) : (
              <X className="w-3 h-3 text-slate-500 shrink-0" />
            )}
            <span>10+ caracteres</span>
          </div>

          <div
            className={`flex items-center gap-1.5 transition-colors ${
              result.hasUpperCase
                ? 'text-emerald-700 dark:text-emerald-400 font-semibold'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            {result.hasUpperCase ? (
              <Check className="w-3 h-3 text-emerald-600 shrink-0" />
            ) : (
              <X className="w-3 h-3 text-slate-500 shrink-0" />
            )}
            <span>Maiúscula (A-Z)</span>
          </div>

          <div
            className={`flex items-center gap-1.5 transition-colors ${
              result.hasLowerCase
                ? 'text-emerald-700 dark:text-emerald-400 font-semibold'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            {result.hasLowerCase ? (
              <Check className="w-3 h-3 text-emerald-600 shrink-0" />
            ) : (
              <X className="w-3 h-3 text-slate-500 shrink-0" />
            )}
            <span>Minúscula (a-z)</span>
          </div>

          <div
            className={`flex items-center gap-1.5 transition-colors ${
              result.hasNumber
                ? 'text-emerald-700 dark:text-emerald-400 font-semibold'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            {result.hasNumber ? (
              <Check className="w-3 h-3 text-emerald-600 shrink-0" />
            ) : (
              <X className="w-3 h-3 text-slate-500 shrink-0" />
            )}
            <span>Número (0-9)</span>
          </div>

          <div
            className={`col-span-2 flex items-center gap-1.5 transition-colors ${
              result.hasSpecialChar
                ? 'text-emerald-700 dark:text-emerald-400 font-semibold'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            {result.hasSpecialChar ? (
              <Check className="w-3 h-3 text-emerald-600 shrink-0" />
            ) : (
              <X className="w-3 h-3 text-slate-500 shrink-0" />
            )}
            <span>Símbolo especial (!@#$%^&*...)</span>
          </div>
        </div>
      )}
    </div>
  );
};
