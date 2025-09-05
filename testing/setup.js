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

// Add history to window
if (!globalThis.window?.history) {
  globalThis.window = globalThis.window || {};
  globalThis.window.history = {
    pushState: vi.fn(),
    replaceState: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    go: vi.fn(),
    length: 1,
    scrollRestoration: "auto",
    state: null,
  };
}

// Add performance to window - only if it doesn't exist to respect test-specific mocking
if (!globalThis.window?.performance && !globalThis.performance) {
  globalThis.window = globalThis.window || {};
  // Store original performance object to check for memory API availability
  const originalPerformance =
    globalThis.window.performance || globalThis.performance;

  globalThis.window.performance = {
    now: vi.fn(() => Date.now()),
    getEntriesByType: vi.fn(() => []),
    getEntriesByName: vi.fn(() => []),
    mark: vi.fn(),
    measure: vi.fn(),
    clearMarks: vi.fn(),
    clearMeasures: vi.fn(),
    // Only add memory if the original performance object had it AND it's not been mocked to not have it
    // In jsdom, the original performance object doesn't have memory, so we won't add it by default
    ...(originalPerformance?.memory &&
    typeof originalPerformance.memory !== "undefined" &&
    originalPerformance.memory !== null
      ? {
          memory: {
            usedJSHeapSize: 1048576,
            totalJSHeapSize: 2097152,
            jsHeapSizeLimit: 4194304,
          },
        }
      : {}),
  };
}

// Also set globalThis.performance to point to window.performance for consistency
if (!globalThis.performance) {
  Object.defineProperty(globalThis, "performance", {
    value: globalThis.window?.performance,
    writable: true,
  });
} else {
  // If globalThis.performance already exists (e.g., set by a test), make window.performance point to it
  if (!globalThis.window?.performance) {
    globalThis.window = globalThis.window || {};
    globalThis.window.performance = globalThis.performance;
  }
}

// Basic DOM prototype chain setup for React Testing Library compatibility
if (!globalThis.Node) {
  globalThis.Node = class Node {
    constructor() {
      this.nodeType = 0;
      this.nodeName = "";
      this.nodeValue = null;
      this.textContent = "";
      this.ownerDocument = null;
      this.parentNode = null;
      this.childNodes = [];
      this.firstChild = null;
      this.lastChild = null;
      this.previousSibling = null;
      this.nextSibling = null;
      this.isConnected = false;
    }

    appendChild(child) {
      this.childNodes.push(child);
      child.parentNode = this;
      return child;
    }

    removeChild(child) {
      const index = this.childNodes.indexOf(child);
      if (index > -1) {
        this.childNodes.splice(index, 1);
        child.parentNode = null;
      }
      return child;
    }

    insertBefore(newChild, referenceChild) {
      const index = this.childNodes.indexOf(referenceChild);
      if (index > -1) {
        this.childNodes.splice(index, 0, newChild);
        newChild.parentNode = this;
      }
      return newChild;
    }

    replaceChild(newChild, oldChild) {
      const index = this.childNodes.indexOf(oldChild);
      if (index > -1) {
        this.childNodes[index] = newChild;
        newChild.parentNode = this;
        oldChild.parentNode = null;
      }
      return oldChild;
    }

    cloneNode(deep = false) {
      const clone = new this.constructor();
      if (deep) {
        clone.childNodes = this.childNodes.map((child) =>
          child.cloneNode(true)
        );
      }
      return clone;
    }

    contains(node) {
      return this.childNodes.includes(node);
    }

    hasChildNodes() {
      return this.childNodes.length > 0;
    }
  };
}

