import React, { ReactNode } from 'react';

export interface TooltipProps {
  children: ReactNode;
  content: ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
}

export function Tooltip({
  children,
  content,
  position = 'bottom',
  className = ''
}: TooltipProps) {
  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2'
  };

  return (
    <div className="relative inline-flex group">
      {children}
      <div
        className={`absolute z-50 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-100 whitespace-nowrap bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-medium text-xs rounded py-1.5 px-2 shadow-lg border border-slate-700 dark:border-slate-300 ${positionClasses[position]} ${className}`}
      >
        {content}
      </div>
    </div>
  );
}

export default Tooltip;
