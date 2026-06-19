/**
 * useSelectState.ts — Modern UI Design System
 *
 * All state management, derived data, effects, and callbacks for the Select
 * component. Extracted from Select.tsx to keep the render tree focused on JSX.
 */
import { useState, useRef, useEffect, useCallback } from 'react';

export type SelectValue = string | number;

export interface SelectOption {
  value: SelectValue;
  label: string;
  icon?: React.ReactNode | string;
  disabled?: boolean;
}

interface DropdownPos {
  top: number;
  left: number;
  width: number;
  maxHeight: number;
  flipUp: boolean;
}

interface UseSelectStateOptions {
  options: SelectOption[];
  value?: SelectValue | SelectValue[];
  onChange?: (value: SelectValue | SelectValue[]) => void;
  onSearchChange?: (term: string) => void;
  disabled?: boolean;
  searchable?: boolean;
  multiple?: boolean;
  clearable?: boolean;
  allowFreeText?: boolean;
}

export function useSelectState({
  options,
  value,
  onChange,
  onSearchChange,
  disabled = false,
  searchable = false,
  multiple = false,
  clearable = false,
  allowFreeText = false
}: UseSelectStateOptions) {
  // ── State ──────────────────────────────────────────────────────────────────
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [dropdownPos, setDropdownPos] = useState<DropdownPos>({
    top: 0,
    left: 0,
    width: 0,
    maxHeight: 240,
    flipUp: false
  });

  // ── Refs ───────────────────────────────────────────────────────────────────
  const selectRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  // Stable portal root — initialised once, never re-created across renders
  const portalRootRef = useRef<HTMLElement | null>(null);
  if (!portalRootRef.current && typeof document !== 'undefined') {
    let el = document.getElementById('select-portal-root');
    if (!el) {
      el = document.createElement('div');
      el.id = 'select-portal-root';
      document.body.appendChild(el);
    }
    portalRootRef.current = el;
  }
  const portalRoot = portalRootRef.current;

  // ── Derived data ───────────────────────────────────────────────────────────
  const lowerSearch = searchTerm.toLowerCase();
  const filteredOptions =
    searchable && !onSearchChange
      ? // Guard: coerce label to string so a null/undefined/number label from
        // a dynamic API-driven option list never throws "toLowerCase is not a function"
        options.filter(o =>
          String(o.label ?? '')
            .toLowerCase()
            .includes(lowerSearch)
        )
      : options;

  const selectedOption = multiple ? null : options.find(o => o.value === value);
  const selectedLabel = multiple
    ? Array.isArray(value) && value.length > 0
      ? `${value.length} selected`
      : undefined
    : value
      ? (selectedOption?.label ?? value)
      : undefined;
  const selectedIcon = selectedOption?.icon ?? null;
  const hasValue = multiple
    ? Array.isArray(value) && value.length > 0
    : !!value;
  const hasClear = clearable && hasValue;

  // ── Helpers ────────────────────────────────────────────────────────────────

  /** Measure the trigger rect and decide flip-up / max-height for the portal. */
  const measureTrigger = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const GUTTER = 8;
    const CAP = 240;
    const spaceBelow = window.innerHeight - rect.bottom - GUTTER;
    const spaceAbove = rect.top - GUTTER;
    const flipUp = spaceBelow < 180 && spaceAbove > spaceBelow;
    const maxHeight = Math.min(CAP, flipUp ? spaceAbove : spaceBelow);
    setDropdownPos({
      top: flipUp
        ? rect.top + window.scrollY - maxHeight - GUTTER
        : rect.bottom + window.scrollY + GUTTER / 2,
      left: rect.left + window.scrollX,
      width: rect.width,
      maxHeight,
      flipUp
    });
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    setSearchTerm('');
    setHighlightedIndex(-1);
    onSearchChange?.('');
  }, [onSearchChange]);

  const handleOpen = useCallback(() => {
    if (disabled) return;
    measureTrigger();
    setIsOpen(o => {
      if (!o) setHighlightedIndex(-1);
      return !o;
    });
  }, [disabled, measureTrigger]);

  // ── Effects ────────────────────────────────────────────────────────────────

  // Close on outside click — portal is NOT inside selectRef, so check both
  useEffect(() => {
    if (!isOpen) return;
    const handleOutside = (e: MouseEvent) => {
      const inPortal = portalRoot?.contains(e.target as Node);
      const inTrigger = selectRef.current?.contains(e.target as Node);
      if (!inPortal && !inTrigger) close();
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [isOpen, close, portalRoot]);

  // Re-measure on scroll/resize so portal dropdown tracks the trigger
  useEffect(() => {
    if (!isOpen) return;
    const update = () => measureTrigger();
    window.addEventListener('scroll', update, true);
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', update, true);
      window.removeEventListener('resize', update);
    };
  }, [isOpen, measureTrigger]);

  // Auto-focus search input when opened
  useEffect(() => {
    if (isOpen && searchable && searchRef.current) searchRef.current.focus();
  }, [isOpen, searchable]);

  // Scroll highlighted option into view
  useEffect(() => {
    if (highlightedIndex < 0 || !listRef.current) return;
    const items = listRef.current.querySelectorAll("[role='option']");
    items[highlightedIndex]?.scrollIntoView({ block: 'nearest' });
  }, [highlightedIndex]);

  // ── Callbacks ──────────────────────────────────────────────────────────────

  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const term = e.target.value;
      setSearchTerm(term);
      setHighlightedIndex(-1);
      onSearchChange?.(term);
    },
    [onSearchChange]
  );

  const handleOptionClick = useCallback(
    (option: SelectOption) => {
      if (multiple) {
        const current = Array.isArray(value) ? value : [];
        const next = current.includes(option.value)
          ? current.filter(v => v !== option.value)
          : [...current, option.value];
        onChange?.(next);
      } else {
        onChange?.(option.value);
        close();
      }
    },
    [multiple, value, onChange, close]
  );

  const commitFreeText = useCallback(() => {
    if (!searchTerm.trim()) return;
    onChange?.(searchTerm.trim());
    close();
  }, [searchTerm, onChange, close]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!isOpen) {
        if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
          e.preventDefault();
          measureTrigger();
          setIsOpen(true);
          setHighlightedIndex(allowFreeText ? -1 : 0);
        }
        return;
      }

      const hasFreeTextRow = allowFreeText && searchTerm.trim().length > 0;
      const extraRows = (hasClear ? 1 : 0) + (hasFreeTextRow ? 1 : 0);
      const totalCount = filteredOptions.length + extraRows;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setHighlightedIndex(i => (i + 1) % totalCount);
          break;
        case 'ArrowUp':
          e.preventDefault();
          setHighlightedIndex(i => (i - 1 + totalCount) % totalCount);
          break;
        case 'Enter': {
          e.preventDefault();
          if (highlightedIndex < 0) {
            if (hasFreeTextRow) commitFreeText();
            break;
          }
          let rowIndex = highlightedIndex;
          if (hasClear && rowIndex === 0) {
            onChange?.(multiple ? [] : '');
            close();
            break;
          }
          if (hasClear) rowIndex--;
          if (hasFreeTextRow && rowIndex === 0) {
            commitFreeText();
            break;
          }
          if (hasFreeTextRow) rowIndex--;
          const option = filteredOptions[rowIndex];
          if (option) handleOptionClick(option);
          break;
        }
        case 'Escape':
          e.preventDefault();
          close();
          triggerRef.current?.focus();
          break;
        case 'Tab':
          close();
          break;
      }
    },
    [
      isOpen,
      filteredOptions,
      highlightedIndex,
      hasClear,
      allowFreeText,
      searchTerm,
      multiple,
      onChange,
      close,
      handleOptionClick,
      measureTrigger,
      commitFreeText
    ]
  );

  return {
    // State
    isOpen,
    searchTerm,
    highlightedIndex,
    dropdownPos,
    // Refs
    selectRef,
    triggerRef,
    searchRef,
    listRef,
    portalRoot,
    // Derived
    filteredOptions,
    selectedLabel,
    selectedIcon,
    hasValue,
    hasClear,
    // Callbacks
    handleOpen,
    close,
    handleSearchChange,
    handleOptionClick,
    commitFreeText,
    handleKeyDown,
    setHighlightedIndex
  };
}
