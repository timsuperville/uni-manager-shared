import { useEffect, useRef } from "react";
import { useCommandContext } from "./CommandContext.jsx";

/**
 * useRegisterCommands
 *
 * Registration hook — each app/feature calls this once at its top-level
 * router component to inject its command schema into the global registry.
 *
 * Commands are automatically cleaned up on unmount via the deregister
 * function returned by CommandContext.registerCommands().
 *
 * Usage (in App.jsx or a top-level component mounted inside CommandProvider):
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
 *         description: "Go to Business Hub dashboard",
 *         type: "navigation",
 *         section: "Navigate",
 *         onAction: () => navigate("/dashboard"),
 *       },
 *       {
 *         id: "work:create-invoice",
 *         label: "Treasury — Create Invoice",
 *         description: "Open Fiduciary Treasury to create an invoice",
 *         type: "navigation",
 *         keywords: ["invoice", "billing", "finance"],
 *         section: "Actions",
 *         onAction: () => navigate("/fiduciary-treasury"),
 *       },
 *     ]);
 *     return null;
 *   }
 *
 * @param {string}   namespace  — e.g. "work", "church", "home"
 * @param {object[]} commands   — command schema objects (see CommandContext.jsx for shape)
 * @param {any[]}    [deps=[]]  — additional deps array (reruns registration when deps change)
 */
export function useRegisterCommands(namespace, commands, deps = []) {
  const { registerCommands } = useCommandContext();

  // Stamp namespace onto every command so the context doesn't need it separately
  const stamped = commands.map((cmd) => ({
    namespace,
    ...cmd,
  }));

  // Stable serialised copy for dep comparison
  const stampedRef = useRef(stamped);
  stampedRef.current = stamped;

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    const deregister = registerCommands(stampedRef.current);
    return deregister;
    // deps is intentionally spread here — caller controls re-registration
  }, [registerCommands, namespace, ...deps]);
}
