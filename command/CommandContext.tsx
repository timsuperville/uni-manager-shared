import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
} from "react";

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
 *   Each app mounts <CommandProvider> once in App.tsx, wrapping the Router.
 *   Each feature registers commands via useRegisterCommands().
 *   CommandPalette reads/writes this context.
 *   Layouts mount <CommandPalette /> and bind Ctrl+K.
 */

// ── Types ───────────────────────────────────────────────────────────────────

export type CommandType = "navigation" | "action" | "search";

export type CommandNamespace =
  | "work"
  | "church"
  | "home"
  | "personal"
  | "playback"
  | "admin"
  | "universal";

/** A registered command schema. */
export interface Command {
  /** Unique id (e.g. "work:create-invoice") */
  id: string;
  /** App/feature bucket (e.g. "work", "church", "home") */
  namespace: CommandNamespace;
  /** Displayed in the palette */
  label: string;
  /** Subtitle / hint text */
  description?: string;
  /** Extra searchable tokens */
  keywords?: string[];
  /** Icon component */
  icon?: React.ReactNode;
  type: CommandType;
  /** For type=navigation — intra-app path OR cross-domain URL */
  href?: string;
  /** For type=action */
  onAction?: () => void;
  /** Group label shown in results */
  section?: string;
  /** Displayed in the palette, e.g. ["⌘", "I"] */
  shortcut?: string[];
}

interface CommandContextValue {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
  query: string;
  setQuery: React.Dispatch<React.SetStateAction<string>>;
  registerCommands: (commands: Command[]) => () => void;
  results: Command[];
  allCommands: Command[];
  getNamespaceLabel: (ns: string) => string;
  NAMESPACE_LABELS: Record<string, string>;
}

interface CommandProviderProps {
  children: React.ReactNode;
}

// ── Constants ───────────────────────────────────────────────────────────────

export const NAMESPACE_LABELS: Record<CommandNamespace | string, string> = {
  work: "Business Hub",
  church: "Church Suite",
  home: "Home Nucleus",
  personal: "Personal Sanctuary",
  playback: "Playback Engine",
  admin: "Platform Command",
  universal: "Ecosystem",
};

// ── Helpers ─────────────────────────────────────────────────────────────────

function filterCommands(commands: Command[], query: string): Command[] {
  if (!query || query.trim() === "") return commands;

  const lq = query.toLowerCase().trim();

  // Namespace-scoped prefix: ">work:", ">ch:", etc.
  let nsFilter: string | null = null;
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

// ── Context ──────────────────────────────────────────────────────────────────

export const CommandContext = createContext<CommandContextValue | null>(null);

// ── Provider ─────────────────────────────────────────────────────────────────

export function CommandProvider({ children }: CommandProviderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const commandsRef = useRef<Command[]>([]);
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
  const registerCommands = useCallback((newCommands: Command[]) => {
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

  const value: CommandContextValue = {
    isOpen,
    open,
    close,
    toggle,
    query,
    setQuery,
    registerCommands,
    results,
    allCommands: commandsRef.current,
    getNamespaceLabel: (ns: string) => NAMESPACE_LABELS[ns] ?? ns,
    NAMESPACE_LABELS,
  };

  return (
    <CommandContext.Provider value={value}>{children}</CommandContext.Provider>
  );
}

// ── Hook ─────────────────────────────────────────────────────────────────────

/** Low-level context consumer — prefer useCommandPalette() in app code */
export function useCommandContext(): CommandContextValue {
  const ctx = useContext(CommandContext);
  if (!ctx) {
    throw new Error(
      "useCommandContext must be used inside <CommandProvider>. " +
        "Mount <CommandProvider> in App.tsx before the Router.",
    );
  }
  return ctx;
}
