import React, { useState, useRef, useEffect, useCallback, useId } from "react";
import { flex1 } from "@shared/styles/styleUtils";

type DropdownSize = "sm" | "md" | "lg";

interface DropdownOption {
  value: string | number;
  label: string;
  icon?: React.ElementType;
  disabled?: boolean;
}

interface DropdownProps {
  options?: DropdownOption[];
  value?: string | number;
  onChange?: (value: string | number) => void;
  placeholder?: string;
  size?: DropdownSize;
  disabled?: boolean;
  className?: string;
}

const SIZE_STYLES: Record<
  DropdownSize,
  { padding: string; fontSize: number; minWidth: number }
> = {
  sm: { padding: "4px 10px", fontSize: 12, minWidth: 110 },
  md: { padding: "7px 12px", fontSize: 14, minWidth: 140 },
  lg: { padding: "10px 16px", fontSize: 16, minWidth: 180 },
};

/** Dropdown — Liquid Glass accessible select-style menu. */
export function Dropdown({
  options = [],
  value,
  onChange,
  placeholder = "Select…",
  size = "md",
  disabled = false,
  className = "",
}: DropdownProps) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const selected = options.find((o) => o.value === value);
  const sz = SIZE_STYLES[size];

  const triggerStyle: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    cursor: disabled ? "not-allowed" : "pointer",
    background: "var(--glass-surface, rgba(255,255,255,0.06))",
    border: "1px solid var(--glass-outline, rgba(128,128,128,0.25))",
    borderRadius: 8,
    color: "var(--text-primary, inherit)",
    outline: "none",
    userSelect: "none",
    opacity: disabled ? 0.55 : 1,
    ...sz,
  };
  const listStyle: React.CSSProperties = {
    position: "absolute",
    top: "calc(100% + 4px)",
    left: 0,
    minWidth: "100%",
    background: "var(--glass-panel, #fff)",
    border: "1px solid var(--glass-outline, rgba(128,128,128,0.25))",
    borderRadius: 8,
    boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
    zIndex: 100,
    overflow: "hidden",
    padding: "4px 0",
  };

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Escape") setOpen(false);
  }, []);
  const handleSelect = useCallback(
    (optValue: string | number) => {
      onChange?.(optValue);
      setOpen(false);
    },
    [onChange],
  );

  return (
    <div
      ref={containerRef}
      style={{ position: "relative", display: "inline-block" }}
      className={className}
      onKeyDown={handleKeyDown}
    >
      <button
        id={id}
        type="button"
        style={triggerStyle}
        onClick={() => !disabled && setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-disabled={disabled}
      >
        {selected?.icon && (
          <selected.icon style={{ width: 14, height: 14, flexShrink: 0 }} />
        )}
        <span style={{ ...flex1 }}>
          {selected ? selected.label : placeholder}
        </span>
        <svg
          width="10"
          height="10"
          viewBox="0 0 10 10"
          fill="none"
          style={{
            flexShrink: 0,
            transition: "transform 0.18s",
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
          }}
        >
          <path
            d="M1 3l4 4 4-4"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      </button>
      {open && (
        <ul role="listbox" aria-labelledby={id} style={listStyle}>
          {options.map((opt) => {
            const isSelected = opt.value === value;
            return (
              <li
                key={opt.value}
                role="option"
                aria-selected={isSelected}
                aria-disabled={opt.disabled}
                onClick={() => !opt.disabled && handleSelect(opt.value)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "7px 14px",
                  fontSize: sz.fontSize,
                  cursor: opt.disabled ? "not-allowed" : "pointer",
                  opacity: opt.disabled ? 0.45 : 1,
                  background: isSelected
                    ? "var(--primary-surface, rgba(99,102,241,0.12))"
                    : "transparent",
                  color: isSelected
                    ? "var(--primary-resonance, #6366f1)"
                    : "var(--text-primary, inherit)",
                  fontWeight: isSelected ? 600 : 400,
                  transition: "background 0.12s",
                }}
                onMouseEnter={(e) => {
                  if (!opt.disabled && !isSelected)
                    e.currentTarget.style.background =
                      "var(--glass-hover, rgba(128,128,128,0.08))";
                }}
                onMouseLeave={(e) => {
                  if (!opt.disabled && !isSelected)
                    e.currentTarget.style.background = "transparent";
                }}
              >
                {opt.icon && (
                  <opt.icon style={{ width: 14, height: 14, flexShrink: 0 }} />
                )}
                {opt.label}
              </li>
            );
          })}
          {options.length === 0 && (
            <li
              style={{
                padding: "10px 14px",
                fontSize: 13,
                color: "var(--text-secondary, #888)",
                fontStyle: "italic",
              }}
            >
              No options
            </li>
          )}
        </ul>
      )}
    </div>
  );
}

export default Dropdown;
