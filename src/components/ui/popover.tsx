import React, {
  createContext,
  useContext,
  useState,
  useRef,
  useEffect,
  ReactNode,
} from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown, Check } from 'lucide-react';
import { cn } from '../../lib/utils';

interface PopoverContextType {
  isOpen: boolean;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  close: () => void;
  toggle: () => void;
}

const PopoverContext = createContext<PopoverContextType | undefined>(undefined);

export const usePopover = () => {
  const context = useContext(PopoverContext);
  if (!context) {
    throw new Error('usePopover must be used within a PopoverRoot');
  }
  return context;
};

// 1. PopoverRoot
export interface PopoverRootProps {
  children: ReactNode;
  className?: string;
  defaultOpen?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export const PopoverRoot: React.FC<PopoverRootProps> = ({
  children,
  className,
  defaultOpen = false,
  open: controlledOpen,
  onOpenChange,
}) => {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen);
  const rootRef = useRef<HTMLDivElement>(null);

  const isControlled = controlledOpen !== undefined;
  const isOpen = isControlled ? controlledOpen : uncontrolledOpen;

  const setIsOpen = (valueOrFn: React.SetStateAction<boolean>) => {
    const nextVal = typeof valueOrFn === 'function' ? valueOrFn(isOpen) : valueOrFn;
    if (!isControlled) {
      setUncontrolledOpen(nextVal);
    }
    onOpenChange?.(nextVal);
  };

  const close = () => setIsOpen(false);
  const toggle = () => setIsOpen((prev) => !prev);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        close();
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        close();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  return (
    <PopoverContext.Provider value={{ isOpen, setIsOpen, close, toggle }}>
      <div ref={rootRef} className={cn('relative inline-block w-full', className)}>
        {children}
      </div>
    </PopoverContext.Provider>
  );
};

// 2. PopoverTrigger
export interface PopoverTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  className?: string;
  asChild?: boolean;
}

export const PopoverTrigger: React.FC<PopoverTriggerProps> = ({
  children,
  className,
  onClick,
  ...props
}) => {
  const { isOpen, toggle } = usePopover();

  return (
    <button
      type="button"
      onClick={(e) => {
        toggle();
        onClick?.(e);
      }}
      aria-expanded={isOpen}
      className={cn(
        'w-full flex items-center justify-between gap-2 p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-800 dark:text-slate-200 hover:bg-slate-100/70 dark:hover:bg-slate-700/60 focus:outline-none focus:ring-2 focus:ring-[#005BAC] transition-all cursor-pointer shadow-xs',
        isOpen && 'ring-2 ring-[#005BAC] bg-white dark:bg-slate-800 border-transparent',
        className
      )}
      {...props}
    >
      <span className="truncate flex items-center gap-1.5">{children}</span>
      <ChevronDown
        className={cn(
          'w-3.5 h-3.5 text-slate-400 dark:text-slate-500 transition-transform duration-200 shrink-0',
          isOpen && 'rotate-180 text-[#005BAC] dark:text-sky-400'
        )}
      />
    </button>
  );
};

// 3. PopoverContent
export interface PopoverContentProps {
  children: ReactNode;
  className?: string;
  align?: 'start' | 'center' | 'end';
}

export const PopoverContent: React.FC<PopoverContentProps> = ({
  children,
  className,
  align = 'start',
}) => {
  const { isOpen } = usePopover();

  const alignmentClasses = {
    start: 'left-0',
    center: 'left-1/2 -translate-x-1/2',
    end: 'right-0',
  }[align];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 4, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 4, scale: 0.98 }}
          transition={{ duration: 0.15, ease: 'easeOut' }}
          className={cn(
            'absolute z-50 mt-1.5 w-full min-w-[200px] overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-xl backdrop-blur-md',
            alignmentClasses,
            className
          )}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// 4. PopoverHeader
export interface PopoverHeaderProps {
  children: ReactNode;
  className?: string;
}

export const PopoverHeader: React.FC<PopoverHeaderProps> = ({ children, className }) => {
  return (
    <div
      className={cn(
        'px-3 py-2 border-b border-slate-100 dark:border-slate-700/80 bg-slate-50/70 dark:bg-slate-900/40 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center justify-between',
        className
      )}
    >
      {children}
    </div>
  );
};

// 5. PopoverBody
export interface PopoverBodyProps {
  children: ReactNode;
  className?: string;
}

export const PopoverBody: React.FC<PopoverBodyProps> = ({ children, className }) => {
  return (
    <div
      className={cn(
        'p-1 max-h-60 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-700/50 space-y-0.5',
        className
      )}
    >
      {children}
    </div>
  );
};

// 6. PopoverButton
export interface PopoverButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  className?: string;
  isSelected?: boolean;
}

export const PopoverButton: React.FC<PopoverButtonProps> = ({
  children,
  className,
  isSelected,
  onClick,
  ...props
}) => {
  const { close } = usePopover();

  return (
    <button
      type="button"
      onClick={(e) => {
        onClick?.(e);
        close();
      }}
      className={cn(
        'w-full flex items-center justify-between gap-2 px-3 py-2 text-xs text-left rounded-lg transition-colors cursor-pointer',
        isSelected
          ? 'bg-sky-50 dark:bg-sky-950/60 text-[#005BAC] dark:text-sky-300 font-bold'
          : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/50 font-medium',
        className
      )}
      {...props}
    >
      <div className="flex items-center gap-2 truncate">{children}</div>
      {isSelected && (
        <Check className="w-3.5 h-3.5 text-[#005BAC] dark:text-sky-400 shrink-0" />
      )}
    </button>
  );
};

// Helper: PopoverSelect for direct replacement of HTML select inputs
export interface PopoverSelectProps {
  label?: string;
  headerTitle?: string;
  placeholder?: string;
  value: string;
  options: string[] | { value: string; label: string; icon?: ReactNode }[];
  onChange: (value: string) => void;
  className?: string;
  triggerClassName?: string;
}

export const PopoverSelect: React.FC<PopoverSelectProps> = ({
  headerTitle,
  placeholder = 'Selecione uma opção...',
  value,
  options,
  onChange,
  className,
  triggerClassName,
}) => {
  const normalizedOptions = options.map((opt) =>
    typeof opt === 'string' ? { value: opt, label: opt, icon: null } : opt
  );

  const selectedOption = normalizedOptions.find((opt) => opt.value === value);

  return (
    <PopoverRoot className={className}>
      <PopoverTrigger className={triggerClassName}>
        {selectedOption ? (
          <span className="flex items-center gap-2 truncate">
            {selectedOption.icon}
            <span className="truncate">{selectedOption.label}</span>
          </span>
        ) : (
          <span className="text-slate-400 dark:text-slate-500 truncate">{placeholder}</span>
        )}
      </PopoverTrigger>

      <PopoverContent className="w-full">
        {headerTitle && <PopoverHeader>{headerTitle}</PopoverHeader>}
        <PopoverBody>
          {normalizedOptions.map((opt) => (
            <PopoverButton
              key={opt.value}
              isSelected={opt.value === value}
              onClick={() => onChange(opt.value)}
            >
              {opt.icon}
              <span className="truncate">{opt.label}</span>
            </PopoverButton>
          ))}
        </PopoverBody>
      </PopoverContent>
    </PopoverRoot>
  );
};
