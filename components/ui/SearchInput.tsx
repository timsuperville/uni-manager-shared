import React, { useRef, useId, useMemo } from "react";
import { Search, X, Loader2 } from "lucide-react";

// ── Keyframe injection ────────────────────────────────────────────────────────
//
// The `spin` animation is not guaranteed to exist outside Tailwind contexts.
// We inject it once per document so the Loader2 icon actually rotates.

const SPIN_STYLE_ID = "um-search-spin-keyframe";
if (
  typeof document !== "undefined" &&
  !document.getElementById(SPIN_STYLE_ID)
) {
  const style = document.createElement("style");
  style.id = SPIN_STYLE_ID;
  style.textContent = `@keyframes um-spin { to { transform: rotate(360deg); } }`;
  document.head.appendChild(style);
}

// ── CSS class injection ───────────────────────────────────────────────────────
//
// Injecting focus ring and autofill suppression via a real stylesheet lets the
// browser handle :focus pseudo-class correctly — no imperative DOM mutation
// needed in onFocus/onBlur callbacks.

const INPUT_STYLE_ID = "um-search-input-styles";
if (
  typeof document !== "undefined" &&
  !document.getElementById(INPUT_STYLE_ID)
) {
  const style = document.createElement("style");
  style.id = INPUT_STYLE_ID;
  style.textContent = `
    /* Focus ring — uses canonical LG spec tokens (§6) */
    .um-search-field:focus {
      border-color: var(--glass-outline-active, rgba(255,255,255,0.25)) !important;
      box-shadow: 0 0 0 3px var(--primary-glow, hsla(272,65%,62%,0.2)) !important;
    }
    /* Placeholder colour */
    .um-search-field::placeholder {
      color: var(--text-muted, rgba(255,255,255,0.4));
      opacity: 1;
    }
    /* Suppress browser-forced autofill background */
    .um-search-field:-webkit-autofill,
    .um-search-field:-webkit-autofill:hover,
    .um-search-field:-webkit-autofill:focus {
      -webkit-box-shadow: 0 0 0 1000px var(--glass-input, rgba(255,255,255,0.05)) inset !important;
      -webkit-text-fill-color: var(--text-primary) !important;
    }
  `;
  document.head.appendChild(style);
}

// ── Types ─────────────────────────────────────────────────────────────────────

type SearchInputSize = "sm" | "md" | "lg";

interface SearchInputProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  onSubmit?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onClear?: () => void;
  placeholder?: string;
  loading?: boolean;
  disabled?: boolean;
  size?: SearchInputSize;
  autoFocus?: boolean;
  className?: string;
  /** Accepts RefObject, MutableRefObject, or callback refs. */
  inputRef?: React.Ref<HTMLInputElement>;
  "aria-label"?: string;
}

// ── Size tokens ───────────────────────────────────────────────────────────────

const SIZE_TOKENS: Record<
  SearchInputSize,
  { padding: string; fontSize: string; iconSize: number; iconLeft: string }
> = {
  sm: {
    padding: "6px 10px 6px 32px",
    fontSize: "13px",
    iconSize: 14,
    iconLeft: "8px",
  },
  md: {
    padding: "9px 12px 9px 38px",
    fontSize: "14px",
    iconSize: 16,
    iconLeft: "10px",
  },
  lg: {
    padding: "12px 14px 12px 44px",
    fontSize: "15px",
    iconSize: 18,
    iconLeft: "13px",
  },
};

// ── Component ─────────────────────────────────────────────────────────────────

