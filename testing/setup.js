/**
 * Shared Test Setup Configuration
 * Contains common test setup code shared across all apps
 */

import { vi } from "vitest";

// Mock sessionStorage and localStorage globally
const storageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn(),
};

Object.defineProperty(globalThis, "sessionStorage", {
  value: storageMock,
  writable: true,
});

Object.defineProperty(globalThis, "localStorage", {
  value: storageMock,
  writable: true,
});

// Mock Web Crypto API
Object.defineProperty(globalThis, "crypto", {
  value: {
    getRandomValues: vi.fn((arr) => {
      for (let i = 0; i < arr.length; i++) {
        arr[i] = Math.floor(Math.random() * 256);
      }
      return arr;
    }),
    subtle: {
      digest: vi.fn(() => Promise.resolve(new ArrayBuffer(32))),
      encrypt: vi.fn(() => Promise.resolve(new ArrayBuffer(32))),
      decrypt: vi.fn(() => Promise.resolve(new ArrayBuffer(32))),
    },
  },
  writable: true,
});

// Mock window and location for DOM APIs
Object.defineProperty(globalThis, "window", {
  value: {
    location: {
      hostname: "localhost",
      port: "3000",
      protocol: "http:",
      host: "localhost:3000",
      href: "http://localhost:3000",
      pathname: "/",
      search: "",
      hash: "",
    },
    navigator: {
      userAgent: "test-agent",
      language: "en-US",
      platform: "test-platform",
    },
    screen: {
      width: 1920,
      height: 1080,
      colorDepth: 24,
    },
  },
  writable: true,
});

Object.defineProperty(globalThis, "location", {
  value: globalThis.window.location,
  writable: true,
});

Object.defineProperty(globalThis, "navigator", {
  value: globalThis.window.navigator,
  writable: true,
});

Object.defineProperty(globalThis, "screen", {
  value: globalThis.window.screen,
  writable: true,
});

Object.defineProperty(globalThis, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});
