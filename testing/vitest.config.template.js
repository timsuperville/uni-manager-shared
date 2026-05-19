import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test-setup.js'],
    css: true,
    coverage: {
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/test-setup.js',
        '**/*.config.js',
        'dist/',
        'public/'
      ]
    },
    // Enable progress reporting
    reporter: ['verbose', 'json'],
    outputFile: {
      json: './test-results.json'
    }
  },
  resolve: {
    alias: {
      '@': '/src'
    }
  }
});
