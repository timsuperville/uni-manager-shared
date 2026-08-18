import { useEffect, useCallback } from 'react';
import { useCommandContext } from './CommandContext';
import type { Command } from './CommandContext';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface UseCommandPaletteOptions {
  /** If true, registers the global Ctrl+K / ⌘K keyboard handler on document.
   *  Set to true in the outermost Layout only — not in nested components. */
  bindHotkey?: boolean;
}

export interface UseCommandPaletteResult {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
  query: string;
  setQuery: (q: string) => void;
  results: Command[];
  allCommands: Command[];
  handleExecute: (command: Command) => void;
  getNamespaceLabel: (namespace: string) => string;
  NAMESPACE_LABELS: Record<string, string>;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * useCommandPalette
 *
 * Public hook for consuming the Command Palette from any component or Layout.
 *
 * Usage (in Layout.tsx):
 *   const { open, close, isOpen, toggle } = useCommandPalette();
 *
 *   // Register Ctrl+K binding:
 *   useCommandPalette({ bindHotkey: true });
 */
export function useCommandPalette({
  bindHotkey = false
}: UseCommandPaletteOptions = {}): UseCommandPaletteResult {
  const {
    isOpen,
    open,
    close,
    toggle,
    query,
    setQuery,
    results,
    allCommands,
    getNamespaceLabel,
    NAMESPACE_LABELS
  } = useCommandContext();

  const handleExecute = useCallback(
    (command: Command): void => {
      close();
      if (command.type === 'navigation' && command.href) {
        command.onAction?.();
      } else if (command.type === 'action' && command.onAction) {
        command.onAction();
      } else if (command.type === 'search' && command.onAction) {
        command.onAction();
      }
    },
    [close]
  );

  // Global keyboard binding — only mounted from one Layout at a time
  useEffect(() => {
    if (!bindHotkey) return;

    const handler = (e: KeyboardEvent): void => {
      const isMac = navigator.platform?.toLowerCase().includes('mac');
      const modKey = isMac ? e.metaKey : e.ctrlKey;
      if (modKey && e.key === 'k') {
        e.preventDefault();
        toggle();
      }
    };

    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [bindHotkey, toggle]);

  return {
    isOpen,
    open,
    close,
    toggle,
    query,
    setQuery,
    results,
    allCommands,
    handleExecute,
    getNamespaceLabel,
    NAMESPACE_LABELS
  };
}
