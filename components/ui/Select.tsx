// Unified Select component — Liquid Glass Design System
// Dropdown is rendered via ReactDOM.createPortal so it escapes any stacking
// context created by backdrop-filter, transform, or will-change on ancestors.
import React, { useState, useRef, useEffect, useCallback } from "react";
import ReactDOM from "react-dom";
import { ChevronDown, Check, Loader2, X } from "lucide-react";

type SelectSize = "small" | "medium" | "large" | "chip";
type SelectVariant = "default" | "outlined" | "filled";
type SelectValue = string | number;

export interface SelectOption {
  value: SelectValue;
  label: string;
  icon?: React.ReactNode | string;
  disabled?: boolean;
}

interface SelectProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "onChange"> {
  options?: SelectOption[];
  value?: SelectValue | SelectValue[];
  onChange?: (value: SelectValue | SelectValue[]) => void;
  onSearchChange?: (term: string) => void;
  placeholder?: string;
  disabled?: boolean;
  searchable?: boolean;
  multiple?: boolean;
  size?: SelectSize;
  error?: boolean;
  helperText?: string;
  className?: string;
  name?: string;
  id?: string;
  required?: boolean;
  clearable?: boolean;
  loading?: boolean;
  allowFreeText?: boolean;
  chipIcon?: React.ReactNode;
  variant?: SelectVariant;
}

