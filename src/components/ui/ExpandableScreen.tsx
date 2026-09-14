import React, {
  createContext,
  useContext,
  useId,
  useRef,
  useState,
  useEffect,
  useCallback,
} from 'react';

// ─── CONTEXTO ────────────────────────────────────────────────────────────────
interface ExpandableScreenContextValue {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  layoutId: string;
  triggerRadius: string;
  contentRadius: string;
  triggerRef: React.RefObject<HTMLDivElement | null>;
}

const ExpandableScreenContext = createContext<ExpandableScreenContextValue | null>(null);

export function useExpandableScreen() {
  const ctx = useContext(ExpandableScreenContext);
  if (!ctx) {
    throw new Error('useExpandableScreen must be used inside <ExpandableScreen>');
  }
  return ctx;
}

// ─── TIPOS ───────────────────────────────────────────────────────────────────
interface ExpandableScreenProps {
  children: React.ReactNode;
  layoutId?: string;
  triggerRadius?: string;
  contentRadius?: string;
}

// ─── COMPONENTE PRINCIPAL ────────────────────────────────────────────────────
export function ExpandableScreen({
  children,
  layoutId,
  triggerRadius = '100px',
  contentRadius = '0px',
}: ExpandableScreenProps) {
  const generatedId = useId();
  const id = layoutId || generatedId;
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLDivElement | null>(null);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);

  // Fechar com ESC
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        close();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, close]);

  // Travar scroll da página quando o painel estiver aberto
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  return (
    <ExpandableScreenContext.Provider
      value={{
        isOpen,
        open,
        close,
        layoutId: id,
        triggerRadius,
        contentRadius,
        triggerRef,
      }}
    >
      <div className="relative">
        {children}
      </div>
    </ExpandableScreenContext.Provider>
  );
}

// ─── TRIGGER ─────────────────────────────────────────────────────────────────
interface ExpandableScreenTriggerProps {
  children: React.ReactNode;
  className?: string;
}

export function ExpandableScreenTrigger({
  children,
  className,
}: ExpandableScreenTriggerProps) {
  const { open, triggerRef, triggerRadius } = useExpandableScreen();

  return (
    <div
      ref={triggerRef}
      onClick={open}
      className={`cursor-pointer overflow-hidden transition-transform active:scale-95 ${
        className || ''
      }`}
      style={{ borderRadius: triggerRadius }}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          open();
        }
      }}
    >
      {children}
    </div>
  );
}

// ─── CONTENT (overlay expandido) ─────────────────────────────────────────────
interface ExpandableScreenContentProps {
  children: React.ReactNode;
  className?: string;
}

export function ExpandableScreenContent({
  children,
  className,
}: ExpandableScreenContentProps) {
  const { isOpen, close, contentRadius } = useExpandableScreen();

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={close}
        className={`fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        aria-hidden="true"
      />

      {/* Painel expandido */}
      <div
        className={`fixed z-50 w-full min-h-[100dvh] overflow-y-auto overflow-x-hidden transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${
          isOpen
            ? 'inset-0 opacity-100 scale-100 pointer-events-auto'
            : 'inset-0 opacity-0 scale-95 pointer-events-none'
        } ${className || ''}`}
        style={{
          borderRadius: isOpen ? contentRadius : '0px',
        }}
        role="dialog"
        aria-modal="true"
      >
        {/* Botão fechar */}
        <button
          onClick={close}
          className="absolute top-4 right-4 z-50 w-9 h-9 rounded-full bg-slate-900/10 hover:bg-slate-900/20 text-slate-700 dark:text-slate-200 dark:bg-white/10 dark:hover:bg-white/20 lg:text-white lg:bg-white/15 lg:hover:bg-white/25 backdrop-blur-md flex items-center justify-center transition-all cursor-pointer shadow-sm hover:scale-105 active:scale-95"
          aria-label="Fechar e voltar à tela inicial"
          title="Fechar"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path
              d="M1 1l12 12M13 1L1 13"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </button>

        {children}
      </div>
    </>
  );
}
