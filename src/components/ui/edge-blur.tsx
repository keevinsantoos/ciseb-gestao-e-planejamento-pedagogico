import React from 'react';
import { cn } from '../../lib/utils';

export interface EdgeBlurProps extends React.HTMLAttributes<HTMLDivElement> {
  position?: 'top' | 'bottom' | 'left' | 'right';
  height?: number | string;
  width?: number | string;
  className?: string;
}

export const EdgeBlur: React.FC<EdgeBlurProps> = ({
  position = 'bottom',
  height,
  width,
  className,
  style,
  ...props
}) => {
  const isVertical = position === 'top' || position === 'bottom';

  const positionClasses = {
    top: 'top-0 inset-x-0',
    bottom: 'bottom-0 inset-x-0',
    left: 'left-0 inset-y-0',
    right: 'right-0 inset-y-0',
  }[position];

  const maskStyles: Record<string, string> = {
    top: 'linear-gradient(to bottom, rgba(0, 0, 0, 1) 0%, rgba(0, 0, 0, 0) 100%)',
    bottom: 'linear-gradient(to top, rgba(0, 0, 0, 1) 0%, rgba(0, 0, 0, 0) 100%)',
    left: 'linear-gradient(to right, rgba(0, 0, 0, 1) 0%, rgba(0, 0, 0, 0) 100%)',
    right: 'linear-gradient(to left, rgba(0, 0, 0, 1) 0%, rgba(0, 0, 0, 0) 100%)',
  };

  const dynamicHeight = height !== undefined ? (typeof height === 'number' ? `${height}px` : height) : (isVertical ? '56px' : undefined);
  const dynamicWidth = width !== undefined ? (typeof width === 'number' ? `${width}px` : width) : (!isVertical ? '56px' : undefined);

  return (
    <div
      aria-hidden="true"
      style={{
        height: dynamicHeight,
        width: dynamicWidth,
        maskImage: maskStyles[position],
        WebkitMaskImage: maskStyles[position],
        ...style,
      }}
      className={cn(
        'pointer-events-none absolute z-20 backdrop-blur-[6px]',
        positionClasses,
        className
      )}
      {...props}
    >
      <div
        className={cn(
          'absolute inset-0 pointer-events-none',
          position === 'top' && 'bg-gradient-to-b from-white/60 dark:from-slate-950/60 to-transparent',
          position === 'bottom' && 'bg-gradient-to-t from-white/60 dark:from-slate-950/60 to-transparent',
          position === 'left' && 'bg-gradient-to-r from-white/60 dark:from-slate-950/60 to-transparent',
          position === 'right' && 'bg-gradient-to-l from-white/60 dark:from-slate-950/60 to-transparent'
        )}
      />
    </div>
  );
};

export const TopBlur: React.FC<Omit<EdgeBlurProps, 'position'>> = (props) => (
  <EdgeBlur position="top" {...props} />
);

export const BottomBlur: React.FC<Omit<EdgeBlurProps, 'position'>> = (props) => (
  <EdgeBlur position="bottom" {...props} />
);
