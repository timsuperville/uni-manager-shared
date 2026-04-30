import React from "react";

interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: React.ReactNode;
  title?: string;
  description?: string;
  action?: React.ReactNode;
  actionableGuidance?: React.ReactNode;
  className?: string;
}

/** EmptyState — centred panel with optional icon, title, description, and CTA. */
export function EmptyState({
  icon,
  title,
  description,
  action,
  actionableGuidance,
  className = "",
  ...props
}: EmptyStateProps) {
  return (
    <div
      className={className}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        padding: "3rem 1.5rem",
        gap: "0.75rem",
      }}
      {...props}
    >
      {icon && (
        <div
          style={{
            fontSize: "2.5rem",
            lineHeight: 1,
            color: "var(--text-muted, rgba(255,255,255,0.4))",
            marginBottom: "0.25rem",
          }}
        >
          {icon}
        </div>
      )}
      {title && (
        <h3
          style={{
            margin: 0,
            fontSize: "var(--text-base, 1rem)",
            fontWeight: 600,
            color: "var(--text-primary, inherit)",
          }}
        >
          {title}
        </h3>
      )}
      {description && (
        <p
          style={{
            margin: 0,
            fontSize: "var(--text-sm, 0.875rem)",
            color: "var(--text-secondary, rgba(255,255,255,0.6))",
            maxWidth: "28ch",
          }}
        >
          {description}
        </p>
      )}
      {actionableGuidance && (
        <div
          style={{
            marginTop: "1rem",
            padding: "0.75rem 1rem",
            background: "var(--bg-surface-2, rgba(255,255,255,0.05))",
            border: "1px solid var(--border-subtle, rgba(255,255,255,0.1))",
            borderRadius: "var(--radius-md, 6px)",
            fontSize: "var(--text-sm, 0.875rem)",
            color: "var(--text-secondary, rgba(255,255,255,0.7))",
            maxWidth: "400px",
            textAlign: "left",
            display: "flex",
            alignItems: "flex-start",
            gap: "0.5rem",
          }}
        >
          <span style={{ color: "var(--primary-resonance, #0ea5e9)" }}>💡</span>
          <div>{actionableGuidance}</div>
        </div>
      )}
      {action && <div style={{ marginTop: "1.5rem" }}>{action}</div>}
    </div>
  );
}

export default EmptyState;
