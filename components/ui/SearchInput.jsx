import React, { useRef, useId } from "react";
import PropTypes from "prop-types";
import { Search, X, Loader2 } from "lucide-react";

/**
 * SearchInput — Liquid Glass Design System
 *
 * A full-featured search input with:
 *   - Inline search icon (left)
 *   - Live clear (✕) button when the field has a value
 *   - Loading spinner (replaces the search icon while `loading` is true)
 *   - `onSubmit` fired on Enter keypress or form submit (optional)
 *   - Three sizes: "sm" | "md" | "lg"
 *   - Zero hardcoded colours — inherits any app palette via CSS vars
 *
 * @example
 *   <SearchInput
 *     value={query}
 *     onChange={setQuery}
 *     onSubmit={handleSearch}
 *     placeholder="Search churches..."
 *     loading={isSearching}
 *     size="lg"
 *   />
 */
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
}) {
    const generatedId = useId();
    const id = idProp ?? `search-input-${generatedId}`;
    const internalRef = useRef(null);
    const ref = externalRef ?? internalRef;

    // ─── Size tokens ────────────────────────────────────────────────────────────
    const sizes = {
        sm: { padding: "6px 10px 6px 32px", fontSize: "13px", iconSize: 14, clearSize: 14 },
        md: { padding: "9px 12px 9px 38px", fontSize: "14px", iconSize: 16, clearSize: 16 },
        lg: { padding: "12px 14px 12px 44px", fontSize: "15px", iconSize: 18, clearSize: 17 },
    };
    const sz = sizes[size] ?? sizes.md;

    // ─── Handlers ───────────────────────────────────────────────────────────────
    const handleKeyDown = (e) => {
        if (e.key === "Enter" && onSubmit) {
            e.preventDefault();
            onSubmit(e);
        }
        if (e.key === "Escape") {
            handleClear();
        }
    };

    const handleClear = () => {
        onChange("");
        onClear?.();
        // Return focus to the input after clearing
        ref.current?.focus();
    };

    const hasValue = value.length > 0;

    // ─── Right-side slot: clear button or nothing ────────────────────────────────
    const RightSlot = hasValue && !disabled && !loading
        ? () => (
            <button
                type="button"
                aria-label="Clear search"
                onClick={handleClear}
                tabIndex={-1}
                style={{
                    position: "absolute",
                    right: "10px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    padding: "2px",
                    borderRadius: "50%",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    color: "var(--text-muted)",
                    transition: "color 0.15s",
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.color = "var(--text-primary)";
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.color = "var(--text-muted)";
                }}
            >
                <X style={{ width: sz.clearSize, height: sz.clearSize }} />
            </button>
        )
        : null;

    return (
        <div
            className={className}
            style={{ position: "relative", display: "flex", alignItems: "center" }}
        >
            {/* Left icon — spinner while loading, search icon otherwise */}
            <span
                aria-hidden="true"
                style={{
                    position: "absolute",
                    left: size === "lg" ? "13px" : size === "sm" ? "8px" : "10px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "var(--text-muted)",
                    pointerEvents: "none",
                    display: "flex",
                    alignItems: "center",
                    transition: "opacity 0.15s",
                }}
            >
                {loading ? (
                    <Loader2
                        style={{
                            width: sz.iconSize,
                            height: sz.iconSize,
                            animation: "spin 0.8s linear infinite",
                        }}
                    />
                ) : (
                    <Search style={{ width: sz.iconSize, height: sz.iconSize }} />
                )}
            </span>

            <input
                ref={ref}
                id={id}
                type="search"
                autoComplete="off"
                spellCheck={false}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                disabled={disabled}
                autoFocus={autoFocus}
                aria-label={ariaLabel ?? placeholder}
                style={{
                    width: "100%",
                    padding: sz.padding,
                    /* trailing padding so text never hides under the clear button */
                    paddingRight: hasValue ? "36px" : "12px",
                    fontSize: sz.fontSize,
                    fontFamily: "var(--font-body, inherit)",
                    background: "var(--glass-input, var(--bg-surface-1, rgba(255,255,255,0.05)))",
                    border: "1px solid var(--glass-outline, rgba(255,255,255,0.12))",
                    borderRadius: "var(--radius-lg, 0.5rem)",
                    color: "var(--text-primary, inherit)",
                    outline: "none",
                    transition: "border-color 0.15s, box-shadow 0.15s",
                    opacity: disabled ? 0.55 : 1,
                    cursor: disabled ? "not-allowed" : "text",
                    /* reset browser's default search-input chrome */
                    WebkitAppearance: "none",
                    appearance: "none",
                }}
                onFocus={(e) => {
                    e.target.style.borderColor = "var(--border-glow, var(--primary-resonance))";
                    e.target.style.boxShadow = "0 0 0 3px var(--primary-glow, hsla(272,65%,62%,0.2))";
                }}
                onBlur={(e) => {
                    e.target.style.borderColor = "var(--glass-outline, rgba(255,255,255,0.12))";
                    e.target.style.boxShadow = "none";
                }}
            />

            {/* Clear button */}
            {RightSlot && <RightSlot />}
        </div>
    );
}

SearchInput.propTypes = {
    /** HTML id for the input — auto-generated if omitted */
    id: PropTypes.string,
    /** Controlled value */
    value: PropTypes.string.isRequired,
    /** Called with the new string value on every keystroke */
    onChange: PropTypes.func.isRequired,
    /** Called when the user presses Enter or submits the wrapping form */
    onSubmit: PropTypes.func,
    /** Called when the clear (✕) button is clicked — onChange("") is also fired */
    onClear: PropTypes.func,
    placeholder: PropTypes.string,
    /** Shows a spinner and disables the clear button while true */
    loading: PropTypes.bool,
    disabled: PropTypes.bool,
    /** "sm" | "md" | "lg" */
    size: PropTypes.oneOf(["sm", "md", "lg"]),
    autoFocus: PropTypes.bool,
    /** Extra class(es) for the outer wrapper div */
    className: PropTypes.string,
    /** Forward a ref to the underlying <input> element */
    inputRef: PropTypes.shape({ current: PropTypes.any }),
    "aria-label": PropTypes.string,
};

export default SearchInput;
