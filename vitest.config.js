/* eslint-disable no-undef */
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
      "@shared": resolve(__dirname, "."),
      "@tests": resolve(__dirname, "./tests"),
      "@testing": resolve(__dirname, "./testing"),
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./testing/setup-simple.js"],
    include: [
      "src/**/*.{test,spec}.{js,jsx,ts,tsx}",
      "tests/**/*.{test,spec}.{js,jsx,ts,tsx}",
      "auth/**/*.{test,spec}.{js,jsx,ts,tsx}",
      "components/**/*.{test,spec}.{js,jsx,ts,tsx}",
      "hooks/**/*.{test,spec}.{js,jsx,ts,tsx}",
      "services/**/*.{test,spec}.{js,jsx,ts,tsx}",
      "utils/**/*.{test,spec}.{js,jsx,ts,tsx}",
      "api/**/*.{test,spec}.{js,jsx,ts,tsx}",
      "features/**/*.{test,spec}.{js,jsx,ts,tsx}",
    ],
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      exclude: [
        "node_modules/",
        "testing/setup.js",
        "**/*.test.{js,jsx}",
        "**/*.spec.{js,jsx}",
        "dist/",
        "build/",
        "coverage/",
        "**/*.config.{js,ts}",
        "**/*.d.ts",
      ],
    },
  },
});
