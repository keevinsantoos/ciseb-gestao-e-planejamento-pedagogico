import React, { useEffect, useRef } from 'react';
import { X, Info } from 'lucide-react';

interface DevelopmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
}

export const DevelopmentModal: React.FC<DevelopmentModalProps> = ({
  isOpen,
  onClose,
  title,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // Focus modal for accessibility
      setTimeout(() => {
        modalRef.current?.focus();
      }, 100);
    }
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div 
        ref={modalRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="dev-modal-title"
        className="relative bg-white dark:bg-slate-800 rounded-2xl w-full max-w-md shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden outline-none animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Header styling with brand gradient */}
        <div className="h-2 w-full bg-gradient-to-r from-[#005BAC] to-sky-400" />
        
        <div className="p-6 sm:p-8">
          <button
            onClick={onClose}
            className="absolute top-6 right-6 p-2 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <Info className="w-6 h-6" />
            </div>
            <h2 id="dev-modal-title" className="text-xl font-black text-slate-900 dark:text-white">
              {title}
            </h2>
          </div>

          <p className="text-slate-600 dark:text-slate-300 leading-relaxed mb-8">
            Esta ferramenta está em desenvolvimento e estará disponível em breve. Estamos trabalhando para trazer mais recursos pedagógicos para a plataforma CISEB.
          </p>

          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-xl font-bold uppercase tracking-wide text-sm transition-colors cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
            >
              Entendi
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
