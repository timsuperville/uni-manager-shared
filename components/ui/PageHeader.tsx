import React from "react";

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  breadcrumb?: React.ReactNode;
  compact?: boolean;
  className?: string;
}

/**
 * PageHeader — Liquid Glass responsive title bar.
 * Stacks on mobile; single row on sm+. Description hidden on xs.
 */
export function PageHeader({ title, description, actions, breadcrumb, compact = false, className = "" }: PageHeaderProps) {
  return (
    <div className={["flex flex-col gap-1", compact ? "py-0" : "py-0.5", className].join(" ")}>
      {breadcrumb && (
        <div className="flex items-center gap-1.5 mb-1 text-xs font-medium" style={{ color: "var(--text-muted)" }}>
          {breadcrumb}
        </div>
      )}
      <div className="flex items-start sm:items-center justify-between gap-3 min-w-0">
        <div className="min-w-0 flex-1">
          <h1
            className={["font-bold leading-tight truncate", compact ? "text-xl sm:text-2xl" : "text-2xl sm:text-3xl"].join(" ")}
            style={{ color: "var(--text-primary)", fontFamily: "var(--font-display)" }}
          >
            {title}
          </h1>
          {description && (
            <p className="hidden sm:block text-sm mt-0.5 truncate" style={{ color: "var(--text-muted)" }}>
              {description}
            </p>
          )}
        </div>
        {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
      </div>
    </div>
  );
}

export default PageHeader;
