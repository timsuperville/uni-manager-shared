import { useEffect, useRef } from 'react';
import { useCommandContext } from './CommandContext';
import type { Command, CommandNamespace } from './CommandContext';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Partial command shape accepted by useRegisterCommands (namespace will be stamped automatically). */
export type CommandInput = Omit<Command, 'namespace'> & {
  namespace?: CommandNamespace;
};

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * useRegisterCommands
 *
 * Registration hook — each app/feature calls this once at its top-level
 * router component to inject its command schema into the global registry.
 *
 * Commands are automatically cleaned up on unmount via the deregister
 * function returned by CommandContext.registerCommands().
 *
 * Usage (in App.tsx or a top-level component inside CommandProvider):
 *
 *   import { useRegisterCommands } from "@shared/command";
 *   import { useNavigate } from "react-router-dom";
 *
 *   function WorkCommandRegistrar() {
 *     const navigate = useNavigate();
 *     useRegisterCommands("work", [
 *       {
 *         id: "work:dashboard",
 *         label: "Business Dashboard",
 *         type: "navigation",
 *         section: "Navigate",
 *         onAction: () => navigate("/dashboard"),
 *       },
 *     ]);
 *     return null;
 *   }
 *
 * @param namespace - e.g. "work", "church", "home"
 * @param commands  - command schema objects
 * @param deps      - additional deps array (reruns registration when deps change)
 */
export function useRegisterCommands(
  namespace: string,
  commands: CommandInput[],
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  deps: any[] = []
): void {
  const { registerCommands } = useCommandContext();

  // Stamp namespace onto every command so the context doesn't need it separately
  const stamped: Command[] = commands.map(
    cmd => ({ namespace, ...cmd }) as Command
  );

  const stampedRef = useRef<Command[]>(stamped);
  stampedRef.current = stamped;

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    const deregister = registerCommands(stampedRef.current);
    return deregister;
    // deps is intentionally spread here — caller controls re-registration
  }, [registerCommands, namespace, ...deps]);
}
