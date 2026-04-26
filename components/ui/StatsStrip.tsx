interface StatsStripItem {
  key: string;
  label: string;
  shortLabel?: string;
  color: string;
}

interface StatsStripProps {
  items: StatsStripItem[];
  values: Record<string, number | string>;
  loading?: boolean;
}

/**
 * StatsStrip — compact horizontal strip of statistics with hairline dividers.
 * Responsive via Tailwind breakpoint classes.
 */
export function StatsStrip({
  items,
  values,
  loading = false,
}: StatsStripProps) {
  return (
    <div
      className="flex items-center rounded-xl overflow-hidden w-full"
      style={{
        background: "var(--glass-surface)",
        border: "1px solid var(--glass-outline)",
      }}
      role="list"
      aria-label="Statistics"
    >
      {items.map(({ key, label, shortLabel, color }, idx) => (
        <div
          key={key}
          role="listitem"
          className="flex items-center gap-1.5 px-3 py-2 sm:px-4 flex-1 min-w-0"
          style={{
            borderRight:
              idx < items.length - 1
                ? "1px solid var(--glass-outline)"
                : "none",
          }}
        >
          <span
            className="w-1.5 h-1.5 rounded-full shrink-0"
            style={{ background: color, boxShadow: `0 0 4px ${color}` }}
            aria-hidden="true"
          />
          {loading ? (
            <span
              className="block h-3 w-5 rounded animate-pulse shrink-0"
              style={{ background: "var(--glass-outline)" }}
            />
          ) : (
            <span
              className="text-xs sm:text-sm font-bold tabular-nums shrink-0"
              style={{
                color: "var(--text-primary)",
                fontFamily: "var(--font-display)",
              }}
            >
              {values[key] ?? "—"}
            </span>
          )}
          <span
            className="text-[10px] sm:text-[11px] truncate"
            style={{ color: "var(--text-muted)" }}
          >
            {shortLabel ? (
              <>
                <span className="sm:hidden">{shortLabel}</span>
                <span className="hidden sm:inline">{label}</span>
              </>
            ) : (
              label
            )}
          </span>
        </div>
      ))}
    </div>
  );
}

export default StatsStrip;
