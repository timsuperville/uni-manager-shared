/* eslint-disable */
/**
 * Advanced Vite Bundle Optimization Configuration
 * Provides intelligent code splitting, caching, and performance optimizations
 */

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { visualizer } from 'rollup-plugin-visualizer';
import { createHtmlPlugin } from 'vite-plugin-html';

/**
 * Advanced optimization configuration for production builds
 */
export const createOptimizedConfig = (options = {}) => {
  const {
    appName = 'app',
    target = 150, // Target size in KB
    enableAnalysis = false,
    enableCompression = true,
    enablePWA = false
  } = options;

  return defineConfig({
    plugins: [
      react({
        babel: {
          plugins: [
            // Remove console.log in production
            (process?.env?.NODE_ENV || 'development') === 'production' && [
              'transform-remove-console'
            ]
          ].filter(Boolean)
        }
      }),

      // HTML optimization
      createHtmlPlugin({
        minify: {
          collapseWhitespace: true,
          keepClosingSlash: true,
          removeComments: true,
          removeRedundantAttributes: true,
          removeScriptTypeAttributes: true,
          removeStyleLinkTypeAttributes: true,
          useShortDoctype: true,
          minifyCSS: true,
          minifyJS: true
        }
      }),

      // Bundle analyzer
      enableAnalysis &&
        visualizer({
          filename: `dist/bundle-analysis-${appName}.html`,
          open: true,
          gzipSize: true,
          brotliSize: true
        })
    ].filter(Boolean),

    build: {
      // Target modern browsers for better optimization
      target: 'es2020',

      // Enable minification
      minify: 'terser',

      terserOptions: {
        compress: {
          drop_console: true,
          drop_debugger: true,
          pure_funcs: ['console.log', 'console.info', 'console.debug'],
          passes: 2
        },
        mangle: {
          safari10: true
        },
        format: {
          safari10: true,
          comments: false
        }
      },

      // Source maps for debugging
      sourcemap: process?.env?.NODE_ENV || 'development' !== 'production',

      // CSS code splitting
      cssCodeSplit: true,

      // Rollup options for advanced bundling
      rollupOptions: {
        output: {
          // Intelligent chunk splitting
          manualChunks: id => {
            // Vendor chunk for node_modules
            if (id.includes('node_modules')) {
              // React ecosystem
              if (id.includes('react') || id.includes('react-dom')) {
                return 'react-vendor';
              }

              // Router
              if (id.includes('react-router')) {
                return 'router-vendor';
              }

              // UI libraries
              if (id.includes('@mui') || id.includes('material-ui')) {
                return 'ui-vendor';
              }

              // Charts and visualization
              if (
                id.includes('chart') ||
                id.includes('d3') ||
                id.includes('recharts')
              ) {
                return 'charts-vendor';
              }

              // Date libraries
              if (
                id.includes('date-fns') ||
                id.includes('moment') ||
                id.includes('dayjs')
              ) {
                return 'date-vendor';
              }

              // Utilities
              if (
                id.includes('lodash') ||
                id.includes('ramda') ||
                id.includes('underscore')
              ) {
                return 'utils-vendor';
              }

              // HTTP libraries
              if (id.includes('axios') || id.includes('fetch')) {
                return 'http-vendor';
              }

              // Form libraries
              if (id.includes('formik') || id.includes('react-hook-form')) {
                return 'forms-vendor';
              }

              // Animation libraries
              if (id.includes('framer-motion') || id.includes('react-spring')) {
                return 'animation-vendor';
              }

              // Other large vendors
              return 'vendor';
            }

            // App-specific chunks
            if (id.includes('src/features/')) {
              const feature = id.split('src/features/')[1].split('/')[0];
              return `feature-${feature}`;
            }

            if (id.includes('src/components/')) {
              return 'components';
            }

            if (id.includes('src/hooks/')) {
              return 'hooks';
            }

            if (id.includes('src/utils/')) {
              return 'utils';
            }

            if (id.includes('src/services/')) {
              return 'services';
            }
          },

          // Optimize chunk naming
          chunkFileNames: chunkInfo => {
            const facadeModuleId = chunkInfo.facadeModuleId
              ? chunkInfo.facadeModuleId
                  .split('/')
                  .pop()
                  .replace('.tsx', '')
                  .replace('.jsx', '')
                  .replace('.ts', '')
                  .replace('.js', '')
              : 'chunk';
            return `assets/${facadeModuleId}-[hash].js`;
          },

          // Optimize asset naming
          assetFileNames: assetInfo => {
            const info = assetInfo.name.split('.');
            let extType = info[info.length - 1];

            if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(extType)) {
              extType = 'images';
            } else if (/woff2?|eot|ttf|otf/i.test(extType)) {
              extType = 'fonts';
            }

            return `assets/${extType}/[name]-[hash][extname]`;
          }
        },

        // External dependencies (if needed)
        external: id => {
          // Externalize large dependencies that should be loaded separately
          return false; // Keep everything bundled for now
        }
      },

      // Chunk size warning limit
      chunkSizeWarningLimit: target,

      // Report compressed size
      reportCompressedSize: true,

      // Write bundle info
      write: true
    },

    // Dependency optimization
    optimizeDeps: {
      include: ['react', 'react-dom', 'react-router-dom'],
      exclude: [
        // Exclude dev dependencies
      ]
    },

    // Development server optimization
    server: {
      hmr: {
        overlay: false
      }
    },

    // CSS optimization
    css: {
      devSourcemap: process?.env?.NODE_ENV || 'development' !== 'production',
      postcss: {
        plugins: [
          // Add PostCSS plugins for optimization
        ]
      }
    },

    // Define global constants
    define: {
      __APP_VERSION__: JSON.stringify(process.env.npm_package_version),
      __BUILD_TIME__: JSON.stringify(new Date().toISOString())
    }
  });
};

