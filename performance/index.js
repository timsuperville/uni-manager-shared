// @shared/performance — Performance utilities barrel
//
// File inventory:
//   webVitals.js              — Core Web Vitals measurement
//   lazyLoading.jsx           — createLazyRoute(), PageSuspense
//   bundleConfig.js           — createBundleAnalysisConfig (Vite build helper)
//   PerformanceDashboard.jsx  — Dev-only web vitals overlay component
//   performanceOptimizations.jsx — Canonical utility set:
//       withMemo, withLazyLoading, useDebounce, useThrottle, useVirtualList,
//       useLazyImage, createAsyncComponent, PerformanceErrorBoundary,
//       PerformanceMonitor, OptimizedList, OptimizedSearchInput
//
// NOTE: performanceUtils.jsx was found to be a near-duplicate of performanceOptimizations.jsx
//       (without displayNames and missing PerformanceMonitor/OptimizedList/OptimizedSearchInput).
//       The optimizations file is the canonical version; utils is kept for internal reference only.

export * from "./webVitals";
export * from "./lazyLoading";
export * from "./bundleConfig";
export { PerformanceDashboard } from "./PerformanceDashboard";
// Canonical performance utility set
export * from "./performanceOptimizations";
