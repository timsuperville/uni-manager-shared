import React, { useRef, useId } from "react";
import { Search, X, Loader2 } from "lucide-react";

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
  inputRef?: React.RefObject<HTMLInputElement>;
  "aria-label"?: string;
}

const SIZE_TOKENS: Record<SearchInputSize, { padding: string; fontSize: string; iconSize: number; clearSize: number }> = {
  sm: { padding: "6px 10px 6px 32px", fontSize: "13px", iconSize: 14, clearSize: 14 },
  md: { padding: "9px 12px 9px 38px", fontSize: "14px", iconSize: 16, clearSize: 16 },
  lg: { padding: "12px 14px 12px 44px", fontSize: "15px", iconSize: 18, clearSize: 17 },
};

/** SearchInput — Liquid Glass search field with clear button and loading state. */
export function SearchInput({
  id: idProp, value = "", onChange, onSubmit, onClear,
  placeholder = "Search...", loading = false, disabled = false,
  size = "md", autoFocus = false, className = "", inputRef: externalRef,
  "aria-label": ariaLabel,
}: SearchInputProps) {
  const generatedId = useId();
  const id = idProp ?? `search-input-${generatedId}`;
  const internalRef = useRef<HTMLInputElement>(null);
  const ref = externalRef ?? internalRef;
  const sz = SIZE_TOKENS[size] ?? SIZE_TOKENS.md;

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && onSubmit) { e.preventDefault(); onSubmit(e); }
    if (e.key === "Escape") handleClear();
  };

  const handleClear = () => { onChange(""); onClear?.(); ref.current?.focus(); };
  const hasValue = value.length > 0;
  const leftPos = size === "lg" ? "13px" : size === "sm" ? "8px" : "10px";

  return (
    <div className={className} style={{ position: "relative", display: "flex", alignItems: "center" }}>
      <span aria-hidden="true" style={{ position: "absolute", left: leftPos, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", pointerEvents: "none", display: "flex", alignItems: "center", transition: "opacity 0.15s" }}>
        {loading
          ? <Loader2 style={{ width: sz.iconSize, height: sz.iconSize, animation: "spin 0.8s linear infinite" }} />
          : <Search style={{ width: sz.iconSize, height: sz.iconSize }} />}
      </span>
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
        style={{ width: "100%", padding: sz.padding, paddingRight: hasValue ? "36px" : "12px", fontSize: sz.fontSize, fontFamily: "var(--font-body, inherit)", background: "var(--glass-input, var(--bg-surface-1, rgba(255,255,255,0.05)))", border: "1px solid var(--glass-outline, rgba(255,255,255,0.12))", borderRadius: "var(--radius-lg, 0.5rem)", color: "var(--text-primary, inherit)", outline: "none", transition: "border-color 0.15s, box-shadow 0.15s", opacity: disabled ? 0.55 : 1, cursor: disabled ? "not-allowed" : "text" }}
        onFocus={(e) => { e.target.style.borderColor = "var(--border-glow, var(--primary-resonance))"; e.target.style.boxShadow = "0 0 0 3px var(--primary-glow, hsla(272,65%,62%,0.2))"; }}
        onBlur={(e) => { e.target.style.borderColor = "var(--glass-outline, rgba(255,255,255,0.12))"; e.target.style.boxShadow = "none"; }}
      />
      {hasValue && !disabled && !loading && (
        <button
          type="button"
          aria-label="Clear search"
          onClick={handleClear}
          tabIndex={-1}
          style={{ position: "absolute", right: "10px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", padding: "2px", borderRadius: "50%", cursor: "pointer", display: "flex", alignItems: "center", color: "var(--text-muted)", transition: "color 0.15s" }}
          onMouseEnter={(e) => { e.currentTarget.style.color = "var(--text-primary)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = "var(--text-muted)"; }}
        >
          <X style={{ width: sz.clearSize, height: sz.clearSize }} />
        </button>
      )}
    </div>
  );
}

export default SearchInput;
