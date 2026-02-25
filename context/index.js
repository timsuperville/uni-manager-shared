/**
 * @shared/context — Re-export shim
 *
 * PresenceContext has been consolidated into @shared/components.
 * This file is kept so that existing `import { PresenceProvider } from "@shared/context"`
 * calls continue to work without requiring a mass refactor.
 *
 * New code should import directly from "@shared/components":
 *   import { PresenceProvider, usePresence } from "@shared/components";
 */
export {
  PresenceProvider,
  usePresence,
  PresenceContext,
} from "../components/PresenceContext.jsx";
