import React from 'react';

type ProgressVariant =
  | 'default'
  | 'success'
  | 'warning'
  | 'danger'
  | 'error'
  | 'info';
type ProgressSize = 'sm' | 'default' | 'lg';

interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number;
  max?: number;
  size?: ProgressSize;
  variant?: ProgressVariant;
  showLabel?: boolean;
  label?: string;
}

interface CircularProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number;
  max?: number;
  size?: ProgressSize;
  variant?: ProgressVariant;
  showLabel?: boolean;
  strokeWidth?: number;
}

const sizeClasses: Record<ProgressSize, string> = {
  sm: 'h-2',
  default: 'h-3',
  lg: 'h-4'
};

const variantClasses: Record<ProgressVariant, string> = {
  default: '[background:var(--primary-resonance,#4f46e5)]',
  success: '[background:var(--accent-emerald,#22c55e)]',
  warning: '[background:var(--warning,#eab308)]',
  danger: '[background:var(--danger,#ef4444)]',
  error: '[background:var(--danger,#ef4444)]',
  info: '[background:var(--badge-info-text,#60a5fa)]'
};

const variantColors: Record<ProgressVariant, string> = {
  default: 'var(--primary-resonance, #4f46e5)',
  success: 'var(--accent-emerald, #10b981)',
  warning: 'var(--warning, #f59e0b)',
  danger: 'var(--danger, #ef4444)',
  error: 'var(--danger, #ef4444)',
  info: 'var(--badge-info-text, #3b82f6)'
};

const circleSizes: Record<ProgressSize, number> = {
  sm: 64,
  default: 96,
  lg: 128
};

export const Progress: React.FC<ProgressProps> = ({
  value = 0,
  max = 100,
  className = '',
  size = 'default',
  variant = 'default',
  showLabel = false,
  label = '',
  ...props
}) => {
  const pct = Math.min(Math.max((value / max) * 100, 0), 100);
  return (
    <div className={`w-full ${className}`} {...props}>
      {(showLabel || label) && (
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-(--text-primary,inherit)">
            {label || `${Math.round(pct)}%`}
          </span>
          {showLabel && !label && (
            <span className="text-sm text-(--text-muted,rgba(255,255,255,0.5))">
              {value}/{max}
            </span>
          )}
        </div>
      )}
      <div
        className={`w-full [background:var(--glass-outline,rgba(255,255,255,0.12))] rounded-full ${sizeClasses[size]}`}
      >
        <div
          className={`${sizeClasses[size]} ${variantClasses[variant]} rounded-full transition-all duration-300 ease-in-out`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
};

export const CircularProgress: React.FC<CircularProgressProps> = ({
  value = 0,
  max = 100,
  size = 'default',
  variant = 'default',
  showLabel = false,
  strokeWidth = 8,
  className = '',
  ...props
}) => {
  const pct = Math.min(Math.max((value / max) * 100, 0), 100);
  const sv = circleSizes[size];
  const radius = (sv - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (pct / 100) * circumference;

  return (
    <div
      className={`relative inline-flex items-center justify-center ${className}`}
      {...props}
    >
      <svg width={sv} height={sv} className="transform -rotate-90">
        <circle
          cx={sv / 2}
          cy={sv / 2}
          r={radius}
          stroke="var(--glass-outline, #e5e7eb)"
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        <circle
          cx={sv / 2}
          cy={sv / 2}
          r={radius}
          stroke={variantColors[variant]}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-300 ease-in-out"
        />
      </svg>
      {showLabel && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-sm font-medium text-(--text-primary,inherit)">
            {Math.round(pct)}%
          </span>
        </div>
      )}
    </div>
  );
};

export { Progress as default };
