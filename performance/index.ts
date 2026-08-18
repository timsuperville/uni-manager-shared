// @shared/performance — Performance utilities barrel
//
// File inventory:
//   webVitals.ts              — Core Web Vitals measurement (class + useWebVitals hook)
//   lazyLoading.tsx           — createLazyRoute(), PageSuspense
//   bundleConfig.ts           — createBundleAnalysisConfig (Vite build-time only)
//   PerformanceDashboard.ts   — Dev-only web vitals overlay component
//   performanceOptimizations.tsx — Canonical utility set:
//       withMemo, withLazyLoading, useDebounce, useThrottle, useVirtualList,
//       useLazyImage, createAsyncComponent, PerformanceErrorBoundary,
//       PerformanceMonitor, OptimizedList, OptimizedSearchInput
//
// NOTE: performanceUtils.tsx was found to be a near-duplicate of performanceOptimizations.tsx
//       (without displayNames and missing PerformanceMonitor/OptimizedList/OptimizedSearchInput).
//       The optimizations file is the canonical version; utils is kept for internal reference only.

export * from './webVitals';
export * from './lazyLoading';
export * from './bundleConfig';
// Canonical performance utility set
export * from './performanceOptimizations';
