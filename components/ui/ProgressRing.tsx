

export interface ProgressRingProps {
  pct: number;
  size?: number;
  stroke?: number;
  color?: string;
  className?: string;
}

export function ProgressRing({
  pct,
  size = 56,
  stroke = 5,
  color = "var(--primary-resonance)",
  className,
}: ProgressRingProps) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  // Cap percentage between 0 and 100
  const clP = Math.max(0, Math.min(100, isNaN(pct) ? 0 : pct));
  const offset = circ - (clP / 100) * circ;
  
  return (
    <svg 
      width={size} 
      height={size} 
      className={className}
      style={{ 
        flexShrink: 0, 
        transform: className?.includes("-rotate-90") ? "none" : "rotate(-90deg)" // Handle legacy Tailind class
      }}
    >
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="rgba(255,255,255,0.08)"
        strokeWidth={stroke}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth={stroke}
        strokeDasharray={circ}
        strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: "stroke-dashoffset 0.6s ease" }}
      />
    </svg>
  );
}
