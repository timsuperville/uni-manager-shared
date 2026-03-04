import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
} from "react";
import PropTypes from "prop-types";

/**
 * @shared/command — Universal Command Core
 *
 * CommandContext is the sovereign state manager for the Ctrl+K
 * command palette. It owns:
 *
 *   - open / close lifecycle
 *   - query string
 *   - registered command set (merged from all apps at runtime)
 *   - active suggestion list (filtered results)
 *
 * Architecture:
 *   Each app mounts <CommandProvider> once in App.jsx, wrapping the Router.
 *   Each feature registers commands via useRegisterCommands().
 *   CommandPalette reads/writes this context.
 *   Layouts mount <CommandPalette /> and bind Ctrl+K.
 */

export const CommandContext = createContext(null);

/**
 * A registered command schema:
 * {
 *   id:         string      — unique id (e.g. "work:create-invoice")
 *   namespace:  string      — e.g. "work", "church", "home", "admin", "personal", "playback"
 *   label:      string      — displayed in the palette (e.g. "Create Invoice")
 *   description?: string   — subtitle / hint text
 *   keywords?:  string[]   — extra searchable tokens
 *   icon?:      ReactNode   — icon component
 *   type:       "navigation" | "action" | "search"
 *   href?:      string      — for type=navigation (intra-app path OR cross-domain URL)
 *   onAction?:  () => void  — for type=action
 *   section?:   string      — group label shown in results
 *   shortcut?:  string[]    — e.g. ["⌘", "I"] — displayed in the palette
 * }
 */

const NAMESPACE_LABELS = {
  work: "Business Hub",
  church: "Church Suite",
  home: "Home Nucleus",
  personal: "Personal Sanctuary",
  playback: "Playback Engine",
  admin: "Platform Command",
  universal: "Ecosystem",
};

function filterCommands(commands, query) {
  if (!query || query.trim() === "") return commands;

  const lq = query.toLowerCase().trim();

  // Namespace-scoped prefix: ">work:", ">ch:", etc.
  let nsFilter = null;
  let contentQuery = lq;

  if (lq.startsWith(">")) {
    const rest = lq.slice(1);
    const colonIdx = rest.indexOf(":");
    if (colonIdx !== -1) {
      nsFilter = rest.slice(0, colonIdx).trim();
      contentQuery = rest.slice(colonIdx + 1).trim();
    } else {
      // Just ">word" — treat as namespace prefix
      nsFilter = rest.trim();
      contentQuery = "";
    }
  }

  return commands.filter((cmd) => {
    if (nsFilter) {
      const ns = cmd.namespace?.toLowerCase() ?? "";
      const label = NAMESPACE_LABELS[cmd.namespace]?.toLowerCase() ?? "";
      if (!ns.startsWith(nsFilter) && !label.startsWith(nsFilter)) return false;
    }

    if (!contentQuery) return true;

    const haystack = [
      cmd.label,
      cmd.description,
      cmd.namespace,
      NAMESPACE_LABELS[cmd.namespace],
      ...(cmd.keywords ?? []),
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return haystack.includes(contentQuery);
  });
}

export function CommandProvider({ children }) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const commandsRef = useRef([]);
  const [, forceRender] = useState(0);

  const open = useCallback(() => {
    setIsOpen(true);
    setQuery("");
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    setQuery("");
  }, []);

  const toggle = useCallback(() => {
    setIsOpen((prev) => {
      if (!prev) setQuery("");
      return !prev;
    });
  }, []);

  /**
   * Register an array of commands from a feature/app.
   * Returns a deregister function for cleanup in useEffect.
   *
   * Uses a stable ref to avoid re-renders on every registration.
   */
  const registerCommands = useCallback((newCommands) => {
    // Deduplicate by id — last-write wins
    const ids = new Set(newCommands.map((c) => c.id));
    commandsRef.current = [
      ...commandsRef.current.filter((c) => !ids.has(c.id)),
      ...newCommands,
    ];
    forceRender((n) => n + 1);

    return () => {
      commandsRef.current = commandsRef.current.filter((c) => !ids.has(c.id));
      forceRender((n) => n + 1);
    };
  }, []);

  const results = filterCommands(commandsRef.current, query);

  const value = {
    isOpen,
    open,
    close,
    toggle,
    query,
    setQuery,
    registerCommands,
    results,
    /** All registered commands, unfiltered — for debugging / analytics */
    allCommands: commandsRef.current,
    /** Namespace label resolver */
    getNamespaceLabel: (ns) => NAMESPACE_LABELS[ns] ?? ns,
    NAMESPACE_LABELS,
  };

  return (
    <CommandContext.Provider value={value}>{children}</CommandContext.Provider>
  );
}

CommandProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

/** Low-level context consumer — prefer useCommandPalette() in app code */
export function useCommandContext() {
  const ctx = useContext(CommandContext);
  if (!ctx) {
    throw new Error(
      "useCommandContext must be used inside <CommandProvider>. " +
        "Mount <CommandProvider> in App.jsx before the Router.",
    );
  }
  return ctx;
}

export { NAMESPACE_LABELS };
