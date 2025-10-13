import { defineConfig } from 'vite';
import { visualizer } from 'rollup-plugin-visualizer';

export const createBundleAnalysisConfig = (baseConfig) => {
  return defineConfig({
    ...baseConfig,
    build: {
      ...baseConfig.build,
      rollupOptions: {
        ...baseConfig.build?.rollupOptions,
        plugins: [
          ...(baseConfig.build?.rollupOptions?.plugins || []),
          // Visual bundle analysis
          visualizer({
            filename: 'bundle-visualizer.html',
            open: false,
            gzipSize: true,
            brotliSize: true
          })
        ],
        output: {
          manualChunks: {
            // Vendor chunks
            react: ['react', 'react-dom'],
            router: ['react-router-dom'],
            ui: ['@headlessui/react', '@heroicons/react'],
            utils: ['lodash', 'date-fns', 'axios'],
            
            // App-specific chunks
            auth: ['./src/features/auth'],
            dashboard: ['./src/features/dashboard'],
            shared: ['@shared']
          }
        }
      },
      // Performance optimizations
      minify: 'terser',
      terserOptions: {
        compress: {
          drop_console: true,
          drop_debugger: true,
          pure_funcs: ['console.log', 'console.info', 'console.debug']
        }
      },
      // Chunk size warnings
      chunkSizeWarningLimit: 500
    }
  });
};