if (!globalThis.Element) {
  globalThis.Element = class Element extends Node {
    constructor() {
      super();
      this.nodeType = 1; // ELEMENT_NODE
      this.tagName = "";
      this.attributes = [];
      this.style = {};
      this.className = "";
      this.id = "";
      this.innerHTML = "";
      this.outerHTML = "";
      this.scrollTop = 0;
      this.scrollLeft = 0;
      this.scrollWidth = 0;
      this.scrollHeight = 0;
      this.clientWidth = 0;
      this.clientHeight = 0;
      this.offsetWidth = 0;
      this.offsetHeight = 0;
      this.offsetTop = 0;
      this.offsetLeft = 0;
    }

    getBoundingClientRect() {
      return {
        top: 0,
        left: 0,
        bottom: 0,
        right: 0,
        width: 0,
        height: 0,
        x: 0,
        y: 0,
      };
    }

    focus() {}
    blur() {}
    click() {}

    setAttribute(name, value) {
      this[name] = value;
      // Handle aria attributes specially
      if (name.startsWith("aria-")) {
        const ariaProp = name
          .replace("aria-", "")
          .replace(/-([a-z])/g, (match, letter) => letter.toUpperCase());
        this[ariaProp] = value;
      }
    }

    getAttribute(name) {
      return this[name] || null;
    }

    removeAttribute(name) {
      delete this[name];
    }

    hasAttribute(name) {
      return Object.prototype.hasOwnProperty.call(this, name);
    }

    querySelector(_selector) {
      return null;
    }

    querySelectorAll(_selector) {
      return [];
    }

    getElementsByTagName(_tagName) {
      return [];
    }

    getElementsByClassName(_className) {
      return [];
    }

    addEventListener(_type, _listener, _options) {}
    removeEventListener(_type, _listener, _options) {}
    dispatchEvent(_event) {
      return true;
    }
  };
}

// Enhanced HTMLElement mock with proper prototype inheritance
if (!globalThis.HTMLElement) {
  globalThis.HTMLElement = class HTMLElement extends Element {
    constructor() {
      super();
      this.nodeType = 1; // ELEMENT_NODE
      this.title = "";
      this.lang = "";
      this.dir = "";
      this.hidden = false;
      this.tabIndex = -1;
      this.contentEditable = "inherit";
      this.namespaceURI = "http://www.w3.org/1999/xhtml";
      this.dataset = {};
      this.role = null;
      this.ariaLabel = null;
      this.ariaLabelledBy = null;
      this.ariaDescribedBy = null;
      this.ariaExpanded = null;
      this.ariaChecked = null;
      this.ariaSelected = null;

      // React-specific properties
      this._reactInternalInstance = null;
      this._reactInternals = null;
    }

    toString() {
      return `[object ${this.constructor.name}]`;
    }
  };
}

// Create specific HTML element classes that React Testing Library expects
if (!globalThis.HTMLInputElement) {
  globalThis.HTMLInputElement = class HTMLInputElement extends HTMLElement {
    constructor() {
      super();
      this.type = "text";
      this.value = "";
      this.defaultValue = "";
      this.checked = false;
      this.defaultChecked = false;
      this.disabled = false;
      this.readOnly = false;
      this.required = false;
      this.placeholder = "";
      this.name = "";
      this.autocomplete = "";
      this.pattern = "";
      this.minLength = -1;
      this.maxLength = -1;
      this.min = "";
      this.max = "";
      this.step = "";
      this.multiple = false;
      this.files = null;
      this.selectionStart = 0;
      this.selectionEnd = 0;
      this.selectionDirection = "none";
    }
  };
}

if (!globalThis.HTMLButtonElement) {
  globalThis.HTMLButtonElement = class HTMLButtonElement extends HTMLElement {
    constructor() {
      super();
      this.type = "submit";
      this.disabled = false;
      this.form = null;
      this.formAction = "";
      this.formEnctype = "";
      this.formMethod = "";
      this.formNoValidate = false;
      this.formTarget = "";
      this.name = "";
      this.value = "";
    }
  };
}

if (!globalThis.HTMLLabelElement) {
  globalThis.HTMLLabelElement = class HTMLLabelElement extends HTMLElement {
    constructor() {
      super();
      this.htmlFor = "";
      this.form = null;
    }
  };
}

if (!globalThis.HTMLDivElement) {
  globalThis.HTMLDivElement = class HTMLDivElement extends HTMLElement {
    constructor() {
      super();
    }
  };
}

if (!globalThis.HTMLFormElement) {
  globalThis.HTMLFormElement = class HTMLFormElement extends HTMLElement {
    constructor() {
      super();
      this.action = "";
      this.method = "get";
      this.enctype = "application/x-www-form-urlencoded";
      this.noValidate = false;
      this.target = "";
      this.elements = [];
      this.submit = vi.fn();
      this.reset = vi.fn();
    }
  };
}

