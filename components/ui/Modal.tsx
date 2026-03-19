import { useEffect } from "react";
import { createPortal } from "react-dom";

type ModalSize = "sm" | "md" | "lg" | "xl";
const SIZE_MAP: Record<ModalSize, number> = { sm: 480, md: 640, lg: 800, xl: 1080 };

interface ModalProps {
  /** Primary API */
  open?: boolean;
  onClose?: () => void;
  title?: React.ReactNode;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: number | string;
  className?: string;
  /** Backward-compat aliases */
  isOpen?: boolean;
  size?: ModalSize;
}

import React from "react";

/** Modal — Liquid Glass full-screen backdrop modal. */
export function Modal({ open, onClose, title, children, footer, maxWidth, className = "", isOpen, size }: ModalProps) {
  const isVisible = open ?? isOpen ?? false;
  const resolvedMaxWidth = maxWidth ?? (size ? (SIZE_MAP[size] ?? SIZE_MAP.md) : SIZE_MAP.md);

  useEffect(() => {
    if (!isVisible) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose?.(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [isVisible, onClose]);

  if (!isVisible) return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={typeof title === "string" ? title : undefined}
      onClick={(e) => e.target === e.currentTarget && onClose?.()}
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "1rem" }}
    >
      <div
        className={className}
        style={{ background: "var(--glass-surface)", border: "1px solid var(--glass-outline)", borderRadius: "var(--radius-lg)", backdropFilter: "blur(24px) saturate(180%)", WebkitBackdropFilter: "blur(24px) saturate(180%)", maxWidth: resolvedMaxWidth, width: "100%", maxHeight: "85vh", display: "flex", flexDirection: "column", overflow: "hidden", boxShadow: "0 24px 64px rgba(0,0,0,0.45)" }}
      >
        <div style={{ padding: "1rem 1.5rem", borderBottom: "1px solid var(--glass-outline)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h3 style={{ margin: 0, fontSize: "var(--text-lg)", fontWeight: 600, color: "var(--text-primary)" }}>
            {title}
          </h3>
          <button
            onClick={onClose}
            aria-label="Close dialog"
            style={{ background: "none", border: "none", color: "var(--text-secondary)", cursor: "pointer", fontSize: "1.1rem", padding: "2px 6px", borderRadius: "4px", lineHeight: 1, transition: "color 0.15s" }}
          >
            ✕
          </button>
        </div>
        <div style={{ padding: "1.5rem", overflowY: "auto", flex: 1 }}>{children}</div>
        {footer && (
          <div style={{ padding: "1rem 1.5rem", borderTop: "1px solid var(--glass-outline)", display: "flex", justifyContent: "flex-end", gap: "0.5rem" }}>
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}

export default Modal;
