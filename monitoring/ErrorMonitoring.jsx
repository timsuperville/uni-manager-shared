/**
 * @shared/monitoring/ErrorMonitoring — Re-export shim
 *
 * ErrorMonitoring has been consolidated into @shared/components.
 * This file preserves backwards compatibility for the 6 app main.jsx
 * files that import directly from this path.
 *
 * New code should import from "@shared/components":
 *   import { ErrorBoundary, initializeMonitoring } from "@shared/components";
 */
export {
  ErrorBoundary,
  setupGlobalErrorHandling,
  installFetchInterceptor,
  setupPerformanceMonitoring,
  setupHealthCheck,
  initializeMonitoring,
} from "../features/monitoring/ErrorMonitoring.jsx";
