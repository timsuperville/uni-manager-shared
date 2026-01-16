#!/usr/bin/env node

/* eslint-disable */
/**
 * Unified Test Management System Template
 *
 * Template for creating consistent test management across all frontend apps.
 * Discovers and executes tests without cluttering package.json.
 *
 * Usage: Copy to app's src/ directory as test-manager.js
 */

import { execSync } from "child_process";
import { existsSync, readdirSync } from "fs";
import { join } from "path";
import { fileURLToPath } from "url";
import { glob } from "glob";

const __filename = fileURLToPath(import.meta.url);
const __dirname = join(__filename, "..");

class UnifiedTestManager {
  constructor(appName = "app") {
    this.appName = appName;
    this.featuresDir = join(__dirname, "features");
    this.testRunnersDir = join(__dirname, "test-runners");
    this.testsDir = join(__dirname, "tests");
    this.discoveredSuites = new Map();
    this.options = this.parseArguments();
  }

  parseArguments() {
    const args = process.argv.slice(2);
    const options = {
      feature: null,
      mode: null,
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

      if (arg === "--help" || arg === "-h") {
        options.help = true;
      } else if (arg === "--watch" || arg === "-w") {
        options.watch = true;
      } else if (arg === "--ui") {
        options.ui = true;
      } else if (arg === "--coverage" || arg === "-c") {
        options.coverage = true;
      } else if (arg === "--verbose" || arg === "-v") {
        options.verbose = true;
      } else if (arg === "--quick" || arg === "-q") {
        options.quick = true;
      } else if (arg === "--changed") {
        options.changed = true;
      } else if (arg === "--all" || arg === "-a") {
        options.all = true;
      } else if (arg === "--unit") {
        options.type = "unit";
      } else if (arg === "--integration") {
        options.type = "integration";
      } else if (arg === "--e2e") {
        options.type = "e2e";
      } else if (arg === "--memory") {
        options.mode = "memory";
      } else if (arg === "--critical") {
        options.mode = "critical";
      } else if (arg === "--comprehensive") {
        options.mode = "comprehensive";
      } else if (arg === "--security") {
        options.mode = "security";
      } else if (!arg.startsWith("-")) {
        options.feature = arg;
      }
    }

    return options;
  }

  async discoverTestSuites() {
    if (this.discoveredSuites.size > 0) {
      return this.discoveredSuites;
    }

    // console.log(`[SEARCH] Discovering test suites for ${this.appName}...`);

    try {
      // Discover feature-based test suites
      if (existsSync(this.featuresDir)) {
        const features = readdirSync(this.featuresDir, { withFileTypes: true })
          .filter((dirent) => dirent.isDirectory())
          .map((dirent) => dirent.name);

        for (const feature of features) {
          const hasTests = await this.hasFeatureTests(feature);
          if (hasTests) {
            this.discoveredSuites.set(feature, {
              name: feature,
              type: "feature",
              hasUnit: await this.hasTestType(feature, "unit"),
              hasIntegration: await this.hasTestType(feature, "integration"),
              hasE2e: await this.hasTestType(feature, "e2e"),
            });
          }
        }
      }

      // Discover general test suites in tests/ directory
      if (existsSync(this.testsDir)) {
        const testFiles = await glob("**/*.test.{js,jsx}", {
          cwd: this.testsDir,
        });
        if (testFiles.length > 0) {
          this.discoveredSuites.set("general", {
            name: "general",
            type: "general-tests",
            testFiles: testFiles.length,
          });
        }
      }

      // Discover mode-based test runners
      if (existsSync(this.testRunnersDir)) {
        const runners = readdirSync(this.testRunnersDir, {
          withFileTypes: true,
        })
          .filter(
            (dirent) => dirent.isFile() && dirent.name.includes("test-runner"),
          )
          .map((dirent) => dirent.name);

        for (const runner of runners) {
          const runnerPath = join(this.testRunnersDir, runner);
          const runnerName = runner.replace(
            /[-.]test[-.]runner\.(js|cjs)$/,
            "",
          );
          this.discoveredSuites.set(`${runnerName}-modes`, {
            name: `${runnerName}-modes`,
            path: runnerPath,
            type: "mode-runner",
          });
        }
      }

      if (this.options.verbose) {
        // console.log(`📋 Found ${this.discoveredSuites.size} test suites:`);
        for (const [name, suite] of this.discoveredSuites) {
          // console.log(`   • ${name} (${suite.type})`);
        }
      }
    } catch (_error) {
      // console.error('[ERROR] Error discovering test suites:', error.message);
    }

    return this.discoveredSuites;
  }

  async hasFeatureTests(feature) {
    const featureTestDir = join(this.featuresDir, feature, "tests");
    if (!existsSync(featureTestDir)) return false;

    try {
      const testFiles = await glob("**/*.test.{js,jsx}", {
        cwd: featureTestDir,
      });
      return testFiles.length > 0;
    } catch {
      return false;
    }
  }

