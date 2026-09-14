import React, { createContext, useContext, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { X, ChevronLeft } from 'lucide-react';
import { cn } from '../../lib/utils';

export type ViewsRegistry = Record<
  string,
  React.ReactNode | React.ComponentType<any> | { title?: string; description?: string; component: React.ReactNode | React.ComponentType<any> }
>;

interface FamilyDrawerContextType {
  view: string;
  setView: (nextView: string) => void;
  goBack: () => void;
  canGoBack: boolean;
  history: string[];
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  direction: number;
  data: any;
  setData: React.Dispatch<React.SetStateAction<any>>;
  views?: ViewsRegistry;
}

const FamilyDrawerContext = createContext<FamilyDrawerContextType | null>(null);

export function useFamilyDrawer() {
  const context = useContext(FamilyDrawerContext);
  if (!context) {
    throw new Error('useFamilyDrawer must be used within a FamilyDrawerRoot');
  }
  return context;
}

export interface FamilyDrawerRootProps {
  defaultView?: string;
  views?: ViewsRegistry;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  initialData?: any;
  children: React.ReactNode;
}

export function FamilyDrawerRoot({
  defaultView = 'root',
  views,
  isOpen: controlledIsOpen,
  onOpenChange,
  initialData = {},
  children,
}: FamilyDrawerRootProps) {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const isControlled = controlledIsOpen !== undefined;
  const isOpen = isControlled ? controlledIsOpen : internalIsOpen;

  const [view, setViewState] = useState(defaultView);
  const [history, setHistory] = useState<string[]>([defaultView]);
  const [direction, setDirection] = useState(1);
  const [data, setData] = useState<any>(initialData);

  // Reset to defaultView when drawer opens
  useEffect(() => {
    if (isOpen) {
      setViewState(defaultView);
      setHistory([defaultView]);
      setDirection(1);
    }
  }, [isOpen, defaultView]);

  const setIsOpen = React.useCallback(
    (nextOpen: boolean) => {
      if (!isControlled) {
        setInternalIsOpen(nextOpen);
      }
      onOpenChange?.(nextOpen);
    },
    [isControlled, onOpenChange]
  );

  const setView = React.useCallback(
    (nextView: string) => {
      setDirection(1);
      setHistory((prev) => [...prev, nextView]);
      setViewState(nextView);
    },
    []
  );

  const goBack = React.useCallback(() => {
    if (history.length > 1) {
      setDirection(-1);
      const newHistory = [...history];
      newHistory.pop();
      const prevView = newHistory[newHistory.length - 1];
      setHistory(newHistory);
      setViewState(prevView);
    }
  }, [history]);

  const canGoBack = history.length > 1;

  return (
    <FamilyDrawerContext.Provider
      value={{
        view,
        setView,
        goBack,
        canGoBack,
        history,
        isOpen,
        setIsOpen,
        direction,
        data,
        setData,
        views,
      }}
    >
      {children}
    </FamilyDrawerContext.Provider>
  );
}

export interface FamilyDrawerTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  className?: string;
}

export function FamilyDrawerTrigger({ children, className, onClick, ...props }: FamilyDrawerTriggerProps) {
  const { setIsOpen } = useFamilyDrawer();
  return (
    <button
      type="button"
      onClick={(e) => {
        onClick?.(e);
        setIsOpen(true);
      }}
      className={className}
      {...props}
    >
      {children}
    </button>
  );
}

export interface FamilyDrawerPortalProps {
  children: React.ReactNode;
}

export function FamilyDrawerPortal({ children }: FamilyDrawerPortalProps) {
  const { isOpen } = useFamilyDrawer();
  if (!isOpen) return null;
  return typeof document !== 'undefined' ? createPortal(children, document.body) : null;
}

export interface FamilyDrawerOverlayProps {
  className?: string;
}

export function FamilyDrawerOverlay({ className }: FamilyDrawerOverlayProps) {
  const { setIsOpen } = useFamilyDrawer();
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      onClick={() => setIsOpen(false)}
      className={cn('fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs', className)}
    />
  );
}