/** SearchInput — Liquid Glass search field with clear button and loading state. */
export function SearchInput({
  id: idProp,
  value = "",
  onChange,
  onSubmit,
  onClear,
  placeholder = "Search...",
  loading = false,
  disabled = false,
  size = "md",
  autoFocus = false,
  className = "",
  inputRef: externalRef,
  "aria-label": ariaLabel,
}: SearchInputProps) {
  const generatedId = useId();
  const id = idProp ?? `search-input-${generatedId}`;
  const internalRef = useRef<HTMLInputElement>(null);
  const ref = externalRef ?? internalRef;
  const sz = SIZE_TOKENS[size] ?? SIZE_TOKENS.md;

  const hasValue = value.length > 0;

  // Memoised style objects — avoids re-creating large literals on every render.
  // display:block is the correct base for an input-with-icon layout.
  // display:flex here is NOT needed — the input fills 100% width on its own —
  // and it causes top:50% on absolutely-positioned children to be computed
  // against a mismatched height, breaking vertical centering.
  const wrapperStyle = useMemo<React.CSSProperties>(
    () => ({ position: "relative", display: "block" }),
    [],
  );

  const iconStyle = useMemo<React.CSSProperties>(
    () => ({
      position: "absolute",
      left: sz.iconLeft,
      top: "50%",
      // lineHeight:0 prevents the span's inline formatting context from
      // adding descender space below the SVG, which would shift the
      // transform origin and make the icon appear too low.
      lineHeight: 0,
      transform: "translateY(-50%)",
      color: "var(--text-muted)",
      pointerEvents: "none",
      transition: "opacity 0.15s",
    }),
    [sz.iconLeft],
  );

  const loaderStyle = useMemo<React.CSSProperties>(
    () => ({
      width: sz.iconSize,
      height: sz.iconSize,
      animation: "um-spin 0.8s linear infinite",
    }),
    [sz.iconSize],
  );

  const searchIconStyle = useMemo<React.CSSProperties>(
    () => ({ width: sz.iconSize, height: sz.iconSize }),
    [sz.iconSize],
  );

  const inputStyle = useMemo<React.CSSProperties>(
    () => ({
      // border-box: total rendered width = 100% of wrapper (padding + border
      // are subtracted from the content area, not added on top). Without this,
      // the input overflows the wrapper by padding+border, pushing the physical
      // border outside the position:relative container that the icons use as
      // their reference frame — causing the "internal border" visual artifact
      // and misaligning the absolutely-positioned icons.
      boxSizing: "border-box",
      // appearance:none removes the browser UA-stylesheet chrome (internal
      // padding, border, box-shadow) that Chrome/Safari/Edge inject into
      // <input> elements, eliminating hidden offsets that shift icon alignment.
      WebkitAppearance: "none",
      appearance: "none",
      width: "100%",
      padding: sz.padding,
      paddingRight: hasValue ? "36px" : "12px",
      fontSize: sz.fontSize,
      fontFamily: "var(--font-body, inherit)",
      background:
        "var(--glass-input, var(--bg-surface-1, rgba(255,255,255,0.05)))",
      border: "1px solid var(--glass-outline, rgba(255,255,255,0.12))",
      borderRadius: "var(--radius-lg, 0.5rem)",
      color: "var(--text-primary, inherit)",
      outline: "none",
      // Transition covers focus ring, border, and the padding-right jump
      // when the clear button appears/disappears.
      transition: "border-color 0.15s, box-shadow 0.15s, padding-right 0.15s",
      opacity: disabled ? 0.55 : 1,
      cursor: disabled ? "not-allowed" : "text",
    }),
    [sz.padding, sz.fontSize, hasValue, disabled],
  );

  const clearBtnStyle = useMemo<React.CSSProperties>(
    () => ({
      position: "absolute",
      // right must leave enough room for the icon + its own 2px padding,
      // producing a ~10px visual gap from the input edge at all sizes.
      right: "8px",
      top: "50%",
      transform: "translateY(-50%)",
      background: "none",
      border: "none",
      // lineHeight:0 prevents inline descender space from shifting the SVG
      // transform origin downward (same fix applied to the search icon span).
      lineHeight: 0,
      padding: "4px",
      borderRadius: "50%",
      cursor: "pointer",
      color: "var(--text-muted)",
      transition: "color 0.1s, background 0.1s",
    }),
    [],
  );

  // ── Handlers ────────────────────────────────────────────────────────────────

  const handleClear = () => {
    onChange("");
    onClear?.();
    // Focus back to the input. Works with both RefObject and callback refs.
    if (ref && typeof ref === "object" && "current" in ref) {
      ref.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && onSubmit) {
      e.preventDefault();
      onSubmit(e);
    }
    if (e.key === "Escape") handleClear();
  };

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div role="search" className={className} style={wrapperStyle}>
      {/* Search / loader icon */}
      <span aria-hidden="true" style={iconStyle}>
        {loading ? (
          <Loader2 style={loaderStyle} />
        ) : (
          <Search style={searchIconStyle} />
        )}
      </span>

      {/* Text field — focus ring handled by .um-search-field CSS class */}
      <input
        ref={ref}
        id={id}
        type="text"
        autoComplete="off"
        spellCheck={false}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        autoFocus={autoFocus}
        aria-label={ariaLabel ?? placeholder}
        className="um-search-field"
        style={inputStyle}
      />

      {/* Clear button */}
      {hasValue && !disabled && !loading && (
        <button
          type="button"
          aria-label="Clear search"
          onClick={handleClear}
          tabIndex={-1}
          style={clearBtnStyle}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = "var(--text-primary)";
            e.currentTarget.style.background =
              "var(--glass-surface, rgba(255,255,255,0.08))";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = "var(--text-muted)";
            e.currentTarget.style.background = "none";
          }}
        >
          <X style={{ width: sz.iconSize, height: sz.iconSize }} />
        </button>
      )}
    </div>
  );
}

export default SearchInput;