if (!globalThis.HTMLAnchorElement) {
  globalThis.HTMLAnchorElement = class HTMLAnchorElement extends HTMLElement {
    constructor() {
      super();
      this.href = "";
      this.target = "";
      this.rel = "";
      this.download = "";
      this.hreflang = "";
      this.type = "";
    }
  };
}

if (!globalThis.HTMLSpanElement) {
  globalThis.HTMLSpanElement = class HTMLSpanElement extends HTMLElement {
    constructor() {
      super();
    }
  };
}

if (!globalThis.HTMLParagraphElement) {
  globalThis.HTMLParagraphElement = class HTMLParagraphElement extends (
    HTMLElement
  ) {
    constructor() {
      super();
    }
  };
}

if (!globalThis.HTMLHeadingElement) {
  globalThis.HTMLHeadingElement = class HTMLHeadingElement extends HTMLElement {
    constructor() {
      super();
    }
  };
}

// Create specific heading elements
if (!globalThis.HTMLHeading1Element) {
  globalThis.HTMLHeading1Element = class HTMLHeading1Element extends (
    HTMLHeadingElement
  ) {};
}
if (!globalThis.HTMLHeading2Element) {
  globalThis.HTMLHeading2Element = class HTMLHeading2Element extends (
    HTMLHeadingElement
  ) {};
}
if (!globalThis.HTMLHeading3Element) {
  globalThis.HTMLHeading3Element = class HTMLHeading3Element extends (
    HTMLHeadingElement
  ) {};
}
if (!globalThis.HTMLHeading4Element) {
  globalThis.HTMLHeading4Element = class HTMLHeading4Element extends (
    HTMLHeadingElement
  ) {};
}
if (!globalThis.HTMLHeading5Element) {
  globalThis.HTMLHeading5Element = class HTMLHeading5Element extends (
    HTMLHeadingElement
  ) {};
}
if (!globalThis.HTMLHeading6Element) {
  globalThis.HTMLHeading6Element = class HTMLHeading6Element extends (
    HTMLHeadingElement
  ) {};
}

// Set up global properties to point to window properties
if (typeof globalThis.location === "undefined") {
  Object.defineProperty(globalThis, "location", {
    value: globalThis.window?.location || {
      href: "http://localhost:3000",
      origin: "http://localhost:3000",
      protocol: "http:",
      host: "localhost:3000",
      hostname: "localhost",
      port: "3000",
      pathname: "/",
      search: "",
      hash: "",
    },
    writable: true,
  });
}

if (typeof globalThis.navigator === "undefined") {
  Object.defineProperty(globalThis, "navigator", {
    value: globalThis.window?.navigator || {
      userAgent: "jsdom",
      platform: "Node.js",
      language: "en-US",
      languages: ["en-US"],
      cookieEnabled: true,
      onLine: true,
    },
    writable: true,
  });
}

if (typeof globalThis.screen === "undefined") {
  Object.defineProperty(globalThis, "screen", {
    value: globalThis.window?.screen || {
      width: 1920,
      height: 1080,
      availWidth: 1920,
      availHeight: 1080,
      colorDepth: 24,
      pixelDepth: 24,
    },
    writable: true,
  });
}

if (typeof globalThis.performance === "undefined") {
  Object.defineProperty(globalThis, "performance", {
    value: globalThis.window?.performance,
    writable: true,
  });
}

if (typeof globalThis.history === "undefined") {
  Object.defineProperty(globalThis, "history", {
    value: globalThis.window?.history,
    writable: true,
  });
}

// Ensure document is available globally
if (typeof globalThis.document === "undefined") {
  Object.defineProperty(globalThis, "document", {
    value: globalThis.window?.document,
    writable: true,
  });
}

// Mock matchMedia
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

// Mock IntersectionObserver
globalThis.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock ResizeObserver
globalThis.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock URL constructor
globalThis.URL = class URL {
  constructor(url, base) {
    this.href = url;
    this.origin = base || "http://localhost:3000";
    this.protocol = "http:";
    this.host = "localhost:3000";
    this.hostname = "localhost";
    this.port = "3000";
    this.pathname = url.replace(this.origin, "");
    this.search = "";
    this.hash = "";
  }

  toString() {
    return this.href;
  }
};

