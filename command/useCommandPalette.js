import { useEffect, useCallback } from "react";
import { useCommandContext } from "./CommandContext.jsx";

/**
 * useCommandPalette
 *
 * Public hook for consuming the Command Palette from any component or Layout.
 *
 * Usage (in Layout.jsx):
 *   const { open, close, isOpen, toggle } = useCommandPalette();
 *
 *   // Register Ctrl+K binding:
 *   useCommandPalette({ bindHotkey: true });
 *
 * @param {object}  [options]
 * @param {boolean} [options.bindHotkey=false] — If true, registers the global
 *   Ctrl+K (or ⌘K on Mac) keyboard handler on document. Set to true in the
 *   outermost Layout only — not in nested components — to avoid double-binding.
 */
export function useCommandPalette({ bindHotkey = false } = {}) {
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
    NAMESPACE_LABELS,
  } = useCommandContext();

  const handleExecute = useCallback(
    (command) => {
      close();
      if (command.type === "navigation" && command.href) {
        // Intra-app SPA navigation — caller handles if needed
        // We call onAction if provided (some nav commands have both)
        command.onAction?.();
      } else if (command.type === "action" && command.onAction) {
        command.onAction();
      } else if (command.type === "search" && command.onAction) {
        command.onAction();
      }
    },
    [close],
  );

  // Global keyboard binding — only mounted from one Layout at a time
  useEffect(() => {
    if (!bindHotkey) return;

    const handler = (e) => {
      const isMac = navigator.platform?.toLowerCase().includes("mac");
      const modKey = isMac ? e.metaKey : e.ctrlKey;
      if (modKey && e.key === "k") {
        e.preventDefault();
        toggle();
      }
    };

    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
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
    NAMESPACE_LABELS,
  };
}
