import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import process from 'process';

/**
 * Shared Vitest Configuration for Uni-Manager Apps
 *
 * This configuration provides a standardized testing setup across all
 * React applications in the Uni-Manager monorepo.
 *
 * Usage: Import this in your app's vitest.config.js and extend as needed
 */
export const createSharedTestConfig = (appName, customConfig = {}) => {
  const rootDir = resolve(process.cwd(), '../../');

  return defineConfig({
    plugins: [react()],

    // Test environment configuration
    test: {
      // Use jsdom for React component testing
      environment: 'jsdom',

      // Test file patterns
      include: [
        'src/**/*.{test,spec}.{js,jsx,ts,tsx}',
        'tests/**/*.{test,spec}.{js,jsx,ts,tsx}'
      ],

      // Setup files
      setupFiles: ['./tests/setup.js'],

      // Global test configuration
      globals: true,

      // Coverage configuration
      coverage: {
        provider: 'v8',
        reporter: ['text', 'json', 'html'],
        exclude: [
          'node_modules/',
          'dist/',
          'build/',
          'coverage/',
          '**/*.config.{js,ts}',
          '**/*.d.ts',
          'tests/setup.js',
          'src/**/*.stories.{js,jsx,ts,tsx}',
          'src/**/__mocks__/**',
          'src/**/mocks/**'
        ],
        thresholds: {
          global: {
            branches: 70,
            functions: 70,
            lines: 70,
            statements: 70
          }
        }
      }
    },

    // Module resolution
    resolve: {
      alias: {
        '@': resolve(process.cwd(), './src'),
        '@shared': resolve(rootDir, './shared'),
        '@tests': resolve(process.cwd(), './tests')
      }
    },

    // ESBuild configuration for JSX
    esbuild: {
      jsx: 'react',
      jsxImportSource: 'react',
      jsxFactory: 'React.createElement',
      jsxFragment: 'React.Fragment'
    },

    // SSR configuration for proper module handling
    ssr: {
      noExternal: [
        'react',
        'react-dom',
        'react-router',
        'react-router-dom',
        '@testing-library/react',
        '@testing-library/jest-dom'
      ]
    },

    // Merge any app-specific configuration
    ...customConfig
  });
};

// Default export for direct usage
export default createSharedTestConfig('default');
