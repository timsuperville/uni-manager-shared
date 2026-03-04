/**
 * @shared/command — Universal Command Core (Ctrl+K)
 *
 * Barrel export for the ecosystem-wide command palette system.
 *
 * Usage in App.jsx:
 *   import { CommandProvider } from "@shared/command";
 *   // Wrap your Router with <CommandProvider>
 *
 * Usage in Layout.jsx:
 *   import { CommandPalette, useCommandPalette } from "@shared/command";
 *   // Render <CommandPalette /> and bind hotkey: useCommandPalette({ bindHotkey: true })
 *
 * Usage to register commands:
 *   import { useRegisterCommands } from "@shared/command";
 *   // Call inside a component mounted within CommandProvider + Router scope
 */

export {
  CommandProvider,
  useCommandContext,
  NAMESPACE_LABELS,
} from "./CommandContext.jsx";
export { CommandPalette } from "./CommandPalette.jsx";
export { useCommandPalette } from "./useCommandPalette.js";
export { useRegisterCommands } from "./useRegisterCommands.js";