const Select: React.FC<SelectProps> = ({
  options = [],
  value,
  onChange,
  placeholder = "Select…",
  disabled = false,
  searchable = false,
  multiple = false,
  size = "medium",
  error = false,
  helperText = "",
  className = "",
  name,
  id,
  required = false,
  clearable = false,
  loading = false,
  onSearchChange,
  allowFreeText = false,
  chipIcon = null,
  variant: _variant,
  ...props
}) => {
  // ── State ────────────────────────────────────────────────────────────────────
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  // Portal dropdown position + flip-up support
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0, width: 0, maxHeight: 240, flipUp: false });

  // ── Refs (all at top) ────────────────────────────────────────────────────────
  const selectRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  // Stable portal root — initialised once, never changes across re-renders
  const portalRootRef = useRef<HTMLElement | null>(null);
  if (!portalRootRef.current && typeof document !== "undefined") {
    let el = document.getElementById("select-portal-root");
    if (!el) {
      el = document.createElement("div");
      el.id = "select-portal-root";
      document.body.appendChild(el);
    }
    portalRootRef.current = el;
  }
  const portalRoot = portalRootRef.current;

  // ── Derived data ─────────────────────────────────────────────────────────────
  const filteredOptions =
    searchable && !onSearchChange
      ? options.filter((o) =>
        o.label.toLowerCase().includes(searchTerm.toLowerCase()),
      )
      : options;

  const selectedOption = multiple ? null : options.find((o) => o.value === value);
  const selectedLabel = multiple
    ? Array.isArray(value) && value.length > 0
      ? `${value.length} selected`
      : placeholder
    : value
      ? selectedOption?.label ?? value
      : placeholder;
  const selectedIcon = selectedOption?.icon ?? null;
  const hasValue = multiple ? Array.isArray(value) && value.length > 0 : !!value;

  // ── Helpers ──────────────────────────────────────────────────────────────────
  // Measure trigger and decide whether the dropdown should open above or below
  const measureTrigger = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const GUTTER = 8;
    const CAP = 240; // desired max-height
    const spaceBelow = window.innerHeight - rect.bottom - GUTTER;
    const spaceAbove = rect.top - GUTTER;
    const flipUp = spaceBelow < 180 && spaceAbove > spaceBelow;
    const maxHeight = Math.min(CAP, flipUp ? spaceAbove : spaceBelow);
    setDropdownPos({
      // When flipping up, anchor to the TOP of the trigger minus the panel height.
      // We use the capped maxHeight as the panel height since it's always ≤ CAP.
      top: flipUp
        ? rect.top + window.scrollY - maxHeight - GUTTER
        : rect.bottom + window.scrollY + GUTTER / 2,
      left: rect.left + window.scrollX,
      width: rect.width,
      maxHeight,
      flipUp,
    });
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    setSearchTerm("");
    setHighlightedIndex(-1);
    onSearchChange?.("");
  }, [onSearchChange]);

  const handleOpen = useCallback(() => {
    if (disabled) return;
    measureTrigger();
    setIsOpen((o) => {
      if (!o) setHighlightedIndex(-1);
      return !o;
    });
  }, [disabled, measureTrigger]);

  // ── Effects ──────────────────────────────────────────────────────────────────

  // Close on outside click — portal dropdown is NOT inside selectRef, so we
  // check both the trigger wrapper and the portal root element.
  useEffect(() => {
    if (!isOpen) return;
    const handleOutside = (e: MouseEvent) => {
      const inPortal = portalRoot?.contains(e.target as Node);
      const inTrigger = selectRef.current?.contains(e.target as Node);
      if (!inPortal && !inTrigger) close();
    };
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [isOpen, close, portalRoot]);

  // Re-measure on scroll/resize so the portal dropdown tracks the trigger
  useEffect(() => {
    if (!isOpen) return;
    const update = () => measureTrigger();
    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
    };
  }, [isOpen, measureTrigger]);

  // Auto-focus search input when opened
  useEffect(() => {
    if (isOpen && searchable && searchRef.current) {
      searchRef.current.focus();
    }
  }, [isOpen, searchable]);

  // Scroll highlighted option into view
  useEffect(() => {
    if (highlightedIndex < 0 || !listRef.current) return;
    const items = listRef.current.querySelectorAll("[role='option']");
    items[highlightedIndex]?.scrollIntoView({ block: "nearest" });
  }, [highlightedIndex]);

  // ── Callbacks ─────────────────────────────────────────────────────────────────

  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const term = e.target.value;
      setSearchTerm(term);
      setHighlightedIndex(-1);
      onSearchChange?.(term);
    },
    [onSearchChange],
  );

  const handleOptionClick = useCallback(
    (option: SelectOption) => {
      if (multiple) {
        const current = Array.isArray(value) ? value : [];
        const next = current.includes(option.value)
          ? current.filter((v) => v !== option.value)
          : [...current, option.value];
        onChange?.(next);
      } else {
        onChange?.(option.value);
        close();
      }
    },
    [multiple, value, onChange, close],
  );

  // Commit the current search term as the selected value (free-text mode)
  const commitFreeText = useCallback(() => {
    if (!searchTerm.trim()) return;
    onChange?.(searchTerm.trim());
    close();
  }, [searchTerm, onChange, close]);

  // Keyboard navigation — shared between trigger button and search input
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!isOpen) {
        if (e.key === "Enter" || e.key === " " || e.key === "ArrowDown") {
          e.preventDefault();
          measureTrigger();
          setIsOpen(true);
          setHighlightedIndex(allowFreeText ? -1 : 0);
        }
        return;
      }

      // Build the list indices:
      //   0              → clear row (if hasClear)
      //   hasClear?1:0   → free-text "Use X" row (if allowFreeText && searchTerm)
      //   rest           → regular options
      const hasClear = clearable && hasValue;
      const hasFreeTextRow = allowFreeText && searchTerm.trim().length > 0;
      const extraRows = (hasClear ? 1 : 0) + (hasFreeTextRow ? 1 : 0);
      const totalCount = filteredOptions.length + extraRows;

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setHighlightedIndex((i) => (i + 1) % totalCount);
          break;
        case "ArrowUp":
          e.preventDefault();
          setHighlightedIndex((i) => (i - 1 + totalCount) % totalCount);
          break;
        case "Enter": {
          e.preventDefault();
          // If nothing highlighted and free-text is allowed, commit the typed value
          if (highlightedIndex < 0) {
            if (hasFreeTextRow) commitFreeText();
            break;
          }
          let rowIndex = highlightedIndex;
          if (hasClear && rowIndex === 0) {
            onChange?.(multiple ? [] : ""); close(); break;
          }
          if (hasClear) rowIndex--;
          if (hasFreeTextRow && rowIndex === 0) {
            commitFreeText(); break;
          }
          if (hasFreeTextRow) rowIndex--;
          const option = filteredOptions[rowIndex];
          if (option) handleOptionClick(option);
          break;
        }
        case "Escape":
          e.preventDefault();
          close();
          triggerRef.current?.focus();
          break;
        case "Tab":
          close();
          break;
        default:
          break;
      }
    },
    [isOpen, filteredOptions, highlightedIndex, clearable, hasValue, allowFreeText, searchTerm, multiple, onChange, close, handleOptionClick, measureTrigger, commitFreeText],
  );

  // ── Styles ───────────────────────────────────────────────────────────────────
  const isChip = size === "chip";
  const padY = size === "small" ? "6px" : size === "large" ? "12px" : "9px";
  const fontSize = size === "small" ? "12px" : size === "large" ? "15px" : "13px";

  // Standard rectangular trigger
  const triggerStyle = isChip ? {
    // Pill-shaped compact chip trigger
    display: "inline-flex",
    alignItems: "center",
    gap: 5,
    height: 32,
    padding: "0 10px 0 8px",
    borderRadius: 999,
    border: hasValue
      ? "1.5px solid var(--primary-resonance, #7c3aed)"
      : "1px solid var(--glass-outline, rgba(255,255,255,0.18))",
    background: hasValue
      ? "var(--primary-glow, hsla(272,65%,62%,0.22))"
      : "var(--glass-input, rgba(255,255,255,0.07))",
    color: hasValue ? "var(--primary-resonance, #7c3aed)" : "var(--text-secondary)",
    fontSize: 12,
    fontWeight: hasValue ? 600 : 500,
    fontFamily: "var(--font-body)",
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.5 : 1,
    whiteSpace: "nowrap",
    flexShrink: 0,
    transition: "all 0.15s",
    outline: "none",
    backdropFilter: "blur(8px)",
    boxShadow: isOpen ? "0 0 0 2px var(--primary-glow, hsla(272,65%,62%,0.35))" : "none",
  } : {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    padding: `${padY} 36px ${padY} 12px`,
    fontSize,
    fontFamily: "var(--font-body)",
    borderRadius: "var(--radius-md, 0.5rem)",
    border: error
      ? "1px solid var(--accent-rose, #f87171)"
      : isOpen
        ? "1px solid var(--primary-resonance, #7c3aed)"
        : "1px solid var(--glass-outline, rgba(255,255,255,0.1))",
    background: disabled
      ? "var(--glass-input-disabled, rgba(255,255,255,0.02))"
      : "var(--glass-input, rgba(255,255,255,0.06))",
    color: hasValue ? "var(--text-primary)" : "var(--text-muted)",
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.5 : 1,
    backdropFilter: "blur(8px)",
    boxShadow: isOpen
      ? "0 0 0 2px var(--primary-glow, hsla(272,65%,62%,0.25))"
      : "none",
    transition: "border-color 0.15s, box-shadow 0.15s",
    textAlign: "left",
    position: "relative",
  };

  // ── Option row helper ─────────────────────────────────────────────────────────
  // offsetIndex: position in the full rendered list (clear row = 0 if present)
  const renderOption = (option: SelectOption, listIndex: number, offsetIndex: number) => {
    const isSelected = multiple
      ? Array.isArray(value) && value.includes(option.value)
      : value === option.value;
    const isHighlighted = highlightedIndex === offsetIndex;

    return (
      <li
        key={option.value}
        role="option"
        aria-selected={isSelected}
        // onMouseDown preventDefault keeps focus on the search input so the
        // dropdown doesn't collapse before onClick fires (browser fires blur
        // before click when the focused element loses focus on mousedown).
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => handleOptionClick(option)}
        onMouseEnter={() => setHighlightedIndex(offsetIndex)}
        onMouseLeave={() => setHighlightedIndex(-1)}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "8px 12px",
          fontSize: "13px",
          fontFamily: "var(--font-body)",
          cursor: "pointer",
          color: isSelected
            ? "var(--primary-resonance, #7c3aed)"
            : isHighlighted
              ? "var(--text-primary)"
              : "var(--text-secondary)",
          background: isSelected
            ? "var(--primary-glow, hsla(272,65%,62%,0.15))"
            : isHighlighted
              ? "var(--glass-input, rgba(255,255,255,0.06))"
              : "transparent",
          transition: "background 0.12s, color 0.12s",
        }}
      >
        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: 6 }}>
          {option.icon && (
            typeof option.icon === "string"
              ? <img src={option.icon as string} alt="" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} style={{ width: 20, height: 14, objectFit: "cover", borderRadius: 2, flexShrink: 0 }} />
              : option.icon
          )}
          {option.label}
        </span>
        {isSelected && (
          <Check style={{ width: 13, height: 13, flexShrink: 0, marginLeft: 8 }} />
        )}
      </li>
    );
  };

  const hasClear = clearable && hasValue;

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div
      ref={selectRef}
      className={`relative ${className}`}
      style={{ position: "relative" }}
      {...props}
    >
      {/* ── Trigger ── */}
      <button
        ref={triggerRef}
        type="button"
        id={id}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        style={triggerStyle}
        onClick={handleOpen}
        onKeyDown={handleKeyDown}
        onMouseEnter={(e) => {
          if (!disabled && !isOpen)
            e.currentTarget.style.border = "1px solid var(--border-glow, var(--primary-resonance))";
        }}
        onMouseLeave={(e) => {
          if (!isOpen)
            e.currentTarget.style.border = error
              ? "1px solid var(--accent-rose)"
              : "1px solid var(--glass-outline, rgba(255,255,255,0.1))";
        }}
      >
        {/* ── Chip trigger content ── */}
        {isChip ? (
          <>
            {/* Left: selected flag / chipIcon */}
            {loading ? (
              <Loader2 style={{ width: 11, height: 11, animation: "spin 1s linear infinite", flexShrink: 0 }} />
            ) : selectedIcon ? (
              typeof selectedIcon === "string"
                ? <img src={selectedIcon} alt="" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} style={{ width: 16, height: 11, objectFit: "cover", borderRadius: 2, flexShrink: 0 }} />
                : selectedIcon
            ) : chipIcon ? (
              <span style={{ display: "flex", flexShrink: 0, opacity: hasValue ? 0.8 : 0.55 }}>{chipIcon}</span>
            ) : null}

            {/* Label / value text */}
            <span style={{ maxWidth: 90, overflow: "hidden", textOverflow: "ellipsis" }}>
              {selectedLabel}
            </span>

            {/* Right: inline clear × or collapse chevron */}
            {clearable && hasValue ? (
              <span
                role="button"
                aria-label="Clear filter"
                onMouseDown={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  onChange(multiple ? [] : "");
                }}
                onClick={(e) => e.stopPropagation()}
                style={{ display: "flex", flexShrink: 0, opacity: 0.7 }}
              >
                <X style={{ width: 11, height: 11 }} />
              </span>
            ) : (
              <ChevronDown style={{
                width: 11, height: 11, flexShrink: 0,
                transform: isOpen ? "rotate(180deg)" : "none",
                transition: "transform 0.2s",
                opacity: 0.5,
              }} />
            )}
          </>
        ) : (
          <>
            {/* ── Standard trigger content ── */}
            <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: 6 }}>
              {loading ? (
                <span style={{ color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 6 }}>
                  <Loader2 style={{ width: 13, height: 13, animation: "spin 1s linear infinite" }} />
                  Loading…
                </span>
              ) : (
                <>
                  {selectedIcon && (
                    typeof selectedIcon === "string"
                      ? <img src={selectedIcon} alt="" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} style={{ width: 20, height: 14, objectFit: "cover", borderRadius: 2, flexShrink: 0 }} />
                      : selectedIcon
                  )}
                  {selectedLabel}
                </>
              )}
            </span>
            <span
              style={{
                position: "absolute",
                right: 10,
                top: "50%",
                transform: `translateY(-50%) rotate(${isOpen ? 180 : 0}deg)`,
                transition: "transform 0.2s",
                color: "var(--text-muted)",
                display: "flex",
              }}
            >
              <ChevronDown style={{ width: 15, height: 15 }} />
            </span>
          </>
        )}
      </button>

      {/* ── Portal Dropdown — inlined to avoid remount-on-rerender focus loss ── */}
      {portalRoot && ReactDOM.createPortal(
        <div
          role="listbox"
          aria-multiselectable={multiple}
          style={{
            position: "absolute",
            zIndex: 99999,
            top: dropdownPos.top,
            left: dropdownPos.left,
            width: dropdownPos.width,
            background: "var(--glass-surface, rgba(15,15,35,0.96))",
            border: "1px solid var(--glass-outline, rgba(255,255,255,0.12))",
            borderRadius: "var(--radius-md, 0.5rem)",
            backdropFilter: "blur(20px) saturate(150%)",
            boxShadow: dropdownPos.flipUp
              ? "0 -16px 40px rgba(0,0,0,0.5)"
              : "0 16px 40px rgba(0,0,0,0.5)",
            maxHeight: dropdownPos.maxHeight || 240,
            overflowY: "auto",
            overflowX: "hidden",
            opacity: isOpen ? 1 : 0,
            transform: isOpen
              ? "translateY(0)"
              : dropdownPos.flipUp ? "translateY(6px)" : "translateY(-6px)",
            pointerEvents: isOpen ? "auto" : "none",
            transition: "opacity 0.15s, transform 0.15s",
          }}
        >
          {/* Search */}
          {searchable && (
            <div style={{ padding: "8px", borderBottom: "1px solid var(--glass-outline)" }}>
              <input
                ref={searchRef}
                type="text"
                value={searchTerm}
                onChange={handleSearchChange}
                onKeyDown={handleKeyDown}
                placeholder="Search…"
                style={{
                  width: "100%",
                  padding: "6px 10px",
                  fontSize: "12px",
                  fontFamily: "var(--font-body)",
                  background: "var(--glass-input, rgba(255,255,255,0.06))",
                  border: "1px solid var(--glass-outline)",
                  borderRadius: "var(--radius-sm, 0.375rem)",
                  color: "var(--text-primary)",
                  outline: "none",
                }}
              />
            </div>
          )}

          {/* Options */}
          <ul ref={listRef} style={{ listStyle: "none", margin: 0, padding: "4px 0" }}>
            {/* Clear row — offset 0 when present */}
            {hasClear && (() => {
              const idx = 0;
              return (
                <li
                  role="option"
                  aria-selected={false}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => { onChange?.(multiple ? [] : ""); close(); }}
                  onMouseEnter={() => setHighlightedIndex(idx)}
                  onMouseLeave={() => setHighlightedIndex(-1)}
                  style={{
                    padding: "8px 12px",
                    fontSize: "12px",
                    color: "var(--accent-rose)",
                    cursor: "pointer",
                    borderBottom: "1px solid var(--glass-outline)",
                    background: highlightedIndex === idx ? "hsla(0,72%,50%,0.08)" : "transparent",
                    transition: "background 0.12s",
                  }}
                >
                  Clear selection
                </li>
              );
            })()}

            {/* Free-text "Use X" row — shown while user is typing */}
            {allowFreeText && searchTerm.trim().length > 0 && (() => {
              const idx = hasClear ? 1 : 0;
              const isHighlighted = highlightedIndex === idx;
              return (
                <li
                  role="option"
                  aria-selected={false}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={commitFreeText}
                  onMouseEnter={() => setHighlightedIndex(idx)}
                  onMouseLeave={() => setHighlightedIndex(-1)}
                  style={{
                    padding: "8px 12px",
                    fontSize: "12px",
                    cursor: "pointer",
                    borderBottom: filteredOptions.length > 0 ? "1px solid var(--glass-outline)" : "none",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    color: isHighlighted ? "var(--text-primary)" : "var(--text-secondary)",
                    background: isHighlighted ? "var(--glass-input, rgba(255,255,255,0.06))" : "transparent",
                    transition: "background 0.12s, color 0.12s",
                  }}
                >
                  <span style={{ fontSize: 11, opacity: 0.6, flexShrink: 0 }}>Use</span>
                  <span style={{ fontWeight: 500 }}>&ldquo;{searchTerm.trim()}&rdquo;</span>
                </li>
              );
            })()}

            {filteredOptions.length === 0 && !allowFreeText ? (
              <li style={{ padding: "10px 12px", fontSize: "12px", color: "var(--text-muted)", textAlign: "center" }}>
                {searchTerm ? "No results" : "No options available"}
              </li>
            ) : filteredOptions.length === 0 && allowFreeText && searchTerm.trim().length === 0 ? (
              <li style={{ padding: "10px 12px", fontSize: "12px", color: "var(--text-muted)", textAlign: "center" }}>
                Type to search…
              </li>
            ) : (
              filteredOptions.map((option, listIndex) => {
                const extraOffset = (hasClear ? 1 : 0) + (allowFreeText && searchTerm.trim().length > 0 ? 1 : 0);
                return renderOption(option, listIndex, listIndex + extraOffset);
              })
            )}
          </ul>

        </div>,
        portalRoot
      )}

      {/* Helper / Error text */}
      {helperText && (
        <p
          style={{
            marginTop: 4,
            fontSize: "11px",
            color: error ? "var(--accent-rose)" : "var(--text-muted)",
          }}
        >
          {helperText}
        </p>
      )}

      {/* Hidden native select for form semantics */}
      <select
        name={name}
        value={multiple ? "" : value || ""}
        onChange={() => { }}
        required={required}
        multiple={multiple}
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
      >
        <option value={value || ""}>{placeholder}</option>
      </select>
    </div>
  );
};

export default Select;
