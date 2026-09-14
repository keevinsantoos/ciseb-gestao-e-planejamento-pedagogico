import React from 'react';
import { cn } from '../../lib/utils';

export interface BgAnimateButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  animation?: 'spin-fast' | 'spin' | 'spin-slow' | 'pulse' | 'none';
  gradient?: 'ocean' | 'forest' | 'default' | 'sunset' | 'emerald' | 'amber';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

const GRADIENT_MAP = {
  ocean: 'from-sky-400 via-[#005BAC] to-blue-600',
  forest: 'from-emerald-400 via-teal-500 to-green-600',
  default: 'from-indigo-500 via-purple-500 to-pink-500',
  sunset: 'from-amber-400 via-rose-500 to-orange-600',
  emerald: 'from-teal-300 via-emerald-500 to-cyan-600',
  amber: 'from-yellow-300 via-amber-500 to-orange-500',
};

const ANIMATION_MAP = {
  'spin-fast': 'animate-[spin_2s_linear_infinite]',
  spin: 'animate-[spin_4s_linear_infinite]',
  'spin-slow': 'animate-[spin_8s_linear_infinite]',
  pulse: 'animate-pulse',
  none: '',
};

export const BgAnimateButton: React.FC<BgAnimateButtonProps> = ({
  animation = 'spin',
  gradient = 'ocean',
  size = 'md',
  className,
  children,
  disabled,
  ...props
}) => {
  const sizeClasses = {
    sm: 'px-2.5 py-1 text-xs',
    md: 'px-3 py-1.5 text-xs',
    lg: 'px-4 py-2 text-sm',
  }[size];

  return (
    <button
      {...props}
      disabled={disabled}
      className={cn(
        'relative inline-flex items-center justify-center p-[1.5px] overflow-hidden rounded-xl font-bold uppercase transition-all duration-200 cursor-pointer group active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed disabled:active:scale-100 shadow-sm',
        className
      )}
    >
      {/* Animated Gradient Background Border */}
      <span
        className={cn(
          'absolute inset-[-1000%] bg-[conic-gradient(from_90deg_at_50%_50%,#005BAC_0%,#38bdf8_50%,#005BAC_100%)] opacity-80 group-hover:opacity-100 transition-opacity',
          `bg-gradient-to-r ${GRADIENT_MAP[gradient]}`,
          ANIMATION_MAP[animation]
        )}
      />

      {/* Button Content Surface */}
      <span
        className={cn(
          'relative inline-flex items-center gap-1.5 rounded-[10px] bg-slate-900/90 text-white backdrop-blur-md transition-all group-hover:bg-slate-900/75',
          sizeClasses
        )}
      >
        {children}
      </span>
    </button>
  );
};
