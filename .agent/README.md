# Uni-Manager Shared Package — Agent Intelligence Deck

> **Domain Scope**: `@timsuperville/shared` — Canonical design system, UI components, AuthContext, ApiClient, shared hooks, utilities, and TypeScript types.

---

## 🎯 Repository Mission & Identity
This repository provides the single source of truth for the entire Uni-Manager frontend ecosystem. Every UI component, theme token, authentication lifecycle hook, and API transport method consumed by `uni-manager-church`, `uni-manager-life`, `uni-manager-portal`, and `uni-manager-media` originates here.

---

## 🛡️ Core Architectural Mandates
1. **Zero Circular Dependencies**: All modules must maintain a clean acyclic dependency graph. Barrel files in `index.ts` and `*/index.ts` must only re-export stable primitives.
2. **Component Sovereignty**: Shared components must be self-contained, theme-aware (`var(--...)`), and not hardcode application-specific domain routes.
3. **No Direct `fetch` / `axios` in Components**: Components must always consume API operations through custom hooks or typed services (`services/apiService.ts`).
4. **Strict TypeScript Typing**: No `any` escapes in public exports. All exported hooks and components must have complete `Props` and return type contracts.
5. **Universal Test Coverage**: Every utility, hook, and core component must maintain passing Vitest test suites. Always verify with `npm test` and `npm run typecheck`.

---

## ⚡ Quick Operational Reference
- **Package Name**: `@timsuperville/shared`
- **Build / Check Commands**:
  - `npm run typecheck` — Runs `tsc --noEmit` on the shared package.
  - `npm test` — Executes all 25 Vitest test suites (300+ unit tests).
- **Key Modules**:
  - `auth/`: `AuthContext`, `useAuth`, `useChurchRole`, MFA & WebAuthn services.
  - `api/`: `apiService` singleton, `ApiProvider`, Axios interceptors.
  - `components/`: `Button`, `Modal`, `DashboardCard`, `SabbathOverlay`, `TimePicker`, `Calendar`.
  - `styles/`: `styleUtils.ts`, theme resonance tokens (`ecclesiastical-violet`, `obsidian-glass`, `sonic-dark`).
  - `utils/`: `formatters`, `responsiveUtils`, `parseChordPro`, `transposeChordPro`, `logger`.
