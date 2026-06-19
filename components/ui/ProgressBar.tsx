import React from 'react';

type ProgressBarVariant = 'primary' | 'success' | 'error' | 'warning';

interface ProgressBarProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number;
  max?: number;
  height?: number;
  color?: string;
  variant?: ProgressBarVariant;
  animated?: boolean;
  className?: string;
}

const variantColor: Record<ProgressBarVariant, string> = {
  primary: 'var(--primary-live-sync, var(--color-primary, #6366f1))',
  success: 'var(--accent-emerald, var(--color-success, #22c55e))',
  error: 'var(--accent-rose, var(--color-error, #ef4444))',
  warning: 'var(--accent-amber, var(--color-warning, #f59e0b))'
};

/** ProgressBar — Modern UI horizontal fill indicator. */
export function ProgressBar({
  value = 0,
  max = 100,
  height = 6,
  color,
  variant = 'primary',
  animated = false,
  className = '',
  ...props
}: ProgressBarProps) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  const fillColor = color ?? variantColor[variant] ?? variantColor.primary;

  return (
    <div
      className={className}
      style={{
        width: '100%',
        height,
        borderRadius: height / 2,
        background:
          'var(--glass-outline, var(--glass-border, rgba(255,255,255,0.12)))',
        overflow: 'hidden'
      }}
      role="progressbar"
      aria-valuenow={Math.round(pct)}
      aria-valuemin={0}
      aria-valuemax={100}
      {...props}
    >
      <div
        style={{
          width: `${pct}%`,
          height: '100%',
          background: fillColor,
          borderRadius: height / 2,
          transition: 'width 0.4s ease',
          animation: animated
            ? 'progress-shimmer 1.5s ease-in-out infinite'
            : undefined
        }}
      />
    </div>
  );
}

export default ProgressBar;
