import { useEffect } from "react";
import { createPortal } from "react-dom";

type ModalSize = "sm" | "md" | "lg" | "xl";
const SIZE_MAP: Record<ModalSize, number> = {
  sm: 520,
  md: 760,
  lg: 960,
  xl: 1280,
};

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
export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  maxWidth,
  className = "",
  isOpen,
  size,
}: ModalProps) {
  const isVisible = open ?? isOpen ?? false;
  // Universally scale up any hardcoded widths to ensure all modals are wider
  const parsedMaxWidth =
    typeof maxWidth === "number" ? Math.round(maxWidth * 1.3) : maxWidth;
  const resolvedMaxWidth =
    parsedMaxWidth ?? (size ? (SIZE_MAP[size] ?? SIZE_MAP.md) : SIZE_MAP.md);

  useEffect(() => {
    if (!isVisible) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose?.();
    };
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
      className="fixed inset-0 z-[1000] flex items-center justify-center p-0 sm:p-4 md:p-6"
      style={{ background: "rgba(0,0,0,0.55)" }}
    >
      <div
        className={className}
        style={{
          background: "var(--glass-surface)",
          border: "1px solid var(--glass-outline)",
          backdropFilter: "blur(24px) saturate(180%)",
          WebkitBackdropFilter: "blur(24px) saturate(180%)",
          maxWidth: resolvedMaxWidth,
          width: "100%",
          maxHeight: "100%",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          boxShadow: "0 24px 64px rgba(0,0,0,0.45)",
          borderRadius: "var(--modal-radius, var(--radius-lg))",
        }}
      >
        <style>
          {`
            @media (max-width: 639px) {
              [role="dialog"] > div:last-child {
                border-radius: 0 !important;
                border: none !important;
                height: 100dvh !important;
                max-height: 100dvh !important;
              }
            }
          `}
        </style>
        <div
          style={{
            padding: "1rem 1.5rem",
            borderBottom: "1px solid var(--glass-outline)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <h3
            style={{
              margin: 0,
              fontSize: "var(--text-lg)",
              fontWeight: 600,
              color: "var(--text-primary)",
            }}
          >
            {title}
          </h3>
          <button
            onClick={onClose}
            aria-label="Close dialog"
            style={{
              background: "none",
              border: "none",
              color: "var(--text-secondary)",
              cursor: "pointer",
              fontSize: "1.1rem",
              padding: "2px 6px",
              borderRadius: "4px",
              lineHeight: 1,
              transition: "color 0.15s",
            }}
          >
            ✕
          </button>
        </div>
        <div style={{ padding: "1.5rem", overflowY: "auto", flex: 1 }}>
          {children}
        </div>
        {footer && (
          <div
            style={{
              padding: "1rem 1.5rem",
              borderTop: "1px solid var(--glass-outline)",
              display: "flex",
              justifyContent: "flex-end",
              gap: "0.5rem",
            }}
          >
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}

export default Modal;
