// @shared/testing — Shared test infrastructure
//
// Exports:
//   test-utils.jsx   — renderWithProviders, createMockUser, waitForLoad, etc.
//   router-utils.jsx — renderWithRouter, MemoryRouterWrapper
//   setup.js         — global vitest/jest setup (side-effects only, not re-exported)
//   linkValidator.js — link href validation utility
//
// vitest config templates live here but are not re-exported:
//   vitest.config.shared.js    — base config each app extends
//   vitest.config.template.js  — per-app starter template
//
// Test files (basic.test.js, mfa-api-integration.test.js) run
// under the shared package's own vitest workspace entry.

export * from "./test-utils.jsx";
export * from "./router-utils.jsx";
export {
  extractRoutes,
  isValidPath,
  findLinks,
  validateLinks,
  generateReport,
  toHaveValidLinks,
} from "./linkValidator.js";
