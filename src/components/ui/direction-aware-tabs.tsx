import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../lib/utils';

export interface TabItem {
  id: string | number;
  label: React.ReactNode;
  icon?: React.ElementType;
  badge?: React.ReactNode;
  content?: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}

export interface DirectionAwareTabsProps {
  tabs: TabItem[];
  activeTab?: string | number;
  onChange?: (id: string | number) => void;
  className?: string;
  tabClassName?: string;
  activeTabClassName?: string;
  containerClassName?: string;
  showContent?: boolean;
}

export const DirectionAwareTabs: React.FC<DirectionAwareTabsProps> = ({
  tabs,
  activeTab: controlledActiveTab,
  onChange,
  className,
  tabClassName,
  activeTabClassName,
  containerClassName,
  showContent = false,
}) => {
  const [internalActiveTab, setInternalActiveTab] = useState<string | number>(
    controlledActiveTab !== undefined ? controlledActiveTab : tabs[0]?.id
  );
  const [direction, setDirection] = useState<number>(0);

  const activeTab = controlledActiveTab !== undefined ? controlledActiveTab : internalActiveTab;
  const activeIndex = tabs.findIndex((t) => t.id === activeTab);

  const handleTabClick = (tab: TabItem, index: number) => {
    if (tab.disabled) return;
    const prevIndex = tabs.findIndex((t) => t.id === activeTab);
    setDirection(index > prevIndex ? 1 : -1);
    setInternalActiveTab(tab.id);
    onChange?.(tab.id);
    tab.onClick?.();
  };

  const activeTabItem = tabs.find((t) => t.id === activeTab);

  return (
    <div className={cn('flex flex-col gap-2', containerClassName)}>
      {/* Tab Header Bar with Direction-Aware Sliding Highlight */}
      <div
        className={cn(
          'relative flex items-center gap-1 p-1 rounded-xl bg-black/25 border border-white/15 backdrop-blur-md shadow-inner',
          className
        )}
      >
        {tabs.map((tab, idx) => {
          const isActive = tab.id === activeTab;
          const Icon = tab.icon;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => handleTabClick(tab, idx)}
              disabled={tab.disabled}
              className={cn(
                'relative z-10 px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition-colors duration-150 flex items-center gap-1.5 cursor-pointer select-none',
                isActive
                  ? 'text-[#005BAC] dark:text-[#005BAC]'
                  : 'text-white/80 hover:text-white hover:bg-white/10',
                tab.disabled && 'opacity-40 cursor-not-allowed',
                tabClassName,
                tab.className
              )}
            >
              {/* Sliding Active Pill */}
              {isActive && (
                <motion.div
                  layoutId="direction-aware-active-tab"
                  className={cn(
                    'absolute inset-0 rounded-lg bg-white shadow-md',
                    activeTabClassName
                  )}
                  transition={{
                    type: 'spring',
                    stiffness: 450,
                    damping: 32,
                  }}
                />
              )}

              {/* Tab Icon and Label */}
              <span className="relative z-20 flex items-center gap-1.5">
                {Icon && <Icon className="w-3.5 h-3.5 shrink-0" />}
                <span>{tab.label}</span>
                {tab.badge && (
                  <span className="ml-0.5">{tab.badge}</span>
                )}
              </span>
            </button>
          );
        })}
      </div>

      {/* Optional Animated Content Switcher */}
      {showContent && activeTabItem?.content && (
        <div className="relative overflow-hidden w-full">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={String(activeTab)}
              custom={direction}
              variants={{
                enter: (dir: number) => ({
                  x: dir > 0 ? 20 : -20,
                  opacity: 0,
                }),
                center: {
                  x: 0,
                  opacity: 1,
                },
                exit: (dir: number) => ({
                  x: dir > 0 ? -20 : 20,
                  opacity: 0,
                }),
              }}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{
                x: { type: 'spring', stiffness: 350, damping: 30 },
                opacity: { duration: 0.15 },
              }}
            >
              {activeTabItem.content}
            </motion.div>
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};
