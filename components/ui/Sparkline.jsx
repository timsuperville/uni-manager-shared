import PropTypes from "prop-types";

/**
 * Sparkline — Lightweight SVG mini-chart for the Liquid Glass design system.
 *
 * Renders a polyline + translucent area fill over a zero-dependency SVG canvas.
 * All colours are resolved via CSS custom properties so every app's palette is
 * automatically picked up without any extra config.
 *
 * @param {Array}  data    - Array of data objects (e.g. [{time:'00:00', value:42}, …])
 * @param {string} dataKey - The key on each object to plot on the Y axis
 * @param {string} color   - Stroke colour; defaults to the current app's primary token
 * @param {number} height  - SVG render height in px (default: 60)
 * @param {string} className - Optional className passthrough
 */
export function Sparkline({
  data = [],
  dataKey,
  color = "var(--color-primary, #6366f1)",
  height = 60,
  className = "",
}) {
  if (!data.length) return null;

  const values = data.map((d) => d[dataKey] ?? 0);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const W = 100; // SVG viewBox width units — unitless, scales with container
  const H = height;

  const pts = values.map((v, i) => {
    const x = values.length === 1 ? W / 2 : (i / (values.length - 1)) * W;
    const y = H - ((v - min) / range) * (H - 4) - 2;
    return `${x},${y}`;
  });

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      style={{ width: "100%", height }}
      preserveAspectRatio="none"
      aria-hidden="true"
      className={className}
    >
      {/* Line */}
      <polyline
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        points={pts.join(" ")}
      />
      {/* Area fill */}
      <polygon
        points={`0,${H} ${pts.join(" ")} ${W},${H}`}
        fill={color}
        fillOpacity={0.08}
      />
    </svg>
  );
}

Sparkline.propTypes = {
  data: PropTypes.array.isRequired,
  dataKey: PropTypes.string.isRequired,
  color: PropTypes.string,
  height: PropTypes.number,
  className: PropTypes.string,
};

export default Sparkline;
