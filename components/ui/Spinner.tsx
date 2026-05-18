import React from 'react';

type SpinnerSize = 'sm' | 'md' | 'lg' | 'xl';

interface SpinnerProps extends React.SVGProps<SVGSVGElement> {
  size?: SpinnerSize;
  color?: string;
  label?: string;
  className?: string;
}

const SIZES: Record<SpinnerSize, number> = { sm: 16, md: 24, lg: 36, xl: 48 };

/** Spinner — Liquid Glass inline animation. Inherits brand colour via --primary-resonance. */
export function Spinner({
  size = 'md',
  color,
  label = 'Loading…',
  className = '',
  ...props
}: SpinnerProps) {
  const px = SIZES[size] ?? SIZES.md;
  const stroke = px <= 16 ? 2 : px <= 24 ? 2.5 : 3;

  return (
    <svg
      width={px}
      height={px}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label={label}
      role="status"
      className={className}
      style={{ animation: 'spin 0.8s linear infinite', flexShrink: 0 }}
      {...props}
    >
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <circle
        cx="12"
        cy="12"
        r="9"
        stroke="var(--glass-outline, rgba(255,255,255,0.12))"
        strokeWidth={stroke}
      />
      <path
        d="M21 12a9 9 0 0 0-9-9"
        stroke={
          color ?? 'var(--primary-resonance, var(--color-primary, #6366f1))'
        }
        strokeWidth={stroke}
        strokeLinecap="round"
      />
    </svg>
  );
}

export default Spinner;