/**
 * Bundle analysis utilities
 */
export class BundleAnalyzer {
  static analyzeBundle(buildDir, targetSize = 150) {
    const fs = require('fs');
    const path = require('path');

    if (!fs.existsSync(buildDir)) {
      // console.error('Build directory not found');
      return;
    }

    const distPath = path.join(buildDir, 'assets');
    if (!fs.existsSync(distPath)) {
      // console.error('Assets directory not found');
      return;
    }

    const files = fs
      .readdirSync(distPath)
      .filter(file => file.endsWith('.js'))
      .map(file => {
        const filePath = path.join(distPath, file);
        const stats = fs.statSync(filePath);
        return {
          name: file,
          size: Math.round(stats.size / 1024), // KB
          type: this.getChunkType(file)
        };
      })
      .sort((a, b) => b.size - a.size);

    const totalSize = files.reduce((sum, file) => sum + file.size, 0);

    // console.log("\n🎯 ADVANCED OPTIMIZATION RESULTS');
    // console.log('============================================================');
    // console.log(
    // console.log(`📦 Total bundle size: ${totalSize} KB`);
    // console.log(`🎯 Target size: ${targetSize} KB`);

    if (totalSize <= targetSize) {
      // console.log(`📊 Status: ✅ ${totalSize - targetSize} KB under target`);
    } else {
      // console.log(`📊 Status: ❌ ${totalSize - targetSize} KB over target`);
    }

    // console.log(`📁 Generated chunks: ${files.length}`);
    // console.log('');
    // console.log('✅ Applied optimizations:');
    // console.log('  • Tree-shaking enabled');
    // console.log('  • Intelligent chunk splitting applied');

    if (totalSize > targetSize) {
      // console.log('');
      // console.log('⚠️ Optimization warnings:');
      files.slice(0, 3).forEach(file => {
        if (file.size > targetSize / 4) {
          // console.log(`  • Consider further code splitting`);
          // console.log(`    Chunk: ${file.name} (${file.size} KB)`);
        }
      });

      if (totalSize > targetSize * 1.5) {
        // console.log(
        //  `  • Bundle exceeds target size - consider additional optimizations`
        // );
        // console.log(`    Excess: ${totalSize - targetSize} KB`);
      }
    }

    // console.log('============================================================');

    return {
      totalSize,
      targetSize,
      files,
      isOptimal: totalSize <= targetSize,
      recommendations: this.getRecommendations(files, totalSize, targetSize)
    };
  }

  static getChunkType(filename) {
    if (filename.includes('vendor')) return 'vendor';
    if (filename.includes('react')) return 'react';
    if (filename.includes('router')) return 'router';
    if (filename.includes('ui')) return 'ui';
    if (filename.includes('feature')) return 'feature';
    if (filename.includes('component')) return 'component';
    return 'app';
  }

  static getRecommendations(files, totalSize, targetSize) {
    const recommendations = [];

    // Large chunk recommendations
    files.forEach(file => {
      if (file.size > targetSize / 3) {
        recommendations.push({
          type: 'code-splitting',
          message: `Consider splitting large chunk: ${file.name} (${file.size} KB)`,
          priority: 'high'
        });
      }
    });

    // Overall size recommendations
    if (totalSize > targetSize * 1.5) {
      recommendations.push({
        type: 'bundle-size',
        message: 'Bundle significantly exceeds target size',
        suggestions: [
          'Enable dynamic imports for route-level components',
          'Consider lazy loading for heavy features',
          'Review and remove unused dependencies',
          'Implement virtual scrolling for large lists'
        ],
        priority: 'critical'
      });
    }

    // Vendor chunk recommendations
    const vendorChunks = files.filter(f => f.type === 'vendor');
    if (vendorChunks.length > 0 && vendorChunks[0].size > targetSize / 2) {
      recommendations.push({
        type: 'vendor-optimization',
        message: 'Large vendor chunks detected',
        suggestions: [
          'Split vendor chunks further by library type',
          'Consider CDN for large libraries',
          'Use dynamic imports for optional dependencies'
        ],
        priority: 'medium'
      });
    }

    return recommendations;
  }
}

/**
 * Performance optimization middleware for development
 */
export const developmentOptimizations = {
  // Hot reload optimization
  hmr: {
    port: 24678,
    overlay: true
  },

  // Fast refresh configuration
  fastRefresh: {
    exclude: [/node_modules/]
  },

  // Development server optimization
  server: {
    cors: true,
    hmr: true
  }
};

export default {
  createOptimizedConfig,
  BundleAnalyzer,
  developmentOptimizations
};
