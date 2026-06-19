import React from 'react';
import { Sparkles } from 'lucide-react';

export interface LiveSyncCreditHUDProps {
  credits?: number;
  className?: string;
  onClick?: () => void;
}

export const LiveSyncCreditHUD: React.FC<LiveSyncCreditHUDProps> = ({
  credits = 0,
  className = '',
  onClick
}) => {
  // Determine if credits are low (e.g., less than 10)
  const isLowCredits = credits < 10;

  return (
    <div
      onClick={onClick}
      className={`flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all duration-300 ${
        onClick ? 'cursor-pointer hover:bg-[var(--accent-primary-subtle)]' : ''
      } ${
        isLowCredits
          ? 'bg-[var(--accent-red-subtle)] border-[var(--border-red)] text-[var(--text-red)]'
          : 'bg-[var(--bg-card)] border-[var(--border-light)] text-[var(--text-primary)]'
      } ${className}`}
      title={`LiveSync Credits: ${credits}`}
    >
      <Sparkles
        className={`w-4 h-4 ${
          isLowCredits
            ? 'text-[var(--text-red)] animate-pulse'
            : 'text-[var(--accent-primary)]'
        }`}
      />
      <span className="text-sm font-semibold tracking-tight">
        {credits.toLocaleString()}
      </span>
    </div>
  );
};