// Mock TextEncoder and TextDecoder
globalThis.TextEncoder = class TextEncoder {
  encode(str) {
    return new Uint8Array(str.split("").map((char) => char.charCodeAt(0)));
  }
};

globalThis.TextDecoder = class TextDecoder {
  decode(arr) {
    return String.fromCharCode(...arr);
  }
};

// Mock fetch for API calls (axios compatible)
globalThis.fetch = vi.fn((url, _options) => {
  return Promise.resolve({
    ok: true,
    status: 200,
    statusText: "OK",
    json: () => Promise.resolve({ success: true }),
    text: () => Promise.resolve('{"success": true}'),
    headers: {
      "content-type": "application/json",
      get: (name) => {
        if (name.toLowerCase() === "content-type") return "application/json";
        return null;
      },
      has: (name) => name.toLowerCase() === "content-type",
    },
    url: url,
    redirected: false,
    type: "basic",
    bodyUsed: false,
    arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
    blob: () => Promise.resolve(new Blob()),
    formData: () => Promise.resolve(new FormData()),
    clone: () => ({
      /* mock clone */
    }),
  });
});

// Mock console methods to reduce test noise
globalThis.console = {
  ...console,
  warn: vi.fn(),
  error: vi.fn(),
  log: vi.fn(),
  info: vi.fn(),
  debug: vi.fn(),
};

// Set up document properties after all element classes are defined
if (!globalThis.document?.createElement) {
  globalThis.document = globalThis.document || {};
  globalThis.document.createElement = function (tagName) {
    let element;

    // Create the appropriate element type based on tag name
    const tag = tagName.toLowerCase();
    switch (tag) {
      case "input":
        element = new HTMLInputElement();
        break;
      case "button":
        element = new HTMLButtonElement();
        break;
      case "label":
        element = new HTMLLabelElement();
        break;
      case "div":
        element = new HTMLDivElement();
        break;
      case "form":
        element = new HTMLFormElement();
        break;
      case "a":
        element = new HTMLAnchorElement();
        break;
      case "span":
        element = new HTMLSpanElement();
        break;
      case "p":
        element = new HTMLParagraphElement();
        break;
      case "h1":
        element = new HTMLHeading1Element();
        break;
      case "h2":
        element = new HTMLHeading2Element();
        break;
      case "h3":
        element = new HTMLHeading3Element();
        break;
      case "h4":
        element = new HTMLHeading4Element();
        break;
      case "h5":
        element = new HTMLHeading5Element();
        break;
      case "h6":
        element = new HTMLHeading6Element();
        break;
      default:
        element = new HTMLElement();
        break;
    }

    // Add common properties
    element.tagName = tagName.toUpperCase();
    element.nodeName = tagName.toUpperCase();
    element.nodeType = 1; // ELEMENT_NODE
    element.ownerDocument = globalThis.document;
    element.childNodes = [];
    element.children = [];
    element.parentNode = null;

    // Add React-specific properties
    element._reactInternalInstance = null;
    element._reactInternals = null;

    // Add accessibility properties
    element.role = null;
    element.ariaLabel = null;
    element.ariaLabelledBy = null;
    element.ariaDescribedBy = null;
    element.ariaExpanded = null;
    element.ariaChecked = null;
    element.ariaSelected = null;

    // Add event handling
    element.addEventListener = vi.fn();
    element.removeEventListener = vi.fn();
    element.dispatchEvent = vi.fn();

    // Add DOM methods
    element.appendChild = vi.fn((child) => {
      element.childNodes.push(child);
      element.children.push(child);
      child.parentNode = element;
      return child;
    });

    element.removeChild = vi.fn((child) => {
      const index = element.childNodes.indexOf(child);
      if (index > -1) {
        element.childNodes.splice(index, 1);
        element.children.splice(index, 1);
        child.parentNode = null;
      }
      return child;
    });

    element.insertBefore = vi.fn();
    element.replaceChild = vi.fn();
    element.cloneNode = vi.fn(() => {
      const clone = new element.constructor();
      Object.setPrototypeOf(clone, element.constructor.prototype);
      return clone;
    });
    element.contains = vi.fn(() => false);
    element.hasChildNodes = vi.fn(() => element.childNodes.length > 0);

    // Add attributes handling
    element.setAttribute = vi.fn((name, value) => {
      element[name] = value;
      // Handle aria attributes specially
      if (name.startsWith("aria-")) {
        const ariaProp = name
          .replace("aria-", "")
          .replace(/-([a-z])/g, (match, letter) => letter.toUpperCase());
        element[ariaProp] = value;
      }
    });

    element.getAttribute = vi.fn((name) => element[name] || null);
    element.removeAttribute = vi.fn((name) => {
      delete element[name];
    });

    element.hasAttribute = vi.fn((name) =>
      Object.prototype.hasOwnProperty.call(element, name)
    );

    // Add class handling
    element.classList = {
      add: vi.fn((...classes) => {
        classes.forEach((cls) => {
          if (!element.className.includes(cls)) {
            element.className += (element.className ? " " : "") + cls;
          }
        });
      }),
      remove: vi.fn((...classes) => {
        classes.forEach((cls) => {
          element.className = element.className
            .replace(new RegExp(`\\b${cls}\\b`, "g"), "")
            .trim();
        });
      }),
      contains: vi.fn((cls) => element.className.includes(cls)),
      toggle: vi.fn((cls) => {
        if (element.className.includes(cls)) {
          element.classList.remove(cls);
          return false;
        } else {
          element.classList.add(cls);
          return true;
        }
      }),
    };

    return element;
  };

  globalThis.document.createTextNode = vi.fn((text) => ({
    nodeType: 3, // TEXT_NODE
    textContent: text,
    ownerDocument: globalThis.document,
  }));

  globalThis.document.querySelector = vi.fn(() => null);
  globalThis.document.querySelectorAll = vi.fn(() => []);
  globalThis.document.getElementById = vi.fn(() => null);
  globalThis.document.getElementsByClassName = vi.fn(() => []);
  globalThis.document.getElementsByTagName = vi.fn(() => []);

  // Document properties
  globalThis.document.body = new HTMLElement();
  globalThis.document.head = new HTMLElement();
  globalThis.document.documentElement = new HTMLElement();
  globalThis.document.readyState = "complete";
  globalThis.document.cookie = "";
}

