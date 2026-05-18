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
  CommandContext,
  CommandProvider,
  useCommandContext,
  NAMESPACE_LABELS
} from './CommandContext';
export { CommandPalette } from './CommandPalette';
export { useCommandPalette } from './useCommandPalette';
export { useRegisterCommands } from './useRegisterCommands';
