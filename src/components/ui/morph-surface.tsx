import React, { createContext, useContext, useId } from 'react';
import { motion, AnimatePresence, Transition } from 'motion/react';
import { cn } from '../../lib/utils';

interface MorphSurfaceContextType {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  toggle: () => void;
  layoutId: string;
}

const MorphSurfaceContext = createContext<MorphSurfaceContextType | null>(null);

export function useMorphSurface() {
  const context = useContext(MorphSurfaceContext);
  if (!context) {
    throw new Error('useMorphSurface must be used within a MorphSurface');
  }
  return context;
}

const defaultTransition: Transition = {
  type: 'spring',
  stiffness: 400,
  damping: 30,
};

export interface MorphSurfaceProps extends React.HTMLAttributes<HTMLDivElement> {
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
  className?: string;
  layoutId?: string;
}

export function MorphSurface({
  isOpen: controlledIsOpen,
  onOpenChange,
  children,
  className,
  layoutId: customLayoutId,
  ...props
}: MorphSurfaceProps) {
  const [internalIsOpen, setInternalIsOpen] = React.useState(false);
  const autoId = useId();
  const layoutId = customLayoutId || `morph-surface-${autoId}`;

  const isControlled = controlledIsOpen !== undefined;
  const isOpen = isControlled ? controlledIsOpen : internalIsOpen;

  const setIsOpen = React.useCallback(
    (nextOpen: boolean) => {
      if (!isControlled) {
        setInternalIsOpen(nextOpen);
      }
      onOpenChange?.(nextOpen);
    },
    [isControlled, onOpenChange]
  );

  const toggle = React.useCallback(() => {
    setIsOpen(!isOpen);
  }, [isOpen, setIsOpen]);

  return (
    <MorphSurfaceContext.Provider value={{ isOpen, setIsOpen, toggle, layoutId }}>
      <div className={cn('relative inline-block', className)} {...props}>
        {children}
      </div>
    </MorphSurfaceContext.Provider>
  );
}

export interface MorphSurfaceTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  className?: string;
  asChild?: boolean;
}

export function MorphSurfaceTrigger({
  children,
  className,
  onClick,
  ...props
}: MorphSurfaceTriggerProps) {
  const { isOpen, toggle, layoutId } = useMorphSurface();

  if (isOpen) return null;

  return (
    <motion.button
      layoutId={layoutId}
      transition={defaultTransition}
      onClick={(e) => {
        onClick?.(e);
        toggle();
      }}
      className={cn(
        'cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#005BAC]/50 transition-shadow',
        className
      )}
      {...(props as any)}
    >
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15 }}
      >
        {children}
      </motion.div>
    </motion.button>
  );
}

export interface MorphSurfaceContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  overlayClassName?: string;
  showOverlay?: boolean;
}

export function MorphSurfaceContent({
  children,
  className,
  overlayClassName,
  showOverlay = false,
  ...props
}: MorphSurfaceContentProps) {
  const { isOpen, setIsOpen, layoutId } = useMorphSurface();

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {showOverlay && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setIsOpen(false)}
              className={cn('fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs', overlayClassName)}
            />
          )}
          <motion.div
            layoutId={layoutId}
            transition={defaultTransition}
            className={cn(
              'overflow-hidden shadow-2xl z-50 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl',
              className
            )}
            {...(props as any)}
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2, delay: 0.05 }}
              className="w-full h-full"
            >
              {children}
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
