/**
 * Select — Liquid Glass Design System
 * 
 * Design contract:
 *   - Layout        → Tailwind utilities (sizing, rounding, flex)
 *   - Color tokens  → Tailwind [color:var(--*)]
 *   - Dropdown uses ReactDOM.createPortal
 */
import React, { useId } from "react";
import ReactDOM from "react-dom";
import { ChevronDown, Check, Loader2, X } from "lucide-react";
import { useSelectState } from "./useSelectState";
export type { SelectOption, SelectValue } from "./useSelectState";

type SelectSize = "small" | "medium" | "large" | "chip";
type SelectVariant = "default" | "outlined" | "filled";

import type { SelectOption, SelectValue } from "./useSelectState";

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

const SIZE_CLASSES: Record<SelectSize, string> = {
  small: "py-1.5 px-3 text-xs",
  medium: "py-2 px-3 text-sm",
  large: "py-3 px-4 text-sm",
  chip: "h-8 px-2.5 text-xs rounded-full",
};

export const Select: React.FC<SelectProps> = ({
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
  id: idProp,
  required = false,
  clearable = false,
  loading = false,
  onSearchChange,
  allowFreeText = false,
  chipIcon = null,
  variant: _variant,
  ...props
}) => {
  const generatedId = useId();
  const id = idProp ?? `select-${generatedId}`;

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

  const isChip = size === "chip";

  const renderIcon = (icon: React.ReactNode | string, sizeClass = "w-4 h-4") => {
    if (!icon) return null;
    if (typeof icon === "string") {
      return (
        <img
          src={icon}
          alt=""
          onError={(e) => ((e.target as HTMLImageElement).style.display = "none")}
          className={`object-cover rounded-sm shrink-0 ${sizeClass}`}
        />
      );
    }
    return icon;
  };

  const triggerClass = isChip
    ? `inline-flex items-center gap-1.5 transition-all duration-200 outline-none font-medium shrink-0
       ${SIZE_CLASSES.chip}
       ${hasValue ? "bg-(--primary-resonance,#4f46e5) text-white border-transparent" : "[background:var(--bg-surface-1,rgba(255,255,255,0.05))] border border-(--glass-outline,rgba(255,255,255,0.18)) text-(--text-secondary,rgba(255,255,255,0.5))"}
       ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:border-(--primary-resonance,#4f46e5)"}`
    : `flex items-center justify-between w-full lg-input shadow-sm focus:outline-none
       ${SIZE_CLASSES[size]}
       ${error ? "lg-input-error" : ""}
       ${isOpen ? "border-[color:var(--glass-outline-active)] bg-[color-mix(in_srgb,var(--primary-resonance)_10%,transparent)] [box-shadow:0_0_0_3px_var(--primary-glow)]" : ""}`;

  return (
    <div ref={selectRef} className={`relative ${className}`} {...props}>
      <button
        ref={triggerRef}
        type="button"
        id={id}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        onClick={handleOpen}
        onKeyDown={handleKeyDown}
        className={triggerClass}
      >
        {isChip ? (
          <>
            {loading ? (
              <Loader2 className="w-3 h-3 animate-[spin_1000ms_linear_infinite] shrink-0" />
            ) : selectedIcon ? (
              renderIcon(selectedIcon, "w-4 h-3")
            ) : chipIcon ? (
              <span className={`flex shrink-0 ${hasValue ? "opacity-80" : "opacity-55"}`}>
                {chipIcon}
              </span>
            ) : null}
            <span className="max-w-[90px] overflow-hidden text-ellipsis whitespace-nowrap">
              {selectedLabel ?? placeholder}
            </span>
            {clearable && hasValue ? (
              <span
                role="button"
                aria-label="Clear selection"
                onMouseDown={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  onChange?.(multiple ? [] : "");
                }}
                className="flex shrink-0 opacity-70 hover:opacity-100"
              >
                <X className="w-3 h-3" />
              </span>
            ) : (
              <ChevronDown
                className={`w-3 h-3 shrink-0 transition-transform duration-200 opacity-50 ${isOpen ? "rotate-180" : ""}`}
              />
            )}
          </>
        ) : (
          <>
            <span className="flex items-center gap-2 overflow-hidden text-ellipsis whitespace-nowrap">
              {loading ? (
                <span className="flex items-center gap-2 text-(--text-muted)">
                  <Loader2 className="w-3.5 h-3.5 animate-[spin_1000ms_linear_infinite]" />
                  Loading…
                </span>
              ) : (
                <>
                  {selectedIcon && renderIcon(selectedIcon, "w-5 h-3.5")}
                  <span className={hasValue ? "text-(--text-primary)" : "text-(--text-muted)"}>
                    {selectedLabel ?? placeholder}
                  </span>
                </>
              )}
            </span>
            <span className="flex items-center gap-1 shrink-0">
              {hasClear && (
                <button
                  type="button"
                  aria-label="Clear selection"
                  tabIndex={-1}
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    onChange?.(multiple ? [] : "");
                    close();
                  }}
                  className="p-1 rounded-full text-(--text-muted) hover:bg-(--glass-surface-hover) hover:text-(--text-primary) transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
              <ChevronDown
                className={`w-4 h-4 text-(--text-muted) transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
              />
            </span>
          </>
        )}
      </button>

      {helperText && (
        <p className={`mt-1.5 text-xs ${error ? "text-(--danger)" : "text-(--text-muted)"}`}>
          {helperText}
        </p>
      )}

      {isOpen &&
        portalRoot &&
        dropdownPos &&
        ReactDOM.createPortal(
          <div
            className="fixed inset-0 z-[99999]"
            style={{ pointerEvents: "none" }}
          >
            <div
              className="absolute z-[99999] pointer-events-auto backdrop-blur-3xl bg-(--surface-primary) border border-(--glass-outline) rounded-md shadow-lg overflow-hidden"
              style={{
                top: Math.max(8, dropdownPos.top),
                left: dropdownPos.left,
                width: isChip ? Math.max(dropdownPos.width, 220) : dropdownPos.width,
                maxHeight: Math.min(dropdownPos.maxHeight, 350),
                display: "flex",
                flexDirection: "column",
              }}
            >
              {searchable && (
                <div className="p-2 border-b border-(--glass-outline) bg-(--bg-surface-1) sticky top-0 z-10">
                  <input
                    ref={searchRef}
                    type="text"
                    spellCheck={false}
                    onChange={handleSearchChange}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && filteredOptions.length === 0 && allowFreeText) {
                        e.preventDefault();
                        commitFreeText();
                      } else {
                        handleKeyDown(e);
                      }
                    }}
                    placeholder="Search…"
                    className="w-full lg-input py-1.5 px-3 text-sm"
                  />
                </div>
              )}
              <ul
                ref={listRef}
                role="listbox"
                aria-multiselectable={multiple}
                className="overflow-y-auto py-1.5 m-0 p-0 list-none scroll-smooth flex-1"
                style={{ overscrollBehavior: "none" }}
              >
                {filteredOptions.length === 0 ? (
                  <li className="py-6 text-center text-sm text-(--text-muted) font-body">
                    {allowFreeText ? "Press Enter to use this value" : "No options found"}
                  </li>
                ) : (
                  filteredOptions.map((option, offsetIndex) => {
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
                        className={`flex items-center justify-between py-2 px-3 text-[13px] font-body cursor-pointer transition-colors duration-150
                          ${isSelected ? "bg-(--primary-resonance) text-white" : isHighlighted ? "bg-(--glass-surface-hover) text-(--text-primary)" : "text-(--text-secondary)"}`}
                      >
                        <span className="flex items-center gap-1.5 overflow-hidden text-ellipsis whitespace-nowrap">
                          {renderIcon(option.icon, "w-5 h-3.5")}
                          {option.label}
                        </span>
                        {isSelected && <Check className="w-3.5 h-3.5 shrink-0 ml-2" />}
                      </li>
                    );
                  })
                )}
              </ul>
            </div>
          </div>,
          portalRoot
        )}
    </div>
  );
};

export default Select;