  async hasTestType(feature, type) {
    const testDir = join(this.featuresDir, feature, "tests", type);
    if (!existsSync(testDir)) return false;

    try {
      const testFiles = await glob("**/*.test.{js,jsx}", { cwd: testDir });
      return testFiles.length > 0;
    } catch {
      return false;
    }
  }

  showHelp() {
    console.log(`
    [TEST] UNIFIED TEST MANAGEMENT SYSTEM - ${this.appName.toUpperCase()}

    USAGE:
      npm test [feature] [options]
      npm test [mode] [options]

      FEATURE TESTING:
        npm test [feature]              # All tests for specific feature
        npm test [feature] --unit       # Feature unit tests only
        npm test [feature] --integration # Feature integration tests
        npm test general               # General / shared tests

      MODE TESTING:
        npm test --memory              # Memory-optimized tests
        npm test --critical            # Critical functionality tests
        npm test --comprehensive       # Full comprehensive suite

      SCOPE OPTIONS:
        --all, -a                      # Run all available tests
        --changed                      # Run tests for changed files only
        --quick, -q                    # Fast execution with fail-fast

      TEST TYPE OPTIONS:
        --unit                         # Unit tests only
        --integration                  # Integration tests only
        --e2e                         # End-to-end tests only

      EXECUTION OPTIONS:
        --watch, -w                    # Watch mode
        --ui                          # Open test UI
        --coverage, -c                 # Generate coverage report
        --verbose, -v                  # Verbose output
        --help, -h                     # Show this help

      EXAMPLES:
        npm test auth --unit --coverage        # Auth unit tests with coverage
        npm test --all --verbose              # All tests with details
        npm test --changed --watch            # Watch changed files
    `);
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

    if (this.options.mode) {
      return this.runModeTests(this.options.mode);
    }

    if (this.options.changed) {
      return this.runChangedTests();
    }

    return this.runDefaultTests();
  }

  async runFeatureTests(featureName) {
    const suite = this.discoveredSuites.get(featureName);
    if (!suite) {
      // console.error("[ERROR] Feature '" + featureName + "' not found.");
      // console.log("\n[INFO] Available features:");
      for (const [name, info] of this.discoveredSuites) {
        if (info.type === "feature") {
          // console.log(`   * ${ name } `);
        }
      }
      return;
    }

    // console.log('[TEST] Running ' + featureName + ' tests...');

    let command = "npx vitest run";

    if (this.options.type) {
      command += ` 'src/features/${featureName}/tests/${this.options.type}/**/*.test.{js,jsx}'`;
    } else {
      command += ` 'src/features/${featureName}/tests/**/*.test.{js,jsx}'`;
    }

    if (this.options.coverage) command += " --coverage";
    if (this.options.verbose) command += " --reporter=verbose";

    try {
      execSync(command, { stdio: "inherit", cwd: process.cwd() });
    } catch {
      // console.error(`[ERROR] Tests failed for ${ featureName }`);
      process.exit(1);
    }
  }

  async runModeTests(mode) {
    const suite =
      this.discoveredSuites.get(`${mode} -modes`) ||
      this.discoveredSuites.get("memory-modes");

    if (!suite) {
      // console.error(`[ERROR] Mode runner for '${mode}' not found.`);
      return;
    }

    // console.log(`[TEST] Running ${ mode } mode tests...`);

    const command = `node '${suite.path}' --mode ${mode} `;

    try {
      execSync(command, { stdio: "inherit", cwd: process.cwd() });
    } catch {
      // console.error(`[ERROR] Tests failed for ${ mode } mode`);
      process.exit(1);
    }
  }

  async runAllTests() {
    // console.log(`[START] Running all available tests for ${ this.appName }...`);

    let command = "npx vitest run";
    if (this.options.coverage) command += " --coverage";
    if (this.options.verbose) command += " --reporter=verbose";

    try {
      execSync(command, { stdio: "inherit", cwd: process.cwd() });
    } catch {
      // console.error('[ERROR] Some tests failed');
      process.exit(1);
    }
  }

  runUIMode() {
    // console.log(`[UI] Opening test UI for ${ this.appName }...`);
    const command = "npx vitest --ui";
    execSync(command, { stdio: "inherit", cwd: process.cwd() });
  }

  runWatchMode() {
    // console.log(`[WATCH] Starting watch mode for ${ this.appName }...`);
    const command = "npx vitest --watch";
    execSync(command, { stdio: "inherit", cwd: process.cwd() });
  }

  runChangedTests() {
    // console.log(`[CHANGED] Running tests for changed files in ${ this.appName }...`);
    const command = "npx vitest --changed";
    execSync(command, { stdio: "inherit", cwd: process.cwd() });
  }

  runDefaultTests() {
    let command = "npx vitest run";

    if (this.options.coverage) command += " --coverage";
    if (this.options.type === "unit") command += " src/**/*.test.{js,jsx}";

    // console.log(`[TEST] Running default tests for ${ this.appName }: ${ command } `);
    execSync(command, { stdio: "inherit", cwd: process.cwd() });
  }
}

export { UnifiedTestManager };
