import React from "react";

interface SectionCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  icon?: React.ElementType;
  iconColor?: string;
  children?: React.ReactNode;
  className?: string;
}

/** SectionCard — Liquid Glass grouping card with optional icon + title header. */
export function SectionCard({
  title,
  icon: Icon,
  iconColor = "var(--primary-resonance, #60a5fa)",
  children,
  className = "",
  ...props
}: SectionCardProps) {
  return (
    <div
      className={className}
      style={{
        background: "var(--glass-surface, rgba(255,255,255,0.03))",
        border:
          "1px solid var(--glass-outline, var(--glass-border, rgba(255,255,255,0.08)))",
        borderRadius: "var(--radius-lg, 1rem)",
        marginBottom: "1rem",
        overflow: "hidden",
      }}
      {...props}
    >
      {(title || Icon) && (
        <div
          className="flex items-center gap-3 px-5 py-4 border-b"
          style={{
            borderColor: "var(--glass-border, rgba(255,255,255,0.08))",
            background: "rgba(255,255,255,0.02)",
          }}
        >
          {Icon && (
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: `${iconColor}20` }}
            >
              <Icon className="w-4 h-4" style={{ color: iconColor }} />
            </div>
          )}
          {title && (
            <h3
              className="font-bold text-sm m-0"
              style={{ color: "var(--text-primary, #f1f5f9)" }}
            >
              {title}
            </h3>
          )}
        </div>
      )}
      <div style={{ padding: "1.25rem 1.25rem 0.5rem" }}>{children}</div>
    </div>
  );
}

export default SectionCard;