// Set up proper prototype chains for React Testing Library compatibility
Object.setPrototypeOf(HTMLInputElement.prototype, HTMLElement.prototype);
Object.setPrototypeOf(HTMLButtonElement.prototype, HTMLElement.prototype);
Object.setPrototypeOf(HTMLLabelElement.prototype, HTMLElement.prototype);
Object.setPrototypeOf(HTMLDivElement.prototype, HTMLElement.prototype);
Object.setPrototypeOf(HTMLFormElement.prototype, HTMLElement.prototype);
Object.setPrototypeOf(HTMLAnchorElement.prototype, HTMLElement.prototype);
Object.setPrototypeOf(HTMLSpanElement.prototype, HTMLElement.prototype);
Object.setPrototypeOf(HTMLParagraphElement.prototype, HTMLElement.prototype);
Object.setPrototypeOf(HTMLHeadingElement.prototype, HTMLElement.prototype);
Object.setPrototypeOf(
  HTMLHeading1Element.prototype,
  HTMLHeadingElement.prototype
);
Object.setPrototypeOf(
  HTMLHeading2Element.prototype,
  HTMLHeadingElement.prototype
);
Object.setPrototypeOf(
  HTMLHeading3Element.prototype,
  HTMLHeadingElement.prototype
);
Object.setPrototypeOf(
  HTMLHeading4Element.prototype,
  HTMLHeadingElement.prototype
);
Object.setPrototypeOf(
  HTMLHeading5Element.prototype,
  HTMLHeadingElement.prototype
);
Object.setPrototypeOf(
  HTMLHeading6Element.prototype,
  HTMLHeadingElement.prototype
);

// Ensure HTMLElement inherits from Element
Object.setPrototypeOf(HTMLElement.prototype, Element.prototype);

// Ensure Element inherits from Node
Object.setPrototypeOf(Element.prototype, Node.prototype);
