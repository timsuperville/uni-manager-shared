# Uni-Manager Shared Library

The `@shared` package is the **Ecosystem Kernel** — it contains all reusable
React components, hooks, services, utilities, and types consumed by every
Uni-Manager experience layer (admin, church, home, work, personal, playback).

---

## Directory Structure

```text
shared/
├── api/              ← Unified API layer (ApiClient, AuthInterceptor, CacheManager, hooks)
│   └── index.ts      ← @shared/api barrel
│
├── auth/             ← Authentication shell (useAuth, LoginForm, SignupForm, AuthLayout, SSO)
│   └── index.js      ← @shared/auth barrel
│
├── components/       ← All reusable React components (canonical home for UI)
│   ├── ui/           ← Liquid Glass primitives (Modal, Button, Card, Badge, Input…)
│   ├── ErrorMonitoring.jsx   ← ErrorBoundary + initializeMonitoring + global handler
│   ├── ApiProvider.jsx       ← Lightweight React context wrapper for API config
│   ├── PerformanceDashboard.jsx ← Debug overlay (dev-mode perf display)
│   ├── FeedbackQuickAction.jsx  ← Floating feedback widget + silent submit
│   ├── NpsSurvey.jsx            ← NPS prompt overlay
│   ├── ActivityFeed.jsx / AdvancedSearch.jsx / DataExport.jsx / LazyWidget.jsx
│   ├── Mobile*.jsx              ← Mobile-optimised layout & list components
│   ├── Toast.jsx / ToastProvider.jsx / ConfirmDialog.jsx
│   ├── ThemeProvider.jsx / ThemeToggle.jsx / RoleGuard.jsx
│   └── index.js      ← @shared/components barrel
│
├── config/           ← Environment resolution helpers
│   ├── environment.ts    ← getSharedEnvironmentConfig, getApiBaseUrl, getWebSocketUrl
│   └── index.js          ← @shared/config barrel
│
├── context/          ← PresenceContext.tsx / usePresence / PresenceProvider
│   └── index.ts      ← @shared/context barrel (canonical TypeScript)
│
├── data/             ← Static shared datasets
│   ├── integrations.js   ← INTEGRATION_DATABASE, INTEGRATION_CATEGORIES, helpers
│   └── index.js          ← @shared/data barrel
│
├── hooks/            ← Cross-app React hooks
│   ├── useAuth.js / useLogin.js
│   ├── useAdvancedSearch.js / useCachedPersonalization.js / useUserPreferences.js
│   ├── useDebounce.js
│   ├── useNpsPulse.js / useFrustrationDetector.js
│   ├── useRealTime.js / useWebSocket.js / useOnlineStatus.js
│   ├── useNotifications.js / useNotificationPreferences.js
│   └── index.js      ← @shared/hooks barrel
│
├── monitoring/       ← SHIM ONLY — re-exports from components/ErrorMonitoring
│   └── ErrorMonitoring.jsx  ← import from "@shared/monitoring/ErrorMonitoring" still works
│
├── performance/      ← Build-time performance config + runtime utilities
│   ├── PerformanceDashboard.jsx  ← SHIM — re-exports from components/
│   ├── lazyLoading.jsx / performanceOptimizations.jsx / performanceUtils.jsx
│   ├── webVitals.js / bundleConfig.js
│   └── index.js      ← @shared/performance barrel
│
├── services/         ← Shared service classes (no React components)
│   ├── ApiProvider.jsx     ← SHIM — re-exports from components/ApiProvider
│   ├── apiService.js       ← Base ApiService class (extended by feature services)
│   ├── analyticsService.js / dataExportService.js / reportingService.js
│   ├── securityAPI.js / LocationService.js / pwaNotificationService.js
│   ├── developerService.js / webSocketClient.js
│   └── index.js      ← @shared/services barrel
│
├── styles/           ← Design system utilities and base CSS
│   ├── styleUtils.js     ← flex(), sp(), glass(), textPrimary, textMuted, selectBase…
│   └── design-system.css ← base CSS custom property declarations
│
├── testing/          ← Shared test infrastructure (consolidated from test-utils/ + tests/)
│   ├── test-utils.jsx       ← renderWithProviders, createMockUser, waitForLoad
│   ├── router-utils.jsx     ← renderWithRouter, MemoryRouterWrapper
│   ├── setup.js             ← global vitest/jest environment setup
│   ├── linkValidator.js     ← validateLinks, findLinks, extractRoutes
│   ├── vitest.config.shared.js   ← base vitest config each app extends
│   └── index.js      ← @shared/testing barrel
│
├── types/            ← JSDoc @typedef declarations (IDE intellisense, no runtime cost)
│   └── index.js      ← AuthUser, AuthTokens, ApiResponse<T>, PaginatedResponse<T>,
│                        ErrorLogEntry, FeedbackReport, PresenceState, and more
│
└── utils/            ← Pure utility functions
    ├── formatters.js / csvExport.js / userUtils.js
    ├── responsiveUtils.jsx / intelligentCache.js
    └── index.js      ← @shared/utils barrel
```

---

## Import Convention

Always use workspace alias paths — never relative paths across packages:

```js
// ✅ Correct — alias paths
import { Button, Modal } from "@shared/components";
import { useAuth } from "@shared/auth";
import { useNpsPulse } from "@shared/hooks";
import { getApiBaseUrl } from "@shared/api";
import { INTEGRATION_DATABASE } from "@shared/data";
import { flex, textPrimary } from "@shared/styles/styleUtils";
import { ErrorBoundary, initializeMonitoring } from "@shared/monitoring/ErrorMonitoring"; // shim ✅
import { PresenceProvider } from "@shared/context"; // ✅ PresenceContext.tsx

// ❌ Wrong — relative cross-package imports
import { Button } from "../../shared/components/ui/Button";
```

---

## Design System

All `@shared/components/ui/` primitives use **CSS custom property tokens** defined
per-app in each app's `index.css`. See the
[Liquid Glass Spec](../docs/developer/LIQUID_GLASS_SPEC.md) for the full token reference.

```
var(--primary)         var(--bg-surface-1)    var(--glass-border)
var(--text-primary)    var(--text-muted)      var(--cobalt)
var(--success)         var(--warning)         var(--danger)
```

---

## Backwards-Compat Shims

The following paths still work but point to their new canonical location in `components/`:

| Old import path                            | Canonical location                      |
| ------------------------------------------ | --------------------------------------- |
| `@shared/monitoring/ErrorMonitoring`       | `@shared/components`                    |
| `@shared/context` (PresenceProvider)       | `@shared/context` (PresenceContext.tsx) |
| `@shared/performance/PerformanceDashboard` | `@shared/components`                    |
| `@shared/services/ApiProvider`             | `@shared/components`                    |

---

## Adding New Shared Components

1. Create the component in `frontend/shared/components/` (or `ui/` for a primitive)
2. Export it from `components/index.js`
3. If it's a Liquid Glass primitive, also export from `components/ui/index.js`
4. Update this README
5. Run `npm run build` in at least one app to verify the barrel resolves correctly