export interface FamilyDrawerContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
}

export function FamilyDrawerContent({ children, className, ...props }: FamilyDrawerContentProps) {
  const { setIsOpen } = useFamilyDrawer();

  // Handle ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setIsOpen]);

  return (
    <div className="fixed inset-0 z-50 pointer-events-none flex items-end sm:items-center justify-center p-0 sm:p-4">
      <motion.div
        initial={{ y: 80, opacity: 0, scale: 0.96 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 80, opacity: 0, scale: 0.96 }}
        transition={{ type: 'spring', stiffness: 350, damping: 30 }}
        className={cn(
          'pointer-events-auto w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl rounded-t-3xl sm:rounded-3xl overflow-hidden flex flex-col max-h-[92vh]',
          className
        )}
        {...(props as any)}
      >
        {/* Drag Pill Handle */}
        <div className="w-full flex items-center justify-center pt-3 pb-1 sm:hidden">
          <div className="w-12 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700" />
        </div>
        {children}
      </motion.div>
    </div>
  );
}

export interface FamilyDrawerCloseProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  className?: string;
  children?: React.ReactNode;
}

export function FamilyDrawerClose({ className, children, onClick, ...props }: FamilyDrawerCloseProps) {
  const { setIsOpen } = useFamilyDrawer();
  return (
    <button
      type="button"
      onClick={(e) => {
        onClick?.(e);
        setIsOpen(false);
      }}
      className={cn(
        'p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer',
        className
      )}
      {...props}
    >
      {children || <X className="w-4 h-4" />}
    </button>
  );
}

export function FamilyDrawerBack({ className }: { className?: string }) {
  const { goBack, canGoBack } = useFamilyDrawer();
  if (!canGoBack) return null;
  return (
    <button
      type="button"
      onClick={goBack}
      className={cn(
        'p-1.5 rounded-xl text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-1 text-xs font-semibold cursor-pointer',
        className
      )}
    >
      <ChevronLeft className="w-4 h-4" />
      <span>Voltar</span>
    </button>
  );
}

export function FamilyDrawerAnimatedWrapper({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('relative w-full overflow-hidden flex-1 flex flex-col', className)}>
      {children}
    </div>
  );
}

export function FamilyDrawerAnimatedContent({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const { view, direction } = useFamilyDrawer();

  return (
    <AnimatePresence mode="popLayout" custom={direction} initial={false}>
      <motion.div
        key={view}
        custom={direction}
        variants={{
          enter: (dir: number) => ({
            x: dir > 0 ? 40 : -40,
            opacity: 0,
          }),
          center: {
            x: 0,
            opacity: 1,
          },
          exit: (dir: number) => ({
            x: dir > 0 ? -40 : 40,
            opacity: 0,
          }),
        }}
        initial="enter"
        animate="center"
        exit="exit"
        transition={{ type: 'spring', stiffness: 380, damping: 32 }}
        className={cn('w-full flex-1 flex flex-col', className)}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

export function FamilyDrawerViewContent() {
  const { view, views, data, setData, setView, goBack, setIsOpen } = useFamilyDrawer();

  if (!views || !views[view]) {
    return <div className="p-6 text-center text-slate-500 text-sm">Etapa não encontrada: {view}</div>;
  }

  const current = views[view];

  if (React.isValidElement(current)) {
    return current;
  }

  if (typeof current === 'function') {
    const Component = current as React.ComponentType<any>;
    return <Component data={data} setData={setData} setView={setView} goBack={goBack} setIsOpen={setIsOpen} />;
  }

  if (typeof current === 'object' && 'component' in current) {
    const ComponentOrEl = (current as any).component;
    if (React.isValidElement(ComponentOrEl)) {
      return ComponentOrEl;
    }
    if (typeof ComponentOrEl === 'function') {
      const Comp = ComponentOrEl as React.ComponentType<any>;
      return <Comp data={data} setData={setData} setView={setView} goBack={goBack} setIsOpen={setIsOpen} />;
    }
  }

  return null;
}
