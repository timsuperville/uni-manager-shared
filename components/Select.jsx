// Unified Select component — Liquid Glass Design System
import React, { useState, useRef, useEffect, useCallback } from "react";
import PropTypes from "prop-types";
import { ChevronDown, Check, Loader2 } from "lucide-react";

const Select = ({
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
  // variant is accepted but we render one Liquid Glass style
  variant: _variant,
  ...props
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const selectRef = useRef(null);
  const searchRef = useRef(null);

  // Close on outside click
  useEffect(() => {
    const handleOutside = (e) => {
      if (selectRef.current && !selectRef.current.contains(e.target)) {
        setIsOpen(false);
        setSearchTerm("");
        onSearchChange?.("");
      }
    };
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [onSearchChange]);

  // Auto-focus search
  useEffect(() => {
    if (isOpen && searchable && searchRef.current) {
      searchRef.current.focus();
    }
  }, [isOpen, searchable]);

  const handleSearchChange = useCallback(
    (e) => {
      const term = e.target.value;
      setSearchTerm(term);
      onSearchChange?.(term);
    },
    [onSearchChange],
  );

  const filteredOptions =
    searchable && !onSearchChange
      ? options.filter((o) =>
        o.label.toLowerCase().includes(searchTerm.toLowerCase()),
      )
      : options;

  const handleOptionClick = useCallback(
    (option) => {
      if (multiple) {
        const current = Array.isArray(value) ? value : [];
        const next = current.includes(option.value)
          ? current.filter((v) => v !== option.value)
          : [...current, option.value];
        onChange(next);
      } else {
        onChange(option.value);
        setIsOpen(false);
        setSearchTerm("");
        onSearchChange?.("");
      }
    },
    [multiple, value, onChange, onSearchChange],
  );

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

  const padY = size === "small" ? "6px" : size === "large" ? "12px" : "9px";
  const fontSize = size === "small" ? "12px" : size === "large" ? "15px" : "13px";

  // ── Shared inline styles ─────────────────────────────────────────────────────
  const triggerStyle = {
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

  const dropdownStyle = {
    position: "absolute",
    zIndex: 100,
    top: "calc(100% + 4px)",
    left: 0,
    right: 0,
    background: "var(--glass-surface, rgba(15,15,35,0.92))",
    border: "1px solid var(--glass-outline, rgba(255,255,255,0.12))",
    borderRadius: "var(--radius-md, 0.5rem)",
    backdropFilter: "blur(20px) saturate(150%)",
    boxShadow: "0 16px 40px rgba(0,0,0,0.4)",
    maxHeight: 240,
    overflowY: "auto",
    overflowX: "hidden",
    opacity: isOpen ? 1 : 0,
    transform: isOpen ? "translateY(0)" : "translateY(-6px)",
    pointerEvents: isOpen ? "auto" : "none",
    transition: "opacity 0.15s, transform 0.15s",
  };

  return (
    <div
      ref={selectRef}
      className={`relative ${className}`}
      {...props}
    >
      {/* ── Trigger ── */}
      <button
        type="button"
        id={id}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        style={triggerStyle}
        onClick={() => !disabled && setIsOpen((o) => !o)}
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
                  ? <img src={selectedIcon} alt="" style={{ width: 20, height: 14, objectFit: "cover", borderRadius: 2, flexShrink: 0 }} />
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
      </button>

      {/* ── Dropdown ── */}
      <div style={dropdownStyle} role="listbox" aria-multiselectable={multiple}>
        {/* Search */}
        {searchable && (
          <div
            style={{
              padding: "8px",
              borderBottom: "1px solid var(--glass-outline)",
            }}
          >
            <input
              ref={searchRef}
              type="text"
              value={searchTerm}
              onChange={handleSearchChange}
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
        <ul style={{ listStyle: "none", margin: 0, padding: "4px 0" }}>
          {/* Clear option */}
          {clearable && hasValue && (
            <li
              role="option"
              aria-selected={false}
              onClick={() => { onChange(multiple ? [] : ""); setIsOpen(false); }}
              style={{
                padding: "8px 12px",
                fontSize: "12px",
                color: "var(--accent-rose)",
                cursor: "pointer",
                borderBottom: "1px solid var(--glass-outline)",
              }}
            >
              Clear selection
            </li>
          )}

          {filteredOptions.length === 0 ? (
            <li style={{ padding: "10px 12px", fontSize: "12px", color: "var(--text-muted)", textAlign: "center" }}>
              {searchTerm ? "No results" : "No options available"}
            </li>
          ) : (
            filteredOptions.map((option) => {
              const isSelected = multiple
                ? Array.isArray(value) && value.includes(option.value)
                : value === option.value;
              return (
                <li
                  key={option.value}
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => handleOptionClick(option)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "8px 12px",
                    fontSize: "13px",
                    fontFamily: "var(--font-body)",
                    cursor: "pointer",
                    color: isSelected ? "var(--primary-resonance, #7c3aed)" : "var(--text-secondary)",
                    background: isSelected ? "var(--primary-glow, hsla(272,65%,62%,0.15))" : "transparent",
                    transition: "background 0.12s, color 0.12s",
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.background = "var(--glass-input, rgba(255,255,255,0.06))";
                      e.currentTarget.style.color = "var(--text-primary)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.background = "transparent";
                      e.currentTarget.style.color = "var(--text-secondary)";
                    }
                  }}
                >
                  <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: 6 }}>
                    {option.icon && (
                      typeof option.icon === "string"
                        ? <img src={option.icon} alt="" style={{ width: 20, height: 14, objectFit: "cover", borderRadius: 2, flexShrink: 0 }} />
                        : option.icon
                    )}
                    {option.label}
                  </span>
                  {isSelected && (
                    <Check style={{ width: 13, height: 13, flexShrink: 0, marginLeft: 8 }} />
                  )}
                </li>
              );
            })
          )}
        </ul>
      </div>

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

Select.propTypes = {
  options: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      label: PropTypes.string.isRequired,
      // Optional icon: string URL or React element rendered before the label
      icon: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
    }),
  ).isRequired,
  value: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.number,
    PropTypes.arrayOf(PropTypes.oneOfType([PropTypes.string, PropTypes.number])),
  ]),
  onChange: PropTypes.func,
  onSearchChange: PropTypes.func,
  placeholder: PropTypes.string,
  disabled: PropTypes.bool,
  searchable: PropTypes.bool,
  multiple: PropTypes.bool,
  size: PropTypes.oneOf(["small", "medium", "large"]),
  variant: PropTypes.oneOf(["default", "outlined", "filled"]),
  error: PropTypes.bool,
  helperText: PropTypes.string,
  className: PropTypes.string,
  name: PropTypes.string,
  id: PropTypes.string,
  required: PropTypes.bool,
  clearable: PropTypes.bool,
  loading: PropTypes.bool,
};

export default Select;
