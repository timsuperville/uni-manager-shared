/**
 * React Router Link Validator
 *
 * Purpose: Validate all React Router links in a component tree
 * - Detects <Link to="..."> components
 * - Validates routes exist in router configuration
 * - Checks for broken internal links
 * - Reports missing routes
 *
 * Usage in tests:
 * ```javascript
 * import { validateLinks } from '@shared/test-utils/linkValidator';
 *
 * test('all links are valid', () => {
 *   const { container } = render(<App />);
 *   const result = validateLinks(container, routes);
 *   expect(result.brokenLinks).toHaveLength(0);
 * });
 * ```
 */

/**
 * Extract all routes from router configuration
 * @param {Array} routes - Route configuration array
 * @returns {Set<string>} Set of valid route paths
 */
export function extractRoutes(routes) {
  const paths = new Set();

  function traverse(routeArray, basePath = '') {
    routeArray.forEach(route => {
      if (route.path) {
        const fullPath = `${basePath}${route.path}`.replace(/\/+/g, '/');
        paths.add(fullPath);

        // Handle path parameters (e.g., /user/:id)
        const paramPattern = fullPath.replace(/:\w+/g, '[^/]+');
        paths.add(paramPattern);
      }

      if (route.children) {
        const childBasePath = route.path
          ? `${basePath}${route.path}`
          : basePath;
        traverse(route.children, childBasePath);
      }
    });
  }

  traverse(routes);
  return paths;
}

/**
 * Validate a path against known routes
 * @param {string} path - Path to validate
 * @param {Set<string>} validRoutes - Set of valid route paths
 * @returns {boolean} True if path is valid
 */
export function isValidPath(path, validRoutes) {
  // Exact match
  if (validRoutes.has(path)) {
    return true;
  }

  // Check against patterns (for parameterized routes)
  for (const route of validRoutes) {
    if (route.includes('[^/]+')) {
      const pattern = new RegExp(`^${route}$`);
      if (pattern.test(path)) {
        return true;
      }
    }
  }

  // External links are valid
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return true;
  }

  // Hash links are valid
  if (path.startsWith('#')) {
    return true;
  }

  return false;
}

/**
 * Find all Link components in rendered output
 * @param {HTMLElement} container - Rendered component container
 * @returns {Array} Array of link objects {href, text, element}
 */
export function findLinks(container) {
  const links = [];
  const anchorElements = container.querySelectorAll('a[href]');

  anchorElements.forEach(element => {
    links.push({
      href: element.getAttribute('href'),
      text: element.textContent,
      element
    });
  });

  return links;
}

/**
 * Validate all links in a component
 * @param {HTMLElement} container - Rendered component container
 * @param {Array} routes - Route configuration
 * @returns {Object} Validation result with broken and valid links
 */
export function validateLinks(container, routes) {
  const validRoutes = extractRoutes(routes);
  const links = findLinks(container);

  const result = {
    totalLinks: links.length,
    validLinks: [],
    brokenLinks: [],
    externalLinks: [],
    hashLinks: []
  };

  links.forEach(link => {
    const { href, text, element } = link;

    // Skip empty hrefs
    if (!href || href === '#') {
      result.hashLinks.push({ href, text, element });
      return;
    }

    // Categorize external links
    if (href.startsWith('http://') || href.startsWith('https://')) {
      result.externalLinks.push({ href, text, element });
      return;
    }

    // Validate internal links
    if (isValidPath(href, validRoutes)) {
      result.validLinks.push({ href, text, element });
    } else {
      result.brokenLinks.push({ href, text, element });
    }
  });

  return result;
}

/**
 * Generate a report of link validation results
 * @param {Object} validationResult - Result from validateLinks
 * @returns {string} Formatted report
 */
export function generateReport(validationResult) {
  const { totalLinks, validLinks, brokenLinks, externalLinks, hashLinks } =
    validationResult;

  let report = '=== Link Validation Report ===\n\n';
  report += `Total Links: ${totalLinks}\n`;
  report += `✅ Valid Links: ${validLinks.length}\n`;
  report += `❌ Broken Links: ${brokenLinks.length}\n`;
  report += `🌐 External Links: ${externalLinks.length}\n`;
  report += `🔗 Hash Links: ${hashLinks.length}\n\n`;

  if (brokenLinks.length > 0) {
    report += '=== Broken Links ===\n';
    brokenLinks.forEach(({ href, text }) => {
      report += `❌ ${href} (Text: "${text}")\n`;
    });
    report += '\n';
  }

  if (externalLinks.length > 0) {
    report += '=== External Links (Manual Verification Recommended) ===\n';
    externalLinks.forEach(({ href, text }) => {
      report += `🌐 ${href} (Text: "${text}")\n`;
    });
  }

  return report;
}

/**
 * Vitest matcher for link validation
 * @param {HTMLElement} container - Rendered component
 * @param {Array} routes - Route configuration
 * @returns {Object} Matcher result
 */
export function toHaveValidLinks(container, routes) {
  const result = validateLinks(container, routes);
  const pass = result.brokenLinks.length === 0;

  const message = pass
    ? () =>
        `Expected to have broken links, but all ${result.totalLinks} links are valid`
    : () => {
        const report = generateReport(result);
        return `Expected all links to be valid, but found ${result.brokenLinks.length} broken links:\n\n${report}`;
      };

  return {
    pass,
    message
  };
}

// Export for use in vitest setup
export default {
  extractRoutes,
  isValidPath,
  findLinks,
  validateLinks,
  generateReport,
  toHaveValidLinks
};
