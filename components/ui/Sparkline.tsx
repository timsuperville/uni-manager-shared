/**
 * Sparkline — Lightweight SVG mini-chart for the Liquid Glass design system.
 * Renders a polyline + translucent area fill over a zero-dependency SVG canvas.
 */

interface SparklineProps<T extends Record<string, unknown> = Record<string, number>> {
  data?: T[];
  dataKey: keyof T;
  color?: string;
  height?: number;
  className?: string;
}

export function Sparkline<T extends Record<string, number>>({
  data = [],
  dataKey,
  color = "var(--color-primary, #6366f1)",
  height = 60,
  className = "",
}: SparklineProps<T>) {
  if (!data.length) return null;

  const values = data.map((d) => (d[dataKey] as number) ?? 0);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const W = 100;
  const H = height;

  const pts = values.map((v, i) => {
    const x = values.length === 1 ? W / 2 : (i / (values.length - 1)) * W;
    const y = H - ((v - min) / range) * (H - 4) - 2;
    return `${x},${y}`;
  });

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height }} preserveAspectRatio="none" aria-hidden="true" className={className}>
      <polyline fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" points={pts.join(" ")} />
      <polygon points={`0,${H} ${pts.join(" ")} ${W},${H}`} fill={color} fillOpacity={0.08} />
    </svg>
  );
}

export default Sparkline;
