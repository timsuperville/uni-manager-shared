// @shared/performance/bundleConfig.ts
// Vite build helper — creates a bundle-analysis enabled Vite config variant.
// This module is build-time only; it is NOT imported at runtime.

import { defineConfig, UserConfig } from "vite";
import { visualizer } from "rollup-plugin-visualizer";

/**
 * Wraps an existing Vite `baseConfig` with a Rollup visualizer plugin and
 * manual chunk splitting. Only intended for local bundle-analysis runs.
 *
 * @example
 * // vite.config.ts
 * import { createBundleAnalysisConfig } from '@shared/performance/bundleConfig';
 * export default createBundleAnalysisConfig(baseConfig);
 */
export const createBundleAnalysisConfig = (
  baseConfig: UserConfig,
): UserConfig =>
  defineConfig({
    ...baseConfig,
    build: {
      ...baseConfig.build,
      rollupOptions: {
        ...baseConfig.build?.rollupOptions,
        plugins: [
          ...((baseConfig.build?.rollupOptions?.plugins as unknown[]) ?? []),
          // Visual bundle analysis — output is written next to dist/.
          visualizer({
            filename: "bundle-visualizer.html",
            open: false,
            gzipSize: true,
            brotliSize: true,
          }),
        ],
        output: {
          manualChunks: {
            // Vendor chunks
            react: ["react", "react-dom"],
            router: ["react-router-dom"],
            ui: ["@headlessui/react", "@heroicons/react"],
            utils: ["lodash", "date-fns", "axios"],
            // App-specific chunks
            auth: ["./src/features/auth"],
            dashboard: ["./src/features/dashboard"],
            shared: ["@shared"],
          },
        },
      },
      // Performance optimisations
      minify: "terser",
      terserOptions: {
        compress: {
          drop_console: true,
          drop_debugger: true,
          pure_funcs: ["console.log", "console.info", "console.debug"],
        },
      },
      // Chunk size warnings
      chunkSizeWarningLimit: 500,
    },
  });
