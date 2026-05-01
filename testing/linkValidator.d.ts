export interface LinkInfo {
  href: string | null;
  text: string | null;
  element: HTMLElement;
}

export interface RouteConfig {
  path?: string;
  children?: RouteConfig[];
  [key: string]: unknown;
}

export interface LinkValidationResult {
  brokenLinks: LinkInfo[];
  externalLinks: LinkInfo[];
  validLinks: LinkInfo[];
  hashLinks: LinkInfo[];
  totalLinks: number;
}

export function validateLinks(
  container: HTMLElement,
  routes: RouteConfig[],
): LinkValidationResult;
export function generateReport(result: LinkValidationResult): string;
