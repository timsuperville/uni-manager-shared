#!/usr/bin/env node
/* global process */

/**
 * Test Infrastructure Generator
 *
 * Deploys unified test management system to frontend apps.
 * Creates consistent test infrastructure across all applications.
 */

import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class TestInfrastructureGenerator {
  constructor() {
    this.sharedDir = join(__dirname, '..');
    this.templatePath = join(
      this.sharedDir,
      'testing',
      'test-manager.template.js'
    );
    this.appsDir = join(this.sharedDir, '..', 'apps');

    // Apps that need unified test infrastructure (business → work, Cycle #440)
    this.targetApps = ['admin', 'home', 'work', 'personal', 'playback'];
  }

  async generateTestManager(appName) {
    console.log(`🔧 Generating test manager for ${appName} app...`);

    const appDir = join(this.appsDir, appName);
    const srcDir = join(appDir, 'src');
    const testManagerPath = join(srcDir, 'test-manager.js');

    if (!existsSync(appDir)) {
      console.error(`❌ App directory not found: ${appDir}`);
      return false;
    }

    if (!existsSync(srcDir)) {
      mkdirSync(srcDir, { recursive: true });
    }

    // Generate app-specific test manager
    const testManagerContent = this.createAppTestManager(appName);
    writeFileSync(testManagerPath, testManagerContent, 'utf8');

    console.log(`✅ Created test manager for ${appName}: ${testManagerPath}`);
    return true;
  }

  createAppTestManager(appName) {
    return `#!/usr/bin/env node

/**
 * Unified Test Management System - ${appName.toUpperCase()} App
 *
 * Centralized test runner that discovers and executes tests
 * without cluttering package.json with individual test scripts.
 */

import { execSync } from 'child_process';
import { existsSync, readdirSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { glob } from 'glob';

const __filename = fileURLToPath(import.meta.url);
const __dirname = join(__filename, '..');

class UnifiedTestManager {
  constructor() {
    this.appName = '${appName}';
    this.featuresDir = join(__dirname, 'features');
    this.componentsDir = join(__dirname, 'components');
    this.testsDir = join(__dirname, 'tests');
    this.discoveredSuites = new Map();
    this.options = this.parseArguments();
  }

  parseArguments() {
    const args = process.argv.slice(2);
    const options = {
      feature: null,
      type: null,
      watch: false,
      ui: false,
      coverage: false,
      verbose: false,
      help: false,
      quick: false,
      changed: false,
      all: false,
    };

    for (let i = 0; i < args.length; i++) {
      const arg = args[i];

      if (arg === '--help' || arg === '-h') {
        options.help = true;
      } else if (arg === '--watch' || arg === '-w') {
        options.watch = true;
      } else if (arg === '--ui') {
        options.ui = true;
      } else if (arg === '--coverage' || arg === '-c') {
        options.coverage = true;
      } else if (arg === '--verbose' || arg === '-v') {
        options.verbose = true;
      } else if (arg === '--quick' || arg === '-q') {
        options.quick = true;
      } else if (arg === '--changed') {
        options.changed = true;
      } else if (arg === '--all' || arg === '-a') {
        options.all = true;
      } else if (arg === '--unit') {
        options.type = 'unit';
      } else if (arg === '--integration') {
        options.type = 'integration';
      } else if (!arg.startsWith('-')) {
        options.feature = arg;
      }
    }

    return options;
  }

  async discoverTestSuites() {
    if (this.discoveredSuites.size > 0) {
      return this.discoveredSuites;
    }

    if (this.options.verbose) {
      console.log(\`🔍 Discovering test suites for \${this.appName}...\`);
    }

    try {
      // Discover feature-based tests
      if (existsSync(this.featuresDir)) {
        const features = readdirSync(this.featuresDir, { withFileTypes: true })
          .filter((dirent) => dirent.isDirectory())
          .map((dirent) => dirent.name);

        for (const feature of features) {
          const hasTests = await this.hasFeatureTests(feature);
          if (hasTests) {
            this.discoveredSuites.set(feature, {
              name: feature,
              type: 'feature',
              hasUnit: await this.hasTestType(feature, 'unit'),
              hasIntegration: await this.hasTestType(feature, 'integration'),
            });
          }
        }
      }

      // Discover component tests
      if (existsSync(this.componentsDir)) {
        const componentTests = await glob('**/*.test.{js,jsx}', { cwd: this.componentsDir });
        if (componentTests.length > 0) {
          this.discoveredSuites.set('components', {
            name: 'components',
            type: 'component-tests',
            testFiles: componentTests.length,
          });
        }
      }

      // Discover general tests
      if (existsSync(this.testsDir)) {
        const testFiles = await glob('**/*.test.{js,jsx}', { cwd: this.testsDir });
        if (testFiles.length > 0) {
          this.discoveredSuites.set('general', {
            name: 'general',
            type: 'general-tests',
            testFiles: testFiles.length,
          });
        }
      }

      if (this.options.verbose) {
        console.log(\`📋 Found \${this.discoveredSuites.size} test suites:\`);
        for (const [name, suite] of this.discoveredSuites) {
          console.log(\`   • \${name} (\${suite.type})\`);
        }
      }
    } catch (discoverError) {
      console.error('❌ Error discovering test suites:', discoverError instanceof Error ? discoverError.message : String(discoverError));
    }

    return this.discoveredSuites;
  }

  async hasFeatureTests(feature) {
    const testPatterns = [
      join(this.featuresDir, feature, '**', '*.test.{js,jsx}'),
      join(this.featuresDir, feature, 'tests', '**', '*.test.{js,jsx}')
    ];

    for (const pattern of testPatterns) {
      try {
        const testFiles = await glob(pattern);
        if (testFiles.length > 0) return true;
      } catch (_err) {
        globalThis.conditionalLog?.('warn', '[EmptyCatch]', _err);
        // Intentionally silent — pattern may not match any path; try next pattern
      }
    }
    return false;
  }

  async hasTestType(feature, type) {
    const testDir = join(this.featuresDir, feature, 'tests', type);
    if (!existsSync(testDir)) return false;

    try {
      const testFiles = await glob('**/*.test.{js,jsx}', { cwd: testDir });
      return testFiles.length > 0;
    } catch (_err) {
      // Intentionally silent — directory exists but is not readable; treat as no tests
      return false;
    }
  }

  showHelp() {
    console.log(\`
🧪 UNIFIED TEST MANAGEMENT SYSTEM - \${this.appName.toUpperCase()}

USAGE:
  npm test [feature] [options]
  npm test [target] [options]

FEATURE TESTING:
  npm test [feature]              # All tests for specific feature
  npm test [feature] --unit       # Feature unit tests only
  npm test [feature] --integration # Feature integration tests
  npm test components             # Component tests
  npm test general                # General/shared tests

SCOPE OPTIONS:
  --all, -a                      # Run all available tests
  --changed                      # Run tests for changed files only
  --quick, -q                    # Fast execution with fail-fast

TEST TYPE OPTIONS:
  --unit                         # Unit tests only
  --integration                  # Integration tests only

EXECUTION OPTIONS:
  --watch, -w                    # Watch mode
  --ui                           # Open test UI
  --coverage, -c                 # Generate coverage report
  --verbose, -v                  # Verbose output
  --help, -h                     # Show this help

EXAMPLES:
  npm test --all --coverage              # All tests with coverage
  npm test components --watch            # Watch component tests
  npm test [feature] --unit --verbose    # Feature unit tests with details
    \`);
  }

  async run() {
    if (this.options.help) {
      this.showHelp();
      return;
    }

    await this.discoverTestSuites();

    if (this.options.ui) {
      return this.runUIMode();
    }

    if (this.options.watch) {
      return this.runWatchMode();
    }

    if (this.options.all) {
      return this.runAllTests();
    }

    if (this.options.feature) {
      return this.runFeatureTests(this.options.feature);
    }

    if (this.options.changed) {
      return this.runChangedTests();
    }

    return this.runDefaultTests();
  }

  async runFeatureTests(featureName) {
    const suite = this.discoveredSuites.get(featureName);
    if (!suite) {
      console.error(\`❌ Feature "\${featureName}" not found.\`);
      console.log('\\n📋 Available test suites:');
      for (const [name, info] of this.discoveredSuites) {
        console.log(\`   • \${name} (\${info.type})\`);
      }
      return;
    }

    console.log(\`🧪 Running \${featureName} tests...\`);

    let command = 'npx vitest run';

    if (suite.type === 'feature') {
      if (this.options.type === 'unit') {
        command += \` "src/features/\${featureName}/tests/unit/**/*.test.{js,jsx}"\`;
      } else if (this.options.type === 'integration') {
        command += \` "src/features/\${featureName}/tests/integration/**/*.test.{js,jsx}"\`;
      } else {
        command += \` "src/features/\${featureName}/**/*.test.{js,jsx}"\`;
      }
    } else if (suite.type === 'component-tests') {
      command += ' "src/components/**/*.test.{js,jsx}"';
    } else if (suite.type === 'general-tests') {
      command += ' "src/tests/**/*.test.{js,jsx}"';
    }

    if (this.options.coverage) command += ' --coverage';
    if (this.options.verbose) command += ' --reporter=verbose';

    try {
      execSync(command, { stdio: 'inherit', cwd: process.cwd() });
    } catch (_err) {
      // Intentionally silent — vitest already prints failure output to stdio
      process.exit(1);
    }
  }

  async runAllTests() {
    console.log(\`🚀 Running all available tests for \${this.appName}...\`);

    let command = 'npx vitest run';
    if (this.options.coverage) command += ' --coverage';
    if (this.options.verbose) command += ' --reporter=verbose';

    try {
      execSync(command, { stdio: 'inherit', cwd: process.cwd() });
    } catch (_err) {
      // Intentionally silent — vitest already prints failure output to stdio
      process.exit(1);
    }
  }

  runUIMode() {
    console.log(\`🖥️  Opening test UI for \${this.appName}...\`);
    execSync('npx vitest --ui', { stdio: 'inherit', cwd: process.cwd() });
  }

  runWatchMode() {
    console.log(\`👀 Starting watch mode for \${this.appName}...\`);
    execSync('npx vitest --watch', { stdio: 'inherit', cwd: process.cwd() });
  }

  runChangedTests() {
    console.log(\`📊 Running tests for changed files in \${this.appName}...\`);
    execSync('npx vitest --changed', { stdio: 'inherit', cwd: process.cwd() });
  }

  runDefaultTests() {
    let command = 'npx vitest run';
    if (this.options.coverage) command += ' --coverage';

    console.log(\`🧪 Running default tests for \${this.appName}: \${command}\`);
    execSync(command, { stdio: 'inherit', cwd: process.cwd() });
  }
}

// CLI execution
if (
  process.argv[1] &&
  (process.argv[1].includes('test-manager.js') ||
    import.meta.url.includes(process.argv[1]))
) {
  const manager = new UnifiedTestManager();
  manager.run().catch((runError) => {
    console.error('💥 Test manager failed:', runError instanceof Error ? runError.message : String(runError));
    process.exit(1);
  });
}

export { UnifiedTestManager };`;
  }

  async updatePackageJson(appName) {
    console.log(`📦 Updating package.json for ${appName} app...`);

    const appDir = join(this.appsDir, appName);
    const packageJsonPath = join(appDir, 'package.json');

    if (!existsSync(packageJsonPath)) {
      console.error(`❌ package.json not found: ${packageJsonPath}`);
      return false;
    }

    try {
      const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'));

      // Remove old test scripts
      delete packageJson.scripts['test:run'];

      // Update to unified system
      packageJson.scripts.test = 'node src/test-manager.js';
      packageJson.scripts['test:watch'] = 'node src/test-manager.js --watch';
      packageJson.scripts['test:ui'] = 'node src/test-manager.js --ui';
      packageJson.scripts['test:coverage'] =
        'node src/test-manager.js --coverage';

      writeFileSync(
        packageJsonPath,
        JSON.stringify(packageJson, null, 2),
        'utf8'
      );

      console.log(
        `✅ Updated package.json for ${appName} (4 unified test commands)`
      );
      return true;
    } catch (pkgError) {
      console.error(
        `❌ Failed to update package.json for ${appName}:`,
        pkgError instanceof Error ? pkgError.message : String(pkgError)
      );
      return false;
    }
  }

  async run() {
    console.log('🚀 UNIFIED TEST INFRASTRUCTURE GENERATOR');
    console.log(`📂 Target apps: ${this.targetApps.join(', ')}`);

    let successCount = 0;
    let failureCount = 0;

    for (const appName of this.targetApps) {
      console.log(`\n🔄 Processing ${appName} app...`);

      const testManagerSuccess = await this.generateTestManager(appName);
      const packageJsonSuccess = await this.updatePackageJson(appName);

      if (testManagerSuccess && packageJsonSuccess) {
        console.log(`✅ Successfully upgraded ${appName} app`);
        successCount++;
      } else {
        console.log(`❌ Failed to upgrade ${appName} app`);
        failureCount++;
      }
    }

    console.log(`\n📊 SUMMARY:`);
    console.log(`✅ Successfully upgraded: ${successCount} apps`);
    if (failureCount > 0) {
      console.log(`❌ Failed to upgrade: ${failureCount} apps`);
    }

    if (successCount > 0) {
      console.log(`\n🎯 NEXT STEPS:`);
      console.log('1. Test the new infrastructure: npm test --help');
      console.log('2. Run tests in each app to verify functionality');
      console.log('3. Update root package.json with orchestrator');
    }
  }
}

// CLI execution
if (import.meta.url === `file://${process.argv[1]}`) {
  const generator = new TestInfrastructureGenerator();
  generator.run().catch(generatorError => {
    console.error(
      '💥 Generator failed:',
      generatorError instanceof Error
        ? generatorError.message
        : String(generatorError)
    );
    process.exit(1);
  });
}
