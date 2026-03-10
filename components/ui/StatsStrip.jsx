import React from "react";
import PropTypes from "prop-types";

/**
 * StatsStrip — Liquid Glass Design System
 *
 * A compact, single-line horizontal strip of statistics separated by hairline
 * dividers. Fully responsive via Tailwind breakpoint classes:
 *   - All sizes: flex row, cells share width equally (flex-1)
 *   - Mobile (< sm): px-3, shorter labels via `shortLabel`
 *   - Desktop (sm+): px-4, full `label`
 *
 * @param {Array}   items   - Stat config: [{ key, label, shortLabel?, color }]
 * @param {Object}  values  - Map of key → numeric/string value to display
 * @param {boolean} loading - When true, renders inline skeleton placeholders
 *
 * @example
 * const ITEMS = [
 *   { key: "upcoming", label: "Upcoming",      shortLabel: "Soon",   color: "hsla(248,65%,65%,1)" },
 *   { key: "total",    label: "Total Services", shortLabel: "Total",  color: "hsla(272,65%,62%,1)" },
 * ];
 * <StatsStrip items={ITEMS} values={{ upcoming: 12, total: 47 }} loading={false} />
 */
export function StatsStrip({ items, values, loading = false }) {
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
                    {/* Accent dot */}
                    <span
                        className="w-1.5 h-1.5 rounded-full shrink-0"
                        style={{ background: color, boxShadow: `0 0 4px ${color}` }}
                        aria-hidden="true"
                    />

                    {/* Value */}
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

                    {/* Label — short on mobile, full on desktop */}
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

StatsStrip.propTypes = {
    items: PropTypes.arrayOf(
        PropTypes.shape({
            key: PropTypes.string.isRequired,
            label: PropTypes.string.isRequired,
            shortLabel: PropTypes.string,
            color: PropTypes.string.isRequired,
        }),
    ).isRequired,
    values: PropTypes.objectOf(
        PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    ).isRequired,
    loading: PropTypes.bool,
};

export default StatsStrip;
