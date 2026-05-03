// Unified Select component — Liquid Glass Design System
// Dropdown is rendered via ReactDOM.createPortal so it escapes any stacking
// context created by backdrop-filter, transform, or will-change on ancestors.
import React from "react";
import ReactDOM from "react-dom";
import { ChevronDown, Check, Loader2, X } from "lucide-react";
import { useSelectState } from "./useSelectState";
export type { SelectOption, SelectValue } from "./useSelectState";

type SelectSize = "small" | "medium" | "large" | "chip";
type SelectVariant = "default" | "outlined" | "filled";

import type { SelectOption, SelectValue } from "./useSelectState";
import { glassBorder } from "@shared/styles/styleUtils";

interface SelectProps extends Omit<
  React.HTMLAttributes<HTMLDivElement>,
  "onChange"
> {
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

const Autocomplete: React.FC<SelectProps> = ({
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
  className = "input-ecclesia",
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
  const {
    isOpen,
    searchTerm,
    highlightedIndex,
    dropdownPos,
    selectRef,
    triggerRef,
    searchRef,
    listRef,
    portalRoot,
    filteredOptions,
    selectedLabel,
    selectedIcon,
    hasValue,
    hasClear,
    handleOpen,
    handleSearchChange,
    handleOptionClick,
    commitFreeText,
    handleKeyDown,
    setHighlightedIndex,
    close,
  } = useSelectState({
    options,
    value,
    onChange,
    onSearchChange,
    disabled,
    searchable,
    multiple,
    clearable,
    allowFreeText,
  });

  // ── Styles ─────────────────────────────────────────────────────────────────
  const isChip = size === "chip";
  const padY = size === "small" ? "6px" : size === "large" ? "12px" : "9px";
  const fontSize =
    size === "small" ? "12px" : size === "large" ? "15px" : "13px";

  const triggerStyle: React.CSSProperties = isChip
    ? {
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        height: 32,
        padding: "0 10px 0 8px",
        borderRadius: 999,
        border: hasValue
          ? "1.5px solid var()"
          : "1px solid var(--glass-outline, rgba(255,255,255,0.18))",
        background: hasValue
          ? "var(--primary-glow, hsla(272,65%,62%,0.22))"
          : "var(--glass-input, rgba(255,255,255,0.07))",
        color: hasValue ? "var()" : "var(--text-secondary)",
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
        boxShadow: isOpen
          ? "0 0 0 2px var(--primary-glow, hsla(272,65%,62%,0.35))"
          : "none",
      }
    : {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        width: "100%",
        padding: `${padY} 36px ${padY} 12px`,
        fontSize,
        fontFamily: "var(--font-body)",
        borderRadius: "var()",
        border: error
          ? "1px solid var()"
          : isOpen
            ? "1px solid var()"
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

  // ── Option row ─────────────────────────────────────────────────────────────
  const renderOption = (
    option: SelectOption,
    _listIndex: number,
    offsetIndex: number,
  ) => {
    const isSelected = multiple
      ? Array.isArray(value) && value.includes(option.value)
      : value === option.value;
    const isHighlighted = highlightedIndex === offsetIndex;
    return (
      <li
        key={option.value}
        role="option"
        aria-selected={isSelected}
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
            ? "var()"
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
        <span
          style={{
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          {option.icon &&
            (typeof option.icon === "string" ? (
              <img
                src={option.icon}
                alt=""
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
                style={{
                  width: 20,
                  height: 14,
                  objectFit: "cover",
                  borderRadius: 2,
                  flexShrink: 0,
                }}
              />
            ) : (
              option.icon
            ))}
          {option.label}
        </span>
        {isSelected && (
          <Check
            style={{ width: 13, height: 13, flexShrink: 0, marginLeft: 8 }}
          />
        )}
      </li>
    );
  };

  // ── Render ─────────────────────────────────────────────────────────────────
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
            e.currentTarget.style.border = "1px solid var()";
        }}
        onMouseLeave={(e) => {
          if (!isOpen)
            e.currentTarget.style.border = error
              ? "1px solid var(--accent-rose)"
              : "1px solid var(--glass-outline, rgba(255,255,255,0.1))";
        }}
      >
        {isChip ? (
          <>
            {loading ? (
              <Loader2
                style={{
                  width: 11,
                  height: 11,
                  animation: "spin 1s linear infinite",
                  flexShrink: 0,
                }}
              />
            ) : selectedIcon ? (
              typeof selectedIcon === "string" ? (
                <img
                  src={selectedIcon}
                  alt=""
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                  style={{
                    width: 16,
                    height: 11,
                    objectFit: "cover",
                    borderRadius: 2,
                    flexShrink: 0,
                  }}
                />
              ) : (
                selectedIcon
              )
            ) : chipIcon ? (
              <span
                style={{
                  display: "flex",
                  flexShrink: 0,
                  opacity: hasValue ? 0.8 : 0.55,
                }}
              >
                {chipIcon}
              </span>
            ) : null}
            <span
              style={{
                maxWidth: 90,
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {selectedLabel ?? placeholder}
            </span>
            {clearable && hasValue ? (
              <span
                role="button"
                aria-label="Clear filter"
                onMouseDown={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  onChange?.(multiple ? [] : "");
                }}
                onClick={(e) => e.stopPropagation()}
                style={{ display: "flex", flexShrink: 0, opacity: 0.7 }}
              >
                <X style={{ width: 11, height: 11 }} />
              </span>
            ) : (
              <ChevronDown
                style={{
                  width: 11,
                  height: 11,
                  flexShrink: 0,
                  transform: isOpen ? "rotate(180deg)" : "none",
                  transition: "transform 0.2s",
                  opacity: 0.5,
                }}
              />
            )}
          </>
        ) : (
          <>
            <span
              style={{
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              {loading ? (
                <span
                  style={{
                    color: "var(--text-muted)",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <Loader2
                    style={{
                      width: 13,
                      height: 13,
                      animation: "spin 1s linear infinite",
                    }}
                  />
                  Loading…
                </span>
              ) : (
                <>
                  {selectedIcon &&
                    (typeof selectedIcon === "string" ? (
                      <img
                        src={selectedIcon}
                        alt=""
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                        }}
                        style={{
                          width: 20,
                          height: 14,
                          objectFit: "cover",
                          borderRadius: 2,
                          flexShrink: 0,
                        }}
                      />
                    ) : (
                      selectedIcon
                    ))}
                  {selectedLabel ?? placeholder}
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

      {/* ── Portal Dropdown ── */}
      {portalRoot &&
        ReactDOM.createPortal(
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
              borderRadius: "var()",
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
                : dropdownPos.flipUp
                  ? "translateY(6px)"
                  : "translateY(-6px)",
              pointerEvents: isOpen ? "auto" : "none",
              transition: "opacity 0.15s, transform 0.15s",
            }}
          >
            {searchable && (
              <div
                style={{
                  padding: "8px",
                  ...glassBorder,
                }}
              >
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
                    borderRadius: "var()",
                    color: "var(--text-primary)",
                    outline: "none",
                    ...glassBorder,
                  }}
                />
              </div>
            )}

            <ul
              ref={listRef}
              style={{ listStyle: "none", margin: 0, padding: "4px 0" }}
            >
              {/* Clear row */}
              {hasClear &&
                (() => {
                  const idx = 0;
                  return (
                    <li
                      role="option"
                      aria-selected={false}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => {
                        onChange?.(multiple ? [] : "");
                        close();
                      }}
                      onMouseEnter={() => setHighlightedIndex(idx)}
                      onMouseLeave={() => setHighlightedIndex(-1)}
                      style={{
                        padding: "8px 12px",
                        fontSize: "12px",
                        color: "var(--accent-rose)",
                        cursor: "pointer",
                        background:
                          highlightedIndex === idx
                            ? "hsla(0,72%,50%,0.08)"
                            : "transparent",
                        transition: "background 0.12s",
                        ...glassBorder,
                      }}
                    >
                      Clear selection
                    </li>
                  );
                })()}

              {/* Free-text "Use X" row */}
              {allowFreeText &&
                searchTerm.trim().length > 0 &&
                (() => {
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
                        borderBottom:
                          filteredOptions.length > 0
                            ? "1px solid var(--glass-outline)"
                            : "none",
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        color: isHighlighted
                          ? "var(--text-primary)"
                          : "var(--text-secondary)",
                        background: isHighlighted
                          ? "var(--glass-input, rgba(255,255,255,0.06))"
                          : "transparent",
                        transition: "background 0.12s, color 0.12s",
                      }}
                    >
                      <span
                        style={{ fontSize: 11, opacity: 0.6, flexShrink: 0 }}
                      >
                        Use
                      </span>
                      <span style={{ fontWeight: 500 }}>
                        &ldquo;{searchTerm.trim()}&rdquo;
                      </span>
                    </li>
                  );
                })()}

              {filteredOptions.length === 0 && !allowFreeText ? (
                <li
                  style={{
                    padding: "10px 12px",
                    fontSize: "12px",
                    color: "var(--text-muted)",
                    textAlign: "center",
                  }}
                >
                  {searchTerm ? "No results" : "No options available"}
                </li>
              ) : filteredOptions.length === 0 &&
                allowFreeText &&
                searchTerm.trim().length === 0 ? (
                <li
                  style={{
                    padding: "10px 12px",
                    fontSize: "12px",
                    color: "var(--text-muted)",
                    textAlign: "center",
                  }}
                >
                  Type to search…
                </li>
              ) : (
                filteredOptions.map((option, listIndex) => {
                  const extraOffset =
                    (hasClear ? 1 : 0) +
                    (allowFreeText && searchTerm.trim().length > 0 ? 1 : 0);
                  return renderOption(
                    option,
                    listIndex,
                    listIndex + extraOffset,
                  );
                })
              )}
            </ul>
          </div>,
          portalRoot,
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
        value={multiple ? "" : (value as string) || ""}
        onChange={() => {}}
        required={required}
        multiple={multiple}
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
      >
        <option value={(value as string) || ""}>{placeholder}</option>
      </select>
    </div>
  );
};

export default Autocomplete;
